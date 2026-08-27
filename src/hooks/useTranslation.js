import { useLanguage } from '../context/LanguageContext';

export function useTranslation() {
    const ctx = useLanguage();
    return { t: ctx.t, language: ctx.language, changeLanguage: ctx.setLanguage, languages: ctx.languages };
}
