import React, { createContext, useState, useCallback, useEffect } from "react";
import { translations } from "./translations/index.js";

export const LanguageContext = createContext();

const SUPPORTED_LANGUAGES = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ta", name: "Tamil", nativeName: "தமிழ்" },
  { code: "hi", name: "Hindi", nativeName: "हिन्दी" },
  { code: "te", name: "Telugu", nativeName: "తెలుగు" },
  { code: "kn", name: "Kannada", nativeName: "ಕನ್ನಡ" },
];

export function LanguageProvider({ children }) {
  const [language, setLanguage] = useState(() => {
    return localStorage.getItem("coophub_language") || "en";
  });

  useEffect(() => {
    localStorage.setItem("coophub_language", language);
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (key, params = {}) => {
      const keys = key.split(".");
      let value = translations[language];
      for (const k of keys) {
        value = value?.[k];
      }
      if (!value) {
        let fallback = translations["en"];
        for (const k of keys) {
          fallback = fallback?.[k];
        }
        value = fallback || key;
      }
      if (typeof value === "string" && Object.keys(params).length > 0) {
        return value.replace(/\{\{(\w+)\}\}/g, (_, p) => params[p] ?? "");
      }
      return value || key;
    },
    [language]
  );

  const changeLanguage = useCallback((code) => {
    if (SUPPORTED_LANGUAGES.find((l) => l.code === code)) {
      setLanguage(code);
    }
  }, []);

  return (
    <LanguageContext.Provider
      value={{ language, changeLanguage, t, supportedLanguages: SUPPORTED_LANGUAGES }}
    >
      {children}
    </LanguageContext.Provider>
  );
}
