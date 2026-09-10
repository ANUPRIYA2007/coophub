import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import gsap from 'gsap';
import { useServices } from '../../hooks/useServices';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import AnimatedServiceEcosystemBackground from '../../components/background/AnimatedServiceEcosystemBackground';
import { getServiceImage, getServiceDescription } from '../../utils/serviceImageMap';

export default function ServicesBrowse() {
    const { t } = useTranslation();
    const { language } = useLanguage();
    const { services, loading, error } = useServices();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');
    const cardsGridRef = useRef(null);

    const filteredServices = services.filter(service =>
        (service.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Staggered GSAP entrance animation for service cards
    useEffect(() => {
        if (loading || filteredServices.length === 0 || !cardsGridRef.current) return;

        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (prefersReducedMotion) return;

        const ctx = gsap.context(() => {
            const cards = cardsGridRef.current.querySelectorAll('.service-card');
            if (cards.length === 0) return;

            gsap.fromTo(
                cards,
                {
                    opacity: 0,
                    y: 28,
                    scale: 0.94,
                },
                {
                    opacity: 1,
                    y: 0,
                    scale: 1,
                    duration: 0.52,
                    stagger: {
                        each: 0.042,
                        from: 'start',
                    },
                    ease: 'back.out(1.18)',
                    clearProps: 'transform', // Allows smooth CSS hover: -translate-y-1 to function after entrance
                }
            );
        }, cardsGridRef);

        return () => ctx.revert();
    }, [loading, searchQuery, filteredServices.length]);

    // Interactive magnetic 3D tilt & cursor-following X/Y motion on hover
    const handleCardMouseMove = (e) => {
        const card = e.currentTarget;
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;

        const deltaX = (x - centerX) / centerX;
        const deltaY = (y - centerY) / centerY;

        // Subtle X and Y movement (±8px in X, ±7px in Y plus lift)
        const moveX = deltaX * 8;
        const moveY = deltaY * 7 - 4;

        // Subtle 3D perspective tilt
        const rotateX = -deltaY * 5.5;
        const rotateY = deltaX * 6.5;

        gsap.to(card, {
            x: moveX,
            y: moveY,
            rotateX: rotateX,
            rotateY: rotateY,
            scale: 1.025,
            boxShadow: `${-deltaX * 6}px ${-deltaY * 6 + 14}px 26px -4px rgba(0,0,0,0.11), 0 0 18px -2px rgba(249,115,22,0.16)`,
            duration: 0.22,
            ease: 'power1.out',
            overwrite: 'auto',
            transformPerspective: 900,
        });
    };

    const handleCardMouseLeave = (e) => {
        const card = e.currentTarget;
        gsap.to(card, {
            x: 0,
            y: 0,
            rotateX: 0,
            rotateY: 0,
            scale: 1,
            boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
            duration: 0.45,
            ease: 'power2.out',
            overwrite: 'auto',
        });
    };

    return (
        <div style={{ position: 'relative', minHeight: '100%', overflow: 'hidden' }}>
            {/* Background spans the FULL white content area (sidebar to viewport edge) */}
            <AnimatedServiceEcosystemBackground services={services} />

            {/* Foreground content — centered, above background */}
            <div className="p-6 max-w-5xl mx-auto" style={{ position: 'relative', zIndex: 2 }}>
                <div className="text-center mb-1">
                    <h1 className="text-3xl font-extrabold text-navy-900" style={{ letterSpacing: '-0.5px' }}>
                        {t('Explore')} <span className="text-orange-500">{t('Services')}</span>
                    </h1>
                </div>
                <p className="text-sm text-navy-400 mb-6 text-center">
                    {t('Find trusted cooperative workers for all your home and business needs')}
                </p>

                {/* Search */}
                <div className="relative max-w-xl mx-auto mb-8">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                        <svg className="h-5 w-5 text-navy-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                        </svg>
                    </div>
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="block w-full pl-12 pr-4 py-3 bg-white border border-navy-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm text-navy-800 placeholder:text-navy-300"
                        placeholder={t('Search services, workers...')}
                    />
                </div>

                {/* Service Grid */}
                {loading ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                            <div key={n} className="bg-white rounded-2xl border border-navy-100 flex flex-col overflow-hidden animate-pulse">
                                <div className="w-full h-32 bg-gray-200"></div>
                                <div className="p-4 flex flex-col items-center flex-1 justify-between">
                                    <div className="w-24 h-3.5 bg-gray-200 rounded mb-2"></div>
                                    <div className="w-32 h-2.5 bg-gray-100 rounded mb-4"></div>
                                    <div className="w-16 h-3 bg-orange-100 rounded"></div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : error ? (
                    <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
                        Unable to load services. Please try again later.
                    </div>
                ) : filteredServices.length === 0 ? (
                    <div className="bg-white rounded-2xl border border-navy-100 p-10 text-center">
                        <div className="w-20 h-20 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-5">
                            <svg className="w-10 h-10 text-navy-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                        </div>
                        <h3 className="font-semibold text-navy-800 text-lg mb-2">
                            {searchQuery ? 'No matching services' : 'No services available yet'}
                        </h3>
                        <p className="text-navy-400 text-sm max-w-sm mx-auto">
                            {searchQuery
                                ? `No services match "${searchQuery}". Try a different search term.`
                                : "We're onboarding service providers in your area. New services will appear here automatically when available."}
                        </p>
                    </div>
                ) : (
                    <div ref={cardsGridRef} className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {filteredServices.map(service => {
                            const serviceImg = getServiceImage(service);
                            const serviceDesc = getServiceDescription(service);

                            return (
                                <button
                                    key={service.id}
                                    onClick={() => navigate(`/services/${service.id}`)}
                                    onMouseMove={handleCardMouseMove}
                                    onMouseLeave={handleCardMouseLeave}
                                    className="service-card bg-white rounded-2xl border border-navy-100 overflow-hidden flex flex-col justify-between text-center hover:border-orange-300 transition-colors group cursor-pointer"
                                    style={{
                                        transformStyle: 'preserve-3d',
                                        willChange: 'transform, box-shadow',
                                    }}
                                >
                                    {/* Service Image at the TOP of the card */}
                                    <div className="w-full aspect-[16/10] overflow-hidden bg-slate-100 relative">
                                        {serviceImg && (
                                            <img
                                                src={serviceImg}
                                                alt={service.name}
                                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out pointer-events-none select-none"
                                                loading="lazy"
                                            />
                                        )}
                                    </div>

                                    {/* Card Content Area */}
                                    <div className="p-4 flex flex-col flex-1 justify-between items-center w-full">
                                        <div className="flex flex-col items-center w-full">
                                            <h3 className="font-semibold text-navy-800 text-sm group-hover:text-orange-600 transition-colors">
                                                {service.name_translations?.[language] || t(service.name)}
                                            </h3>
                                            {serviceDesc && (
                                                <p className="text-xs text-navy-400 mt-1 line-clamp-2">
                                                    {service.description_translations?.[language] || t(serviceDesc)}
                                                </p>
                                            )}
                                        </div>

                                        <div className="text-xs font-semibold text-orange-500 mt-3.5 flex items-center justify-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                            <span>{t('Explore')}</span>
                                            <span>→</span>
                                        </div>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </div>{/* end foreground content wrapper */}
        </div>
    );
}
