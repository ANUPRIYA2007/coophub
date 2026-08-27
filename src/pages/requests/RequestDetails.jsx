import { useParams, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { serviceRequestService } from '../../services/customer/serviceRequestService';
import { paymentService } from '../../services/customer/paymentService';
import { useTranslation } from '../../hooks/useTranslation';
import { supabase } from '../../lib/supabase';
import ReviewForm from '../../components/reviews/ReviewForm';

export default function RequestDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [requestData, setRequestData] = useState(null);
    const [historyData, setHistoryData] = useState([]);
    const [invoiceData, setInvoiceData] = useState(null);
    const [paymentData, setPaymentData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);


    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const data = await serviceRequestService.getRequestDetails(id);
                setRequestData(data);

                // Fetch dynamic real request history log (Zero-Mock Requirement)
                const { data: hist } = await supabase.from('request_status_history').select('*').eq('request_id', id).order('created_at', { ascending: true });
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
    }, [id]);

    if (loading) return <div className="p-10 text-center animate-pulse">Loading status...</div>;

    if (error || !requestData) return (
        <div className="p-10 text-center">
            <h2 className="text-danger-600 font-semibold mb-2">Error Loading Request</h2>
            <p className="text-muted text-sm">{error || 'Request not found.'}</p>
            <button onClick={() => navigate('/home')} className="btn-primary mt-6">Go Home</button>
        </div>
    );

    // Extract dynamic mapping from JSONB properly checking translations
    const serviceName = requestData.services?.name_translations?.[t('language_code')] || requestData.services?.name_translations?.['en'] || 'Unknown Service';
    const subServiceName = requestData.sub_services?.name_translations?.[t('language_code')] || requestData.sub_services?.name_translations?.['en'] || '';

    // Check if assignments tracking block should technically appear
    const isAssigned = ['assigned', 'accepted', 'on_the_way', 'arrived', 'in_progress', 'completed'].includes(requestData.status);

    // Explicit Action Handlers (ZERO MOCKS)
    const handleExtraCharge = async (decision) => {
        try {
            const { error: updErr } = await supabase.from('service_requests')
                .update({ extra_charge_status: decision })
                .eq('id', id);
            if (updErr) throw updErr;
            setRequestData(prev => ({ ...prev, extra_charge_status: decision }));
            alert(decision === 'accepted' ? 'Extra charge approved successfully.' : 'Extra charge rejected.');
        } catch (err) {
            alert('Failed to process decision: ' + err.message);
        }
    };

    return (
        <div className="min-h-screen bg-surface pb-24 pt-6 px-4">
            <div className="max-w-2xl mx-auto">
                {/* Unified Sticky Header */}
                <header className="bg-white sticky top-0 z-40 border-b border-navy-100/50 shadow-sm px-4 py-3 flex items-center justify-between -mx-4 -mt-6 mb-6">
                    <div className="flex items-center">
                        <button onClick={() => navigate('/requests')} className="mr-3 text-navy-500 hover:text-orange-500 transition-colors">
                            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                        </button>
                        <h1 className="font-bold text-navy-800 text-lg">Request Tracker</h1>
                    </div>
                    {isAssigned && (
                        <div className="flex items-center space-x-2">
                            <button onClick={() => alert('Privacy Calling Service is not yet configured by admin.')} className="btn-secondary py-1.5 px-3 shadow-sm flex items-center space-x-1.5 text-xs bg-white hover:bg-orange-50 hover:border-orange-200">
                                <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
                                <span className="hidden sm:inline">Call Pillar</span>
                            </button>
                            <button onClick={() => navigate(`/requests/${id}/chat`)} className="btn-secondary py-1.5 px-3 shadow-sm flex items-center space-x-1.5 text-xs bg-white hover:bg-orange-50 hover:border-orange-200">
                                <svg className="w-4 h-4 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" /></svg>
                                <span className="hidden sm:inline">Message Pillar</span>
                            </button>
                        </div>
                    )}
                </header>

                <div className="card p-6 shadow-xl shadow-navy-500/5 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-orange-500/10 rounded-full blur-3xl -mr-10 -mt-10"></div>

                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h1 className="heading-3 mb-1">{t('booking.success_title')}</h1>
                            <p className="text-sm text-navy-500 font-mono">ID: {requestData.id.split('-')[0]}</p>
                        </div>
                        <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider">
                            {requestData.status}
                        </span>
                    </div>

                    <div className="grid gap-4 bg-white/50 border border-navy-100 rounded-2xl p-5 relative z-10">
                        <div>
                            <p className="text-xs text-muted mb-0.5">Service Requested</p>
                            <p className="font-semibold text-navy-800">{serviceName} {subServiceName ? `› ${subServiceName}` : ''}</p>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-xs text-muted mb-0.5">Status Message</p>
                                <p className="font-medium text-navy-700">{t('booking.status_requested')}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted mb-0.5">Schedule</p>
                                <p className="font-medium text-navy-700">
                                    {requestData.flexible_timing ? 'Flexible Timing' : `${requestData.preferred_date} at ${requestData.preferred_time}`}
                                </p>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs text-muted mb-0.5">Location</p>
                            <p className="font-medium text-navy-700">
                                {requestData.location_type === 'geolocation'
                                    ? `Coord: ${requestData.latitude}, ${requestData.longitude}`
                                    : [requestData.address_line, requestData.city].filter(Boolean).join(', ')}
                            </p>
                        </div>
                    </div>

                    {/* Timeline Tracker (Module 4) generated natively via history array */}
                    <div className="mt-8 bg-white border border-navy-100 rounded-2xl p-6 shadow-sm">
                        <h3 className="font-semibold text-navy-800 mb-5">Request Lifecycle</h3>
                        <div className="space-y-6 relative before:absolute before:inset-0 before:ml-5 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-navy-200 before:to-transparent">
                            {historyData.map((hist, index) => (
                                <div key={hist.id} className="relative flex items-center md:items-start justify-between md:justify-normal md:odd:flex-row-reverse group select-none">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-orange-500 shadow-md shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                        <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-navy-50 p-4 rounded-xl border border-navy-100 md:group-odd:text-right">
                                        <p className="font-semibold text-navy-800 capitalize mb-1">{hist.status.replace('_', ' ')}</p>
                                        <p className="text-xs text-navy-500 font-mono">{new Date(hist.created_at).toLocaleString()}</p>
                                    </div>
                                </div>
                            ))}
                            {/* Dynamically pulse the bottom of the timeline if the request is still active */}
                            {requestData.status !== 'completed' && requestData.status !== 'cancelled' && (
                                <div className="relative flex items-center md:items-start justify-between md:justify-normal md:odd:flex-row-reverse group select-none opacity-50">
                                    <div className="flex items-center justify-center w-10 h-10 rounded-full border-4 border-white bg-navy-200 shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                                        <div className="w-2 h-2 rounded-full bg-navy-400 animate-pulse"></div>
                                    </div>
                                    <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] p-4 md:group-odd:text-right">
                                        <p className="text-sm font-medium text-navy-500 italic">Waiting for update...</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Pillar Assignment Sub-Section (Module 5) */}
                    {isAssigned && (
                        <div className="mt-6 bg-orange-50 border border-orange-100 rounded-2xl p-6 shadow-inner relative flex flex-col pt-5">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-orange-900 z-10 flex items-center">
                                    <svg className="w-5 h-5 mr-2 text-orange-600" fill="currentColor" viewBox="0 0 20 20"><path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" /><path fillRule="evenodd" d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z" clipRule="evenodd" /></svg>
                                    Live Tracking Info
                                </h3>
                            </div>

                            {/* Live Geolocation Native Output Wrapper */}
                            <div className="bg-white/60 border border-orange-200 rounded-xl p-4 mb-4">
                                {requestData.latitude && requestData.longitude ? (
                                    <div className="flex items-center space-x-3 text-sm text-navy-800">
                                        <div className="p-2 bg-orange-100 text-orange-600 rounded-full">
                                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                                        </div>
                                        <div>
                                            <p className="font-semibold text-orange-900">Live Target Area</p>
                                            <p className="font-mono text-orange-700/80 text-xs">LAT: {requestData.latitude} | LNG: {requestData.longitude}</p>
                                        </div>
                                    </div>
                                ) : (
                                    <p className="text-sm text-orange-800 italic">No GPS coordinates pinned for this request bounds.</p>
                                )}
                                <div className="mt-3 text-xs text-orange-600 bg-orange-50 px-3 py-2 rounded border border-orange-100 flex items-center">
                                    <span className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse mr-2"></span>
                                    Pillar live approach vector is currently masked or natively unavailable until further transit API integration.
                                </div>
                            </div>

                            {/* Secure Arrival OTP (Module 10) */}
                            {requestData.status === 'arrived' && requestData.arrival_otp && (
                                <div className="bg-navy-900 border border-navy-800 rounded-xl p-5 shadow-lg flex flex-col sm:flex-row items-center justify-between text-white">
                                    <div className="mb-3 sm:mb-0">
                                        <div className="flex items-center space-x-2 text-green-400 font-semibold mb-1">
                                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                                            <span>Your Pillar has arrived!</span>
                                        </div>
                                        <p className="text-sm text-navy-300">Share this secure PIN with the Pillar to begin the service securely.</p>
                                    </div>
                                    <div className="bg-black/40 px-6 py-3 rounded-lg border border-white/10 tracking-widest font-mono text-2xl font-bold text-orange-400 select-all">
                                        {requestData.arrival_otp}
                                    </div>
                                </div>
                            )}

                            {/* Extra Charges Module (Module 11) */}
                            {requestData.extra_charge_status === 'pending' && requestData.extra_charge_amount > 0 && (
                                <div className="bg-red-50 border-l-4 border-red-500 p-5 mt-4 shadow-sm">
                                    <h4 className="font-bold text-red-900 flex items-center mb-2">
                                        <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                                        Additional Charge Requested
                                    </h4>
                                    <div className="text-sm text-red-800 mb-4">
                                        <p className="mb-1"><span className="font-semibold">Reason:</span> {requestData.extra_charge_reason}</p>
                                        <p><span className="font-semibold">Amount:</span> <span className="font-mono text-red-900 bg-red-100 px-2 py-0.5 rounded">INR {requestData.extra_charge_amount}</span></p>
                                    </div>
                                    <div className="flex space-x-3">
                                        <button onClick={() => handleExtraCharge('accepted')} className="btn-primary py-2 px-4 !bg-red-600 hover:!bg-red-700 !text-white text-xs">Accept Charge</button>
                                        <button onClick={() => handleExtraCharge('rejected')} className="btn-secondary py-2 px-4 text-xs !border-red-200">Reject</button>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Module 9: Payment & Invoice Integration */}
                    {(requestData.status === 'completed' || invoiceData) && (
                        <div className="mt-6 bg-white border border-navy-100 rounded-2xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <h3 className="font-semibold text-navy-800 flex items-center gap-2">
                                    <svg className="w-5 h-5 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                                    Invoice & Payment
                                </h3>
                                {invoiceData && (
                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${invoiceData.invoice_status === 'paid' || paymentData?.payment_status === 'completed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                        {invoiceData.invoice_status === 'paid' || paymentData?.payment_status === 'completed' ? 'PAID' : 'PENDING'}
                                    </span>
                                )}
                            </div>

                            {!invoiceData ? (
                                <p className="text-sm text-navy-500 italic">Waiting for the pillar to generate the final invoice...</p>
                            ) : (
                                <div>
                                    <div className="grid grid-cols-2 gap-4 mb-4 text-sm bg-navy-50 p-4 rounded-xl">
                                        <div>
                                            <p className="text-xs text-muted mb-0.5">Invoice #</p>
                                            <p className="font-mono text-navy-700">{invoiceData.invoice_number}</p>
                                        </div>
                                        <div>
                                            <p className="text-xs text-muted mb-0.5">Base Amount</p>
                                            <p className="font-bold text-navy-800">{invoiceData.currency} {invoiceData.total_amount}</p>
                                        </div>
                                        {requestData.extra_charge_status === 'accepted' && (
                                            <>
                                                <div>
                                                    <p className="text-xs text-muted mb-0.5">Extra Charges</p>
                                                    <p className="font-bold text-orange-600">{invoiceData.currency} {requestData.extra_charge_amount}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-muted mb-0.5">Grand Total</p>
                                                    <p className="font-bold text-navy-900">{invoiceData.currency} {Number(invoiceData.total_amount) + Number(requestData.extra_charge_amount)}</p>
                                                </div>
                                            </>
                                        )}
                                    </div>

                                    {(invoiceData.invoice_status !== 'paid' && paymentData?.payment_status !== 'completed') && (
                                        <button
                                            onClick={() => alert('Production Payment Gateway is not configured. Real money transactions cannot be processed in this environment.')}
                                            className="btn-primary w-full py-2.5 shadow-sm text-sm"
                                        >
                                            Proceed to Payment
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* Module 6 Native Review Execution Block */}
                    {requestData.status === 'completed' && <ReviewForm requestId={id} />}

                    <div className="mt-8">
                        <button onClick={() => navigate('/home')} className="btn-primary w-full py-4 shadow-lg shadow-navy-500/10">Return to Catalog</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
