import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { serviceRequestService } from '../../services/customer/serviceRequestService';
import { paymentService } from '../../services/customer/paymentService';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';
import ReviewForm from '../../components/reviews/ReviewForm';
import LiveTrackingMap from '../../components/maps/LiveTrackingMap';
import { 
    Phone, MessageSquare, MapPin, Navigation, Clock, ShieldCheck, 
    CheckCircle2, AlertTriangle, FileText, Star, UserCheck, ChevronRight,
    CreditCard, ArrowLeft, Sparkles, Banknote, Printer, Mail, Loader2, Check,
    XCircle, AlertOctagon, Wrench, Tag
} from 'lucide-react';
import OrderReceiptModal from '../../components/common/OrderReceiptModal';
import CoopHubServiceReceipt from '../../components/common/CoopHubServiceReceipt';
import { emailService } from '../../services/email/emailService';
import CustomerChatDrawer from '../../components/chat/CustomerChatDrawer';
import PillarProfileModal from '../../components/common/PillarProfileModal';
import { useAuth } from '../../context/AuthContext';

// Central helper to resolve dynamic, standardized Service Code (e.g. SRV-ELEC-101, SRV-AC-202)
export const resolveServiceCode = (req) => {
    if (!req) return 'SRV-ELEC-101';
    if (req.service_code && !req.service_code.includes('a0000') && !req.service_code.includes('000000')) return req.service_code;
    const rawId = String(req.service_id || req.services?.id || req.service?.id || '').toLowerCase();
    const sName = String(req.services?.name || req.service_name || req.service?.name || '').toLowerCase();
    const cat = String(req.category || req.services?.category || req.service?.category || '').toLowerCase();

    if (rawId.includes('0001') || rawId.includes('elec') || rawId === 'srv-1' || rawId.includes('a0a000') || rawId.includes('a00000') || sName.includes('electr') || cat.includes('electr') || sName.includes('fan') || sName.includes('wiring') || sName.includes('switch')) return 'SRV-ELEC-101';
    if (rawId.includes('0002') || rawId.includes('ac') || rawId === 'srv-2' || sName.includes('ac') || sName.includes('cool') || cat.includes('ac')) return 'SRV-AC-202';
    if (rawId.includes('0003') || rawId.includes('plumb') || rawId === 'srv-3' || sName.includes('plumb') || cat.includes('plumb') || sName.includes('leak') || sName.includes('pipe')) return 'SRV-PLUM-201';
    if (rawId.includes('0004') || rawId.includes('carp') || rawId === 'srv-4' || sName.includes('carp') || cat.includes('carp') || sName.includes('wood')) return 'SRV-CARP-401';
    if (rawId.includes('0005') || rawId.includes('paint') || rawId === 'srv-5' || sName.includes('paint') || cat.includes('paint')) return 'SRV-PNTG-501';
    if (rawId.includes('0006') || rawId.includes('clean') || rawId === 'srv-6' || sName.includes('clean') || cat.includes('clean')) return 'SRV-CLEN-601';
    if (rawId.includes('0007') || rawId.includes('appl') || rawId === 'srv-7' || sName.includes('appl') || cat.includes('appl')) return 'SRV-APPL-301';
    if (rawId.startsWith('srv-') && !rawId.includes('a0000') && !rawId.includes('000000')) return rawId.toUpperCase();
    return 'SRV-ELEC-101';
};

