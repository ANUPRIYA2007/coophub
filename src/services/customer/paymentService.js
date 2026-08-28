import { supabase } from '../../lib/supabase';

export const paymentService = {
    /**
     * Fetch payment and invoice details for a specific request.
     * @param {string} requestId 
     */
    getPaymentDetails: async (requestId) => {
        try {
            // Fetch invoice
            const { data: invoice, error: invoiceErr } = await supabase
                .from('invoices')
                .select('*')
                .eq('request_id', requestId)
                .maybeSingle();

            if (invoiceErr) console.warn("Invoice query note:", invoiceErr);

            // Fetch payment
            const { data: payment, error: paymentErr } = await supabase
                .from('payments')
                .select('*')
                .eq('request_id', requestId)
                .maybeSingle();

            if (paymentErr) console.warn("Payment query note:", paymentErr);

            return { invoice, payment };
        } catch (err) {
            console.warn("getPaymentDetails exception:", err);
            return { invoice: null, payment: null };
        }
    },

    /**
     * Create or retrieve an invoice record in Supabase based on real booking data
     * @param {object} orderData
     */
    createOrGetInvoice: async (orderData) => {
        try {
            if (!orderData?.id) return { invoice: null, error: "Missing order ID" };

            // Check if exists
            const { data: existing } = await supabase
                .from('invoices')
                .select('*')
                .eq('request_id', orderData.id)
                .maybeSingle();

            if (existing) return { invoice: existing, error: null };

            const baseAmount = Number(orderData.amount || orderData.base_amount || 0);
            const extraCharges = Number(orderData.extra_charge_status === 'accepted' ? (orderData.extra_charge_amount || 0) : 0);
            const taxAmount = Math.round((baseAmount + extraCharges) * 0.18 * 100) / 100;
            const totalAmount = baseAmount + extraCharges + taxAmount;
            const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

            const { data: newInvoice, error } = await supabase
                .from('invoices')
                .insert([{
                    request_id: orderData.id,
                    booking_id: orderData.booking_id || null,
                    invoice_number: invoiceNumber,
                    customer_id: orderData.customer_id || null,
                    pillar_id: orderData.pillar_id || null,
                    base_amount: baseAmount,
                    extra_charges: extraCharges,
                    tax_amount: taxAmount,
                    total_amount: totalAmount,
                    currency: 'INR',
                    invoice_status: 'pending'
                }])
                .select()
                .single();

            if (error) throw error;
            return { invoice: newInvoice, error: null };
        } catch (err) {
            console.warn("createOrGetInvoice exception:", err);
            return { invoice: null, error: err.message };
        }
    },

    /**
     * Record a payment confirmation entry in Supabase
     * @param {object} payload
     */
    recordPayment: async (payload) => {
        try {
            const { data, error } = await supabase
                .from('payments')
                .insert([{
                    request_id: payload.requestId,
                    invoice_id: payload.invoiceId,
                    customer_id: payload.customerId,
                    pillar_id: payload.pillarId,
                    amount: payload.amount,
                    payment_method: payload.paymentMethod || 'upi',
                    transaction_ref: payload.transactionRef || `TXN-UPI-${Date.now()}`,
                    gateway_order_id: payload.gatewayOrderId || null,
                    gateway_payment_id: payload.gatewayPaymentId || null,
                    payment_status: 'completed'
                }])
                .select()
                .single();

            if (error) throw error;

            // Update invoice status to paid
            if (payload.invoiceId) {
                await supabase
                    .from('invoices')
                    .update({ invoice_status: 'paid', updated_at: new Date().toISOString() })
                    .eq('id', payload.invoiceId);
            }

            return { payment: data, error: null };
        } catch (err) {
            console.warn("recordPayment exception:", err);
            return { payment: null, error: err.message };
        }
    },

    /**
     * Initialize a payment gateway session.
     * Marked as NOT PRODUCTION READY until real merchant webhook keys are connected.
     */
    initializePayment: async (invoiceId, amount) => {
        return {
            status: 'gateway_missing',
            isProductionGatewayReady: false,
            message: 'Production payment gateway (Razorpay / UPI) is not configured with live merchant keys.',
            mock: true
        };
    }
};

export default paymentService;
