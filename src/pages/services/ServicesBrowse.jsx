import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useServices } from '../../hooks/useServices';
import { useLanguage } from '../../context/LanguageContext';
import { useTranslation } from '../../hooks/useTranslation';
import ServiceCategoryIcon from '../../components/ui/ServiceCategoryIcon';

export default function ServicesBrowse() {
    const { t } = useTranslation();
    const { language } = useLanguage();
    const { services, loading, error } = useServices();
    const navigate = useNavigate();
    const [searchQuery, setSearchQuery] = useState('');

    const filteredServices = services.filter(service =>
        (service.name || '').toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="p-6 max-w-5xl mx-auto">
            <div className="flex items-center gap-3 mb-1 flex-wrap">
                <h1 className="text-2xl font-bold text-navy-800">{t('Find Services')}</h1>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-900">
                    Total: {filteredServices.length} {filteredServices.length === 1 ? 'Service' : 'Services'} Available
                </span>
            </div>
            <p className="text-sm text-navy-400 mb-6">{t('Browse available services in your area')}</p>

            {/* Search */}
            <div className="relative max-w-xl mb-8">
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
                        <div key={n} className="bg-white h-44 rounded-2xl border border-navy-100 flex flex-col items-center justify-center p-5 animate-pulse">
                            <div className="w-14 h-14 bg-gray-200 rounded-xl mb-3"></div>
                            <div className="w-24 h-3.5 bg-gray-200 rounded mb-2"></div>
                            <div className="w-32 h-2.5 bg-gray-100 rounded"></div>
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
                                <h3 className="font-semibold text-navy-800 text-sm group-hover:text-orange-600 transition-colors">{service.name}</h3>
                                {service.description && (
                                    <p className="text-xs text-navy-400 mt-1 line-clamp-2">{service.description}</p>
                                )}
                            </div>
                            <div className="text-xs font-semibold text-orange-500 mt-3.5 flex items-center justify-center gap-1 group-hover:translate-x-0.5 transition-transform">
                                <span>Explore</span>
                                <span>→</span>
                            </div>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
