import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { unifiedTranslations, getTranslation, SUPPORTED_LANGUAGES, LANGUAGES_MAP } from '../i18n/unifiedTranslations';

export const LanguageContext = createContext(null);

const LANGUAGE_STORAGE_KEY_1 = 'coophub_language';
const LANGUAGE_STORAGE_KEY_2 = 'preferred_language';

export function LanguageProvider({ children }) {
    const [language, setLanguageState] = useState(() => {
        const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY_1) || localStorage.getItem(LANGUAGE_STORAGE_KEY_2);
        return saved && unifiedTranslations[saved] ? saved : 'en';
    });

    const setLanguage = useCallback((newLang) => {
        if (!newLang || !unifiedTranslations[newLang]) return;
        
        setLanguageState(newLang);
        localStorage.setItem(LANGUAGE_STORAGE_KEY_1, newLang);
        localStorage.setItem(LANGUAGE_STORAGE_KEY_2, newLang);
        document.documentElement.lang = newLang;

        // Broadcast cross-component synchronization event
        window.dispatchEvent(new CustomEvent('coophub_language_changed', {
            detail: { language: newLang }
        }));
    }, []);

    // Sync across tabs & window event listeners
    useEffect(() => {
        localStorage.setItem(LANGUAGE_STORAGE_KEY_1, language);
        localStorage.setItem(LANGUAGE_STORAGE_KEY_2, language);
        document.documentElement.lang = language;

        const handleSync = (e) => {
            if (e.detail?.language && e.detail.language !== language && unifiedTranslations[e.detail.language]) {
                setLanguageState(e.detail.language);
            }
        };

        const handleStorage = (e) => {
            if ((e.key === LANGUAGE_STORAGE_KEY_1 || e.key === LANGUAGE_STORAGE_KEY_2) && e.newValue) {
                if (unifiedTranslations[e.newValue] && e.newValue !== language) {
                    setLanguageState(e.newValue);
                }
            }
        };

        window.addEventListener('coophub_language_changed', handleSync);
        window.addEventListener('storage', handleStorage);

        return () => {
            window.removeEventListener('coophub_language_changed', handleSync);
            window.removeEventListener('storage', handleStorage);
        };
    }, [language]);

    const t = useCallback((key, params) => {
        return getTranslation(language, key, params);
    }, [language]);

    return (
        <LanguageContext.Provider value={{
            language,
            setLanguage,
            changeLanguage: setLanguage,
            t,
            languages: LANGUAGES_MAP,
            supportedLanguages: SUPPORTED_LANGUAGES,
            translations: unifiedTranslations[language]
        }}>
            {children}
        </LanguageContext.Provider>
    );
}

export function useLanguage() {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used within a LanguageProvider');
    }
    return context;
}

export default LanguageContext;
