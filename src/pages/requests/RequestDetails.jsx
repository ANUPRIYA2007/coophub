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
    CreditCard, ArrowLeft, Sparkles
} from 'lucide-react';

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
    const [isPaying, setIsPaying] = useState(false);

    const handleInitiatePayment = () => {
        setShowCheckoutModal(true);
    };

    const handleConfirmPayment = async () => {
        setIsPaying(true);
        try {
            await paymentService.processPayment(id, { method: 'upi', amount: invoiceData?.total_amount || 450 });
            const { invoice, payment } = await paymentService.getPaymentDetails(id);
            setInvoiceData(invoice);
            setPaymentData(payment);
            setShowCheckoutModal(false);
        } catch (err) {
            alert('Payment processing note: ' + (err.message || 'Payment recorded.'));
            setShowCheckoutModal(false);
        } finally {
            setIsPaying(false);
        }
    };

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
                        .channel(`pillar_gps_${data.pillar_id}`)
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

        return () => {
            if (channel) {
                supabase.removeChannel(channel);
            }
        };
    }, [id]);

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

    // Check if assigned with real pillar profile
    const isDemo = localStorage.getItem('coophub_demo_customer') === 'true' || localStorage.getItem('coophub_demo_user') === 'true';
    const isAssigned = ['assigned', 'accepted', 'on_the_way', 'arrived', 'in_progress', 'completed'].includes(requestData.status) || !!requestData.pillar;
    const pillar = requestData.pillar || (isDemo ? {
        id: "PIL-CHE-042",
        full_name: "Raj Kumar (Demo)",
        role: "Certified Professional",
        rating: 4.9,
        reviews_count: 128,
        distance_km: "1.2",
        eta_mins: "8"
    } : null);

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

    const statusBadge = (status) => {
        switch (status) {
            case 'pending': return { text: 'Searching for Pillar', bg: 'bg-yellow-100 text-yellow-800 border-yellow-200' };
            case 'accepted': case 'assigned': return { text: 'Pillar Assigned', bg: 'bg-blue-100 text-blue-800 border-blue-200' };
            case 'on_the_way': return { text: 'Pillar En Route', bg: 'bg-orange-100 text-orange-800 border-orange-200' };
            case 'arrived': return { text: 'Pillar Arrived', bg: 'bg-emerald-100 text-emerald-800 border-emerald-200' };
            case 'in_progress': return { text: 'Service in Progress', bg: 'bg-purple-100 text-purple-800 border-purple-200' };
            case 'completed': return { text: 'Service Completed', bg: 'bg-green-100 text-green-800 border-green-200' };
            case 'cancelled': return { text: 'Cancelled', bg: 'bg-red-100 text-red-800 border-red-200' };
            default: return { text: status.replace(/_/g, ' '), bg: 'bg-navy-100 text-navy-800 border-navy-200' };
        }
    };

    const currentBadge = statusBadge(requestData.status);

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
                            <h1 className="font-bold text-navy-900 text-base leading-tight">Request Tracker</h1>
                            <p className="text-[11px] font-mono text-navy-400">ID: {requestData.id.split('-')[0]}</p>
                        </div>
                    </div>

                    <span className={`px-3 py-1 rounded-full text-xs font-bold border uppercase tracking-wide ${currentBadge.bg}`}>
                        {currentBadge.text}
                    </span>
                </header>

                {/* ─── ARRIVAL OTP ALERT BANNER (If Arrived) ─── */}
                {requestData.status === 'arrived' && requestData.arrival_otp && (
                    <div className="bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 border border-emerald-500/30 rounded-3xl p-6 shadow-2xl text-white relative overflow-hidden animate-fade-in">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>
                        <div className="flex items-center space-x-3 text-emerald-400 font-bold mb-2">
                            <div className="w-8 h-8 rounded-full bg-emerald-500/20 flex items-center justify-center">
                                <CheckCircle2 size={18} />
                            </div>
                            <span className="text-base sm:text-lg">Your Pillar has arrived!</span>
                        </div>
                        <p className="text-xs sm:text-sm text-navy-200 mb-4 max-w-md">
                            Share this secure 6-digit Arrival PIN with your technician to verify identity and start your service safely.
                        </p>
                        <div className="inline-flex items-center space-x-3 bg-black/50 border border-white/10 px-6 py-3 rounded-2xl">
                            <span className="text-xs text-navy-400 font-medium uppercase tracking-wider">Arrival PIN:</span>
                            <span className="font-mono text-3xl font-extrabold tracking-widest text-orange-400 select-all">
                                {requestData.arrival_otp}
                            </span>
                        </div>
                    </div>
                )}

                {/* ─── ASSIGNED PILLAR CARD (If Assigned) ─── */}
                {isAssigned && pillar && (
                    <div className="bg-white rounded-3xl p-6 border border-navy-100 shadow-sm relative overflow-hidden">
                        <div className="flex items-start justify-between mb-4">
                            <div className="flex items-center space-x-4">
                                <div className="w-14 h-14 rounded-2xl bg-orange-100 border-2 border-orange-300 p-0.5 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
                                    <img
                                        src="/assets/images/mascot-hero.png"
                                        alt={pillar.full_name || "Pillar"}
                                        className="w-full h-full object-cover rounded-xl"
                                        onError={(e) => { e.target.src = '/src/assets/branding/mascot-ai.png'; }}
                                    />
                                </div>
                                <div>
                                    <div className="flex items-center space-x-2">
                                        <h3 className="font-bold text-navy-900 text-lg leading-tight">{pillar.full_name || "Coop Technician"}</h3>
                                        <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-green-50 text-green-700 border border-green-200">
                                            <ShieldCheck size={12} /> Verified
                                        </span>
                                    </div>
                                    <p className="text-xs text-navy-500 font-medium">{pillar.role || "Certified Cooperative Technician"}</p>
                                    <div className="flex items-center space-x-2 mt-1 text-xs text-navy-600">
                                        <span className="flex items-center text-amber-500 font-bold">
                                            <Star size={13} className="fill-amber-400 text-amber-400 mr-1" />
                                            {pillar.rating || 5.0}
                                        </span>
                                        <span className="text-navy-300">•</span>
                                        <span className="text-navy-500">Cooperative Verified</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Quick Contact Buttons */}
                        <div className="grid grid-cols-2 gap-3 pt-3 border-t border-navy-50">
                            <button
                                onClick={() => navigate(`/requests/${id}/chat`)}
                                className="flex items-center justify-center space-x-2 py-2.5 px-4 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 text-xs font-bold transition-all shadow-xs"
                            >
                                <MessageSquare size={16} />
                                <span>Message Pillar</span>
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

                {/* ─── LIVE GOOGLE MAPS TRACKING / SERVICE LOCATION CARD ─── */}
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
                                    {[requestData.address_line, requestData.area, requestData.city].filter(Boolean).join(', ') || 'Current Geolocation Bounds'}
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
                            <p className="text-navy-400 font-medium mb-1">Service Type</p>
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

                {/* ─── INVOICE & PAYMENT SUMMARY ─── */}
                {(requestData.status === 'completed' || invoiceData) && (
                    <div className="bg-white rounded-3xl p-6 border border-navy-100 shadow-sm space-y-4">
                        <div className="flex items-center justify-between border-b border-navy-50 pb-3">
                            <h3 className="font-bold text-navy-900 text-base flex items-center gap-2">
                                <FileText size={18} className="text-orange-500" />
                                Invoice & Payment Summary
                            </h3>
                            <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-800 border border-green-200">
                                {invoiceData?.invoice_status === 'paid' ? 'PAID' : 'PAYMENT READY'}
                            </span>
                        </div>

                        <div className="space-y-2.5 text-xs">
                            <div className="flex justify-between text-navy-600">
                                <span>Base Service Charge</span>
                                <span className="font-mono font-medium">₹{invoiceData?.total_amount || 1000}</span>
                            </div>
                            {requestData.extra_charge_status === 'accepted' && (
                                <div className="flex justify-between text-orange-600 font-medium">
                                    <span>Approved Extra Charges ({requestData.extra_charge_reason || 'Parts'})</span>
                                    <span className="font-mono">+ ₹{requestData.extra_charge_amount || 500}</span>
                                </div>
                            )}
                            <div className="flex justify-between pt-3 border-t border-navy-100 text-sm font-bold text-navy-900">
                                <span>Grand Total</span>
                                <span className="font-mono text-base text-orange-600">
                                    ₹{Number(invoiceData?.total_amount || 1000) + (requestData.extra_charge_status === 'accepted' ? Number(requestData.extra_charge_amount || 0) : 0)}
                                </span>
                            </div>
                        </div>

                        {invoiceData?.invoice_status !== 'paid' && (
                            <button
                                onClick={handleInitiatePayment}
                                disabled={isPaying}
                                className="btn-primary w-full py-3 text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
                            >
                                <CreditCard size={16} />
                                <span>{isPaying ? "Processing..." : "Proceed to Payment"}</span>
                            </button>
                        )}
                    </div>
                )}

                {/* ─── OPTIONAL RATING & FEEDBACK ─── */}
                {requestData.status === 'completed' && (
                    <ReviewForm requestId={id} />
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

            {/* ─── INVOICE MODAL ─── */}
            {showInvoiceModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl border border-navy-100 space-y-4 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-start border-b border-navy-100 pb-3">
                            <div>
                                <span className="text-[10px] font-bold uppercase text-orange-600">Official Tax Invoice</span>
                                <h3 className="font-bold text-navy-900 text-lg">{invoiceData?.invoice_number || `INV-${id?.slice(0, 6)}`}</h3>
                            </div>
                            <button onClick={() => setShowInvoiceModal(false)} className="text-navy-400 hover:text-navy-600 font-bold">✕</button>
                        </div>
                        <div className="flex gap-2 pt-2">
                            <button onClick={() => window.print()} className="btn-secondary flex-1 py-2 text-xs font-bold">Print</button>
                            <button onClick={() => setShowInvoiceModal(false)} className="btn-primary flex-1 py-2 text-xs font-bold">Done</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── RECEIPT MODAL ─── */}
            {showReceiptModal && (
                <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
                    <div className="bg-white rounded-3xl p-6 max-w-sm w-full shadow-2xl border border-navy-100 text-center space-y-4">
                        <div className="w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                            <CheckCircle2 size={32} />
                        </div>
                        <h3 className="font-bold text-navy-900 text-lg mt-2">Payment Cleared</h3>
                        <button onClick={() => setShowReceiptModal(false)} className="btn-primary w-full py-2.5 text-xs font-bold">Close</button>
                    </div>
                </div>
            )}
        </div>
    );
}
