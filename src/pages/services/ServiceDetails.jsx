import { useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useTranslation } from '../../hooks/useTranslation';
import { useServices, MASTER_SERVICES } from '../../hooks/useServices';
import { ArrowLeft, Home, ShoppingBag, AlertCircle, Sparkles, CheckCircle2, ChevronRight } from 'lucide-react';
import { getSubServiceImage } from '../../utils/subServiceImageMap';

export default function ServiceDetails() {
    const { id: serviceId } = useParams();
    const navigate = useNavigate();
    const { t } = useTranslation();
    const { services, getSubServices, loading, error } = useServices();
    const cardsGridRef = useRef(null);

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
    const subServices = service ? getSubServices(resolvedServiceId, service) : [];

    // GSAP staggered entrance animation for sub-service cards
    useEffect(() => {
        if (loading || subServices.length === 0 || !cardsGridRef.current) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const ctx = gsap.context(() => {
            const cards = cardsGridRef.current.querySelectorAll('.subservice-card');
            if (cards.length === 0) return;

            gsap.fromTo(
                cards,
                {
                    opacity: 0,
                    y: 24,
                    scale: 0.96,
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.45,
                    stagger: 0.05,
                    ease: 'power2.out',
                    clearProps: 'transform',
                }
            );
        }, cardsGridRef);

        return () => ctx.revert();
    }, [loading, subServices.length, resolvedServiceId]);

    if (loading) {
        return (
            <div className="min-h-screen bg-surface p-6">
                <div className="animate-pulse flex flex-col space-y-4 max-w-5xl mx-auto">
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
        <div className="min-h-screen bg-surface pb-20 w-full overflow-x-hidden">
            {/* Header Area */}
            <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-900 text-white pt-8 pb-16 px-4 sm:px-6 relative overflow-hidden">
                {/* Ambient glow */}
                <div className="absolute top-0 right-10 w-64 h-64 bg-orange-500/10 rounded-full blur-2xl pointer-events-none" />

                <div className="max-w-5xl mx-auto">
                    {/* Top Navigation Row */}
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-2 sm:gap-3">
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

                    <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white mb-2">{t(service.name)}</h1>
                    {service.description && (
                        <p className="text-navy-200 text-sm max-w-2xl leading-relaxed">{t(service.description)}</p>
                    )}
                </div>
            </div>

            <main className="max-w-5xl mx-auto px-3 sm:px-6 -mt-10">
                <div className="card bg-white p-4 sm:p-6 lg:p-7 shadow-xl shadow-navy-100 rounded-3xl border border-navy-100 mb-8">
                    <div className="flex items-center justify-between mb-5 sm:mb-6 border-b border-navy-100 pb-3 sm:pb-3.5">
                        <h2 className="font-bold text-navy-900 text-sm sm:text-base flex items-center gap-2">
                            <Sparkles size={18} className="text-orange-500 shrink-0" />
                            <span>{t('Select Service Requirement')}</span>
                        </h2>
                        <span className="text-xs text-navy-400 font-medium bg-navy-50 px-2.5 sm:px-3 py-1 rounded-full border border-navy-100 shrink-0">
                            {subServices.length} {subServices.length === 1 ? t('option') : t('options')} {t('available')}
                        </span>
                    </div>

                    {subServices.length === 0 ? (
                        <div className="p-8 text-center bg-orange-50/50 rounded-2xl border border-dashed border-orange-200">
                            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center mx-auto mb-3">
                                <CheckCircle2 size={24} />
                            </div>
                            <h3 className="font-bold text-navy-900 text-base mb-1">{t('Direct Booking Available')}</h3>
                            <p className="text-navy-600 text-xs max-w-md mx-auto mb-6">
                                {t('You can proceed directly with a general service request for')} <strong>{t(service.name)}</strong>. {t('Our certified cooperative technician will diagnose and assess the required work on arrival.')}
                            </p>

                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                                <button
                                    type="button"
                                    onClick={() => navigate(`/services/${resolvedServiceId}/request`)}
                                    className="btn-primary py-3 px-6 rounded-xl text-sm font-bold flex items-center justify-center gap-2 shadow-md shadow-orange-500/25 w-full sm:w-auto"
                                >
                                    <span>{t('Proceed to Book')} {t(service.name)}</span>
                                    <ChevronRight size={16} />
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/services')}
                                    className="py-3 px-5 rounded-xl border border-navy-200 text-navy-700 hover:bg-navy-50 text-sm font-semibold transition-colors w-full sm:w-auto"
                                >
                                    {t('Browse Other Services')}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => navigate('/home')}
                                    className="py-3 px-5 rounded-xl border border-navy-200 text-navy-700 hover:bg-navy-50 text-sm font-semibold transition-colors w-full sm:w-auto flex items-center justify-center gap-1.5"
                                >
                                    <Home size={15} />
                                    <span>{t('Home')}</span>
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div 
                            ref={cardsGridRef}
                            className="grid gap-4 sm:gap-5"
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(auto-fill, minmax(min(100%, 260px), 1fr))',
                            }}
                        >
                            {subServices.map(sub => {
                                const subImg = sub.image || getSubServiceImage(sub);

                                return (
                                    <div
                                        key={sub.id}
                                        className="subservice-card bg-white rounded-2xl border border-navy-100 overflow-hidden flex flex-col justify-between hover:border-orange-400 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 group text-left relative shadow-xs"
                                    >
                                        {/* 1. Sub-Service Image at the TOP */}
                                        <div className="w-full h-44 sm:h-48 overflow-hidden bg-slate-100 relative">
                                            <img
                                                src={subImg}
                                                alt={sub.name}
                                                className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out pointer-events-none select-none"
                                                loading="lazy"
                                            />
                                            <div className="absolute inset-0 bg-gradient-to-t from-navy-950/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                                        </div>

                                        {/* 2. Card Content Area */}
                                        <div className="p-4 sm:p-5 flex flex-col flex-1 justify-between">
                                            <div>
                                                <h3 className="font-bold text-navy-900 text-sm sm:text-base group-hover:text-orange-600 transition-colors mb-2 leading-snug">
                                                    {t(sub.name)}
                                                </h3>
                                                {sub.description && (
                                                    <p className="text-xs text-navy-500 leading-relaxed line-clamp-3">
                                                        {t(sub.description)}
                                                    </p>
                                                )}
                                            </div>

                                            <div className="pt-4 mt-5 border-t border-navy-50 flex items-center justify-between gap-3">
                                                {sub.base_price !== undefined && sub.base_price !== null ? (
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-semibold text-navy-400 uppercase tracking-wider">
                                                            {t('Base Rate')}
                                                        </span>
                                                        <span className="text-sm font-extrabold text-navy-900 group-hover:text-orange-600 transition-colors">
                                                            ₹{sub.base_price}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs font-semibold text-navy-400 italic">
                                                        {t('Custom Quote')}
                                                    </span>
                                                )}

                                                <button
                                                    type="button"
                                                    onClick={() => navigate(`/services/${resolvedServiceId}/request?sub=${sub.id}`)}
                                                    className="btn-primary py-2 px-4 rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm shadow-orange-500/20 hover:shadow-md hover:shadow-orange-500/30 transition-all shrink-0 cursor-pointer"
                                                >
                                                    <span>{t('Book')}</span>
                                                    <ChevronRight size={14} className="group-hover:translate-x-0.5 transition-transform" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}

