import { supabase } from '../../lib/supabase';
import { paymentGatewayAdapter } from '../payment/paymentGatewayAdapter';

const SERVER_BASE = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SERVER_URL)
    ? import.meta.env.VITE_SERVER_URL.replace(/\/+$/, '')
    : '';

export const paymentService = {
    /**
     * Fetch payment and invoice details for a specific request.
     * @param {string} requestId 
     */
    getPaymentDetails: async (requestId) => {
        try {
            // Fetch invoice
            let { data: invoice, error: invoiceErr } = await supabase
                .from('invoices')
                .select('*')
                .eq('request_id', requestId)
                .maybeSingle();

            if (invoiceErr) console.warn("Invoice query note:", invoiceErr);

            // Fetch payment
            let { data: payment, error: paymentErr } = await supabase
                .from('payments')
                .select('*')
                .eq('request_id', requestId)
                .maybeSingle();

            if (paymentErr) console.warn("Payment query note:", paymentErr);

            // Resilient fallback from service_requests
            if (!invoice || !payment) {
                const { data: sReq } = await supabase
                    .from('service_requests')
                    .select('*')
                    .eq('id', requestId)
                    .maybeSingle();
                
                if (sReq) {
                    const baseAmount = Number(sReq.final_amount || sReq.total_amount || sReq.amount || 450);
                    const isPaid = sReq.payment_status === 'completed';
                    const isCash = sReq.payment_gateway_ref === 'HAND_CASH' || sReq.payment_method === 'HAND CASH';

                    if (!invoice) {
                        invoice = {
                            id: `INV-${requestId.slice(0, 8)}`,
                            request_id: requestId,
                            invoice_number: `INV-${requestId.slice(0, 6).toUpperCase()}-001`,
                            base_amount: sReq.amount || 450,
                            extra_charges: sReq.extra_charge_amount || 0,
                            tax_amount: Math.round(baseAmount * 0.18 * 100) / 100,
                            total_amount: baseAmount,
                            invoice_status: isPaid ? 'paid' : 'pending'
                        };
                    }
                    if (!payment && isCash) {
                        payment = {
                            id: `PAY-${requestId.slice(0, 8)}`,
                            request_id: requestId,
                            payment_method: 'HAND CASH',
                            payment_status: isPaid ? 'completed' : 'pending',
                            amount: baseAmount
                        };
                    }
                }
            }

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

            const isDemo = localStorage.getItem("coophub_demo_user") === "true" || localStorage.getItem("coophub_demo_customer") === "true";
            
            if (isDemo) {
                return {
                    invoice: {
                        id: `INV-DEMO-${Date.now()}`,
                        request_id: orderData.id,
                        total_amount: orderData.amount || orderData.final_amount || 450,
                        invoice_status: 'pending'
                    },
                    error: null
                };
            }

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
    },

    /**
     * Customer selects Hand Cash Payment method
     * Payment and invoice remain pending until Pillar confirms receipt
     */
    chooseHandCash: async (requestId, customerId) => {
        try {
            const response = await fetch(`${SERVER_BASE}/api/payment/choose-hand-cash`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, customerId })
            });

            if (response.ok) {
                return await response.json();
            }

            const errBody = await response.json().catch(() => ({}));
            throw new Error(errBody.error || `Failed to select hand cash payment (${response.status})`);
        } catch (err) {
            console.error("chooseHandCash error:", err);
            return { success: false, error: err.message };
        }
    },

    /**
     * Authenticated Assigned Pillar marks Hand Cash payment complete
     */
    confirmHandCashPayment: async (requestId, pillarId) => {
        try {
            const response = await fetch(`${SERVER_BASE}/api/payment/confirm-hand-cash`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ requestId, pillarId })
            });

            if (response.ok) {
                return await response.json();
            }

            const errBody = await response.json().catch(() => ({}));
            throw new Error(errBody.error || `Failed to confirm hand cash payment (${response.status})`);
        } catch (err) {
            console.error("confirmHandCashPayment error:", err);
            return { success: false, error: err.message };
        }
    }
};

export default paymentService;
