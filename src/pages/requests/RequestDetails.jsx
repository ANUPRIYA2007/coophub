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
    XCircle, AlertOctagon
} from 'lucide-react';
import OrderReceiptModal from '../../components/common/OrderReceiptModal';
import CoopHubServiceReceipt from '../../components/common/CoopHubServiceReceipt';
import { emailService } from '../../services/email/emailService';
import CustomerChatDrawer from '../../components/chat/CustomerChatDrawer';
import PillarProfileModal from '../../components/common/PillarProfileModal';

export default function RequestDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t, language } = useTranslation();
    const [requestData, setRequestData] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [invoiceData, setInvoiceData] = useState(null);
    const [paymentData, setPaymentData] = useState(null);
    const [pillarGps, setPillarGps] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
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
    const [dynamicDistance, setDynamicDistance] = useState(null);
    const [dynamicEta, setDynamicEta] = useState(null);
    const [showCompletionAnimation, setShowCompletionAnimation] = useState(false);
    const [showPaymentSuccessAnimation, setShowPaymentSuccessAnimation] = useState(false);
    const [activeView, setActiveView] = useState('receipt');
    const [emailSending, setEmailSending] = useState(false);
    const [emailSent, setEmailSent] = useState(false);

    // Cancel Request State
    const [showCancelModal, setShowCancelModal] = useState(false);
    const [cancelReason, setCancelReason] = useState('');
    const [cancelDetails, setCancelDetails] = useState('');
    const [isCancelling, setIsCancelling] = useState(false);
    const [cancelError, setCancelError] = useState('');

    useEffect(() => {
        if (requestData?.status === 'completed') {
            setActiveView('receipt');
        } else if (requestData) {
            setActiveView('journey');
        }
    }, [requestData?.status]);

    const handlePrint = () => {
        window.print();
    };

    const handleSendEmail = async () => {
        setEmailSending(true);
        try {
            const recipientEmail = requestData?.customer_email || 'customer@coophub.in';
            await emailService.sendServiceReceiptEmail({
                email: recipientEmail,
                customer_name: requestData?.customer_name || 'Coop Customer',
                receipt_no: `CH-2026-${id?.slice(0, 6)?.toUpperCase() || '000123'}`,
                booking_id: requestData?.booking_code || `BK-2026-${id?.slice(0, 5)?.toUpperCase() || '00456'}`,
                invoice_no: `INV-2026-${id?.slice(0, 6)?.toUpperCase() || '00789'}`,
                service_date: requestData?.preferred_date || '09 Sep 2026',
                service_time: requestData?.preferred_time || '02:00 PM',
                service_id: requestData?.service_code || (requestData?.services?.id ? (requestData.services.id === 'srv-1' ? 'SRV-ELEC-101' : requestData.services.id === 'srv-2' ? 'SRV-AC-202' : `SRV-${String(requestData.services.id).toUpperCase()}`) : 'SRV-AC-202'),
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
        setIsSelectingCash(true);
        try {
            const res = await paymentService.chooseHandCash(id, requestData?.customer_id);
            if (res.success) {
                const { invoice, payment } = await paymentService.getPaymentDetails(id);
                setInvoiceData(invoice);
                setPaymentData(payment);
                setRequestData(prev => prev ? ({ ...prev, payment_status: 'pending', payment_gateway_ref: 'HAND_CASH' }) : prev);
            } else {
                alert('Could not set hand cash: ' + (res.error || 'Server error'));
            }
        } catch (err) {
            console.error('Hand cash selection error:', err);
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

            // 2. Create Razorpay order via backend
            const { paymentGatewayAdapter } = await import('../../services/payment/paymentGatewayAdapter');
            const orderResult = await paymentGatewayAdapter.createGatewayOrder({
                invoiceId: invoice?.id || id,
                currency: 'INR',
                customer: { full_name: requestData?.customer_name },
                serviceName: requestData?.service?.name || requestData?.service_name || 'Cooperative Service',
                fallbackAmount: invoice?.total_amount || requestData?.total_amount
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
                    full_name: requestData?.customer_name,
                    email: requestData?.customer_email || '',
                    phone: requestData?.customer_mobile || ''
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
                amount: orderResult.amount, // Use the verified backend amount
                customerId: requestData?.customer_id,
                pillarId: requestData?.pillar_id
            });

            if (verifyResult.verified) {
                // Refresh payment & invoice data
                const { invoice: updatedInvoice, payment } = await paymentService.getPaymentDetails(id);
                setInvoiceData(updatedInvoice);
                setPaymentData(payment);
                
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

    useEffect(() => {
        let channel = null;

        const fetchRequest = async () => {
            try {
                const data = await serviceRequestService.getRequestDetails(id);
                setRequestData(data);

                // Set initial real pillar GPS if available
                const rawPLat = data.pillar?.current_lat != null ? data.pillar.current_lat : data.pillar?.lat;
                const rawPLng = data.pillar?.current_lng != null ? data.pillar.current_lng : data.pillar?.lng;
                if (rawPLat != null && rawPLng != null) {
                    setPillarGps({ lat: Number(rawPLat), lng: Number(rawPLng) });
                } else {
                    setPillarGps(null);
                }

                // Subscribe to realtime Pillar GPS telemetry if assigned
                if (data.pillar_id) {
                    channel = supabase
                        .channel(`pillar_gps_${data.pillar_id}_${Date.now()}`)
                        .on(
                            'postgres_changes',
                            { event: 'UPDATE', schema: 'public', table: 'pillar_profiles', filter: `id=eq.${data.pillar_id}` },
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
                }

                // Fetch real request history log
                const { data: hist } = await supabase
                    .from('request_status_history')
                    .select('*')
                    .eq('request_id', id)
                    .order('created_at', { ascending: true });
                setHistoryData(hist || []);

                // Fetch Payment / Invoice securely
                const { invoice, payment } = await paymentService.getPaymentDetails(id);
                setInvoiceData(invoice);
                setPaymentData(payment);
            } catch (err) {
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        fetchRequest();

        // Realtime Subscription on service_requests & bookings for immediate status transition
        const reqChannel = supabase
            .channel(`req_live_${id}_${Date.now()}`)
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'service_requests', filter: `id=eq.${id}` },
                (payload) => {
                    console.log("⚡ Live Request status change in Customer Portal:", payload.new);
                    fetchRequest();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'bookings', filter: `id=eq.${id}` },
                (payload) => {
                    fetchRequest();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'invoices', filter: `request_id=eq.${id}` },
                (payload) => {
                    console.log("⚡ Live Invoice update in Customer Portal:", payload.new);
                    fetchRequest();
                }
            )
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'payments', filter: `request_id=eq.${id}` },
                (payload) => {
                    console.log("⚡ Live Payment update in Customer Portal:", payload.new);
                    fetchRequest();
                }
            )
            .subscribe();

        return () => {
            if (channel) supabase.removeChannel(channel);
            if (reqChannel) supabase.removeChannel(reqChannel);
        };
    }, [id]);

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

    // Check if assigned with real pillar profile
    const isDemo = localStorage.getItem('coophub_demo_customer') === 'true' || localStorage.getItem('coophub_demo_user') === 'true';
    const isAssigned = ['assigned', 'accepted', 'on_the_way', 'arrived', 'in_progress', 'completed'].includes(requestData.status) || !!requestData.pillar;
    const pillar = requestData.pillar || null;

    // Extra Charge Decision Handler
    const handleExtraCharge = async (decision) => {
        try {
            const isDemo = localStorage.getItem('coophub_demo_customer') === 'true';
            if (!isDemo) {
                const { error: updErr } = await supabase
                    .from('service_requests')
                    .update({ extra_charge_status: decision })
                    .eq('id', id);
                if (updErr) throw updErr;
            }
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

    const CANCELLABLE_STATUSES = ['pending', 'assigned', 'accepted', 'on_the_way', 'arrived'];
    const canCancel = CANCELLABLE_STATUSES.includes(requestData?.status);

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
        switch (status) {
            case 'pending': return { text: t('Searching for Pillar'), bg: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
            case 'accepted': case 'assigned': return { text: t('Pillar Assigned'), bg: 'bg-blue-100 text-blue-800 border-blue-200' };
            case 'on_the_way': return { text: t('Pillar En Route'), bg: 'bg-orange-100 text-orange-800 border-orange-200' };
            case 'arrived': return { text: t('Pillar Arrived'), bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
            case 'in_progress': return { text: t('Service in Progress'), bg: 'bg-purple-100 text-purple-800 border-purple-200' };
            case 'completed': 
                if (invoiceData?.invoice_status === 'paid') {
                    return { text: t('Finally Completed'), bg: 'bg-emerald-100 text-emerald-800 border-emerald-500' };
                }
                return { text: t('Payment Pending'), bg: 'bg-orange-100 text-orange-800 border-orange-200' };
            case 'cancelled': return { text: t('Cancelled'), bg: 'bg-red-100 text-red-800 border-red-300' };
            default: return { text: t(status.replace(/_/g, ' ')), bg: 'bg-navy-100 text-navy-800 border-navy-200' };
        }
    };

    const getStepperProgress = () => {
        if (!requestData) return -1;
        if (invoiceData?.invoice_status === 'paid') return 6;
        if (requestData.status === 'completed') return 5;
        if (requestData.status === 'in_progress') return 4;
        if (requestData.status === 'arrived') return 3;
        if (requestData.status === 'on_the_way') return 2;
        if (['assigned', 'accepted'].includes(requestData.status)) return 1;
        return 0; // pending
    };
    
    const stepperIndex = getStepperProgress();
    const journeySteps = [
        { label: 'Assigned', idx: 1 },
        { label: 'En Route', idx: 2 },
        { label: 'Arrived', idx: 3 },
        { label: 'Working', idx: 4 },
        { label: 'Completed', idx: 5 },
        { label: 'Paid', idx: 6 }
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
                                    Order: #{requestData.booking_code || requestData.order_code || (String(requestData.id).startsWith('REQ-') || String(requestData.id).startsWith('ORD-') ? requestData.id : `ORD-${String(requestData.id).slice(0, 8).toUpperCase()}`)}
                                </span>
                                <span className="text-navy-300 text-[10px]">•</span>
                                <span className="text-[10px] font-mono font-bold text-navy-600 bg-navy-50 px-1.5 py-0.5 rounded border border-navy-100">
                                    Service ID: {requestData.service_code || (requestData.services?.id ? (requestData.services.id === 'srv-1' ? 'SRV-ELEC-101' : requestData.services.id === 'srv-2' ? 'SRV-AC-202' : `SRV-${String(requestData.services.id).toUpperCase()}`) : 'SRV-ELEC-101')}
                                </span>
                            </div>
                        </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${currentBadge.bg}`}>
                        {currentBadge.text}
                    </span>
                </header>

                {/* ─── VIEW SWITCHER FOR COMPLETED BOOKINGS ─── */}
                {requestData.status === 'completed' && (
                    <div className="flex bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl border border-navy-100 dark:border-slate-700 shadow-2xs">
                        <button
                            type="button"
                            onClick={() => setActiveView('receipt')}
                            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                activeView === 'receipt'
                                    ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                                    : 'text-navy-600 dark:text-slate-400 hover:text-navy-900'
                            }`}
                        >
                            <FileText size={15} />
                            <span>Official Service Receipt</span>
                        </button>
                        <button
                            type="button"
                            onClick={() => setActiveView('journey')}
                            className={`flex-1 py-2.5 px-4 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer ${
                                activeView === 'journey'
                                    ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
                                    : 'text-navy-600 dark:text-slate-400 hover:text-navy-900'
                            }`}
                        >
                            <Navigation size={15} />
                            <span>Service Journey History</span>
                        </button>
                    </div>
                )}

                {/* ─── OFFICIAL SERVICE RECEIPT (DEFAULT FOR COMPLETED REQUESTS) ─── */}
                {requestData.status === 'completed' && activeView === 'receipt' && (
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

                        {/* Official Receipt Card */}
                        <CoopHubServiceReceipt
                            order={{
                                ...requestData,
                                id: id,
                                booking_code: requestData?.booking_code || requestData?.order_code || (String(id).startsWith('REQ-') || String(id).startsWith('ORD-') ? id : `ORD-${String(id).slice(0, 6).toUpperCase()}`),
                                service_name: serviceName,
                                sub_service_name: subServiceName,
                                service_id: requestData?.service_code || (requestData?.services?.id ? (requestData.services.id === 'srv-1' ? 'SRV-ELEC-101' : requestData.services.id === 'srv-2' ? 'SRV-AC-202' : `SRV-${String(requestData.services.id).toUpperCase()}`) : 'SRV-AC-202'),
                                customer_name: requestData?.customer_name || 'Coop Customer',
                                customer_mobile: requestData?.customer_mobile || '+91 98401 23456',
                                service_address: requestData?.address_line || 'Velachery, Chennai',
                                base_amount: requestData?.amount || 450,
                                extra_charge_amount: requestData?.extra_charge_amount || 500,
                                extra_charge_reason: requestData?.extra_charge_reason || '',
                                total_amount: requestData?.final_amount || 950,
                                final_amount: requestData?.final_amount || 950,
                                scheduled_date: requestData?.preferred_date || '09 Sep 2026',
                                scheduled_time: requestData?.preferred_time || '02:00 PM',
                                payment_method: 'Online Payment (UPI)',
                                payment_status: 'PAID',
                                pillar: pillar
                            }}
                        />

                        {/* Customer Rating & Review */}
                        <ReviewForm requestId={id} pillarId={requestData?.pillar_id || pillar?.id} />
                    </div>
                )}

                {/* ─── LIVE TRACKING / JOURNEY CONTENT (SHOWN WHEN ACTIVE OR JOURNEY TAB SELECTED) ─── */}
                {(requestData.status !== 'completed' || activeView === 'journey') && (
                    <div className="space-y-6 animate-fade-in">

                {/* ─── LIVE STATUS JOURNEY STEPPER ─── */}
                {requestData.status !== 'cancelled' && (
                    <div className="bg-white rounded-3xl p-6 border border-navy-100 shadow-sm mb-4 overflow-hidden">
                        <h3 className="font-bold text-navy-900 text-sm mb-4">Live Service Journey</h3>
                        <div className="relative flex justify-between items-center w-full px-4 sm:px-8">
                            <div className="absolute left-8 right-8 top-1/2 -translate-y-1/2 h-1 bg-navy-50 rounded-full z-0"></div>
                            <div 
                                className="absolute left-8 top-1/2 -translate-y-1/2 h-1 bg-orange-500 rounded-full z-0 transition-all duration-500" 
                                style={{ width: `calc(${Math.max(0, (Math.min(stepperIndex, 6) - 1) * 20)}% - 2rem)` }}
                            ></div>
                            {journeySteps.map((step) => {
                                const isCompleted = stepperIndex >= step.idx;
                                const isCurrent = stepperIndex === step.idx;
                                return (
                                    <div key={step.idx} className="relative z-10 flex flex-col items-center group">
                                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shadow-sm ${
                                            isCompleted ? 'bg-orange-500 border-orange-500 text-white' : 'bg-white border-navy-200 text-transparent'
                                        } ${isCurrent ? 'ring-4 ring-orange-500/20' : ''}`}>
                                            {isCompleted && <CheckCircle2 size={12} />}
                                        </div>
                                        <span className={`absolute top-8 text-[9px] font-bold uppercase tracking-wide hidden sm:block whitespace-nowrap ${
                                            isCurrent ? 'text-orange-600' : isCompleted ? 'text-navy-900' : 'text-navy-300'
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

                {/* ─── CANCELLED STATUS BANNER ─── */}
                {requestData.status === 'cancelled' && (
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

                {/* ─── ARRIVAL OTP CARD (Displayed when Assigned, En Route, or Arrived) ─── */}
                {['assigned', 'accepted', 'on_the_way', 'arrived'].includes(requestData.status) && (
                    <div className={`rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden animate-fade-in ${
                        requestData.status === 'arrived' 
                            ? 'bg-gradient-to-r from-emerald-950 via-navy-950 to-emerald-950 border-2 border-emerald-500/60 ring-4 ring-emerald-500/20' 
                            : 'bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 border border-orange-500/30'
                    }`}>
                        <div className="absolute top-0 right-0 w-40 h-40 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3 text-orange-400 font-bold">
                                <div className={`w-9 h-9 rounded-full flex items-center justify-center ${requestData.status === 'arrived' ? 'bg-emerald-500 text-white animate-bounce' : 'bg-orange-500/20 text-orange-400'}`}>
                                    {requestData.status === 'arrived' ? <CheckCircle2 size={20} /> : <ShieldCheck size={20} />}
                                </div>
                                <div>
                                    <span className="text-base sm:text-lg text-white font-bold block">
                                        {requestData.status === 'arrived' ? `🎉 ${t("Technician Arrived at Doorstep!")}` : `🔐 ${t("Secure Arrival Verification PIN")}`}
                                    </span>
                                    <span className="text-[11px] text-orange-300 font-normal">
                                        {requestData.status === 'arrived' ? t("Share this PIN with Pillar to start job") : t("Provide this code to technician upon arrival")}
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

                    <div className="grid grid-cols-2 gap-4 text-xs">
                        <div>
                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                <p className="text-navy-400 font-medium">Service Type</p>
                                <span className="font-mono text-[10px] font-bold text-navy-600 bg-navy-50 px-1.5 py-0.5 rounded border border-navy-100">
                                    Service ID: {requestData.service_id ? (requestData.service_id.length > 12 ? 'SRV-' + requestData.service_id.slice(0, 8).toUpperCase() : requestData.service_id) : 'SRV-ELEC-101'}
                                </span>
                            </div>
                            <p className="font-bold text-navy-800 text-sm">{serviceName}</p>
                            {subServiceName && <p className="text-navy-600 mt-0.5">{subServiceName}</p>}
                        </div>

                        <div>
                            <p className="text-navy-400 font-medium mb-1">Scheduled Time</p>
                            <p className="font-bold text-navy-800 text-sm">
                                {requestData.flexible_timing ? 'Flexible Timing' : `${requestData.preferred_date || 'Today'} • ${requestData.preferred_time || '10:30 AM'}`}
                            </p>
                        </div>
                    </div>

                    {requestData.customer_description && (
                        <div className="bg-navy-50/50 rounded-2xl p-4 text-xs">
                            <p className="text-navy-400 font-medium mb-1">Customer Problem Notes</p>
                            <p className="text-navy-700 leading-relaxed">{requestData.customer_description}</p>
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

                {/* ─── INVOICE & PAYMENT SUMMARY ─── */}
                {(requestData.status === 'completed' || invoiceData) && (
                    <div className="bg-white rounded-3xl p-6 border border-navy-100 shadow-sm space-y-4">
                        {showCompletionAnimation && invoiceData?.invoice_status !== 'paid' && (
                            <div className="bg-orange-50 border border-orange-200 rounded-2xl p-4 text-center animate-pulse mb-4">
                                <h3 className="text-lg font-bold text-orange-600">🎉 Service Completed!</h3>
                                <p className="text-xs text-orange-700 mt-1">Your service work has been completed. Preparing your final bill...</p>
                            </div>
                        )}
                        {showPaymentSuccessAnimation && (
                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 text-center animate-fade-in mb-4">
                                <h3 className="text-lg font-bold text-emerald-600 flex items-center justify-center gap-2"><CheckCircle2 size={20}/> Payment Collected</h3>
                                <p className="text-xs text-emerald-700 mt-1">Payment successfully received. Stay connected with COOP HUB.</p>
                            </div>
                        )}
                        {(() => {
                            const isPaymentDone = invoiceData?.invoice_status === 'paid' || requestData?.payment_status === 'completed';
                            const isHandCashSelected = (paymentData?.payment_method === 'HAND CASH' || requestData?.payment_gateway_ref === 'HAND_CASH');

                            return (
                                <>
                                    <div className="flex items-center justify-between border-b border-navy-50 pb-3">
                                        <h3 className="font-bold text-navy-900 text-base flex items-center gap-2">
                                            <FileText size={18} className="text-orange-500" />
                                            Invoice & Payment Summary
                                        </h3>
                                        <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                                            isPaymentDone 
                                                ? 'bg-green-100 text-green-800 border-green-200' 
                                                : (isHandCashSelected ? 'bg-amber-100 text-amber-800 border-amber-300' : 'bg-orange-100 text-orange-800 border-orange-200')
                                        }`}>
                                            {isPaymentDone ? 'PAID' : (isHandCashSelected ? 'PENDING CASH CONFIRMATION' : 'PAYMENT READY')}
                                        </span>
                                    </div>
                                    <div className="space-y-2.5 text-xs">
                                        <div className="flex justify-between text-navy-600">
                                            <span>Base Service Charge</span>
                                            <span className="font-mono font-medium">₹{requestData.amount || invoiceData?.base_amount || 450}</span>
                                        </div>
                                        {Number(requestData.extra_charge_amount) > 0 && (
                                            <div className="flex justify-between text-orange-700 font-medium bg-orange-50/80 p-3 rounded-2xl border border-orange-200">
                                                <div>
                                                    <span className="block font-bold text-orange-950">Additional Parts & Work (Verified by Pillar)</span>
                                                    <span className="text-[11px] text-orange-800/80 mt-0.5 block">{requestData.extra_charge_reason || 'Extra parts & labor added during inspection'}</span>
                                                </div>
                                                <span className="font-mono font-bold text-sm text-orange-600 shrink-0 ml-3">+ ₹{requestData.extra_charge_amount}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between pt-3 border-t border-navy-100 text-sm font-bold text-navy-900">
                                            <span>Grand Total</span>
                                            <span className="font-mono text-base text-orange-600">
                                                ₹{Number(requestData.final_amount || invoiceData?.total_amount || (Number(requestData.amount || 450) + Number(requestData.extra_charge_amount || 0)))}
                                            </span>
                                        </div>
                                    </div>

                                    {!isPaymentDone && (
                                        <div className="space-y-3 pt-1">
                                            {isHandCashSelected && (
                                                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 text-xs space-y-1.5 animate-fade-in">
                                                    <div className="flex items-center gap-2 font-bold text-amber-900">
                                                        <Banknote size={16} className="text-amber-600" />
                                                        <span>Hand Cash Selected</span>
                                                        <span className="ml-auto px-2 py-0.5 rounded-full bg-amber-200 text-amber-900 text-[10px] uppercase font-bold">
                                                            Pending Pillar Confirmation
                                                        </span>
                                                    </div>
                                                    <p className="text-amber-800 leading-relaxed">
                                                        Please hand <strong>₹{Number(requestData.final_amount || invoiceData?.total_amount || 450)}</strong> in cash to your technician. Once the technician confirms receipt, your receipt will be available immediately.
                                                    </p>
                                                </div>
                                            )}

                                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                                <button
                                                    onClick={handleSelectHandCash}
                                                    disabled={isSelectingCash || (isHandCashSelected && paymentData?.payment_status === 'pending')}
                                                    className={`py-3 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-xs ${
                                                        isHandCashSelected
                                                            ? 'bg-amber-100 text-amber-950 border-amber-300'
                                                            : 'bg-white hover:bg-slate-50 text-navy-800 border-navy-200'
                                                    }`}
                                                >
                                                    <Banknote size={16} className={isHandCashSelected ? 'text-amber-600' : 'text-navy-600'} />
                                                    <span>{isSelectingCash ? "Setting Cash..." : (isHandCashSelected ? "✓ Hand Cash Selected" : "Pay with Hand Cash")}</span>
                                                </button>

                                                <button
                                                    onClick={handleInitiatePayment}
                                                    disabled={isPaying}
                                                    className="btn-primary py-3 px-3 text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                                                >
                                                    <CreditCard size={16} />
                                                    <span>{isPaying ? "Processing..." : "Pay Online (Razorpay)"}</span>
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                    {isPaymentDone && (
                                        <div className="space-y-2 pt-1">
                                            <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 flex items-center justify-between text-xs text-emerald-900 font-medium">
                                                <div className="flex items-center gap-2">
                                                    <CheckCircle2 size={16} className="text-emerald-600" />
                                                    <span>Payment Confirmed ({paymentData?.payment_method || (requestData?.payment_gateway_ref === 'HAND_CASH' ? 'HAND CASH' : 'Online UPI')})</span>
                                                </div>
                                                <span className="font-bold uppercase tracking-wider text-[11px] bg-emerald-200 text-emerald-900 px-2 py-0.5 rounded-full">
                                                    PAID
                                                </span>
                                            </div>
                                            <button
                                                onClick={() => setShowReceiptModal(true)}
                                                className="btn-secondary w-full py-3 text-xs flex items-center justify-center gap-2 font-bold"
                                            >
                                                <FileText size={16} />
                                                <span>View Official Tax Receipt</span>
                                            </button>
                                        </div>
                                    )}
                                </>
                            );
                        })()}
                    </div>
                )}

                {/* ─── OPTIONAL RATING & FEEDBACK ─── */}
                {requestData.status === 'completed' && (
                    <ReviewForm requestId={id} pillarId={requestData?.pillar_id || requestData?.pillar?.id} />
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
                        service_name: requestData?.service?.name || requestData?.service_name || 'Home Service',
                        sub_service_name: requestData?.sub_service?.name || requestData?.sub_service_name || '',
                        customer_name: requestData?.customer_name || 'Coop Customer',
                        customer_mobile: requestData?.customer_mobile || '+91 98401 23456',
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
