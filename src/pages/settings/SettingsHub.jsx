import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import { SUPPORTED_LANGUAGES } from '../../i18n/languages';
import { supabase } from '../../lib/supabase';

export default function SettingsHub() {
    const navigate = useNavigate();
    const { signOut, profile } = useAuth();
    const { language, changeLanguage, t } = useTranslation();

    const [prefs, setPrefs] = useState({
        request_updates: true,
        messages: true,
        promotions: false
    });

    const languageOptions = SUPPORTED_LANGUAGES.map((l) => ({
        code: l.code,
        label: `${l.nativeName} (${l.name})`
    }));

    useEffect(() => {
        const fetchPreferences = async () => {
            if (!profile?.user_id) return;
            try {
                // Read from Phase 7 schema mapping natively
                const { data, error } = await supabase
                    .from('customer_notification_preferences')
                    .select('*')
                    .eq('customer_id', profile.user_id)
                    .maybeSingle();

                if (data && !error) {
                    setPrefs({
                        request_updates: data.request_updates,
                        messages: data.messages,
                        promotions: data.promotions
                    });
                } else if (!data) {
                    // Create default preferences if none exist natively upon first load
                    const defaultPrefs = { request_updates: true, messages: true, promotions: false };
                    await supabase.from('customer_notification_preferences').insert({
                        customer_id: profile.user_id,
                        ...defaultPrefs
                    });
                    setPrefs(defaultPrefs);
                }
            } catch (err) {
                console.error("Config fetch error:", err);
            }
        };
        fetchPreferences();
    }, [profile]);

    const handleToggle = async (key) => {
        const newValue = !prefs[key];
        setPrefs(prev => ({ ...prev, [key]: newValue }));

        try {
            await supabase
                .from('customer_notification_preferences')
                .update({ [key]: newValue })
                .eq('customer_id', profile.user_id);
        } catch (err) {
            // Revert on fail
            setPrefs(prev => ({ ...prev, [key]: !newValue }));
        }
    };

    const handleLogout = async () => {
        try {
            await signOut();
            navigate('/', { replace: true });
        } catch (err) {
            alert('Failed to execute secure logout.');
        }
    };

    return (
        <div className="min-h-screen bg-surface pb-24 pt-6 px-4">
            <div className="max-w-xl mx-auto">
                {/* Unified Sticky Header */}
                <header className="bg-white sticky top-0 z-40 border-b border-navy-100/50 shadow-sm px-4 py-3 flex items-center -mx-4 -mt-6 mb-8">
                    <button onClick={() => navigate('/home')} className="mr-3 text-navy-500 hover:text-orange-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                    </button>
                    <h1 className="font-bold text-navy-800 text-lg">{t('Settings')}</h1>
                </header>

                {/* Section 1: Language */}
                <div className="bg-white border border-navy-100 rounded-2xl overflow-hidden shadow-sm mb-6">
                    <div className="p-5 border-b border-navy-50 bg-navy-50/50">
                        <h2 className="font-semibold text-navy-900 text-lg flex items-center">
                            <svg className="w-5 h-5 mr-2 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129" /></svg>
                            {t('App Language')}
                        </h2>
                    </div>
                    <div className="p-5">
                        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3">
                            {languageOptions.map(opt => (
                                <button
                                    key={opt.code}
                                    onClick={() => changeLanguage(opt.code)}
                                    className={`py-3 px-4 rounded-xl border text-sm font-medium transition-colors ${language === opt.code ? 'bg-orange-50 border-orange-200 text-orange-700' : 'bg-white border-navy-100 text-navy-600 hover:bg-navy-50'}`}
                                >
                                    {opt.label}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Section 2: Notifications */}
                <div className="bg-white border border-navy-100 rounded-2xl overflow-hidden shadow-sm mb-6">
                    <div className="p-5 border-b border-navy-50 bg-navy-50/50">
                        <h2 className="font-semibold text-navy-900 text-lg flex items-center">
                            <svg className="w-5 h-5 mr-2 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>
                            {t('Notification Preferences')}
                        </h2>
                    </div>
                    <div className="divide-y divide-navy-50">
                        <label className="flex items-center justify-between p-5 cursor-pointer hover:bg-navy-50 transition-colors">
                            <div>
                                <h3 className="font-medium text-navy-800">{t('Request Updates')}</h3>
                                <p className="text-xs text-navy-500 mt-0.5">{t('Receive alerts when status changes')}</p>
                            </div>
                            <div className={`w-12 h-6 rounded-full transition-colors p-1 flex ${prefs.request_updates ? 'bg-orange-500 justify-end' : 'bg-navy-200 justify-start'}`}>
                                <input type="checkbox" className="hidden" checked={prefs.request_updates} onChange={() => handleToggle('request_updates')} />
                                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                            </div>
                        </label>
                        <label className="flex items-center justify-between p-5 cursor-pointer hover:bg-navy-50 transition-colors">
                            <div>
                                <h3 className="font-medium text-navy-800">{t('Pillar Messages')}</h3>
                                <p className="text-xs text-navy-500 mt-0.5">{t('Alerts for unread chat messages')}</p>
                            </div>
                            <div className={`w-12 h-6 rounded-full transition-colors p-1 flex ${prefs.messages ? 'bg-orange-500 justify-end' : 'bg-navy-200 justify-start'}`}>
                                <input type="checkbox" className="hidden" checked={prefs.messages} onChange={() => handleToggle('messages')} />
                                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                            </div>
                        </label>
                        <label className="flex items-center justify-between p-5 cursor-pointer hover:bg-navy-50 transition-colors">
                            <div>
                                <h3 className="font-medium text-navy-800">{t('Platform Promotions')}</h3>
                                <p className="text-xs text-navy-500 mt-0.5">{t('Discount codes and seasonal alerts')}</p>
                            </div>
                            <div className={`w-12 h-6 rounded-full transition-colors p-1 flex ${prefs.promotions ? 'bg-orange-500 justify-end' : 'bg-navy-200 justify-start'}`}>
                                <input type="checkbox" className="hidden" checked={prefs.promotions} onChange={() => handleToggle('promotions')} />
                                <div className="w-4 h-4 bg-white rounded-full shadow-sm"></div>
                            </div>
                        </label>
                    </div>
                </div>

                {/* Section 3: Security & Session */}
                <div className="bg-white border border-navy-100 rounded-2xl overflow-hidden shadow-sm">
                    <div className="p-5 border-b border-navy-50 bg-navy-50/50">
                        <h2 className="font-semibold text-navy-900 text-lg flex items-center">
                            <svg className="w-5 h-5 mr-2 text-navy-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                            {t('Account Security')}
                        </h2>
                    </div>
                    <div className="p-5 space-y-4">
                        <button className="w-full text-left p-4 rounded-xl border border-navy-100 flex justify-between items-center bg-navy-50 text-navy-400 font-medium cursor-not-allowed">
                            {t('Change Password')}
                            <span className="text-xs bg-navy-100 text-navy-500 px-2 py-1 rounded">{t('Unavailable')}</span>
                        </button>
                        <button className="w-full text-left p-4 rounded-xl border border-navy-100 flex justify-between items-center bg-navy-50 text-navy-400 font-medium cursor-not-allowed">
                            {t('Delete Account permanently')}
                            <span className="text-xs bg-navy-100 text-navy-500 px-2 py-1 rounded">{t('Contact Support')}</span>
                        </button>
                        <button onClick={handleLogout} className="w-full text-left p-4 rounded-xl border border-red-100 flex justify-between items-center text-red-600 font-bold hover:bg-red-50 transition-colors">
                            {t('Sign out of session')}
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                        </button>
                    </div>
                </div>

            </div>
        </div>
    );
}
