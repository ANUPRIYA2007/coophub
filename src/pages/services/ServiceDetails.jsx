import { useParams, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { useServices, MASTER_SERVICES } from '../../hooks/useServices';
import { ArrowLeft, Home, ShoppingBag, AlertCircle, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';

export default function ServiceDetails() {
    const { id: serviceId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { services, getSubServices, loading, error } = useServices();

    // Match service by ID, code, category, or name with fallback to master catalog
    const service = (services || []).find(s => 
        s.id === serviceId || 
        s.service_code?.toLowerCase() === serviceId?.toLowerCase() ||
        s.category?.toLowerCase() === serviceId?.toLowerCase() ||
        s.name?.toLowerCase() === serviceId?.toLowerCase()
    ) || (MASTER_SERVICES || []).find(s => 
        s.id === serviceId || 
        s.category?.toLowerCase() === serviceId?.toLowerCase() ||
        s.name?.toLowerCase() === serviceId?.toLowerCase()
    );

    const resolvedServiceId = service?.id || serviceId;
    const subServices = service ? getSubServices(resolvedServiceId) : [];

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
                <div className="card p-8 max-w-md w-full shadow-xl bg-white rounded-3xl border border-navy-100">
                    <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                        <AlertCircle size={32} />
                    </div>
                    <h2 className="text-xl font-bold text-navy-900 mb-2">{t('booking.status_requested') || 'Service Category Notice'}</h2>
                    <p className="text-navy-500 text-sm mb-6 leading-relaxed">
                        {error || 'This specific service category is currently being updated or has no active listings.'}
                    </p>
                    <div className="flex flex-col sm:flex-row gap-3 justify-center">
                        <button 
                            type="button"
                            onClick={() => navigate('/services')} 
                            className="btn-primary py-3 px-5 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-500/20"
                        >
                            <ShoppingBag size={16} /> Browse All Services
                        </button>
                        <button 
                            type="button"
                            onClick={() => navigate('/home')} 
                            className="py-3 px-5 rounded-xl border border-navy-200 text-navy-700 hover:bg-navy-50 font-bold text-sm flex items-center justify-center gap-2 transition-colors"
                        >
                            <Home size={16} /> Back to Home
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-surface pb-20">
            {/* Header Area */}
            <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 text-white pt-8 pb-16 px-6 relative overflow-hidden">
                {/* Ambient glow */}
                <div className="absolute top-0 right-10 w-64 h-64 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="max-w-3xl mx-auto">
                    {/* Top Navigation Row */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-3">
                            <button 
                                type="button"
                                onClick={() => navigate('/services')} 
                                title="Back to Services"
                                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
                            >
                                <ArrowLeft size={16} />
                                <span>Services</span>
                            </button>
                            <button 
                                type="button"
                                onClick={() => navigate('/home')} 
                                title="Back to Home Dashboard"
                                className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors flex items-center gap-1.5 text-xs font-semibold"
                            >
                                <Home size={16} />
                                <span>Home</span>
                            </button>
                        </div>

                        <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 border border-orange-500/30">
                            {service.category || 'Home Service'}
                        </span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">{service.name}</h1>
                    {service.description && (
                        <p className="text-navy-200 text-sm max-w-2xl leading-relaxed">{service.description}</p>
                    )}
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-4 -mt-10">
                <div className="card bg-white p-6 shadow-xl shadow-navy-100 rounded-3xl border border-navy-100 mb-8">
                    <div className="flex items-center justify-between mb-5 border-b border-navy-100 pb-3">
                        <h2 className="font-bold text-navy-900 text-base flex items-center gap-2">
                            <Sparkles size={18} className="text-orange-500" />
                            <span>Select Service Requirement</span>
                        </h2>
                        <span className="text-xs text-navy-400 font-medium">
                            {subServices.length} {subServices.length === 1 ? 'option' : 'options'} available
                        </span>
                    </div>

                    {subServices.length === 0 ? (
                        <div className="p-8 text-center bg-orange-50/50 rounded-2xl border border-dashed border-orange-200">
                            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3">
                                <CheckCircle2 size={24} />
                            </div>
                            <h3 className="font-bold text-navy-900 text-base mb-1">Direct Booking Available</h3>
                            <p className="text-navy-600 text-xs max-w-md mx-auto mb-6">
                                You can proceed directly with a general service request for <strong>{service.name}</strong>. Our certified cooperative technician will diagnose and assess the required work on arrival.
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate(`/services/${resolvedServiceId}/request`)}
                                    className="btn-primary py-3 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 w-full sm:w-auto"
                                >
                                    <span>Proceed to Book {service.name}</span>
                                    <ChevronRight size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/services')}
                                    className="py-3 px-5 rounded-xl border border-navy-200 text-navy-700 hover:bg-navy-50 text-sm font-semibold transition-colors w-full sm:w-auto"
                                >
                                    Browse Other Services
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/home')}
                                    className="py-3 px-5 rounded-xl border border-navy-200 text-navy-700 hover:bg-navy-50 text-sm font-semibold transition-colors w-full sm:w-auto flex items-center justify-center gap-1.5"
                                >
                                    <Home size={15} />
                                    <span>Home</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {subServices.map(sub => (
                                <button
                                    key={sub.id}
                                    type="button"
                                    onClick={() => navigate(`/services/${resolvedServiceId}/request?sub=${sub.id}`)}
                                    className="w-full flex items-center justify-between p-4 border border-navy-100 rounded-2xl hover:border-orange-500 hover:bg-orange-50/60 transition-all text-left group shadow-xs hover:shadow-md"
                                >
                                    <div className="pr-4">
                                        <h3 className="font-bold text-navy-900 group-hover:text-orange-600 transition-colors text-sm">{sub.name}</h3>
                                        {sub.description && (
                                            <p className="text-xs text-navy-500 mt-1 line-clamp-2">{sub.description}</p>
                                        )}
                                        {sub.base_price && (
                                            <span className="inline-block mt-2 text-xs font-extrabold text-navy-900 bg-navy-50 group-hover:bg-orange-100 px-2.5 py-0.5 rounded-md text-orange-600 transition-colors">
                                                ₹{sub.base_price} base rate
                                            </span>
                                        )}
                                    </div>
                                    <div className="text-orange-500 shrink-0 flex items-center gap-1 text-xs font-bold bg-orange-100/60 group-hover:bg-orange-500 group-hover:text-white px-3 py-1.5 rounded-xl transition-all">
                                        <span>Book</span>
                                        <ChevronRight size={14} />
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

