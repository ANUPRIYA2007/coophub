import { useState, useMemo } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { useServices } from '../../hooks/useServices';
import MascotHero from '../../components/ai/MascotHero';
import ChatAgent from '../../components/ai/ChatAgent';
import LanguageSelector from '../../components/ui/LanguageSelector';
import coopHubLogo from '../../assets/branding/coop-hub-logo.png';

export default function Home() {
    const { t } = useTranslation();
    const { profile, signOut } = useAuth();
    const { services, loading, error } = useServices();
    const [searchQuery, setSearchQuery] = useState('');
    const [isChatOpen, setIsChatOpen] = useState(false);

    // AI context block: provide the catalogue natively for the chat model
    const catalogContext = useMemo(() => {
        if (!services.length) return 'No services available currently.';
        return `Available Services: ${services.map(s => s.name).join(', ')}.`;
    }, [services]);

    const filteredServices = services.filter(service =>
        (service.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-surface">
            {/* Nav Header */}
            <header className="bg-white sticky top-0 z-40 border-b border-navy-100/50 shadow-sm px-4 py-3 flex justify-between items-center">
                <div className="flex items-center space-x-3">
                    <img src={coopHubLogo} alt="COOP HUB Logo" className="w-10 h-auto" />
                    <h1 className="font-bold text-navy-800 text-lg hidden sm:block">COOP HUB</h1>
                </div>

                <div className="flex items-center space-x-4">
                    <LanguageSelector />
                    <div className="w-10 h-10 bg-navy-50 rounded-full flex items-center justify-center text-navy-800 font-bold border border-navy-200 cursor-pointer">
                        {profile?.full_name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                </div>
            </header>

            <main className="max-w-5xl mx-auto px-4 pb-20">
                {/* AI Mascot Context */}
                <MascotHero
                    customerName={profile?.full_name}
                    currentRoute="/home"
                    activeBookingsCount={0}
                />

                {/* Dashboard Body */}
                <section>
                    <h2 className="heading-3 mb-2">{t('home.greeting', { name: profile?.full_name?.split(' ')[0] || 'User' })}</h2>
                    <p className="text-muted text-sm mb-6">{t('home.subtitle')}</p>

                    {/* Search */}
                    <div className="relative mb-8 max-w-lg">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                            </svg>
                        </div>
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="block w-full pl-10 pr-3 py-3 border border-navy-200 rounded-full leading-5 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-colors shadow-sm"
                            placeholder={t('home.search_placeholder')}
                        />
                    </div>

                    {/* Services Catalogue */}
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 animate-pulse">
                            {[1, 2, 3, 4].map(n => (
                                <div key={n} className="bg-white h-32 rounded-2xl border border-navy-100 flex flex-col items-center justify-center p-4">
                                    <div className="w-12 h-12 bg-gray-200 rounded-full mb-3"></div>
                                    <div className="w-16 h-4 bg-gray-200 rounded"></div>
                                </div>
                            ))}
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-danger-50 text-danger-600 rounded-xl border border-danger-100">
                            Failed to load services: {error}
                        </div>
                    ) : filteredServices.length === 0 ? (
                        <div className="text-center py-12 px-4 border-2 border-dashed border-navy-100 rounded-3xl bg-white/50">
                            <svg className="mx-auto h-12 w-12 text-navy-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                            </svg>
                            <h3 className="text-navy-500 font-medium">{t('home.empty_services')}</h3>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                            {filteredServices.map(service => (
                                <button key={service.id} className="card bg-white hover:-translate-y-1 hover:shadow-xl hover:shadow-navy-900/10 p-5 flex flex-col items-center text-center transition-all border border-navy-50/50 group">
                                    <div className="w-14 h-14 bg-navy-50 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-orange-50 transition-colors">
                                        <svg className="w-7 h-7 text-navy-500 group-hover:text-orange-500 transition-colors" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            {/* Dummy generic icon mapping depending on actual DB icons. We use standard wrench */}
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        </svg>
                                    </div>
                                    <h3 className="font-semibold text-navy-800 text-sm group-hover:text-orange-500 transition-colors">
                                        {service.name}
                                    </h3>
                                    {service.description && (
                                        <p className="text-xs text-muted mt-1 max-w-[120px] truncate">{service.description}</p>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </section>

                {/* Empty State for Bookings per spec */}
                <section className="mt-12">
                    <div className="bg-navy-50 rounded-2xl p-6 border border-navy-100 border-dashed flex items-center justify-between">
                        <div>
                            <h3 className="font-semibold text-navy-800">{t('home.empty_bookings')}</h3>
                            <p className="text-sm text-navy-600 mt-1">Ready to find a professional for your home?</p>
                        </div>
                        <button className="btn-secondary whitespace-nowrap hidden sm:block">View History</button>
                    </div>
                </section>
            </main>

            {/* Chat Agent Floating action */}
            {isChatOpen ? (
                <ChatAgent onClose={() => setIsChatOpen(false)} contextData={catalogContext} />
            ) : (
                <button
                    onClick={() => setIsChatOpen(true)}
                    className="fixed bottom-6 right-6 w-14 h-14 bg-orange-500 rounded-full shadow-2xl shadow-orange-500/40 flex items-center justify-center hover:bg-orange-600 hover:-translate-y-1 transition-all z-50 text-white"
                >
                    <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                    </svg>
                </button>
            )}
        </div>
    );
}
