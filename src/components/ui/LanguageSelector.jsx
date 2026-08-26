import { useLanguage } from '../../context/LanguageContext';

export default function LanguageSelector({ className = '' }) {
    const { language, setLanguage, languages } = useLanguage();

    return (
        <div className={`relative ${className}`}>
            <select
                value={language}
                onChange={(e) => setLanguage(e.target.value)}
                className="appearance-none bg-white border border-navy-200 text-navy-800 text-sm rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent block w-full px-3 py-2 pr-8 cursor-pointer shadow-sm hover:border-navy-300 transition-colors"
                aria-label="Select preferred language"
            >
                {Object.entries(languages).map(([code, name]) => (
                    <option key={code} value={code}>
                        {name}
                    </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-navy-500">
                <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
            </div>
        </div>
    );
}
