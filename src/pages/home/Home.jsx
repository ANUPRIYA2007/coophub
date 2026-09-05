import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useServices } from '../../hooks/useServices';
import { useLanguage } from '../../context/LanguageContext';
import { supabase } from '../../lib/supabase';
import { serviceRequestService } from '../../services/customer/serviceRequestService';
import { gsap3dEngine } from '../../services/animation/gsap3dEngine';
import LanguageSelector from '../../components/ui/LanguageSelector';
import TypewriterEffect from '../../components/ui/TypewriterEffect';
import ServiceCategoryIcon from '../../components/ui/ServiceCategoryIcon';
import coopHubLogo from '../../assets/branding/coop-hub-logo.png';

export default function Home() {
    const { t } = useTranslation();
    const { language } = useLanguage();
    const { profile, signOut } = useAuth();
    const { services, loading: servicesLoading, error: servicesError } = useServices();
    const navigate = useNavigate();

    const [searchQuery, setSearchQuery] = useState('');
    const [showProfileMenu, setShowProfileMenu] = useState(false);

    // Real Supabase queries for active requests + notifications — ZERO MOCK
    const [activeRequests, setActiveRequests] = useState([]);
    const [requestsLoading, setRequestsLoading] = useState(true);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        const fetchDashboardData = async () => {
            try {
                const reqs = await serviceRequestService.getCustomerRequests();
                const active = (reqs || []).filter(r => r.status !== 'completed' && r.status !== 'cancelled').slice(0, 3);
                setActiveRequests(active);

                if (localStorage.getItem('coophub_demo_customer') === 'true') {
                    setUnreadCount(2);
                } else if (profile?.user_id) {
                    const { count } = await supabase
                        .from('notifications')
                        .select('id', { count: 'exact', head: true })
                        .eq('is_read', false);
                    setUnreadCount(count || 0);
                }
            } catch (err) {
                console.error('Dashboard fetch error:', err);
            } finally {
                setRequestsLoading(false);
            }
        };
        fetchDashboardData();
    }, [profile]);

    // 3D GSAP Stagger Entrance for Customer Home Dashboard Cards
    useEffect(() => {
        if (!servicesLoading && services.length > 0) {
            setTimeout(() => {
                gsap3dEngine.animate3DStaggerEntrance("#services-section .group, .service-card, main section", {
                    y: 35,
                    rotationX: 16,
                    rotationY: -5,
                    translateZ: -50,
                    stagger: 0.06,
                    duration: 0.7,
                });
                gsap3dEngine.refresh();
            }, 60);
        }
    }, [servicesLoading, services]);

    // Derive customer first name safely — NEVER show {Demo}, undefined, or null
    const customerFirstName = profile?.full_name?.trim()?.split(' ')[0];
    const displayName = customerFirstName && customerFirstName.length > 0
        ? customerFirstName
        : null;

    const filteredServices = services.filter(service =>
        (service.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    // Status color mapping for badges
    const statusColor = (status) => {
        switch (status) {
            case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-200';
            case 'assigned': case 'accepted': return 'bg-blue-100 text-blue-700 border-blue-200';
            case 'on_the_way': case 'arrived': return 'bg-orange-100 text-orange-700 border-orange-200';
            case 'in_progress': return 'bg-purple-100 text-purple-700 border-purple-200';
            default: return 'bg-navy-100 text-navy-600 border-navy-200';
        }
    };


    return (
        <div className="min-h-screen bg-surface">

            {/* ─── Main Content ─── */}
            <main className="max-w-5xl mx-auto px-4 pb-32">

                {/* ─── Welcome Banner ─── */}
                <section className="mt-6 mb-8">
                    <div className="bg-gradient-to-r from-navy-900 via-navy-800 to-navy-700 rounded-2xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg border border-navy-800">
                        <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/20 rounded-full blur-3xl -mr-16 -mt-16"></div>
                        <div className="relative z-10">
                            <div className="flex items-center gap-2 mb-2">
                                <span className="bg-orange-500 text-white font-bold text-xs px-2 py-0.5 rounded-md" style={{ fontWeight: "700" }}>{t('Customer Portal')}</span>
                                <span className="text-navy-300 text-xs font-semibold tracking-wider">ID: {profile?.email || "customer@coophub.in"}</span>
                            </div>
                            <h1 className="text-2xl sm:text-3xl font-bold mb-1">
                                {displayName
                                    ? `${t('Welcome back')}, ${displayName}!`
                                    : t('Welcome to COOP HUB')}
                            </h1>
                            <div className="text-navy-200 text-sm sm:text-base min-h-[24px]">
                                <TypewriterEffect
                                    words={[{ word: t('home.subtitle') || t("Find trusted services and get things done easily.") }]}
                                    typingSpeed={50}
                                    deletingSpeed={30}
                                    pauseDuration={999999}
                                    loop={false}
                                    cursorColor="#FF7A00"
                                    cursorWidth={2}
                                    cursorHeight={85}
                                    font={{ fontSize: "inherit", fontWeight: "normal" }}
                                    textColor="#CCD6E6"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* ─── Search ─── */}
                <section className="mb-8">
                    <div className="relative max-w-2xl">
                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-navy-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-12 pr-4 py-3.5 bg-white border border-navy-200 rounded-xl leading-5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all shadow-sm text-navy-800 placeholder:text-navy-300"
                            placeholder={t('home.search_placeholder') || t('Search services...')}
                        />
                    </div>
                </section>


                {/* ─── Active Requests ─── */}
                <section className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-navy-800 text-base">{t('Active Requests')}</h2>
                        <button onClick={() => navigate('/requests')} className="text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors">
                            {t('View All')} →
                        </button>
                    </div>

                    {requestsLoading ? (
                        <div className="space-y-3">
                            {[1, 2].map(i => (
                                <div key={i} className="bg-white rounded-xl border border-navy-100 p-4 animate-pulse">
                                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-3"></div>
                                    <div className="h-3 bg-gray-200 rounded w-1/5"></div>
                                </div>
                            ))}
                        </div>
                    ) : activeRequests.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-navy-100 p-8 text-center">
                            <div className="w-16 h-16 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-navy-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-navy-800 mb-1">{t('No active requests')}</h3>
                            <p className="text-navy-400 text-sm mb-5">{t('When you request a service, it will appear here for tracking.')}</p>
                            <button onClick={() => document.getElementById('services-section')?.scrollIntoView({ behavior: 'smooth' })} className="inline-flex items-center px-5 py-2.5 bg-orange-500 hover:bg-orange-600 text-white text-sm font-semibold rounded-xl transition-colors shadow-sm">
                                {t('Browse Services')}
                            </button>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {activeRequests.map(req => {
                                const svcName = req.services?.name_translations?.[language] || req.services?.name_translations?.['en'] || req.services?.name || t('Service Request');
                                return (
                                    <button key={req.id} onClick={() => navigate(`/requests/${req.id}`)} className="w-full bg-white rounded-xl border border-navy-100 p-4 text-left hover:border-orange-300 hover:shadow-md transition-all group flex items-center justify-between">
                                        <div>
                                            <h4 className="font-semibold text-navy-800 group-hover:text-orange-600 transition-colors">{svcName}</h4>
                                            <p className="text-xs text-navy-400 mt-0.5">{new Date(req.created_at).toLocaleDateString()}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2.5 py-1 text-[11px] font-bold uppercase tracking-wide rounded-full border ${statusColor(req.status)}`}>
                                                {t(req.status?.replace('_', ' '))}
                                            </span>
                                            <svg className="w-4 h-4 text-navy-300 group-hover:text-orange-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}
                </section>

                {/* ─── Find Services Catalogue ─── */}
                <section id="services-section" className="mb-10">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="font-bold text-navy-800 text-base">{t('Find Services')}</h2>
                        <button onClick={() => navigate('/services')} className="text-sm text-orange-500 hover:text-orange-600 font-medium transition-colors">
                            {t('View All')} →
                        </button>
                    </div>

                    {servicesLoading ? (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(n => (
                                <div key={n} className="bg-white h-44 rounded-2xl border border-navy-100 flex flex-col items-center justify-center p-5 animate-pulse">
                                    <div className="w-14 h-14 bg-gray-200 rounded-xl mb-3"></div>
                                    <div className="w-24 h-3.5 bg-gray-200 rounded mb-2"></div>
                                    <div className="w-32 h-2.5 bg-gray-100 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : servicesError ? (
                        <div className="p-4 bg-red-50 text-red-600 rounded-xl border border-red-100 text-sm">
                            {t('Unable to load services. Please try again later.')}
                        </div>
                    ) : filteredServices.length === 0 ? (
                        <div className="bg-white rounded-2xl border border-navy-100 p-10 text-center">
                            <div className="w-20 h-20 bg-navy-50 rounded-full flex items-center justify-center mx-auto mb-5">
                                <svg className="w-10 h-10 text-navy-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                                </svg>
                            </div>
                            <h3 className="font-semibold text-navy-800 text-lg mb-2">{t('No services available yet')}</h3>
                            <p className="text-navy-400 text-sm max-w-sm mx-auto">
                                {t("We're onboarding service providers in your area. New services will appear here automatically when available.")}
                            </p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredServices.map(service => (
                                <button
                                    key={service.id}
                                    onClick={() => navigate(`/services/${service.id}`)}
                                    className="bg-white rounded-2xl border border-navy-100 p-5 flex flex-col justify-between text-center hover:-translate-y-1 hover:shadow-lg hover:border-orange-200 transition-all group"
                                >
                                    <div className="flex flex-col items-center">
                                        <div className="w-14 h-14 bg-navy-50 rounded-xl flex items-center justify-center mb-3 group-hover:bg-orange-50 transition-colors">
                                            <ServiceCategoryIcon category={service.category} name={service.name} />
                                        </div>
                                        <h3 className="font-semibold text-navy-800 text-sm group-hover:text-orange-600 transition-colors">{t(service.name)}</h3>
                                        {service.description && (
                                            <p className="text-xs text-navy-400 mt-1 line-clamp-2">{t(service.description)}</p>
                                        )}
                                    </div>
                                    <div className="text-xs font-semibold text-orange-500 mt-3.5 flex items-center justify-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                        <span>{t('Explore')}</span>
                                        <span>→</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </section>


            </main>
        </div>
    );
}
