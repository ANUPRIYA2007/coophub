import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { serviceRequestService } from '../../services/customer/serviceRequestService';
import { useTranslation } from '../../hooks/useTranslation';

export default function RequestDetails() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const [requestData, setRequestData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const fetchRequest = async () => {
            try {
                const data = await serviceRequestService.getRequestDetails(id);
                setRequestData(data);
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

    return (
        <div className="min-h-screen bg-surface pb-20 px-4 pt-6">
            <div className="max-w-2xl mx-auto">
                <button onClick={() => navigate('/home')} className="text-navy-600 mb-6 hover:text-navy-900 transition flex items-center font-medium">
                    <svg className="w-5 h-5 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                    Back to Home
                </button>

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

                    <div className="mt-8">
                        <button onClick={() => navigate('/home')} className="btn-primary w-full py-4 shadow-lg shadow-navy-500/10">Return to Catalog</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
