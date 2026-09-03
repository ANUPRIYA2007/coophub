/**
 * COOP HUB — Refund Processing & Lifecycle Engine
 * 
 * Truthful refund tracking:
 * If an external gateway refund API (e.g. Razorpay Refund API) is not configured,
 * records a verified refund request in public.refunds and allows authorized admin processing.
 * 
 * Never fakes automated bank gateway refunds.
 */

import { supabase } from '../../lib/supabase';

export const refundService = {
  /**
   * Request or record a refund for an order/payment
   */
  async requestRefund({
    requestId,
    paymentId,
    customerId,
    reason = 'Order cancelled',
    amount,
    cancellationFee = 0
  }) {
    try {
      // 1. Verify Payment Record Exists and is Completed
      let paymentRecord = null;
      if (paymentId) {
        const { data } = await supabase
          .from('payments')
          .select('*')
          .eq('id', paymentId)
          .maybeSingle();
        paymentRecord = data;
      } else if (requestId) {
        const { data } = await supabase
          .from('payments')
          .select('*')
          .eq('request_id', requestId)
          .eq('payment_status', 'completed')
          .maybeSingle();
        paymentRecord = data;
      }

      if (!paymentRecord) {
        return { success: false, error: 'No settled payment found to refund.' };
      }

      // 2. Prevent Duplicate Refunds on the same payment
      const { data: existingRefund } = await supabase
        .from('refunds')
        .select('*')
        .eq('payment_id', paymentRecord.id)
        .in('status', ['pending', 'processed'])
        .maybeSingle();

      if (existingRefund) {
        return {
          success: false,
          alreadyExists: true,
          error: `A refund request (${existingRefund.id.slice(0, 8)}) is already registered for this payment.`
        };
      }

      // 3. Amount & Fee Validation
      const baseRefundAmount = Number(amount || paymentRecord.amount);
      if (baseRefundAmount <= 0) {
        return { success: false, error: 'Refund amount must be greater than ₹0.' };
      }
      if (baseRefundAmount > Number(paymentRecord.amount)) {
        return { 
          success: false, 
          error: `Refund amount (₹${baseRefundAmount}) cannot exceed original payment (₹${paymentRecord.amount}).` 
        };
      }

      const fee = Number(cancellationFee || 0);
      const netRefundAmount = Math.max(0, Math.round((baseRefundAmount - fee) * 100) / 100);

      // 4. Insert Verified Refund Record
      const { data: refund, error: insertErr } = await supabase
        .from('refunds')
        .insert([{
          request_id: requestId || paymentRecord.request_id,
          payment_id: paymentRecord.id,
          customer_id: customerId || paymentRecord.customer_id,
          amount: baseRefundAmount,
          cancellation_fee: fee,
          net_refund_amount: netRefundAmount,
          reason,
          status: 'pending',
          admin_notes: 'External payment gateway refund API not configured. Queued for manual admin settlement.',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (insertErr) throw insertErr;

      return { success: true, refund };
    } catch (err) {
      console.error("Refund request error:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Process refund by Admin
   */
  async processAdminRefund(refundId, { action = 'processed', adminNotes = '' }) {
    try {
      // 1. Fetch Refund
      const { data: refund, error: fErr } = await supabase
        .from('refunds')
        .select('*')
        .eq('id', refundId)
        .single();

      if (fErr || !refund) throw new Error("Refund record not found.");

      // 2. Update Refund Status
      const { data: updatedRefund, error: uErr } = await supabase
        .from('refunds')
        .update({
          status: action,
          admin_notes: adminNotes || refund.admin_notes,
          processed_at: action === 'processed' ? new Date().toISOString() : null,
          updated_at: new Date().toISOString()
        })
        .eq('id', refundId)
        .select()
        .single();

      if (uErr) throw uErr;

      // 3. If processed, mark payment and invoice as refunded
      if (action === 'processed') {
        if (refund.payment_id) {
          await supabase
            .from('payments')
            .update({ payment_status: 'refunded' })
            .eq('id', refund.payment_id);
        }
        if (refund.request_id) {
          await supabase
            .from('invoices')
            .update({ invoice_status: 'refunded', updated_at: new Date().toISOString() })
            .eq('request_id', refund.request_id);
        }
      }

      return { success: true, refund: updatedRefund };
    } catch (err) {
      console.error("Process refund error:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Get refunds for an order
   */
  async getRefundsByRequest(requestId) {
    try {
      const { data, error } = await supabase
        .from('refunds')
        .select('*')
        .eq('request_id', requestId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      return { data: [], error: err.message };
    }
  },

  /**
   * Get all refunds for Admin Finance
   */
  async getAllRefunds(statusFilter = 'all') {
    try {
      let query = supabase
        .from('refunds')
        .select(`
          *,
          request:service_requests(id, address_line, area, city, status),
          payment:payments(transaction_ref, payment_method, amount)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      return { data: [], error: err.message };
    }
  }
};

export default refundService;