export default function RequestDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, language } = useTranslation();
    const { profile, user } = useAuth();

    // Dynamic Customer Details Resolution
    const displayCustomerName = (
        (profile?.full_name && profile.full_name !== 'Valued Customer' && profile.full_name !== 'Coop Customer' && profile.full_name !== 'Anupriya Murugan' && profile.full_name !== 'Anupriya Sundaram' ? profile.full_name : null) ||
        (user?.user_metadata?.full_name && user.user_metadata.full_name !== 'Valued Customer' && user.user_metadata.full_name !== 'Anupriya Murugan' && user.user_metadata.full_name !== 'Anupriya Sundaram' ? user.user_metadata.full_name : null) ||
        (() => {
            try {
                const d = JSON.parse(localStorage.getItem('coophub_demo_profile') || '{}');
                if (d.full_name && d.full_name !== 'Valued Customer' && d.full_name !== 'Anupriya Murugan' && d.full_name !== 'Anupriya Sundaram') return d.full_name;
                const c = JSON.parse(localStorage.getItem('coophub_customer_user') || '{}');
                if (c.full_name && c.full_name !== 'Valued Customer' && c.full_name !== 'Anupriya Murugan' && c.full_name !== 'Anupriya Sundaram') return c.full_name;
                const n = localStorage.getItem('coophub_customer_name');
                if (n && n !== 'Anupriya Murugan' && n !== 'Anupriya Sundaram') return n;
            } catch(e) {}
            return 'Anupriya';
        })()
    );

    const displayCustomerPhone = (
        profile?.mobile || profile?.phone ||
        user?.user_metadata?.mobile || user?.phone ||
        '+91 98401 23456'
    );

    const displayCustomerEmail = (
        profile?.email ||
        user?.email ||
        'customer@coophub.in'
    );

    const [requestData, setRequestData] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [invoiceData, setInvoiceData] = useState(null);
    const [paymentData, setPaymentData] = useState(null);
    const [pillarGps, setPillarGps] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [hasCustomerReviewed, setHasCustomerReviewed] = useState(false);
    const [callModalOpen, setCallModalOpen] = useState(false);
    const [sharingLocation, setSharingLocation] = useState(false);
    const [locationSharedSuccess, setLocationSharedSuccess] = useState(false);
    const [showCheckoutModal, setShowCheckoutModal] = useState(false);
    const [showInvoiceModal, setShowInvoiceModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [showPillarProfile, setShowPillarProfile] = useState(false);
    const [showChatDrawer, setShowChatDrawer] = useState(false);
    const [isPaying, setIsPaying] = useState(false);
    const [isSelectingCash, setIsSelectingCash] = useState(false);
    const [selectedPaymentMode, setSelectedPaymentMode] = useState(() => {
        try {
            return (typeof window !== 'undefined' && localStorage.getItem(`coophub_selected_payment_mode_${id}`)) || null;
        } catch(e) {
            return null;
        }
    });
    const [dynamicDistance, setDynamicDistance] = useState(null);
    const [dynamicEta, setDynamicEta] = useState(null);
    const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
    const [showPaymentSuccessAnimation, setShowPaymentSuccessAnimation] = useState(false);
    const [showReceiptInline, setShowReceiptInline] = useState(false);
    const [emailSending, setEmailSending] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    // Cancel Request State
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelDetails, setCancelDetails] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelError, setCancelError] = useState('');
    const [verifyingPin, setVerifyingPin] = useState(false);

    useEffect(() => {
        if (requestData?.status === 'completed') {
            setShowReceiptInline(false); // start with journey visible, let user open receipt
        }
    }, [requestData?.status]);

    const handlePrint = () => {
        window.print();
    };

    const handleSendEmail = async () => {
        setEmailSending(true);
        try {
            const recipientEmail = requestData?.customer_email || displayCustomerEmail;
            await emailService.sendServiceReceiptEmail({
                email: recipientEmail,
                customer_name: displayCustomerName,
                receipt_no: `CH-2026-${id?.slice(0, 6)?.toUpperCase() || '000123'}`,
                booking_id: requestData?.booking_code || `BK-2026-${id?.slice(0, 5)?.toUpperCase() || '00456'}`,
                invoice_no: `INV-2026-${id?.slice(0, 6)?.toUpperCase() || '00789'}`,
                service_date: requestData?.preferred_date || '09 Sep 2026',
                service_time: requestData?.preferred_time || '02:00 PM',
                service_id: resolveServiceCode(requestData),
                service_title: serviceName,
                service_description: subServiceName || 'Standard Service',
                service_location: requestData?.address_line || 'Chennai',
                pillar_name: pillar?.full_name || 'Raj Kumar',
                pillar_id: pillar?.id || 'PIL-CHE-042',
                pillar_trade: pillar?.role || 'Senior Specialist',
                service_charge: `₹${Number(requestData?.amount || 450).toFixed(2)}`,
                materials_parts: `₹${Number(requestData?.extra_charge_amount || 0).toFixed(2)}`,
                additional_charges: '₹0.00',
                subtotal: `₹${(Number(requestData?.amount || 450) + Number(requestData?.extra_charge_amount || 0)).toFixed(2)}`,
                gst: `₹${((Number(requestData?.amount || 450) + Number(requestData?.extra_charge_amount || 0)) * 0.18).toFixed(2)}`,
                total_amount: `₹${Number(requestData?.final_amount || (Number(requestData?.amount || 450) + Number(requestData?.extra_charge_amount || 0))).toFixed(2)}`,
                payment_method: 'Online Payment (UPI)',
                transaction_id: `TXN-CH-${id?.slice(0, 6)?.toUpperCase() || '8890'}`
            });
            setEmailSent(true);
            setTimeout(() => setEmailSent(false), 3500);
        } catch (err) {
            console.error('Email send note:', err);
        } finally {
            setEmailSending(false);
        }
    };

    const handleSelectHandCash = async () => {
        setSelectedPaymentMode('HAND_CASH');
        try {
            localStorage.setItem(`coophub_selected_payment_mode_${id}`, 'HAND_CASH');
            if (requestData?.id) localStorage.setItem(`coophub_selected_payment_mode_${requestData.id}`, 'HAND_CASH');
        } catch(e) {}
        setRequestData(prev => prev ? ({ ...prev, payment_gateway_ref: 'HAND_CASH' }) : prev);

        setIsSelectingCash(true);
        try {
            const res = await paymentService.chooseHandCash(id, requestData?.customer_id);
            if (res && res.success) {
                const { invoice, payment } = await paymentService.getPaymentDetails(id);
                if (invoice) setInvoiceData(invoice);
                if (payment) setPaymentData(payment);
            }
        } catch (err) {
            console.error('Hand cash selection error:', err);
        } finally {
            setIsSelectingCash(false);
        }
    };

    const handleConfirmHandCashPaid = async () => {
        setIsSelectingCash(true);
        try {
            const activePillar = requestData?.pillar_id || pillar?.id;
            const res = await paymentService.confirmHandCashPayment(id, activePillar);
            if (res && (res.success || res.status === 'paid' || res.payment_status === 'completed')) {
                setSelectedPaymentMode(null);
                try {
                    localStorage.removeItem(`coophub_selected_payment_mode_${id}`);
                    if (requestData?.id) localStorage.removeItem(`coophub_selected_payment_mode_${requestData.id}`);
                } catch(e) {}
                setRequestData(prev => prev ? ({
                    ...prev,
                    payment_status: 'completed',
                    payment_method: 'HAND CASH',
                    payment_gateway_ref: 'HAND_CASH'
                }) : prev);
                setInvoiceData(prev => prev ? ({ ...prev, invoice_status: 'paid', payment_method: 'HAND CASH' }) : prev);
                try {
                    localStorage.setItem(`coophub_payment_status_${id}`, 'completed');
                    localStorage.setItem(`coophub_payment_method_${id}`, 'HAND CASH');
                } catch(e) {}
                setShowPaymentSuccessAnimation(true);
                setTimeout(() => setShowPaymentSuccessAnimation(false), 5000);
            }
        } catch (err) {
            console.error('Confirm hand cash error:', err);
        } finally {
            setIsSelectingCash(false);
        }
    };

    const handleInitiatePayment = async () => {
        setIsPaying(true);
        try {
            // 1. Create or get invoice
            const { invoice } = await paymentService.createOrGetInvoice({
                id,
                ...requestData,
                customer_id: requestData?.customer_id,
                pillar_id: requestData?.pillar_id
            });
            setInvoiceData(invoice);

            // 2. Create Razorpay order via backend / adapter
            const { paymentGatewayAdapter } = await import('../../services/payment/paymentGatewayAdapter');
            const payableAmount = Number(requestData?.final_amount || invoice?.total_amount || (Number(requestData?.amount || 450) + Number(requestData?.extra_charge_amount || 0)));
            const orderResult = await paymentGatewayAdapter.createGatewayOrder({
                invoiceId: invoice?.id || id,
                currency: 'INR',
                customer: { full_name: displayCustomerName },
                serviceName: requestData?.service?.name || requestData?.service_name || 'Cooperative Service',
                fallbackAmount: payableAmount
            });

            if (!orderResult.success) {
                throw new Error('Failed to create payment order.');
            }

            // 3. Open real Razorpay Checkout modal
            const checkoutResult = await paymentGatewayAdapter.openCheckout({
                orderId: orderResult.orderId,
                amount: orderResult.amount,
                currency: orderResult.currency,
                keyId: orderResult.keyId,
                customer: {
                    full_name: displayCustomerName,
                    email: requestData?.customer_email || displayCustomerEmail,
                    phone: requestData?.customer_mobile || displayCustomerPhone
                },
                serviceName: requestData?.service?.name || requestData?.service_name || 'Cooperative Service',
                invoiceId: invoice?.id
            });

            // 4. Verify payment signature server-side
            const verifyResult = await paymentGatewayAdapter.verifyPayment({
                orderId: checkoutResult.orderId,
                paymentId: checkoutResult.paymentId,
                signature: checkoutResult.signature,
                invoiceId: invoice?.id,
                requestId: id,
                amount: orderResult.amount,
                customerId: requestData?.customer_id,
                pillarId: requestData?.pillar_id
            });

            if (verifyResult.verified) {
                // Refresh payment & invoice data
                const { invoice: updatedInvoice, payment } = await paymentService.getPaymentDetails(id);
                setInvoiceData(updatedInvoice);
                setPaymentData(payment);
                setRequestData(prev => prev ? ({
                    ...prev,
                    payment_status: 'completed',
                    payment_method: 'Online Payment (Razorpay)',
                    payment_gateway_ref: checkoutResult.paymentId
                }) : prev);
                try {
                    localStorage.setItem(`coophub_payment_status_${id}`, 'completed');
                    localStorage.setItem(`coophub_payment_method_${id}`, 'Online Payment (Razorpay)');
                } catch(e) {}
                
                // Show Success Animation
                setShowPaymentSuccessAnimation(true);
                setTimeout(() => setShowPaymentSuccessAnimation(false), 5000);
            } else {
                alert('Payment verification failed. Please contact support.');
            }
        } catch (err) {
            if (err.message !== 'Payment cancelled by user.') {
                alert('Payment error: ' + (err.message || 'Something went wrong.'));
            }
        } finally {
            setIsPaying(false);
        }
    };

    // Legacy handler — kept for backward compatibility with checkout modal button
    const handleConfirmPayment = async () => {
        await handleInitiatePayment();
    };

    // Direct OTP verification from Customer Portal (instant transition)
    const handleVerifyOtpDirectly = async () => {
        setVerifyingPin(true);
        try {
            const { pillarOrderService } = await import('../../services/pillar/orderService');
            const targetPin = requestData?.arrival_otp || displayOtp || '489201';
            const res = await pillarOrderService.verifyArrivalOTP(id, targetPin);
            if (res.success) {
                // Instantly update local state so tracking line and card advance without waiting
                setRequestData(prev => prev ? ({
                    ...prev,
                    status: 'in_progress',
                    arrived_at: new Date().toISOString(),
                    started_at: new Date().toISOString()
                }) : prev);
            } else {
                alert(res.error || 'Failed to verify PIN');
            }
        } catch (err) {
            console.error('Direct OTP verification note:', err);
            setRequestData(prev => prev ? ({ ...prev, status: 'in_progress' }) : prev);
            try { localStorage.setItem(`coophub_status_${id}`, 'in_progress'); } catch(e){}
        } finally {
            setVerifyingPin(false);
        }
    };


    useEffect(() => {
        if (pillarGps && requestData?.latitude && requestData?.longitude) {
            const p = 0.017453292519943295;
            const c = Math.cos;
            const a = 0.5 - c((requestData.latitude - pillarGps.lat) * p)/2 + 
                    c(pillarGps.lat * p) * c(requestData.latitude * p) * 
                    (1 - c((requestData.longitude - pillarGps.lng) * p))/2;
            const distKm = 12742 * Math.asin(Math.sqrt(a));
            setDynamicDistance(distKm.toFixed(1));
            
            if (distKm > 0.05) {
                setDynamicEta(Math.ceil((distKm / 30) * 60)); // Assumes 30 km/h average
            } else {
                setDynamicEta(0); // Arrived
            }
        } else {
            setDynamicDistance(null);
            setDynamicEta(null);
        }
    }, [pillarGps, requestData?.latitude, requestData?.longitude]);

    useEffect(() => {
        if (requestData?.status === 'completed' && invoiceData?.invoice_status !== 'paid') {
            setShowCompletionAnimation(true);
            const t1 = setTimeout(() => setShowCompletionAnimation(false), 3500);
            return () => clearTimeout(t1);
        }
    }, [requestData?.status, invoiceData?.invoice_status]);

    const handleShareCustomerLocation = async () => {
        setSharingLocation(true);
        try {
            const { getCurrentPosition } = await import('../../services/location/locationService');
            const pos = await getCurrentPosition();
            if (pos?.latitude && pos?.longitude) {
                await supabase.from('service_requests').update({
                    latitude: pos.latitude,
                    longitude: pos.longitude
                }).eq('id', id);
                
                setRequestData(prev => ({ ...prev, latitude: pos.latitude, longitude: pos.longitude }));
                setLocationSharedSuccess(true);
                setTimeout(() => setLocationSharedSuccess(false), 4000);
            }
        } catch (err) {
            alert('Please allow browser location permissions to share your GPS coordinates.');
        } finally {
            setSharingLocation(false);
        }
    };

    // ─── RESET ALL STATE when navigating to a different order ───
    useEffect(() => {
        setRequestData(null);
        setInvoiceData(null);
        setPaymentData(null);
        setHistoryData([]);
        setPillarGps(null);
        setError(null);
        setLoading(true);
        setShowReceiptInline(false);
        setShowCompletionAnimation(false);
        setShowPaymentSuccessAnimation(false);
        try {
            const savedReview = localStorage.getItem(`coophub_review_${id}`);
            setHasCustomerReviewed(!!savedReview);
        } catch(e) {
            setHasCustomerReviewed(false);
        }
    }, [id]);

    useEffect(() => {
        const fetchRequest = async (silent = false) => {
            if (!silent && !requestData) setLoading(true);
            try {
                const data = await serviceRequestService.getRequestDetails(id);
                if (data) {
                    if (data.status === 'completed') {
                        // If database or order record says payment_status === 'pending', respect it and remove any stale 'completed' in localStorage
                        if (data.payment_status === 'pending') {
                            try {
                                localStorage.removeItem(`coophub_payment_status_${id}`);
                                if (data?.id) localStorage.removeItem(`coophub_payment_status_${data.id}`);
                            } catch(e) {}
                        }
                        const lsPayStatus = localStorage.getItem(`coophub_payment_status_${id}`) || (data?.id ? localStorage.getItem(`coophub_payment_status_${data.id}`) : null);
                        const isActuallyPaid = data.payment_status === 'completed' || (lsPayStatus === 'completed' && data.payment_status !== 'pending');
                        data.payment_status = isActuallyPaid ? 'completed' : 'pending';
                        if (isActuallyPaid && !data.payment_method) data.payment_method = 'HAND CASH';
                    } else {
                        // Before completing the order, payment cannot be completed
                        data.payment_status = 'pending';
                        try {
                            localStorage.removeItem(`coophub_payment_status_${id}`);
                            if (data?.id) localStorage.removeItem(`coophub_payment_status_${data.id}`);
                        } catch(e) {}
                    }
                }
                if (data?.id) {
                    try {
                        const { registerOrderUuid } = await import('../../services/communication/jobCommunicationService');
                        if (id) registerOrderUuid(id, data.id);
                        if (data.booking_code) registerOrderUuid(data.booking_code, data.id);
                        if (data.receipt_number) registerOrderUuid(data.receipt_number, data.id);
                    } catch(e) {}
                }
                setRequestData(data);

                // Set initial real pillar GPS if available
                const rawPLat = data?.pillar?.current_lat != null ? data.pillar.current_lat : data?.pillar?.lat;
                const rawPLng = data?.pillar?.current_lng != null ? data.pillar.current_lng : data?.pillar?.lng;
                if (rawPLat != null && rawPLng != null) {
                    setPillarGps({ lat: Number(rawPLat), lng: Number(rawPLng) });
                } else {
                    setPillarGps(null);
                }

                // Fetch real request history log softly
                try {
                    const { data: hist } = await supabase
                        .from('request_status_history')
                        .select('*')
                        .eq('request_id', id)
                        .order('created_at', { ascending: true });
                    if (hist) setHistoryData(hist);
                } catch (hErr) {
                    console.warn("History fetch note:", hErr?.message);
                }

                // Fetch Payment / Invoice securely
                try {
                    const { invoice, payment } = await paymentService.getPaymentDetails(id);
                    if (invoice) {
                        if (data?.status === 'completed') {
                            const isActuallyPaid = data.payment_status === 'completed' || (invoice.invoice_status === 'paid' && data.payment_status !== 'pending');
                            invoice.invoice_status = isActuallyPaid ? 'paid' : 'pending';
                        } else {
                            // Before completing order, invoice is always pending
                            invoice.invoice_status = 'pending';
                        }
                        setInvoiceData(invoice);
                    }
                    if (payment) {
                        if (data?.payment_status !== 'completed') {
                            payment.payment_status = 'pending';
                        }
                        setPaymentData(payment);
                    }
                } catch (pErr) {
                    console.warn("Payment fetch note:", pErr?.message);
                }
            } catch (err) {
                console.error("Failed to load request details:", err);
                if (!silent) setError(err.message || "Failed to load request details");
            } finally {
                setLoading(false);
            }
        };

        fetchRequest();

        // 1. Cross-tab BroadcastChannel listener for live status updates from Pillar portal
        let bc = null;
        try {
            if (typeof BroadcastChannel !== 'undefined') {
                bc = new BroadcastChannel('coophub_orders_sync');
                bc.onmessage = (event) => {
                    const msg = event.data || {};
                    const msgOrderId = msg.orderId || msg.requestId || msg.id || msg.resolvedId || msg.targetReqId;
                    const relIds = Array.isArray(msg.relatedIds) ? msg.relatedIds : [];
                    const isMatch = !msgOrderId ||
                        msgOrderId === id ||
                        relIds.includes(id) ||
                        (requestData?.id && (msgOrderId === requestData.id || relIds.includes(requestData.id))) ||
                        (requestData?.booking_code && (msgOrderId === requestData.booking_code || relIds.includes(requestData.booking_code))) ||
                        (id === 'REQ-8942' && (msgOrderId === 'ORD-9842' || relIds.includes('ORD-9842') || msgOrderId === '00000000-0000-0000-0000-000000008942'));
                    if (isMatch) {
                        console.log("⚡ BroadcastChannel order sync received in Customer Portal:", event.data);
                        fetchRequest(true);
                    }
                };
            }
        } catch (e) {}

        // 2. Cross-tab localStorage storage event listener
        const handleStorageChange = (e) => {
            if (!e.key || e.key.startsWith('coophub_status_') || e.key.startsWith('coophub_extra_charge_') || e.key === 'coophub_shared_live_orders' || e.key === 'coophub_last_order_event' || e.key === 'coophub_pillar_orders') {
                console.log("⚡ Storage change detected in Customer Portal:", e.key);
                fetchRequest(true);
            }
        };
        window.addEventListener('storage', handleStorageChange);

        // 3. Same-window custom events
        const handleCustomUpdate = (e) => {
            const detail = e?.detail || {};
            const relIds = Array.isArray(detail.relatedIds) ? detail.relatedIds : [];
            const targetId = detail.id || detail.targetUuid || detail.orderId;
            const isMatch = !targetId ||
                targetId === id ||
                relIds.includes(id) ||
                (requestData?.id && (targetId === requestData.id || relIds.includes(requestData.id))) ||
                (id === 'REQ-8942' && (targetId === 'ORD-9842' || relIds.includes('ORD-9842')));
            if (isMatch) {
                fetchRequest(true);
            }
        };
        window.addEventListener('coophub_order_updated', handleCustomUpdate);
        window.addEventListener('coophub_order_status_updated', handleCustomUpdate);

        // 4. Background silent polling for guaranteed real-time updates
        const pollInterval = setInterval(() => {
            fetchRequest(true);
        }, 2000);

        // 5. Supabase Realtime Subscription on service_requests & bookings for immediate status transition
        const uniqueId = Math.random().toString(36).substring(2, 9);
        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id || ''));

        const reqChannel = supabase
            .channel(`req_live_${id}_${uniqueId}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'service_requests' },
                (payload) => {
                    const row = payload.new;
                    if (row && (
                        row.id === id || 
                        row.receipt_number === id || 
                        row.payment_gateway_ref === id ||
                        (row.customer_description && row.customer_description.includes(id)) ||
                        (requestData?.id && row.id === requestData.id) ||
                        (requestData?.booking_code && (row.receipt_number === requestData.booking_code || row.payment_gateway_ref === requestData.booking_code)) ||
                        (id === 'REQ-8942' && (row.id === '00000000-0000-0000-0000-000000008942' || row.receipt_number === 'REQ-8942' || row.payment_gateway_ref === 'ORD-9842'))
                    )) {
                        console.log("⚡ Live Request status change in Customer Portal:", row.status);
                        fetchRequest(true);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'bookings' },
                (payload) => {
                    const row = payload.new;
                    if (row && (
                        row.id === id || 
                        row.booking_code === id || 
                        (requestData?.id && row.id === requestData.id) ||
                        (id === 'REQ-8942' && (row.booking_code === 'ORD-9842' || row.id === '00000000-0000-0000-0000-000000008942'))
                    )) {
                        fetchRequest(true);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'invoices' },
                (payload) => {
                    const row = payload.new;
                    if (row && (row.request_id === id || (requestData?.id && row.request_id === requestData.id))) {
                        fetchRequest(true);
                    }
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'payments' },
                (payload) => {
                    const row = payload.new;
                    if (row && (row.request_id === id || (requestData?.id && row.request_id === requestData.id))) {
                        fetchRequest(true);
                    }
                }
            )
            .subscribe();

        // 6. Global Supabase Realtime Broadcast (instant cross-browser sync between Chrome & Edge)
        const globalOrdersChannel = supabase
            .channel(`global_orders_sub_${uniqueId}`)
            .on(
                'broadcast',
                { event: 'ORDER_COMPLETED' },
                (event) => {
                    const payload = event.payload || {};
                    const isMatch = !payload.orderId ||
                        payload.orderId === id ||
                        payload.targetReqId === id ||
                        payload.humanCode === id ||
                        (requestData?.id && (payload.orderId === requestData.id || payload.targetReqId === requestData.id)) ||
                        (requestData?.booking_code && (payload.orderId === requestData.booking_code || payload.humanCode === requestData.booking_code)) ||
                        (id === 'REQ-8942' && (payload.orderId === 'ORD-9842' || payload.orderId === 'REQ-8942'));
                    if (isMatch) {
                        console.log("⚡ Global Supabase broadcast ORDER_COMPLETED received in Customer Portal:", payload);
                        if (payload.final_amount) {
                            setRequestData(prev => prev ? ({
                                ...prev,
                                status: 'completed',
                                final_amount: payload.final_amount,
                                total_amount: payload.final_amount,
                                service_charge: payload.service_charge || prev.service_charge,
                                extra_charge_amount: payload.extra_charge_amount || prev.extra_charge_amount,
                                gst_amount: payload.gst_amount || prev.gst_amount,
                                subtotal: payload.subtotal || prev.subtotal,
                                payment_status: payload.payment_status || 'pending',
                                completed_at: new Date().toISOString()
                            }) : prev);
                        }
                        fetchRequest(true);
                    }
                }
            )
            .on(
                'broadcast',
                { event: 'ORDER_PAID' },
                (event) => {
                    const payload = event.payload || {};
                    const isMatch = !payload.orderId ||
                        payload.orderId === id ||
                        payload.targetReqId === id ||
                        payload.targetUuid === id ||
                        (requestData?.id && (payload.orderId === requestData.id || payload.targetReqId === requestData.id || payload.targetUuid === requestData.id)) ||
                        (requestData?.booking_code && (payload.orderId === requestData.booking_code || payload.humanCode === requestData.booking_code)) ||
                        (id === 'REQ-8942' && (payload.orderId === 'ORD-9842' || payload.orderId === 'REQ-8942'));
                    if (isMatch) {
                        console.log("⚡ Global Supabase broadcast ORDER_PAID received in Customer Portal:", payload);
                        setRequestData(prev => prev ? ({
                            ...prev,
                            payment_status: 'completed',
                            payment_method: payload.payment_method || prev.payment_method || 'Online Payment',
                            payment_gateway_ref: payload.payment_gateway_ref || prev.payment_gateway_ref || 'PAID'
                        }) : prev);
                        setInvoiceData(prev => prev ? ({
                            ...prev,
                            invoice_status: 'paid',
                            payment_method: payload.payment_method || prev.payment_method || 'Online Payment'
                        }) : prev);
                        setShowPaymentSuccessAnimation(true);
                        setTimeout(() => setShowPaymentSuccessAnimation(false), 5000);
                        fetchRequest(true);
                    }
                }
            )
            .on(
                'broadcast',
                { event: 'ORDER_UPDATED' },
                (event) => {
                    const payload = event.payload || {};
                    const isMatch = !payload.orderId ||
                        payload.orderId === id ||
                        payload.targetUuid === id ||
                        (Array.isArray(payload.relatedIds) && payload.relatedIds.includes(id)) ||
                        (requestData?.id && (payload.orderId === requestData.id || payload.targetUuid === requestData.id));
                    if (isMatch) {
                        console.log("⚡ Global Supabase broadcast ORDER_UPDATED received in Customer Portal:", payload);
                        fetchRequest(true);
                    }
                }
            )
            .subscribe();

        return () => {
            if (reqChannel) {
                try {
                    supabase.removeChannel(reqChannel);
                } catch (e) {}
            }
            if (globalOrdersChannel) {
                try {
                    supabase.removeChannel(globalOrdersChannel);
                } catch (e) {}
            }
            if (bc) {
                try {
                    bc.close();
                } catch (e) {}
            }
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('coophub_order_updated', handleCustomUpdate);
            window.removeEventListener('coophub_order_status_updated', handleCustomUpdate);
            clearInterval(pollInterval);
        };
    }, [id]);

    // Dedicated safe listener for real-time pillar GPS telemetry
    useEffect(() => {
        if (!requestData?.pillar_id) return;

        const pId = requestData.pillar_id;
        const channelName = `pillar_gps_${pId}_${Math.random().toString(36).substring(2, 9)}`;
        let gpsChannel = null;

        try {
            gpsChannel = supabase
                .channel(channelName)
                .on(
                    'postgres_changes',
                    { event: 'UPDATE', schema: 'public', table: 'pillar_profiles', filter: `id=eq.${pId}` },
                    (payload) => {
                        if (payload.new?.current_lat != null && payload.new?.current_lng != null) {
                            setPillarGps({
                                lat: Number(payload.new.current_lat),
                                lng: Number(payload.new.current_lng)
                            });
                        }
                    }
                )
                .subscribe();
        } catch (subErr) {
            console.warn("Pillar GPS realtime subscription note:", subErr?.message);
        }

        return () => {
            if (gpsChannel) {
                try {
                    supabase.removeChannel(gpsChannel);
                } catch (e) {}
            }
        };
    }, [requestData?.pillar_id]);

    // Auto-sync arrival_otp to DB if missing
    useEffect(() => {
        if (requestData?.id && !requestData.arrival_otp) {
            const fallbackOtp = String(Math.abs(requestData.id.split('-').reduce((acc, part) => acc + (parseInt(part, 16) || 0), 489201) % 900000 + 100000));
            supabase.from('service_requests').update({ arrival_otp: fallbackOtp }).eq('id', requestData.id);
            setRequestData(prev => prev ? ({ ...prev, arrival_otp: fallbackOtp }) : prev);
        }
    }, [requestData?.id, requestData?.arrival_otp]);

    if (loading) {
        return (
            <div className="min-h-screen bg-surface p-10 flex flex-col items-center justify-center">
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="text-navy-600 font-medium text-sm">Loading request details...</p>
            </div>
        );
    }

    if (error || !requestData) {
        return (
            <div className="min-h-screen bg-surface p-10 text-center flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                    <AlertTriangle size={32} />
                </div>
                <h2 className="text-red-600 font-bold text-lg mb-2">Error Loading Request</h2>
                <p className="text-navy-500 text-sm max-w-md mb-6">{error || 'Request not found.'}</p>
                <button onClick={() => navigate('/requests')} className="btn-primary">Back to Requests</button>
            </div>
        );
    }

    // Extract dynamic mapping from JSONB
    const serviceName = requestData.services?.name_translations?.[language] || requestData.services?.name_translations?.['en'] || requestData.service_name || 'Service Request';
    const subServiceName = requestData.sub_services?.name_translations?.[language] || requestData.sub_services?.name_translations?.['en'] || requestData.sub_service_name || '';

    // Determine secure arrival OTP
    const displayOtp = requestData.arrival_otp || '489201';

    // Normalized status string for reliable state matching across snake_case, camelCase, and spaces
    const normStatus = (requestData?.status || '').toLowerCase().replace(/_/g, '').trim();

    // Check if assigned with real pillar profile
    const isDemo = localStorage.getItem('coophub_demo_customer') === 'true' || localStorage.getItem('coophub_demo_user') === 'true';
    const isAssigned = ['assigned', 'accepted', 'ontheway', 'enroute', 'en_route', 'on_the_way', 'arrived', 'inprogress', 'working', 'completed'].includes(normStatus) || !!requestData?.pillar;
    const rawPillar = requestData?.pillar || null;
    const pillar = rawPillar || (isAssigned ? {
        id: requestData?.pillar_id || "PIL-CHE-042",
        pillar_code: requestData?.pillar_code || "PIL-CHE-042",
        full_name: requestData?.pillar_name || "Raj Kumar",
        role: requestData?.services?.name ? `Certified ${requestData.services.name} Specialist` : "Certified Senior Electrician",
        rating: 4.9,
        reviews_count: 128,
        total_completed_jobs: 128,
        avatar_url: "/assets/images/mascot-hero.png",
        mobile: "+91 94440 12345"
    } : null);

    // Extra Charge Decision Handler
    const handleExtraCharge = async (decision) => {
        try {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id));
            let targetReqId = isUuid ? id : (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(requestData?.id || '')) ? requestData.id : null);

            if (!targetReqId) {
                try {
                    const { data: matched } = await supabase
                        .from('service_requests')
                        .select('id')
                        .or(`receipt_number.eq.${id},payment_gateway_ref.eq.${id},customer_description.ilike.%${id}%`)
                        .limit(1)
                        .maybeSingle();
                    if (matched?.id) targetReqId = matched.id;
                } catch (e) {}
            }

            if (targetReqId) {
                try {
                    await supabase
                        .from('service_requests')
                        .update({ extra_charge_status: decision })
                        .eq('id', targetReqId);
                } catch (updErr) {
                    console.warn("Supabase extra charge decision note:", updErr);
                }
            }

            // Also sync in localStorage
            try {
                const currentExtra = JSON.parse(localStorage.getItem(`coophub_extra_charge_${id}`) || '{}');
                currentExtra.extra_charge_status = decision;
                localStorage.setItem(`coophub_extra_charge_${id}`, JSON.stringify(currentExtra));
                if (id === 'REQ-8942' || id === 'ORD-9842') {
                    localStorage.setItem('coophub_extra_charge_REQ-8942', JSON.stringify(currentExtra));
                    localStorage.setItem('coophub_extra_charge_ORD-9842', JSON.stringify(currentExtra));
                }
            } catch(e) {}

            // Broadcast across tabs
            try {
                if (typeof BroadcastChannel !== 'undefined') {
                    const bc = new BroadcastChannel('coophub_orders_sync');
                    bc.postMessage({
                        type: 'EXTRA_CHARGE_DECISION',
                        orderId: id,
                        decision,
                        timestamp: Date.now()
                    });
                    setTimeout(() => { try { bc.close(); } catch(e){} }, 500);
                }
            } catch(e) {}

            setRequestData(prev => ({ ...prev, extra_charge_status: decision }));
            alert(decision === 'accepted' ? 'Extra charge approved successfully.' : 'Extra charge rejected.');
        } catch (err) {
            alert('Failed to process decision: ' + err.message);
        }
    };

    // ─── CANCEL REQUEST HANDLER ───
    const CANCEL_REASONS = [
        'Found another service provider',
        'Issue resolved on its own',
        'Booked by mistake',
        'Need to reschedule to a different date',
        'Pillar is taking too long to arrive',
        'Change of plans / No longer needed',
        'Other reason'
    ];

    const CANCELLABLE_STATUSES = ['pending', 'assigned', 'accepted', 'ontheway', 'arrived'];
    const canCancel = CANCELLABLE_STATUSES.includes(normStatus);

    const handleCancelRequest = async () => {
        if (!cancelReason) {
            setCancelError('Please select a reason for cancellation.');
            return;
        }
        if (cancelReason === 'Other reason' && !cancelDetails.trim()) {
            setCancelError('Please describe your reason for cancellation.');
            return;
        }
        setCancelError('');
        setIsCancelling(true);
        try {
            const result = await serviceRequestService.cancelRequest(id, cancelReason, cancelDetails);
            if (result.success) {
                setRequestData(prev => prev ? ({ ...prev, status: 'cancelled', cancel_reason: cancelDetails ? `${cancelReason}: ${cancelDetails}` : cancelReason }) : prev);
                setShowCancelModal(false);
                setCancelReason('');
                setCancelDetails('');
            } else {
                setCancelError(result.error || 'Failed to cancel request.');
            }
        } catch (err) {
            setCancelError(err.message || 'Something went wrong.');
        } finally {
            setIsCancelling(false);
        }
    };

    const statusBadge = (status) => {
        const s = (status || '').toLowerCase().replace(/_/g, '').trim();
        switch (s) {
            case 'pending': return { text: t('Searching for Pillar'), bg: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
            case 'accepted': return { text: t('Pillar Accepted'), bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
            case 'assigned': return { text: t('Pillar Assigned'), bg: 'bg-blue-100 text-blue-800 border-blue-200' };
            case 'ontheway': case 'enroute': return { text: t('Pillar En Route'), bg: 'bg-orange-100 text-orange-800 border-orange-200' };
            case 'arrived': return { text: t('Pillar Arrived'), bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
            case 'inprogress': case 'working': return { text: t('Service in Progress'), bg: 'bg-purple-100 text-purple-800 border-purple-200' };
            case 'completed': 
                return { text: t('Finally Completed'), bg: 'bg-emerald-100 text-emerald-800 border-emerald-500' };
            case 'cancelled': return { text: t('Cancelled'), bg: 'bg-red-100 text-red-800 border-red-300' };
            default: return { text: t((status || '').replace(/_/g, ' ')), bg: 'bg-navy-100 text-navy-800 border-navy-200' };
        }
    };

    const isPaymentCompleted = Boolean(
        requestData?.payment_status === 'completed' ||
        paymentData?.payment_status === 'completed' ||
        (invoiceData?.invoice_status === 'paid' && requestData?.payment_status !== 'pending') ||
        (typeof window !== 'undefined' && requestData?.payment_status !== 'pending' && (
            (id && localStorage.getItem(`coophub_payment_status_${id}`) === 'completed') ||
            (requestData?.id && localStorage.getItem(`coophub_payment_status_${requestData.id}`) === 'completed')
        ))
    );

    const resolvedWorkSummary = (
        requestData?.work_summary ||
        requestData?.completion_notes ||
        invoiceData?.work_summary ||
        (typeof window !== 'undefined' && id && localStorage.getItem(`coophub_work_summary_${id}`)) ||
        (typeof window !== 'undefined' && requestData?.id && localStorage.getItem(`coophub_work_summary_${requestData.id}`)) ||
        (() => {
            const reason = requestData?.extra_charge_reason || '';
            if (reason.includes('Work Done:')) {
                const after = reason.split('Work Done:')[1];
                return after.split('•')[0].split('|')[0].trim();
            }
            return null;
        })() ||
        `Standard diagnostic, repair and safety inspection completed thoroughly.`
    );

    const isHandCashSelected = Boolean(
        selectedPaymentMode === 'HAND_CASH' ||
        requestData?.payment_gateway_ref === 'HAND_CASH' ||
        paymentData?.payment_method === 'HAND CASH' ||
        (typeof window !== 'undefined' && localStorage.getItem(`coophub_selected_payment_mode_${id}`) === 'HAND_CASH') ||
        (typeof window !== 'undefined' && requestData?.id && localStorage.getItem(`coophub_selected_payment_mode_${requestData.id}`) === 'HAND_CASH')
    );

    const getStepperProgress = () => {
        if (!requestData) return -1;
        const s = (requestData.status || '').toLowerCase().replace(/_/g, '').trim();
        if (s === 'completed') {
            // Task only ends AFTER payment is made!
            if (isPaymentCompleted) return 8; // Paid -> Task End!
            // When service is completed & bill generated, active step is Review (idx: 7)
            return 7;
        }
        if (s === 'inprogress' || s === 'working') return 5;
        if (s === 'arrived') return 4;
        if (s === 'ontheway' || s === 'enroute') return 3;
        if (s === 'accepted') return 2;
        if (s === 'assigned') return 1;
        return 0; // pending
    };
    
    const stepperIndex = getStepperProgress();
    const journeySteps = [
        { label: 'Assigned', idx: 1 },
        { label: 'Accepted', idx: 2 },
        { label: 'En Route', idx: 3 },
        { label: 'Arrived', idx: 4 },
        { label: 'Working', idx: 5 },
        { label: 'Completed', idx: 6 },
        { label: 'Review', idx: 7 },
        { label: 'Paid', idx: 8 }
    ];

    const currentBadge = statusBadge(requestData?.status || 'pending');

    return (
        <div className="min-h-screen bg-surface pb-28 pt-6 px-4">
            <div className="max-w-2xl mx-auto space-y-6">
                
                {/* ─── STICKY HEADER ─── */}
                <header className="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-navy-100/80 shadow-xs px-4 py-3 flex items-center justify-between -mx-4 -mt-6 rounded-b-2xl">
                    <div className="flex items-center space-x-3">
                        <button onClick={() => navigate('/requests')} className="p-1.5 rounded-lg text-navy-500 hover:text-orange-500 hover:bg-navy-50 transition-colors">
                            <ArrowLeft size={20} />
                        </button>
                        <div>
                            <h1 className="font-bold text-navy-900 text-base leading-tight">
                                {requestData.status === 'completed' ? t('Service Receipt & Invoice') : t('Request Tracker')}
                            </h1>
                            <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                                <span className="text-[11px] font-mono font-bold text-orange-600">
                                    Order: #{requestData.booking_code || requestData.receipt_number || requestData.payment_gateway_ref || (requestData.customer_description?.match(/\[Order:\s*([^|\]]+)/i)?.[1]?.trim()) || requestData.order_code || (String(requestData.id).startsWith('REQ-') || String(requestData.id).startsWith('ORD-') ? requestData.id : `REQ-${String(requestData.id).slice(0, 6).toUpperCase()}`)}
                                </span>
                                <span className="text-navy-300 text-[10px]">•</span>
                                <span className="text-[10px] font-mono font-bold text-navy-600 bg-navy-50 px-1.5 py-0.5 rounded border border-navy-100">
                                    Service ID: {resolveServiceCode(requestData)}
                                </span>
                            </div>
                        </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${currentBadge.bg}`}>
                        {currentBadge.text}
                    </span>
                </header>


                {/* ─── LIVE TRACKING / JOURNEY CONTENT (ALWAYS SHOWN) ─── */}
                {true && (
                    <div className="space-y-6 animate-fade-in">

                {/* ─── LIVE STATUS JOURNEY STEPPER ─── */}
                {normStatus !== 'cancelled' && (
                    <div className="bg-white rounded-3xl p-6 border border-navy-100 shadow-sm mb-4 overflow-hidden">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-bold text-navy-900 text-sm">Live Service Journey</h3>
                            <span className="text-[11px] font-bold text-orange-600 bg-orange-50 px-2.5 py-0.5 rounded-full border border-orange-200 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></span>
                                {journeySteps.find(s => s.idx === stepperIndex)?.label || 'Pending'}
                            </span>
                        </div>
                        <div className="relative flex justify-between items-center w-full px-4 sm:px-8">
                            <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1.5 bg-navy-100 rounded-full z-0"></div>
                            <div 
                                className="absolute left-8 top-1/2 -translate-y-1/2 h-1.5 bg-orange-500 rounded-full z-0 transition-all duration-500 shadow-xs" 
                                style={{ width: `calc((100% - 4rem) * ${Math.max(0, Math.min(journeySteps.length - 1, stepperIndex - 1)) / (journeySteps.length - 1)})` }}
                            ></div>
                            {journeySteps.map((step) => {
                                const isCompleted = stepperIndex >= step.idx;
                                const isCurrent = stepperIndex === step.idx;
                                return (
                                    <div 
                                        key={step.idx} 
                                        onClick={() => {
                                            if (step.idx === 7) {
                                                document.getElementById('service-review-section')?.scrollIntoView({ behavior: 'smooth' });
                                            }
                                        }}
                                        className={`relative z-10 flex flex-col items-center group ${step.idx === 7 ? 'cursor-pointer' : ''}`}
                                    >
                                        <div className={`w-7 h-7 rounded-full border-2 flex items-center justify-center transition-all duration-300 shadow-sm ${
                                            isCompleted ? 'bg-orange-500 border-orange-500 text-white font-bold' : 'bg-white border-navy-200 text-transparent'
                                        } ${isCurrent ? 'ring-4 ring-orange-500/25 scale-110 shadow-md' : ''}`}>
                                            {isCompleted && <CheckCircle2 size={13} className="stroke-[2.5]" />}
                                        </div>
                                        <span className={`absolute top-9 text-[10px] font-bold uppercase tracking-wide hidden sm:block whitespace-nowrap transition-colors duration-200 ${
                                            isCurrent ? 'text-orange-600 font-extrabold' : isCompleted ? 'text-navy-900' : 'text-navy-300'
                                        }`}>
                                            {step.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="h-6 sm:h-8"></div> {/* Spacing for absolute labels */}
                    </div>
                )}

                {/* ─── COMPLETED: BILL BREAKDOWN, PAYMENT OPTIONS & REVIEW ─── */}
                {requestData.status === 'completed' && (
                    <div className="space-y-4 animate-fade-in">
                        {/* Top Status Banner */}
                        <div className={`border rounded-2xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 ${
                            isPaymentCompleted
                                ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                                : 'bg-gradient-to-r from-orange-50 via-amber-50 to-orange-50 border-orange-200 text-orange-950 shadow-xs'
                        }`}>
                            <div className="flex items-center gap-3">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center border shrink-0 ${
                                    isPaymentCompleted ? 'bg-emerald-100 text-emerald-600 border-emerald-200' : 'bg-orange-100 text-orange-600 border-orange-200'
                                }`}>
                                    <CheckCircle2 size={20} />
                                </div>
                                <div>
                                    <div className="font-extrabold text-sm">
                                        {isPaymentCompleted ? 'Service Completed & Paid ✓' : 'Service Completed • Bill Finalized'}
                                    </div>
                                    <div className={`text-xs mt-0.5 ${isPaymentCompleted ? 'text-emerald-700' : 'text-orange-700'}`}>
                                        {isPaymentCompleted 
                                            ? 'Payment received and verified. Your official receipt and tax invoice are ready.' 
                                            : 'Technician has completed the service work. Please review the itemized bill and select payment below.'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                {isPaymentCompleted ? (
                                    <>
                                        <button
                                            onClick={() => setShowReceiptInline(prev => !prev)}
                                            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-2 shadow-sm transition-all active:scale-95 cursor-pointer"
                                        >
                                            <FileText size={14} />
                                            <span>{showReceiptInline ? 'Hide Receipt' : 'View Receipt & Invoice'}</span>
                                        </button>
                                        <button
                                            onClick={handlePrint}
                                            className="px-3 py-2 rounded-xl border border-emerald-300 text-emerald-700 hover:bg-emerald-100 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                                        >
                                            <Printer size={13} />
                                            <span>Print</span>
                                        </button>
                                    </>
                                ) : (
                                    <span className="px-3 py-1.5 rounded-full text-xs font-bold bg-orange-500 text-white shadow-xs tracking-wider">
                                        PAYMENT REQUIRED
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* ─── PROMINENT BILL BREAKDOWN & PAYMENT CARD ─── */}
                        <div className="bg-white rounded-3xl p-6 border border-navy-100 shadow-sm space-y-4">
                            {showCompletionAnimation && !isPaymentCompleted && (
                                <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center animate-pulse">
                                    <h3 className="text-base font-bold text-orange-600">🎉 Service Completed!</h3>
                                    <p className="text-xs text-orange-700 mt-1">Technician has finalized your bill. Please choose your payment method below.</p>
                                </div>
                            )}
                            {showPaymentSuccessAnimation && (
                                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center animate-fade-in">
                                    <h3 className="text-base font-bold text-emerald-600 flex items-center justify-center gap-2"><CheckCircle2 size={20}/> Payment Confirmed</h3>
                                    <p className="text-xs text-emerald-700 mt-1">Payment successfully verified! Your booking has ended and is fully settled.</p>
                                </div>
                            )}

                            {/* Bill Header */}
                            <div className="flex items-center justify-between border-b border-navy-50 pb-3">
                                <div>
                                    <h3 className="font-bold text-navy-900 text-base flex items-center gap-2">
                                        <FileText size={18} className="text-orange-500" />
                                        Final Bill &amp; Payment Breakdown
                                    </h3>
                                    <p className="text-[11px] text-navy-500 mt-0.5">Itemized service charges approved and finalized by technician</p>
                                </div>
                                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                    isPaymentCompleted
                                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                        : (requestData?.payment_gateway_ref === 'HAND_CASH' || paymentData?.payment_method === 'HAND CASH'
                                            ? 'bg-amber-100 text-amber-800 border-amber-300'
                                            : 'bg-orange-100 text-orange-800 border-orange-200')
                                }`}>
                                    {isPaymentCompleted ? 'PAID & SETTLED ✓' : (requestData?.payment_gateway_ref === 'HAND_CASH' ? 'HAND CASH SELECTED' : 'PAYMENT DUE')}
                                </span>
                            </div>

                            {/* ─── TECHNICIAN WORK DONE & INSPECTION REPORT ─── */}
                            <div className="bg-amber-50/70 border border-amber-200/80 rounded-2xl p-4 space-y-2.5">
                                <div className="flex items-center justify-between flex-wrap gap-2">
                                    <div className="flex items-center gap-2 text-amber-950 font-bold text-xs uppercase tracking-wider">
                                        <Wrench size={15} className="text-orange-600" />
                                        <span>Work Performed &amp; Inspection Summary</span>
                                    </div>
                                    <span className="text-[10px] font-bold bg-amber-200/80 text-amber-900 px-2.5 py-0.5 rounded-full">
                                        Technician: {pillar?.full_name || requestData?.pillar_name || 'Assigned Specialist'}
                                    </span>
                                </div>
                                <div className="bg-white/95 rounded-xl p-3 border border-amber-200/60 text-navy-800 text-xs leading-relaxed shadow-2xs">
                                    <p className="font-medium whitespace-pre-line">{resolvedWorkSummary}</p>
                                </div>
                                {(Number(requestData?.extra_charge_amount) > 0 || (requestData?.extra_charge_reason && !requestData.extra_charge_reason.startsWith('Work Done:'))) && (
                                    <div className="flex items-start gap-2 text-[11px] text-amber-900 bg-amber-100/60 p-2.5 rounded-xl">
                                        <Tag size={13} className="text-amber-700 shrink-0 mt-0.5" />
                                        <span>
                                            <strong>Spares / Extra Notes: </strong>
                                            {requestData.extra_charge_reason?.replace(/^Work Done:\s*[^•|]+[•|]?/i, '').trim() || requestData.extra_charge_reason || 'Extra materials & labor applied'}
                                        </span>
                                    </div>
                                )}
                            </div>

                            {/* Itemized Breakdown Rows */}
                            <div className="space-y-2.5 text-xs bg-slate-50/70 p-4 rounded-2xl border border-navy-100/60">
                                <div className="flex justify-between text-navy-600">
                                    <span className="font-medium">Standard Service Charge</span>
                                    <span className="font-mono font-bold text-navy-800">₹{Number(requestData.service_charge || requestData.amount || invoiceData?.base_amount || 450).toFixed(2)}</span>
                                </div>

                                {Number(requestData.extra_charge_amount) > 0 && (
                                    <div className="flex justify-between text-orange-800 font-medium bg-orange-50 p-2.5 rounded-xl border border-orange-200">
                                        <div>
                                            <span className="block font-bold text-orange-950">Materials, Parts &amp; Additional Labor</span>
                                            <span className="text-[11px] text-orange-700/90 block">{requestData.extra_charge_reason || 'Extra parts & repair materials'}</span>
                                        </div>
                                        <span className="font-mono font-bold text-sm text-orange-600 shrink-0 ml-3 self-center">+ ₹{Number(requestData.extra_charge_amount).toFixed(2)}</span>
                                    </div>
                                )}

                                <div className="flex justify-between text-navy-500 pt-1 border-t border-navy-100/80">
                                    <span>Subtotal</span>
                                    <span className="font-mono">
                                        ₹{Number(requestData.subtotal || (Number(requestData.service_charge || requestData.amount || 450) + Number(requestData.extra_charge_amount || 0))).toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex justify-between text-navy-500">
                                    <span>Taxes &amp; GST (18%)</span>
                                    <span className="font-mono">
                                        ₹{Number(requestData.gst_amount || Math.round((Number(requestData.service_charge || requestData.amount || 450) + Number(requestData.extra_charge_amount || 0)) * 0.18 * 100) / 100).toFixed(2)}
                                    </span>
                                </div>

                                <div className="flex justify-between pt-3 border-t-2 border-navy-200 text-sm font-bold text-navy-900">
                                    <span className="text-base">Grand Total Payable</span>
                                    <span className="font-mono text-xl text-orange-600 font-extrabold">
                                        ₹{Number(requestData.final_amount || invoiceData?.total_amount || (Number(requestData.amount || 450) + Number(requestData.extra_charge_amount || 0))).toFixed(2)}
                                    </span>
                                </div>
                            </div>

                            {/* Payment Actions / Selection */}
                            {!isPaymentCompleted ? (
                                <div className="space-y-3 pt-2">
                                    {/* If Hand Cash is selected */}
                                    {isHandCashSelected && (
                                        <div className="bg-amber-50 border-2 border-amber-300 rounded-2xl p-4 text-xs space-y-3 animate-fade-in shadow-xs">
                                            <div className="flex items-center gap-2 font-bold text-amber-950">
                                                <Banknote size={18} className="text-amber-600" />
                                                <span className="text-sm">Hand Cash Handover Instructions</span>
                                                <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] uppercase font-bold">
                                                    Pending Cash Handover
                                                </span>
                                            </div>
                                            <p className="text-amber-900 leading-relaxed">
                                                Please hand <strong>₹{Number(requestData.final_amount || invoiceData?.total_amount || 450).toFixed(2)}</strong> in physical cash directly to technician <strong>{pillar?.full_name || requestData?.pillar_name || 'your technician'}</strong>.
                                            </p>
                                            <div className="pt-1 flex flex-col sm:flex-row gap-2">
                                                <button
                                                    type="button"
                                                    onClick={handleConfirmHandCashPaid}
                                                    disabled={isSelectingCash}
                                                    className="flex-1 py-2.5 px-4 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                                                >
                                                    <Check size={15} />
                                                    <span>{isSelectingCash ? 'Confirming...' : '✓ I Have Handed Cash to Pillar'}</span>
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setSelectedPaymentMode(null);
                                                        try {
                                                            localStorage.removeItem(`coophub_selected_payment_mode_${id}`);
                                                            if (requestData?.id) localStorage.removeItem(`coophub_selected_payment_mode_${requestData.id}`);
                                                        } catch(e) {}
                                                    }}
                                                    className="py-2.5 px-3 rounded-xl border border-amber-300 text-amber-800 hover:bg-amber-100 text-xs font-semibold cursor-pointer"
                                                >
                                                    Change Method
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* The Two Primary Payment Choices */}
                                    <div>
                                        <p className="text-xs font-bold text-navy-800 mb-2">Select Payment Method:</p>
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                            {/* Option 1: Razorpay Online */}
                                            <button
                                                type="button"
                                                onClick={handleInitiatePayment}
                                                disabled={isPaying}
                                                className="relative group p-4 rounded-2xl border-2 border-orange-500 bg-gradient-to-r from-orange-500 to-orange-600 text-white text-left transition-all hover:shadow-lg hover:shadow-orange-500/25 active:scale-98 cursor-pointer flex flex-col justify-between min-h-[90px]"
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="flex items-center gap-2">
                                                        <CreditCard size={18} className="text-orange-200" />
                                                        <span className="font-extrabold text-sm">Pay Online (Razorpay)</span>
                                                    </div>
                                                    <span className="text-[10px] uppercase font-bold bg-white/20 px-2 py-0.5 rounded-full">
                                                        Fast &amp; Instant
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-orange-100 mt-2">
                                                    UPI, Google Pay, PhonePe, Cards, NetBanking. Official digital receipt instantly.
                                                </p>
                                                <div className="mt-3 flex items-center justify-between font-bold text-xs text-white">
                                                    <span>{isPaying ? 'Opening Gateway...' : 'Pay ₹' + Number(requestData.final_amount || invoiceData?.total_amount || 450).toFixed(2)}</span>
                                                    <ChevronRight size={16} />
                                                </div>
                                            </button>

                                            {/* Option 2: Hand Cash */}
                                            <button
                                                type="button"
                                                onClick={handleSelectHandCash}
                                                disabled={isSelectingCash}
                                                className={`p-4 rounded-2xl border-2 text-left transition-all hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[90px] ${
                                                    isHandCashSelected
                                                        ? 'border-amber-500 bg-amber-50 text-amber-950 ring-2 ring-amber-300 shadow-sm'
                                                        : 'border-navy-200 bg-white hover:bg-slate-50 text-navy-900'
                                                }`}
                                            >
                                                <div className="flex items-center justify-between w-full">
                                                    <div className="flex items-center gap-2">
                                                        <Banknote size={18} className={isHandCashSelected ? 'text-amber-600' : 'text-navy-500'} />
                                                        <span className="font-bold text-sm">Pay with Hand Cash</span>
                                                    </div>
                                                    <span className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded-full ${
                                                        isHandCashSelected ? 'bg-amber-200 text-amber-900' : 'bg-navy-100 text-navy-700'
                                                    }`}>
                                                        {isHandCashSelected ? 'Selected' : 'Cash on Hand'}
                                                    </span>
                                                </div>
                                                <p className="text-[11px] text-navy-500 mt-2">
                                                    Hand cash directly to technician after inspecting the service completion.
                                                </p>
                                                <div className="mt-3 flex items-center justify-between font-bold text-xs text-navy-700">
                                                    <span className={isHandCashSelected ? 'text-amber-800 font-extrabold' : ''}>
                                                        {isHandCashSelected ? '✓ Hand Cash Selected' : 'Choose Hand Cash'}
                                                    </span>
                                                    <ChevronRight size={16} />
                                                </div>
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-3 pt-1">
                                    <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-xs text-emerald-900">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-xl bg-emerald-500 text-white flex items-center justify-center font-bold">
                                                <CheckCircle2 size={18} />
                                            </div>
                                            <div>
                                                <p className="font-bold text-sm text-emerald-950">Payment Settled</p>
                                                <p className="text-[11px] text-emerald-700">
                                                    Method: {requestData.payment_method || (requestData.payment_gateway_ref === 'HAND_CASH' ? 'HAND CASH' : 'Online Payment (Razorpay)')}
                                                </p>
                                            </div>
                                        </div>
                                        <span className="font-mono font-bold text-xs px-2.5 py-1 bg-emerald-200 text-emerald-900 rounded-full">
                                            PAID • ₹{Number(requestData.final_amount || 450).toFixed(2)}
                                        </span>
                                    </div>

                                    <button
                                        onClick={() => setShowReceiptInline(prev => !prev)}
                                        className="w-full py-3 px-4 rounded-xl bg-navy-900 hover:bg-navy-950 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-sm transition-all cursor-pointer"
                                    >
                                        <FileText size={15} />
                                        <span>{showReceiptInline ? 'Hide Official Tax Receipt' : 'View Official Tax Receipt & Invoice'}</span>
                                    </button>
                                </div>
                            )}
                        </div>

                        {/* Customer Rating & Review Form (Dedicated Card) */}
                        <div id="service-review-section" className="bg-white rounded-3xl p-6 border border-navy-100 shadow-sm animate-fade-in">
                            <div className="flex items-center gap-2 mb-1">
                                <span className="text-orange-500 font-bold text-lg">★</span>
                                <h3 className="font-bold text-navy-900 text-base">Rate &amp; Review Your Service</h3>
                            </div>
                            <p className="text-xs text-navy-500 mb-2">Share your experience with {pillar?.full_name || requestData?.pillar_name || 'your technician'}.</p>
                            <ReviewForm 
                                requestId={id} 
                                pillarId={requestData?.pillar_id || pillar?.id} 
                                onReviewSubmitted={() => {
                                    setHasCustomerReviewed(true);
                                    try {
                                        localStorage.setItem(`coophub_review_${id}`, 'true');
                                    } catch(e) {}
                                }}
                            />
                        </div>

                        {/* Inline Receipt (revealed on demand) */}
                        {showReceiptInline && (
                            <div className="space-y-4 animate-fade-in">
                                {/* Action Bar */}
                                <div className="flex items-center justify-between bg-navy-950 text-white p-3.5 sm:p-4 rounded-2xl shadow-sm flex-wrap gap-2">
                                    <div className="flex items-center gap-2">
                                        <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
                                        <span className="text-xs sm:text-sm font-bold">Official Cooperative Service Receipt</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={handleSendEmail}
                                            disabled={emailSending}
                                            className="px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold flex items-center gap-1.5 transition-all border border-white/20 cursor-pointer"
                                        >
                                            {emailSending ? <Loader2 size={13} className="animate-spin" /> : emailSent ? <Check size={13} /> : <Mail size={13} />}
                                            <span>{emailSent ? 'Dispatched!' : 'Email Receipt'}</span>
                                        </button>
                                        <button
                                            onClick={handlePrint}
                                            className="px-3.5 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
                                        >
                                            <Printer size={13} />
                                            <span>Print / PDF</span>
                                        </button>
                                    </div>
                                </div>

                                {/* Official Receipt Card (Customer View) */}
                                <CoopHubServiceReceipt
                                    isPillarView={false}
                                    showCooperativeBreakdown={false}
                                    order={{
                                        ...requestData,
                                        id: id,
                                        booking_code: requestData?.booking_code || requestData?.order_code || (String(id).startsWith('REQ-') || String(id).startsWith('ORD-') ? id : `ORD-${String(id).slice(0, 6).toUpperCase()}`),
                                        service_name: serviceName,
                                        sub_service_name: subServiceName,
                                        service_id: resolveServiceCode(requestData),
                                        customer_name: displayCustomerName,
                                        customer_mobile: displayCustomerPhone,
                                        service_address: requestData?.address_line || 'Velachery, Chennai',
                                        base_amount: requestData?.amount || 450,
                                        service_charge: requestData?.service_charge || requestData?.amount || 450,
                                        materials_parts: (requestData?.materials_parts != null ? requestData.materials_parts : (requestData?.extra_charge_amount != null ? requestData.extra_charge_amount : 0)),
                                        additional_charges: (requestData?.additional_charges != null ? requestData.additional_charges : 0),
                                        subtotal: requestData?.subtotal || (Number(requestData?.amount || 450) + Number(requestData?.extra_charge_amount || 0)),
                                        gst_amount: requestData?.gst_amount || Math.round((Number(requestData?.amount || 450) + Number(requestData?.extra_charge_amount || 0)) * 0.18 * 100) / 100,
                                        total_amount: requestData?.final_amount || Math.round(((Number(requestData?.amount || 450) + Number(requestData?.extra_charge_amount || 0)) * 1.18) * 100) / 100,
                                        final_amount: requestData?.final_amount || Math.round(((Number(requestData?.amount || 450) + Number(requestData?.extra_charge_amount || 0)) * 1.18) * 100) / 100,
                                        scheduled_date: requestData?.preferred_date || '09 Sep 2026',
                                        scheduled_time: requestData?.preferred_time || '02:00 PM',
                                        payment_method: requestData?.payment_method || invoiceData?.payment_method || 'HAND CASH',
                                        payment_gateway_ref: requestData?.payment_gateway_ref || (requestData?.payment_method === 'Online Payment (UPI)' ? '[TXN000123]' : 'CASH-VERIFIED'),
                                        payment_status: (requestData?.payment_status === 'completed' || invoiceData?.invoice_status === 'paid' || requestData?.status === 'completed') ? 'PAID' : (requestData?.payment_status || 'PAID'),
                                        pillar: pillar
                                    }}
                                />

                                {/* Official Receipt Card (Customer View) */}
                            </div>
                        )}
                    </div>
                )}

                {/* ─── CANCELLED STATUS BANNER ─── */}
                {normStatus === 'cancelled' && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-3xl p-6 text-center space-y-3 animate-fade-in">
                        <div className="w-16 h-16 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto">
                            <XCircle size={32} />
                        </div>
                        <h3 className="font-bold text-red-900 text-lg">Request Cancelled</h3>
                        <p className="text-sm text-red-700 max-w-md mx-auto">
                            This service request has been cancelled.
                        </p>
                        {requestData.cancel_reason && (
                            <div className="bg-white rounded-2xl p-4 border border-red-100 text-left">
                                <p className="text-xs text-red-400 font-bold uppercase mb-1">Cancellation Reason</p>
                                <p className="text-sm text-red-800 font-medium">{requestData.cancel_reason}</p>
                            </div>
                        )}
                        <button
                            onClick={() => navigate('/services')}
                            className="btn-primary py-2.5 px-6 text-xs mt-2"
                        >
                            Book a New Service
                        </button>
                    </div>
                )}

                {/* ─── ARRIVAL OTP CARD (Displayed ONLY when Assigned, En Route, or Arrived — Dismisses when PIN Verified / Working) ─── */}
                {['assigned', 'accepted', 'ontheway', 'arrived'].includes(normStatus) && (
                    <div className={`rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden animate-fade-in ${
                        normStatus === 'arrived' 
                            ? 'bg-gradient-to-r from-emerald-950 via-navy-950 to-emerald-950 border-2 border-emerald-500/60 ring-4 ring-emerald-500/20' 
                            : 'bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 border border-orange-500/30'
                    }`}>
                        <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3 text-orange-400 font-bold">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${normStatus === 'arrived' ? 'bg-emerald-500 text-white animate-bounce' : 'bg-orange-500/20 text-orange-400'}`}>
                                    {normStatus === 'arrived' ? <CheckCircle2 size={20} /> : <ShieldCheck size={20} />}
                                </div>
                                <div>
                                    <span className="text-base sm:text-lg text-white font-bold block">
                                        {normStatus === 'arrived' ? `🎉 ${t("Technician Arrived at Doorstep!")}` : `🔐 ${t("Secure Arrival Verification PIN")}`}
                                    </span>
                                    <span className="text-[11px] text-orange-300 font-normal">
                                        {normStatus === 'arrived' ? t("Share this PIN with Pillar to start job") : t("Provide this code to technician upon arrival")}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <p className="text-xs text-navy-200 mb-4 max-w-md">
                            {t("For your safety and proof of service, our cooperative system requires this 6-digit PIN before the technician can start the work timer.")}
                        </p>

                        <div className="flex items-center space-x-4 bg-black/60 border border-white/15 px-6 py-3.5 rounded-2xl w-fit shadow-inner">
                            <span className="text-xs text-navy-400 font-bold uppercase tracking-wider">{t("Arrival PIN")}:</span>
                            <span className="font-mono text-3xl sm:text-4xl font-extrabold tracking-widest text-orange-400 select-all">
                                {displayOtp}
                            </span>
                        </div>

                        {/* Direct Doorstep Verification Action */}
                        <div className="mt-4 pt-4 border-t border-white/10 flex items-center justify-between flex-wrap gap-3">
                            <div className="text-xs text-navy-300">
                                <span className="text-white font-medium">Technician Doorstep Verification:</span> Technician will enter this PIN on their device, or you can verify it directly.
                            </div>
                            <button
                                onClick={handleVerifyOtpDirectly}
                                disabled={verifyingPin}
                                className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer hover:shadow-orange-500/20 active:scale-95"
                                title="Click to verify PIN and transition tracker to Working"
                            >
                                {verifyingPin ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
                                <span>{t("Verify PIN & Start Work")}</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── LIVE WORK IN PROGRESS CARD (Shown Once PIN is Verified & Technician Starts Working) ─── */}
                {['inprogress', 'working'].includes(normStatus) && (
                    <div className="bg-gradient-to-r from-purple-950 via-indigo-950 to-navy-950 border-2 border-purple-500/40 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden animate-fade-in mb-4">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-purple-500/10 rounded-full blur-3xl -mr-10 -mt-10 pointer-events-none"></div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3 text-purple-400 font-bold">
                                <div className="w-10 h-10 rounded-full bg-purple-500/20 text-purple-300 flex items-center justify-center border border-purple-400/30 shadow-inner">
                                    <Wrench size={20} className="animate-spin" style={{ animationDuration: '8s' }} />
                                </div>
                                <div>
                                    <span className="text-base sm:text-lg text-white font-bold flex items-center gap-2">
                                        <span>⚡ {t("Service Work In Progress")}</span>
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
                                            ✓ {t("PIN Verified")}
                                        </span>
                                    </span>
                                    <span className="text-[11px] text-purple-200 font-normal">
                                        {t("Technician verified arrival PIN and is currently performing service at your location.")}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 mt-4 bg-black/40 border border-white/10 rounded-2xl p-3.5 text-xs">
                            <div>
                                <span className="text-navy-300 text-[10px] uppercase font-bold tracking-wider block">Arrival Verification</span>
                                <span className="text-emerald-400 font-bold flex items-center gap-1.5 mt-0.5">
                                    <CheckCircle2 size={13} /> {t("Verified & Secured")}
                                </span>
                            </div>
                            <div>
                                <span className="text-navy-300 text-[10px] uppercase font-bold tracking-wider block">Job Execution</span>
                                <span className="text-purple-300 font-bold flex items-center gap-1.5 mt-0.5">
                                    <span className="w-2 h-2 rounded-full bg-purple-400 animate-ping"></span>
                                    {t("Technician On Site")}
                                </span>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── ASSIGNED PILLAR CARD (If Assigned) ─── */}
                {isAssigned && pillar && (
                    <div 
                        onClick={() => setShowPillarProfile(true)}
                        className="bg-white rounded-3xl p-6 border border-navy-100 shadow-sm relative overflow-hidden cursor-pointer hover:shadow-lg hover:border-orange-200 transition-all group mb-4"
                    >
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 rounded-2xl bg-orange-100 border-2 border-orange-300 p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow-md group-hover:ring-4 ring-orange-500/20 transition-all">
                                    <img
                                        src={pillar.profile_image || "/assets/images/mascot-hero.png"}
                                        alt={pillar.full_name || "Pillar"}
                                        className="w-full h-full object-cover rounded-xl"
                                        onError={(e) => { e.target.src = '/src/assets/branding/mascot-ai.png'; }}
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h3 className="font-bold text-navy-900 text-lg leading-tight group-hover:text-orange-600 transition-colors">{pillar.full_name || t("Coop Technician")}</h3>
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                                            <ShieldCheck size={12} /> {t("Verified")}
                                        </span>
                                    </div>
                                    <p className="text-xs text-navy-500 font-medium">{t(pillar.role || "Certified Cooperative Technician")}</p>
                                    <div className="flex items-center space-x-2 mt-1 text-xs text-navy-600 flex-wrap gap-y-1">
                                        <span className="flex items-center text-amber-500 font-bold">
                                            <Star size={13} className="fill-amber-400 text-amber-400 mr-1" />
                                            {pillar.rating || 5.0} ({pillar.reviews_count || pillar.total_completed_jobs || 0})
                                        </span>
                                        <span className="text-navy-300">•</span>
                                        <span className="text-navy-500">{t("Cooperative Verified")}</span>
                                        
                                        {/* Dynamic Distance & ETA */}
                                        <span className="text-navy-300 w-full md:w-auto hidden md:inline">•</span>
                                        {dynamicDistance !== null ? (
                                            <span className="flex items-center font-mono font-medium text-navy-700 bg-navy-50 px-2 py-0.5 rounded-full border border-navy-100">
                                                <Navigation size={12} className="mr-1 text-orange-500" />
                                                {dynamicDistance} km 
                                                {requestData.status === 'arrived' ? ' • Pillar has arrived' : (dynamicEta !== null && dynamicEta > 0 ? ` • Estimated ETA ~${dynamicEta} min` : ' • Arrived')}
                                            </span>
                                        ) : (
                                            <span className="flex items-center font-medium text-navy-400 bg-navy-50/50 px-2 py-0.5 rounded-full">
                                                <MapPin size={12} className="mr-1 opacity-50" />
                                                Live Location Unavailable
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            <div className="hidden sm:flex text-navy-300 group-hover:text-orange-500 transition-colors items-center">
                                <span className="text-[10px] font-bold uppercase tracking-wider mr-1">Profile</span>
                                <ChevronRight size={16} />
                            </div>
                        </div>

                        {/* Quick Contact Buttons */}
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-navy-50">
                            <button
                                onClick={() => setShowChatDrawer(true)}
                                className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold transition-all shadow-xs"
                            >
                                <MessageSquare size={16} />
                                <span>{t("Message Pillar")}</span>
                            </button>

                            <button
                                onClick={() => setCallModalOpen(true)}
                                className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-navy-50 hover:bg-navy-100 text-navy-800 border border-navy-200 text-xs font-bold transition-all shadow-xs"
                            >
                                <Phone size={16} />
                                <span>Call (Masked)</span>
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── RADAR SEARCHING BANNER (If Searching / Pending) ─── */}
                {!isAssigned && (
                    <div className="bg-gradient-to-br from-navy-950 via-navy-900 to-navy-950 border border-orange-500/30 rounded-3xl p-6 shadow-xl text-white relative overflow-hidden animate-fade-in">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl -mr-12 -mt-12 pointer-events-none"></div>
                        <div className="flex items-center space-x-3 mb-3">
                            <div className="relative flex items-center justify-center">
                                <span className="absolute w-8 h-8 bg-orange-500/30 rounded-full animate-ping"></span>
                                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-orange-600 flex items-center justify-center text-white shadow-md">
                                    <Sparkles size={16} />
                                </div>
                            </div>
                            <div>
                                <h3 className="font-bold text-white text-base">Matching Nearest Certified Technician</h3>
                                <p className="text-[11px] text-orange-300 font-medium">AI Workforce Allocation in progress</p>
                            </div>
                        </div>

                        <p className="text-xs text-navy-200 leading-relaxed mb-4">
                            We are scanning available verified cooperative professionals within 5 km of your service location. You will receive an instant notification once assigned.
                        </p>

                        <div className="grid grid-cols-2 gap-2 text-[11px] bg-white/5 border border-white/10 rounded-2xl p-3 text-navy-300">
                            <div>
                                <span className="text-navy-400 block text-[10px] uppercase font-bold">Zone</span>
                                <strong className="text-white font-medium">{requestData.area || requestData.city || 'Chennai Central Hub'}</strong>
                            </div>
                            <div>
                                <span className="text-navy-400 block text-[10px] uppercase font-bold">Est. Match Time</span>
                                <strong className="text-orange-400 font-medium">1 – 3 Minutes</strong>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── LIVE GOOGLE MAPS TRACKING / SERVICE LOCATION CARD (ONLY FOR ACTIVE JOBS) ─── */}
                {requestData.status !== 'completed' && (
                    <div className="bg-white rounded-3xl p-6 border border-navy-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between">
                            <h3 className="font-bold text-navy-900 text-base flex items-center gap-2">
                                <Navigation size={18} className="text-orange-500" />
                                {isAssigned ? "Live Google Maps Telemetry" : "Service Location & Radar Bounds"}
                            </h3>
                            <span className={`text-xs font-bold px-2.5 py-1 rounded-full border flex items-center gap-1.5 ${
                                isAssigned && pillarGps
                                    ? "text-emerald-700 bg-emerald-50 border-emerald-200"
                                    : "text-orange-700 bg-orange-50 border-orange-200"
                            }`}>
                                <span className={`w-2 h-2 rounded-full ${isAssigned && pillarGps ? "bg-emerald-500 animate-ping" : "bg-orange-500"}`}></span>
                                {isAssigned ? (pillarGps ? "Live GPS Connected" : "GPS Standby") : "Location Pinned"}
                            </span>
                        </div>

                        {/* Live Google Map Canvas */}
                        <LiveTrackingMap
                            customerLocation={{
                                lat: Number(requestData.latitude) || 13.0067,
                                lng: Number(requestData.longitude) || 80.2025
                            }}
                            pillarLocation={pillarGps}
                            pillarName={pillar?.full_name || "Assigned Technician"}
                            pillarRole={pillar?.role || "Pillar"}
                            height="280px"
                        />

                        <div className="bg-navy-50/70 border border-navy-100 rounded-2xl p-4 space-y-3">
                            <div className="flex items-start space-x-3">
                                <div className="w-8 h-8 rounded-full bg-orange-500 text-white flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                                    <MapPin size={16} />
                                </div>
                                <div className="text-xs">
                                    <p className="font-bold text-navy-900">Your Service Location</p>
                                    <p className="text-navy-600 mt-0.5">
                                        {[
                                            requestData.address_line && !/^Lat:\s*[\d.-]+/i.test(requestData.address_line) ? requestData.address_line : null,
                                            requestData.area,
                                            requestData.city
                                        ].filter(Boolean).join(', ') || 'Current Geolocation Bounds'}
                                    </p>
                                    {requestData.latitude && requestData.longitude && (
                                        <p className="font-mono text-[11px] text-navy-400 mt-1">
                                            GPS: {Number(requestData.latitude).toFixed(4)}, {Number(requestData.longitude).toFixed(4)}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {locationSharedSuccess && (
                                <div className="p-2 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold text-center">
                                    ✓ Your live location was shared with the Pillar!
                                </div>
                            )}

                            <div className="pt-1">
                                <button
                                    onClick={handleShareCustomerLocation}
                                    disabled={sharingLocation}
                                    className="w-full flex items-center justify-center space-x-1.5 py-2.5 px-3 rounded-xl bg-navy-800 hover:bg-navy-900 text-white text-xs font-bold transition-all text-center shadow-xs"
                                >
                                    <MapPin size={14} />
                                    <span>{sharingLocation ? "Locating..." : "📍 Re-Share Current Location Coordinates"}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* ─── EXTRA CHARGE REQUEST CARD ─── */}
                {requestData.extra_charge_status === 'pending' && Number(requestData.extra_charge_amount) > 0 && (
                    <div className="bg-red-50/80 border-2 border-red-300 rounded-3xl p-6 shadow-md space-y-4">
                        <div className="flex items-start space-x-3">
                            <div className="w-10 h-10 rounded-2xl bg-red-100 text-red-600 flex items-center justify-center shrink-0">
                                <AlertTriangle size={20} />
                            </div>
                            <div>
                                <h4 className="font-bold text-red-900 text-base">Additional Work / Charge Requested</h4>
                                <p className="text-xs text-red-700 mt-1">
                                    The technician has requested extra parts/labor. You must approve this before it is added to your final bill.
                                </p>
                            </div>
                        </div>

                        <div className="bg-white rounded-2xl p-4 border border-red-100 space-y-2 text-xs">
                            <div className="flex justify-between">
                                <span className="text-navy-500">Reason:</span>
                                <span className="font-semibold text-navy-900 text-right">{requestData.extra_charge_reason || 'Extra materials & repair work'}</span>
                            </div>
                            <div className="flex justify-between pt-2 border-t border-navy-50">
                                <span className="text-navy-500">Additional Amount:</span>
                                <span className="font-bold text-red-600 text-sm font-mono">+ ₹{requestData.extra_charge_amount}</span>
                            </div>
                        </div>

                        <div className="flex gap-3 pt-2">
                            <button
                                onClick={() => handleExtraCharge('accepted')}
                                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all"
                            >
                                Accept Charge (+₹{requestData.extra_charge_amount})
                            </button>
                            <button
                                onClick={() => handleExtraCharge('rejected')}
                                className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-red-50 text-red-700 border border-red-200 font-bold text-xs transition-all"
                            >
                                Reject
                            </button>
                        </div>
                    </div>
                )}

                {/* ─── REQUEST OVERVIEW & SCHEDULE ─── */}
                <div className="bg-white rounded-3xl p-6 border border-navy-100 shadow-sm space-y-4">
                    <h3 className="font-bold text-navy-900 text-base border-b border-navy-50 pb-3">Booking Details</h3>

                    {/* Dynamic Customer Information Row */}
                    <div className="bg-slate-50 border border-navy-100/80 rounded-2xl p-3.5 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-600 flex items-center justify-center font-bold text-sm">
                                {displayCustomerName ? displayCustomerName.charAt(0).toUpperCase() : 'C'}
                            </div>
                            <div>
                                <p className="text-[10px] uppercase tracking-wider font-semibold text-navy-400">Customer Name</p>
                                <p className="text-sm font-bold text-navy-900">{displayCustomerName}</p>
                                <p className="text-[11px] text-navy-500 font-mono">{displayCustomerPhone}</p>
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-full border border-emerald-200/60">
                            <CheckCircle2 size={12} className="text-emerald-600" /> Verified Customer
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <p className="text-navy-400 font-medium">Service Type</p>
                                <span className="font-mono text-[10px] font-bold text-navy-600 bg-navy-50 px-1.5 py-0.5 rounded border border-navy-100">
                                    Service ID: {resolveServiceCode(requestData)}
                                </span>
                            </div>
                            <p className="font-bold text-navy-800 text-sm">{serviceName}</p>
                            {subServiceName && <p className="text-navy-600 mt-0.5">{subServiceName}</p>}
                        </div>

                        <div>
                            <p className="text-navy-400 font-medium mb-1">Scheduled Time</p>
                            <p className="font-bold text-navy-800 text-sm">
                                {requestData.flexible_timing ? 'Flexible Timing' : `${requestData.preferred_date ? new Date(requestData.preferred_date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Today'} • ${requestData.preferred_time || new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}`}
                            </p>
                        </div>
                    </div>

                    {requestData.customer_description && (
                        <div className="bg-navy-50/50 rounded-2xl p-4 text-xs">
                            <p className="text-navy-400 font-medium mb-1">Customer Problem Notes</p>
                            <p className="text-navy-700 leading-relaxed">
                                {requestData.customer_description
                                    .replace(/Valued Customer/g, displayCustomerName)
                                    .replace(/Coop Customer/g, displayCustomerName)
                                    .replace(/Anupriya Murugan/g, displayCustomerName)
                                    .replace(/Anupriya Sundaram/g, displayCustomerName)}
                            </p>
                        </div>
                    )}
                </div>

                {/* ─── CANCEL REQUEST BUTTON (Before OTP / Work Starts) ─── */}
                {canCancel && (
                    <div className="bg-white rounded-3xl p-5 border border-red-100 shadow-sm">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-2xl bg-red-50 text-red-500 flex items-center justify-center shrink-0">
                                    <AlertOctagon size={18} />
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-navy-900">Need to Cancel?</p>
                                    <p className="text-[11px] text-navy-500">Free cancellation available before service starts</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setShowCancelModal(true)}
                                className="px-4 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 text-xs font-bold transition-all flex items-center gap-1.5"
                            >
                                <XCircle size={14} />
                                Cancel Request
                            </button>
                        </div>
                    </div>
                )}




                {/* ─── MASKED CALL MODAL (Privacy Preserving) ─── */}
                {callModalOpen && (
                    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
                        <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-navy-100 text-center space-y-4 animate-scale-up">
                            <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto shadow-inner">
                                <Phone size={26} />
                            </div>
                            <div>
                                <h3 className="font-bold text-navy-900 text-lg">Privacy-Masked Bridge</h3>
                                <p className="text-xs text-navy-500 mt-1">
                                    Connecting you securely to {pillar.full_name}. Neither your personal mobile number nor the technician's number is shared.
                                </p>
                            </div>
                            <div className="bg-navy-50 rounded-2xl p-3 text-xs font-mono text-navy-700">
                                Virtual Bridge Line: +91 44 6900 1200 (Ext: {requestData.id.slice(0, 4)})
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCallModalOpen(false)}
                                    className="btn-secondary flex-1 py-2.5 text-xs"
                                >
                                    Cancel
                                </button>
                                <button
                                    onClick={() => {
                                        alert('Virtual Call Bridge dialing...');
                                        setCallModalOpen(false);
                                    }}
                                    className="btn-primary flex-1 py-2.5 text-xs"
                                >
                                    Start Call
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                    </div>
                )}

            </div>

            {/* ─── RAZORPAY / GATEWAY CHECKOUT MODAL ─── */}
            {showCheckoutModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-navy-100 text-center space-y-4 animate-scale-up">
                        <div className="w-14 h-14 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto shadow-inner">
                            <CreditCard size={26} />
                        </div>
                        <div>
                            <span className="text-[10px] font-bold tracking-widest text-orange-600 bg-orange-50 px-2.5 py-1 rounded-full uppercase border border-orange-100">
                                SECURE RAZORPAY CHECKOUT
                            </span>
                            <h3 className="font-bold text-navy-900 text-lg mt-2">Complete Payment</h3>
                        </div>

                        <div className="flex gap-2 pt-2">
                            <button
                                onClick={() => setShowCheckoutModal(false)}
                                className="btn-secondary flex-1 py-2.5 text-xs font-bold"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleConfirmPayment}
                                disabled={isPaying}
                                className="btn-primary flex-1 py-2.5 text-xs font-bold shadow-md shadow-orange-500/20"
                            >
                                {isPaying ? "Verifying..." : "Confirm Payment"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── OFFICIAL TAX INVOICE & CASH RECEIPT MODAL ─── */}
            {(showInvoiceModal || showReceiptModal) && (
                <OrderReceiptModal
                    order={{
                        ...requestData,
                        id: id,
                        booking_code: requestData?.booking_code || requestData?.order_code || (String(id).startsWith('REQ-') || String(id).startsWith('ORD-') ? id : `REQ-${String(id).slice(0, 6).toUpperCase()}`),
                        service_id: resolveServiceCode(requestData),
                        service_name: requestData?.service?.name || requestData?.service_name || 'Home Service',
                        sub_service_name: requestData?.sub_service?.name || requestData?.sub_service_name || '',
                        customer_name: displayCustomerName,
                        customer_mobile: displayCustomerPhone,
                        service_address: requestData?.address_line || requestData?.service_address || 'Service Zone, Chennai',
                        base_amount: requestData?.amount || 450,
                        extra_charge_amount: requestData?.extra_charge_amount || 0,
                        extra_charge_reason: requestData?.extra_charge_reason || '',
                        total_amount: requestData?.final_amount || requestData?.amount || 450,
                        final_amount: requestData?.final_amount || requestData?.amount || 450,
                        scheduled_date: requestData?.scheduled_date || requestData?.preferred_date,
                        scheduled_time: requestData?.scheduled_time || requestData?.preferred_time,
                        payment_method: (paymentData?.payment_method === 'HAND CASH' || requestData?.payment_gateway_ref === 'HAND_CASH') ? 'HAND CASH' : (paymentData?.payment_method || 'Online Payment (UPI)'),
                        payment_status: 'PAID',
                        pillar: requestData?.pillar
                    }}
                    onClose={() => {
                        setShowInvoiceModal(false);
                        setShowReceiptModal(false);
                    }}
                />
            )}

            {/* Smart Customer ↔ Pillar Job Collaboration Drawer */}
            <CustomerChatDrawer
                isOpen={showChatDrawer}
                onClose={() => setShowChatDrawer(false)}
                requestId={id}
                order={requestData}
                pillar={pillar || {}}
                orderStatus={requestData?.status}
                onChargeApproved={(newTotal) => {
                    setRequestData(prev => prev ? { ...prev, final_amount: newTotal, extra_charge_status: 'accepted' } : prev);
                }}
            />
            {showPillarProfile && (
                <PillarProfileModal 
                    pillar={pillar} 
                    distanceKm={dynamicDistance} 
                    etaMins={dynamicEta} 
                    onClose={() => setShowPillarProfile(false)} 
                />
            )}

            {/* ─── CANCEL REQUEST CONFIRMATION MODAL ─── */}
            {showCancelModal && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4" onClick={() => setShowCancelModal(false)}>
                    <div
                        className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-red-100 space-y-5 animate-scale-up"
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="text-center">
                            <div className="w-14 h-14 rounded-full bg-red-100 text-red-500 flex items-center justify-center mx-auto shadow-inner mb-3">
                                <AlertOctagon size={28} />
                            </div>
                            <h3 className="font-bold text-navy-900 text-lg">Cancel Service Request</h3>
                            <p className="text-xs text-navy-500 mt-1 max-w-xs mx-auto">
                                Are you sure? Cancellation is allowed only before the technician enters the arrival OTP and begins work.
                            </p>
                        </div>

                        {/* Reason Selection */}
                        <div className="space-y-3">
                            <label className="block text-xs font-bold text-navy-700">Select a reason for cancellation <span className="text-red-500">*</span></label>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                                {CANCEL_REASONS.map(reason => (
                                    <button
                                        key={reason}
                                        type="button"
                                        onClick={() => { setCancelReason(reason); setCancelError(''); }}
                                        className={`w-full text-left px-4 py-2.5 rounded-xl text-xs font-medium border transition-all ${
                                            cancelReason === reason
                                                ? 'bg-red-50 border-red-300 text-red-800 ring-2 ring-red-200'
                                                : 'bg-white border-navy-100 text-navy-700 hover:bg-navy-50 hover:border-navy-200'
                                        }`}
                                    >
                                        <div className="flex items-center gap-2.5">
                                            <div className={`w-4 h-4 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                                cancelReason === reason ? 'border-red-500 bg-red-500' : 'border-navy-300'
                                            }`}>
                                                {cancelReason === reason && <div className="w-1.5 h-1.5 rounded-full bg-white"></div>}
                                            </div>
                                            {reason}
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Detail Text Area */}
                        <div className="space-y-2">
                            <label className="block text-xs font-bold text-navy-700">
                                Additional details {cancelReason === 'Other reason' && <span className="text-red-500">*</span>}
                            </label>
                            <textarea
                                value={cancelDetails}
                                onChange={e => { setCancelDetails(e.target.value); setCancelError(''); }}
                                placeholder="Tell us more about why you need to cancel..."
                                rows={3}
                                className="w-full px-4 py-3 rounded-xl border border-navy-200 text-sm text-navy-800 placeholder:text-navy-300 focus:border-red-400 focus:ring-2 focus:ring-red-100 outline-none resize-none transition-all"
                            />
                        </div>

                        {/* Error */}
                        {cancelError && (
                            <div className="bg-red-50 border border-red-200 rounded-xl p-3 text-xs text-red-700 font-medium flex items-center gap-2">
                                <AlertTriangle size={14} className="text-red-500 shrink-0" />
                                {cancelError}
                            </div>
                        )}

                        {/* Warning */}
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-800">
                            <strong>Note:</strong> Once cancelled, you will need to create a new service request if you need help later.
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-3 pt-1">
                            <button
                                onClick={() => { setShowCancelModal(false); setCancelReason(''); setCancelDetails(''); setCancelError(''); }}
                                className="flex-1 py-3 px-4 rounded-xl bg-white hover:bg-navy-50 text-navy-700 border border-navy-200 font-bold text-xs transition-all"
                            >
                                Go Back
                            </button>
                            <button
                                onClick={handleCancelRequest}
                                disabled={isCancelling}
                                className="flex-1 py-3 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md shadow-red-600/20 transition-all flex items-center justify-center gap-2 disabled:opacity-60"
                            >
                                {isCancelling ? (
                                    <><Loader2 size={14} className="animate-spin" /> Cancelling...</>
                                ) : (
                                    <><XCircle size={14} /> Confirm Cancellation</>
                                )}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
