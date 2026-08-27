import { createContext, useContext, useState, useEffect } from 'react';
import { LANGUAGES } from '../constants';

const LanguageContext = createContext(null);

// Import translations
import en from '../i18n/en.json';
import ta from '../i18n/ta.json';
import hi from '../i18n/hi.json';
import te from '../i18n/te.json';
import kn from '../i18n/kn.json';

const translations = { en, ta, hi, te, kn };

export function LanguageProvider({ children }) {
    // Load from local storage or default to 'en'
    const [language, setLanguage] = useState(() => {
        const saved = localStorage.getItem('preferred_language');
        return saved && LANGUAGES[saved] ? saved : 'en';
    });

    useEffect(() => {
        localStorage.setItem('preferred_language', language);
        document.documentElement.lang = language;
    }, [language]);

    const t = (keyStr, params) => {
        const keys = keyStr.split('.');
        let result = translations[language];

        for (const key of keys) {
            if (result && result[key]) {
                result = result[key];
            } else {
                // Fallback to English if key missing in current language
                let fallback = translations['en'];
                for (const k of keys) {
                    if (fallback && fallback[k]) {
                        fallback = fallback[k];
                    } else {
                        return keyStr; // Return key path if not found in fallback either
                    }
                }
                result = fallback;
                break;
            }
        }

        // Replace dynamic variables if params object is provided
        if (typeof result === 'string' && params) {
            let finalStr = result;
            Object.keys(params).forEach(paramName => {
                finalStr = finalStr.replace(`{{${paramName}}}`, params[paramName]);
                finalStr = finalStr.replace(`{${paramName}}`, params[paramName]);
            });
            return finalStr;
        }

        return result;
    };

    return (
        <LanguageContext.Provider value={{ language, setLanguage, t, languages: LANGUAGES }}>
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
