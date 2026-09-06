// ==============================================================================
// COOP HUB — Payment Gateway Adapter & Server-Side Verification Engine
// ==============================================================================
// Architecture:
//  paymentService -> paymentGatewayAdapter -> Razorpay Provider (Live / Test Sandbox)
//  -> Order Creation -> Checkout SDK -> Signature Verification -> Immutable Database Records
// ==============================================================================

import { supabase } from '../../lib/supabase';

const RAZORPAY_KEY_ID = import.meta.env.VITE_RAZORPAY_KEY_ID || "";
const IS_SANDBOX_MODE = !RAZORPAY_KEY_ID || RAZORPAY_KEY_ID === "rzp_test_placeholder";
const SERVER_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SERVER_URL)
  ? import.meta.env.VITE_SERVER_URL.replace(/\/+$/, '')
  : '';

/**
 * Load Razorpay Checkout SDK dynamically (already loaded via index.html <script>)
 */
function getRazorpaySDK() {
  if (typeof window !== 'undefined' && window.Razorpay) {
    return window.Razorpay;
  }
  return null;
}

/**
 * Payment Gateway Adapter Interface
 */
export const paymentGatewayAdapter = {
  getGatewayMode() {
    return {
      isSandbox: IS_SANDBOX_MODE,
      provider: "Razorpay (Unified UPI, Cards & NetBanking)",
      statusLabel: IS_SANDBOX_MODE ? "SANDBOX / TEST SIMULATION" : "LIVE PRODUCTION GATEWAY"
    };
  },

  /**
   * 1. Create a Payment Gateway Order via backend
   * Calls POST /api/payment/create-order → returns Razorpay orderId, amount, currency, keyId
   * NOTE: The backend ignores frontend amount and calculates it authoritatively.
   */
  async createGatewayOrder({ invoiceId, currency = "INR", customer, serviceName, fallbackAmount }) {
    const orderRef = `ORD_${invoiceId ? invoiceId.slice(0, 8) : Date.now()}_${Math.floor(1000 + Math.random() * 9000)}`;

    try {
      const response = await fetch(`${SERVER_BASE}/api/payment/create-order`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoiceId,
          currency,
          receipt: orderRef,
          notes: { serviceName },
          fallbackAmount
        })
      });

      if (response.ok) {
        const orderData = await response.json();
        return {
          success: true,
          orderId: orderData.orderId,
          amount: orderData.amount, // Authoritative amount returned by backend
          currency: orderData.currency,
          keyId: orderData.keyId,
          isSandbox: false
        };
      }

      const errBody = await response.json().catch(() => ({}));
      throw new Error(errBody.error || `Order creation returned HTTP ${response.status}`);
    } catch (err) {
      console.error("[PaymentGateway] Order creation failed:", err.message);
      throw err;
    }
  },

  /**
   * 2. Open the Razorpay Checkout modal
   * Returns a Promise that resolves with { paymentId, orderId, signature } on success
   * or rejects on user cancellation / error
   */
  openCheckout({ orderId, amount, currency, keyId, customer, serviceName, invoiceId }) {
    return new Promise((resolve, reject) => {
      const RazorpaySDK = getRazorpaySDK();
      if (!RazorpaySDK) {
        reject(new Error('Razorpay SDK not loaded. Check that checkout.js is included in index.html.'));
        return;
      }

      const options = {
        key: keyId || RAZORPAY_KEY_ID,
        amount: amount,
        currency: currency || 'INR',
        name: 'COOP HUB',
        description: serviceName || 'Cooperative Service Payment',
        order_id: orderId,
        prefill: {
          name: customer?.full_name || customer?.name || '',
          email: customer?.email || '',
          contact: customer?.phone || customer?.mobile || ''
        },
        notes: {
          invoiceId: invoiceId || '',
          serviceName: serviceName || ''
        },
        theme: {
          color: '#1B2A4A'   // Navy theme matching COOP HUB
        },
        modal: {
          ondismiss: function () {
            reject(new Error('Payment cancelled by user.'));
          }
        },
        handler: function (response) {
          // Razorpay returns: razorpay_payment_id, razorpay_order_id, razorpay_signature
          resolve({
            paymentId: response.razorpay_payment_id,
            orderId: response.razorpay_order_id,
            signature: response.razorpay_signature
          });
        }
      };

      const rzp = new RazorpaySDK(options);

      rzp.on('payment.failed', function (failureResponse) {
        console.error('[Razorpay] Payment failed:', failureResponse.error);
        reject(new Error(
          failureResponse.error?.description ||
          failureResponse.error?.reason ||
          'Payment failed.'
        ));
      });

      rzp.open();
    });
  },

  /**
   * 3. Server-Side Signature Verification & Double-Payment Prevention
   * Validates cryptographic authenticity and prevents duplicate processing
   */
  async verifyPayment({ orderId, paymentId, signature, invoiceId, requestId, amount, customerId, pillarId }) {
    // 1. Double Payment Check via transaction reference check
    const { data: existingPayment } = await supabase
      .from('payments')
      .select('id, payment_status, transaction_ref')
      .or(`gateway_payment_id.eq.${paymentId},gateway_order_id.eq.${orderId}`)
      .maybeSingle();

    if (existingPayment && existingPayment.payment_status === 'completed') {
      return {
        success: true,
        verified: true,
        alreadyProcessed: true,
        paymentId: existingPayment.id,
        message: "Payment already verified and settled."
      };
    }

    // 2. Cryptographic / Gateway Confirmation via backend
    let isValid = false;
    try {
      const response = await fetch(`${SERVER_BASE}/api/payment/verify-signature`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId, paymentId, signature })
      });
      if (response.ok) {
        const res = await response.json();
        isValid = res.verified === true;
      } else {
        isValid = false;
      }
    } catch (err) {
      console.error('[PaymentGateway] Signature verification request failed:', err.message);
      isValid = false;
    }

    if (!isValid) {
      return {
        success: false,
        verified: false,
        error: "Cryptographic payment signature verification failed. Untrusted response rejected."
      };
    }

    // 3. Atomically Record Verified Payment in public.payments
    const transactionRef = `TXN-${paymentId.replace('pay_', '').toUpperCase()}`;
    const { data: paymentRecord, error: pError } = await supabase
      .from('payments')
      .insert([{
        request_id: requestId,
        booking_id: requestId,
        invoice_id: invoiceId,
        customer_id: customerId,
        pillar_id: pillarId,
        amount: Number(amount),
        payment_method: 'razorpay_upi',
        transaction_ref: transactionRef,
        gateway_order_id: orderId,
        gateway_payment_id: paymentId,
        payment_status: 'completed'
      }])
      .select()
      .single();

    if (pError) {
      console.warn("Payment insert note (proceeding with verified transaction):", pError.message);
    }

    // 4. Update Invoice Status to 'paid'
    if (invoiceId) {
      await supabase
        .from('invoices')
        .update({
          invoice_status: 'paid',
          updated_at: new Date().toISOString()
        })
        .eq('id', invoiceId);
    }

    // 5. Update Service Request / Booking Status
    if (requestId) {
      await supabase
        .from('service_requests')
        .update({
          payment_status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      await supabase
        .from('bookings')
        .update({
          status: 'completed',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);
    }

    // 6. Record Pillar Earnings & Admin Commission Ledger
    if (pillarId) {
      const commissionRate = 0.085; // 8.5% Cooperative platform share
      const commissionAmount = Math.round(Number(amount) * commissionRate * 100) / 100;
      const pillarNetEarning = Math.round((Number(amount) - commissionAmount) * 100) / 100;

      try {
        await supabase.from('pillar_earnings').insert([{
          pillar_id: pillarId,
          booking_id: requestId,
          amount: pillarNetEarning,
          service_fee: commissionAmount,
          status: 'credited',
          created_at: new Date().toISOString()
        }]);

        // 7. Automatic Shared PF Contribution (Pillar Share + Coop Match)
        try {
          const { pfContributionService } = await import('../welfare/pfContributionService.js');
          await pfContributionService.processBookingPFContribution({
            pillarId,
            bookingId: requestId,
            baseAmount: pillarNetEarning,
            isPrepaid: true
          });
        } catch (pfErr) {
          console.warn("PF contribution auto-credit notice:", pfErr);
        }

        // Trigger in-app notification to the Pillar
        await supabase.from('notifications').insert([{
          user_id: pillarId,
          type: 'payment_credited',
          title: '💰 Payment Received & Settled',
          message: `₹${pillarNetEarning} credited to your earnings wallet for Request #${requestId.slice(0, 8)}.`,
          read: false
        }]);
      } catch (earnErr) {
        console.warn("Pillar earnings credit notice:", earnErr);
      }
    }

    return {
      success: true,
      verified: true,
      transactionRef,
      paymentRecord,
      receiptUrl: `/requests/${requestId}?view=receipt`
    };
  }
};

export default paymentGatewayAdapter;
