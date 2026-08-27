import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { useServices } from '../../hooks/useServices';

export default function ServiceDetails() {
    const { id: serviceId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { services, getSubServices, loading, error } = useServices();

    const service = services.find(s => s.id === serviceId);
    const subServices = getSubServices(serviceId);

    if (loading) {
        return (
            <div className="min-h-screen bg-surface p-6">
                <div className="animate-pulse flex flex-col space-y-4 max-w-3xl mx-auto">
                    <div className="h-40 bg-gray-200 rounded-2xl w-full"></div>
                    <div className="h-20 bg-gray-200 rounded-xl w-full"></div>
                    <div className="h-20 bg-gray-200 rounded-xl w-full"></div>
                </div>
            </div>
        );
    }

    if (error || !service) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface p-6 text-center">
                <div className="card p-8">
                    <h2 className="heading-3 mb-2">{t('booking.status_requested') || 'Service unavailable'}</h2>
                    <p className="text-muted text-sm">{error || 'The requested service was not found.'}</p>
                    <button onClick={() => navigate('/home')} className="btn-secondary mt-6">Back to Home</button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pb-20">
            {/* Header Area */}
            <div className="bg-navy-500 text-white pt-10 pb-16 px-6">
                <div className="max-w-3xl mx-auto flex items-center mb-6">
                    <button onClick={() => navigate('/home')} className="mr-4 hover:opacity-80 transition-opacity">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h1 className="text-2xl font-bold">{service.name}</h1>
                </div>
                {service.description && (
                    <p className="max-w-3xl mx-auto text-navy-100 opacity-90">{service.description}</p>
                )}
            </div>

            <main className="max-w-3xl mx-auto px-4 -mt-10">
                <div className="card bg-white p-6 shadow-xl shadow-navy-100 mb-8">
                    <h2 className="font-semibold text-navy-800 mb-4 text-lg">Select a specific requirement:</h2>

                    {subServices.length === 0 ? (
                        <div className="p-6 text-center bg-navy-50 rounded-2xl border border-dashed border-navy-200">
                            <p className="text-navy-600">No sub-services available for this category right now.</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {subServices.map(sub => (
                                <button
                                    key={sub.id}
                                    onClick={() => navigate(`/services/${serviceId}/request?sub=${sub.id}`)}
                                    className="w-full flex items-center justify-between p-4 border border-navy-100 rounded-xl hover:border-orange-500 hover:bg-orange-50 transition-colors text-left group"
                                >
                                    <div>
                                        <h3 className="font-semibold text-navy-800 group-hover:text-orange-600 transition-colors">{sub.name}</h3>
                                        {sub.description && (
                                            <p className="text-sm text-navy-600 mt-1">{sub.description}</p>
                                        )}
                                    </div>
                                    <div className="text-orange-500 opacity-0 group-hover:opacity-100 transition-opacity flex items-center">
                                        <span className="text-sm font-semibold mr-1">{t('booking.request_service')}</span>
                                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
