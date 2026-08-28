import { useLanguage } from '../context/LanguageContext';

export function useTranslation() {
    const ctx = useLanguage();
    return {
        t: ctx.t,
        language: ctx.language,
        changeLanguage: ctx.changeLanguage || ctx.setLanguage,
        setLanguage: ctx.setLanguage || ctx.changeLanguage,
        languages: ctx.languages,
        supportedLanguages: ctx.supportedLanguages,
        translations: ctx.translations
    };
}

export default useTranslation;
