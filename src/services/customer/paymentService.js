import { supabase } from '../../lib/supabase';
import { paymentGatewayAdapter } from '../payment/paymentGatewayAdapter';

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
     * Create or retrieve an immutable invoice record in Supabase
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
            const totalAmount = Math.round((baseAmount + extraCharges + taxAmount) * 100) / 100;
            const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;

            const { data: newInvoice, error } = await supabase
                .from('invoices')
                .insert([{
                    request_id: orderData.id,
                    booking_id: orderData.booking_id || orderData.id,
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
     * Initialize gateway order session
     */
    initializePayment: async (invoice, orderData, customer) => {
        try {
            const amount = invoice?.total_amount || orderData?.total_amount || orderData?.amount || 450;
            const gatewayOrder = await paymentGatewayAdapter.createGatewayOrder({
                invoiceId: invoice?.id || orderData?.id,
                amount,
                currency: "INR",
                customer,
                serviceName: orderData?.service_name || orderData?.category || "Cooperative Service"
            });

            return {
                success: true,
                ...gatewayOrder
            };
        } catch (err) {
            return {
                success: false,
                error: err.message
            };
        }
    },

    /**
     * Process cryptographic server-side payment verification
     */
    processPaymentVerification: async ({ orderId, paymentId, signature, invoiceId, requestId, amount, customerId, pillarId }) => {
        return await paymentGatewayAdapter.verifyPayment({
            orderId,
            paymentId,
            signature,
            invoiceId,
            requestId,
            amount,
            customerId,
            pillarId
        });
    },

    /**
     * Record payment directly (for fallback/system records)
     */
    recordPayment: async (payload) => {
        return await paymentGatewayAdapter.verifyPayment({
            orderId: payload.gatewayOrderId || `ORD-${Date.now()}`,
            paymentId: payload.gatewayPaymentId || `pay_${Date.now()}`,
            signature: "sig_system_authorized",
            invoiceId: payload.invoiceId,
            requestId: payload.requestId,
            amount: payload.amount,
            customerId: payload.customerId,
            pillarId: payload.pillarId
        });
    }
};

export default paymentService;
