import { useContext } from "react";
import { LanguageContext } from "./LanguageContext.jsx";

export function useTranslation() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useTranslation must be used within a LanguageProvider");
  }
  return {
    t: context.t,
    language: context.language,
    changeLanguage: context.changeLanguage || context.setLanguage,
    setLanguage: context.setLanguage || context.changeLanguage,
    supportedLanguages: context.supportedLanguages,
    languages: context.languages,
    translations: context.translations
  };
}

export default useTranslation;
