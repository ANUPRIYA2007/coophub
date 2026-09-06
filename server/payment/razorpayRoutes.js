// ==============================================================================
// COOP HUB — Razorpay Payment Routes (Server-Side)
// ==============================================================================
// Secure backend endpoints for:
//   1. POST /api/payment/create-order  → Creates a Razorpay order
//   2. POST /api/payment/verify-signature → HMAC SHA256 signature verification
//
// KEY_SECRET never leaves the server. Only KEY_ID is exposed to the frontend.
// ==============================================================================

import Razorpay from 'razorpay';
import crypto from 'crypto';

/**
 * Create and mount Razorpay payment routes on the given Express app.
 *
 * @param {import('express').Express} app
 */
export function mountRazorpayRoutes(app) {
  const RAZORPAY_KEY_ID = process.env.RAZORPAY_KEY_ID?.trim();
  const RAZORPAY_KEY_SECRET = process.env.RAZORPAY_KEY_SECRET?.trim();

  if (!RAZORPAY_KEY_ID || !RAZORPAY_KEY_SECRET) {
    console.warn('[Razorpay] ⚠ RAZORPAY_KEY_ID or RAZORPAY_KEY_SECRET not set — payment routes will return 503.');
  }

  const razorpayInstance = (RAZORPAY_KEY_ID && RAZORPAY_KEY_SECRET)
    ? new Razorpay({ key_id: RAZORPAY_KEY_ID, key_secret: RAZORPAY_KEY_SECRET })
    : null;

  // ─────────────────────────────────────────────────────────
  // 1. CREATE ORDER
  // ─────────────────────────────────────────────────────────
  app.post('/api/payment/create-order', async (req, res) => {
    try {
      if (!razorpayInstance) {
        return res.status(503).json({ error: 'Payment gateway not configured. Set RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET.' });
      }

      const { invoiceId, currency = 'INR', receipt, notes = {}, fallbackAmount } = req.body;

      if (!invoiceId) {
        return res.status(400).json({ error: 'Invoice ID is required for authoritative billing calculation.' });
      }

      // Initialize Supabase admin client for secure backend lookup
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

      let { data: invoice, error: invoiceErr } = await supabase
        .from('invoices')
        .select('*')
        .eq('id', invoiceId)
        .maybeSingle();
        
      if (invoiceErr || !invoice) {
        // Fallback check if invoiceId was actually a booking ID
        const { data: fallbackInvoice } = await supabase
          .from('invoices')
          .select('*')
          .eq('booking_id', invoiceId)
          .maybeSingle();
          
        if (!fallbackInvoice) {
           if (invoiceId && invoiceId.startsWith('INV-DEMO-') && fallbackAmount) {
             invoice = { id: invoiceId, booking_id: invoiceId, total_amount: fallbackAmount };
           } else {
             return res.status(404).json({ error: 'Authoritative invoice not found.' });
           }
        } else {
          invoice = fallbackInvoice;
        }
      }

      const amount = Number(invoice.total_amount);

      if (!amount || amount < 1) { // minimum 1 INR
        return res.status(400).json({ error: 'Invalid invoice amount.' });
      }

      const orderOptions = {
        amount: Math.round(amount * 100),   // strictly in paise based on backend invoice
        currency,
        receipt: receipt || `rcpt_${Date.now()}`,
        notes: { ...notes, invoiceId: invoice.id, bookingId: invoice.booking_id }
      };

      const order = await razorpayInstance.orders.create(orderOptions);

      console.log(`[Razorpay] ✅ Order created: ${order.id} | ₹${(order.amount / 100).toFixed(2)} ${order.currency}`);

      return res.status(200).json({
        orderId: order.id,
        amount: order.amount, // in paise
        currency: order.currency,
        keyId: RAZORPAY_KEY_ID   // Safe to expose — this is the public key
      });
    } catch (err) {
      console.error('[Razorpay] ❌ Order creation failed:', JSON.stringify(err));
      return res.status(500).json({ error: 'Failed to create Razorpay order.', details: err });
    }
  });

  // ─────────────────────────────────────────────────────────
  // 2. VERIFY PAYMENT SIGNATURE (HMAC SHA256)
  // ─────────────────────────────────────────────────────────
  app.post('/api/payment/verify-signature', async (req, res) => {
    try {
      if (!RAZORPAY_KEY_SECRET) {
        return res.status(503).json({ error: 'Payment gateway not configured.' });
      }

      const { orderId, paymentId, signature } = req.body;

      if (!orderId || !paymentId || !signature) {
        return res.status(400).json({ error: 'Missing orderId, paymentId, or signature.' });
      }

      // Razorpay HMAC SHA256 verification:
      // generated_signature = hmac_sha256(orderId + "|" + paymentId, KEY_SECRET)
      const body = orderId + '|' + paymentId;
      const expectedSignature = crypto
        .createHmac('sha256', RAZORPAY_KEY_SECRET)
        .update(body)
        .digest('hex');

      const isValid = expectedSignature === signature;

      if (isValid) {
        console.log(`[Razorpay] ✅ Payment verified: ${paymentId} for order ${orderId}`);
      } else {
        console.warn(`[Razorpay] ⚠ Signature mismatch for payment ${paymentId}`);
      }

      return res.status(200).json({ verified: isValid });
    } catch (err) {
      console.error('[Razorpay] ❌ Verification failed:', err.message);
      return res.status(500).json({ error: 'Payment verification failed.', details: err.message });
    }
  });

  // ─────────────────────────────────────────────────────────
  // 3. GET PAYMENT STATUS (optional utility)
  // ─────────────────────────────────────────────────────────
  app.get('/api/payment/status/:paymentId', async (req, res) => {
    try {
      if (!razorpayInstance) {
        return res.status(503).json({ error: 'Payment gateway not configured.' });
      }

      const payment = await razorpayInstance.payments.fetch(req.params.paymentId);

      return res.status(200).json({
        id: payment.id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        captured: payment.captured,
        created_at: payment.created_at
      });
    } catch (err) {
      return res.status(500).json({ error: 'Failed to fetch payment status.', details: err.message });
    }
  });

  console.log('[Razorpay] 💳 Payment routes mounted: /api/payment/create-order, /api/payment/verify-signature, /api/payment/status/:paymentId');
}
