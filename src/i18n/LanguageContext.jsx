import React, { createContext, useState, useCallback, useEffect, useContext } from "react";
import {
  t as translateSync,
  translateDynamic,
  translateBatch,
  SUPPORTED_LANGUAGES,
  LANGUAGES_MAP,
  CRITICAL_CATALOG
} from "./centralEngine.js";
import { getLanguageMetadata } from "./languages.js";
import { voiceEngine } from "../services/voice/voiceEngine.js";

export const LanguageContext = createContext(null);

const LANGUAGE_STORAGE_KEY_1 = "coophub_language";
const LANGUAGE_STORAGE_KEY_2 = "preferred_language";

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => {
    if (typeof window === "undefined") return "en";
    let urlLang = null;
    try {
      urlLang = new URLSearchParams(window.location.search).get("lang");
    } catch (e) {}
    const candidate = (urlLang && LANGUAGES_MAP[urlLang]) 
      ? urlLang 
      : (localStorage.getItem(LANGUAGE_STORAGE_KEY_1) || localStorage.getItem(LANGUAGE_STORAGE_KEY_2));
    return candidate && LANGUAGES_MAP[candidate] ? candidate : "en";
  });


  const changeLanguage = useCallback((newLang) => {
    if (!newLang || !LANGUAGES_MAP[newLang]) return;
    setLanguageState(newLang);
    if (typeof window !== "undefined") {
      localStorage.setItem(LANGUAGE_STORAGE_KEY_1, newLang);
      localStorage.setItem(LANGUAGE_STORAGE_KEY_2, newLang);
      document.documentElement.lang = newLang;
      const meta = getLanguageMetadata(newLang);
      document.documentElement.dir = meta.direction || "ltr";

      // Synchronize voice engine selected language
      voiceEngine.setLanguage(newLang);

      // Broadcast synchronization across components
      window.dispatchEvent(new CustomEvent("coophub_language_changed", {
        detail: { language: newLang }
      }));
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;

    localStorage.setItem(LANGUAGE_STORAGE_KEY_1, language);
    localStorage.setItem(LANGUAGE_STORAGE_KEY_2, language);
    document.documentElement.lang = language;
    const meta = getLanguageMetadata(language);
    document.documentElement.dir = meta.direction || "ltr";
    voiceEngine.setLanguage(language);

    const handleSync = (e) => {
      if (e.detail?.language && e.detail.language !== language && LANGUAGES_MAP[e.detail.language]) {
        setLanguageState(e.detail.language);
      }
    };

    const handleStorage = (e) => {
      if ((e.key === LANGUAGE_STORAGE_KEY_1 || e.key === LANGUAGE_STORAGE_KEY_2) && e.newValue) {
        if (LANGUAGES_MAP[e.newValue] && e.newValue !== language) {
          setLanguageState(e.newValue);
        }
      }
    };

    window.addEventListener("coophub_language_changed", handleSync);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("coophub_language_changed", handleSync);
      window.removeEventListener("storage", handleStorage);
    };
  }, [language]);

  const [translationVersion, setTranslationVersion] = useState(0);

  useEffect(() => {
    if (typeof window === "undefined") return;

    let rafId = null;
    const handleTranslationUpdated = (e) => {
      if (e.detail?.lang === language) {
        if (rafId) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          setTranslationVersion((v) => v + 1);
        });
      }
    };

    window.addEventListener("coophub_translation_updated", handleTranslationUpdated);
    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      window.removeEventListener("coophub_translation_updated", handleTranslationUpdated);
    };
  }, [language]);

  const t = useCallback((key, params) => {
    return translateSync(key, params, language);
  }, [language, translationVersion]);

  const tAsync = useCallback((text, options) => {
    return translateDynamic(text, language, "en", options);
  }, [language]);

  return (
    <LanguageContext.Provider
      value={{
        language,
        changeLanguage,
        setLanguage: changeLanguage,
        t,
        tAsync,
        translateBatch: (texts) => translateBatch(texts, language, "en"),
        supportedLanguages: SUPPORTED_LANGUAGES,
        languages: LANGUAGES_MAP,
        currentLanguageMeta: getLanguageMetadata(language),
        translations: CRITICAL_CATALOG[language] || CRITICAL_CATALOG["en"]
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used within a LanguageProvider");
  }
  return context;
}

export default LanguageContext;
