import React from 'react';
import { useLanguage } from '../../context/LanguageContext';
import { SUPPORTED_LANGUAGES } from '../../i18n/languages';
import { Globe } from 'lucide-react';

export default function LanguageSelector({ className = '' }) {
    const { language, setLanguage } = useLanguage();

    const langList = SUPPORTED_LANGUAGES;

    return (
        <div className={`relative flex items-center ${className}`}>
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-2.5 text-orange-500">
                <Globe size={14} />
            </div>
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="appearance-none bg-white dark:bg-slate-900 border border-navy-200 dark:border-slate-700 text-navy-800 dark:text-slate-100 text-xs font-bold rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent block w-full pl-8 pr-7 py-2 cursor-pointer shadow-xs hover:border-orange-400 dark:hover:border-orange-400 transition-colors"
                aria-label="Select preferred language"
            >
                {langList.map((lang) => (
                    <option key={lang.code} value={lang.code} className="text-slate-900 bg-white dark:bg-slate-900 dark:text-slate-100 py-1">
                        {lang.nativeName} ({lang.name})
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-2 text-slate-400">
                <svg className="fill-current h-3.5 w-3.5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
            </div>
        </div>
    );
}
