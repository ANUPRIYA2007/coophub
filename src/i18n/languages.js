/**
 * COOP HUB Centralized Language Registry
 * Authoritative specification for all 22 Scheduled Indian Languages + English
 * 
 * Capability Flags:
 * - PRODUCT_LANGUAGE_SUPPORTED: Language is formally recognized across COOP HUB products.
 * - INDICTRANS2_RUNTIME_SUPPORTED: Language is verified and supported by IndicTrans2-200M (Flores-22 tag mapped).
 * - VOICE_SUPPORTED: Speech synthesis/recognition supported via Web Speech API / browser voice engines.
 * - TRANSLITERATION_SUPPORTED: Latin-to-Indic transliteration supported via Aksharantar / fallback adapter.
 */

export const SUPPORTED_LANGUAGES = [
  {
    code: "en",
    name: "English",
    nativeName: "English",
    script: "Latn",
    indicTransTag: "eng_Latn",
    bcp47: "en-IN",
    direction: "ltr",
    PRODUCT_LANGUAGE_SUPPORTED: true,
    INDICTRANS2_RUNTIME_SUPPORTED: true,
    VOICE_SUPPORTED: true,
    TRANSLITERATION_SUPPORTED: false
  },
  {
    code: "hi",
    name: "Hindi",
    nativeName: "हिन्दी",
    script: "Deva",
    indicTransTag: "hin_Deva",
    bcp47: "hi-IN",
    direction: "ltr",
    PRODUCT_LANGUAGE_SUPPORTED: true,
    INDICTRANS2_RUNTIME_SUPPORTED: true,
    VOICE_SUPPORTED: true,
    TRANSLITERATION_SUPPORTED: true
  },
  {
    code: "ta",
    name: "Tamil",
    nativeName: "தமிழ்",
    script: "Taml",
    indicTransTag: "tam_Taml",
    bcp47: "ta-IN",
    direction: "ltr",
    PRODUCT_LANGUAGE_SUPPORTED: true,
    INDICTRANS2_RUNTIME_SUPPORTED: true,
    VOICE_SUPPORTED: true,
    TRANSLITERATION_SUPPORTED: true
  },
  {
    code: "te",
    name: "Telugu",
    nativeName: "తెలుగు",
    script: "Telu",
    indicTransTag: "tel_Telu",
    bcp47: "te-IN",
    direction: "ltr",
    PRODUCT_LANGUAGE_SUPPORTED: true,
    INDICTRANS2_RUNTIME_SUPPORTED: true,
    VOICE_SUPPORTED: true,
    TRANSLITERATION_SUPPORTED: true
  },
  {
    code: "kn",
    name: "Kannada",
    nativeName: "ಕನ್ನಡ",
    script: "Knda",
    indicTransTag: "kan_Knda",
    bcp47: "kn-IN",
    direction: "ltr",
    PRODUCT_LANGUAGE_SUPPORTED: true,
    INDICTRANS2_RUNTIME_SUPPORTED: true,
    VOICE_SUPPORTED: true,
    TRANSLITERATION_SUPPORTED: true
  },
  {
    code: "bn",
    name: "Bengali",
    nativeName: "বাংলা",
    script: "Beng",
    indicTransTag: "ben_Beng",
    bcp47: "bn-IN",
    direction: "ltr",
    PRODUCT_LANGUAGE_SUPPORTED: true,
    INDICTRANS2_RUNTIME_SUPPORTED: true,
    VOICE_SUPPORTED: true,
    TRANSLITERATION_SUPPORTED: true
  },
  {
    code: "mr",
    name: "Marathi",
    nativeName: "मराठी",
    script: "Deva",
    indicTransTag: "mar_Deva",
    bcp47: "mr-IN",
    direction: "ltr",
    PRODUCT_LANGUAGE_SUPPORTED: true,
    INDICTRANS2_RUNTIME_SUPPORTED: true,
    VOICE_SUPPORTED: true,
    TRANSLITERATION_SUPPORTED: true
  },
  {
    code: "gu",
    name: "Gujarati",
    nativeName: "ગુજરાતી",
    script: "Gujr",
    indicTransTag: "guj_Gujr",
    bcp47: "gu-IN",
    direction: "ltr",
    PRODUCT_LANGUAGE_SUPPORTED: true,
    INDICTRANS2_RUNTIME_SUPPORTED: true,
    VOICE_SUPPORTED: true,
    TRANSLITERATION_SUPPORTED: true
  },
  {
    code: "ml",
    name: "Malayalam",
    nativeName: "മലയാളം",
    script: "Mlym",
    indicTransTag: "mal_Mlym",
    bcp47: "ml-IN",
    direction: "ltr",
    PRODUCT_LANGUAGE_SUPPORTED: true,
    INDICTRANS2_RUNTIME_SUPPORTED: true,
    VOICE_SUPPORTED: true,
    TRANSLITERATION_SUPPORTED: true
  },
  {
    code: "pa",
    name: "Punjabi",
    nativeName: "ਪੰਜਾਬੀ",
    script: "Guru",
    indicTransTag: "pan_Guru",
    bcp47: "pa-IN",
    direction: "ltr",
    PRODUCT_LANGUAGE_SUPPORTED: true,
    INDICTRANS2_RUNTIME_SUPPORTED: true,
    VOICE_SUPPORTED: true,
    TRANSLITERATION_SUPPORTED: true
  },
  {
    code: "or",
    name: "Odia",
    nativeName: "ଓଡ଼ିଆ",
    script: "Orya",
    indicTransTag: "ory_Orya",
    bcp47: "or-IN",
    direction: "ltr",
    PRODUCT_LANGUAGE_SUPPORTED: true,
    INDICTRANS2_RUNTIME_SUPPORTED: true,
    VOICE_SUPPORTED: false,
    TRANSLITERATION_SUPPORTED: true
  },
  {
    code: "as",
    name: "Assamese",
    nativeName: "অসমীয়া",
    script: "Beng",
    indicTransTag: "asm_Beng",
    bcp47: "as-IN",
    direction: "ltr",
    PRODUCT_LANGUAGE_SUPPORTED: true,
    INDICTRANS2_RUNTIME_SUPPORTED: true,
    VOICE_SUPPORTED: false,
    TRANSLITERATION_SUPPORTED: true
  },
  {
    code: "ur",
    name: "Urdu",
    nativeName: "اردو",
    script: "Arab",
    indicTransTag: "urd_Arab",
    bcp47: "ur-IN",
    direction: "rtl",
    PRODUCT_LANGUAGE_SUPPORTED: true,
    INDICTRANS2_RUNTIME_SUPPORTED: true,
    VOICE_SUPPORTED: true,
    TRANSLITERATION_SUPPORTED: true
  },
  {
    code: "sa",
    name: "Sanskrit",
    nativeName: "संस्कृतम्",
    script: "Deva",
    indicTransTag: "san_Deva",
    bcp47: "sa-IN",
    direction: "ltr",
    PRODUCT_LANGUAGE_SUPPORTED: true,
    INDICTRANS2_RUNTIME_SUPPORTED: true,
    VOICE_SUPPORTED: false,
    TRANSLITERATION_SUPPORTED: true
  },
  {
    code: "ks",
    name: "Kashmiri",
    nativeName: "کٲشُر / कॉशुर",
    script: "Arab",
    indicTransTag: "kas_Arab",
    bcp47: "ks-IN",
    direction: "rtl",
    PRODUCT_LANGUAGE_SUPPORTED: true,
    INDICTRANS2_RUNTIME_SUPPORTED: true,
    VOICE_SUPPORTED: false,
    TRANSLITERATION_SUPPORTED: false
  },
  {
    code: "sd",
    name: "Sindhi",
    nativeName: "سنڌي / सिन्धी",
    script: "Arab",
    indicTransTag: "snd_Arab",
    bcp47: "sd-IN",
    direction: "rtl",
    PRODUCT_LANGUAGE_SUPPORTED: true,
    INDICTRANS2_RUNTIME_SUPPORTED: true,
    VOICE_SUPPORTED: false,
    TRANSLITERATION_SUPPORTED: false
  },
  {
    code: "ne",
    name: "Nepali",
    nativeName: "नेपाली",
    script: "Deva",
    indicTransTag: "npi_Deva",
    bcp47: "ne-NP",
    direction: "ltr",
    PRODUCT_LANGUAGE_SUPPORTED: true,
    INDICTRANS2_RUNTIME_SUPPORTED: true,
    VOICE_SUPPORTED: true,
    TRANSLITERATION_SUPPORTED: true
  },
  {
    code: "kok",
    name: "Konkani",
    nativeName: "कोंकणी",
    script: "Deva",
    indicTransTag: "gom_Deva",
    bcp47: "kok-IN",
    direction: "ltr",
    PRODUCT_LANGUAGE_SUPPORTED: true,
    INDICTRANS2_RUNTIME_SUPPORTED: true,
    VOICE_SUPPORTED: false,
    TRANSLITERATION_SUPPORTED: true
  },
  {
    code: "mai",
    name: "Maithili",
    nativeName: "मैथिली",
    script: "Deva",
    indicTransTag: "mai_Deva",
    bcp47: "mai-IN",
    direction: "ltr",
    PRODUCT_LANGUAGE_SUPPORTED: true,
    INDICTRANS2_RUNTIME_SUPPORTED: true,
    VOICE_SUPPORTED: false,
    TRANSLITERATION_SUPPORTED: true
  },
  {
    code: "brx",
    name: "Bodo",
    nativeName: "बर'",
    script: "Deva",
    indicTransTag: "brx_Deva",
    bcp47: "brx-IN",
    direction: "ltr",
    PRODUCT_LANGUAGE_SUPPORTED: true,
    INDICTRANS2_RUNTIME_SUPPORTED: true,
    VOICE_SUPPORTED: false,
    TRANSLITERATION_SUPPORTED: false
  },
  {
    code: "sat",
    name: "Santali",
    nativeName: "ᱥᱟᱱᱛᱟᱲᱤ",
    script: "Olck",
    indicTransTag: "sat_Olck",
    bcp47: "sat-IN",
    direction: "ltr",
    PRODUCT_LANGUAGE_SUPPORTED: true,
    INDICTRANS2_RUNTIME_SUPPORTED: true,
    VOICE_SUPPORTED: false,
    TRANSLITERATION_SUPPORTED: false
  },
  {
    code: "mni",
    name: "Manipuri (Meitei)",
    nativeName: "মৈতৈলোন্ / ꯃꯤꯇꯩꯂꯣꯟ",
    script: "Beng",
    indicTransTag: "mni_Beng",
    bcp47: "mni-IN",
    direction: "ltr",
    PRODUCT_LANGUAGE_SUPPORTED: true,
    INDICTRANS2_RUNTIME_SUPPORTED: true,
    VOICE_SUPPORTED: false,
    TRANSLITERATION_SUPPORTED: false
  },
  {
    code: "doi",
    name: "Dogri",
    nativeName: "डोगरी",
    script: "Deva",
    indicTransTag: "doi_Deva",
    bcp47: "doi-IN",
    direction: "ltr",
    PRODUCT_LANGUAGE_SUPPORTED: true,
    INDICTRANS2_RUNTIME_SUPPORTED: true,
    VOICE_SUPPORTED: false,
    TRANSLITERATION_SUPPORTED: false
  }
];

export const LANGUAGES_MAP = SUPPORTED_LANGUAGES.reduce((acc, lang) => {
  acc[lang.code] = lang;
  return acc;
}, {});

export function getLanguageMetadata(code) {
  return LANGUAGES_MAP[code] || LANGUAGES_MAP["en"];
}

export function isIndicTrans2Supported(code) {
  const lang = LANGUAGES_MAP[code];
  return Boolean(lang && lang.INDICTRANS2_RUNTIME_SUPPORTED);
}

export function isVoiceSupported(code) {
  const lang = LANGUAGES_MAP[code];
  return Boolean(lang && lang.VOICE_SUPPORTED);
}

export default SUPPORTED_LANGUAGES;
