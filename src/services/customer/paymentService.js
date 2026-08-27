import { supabase } from '../../lib/supabase';

export const paymentService = {
    /**
     * Fetch payment and invoice details for a specific request.
     * @param {string} requestId 
     */
    getPaymentDetails: async (requestId) => {
        // Fetch invoice
        const { data: invoice, error: invoiceErr } = await supabase
            .from('invoices')
            .select('*')
            .eq('request_id', requestId)
            .maybeSingle();

        if (invoiceErr) console.error("Invoice Error:", invoiceErr);

        // Fetch payment
        const { data: payment, error: paymentErr } = await supabase
            .from('payments')
            .select('*')
            .eq('request_id', requestId)
            .maybeSingle();

        if (paymentErr) console.error("Payment Error:", paymentErr);

        return { invoice, payment };
    },

    /**
     * Initialize a payment session (mock wrapper returning URL or token)
     * @param {string} invoiceId 
     * @param {number} amount
     */
    initializePayment: async (invoiceId, amount) => {
        // In a production system, this would call a backend function like Stripe/Razorpay
        // and return the client_secret or redirect_url.
        return {
            status: 'gateway_missing',
            message: 'Production payment gateway is strictly required before transactions can execute.',
            mock: true
        };
    }
};
