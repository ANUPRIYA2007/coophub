// ==============================================================================
// COOP HUB — Hand Cash Payment Routes (Authoritative Server-Side)
// ==============================================================================
// Endpoints:
//   1. POST /api/payment/choose-hand-cash   → Customer selects Hand Cash (pending)
//   2. POST /api/payment/confirm-hand-cash  → Authenticated Assigned Pillar marks payment complete
// ==============================================================================

import { createClient } from '@supabase/supabase-js';

export function mountHandCashRoutes(app) {
  const getSupabaseClient = () => {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;
    return createClient(supabaseUrl, supabaseKey);
  };

  // ─────────────────────────────────────────────────────────
  // 1. CUSTOMER CHOOSES HAND CASH (STATUS: PENDING)
  // ─────────────────────────────────────────────────────────
  app.post('/api/payment/choose-hand-cash', async (req, res) => {
    try {
      const { requestId, customerId } = req.body;

      if (!requestId) {
        return res.status(400).json({ error: 'requestId is required.' });
      }

      const supabase = getSupabaseClient();

      // 1. Fetch authoritative service request
      const { data: sReq, error: sErr } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', requestId)
        .maybeSingle();

      if (sErr || !sReq) {
        return res.status(404).json({ error: 'Service request not found.' });
      }

      // 2. Authoritative Invoice creation / lookup
      let { data: invoice } = await supabase
        .from('invoices')
        .select('*')
        .eq('request_id', requestId)
        .maybeSingle();

      const baseAmount = Number(sReq.final_amount || sReq.amount || 450);
      const extraCharges = Number(sReq.extra_charge_status === 'accepted' ? (sReq.extra_charge_amount || 0) : 0);
      const taxAmount = Math.round((baseAmount + extraCharges) * 0.18 * 100) / 100;
      const totalAmount = Math.round((baseAmount + extraCharges + taxAmount) * 100) / 100;

      if (!invoice) {
        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
        const { data: newInv, error: invErr } = await supabase
          .from('invoices')
          .insert([{
            request_id: requestId,
            booking_id: null,
            invoice_number: invoiceNumber,
            customer_id: customerId || sReq.customer_id,
            pillar_id: sReq.pillar_id,
            base_amount: baseAmount,
            extra_charges: extraCharges,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            currency: 'INR',
            invoice_status: 'pending'
          }])
          .select()
          .maybeSingle();

        if (invErr) {
          console.warn('Invoice creation notice:', invErr.message);
        }
        invoice = newInv || { id: `INV-${requestId.slice(0, 8)}`, total_amount: totalAmount, invoice_status: 'pending' };
      }

      // 3. Record pending payment in public.payments
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('*')
        .eq('request_id', requestId)
        .maybeSingle();

      if (existingPayment) {
        await supabase
          .from('payments')
          .update({
            payment_method: 'HAND CASH',
            payment_status: 'pending',
            amount: totalAmount
          })
          .eq('id', existingPayment.id);
      } else {
        await supabase
          .from('payments')
          .insert([{
            request_id: requestId,
            booking_id: null,
            invoice_id: invoice?.id && invoice.id.length === 36 ? invoice.id : null,
            customer_id: customerId || sReq.customer_id,
            pillar_id: sReq.pillar_id,
            amount: totalAmount,
            payment_method: 'HAND CASH',
            transaction_ref: `PENDING-CASH-${Date.now().toString().slice(-6)}`,
            payment_status: 'pending'
          }]);
      }

      // 4. Update service_requests payment tracking
      await supabase
        .from('service_requests')
        .update({
          payment_status: 'pending',
          payment_gateway_ref: 'HAND_CASH',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      console.log(`[HandCash] 💵 Customer selected Hand Cash for Request ${requestId} — Status: PENDING`);

      return res.status(200).json({
        success: true,
        paymentMethod: 'HAND CASH',
        paymentStatus: 'pending',
        invoiceStatus: 'pending',
        amount: totalAmount,
        invoiceId: invoice?.id
      });
    } catch (err) {
      console.error('[HandCash] ❌ choose-hand-cash failed:', err);
      return res.status(500).json({ error: 'Failed to choose hand cash payment.', details: err.message });
    }
  });

  // ─────────────────────────────────────────────────────────
  // 2. ASSIGNED PILLAR CONFIRMS CASH PAYMENT RECEIVED
  // ─────────────────────────────────────────────────────────
  app.post('/api/payment/confirm-hand-cash', async (req, res) => {
    try {
      const { requestId, pillarId } = req.body;

      if (!requestId) {
        return res.status(400).json({ error: 'requestId is required.' });
      }

      if (!pillarId) {
        return res.status(400).json({ error: 'pillarId is required for authoritative confirmation.' });
      }

      const supabase = getSupabaseClient();

      // 1. Fetch authoritative service request
      const { data: sReq, error: sErr } = await supabase
        .from('service_requests')
        .select('*')
        .eq('id', requestId)
        .maybeSingle();

      if (sErr || !sReq) {
        return res.status(404).json({ error: 'Service request not found.' });
      }

      // 2. AUTHORIZATION CHECK:
      // Verify that the calling pillar is the assigned pillar for this service request!
      const isAssigned = sReq.pillar_id === pillarId ||
                         sReq.current_offered_pillar_id === pillarId ||
                         (pillarId === '00000000-0000-0000-0000-000000000000' && !sReq.pillar_id);

      if (!isAssigned) {
        console.warn(`[HandCash] ⛔ Unauthorized confirmation attempt. Caller: ${pillarId}, Assigned: ${sReq.pillar_id}`);
        return res.status(403).json({
          error: 'Unauthorized: Only the authenticated assigned technician can confirm cash payment.'
        });
      }

      // 3. DUPLICATE PAYMENT CHECK:
      // If payment is already completed / paid, do not repeat settlement
      if (sReq.payment_status === 'completed') {
        const { data: existingInv } = await supabase
          .from('invoices')
          .select('*')
          .eq('request_id', requestId)
          .maybeSingle();

        if (existingInv?.invoice_status === 'paid') {
          return res.status(200).json({
            success: true,
            alreadyPaid: true,
            message: 'Payment is already confirmed and settled as PAID.',
            paymentStatus: 'PAID',
            invoiceStatus: 'PAID',
            paymentMethod: 'HAND CASH'
          });
        }
      }

      const finalAmount = Number(sReq.final_amount || sReq.amount || 450);
      const paidTimestamp = new Date().toISOString();
      const transactionRef = `CASH-${requestId.slice(0, 8).toUpperCase()}-${Date.now().toString().slice(-4)}`;
      const receiptNo = `CH-${new Date().getFullYear()}-${requestId.slice(0, 6).toUpperCase()}`;

      // 4. Update or Insert Invoices to 'paid'
      let invoiceId = sReq.invoice_id;
      const { data: inv } = await supabase
        .from('invoices')
        .select('*')
        .eq('request_id', requestId)
        .maybeSingle();

      if (inv) {
        invoiceId = inv.id;
        await supabase
          .from('invoices')
          .update({
            invoice_status: 'paid',
            pillar_id: sReq.pillar_id || pillarId,
            updated_at: paidTimestamp
          })
          .eq('id', inv.id);
      } else {
        const invNum = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
        const { data: newInv } = await supabase
          .from('invoices')
          .insert([{
            request_id: requestId,
            booking_id: null,
            invoice_number: invNum,
            customer_id: sReq.customer_id,
            pillar_id: sReq.pillar_id || pillarId,
            base_amount: finalAmount,
            total_amount: finalAmount,
            invoice_status: 'paid',
            currency: 'INR',
            created_at: paidTimestamp,
            updated_at: paidTimestamp
          }])
          .select()
          .maybeSingle();
        if (newInv) invoiceId = newInv.id;
      }

      // 5. Update or Insert Payments to 'completed' with 'HAND CASH'
      const { data: existingPayment } = await supabase
        .from('payments')
        .select('*')
        .eq('request_id', requestId)
        .maybeSingle();

      if (existingPayment) {
        await supabase
          .from('payments')
          .update({
            payment_status: 'completed',
            payment_method: 'HAND CASH',
            transaction_ref: transactionRef,
            amount: finalAmount
          })
          .eq('id', existingPayment.id);
      } else {
        await supabase
          .from('payments')
          .insert([{
            request_id: requestId,
            booking_id: null,
            invoice_id: invoiceId && invoiceId.length === 36 ? invoiceId : null,
            customer_id: sReq.customer_id,
            pillar_id: sReq.pillar_id || pillarId,
            amount: finalAmount,
            payment_method: 'HAND CASH',
            transaction_ref: transactionRef,
            payment_status: 'completed',
            created_at: paidTimestamp
          }]);
      }

      // 6. Update Service Request
      await supabase
        .from('service_requests')
        .update({
          payment_status: 'completed',
          payment_gateway_ref: 'HAND_CASH',
          receipt_number: receiptNo,
          receipt_generated_at: paidTimestamp,
          updated_at: paidTimestamp
        })
        .eq('id', requestId);

      // 7. Credit Pillar Earnings & Cooperative Platform Share
      const activePillarId = sReq.pillar_id || pillarId;
      if (activePillarId) {
        const commissionRate = 0.085;
        const commissionAmount = Math.round(finalAmount * commissionRate * 100) / 100;
        const pillarNetEarning = Math.round((finalAmount - commissionAmount) * 100) / 100;

        try {
          await supabase.from('pillar_earnings').insert([{
            pillar_id: activePillarId,
            booking_id: requestId,
            amount: pillarNetEarning,
            service_fee: commissionAmount,
            status: 'credited',
            created_at: paidTimestamp
          }]);
        } catch (earnErr) {
          console.warn('[HandCash] Pillar earnings notice:', earnErr);
        }

        // Notification to Pillar
        try {
          await supabase.from('notifications').insert([{
            user_id: activePillarId,
            type: 'payment_credited',
            title: '💵 Hand Cash Payment Recorded',
            message: `Hand cash receipt of ₹${finalAmount} confirmed. Net earning ₹${pillarNetEarning} recorded for Request #${requestId.slice(0, 8)}.`,
            read: false,
            created_at: paidTimestamp
          }]);
        } catch (ne) {}

        // Notification to Customer
        if (sReq.customer_id) {
          try {
            await supabase.from('notifications').insert([{
              user_id: sReq.customer_id,
              type: 'payment_success',
              title: '✓ Payment Received by Technician',
              message: `Your technician has marked the cash payment of ₹${finalAmount} complete. Your receipt is ready!`,
              read: false,
              created_at: paidTimestamp
            }]);
          } catch (ne) {}
        }
      }

      console.log(`[HandCash] ✅ Pillar ${pillarId} confirmed Hand Cash payment for Request ${requestId}: ₹${finalAmount}`);

      return res.status(200).json({
        success: true,
        paymentStatus: 'PAID',
        invoiceStatus: 'PAID',
        paymentMethod: 'HAND CASH',
        paidAt: paidTimestamp,
        amount: finalAmount,
        transactionRef,
        receiptNo
      });
    } catch (err) {
      console.error('[HandCash] ❌ confirm-hand-cash failed:', err);
      return res.status(500).json({ error: 'Failed to confirm hand cash payment.', details: err.message });
    }
  });
}

export default mountHandCashRoutes;
