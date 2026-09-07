/**
 * COOP HUB Central Multilingual Translation Engine
 * 
 * Single Source of Truth for Translation across all 23 Registered Languages (22 Scheduled + English).
 * 
 * Features:
 * 1. Lightweight Critical Catalog (Essential Synchronous Baseline)
 * 2. High-Performance In-Memory Cache
 * 3. Bounded Persistent Cache (LRU Eviction, No Unlimited Storage)
 * 4. In-Flight Request Deduplication (Prevents duplicate API calls & request storms)
 * 5. Background Auto-Fetch for Missing Translations with Reactive Event Dispatch
 * 6. IndicTrans2 Microservice Relay via Node API (/api/ai/translate)
 */

import { CRITICAL_CATALOG } from "./criticalCatalog.js";
import { SUPPORTED_LANGUAGES, LANGUAGES_MAP, getLanguageMetadata } from "./languages.js";
import enJson from "./en.json" with { type: "json" };

// Max items stored per language in localStorage to prevent unbounded storage growth
const MAX_PERSISTENT_CACHE_ENTRIES = 400;
const STORAGE_CACHE_KEY = "coophub_i18n_cache_v2";

// In-Memory Fast Cache
const translationMemoryCache = new Map();

// In-Flight Request Deduplication Map: (cacheKey -> Promise<string>)
const pendingRequests = new Map();

// Reverse lookup map: English string value -> catalog key (e.g. "Zone Management" -> "nav.zone_management")
const englishValueToKeyMap = new Map();

// Direct Key-to-Catalog mapping for instant, synchronous 23-language resolution
const DIRECT_CATALOG_ALIAS = {
  // Authentication & Common User Actions
  "welcome back": "auth.welcomeBack",
  "auth.welcomeback": "auth.welcomeBack",
  "welcome": "common.welcome",
  "create account": "auth.createAccount",
  "auth.createaccount": "auth.createAccount",
  "create an account": "auth.createAccount",
  "join coop hub": "auth.createAccount",
  "full name": "auth.fullName",
  "auth.fullname": "auth.fullName",
  "email address": "auth.email",
  "email": "auth.email",
  "auth.email": "auth.email",
  "password": "auth.password",
  "auth.password": "auth.password",
  "confirm password": "auth.confirmPassword",
  "auth.confirmpassword": "auth.confirmPassword",
  "forgot password?": "auth.forgotPassword",
  "forgot password": "auth.forgotPassword",
  "auth.forgotpassword": "auth.forgotPassword",
  "enter your password": "auth.enterPassword",
  "auth.enterpassword": "auth.enterPassword",
  "phone number": "auth.phoneNumber",
  "mobile number": "auth.phoneNumber",
  "phone": "auth.phoneNumber",
  "mobile / otp": "auth.sendOtp",
  "send otp": "auth.sendOtp",
  "enter otp": "auth.enterOtp",
  "verify otp": "auth.verifyOtp",
  "already have an account?": "auth.alreadyHaveAccount",
  "don't have an account?": "auth.dontHaveAccount",
  "dont have an account?": "auth.dontHaveAccount",
  "register here": "auth.registerHere",
  "back to portals": "auth.backToPortals",
  "back to portal selection": "auth.backToPortalSelection",
  "customer portal": "auth.customerPortal",
  "pillar portal": "auth.pillarPortal",
  "admin portal": "auth.adminPortal",
  "pillar login": "auth.pillarLogin",
  "auth.pillarlogin": "auth.pillarLogin",
  "admin login": "auth.adminLogin",
  "auth.adminlogin": "auth.adminLogin",
  "customer login": "auth.customerLogin",
  "auth.customerlogin": "auth.customerLogin",
  "sign in to your customer account": "auth.signInCustomer",
  "fill demo customer credentials": "auth.fillDemoCredentials",
  "coop admin": "auth.coopAdmin",
  "cooperative admin": "auth.coopAdmin",
  "admin management portal": "auth.adminManagementPortal",
  "authorized cooperative administrative officers only": "auth.authorizedOfficersOnly",
  "access your assigned jobs, customer requests & earnings": "auth.pillarAccessTagline",
  "kyc verification in progress": "auth.kycInProgress",
  "official application id": "auth.applicationId",
  "applicant": "auth.applicant",
  "sign in": "action.login",
  "action.login": "action.login",
  "sign out": "action.logout",
  "action.logout": "action.logout",
  "log in": "action.login",
  "login": "action.login",
  "register": "action.register",
  "action.register": "action.register",
  "show password": "auth.showPassword",
  "hide password": "auth.hidePassword",

  // Navigation & Sidebars (Customer, Pillar, Admin, Super Admin)
  "dashboard": "nav.dashboard",
  "navigation.dashboard": "nav.dashboard",
  "nav.dashboard": "nav.dashboard",
  "overview": "nav.dashboard",
  "admin.overview": "nav.dashboard",
  "home": "nav.home",
  "nav.home": "nav.home",
  "services": "nav.services",
  "find services": "nav.services",
  "navigation.find_services": "nav.services",
  "nav.services": "nav.services",
  "admin.services": "nav.services",
  "my requests": "nav.bookings",
  "requests": "nav.bookings",
  "bookings": "nav.bookings",
  "service requests": "nav.bookings",
  "navigation.my_requests": "nav.bookings",
  "admin.requests": "nav.bookings",
  "nav.bookings": "nav.bookings",
  "orders": "nav.bookings",
  "my orders": "nav.bookings",
  "orders.title": "nav.bookings",
  "messages": "nav.communication",
  "communication": "nav.communication",
  "admin communication": "nav.communication",
  "navigation.messages": "nav.communication",
  "admin.messages": "nav.communication",
  "broadcast messages": "nav.broadcast",
  "nav.communication": "nav.communication",
  "chat": "nav.communication",
  "customer chat": "nav.communication",
  "history": "nav.bookings",
  "navigation.history": "nav.bookings",
  "completed services": "nav.bookings",
  "history.title": "nav.bookings",
  "support": "nav.feedback",
  "help & support": "nav.feedback",
  "support.title": "nav.feedback",
  "navigation.support": "nav.feedback",
  "admin.support": "nav.feedback",
  "settings": "nav.settings",
  "settings.title": "nav.settings",
  "navigation.settings": "nav.settings",
  "admin.settings": "nav.settings",
  "nav.settings": "nav.settings",
  "settings & help": "nav.settings",
  "profile": "nav.profile",
  "profile.title": "nav.profile",
  "my profile": "nav.profile",
  "navigation.profile": "nav.profile",
  "nav.profile": "nav.profile",
  "customer dashboard": "brand.customer",
  "customer portal": "brand.customer",
  "brand.customer": "brand.customer",
  "pillar portal": "brand.pillar",
  "brand.pillar": "brand.pillar",
  "admin portal": "brand.admin",
  "admin management portal": "brand.admin",
  "brand.admin": "brand.admin",
  "apex command center": "brand.superAdmin",
  "brand.superadmin": "brand.superAdmin",
  "geography": "nav.geography",
  "nav.geography": "nav.geography",
  "admins": "nav.admins",
  "nav.admins": "nav.admins",
  "admin governance": "nav.admins",
  "zone management": "nav.zone_management",
  "nav.zone_management": "nav.zone_management",
  "access & permissions": "nav.access_permissions",
  "access and permissions": "nav.access_permissions",
  "nav.access_permissions": "nav.access_permissions",
  "enforcement": "nav.enforcement",
  "nav.enforcement": "nav.enforcement",
  "broadcast": "nav.broadcast",
  "nav.broadcast": "nav.broadcast",
  "feedback": "nav.feedback",
  "customer feedback": "nav.feedback",
  "feedback management": "nav.feedback",
  "nav.feedback": "nav.feedback",
  "pillar network": "nav.pillar_network",
  "pillars": "nav.pillar_network",
  "admin.pillars": "nav.pillar_network",
  "customers": "brand.customer",
  "admin.customers": "brand.customer",
  "nav.pillar_network": "nav.pillar_network",
  "operations": "nav.operations",
  "live operations": "nav.operations",
  "nav.operations": "nav.operations",
  "finance": "nav.finance",
  "coop finance": "nav.finance",
  "financials & payouts": "nav.finance",
  "admin.finance": "nav.finance",
  "nav.finance": "nav.finance",
  "earnings": "nav.earnings",
  "earnings.title": "nav.earnings",
  "nav.earnings": "nav.earnings",
  "welfare": "nav.welfare",
  "welfare fund": "nav.welfare",
  "welfare & pf": "nav.welfare",
  "welfare & insurance": "nav.welfare",
  "welfare management": "nav.welfare",
  "admin.welfare": "nav.welfare",
  "nav.welfare": "nav.welfare",
  "analytics": "nav.analytics",
  "nav.analytics": "nav.analytics",
  "ai intelligence": "nav.coopbot",
  "coopbot": "nav.coopbot",
  "coopbot assistant": "nav.coopbot",
  "nav.coopbot": "nav.coopbot",
  "ai demand forecast": "nav.analytics",
  "admin.forecast": "nav.analytics",
  "ai workforce allocation": "nav.allocation",
  "admin.allocation": "nav.allocation",
  "workforce allocation": "nav.allocation",
  "skill certifications": "nav.kyc",
  "admin.certifications": "nav.kyc",
  "live tracking": "nav.tracking",
  "admin.tracking": "nav.tracking",
  "tracking": "nav.tracking",
  "system management": "nav.system_health",
  "system health": "nav.system_health",
  "nav.system_health": "nav.system_health",
  "security & audit": "nav.security_audit",
  "nav.security_audit": "nav.security_audit",
  "portal hub (home)": "nav.home",
  "available (online)": "status.online",
  "offline (paused)": "status.offline",
  "online & available": "status.online",
  "log out": "action.logout",
  "sign out": "action.logout",
  "logout": "action.logout",
  "action.logout": "action.logout",
  "auth.logout": "action.logout",
  "sign in": "action.login",
  "login": "action.login",
  "action.login": "action.login",
  "submit": "action.submit",
  "action.submit": "action.submit",
  "save changes": "action.save",
  "save": "action.save",
  "action.save": "action.save",
  "cancel": "action.cancel",
  "action.cancel": "action.cancel",
  "confirm": "action.confirm",
  "action.confirm": "action.confirm",
  "delete": "action.delete",
  "edit": "action.edit",
  "search": "action.search",
  "filter": "action.filter",
  "refresh": "action.refresh",
  "register": "action.register",
  "action.register": "action.register",
  "proceed": "action.proceed",
  "retry": "action.retry",
  "back": "action.back",
  "next": "action.next",
  "close": "action.close",
  "loading...": "status.loading",
  "common.loading": "status.loading"
};

// Legacy and dot-notation key aliases to standard English labels
const KEY_ALIASES = {
  "navigation.dashboard": "Dashboard",
  "navigation.find_services": "Find Services",
  "navigation.my_requests": "My Requests",
  "navigation.messages": "Messages",
  "navigation.history": "History",
  "navigation.support": "Help & Support",
  "navigation.settings": "Settings",
  "navigation.profile": "Profile",
  "navigation.tickets": "My Support Tickets",
  "navigation.create_ticket": "Create Support Ticket",
  "navigation.home": "Explore Services",
  "navigation.notifications": "Notifications",
  "common.loading": "Loading...",
  "home.all_services": "Browse available services in your area",
  "home.search_placeholder": "Search services, workers...",
  "booking.status_requested": "Service Category Notice",
  "requests.empty_title": "No active requests",
  "requests.empty_desc": "You don't have any service requests tracked at the moment.",
  "support.title": "Help & Support",
  "support.createTicket": "Create Support Ticket",
  "support.myTickets": "My Support Tickets",
  "support.noTickets": "No tickets found",
  "support.adminResponse": "Admin Response",
  "settings.title": "Settings",
  "settings.language": "Language",
  "settings.about": "About COOP HUB",
  "settings.appVersion": "App Version",
  "profile.title": "My Profile",
  "profile.pillarIdReadOnly": "Pillar ID (Read-only)",
  "profile.personalInfo": "Personal Information",
  "auth.fullName": "Full Name",
  "auth.mobile": "Mobile Number",
  "auth.email": "Email Address",
  "auth.logout": "Log Out",
  "auth.login": "Sign In",
  "orders.pending": "Pending",
  "orders.accepted": "Accepted",
  "orders.inProgress": "In Progress",
  "orders.completed": "Completed",
  "orders.title": "My Orders",
  "orders.reject": "Reject",
  "orders.accept": "Accept",
  "orders.startTravel": "Start Travel",
  "orders.markArrived": "Mark Arrived",
  "notifications.title": "Notifications",
  "notifications.markAllRead": "Mark all as read",
  "history.title": "Completed Services",
  "earnings.title": "Earnings",
  "earnings.today": "Today's Revenue",
  "earnings.transactions": "Recent Transactions",
  "common.welcome": "Welcome",
  "dashboard.available": "Online & Available",
  "dashboard.offline": "Offline (Paused)",
  "dashboard.todayOrders": "Today's Orders",
  "dashboard.todayEarnings": "Today's Earnings",
  "dashboard.completedOrders": "Completed Orders",
  "dashboard.pendingPayments": "Pending Payouts"
};

/**
 * Resolve nested dot notation in an object (e.g. "navigation.dashboard" in enJson)
 */
function getNestedValue(obj, path) {
  if (!obj || !path) return null;
  const parts = path.split(".");
  let curr = obj;
  for (const part of parts) {
    if (curr && typeof curr === "object" && part in curr) {
      curr = curr[part];
    } else {
      return null;
    }
  }
  return typeof curr === "string" ? curr : null;
}

/**
 * Extract human English text from a key or alias
 */
function resolveEnglishText(key) {
  if (!key) return "";
  const normalized = String(key).trim();
  const lower = normalized.toLowerCase();
  
  if (CRITICAL_CATALOG.en?.[normalized]) return CRITICAL_CATALOG.en[normalized];
  if (DIRECT_CATALOG_ALIAS[lower] && CRITICAL_CATALOG.en?.[DIRECT_CATALOG_ALIAS[lower]]) {
    return CRITICAL_CATALOG.en[DIRECT_CATALOG_ALIAS[lower]];
  }
  if (KEY_ALIASES[normalized]) return KEY_ALIASES[normalized];
  
  const nested = getNestedValue(enJson, normalized);
  if (nested) return nested;
  
  // If dot notation key that was not mapped, convert last segment (e.g. "nav.dashboard" -> "Dashboard")
  if (normalized.includes(".")) {
    const lastPart = normalized.split(".").pop();
    return lastPart.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }
  return normalized;
}

// Initialize English reverse lookup map only with canonical CRITICAL_CATALOG keys
if (CRITICAL_CATALOG && CRITICAL_CATALOG.en) {
  for (const [k, v] of Object.entries(CRITICAL_CATALOG.en)) {
    if (typeof v === "string" && v.trim()) {
      englishValueToKeyMap.set(v.trim().toLowerCase(), k);
    }
  }
}
for (const [alias, catKey] of Object.entries(DIRECT_CATALOG_ALIAS)) {
  englishValueToKeyMap.set(alias.toLowerCase(), catKey);
}

/**
 * Load bounded persistent cache from localStorage into memory on startup
 */
function initPersistentCache() {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const raw = localStorage.getItem(STORAGE_CACHE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed && typeof parsed === "object") {
        for (const [lang, entries] of Object.entries(parsed)) {
          if (entries && typeof entries === "object") {
            for (const [key, val] of Object.entries(entries)) {
              translationMemoryCache.set(`${lang}:${key}`, val);
            }
          }
        }
      }
    }
  } catch (err) {
    console.warn("[CentralEngine] Failed to load persistent cache:", err);
  }
}

// Run initial load
initPersistentCache();

/**
 * Save an entry to the bounded persistent cache with LRU eviction
 */
function persistTranslation(lang, key, translatedText) {
  if (typeof window === "undefined" || !window.localStorage || !lang || !key || !translatedText) return;
  try {
    const raw = localStorage.getItem(STORAGE_CACHE_KEY);
    let cacheStore = {};
    if (raw) {
      try {
        cacheStore = JSON.parse(raw) || {};
      } catch (e) {
        cacheStore = {};
      }
    }

    if (!cacheStore[lang]) {
      cacheStore[lang] = {};
    }

    // Bounded eviction: if exceeding limit, delete oldest keys
    const keys = Object.keys(cacheStore[lang]);
    if (keys.length >= MAX_PERSISTENT_CACHE_ENTRIES) {
      const toDelete = keys.slice(0, Math.max(1, keys.length - MAX_PERSISTENT_CACHE_ENTRIES + 1));
      for (const k of toDelete) {
        delete cacheStore[lang][k];
      }
    }

    cacheStore[lang][key] = translatedText;
    localStorage.setItem(STORAGE_CACHE_KEY, JSON.stringify(cacheStore));
  } catch (err) {
    // Graceful catch for quota exceeded or storage disabled
    console.warn("[CentralEngine] Persistent storage write warning:", err.message);
  }
}

/**
 * Format string with parameter interpolation
 * Supports {key} and {{key}}
 */
export function interpolate(template, params = {}) {
  if (!template || typeof template !== "string") return template || "";
  return template.replace(/\{\{?([a-zA-Z0-9_-]+)\}?\}/g, (match, key) => {
    return params[key] !== undefined ? params[key] : match;
  });
}

/**
 * Deterministic Synchronous Translator
 * Used for instant UI rendering from the memory/persistent cache or critical catalog
 * Automatically dispatches background translation if missing.
 */
export function t(key, params = {}, currentLang = "en") {
  if (key === undefined || key === null || key === "") return "";
  const textKey = typeof key === "string" ? key.trim() : String(key);
  if (!textKey) return "";

  const lang = currentLang || "en";
  const lowerKey = textKey.toLowerCase();

  // 1. Resolve canonical catalog key (e.g. 'nav.services', 'nav.dashboard')
  const catalogKey = DIRECT_CATALOG_ALIAS[lowerKey] || 
                     DIRECT_CATALOG_ALIAS[textKey] || 
                     englishValueToKeyMap.get(lowerKey) || 
                     (CRITICAL_CATALOG.en?.[textKey] ? textKey : null);

  // 2. If target language is English, return clean English text
  if (lang === "en") {
    if (catalogKey && CRITICAL_CATALOG.en?.[catalogKey]) {
      return interpolate(CRITICAL_CATALOG.en[catalogKey], params);
    }
    const enVal = resolveEnglishText(textKey);
    return interpolate(enVal, params);
  }

  // 3. Direct match in target language catalog via canonical catalogKey
  if (catalogKey && CRITICAL_CATALOG[lang]?.[catalogKey]) {
    return interpolate(CRITICAL_CATALOG[lang][catalogKey], params);
  }

  // 4. Direct key match in Critical Catalog for target language
  if (CRITICAL_CATALOG[lang]?.[textKey]) {
    return interpolate(CRITICAL_CATALOG[lang][textKey], params);
  }

  // 5. Memory / Persistent Cache lookup
  const cacheKey = `${lang}:${textKey}`;
  if (translationMemoryCache.has(cacheKey)) {
    return interpolate(translationMemoryCache.get(cacheKey), params);
  }

  const englishText = catalogKey && CRITICAL_CATALOG.en?.[catalogKey] ? CRITICAL_CATALOG.en[catalogKey] : resolveEnglishText(textKey);
  const englishCacheKey = `${lang}:${englishText}`;
  if (translationMemoryCache.has(englishCacheKey)) {
    return interpolate(translationMemoryCache.get(englishCacheKey), params);
  }

  if (catalogKey) {
    const catCacheKey = `${lang}:${catalogKey}`;
    if (translationMemoryCache.has(catCacheKey)) {
      return interpolate(translationMemoryCache.get(catCacheKey), params);
    }
  }

  // 6. Slug fallback
  const slugKey = englishText.toLowerCase().replace(/[^a-z0-9]+/g, "_");
  const slugCacheKey = `${lang}:${slugKey}`;
  if (translationMemoryCache.has(slugCacheKey)) {
    return interpolate(translationMemoryCache.get(slugCacheKey), params);
  }

  // 7. Asynchronous Background Fetch (Deduplicated)
  queueBackgroundTranslation(englishText, textKey, lang);

  // 8. Fallback value for current render: clean English text
  return interpolate(englishText, params);
}

// Queued items for batch background fetching: Map<lang, Map<originalKey, sourceText>>
const queuedBatches = new Map();
const batchTimeouts = new Map();

/**
 * Queue a background translation with batch aggregation and request deduplication
 */
function queueBackgroundTranslation(sourceText, originalKey, targetLang) {
  if (typeof window === "undefined" || !sourceText || targetLang === "en") return;

  const cacheKey = `${targetLang}:${originalKey}`;
  const textCacheKey = `${targetLang}:${sourceText}`;

  // If already cached or already pending, do not re-request
  if (translationMemoryCache.has(cacheKey) || translationMemoryCache.has(textCacheKey) || pendingRequests.has(cacheKey)) {
    return;
  }

  // Mark as pending so concurrent calls don't duplicate
  pendingRequests.set(cacheKey, true);

  if (!queuedBatches.has(targetLang)) {
    queuedBatches.set(targetLang, new Map());
  }
  queuedBatches.get(targetLang).set(originalKey, sourceText);

  // Debounce batch execution by 40ms to collect all strings from the current render cycle
  if (batchTimeouts.has(targetLang)) {
    clearTimeout(batchTimeouts.get(targetLang));
  }

  batchTimeouts.set(
    targetLang,
    setTimeout(() => {
      flushBatchQueue(targetLang);
    }, 40)
  );
}

/**
 * Flush and translate the aggregated batch of strings for a target language
 */
async function flushBatchQueue(targetLang) {
  const batchMap = queuedBatches.get(targetLang);
  if (!batchMap || batchMap.size === 0) return;

  queuedBatches.delete(targetLang);
  batchTimeouts.delete(targetLang);

  const entries = Array.from(batchMap.entries()); // [[originalKey, sourceText], ...]
  const uniqueTexts = Array.from(new Set(entries.map(([, text]) => text)));

  try {
    const translations = await translateBatchDynamic(uniqueTexts, targetLang, "en");
    const textToTranslationMap = new Map();
    uniqueTexts.forEach((srcText, idx) => {
      textToTranslationMap.set(srcText, translations[idx] || srcText);
    });

    let updatedCount = 0;
    for (const [originalKey, sourceText] of entries) {
      const translated = textToTranslationMap.get(sourceText);
      if (translated && translated !== sourceText) {
        const cacheKey = `${targetLang}:${originalKey}`;
        const textCacheKey = `${targetLang}:${sourceText}`;
        translationMemoryCache.set(cacheKey, translated);
        translationMemoryCache.set(textCacheKey, translated);
        persistTranslation(targetLang, originalKey, translated);
        updatedCount++;
      }
      pendingRequests.delete(`${targetLang}:${originalKey}`);
    }

    if (updatedCount > 0 && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("coophub_translation_updated", {
        detail: { lang: targetLang, count: updatedCount }
      }));
    }
  } catch (err) {
    console.warn(`[CentralEngine] Batch translation error for ${targetLang}:`, err.message);
    for (const [originalKey] of entries) {
      pendingRequests.delete(`${targetLang}:${originalKey}`);
    }
  }
}

/**
 * Direct Batch Translator API Connector
 */
export async function translateBatchDynamic(texts = [], targetLang = "en", sourceLang = "en") {
  if (!Array.isArray(texts) || texts.length === 0) return [];
  if (targetLang === sourceLang || targetLang === "en") return texts;

  const targetMeta = getLanguageMetadata(targetLang);
  const sourceMeta = getLanguageMetadata(sourceLang);
  const isNode = typeof window === "undefined";
  const apiBase = isNode ? "http://localhost:5000" : ((typeof import.meta !== 'undefined' && import.meta.env?.VITE_SERVER_URL) ? import.meta.env.VITE_SERVER_URL.replace(/\/+$/, '') : "");

  try {
    const response = await fetch(`${apiBase}/api/ai/translate/batch`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        texts,
        source_lang: sourceMeta.indicTransTag || "eng_Latn",
        target_lang: targetMeta.indicTransTag || "hin_Deva",
        source_code: sourceMeta.code,
        target_code: targetMeta.code
      })
    });

    if (response.ok) {
      const data = await response.json();
      if (data && Array.isArray(data.translations)) {
        return data.translations;
      }
    }
  } catch (err) {
    console.warn(`[CentralEngine] Batch API network failed, falling back:`, err.message);
  }

  // Fallback: Individual requests
  return Promise.all(texts.map((t) => translateDynamic(t, targetLang, sourceLang)));
}

/**
 * Asynchronous Dynamic Translator
 * Calls /api/ai/translate (IndicTrans2 Backend Microservice) with In-Flight Request Deduplication
 */
export async function translateDynamic(text, targetLang = "en", sourceLang = "en", options = {}) {
  if (!text || typeof text !== "string" || !text.trim()) {
    return text || "";
  }

  const cleanText = text.trim();
  const targetMeta = getLanguageMetadata(targetLang);
  const sourceMeta = getLanguageMetadata(sourceLang);

  if (targetMeta.code === sourceMeta.code) {
    return cleanText;
  }

  const cacheKey = `${targetMeta.code}:${cleanText}`;

  // 1. Check memory cache
  if (translationMemoryCache.has(cacheKey) && !options.forceFresh) {
    return translationMemoryCache.get(cacheKey);
  }

  // 2. Check critical catalog via direct key or reverse English text lookup
  let staticMatch = CRITICAL_CATALOG[targetMeta.code]?.[cleanText];
  if (!staticMatch) {
    const catalogKey = englishValueToKeyMap.get(cleanText.toLowerCase());
    if (catalogKey) {
      staticMatch = CRITICAL_CATALOG[targetMeta.code]?.[catalogKey];
    }
  }
  if (staticMatch) {
    translationMemoryCache.set(cacheKey, staticMatch);
    return staticMatch;
  }

  // 3. In-flight request deduplication: return existing pending promise
  if (pendingRequests.has(cacheKey) && !options.forceFresh && typeof pendingRequests.get(cacheKey) !== "boolean") {
    return pendingRequests.get(cacheKey);
  }

  // 4. Dispatch new network request with deduplication
  const requestPromise = (async () => {
    try {
      const isNode = typeof window === "undefined";
      const apiBase = options.apiBase || (isNode ? "http://localhost:5000" : ((typeof import.meta !== 'undefined' && import.meta.env?.VITE_SERVER_URL) ? import.meta.env.VITE_SERVER_URL.replace(/\/+$/, '') : ""));
      
      const response = await fetch(`${apiBase}/api/ai/translate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          text: cleanText,
          source_lang: sourceMeta.indicTransTag || "eng_Latn",
          target_lang: targetMeta.indicTransTag || "hin_Deva",
          source_code: sourceMeta.code,
          target_code: targetMeta.code,
          context: options.context || "general"
        })
      });

      if (!response.ok) {
        throw new Error(`Translation API HTTP ${response.status}`);
      }

      const data = await response.json();
      const result = (data && data.translated_text) ? data.translated_text : cleanText;

      // Update in-memory and bounded persistent cache
      translationMemoryCache.set(cacheKey, result);
      persistTranslation(targetMeta.code, cleanText, result);

      return result;
    } catch (error) {
      console.warn(`[CentralEngine] Dynamic translation failed for '${cleanText.substring(0, 20)}...':`, error.message);
      return cleanText;
    } finally {
      // Clean up in-flight tracker
      pendingRequests.delete(cacheKey);
    }
  })();

  pendingRequests.set(cacheKey, requestPromise);
  return requestPromise;
}

/**
 * Batch translation utility
 */
export async function translateBatch(texts = [], targetLang = "en", sourceLang = "en") {
  return translateBatchDynamic(texts, targetLang, sourceLang);
}

/**
 * Cache management helpers
 */
export function clearTranslationCache() {
  translationMemoryCache.clear();
  pendingRequests.clear();
  if (typeof window !== "undefined" && window.localStorage) {
    try {
      localStorage.removeItem(STORAGE_CACHE_KEY);
    } catch (e) {}
  }
}

export function getCacheStats() {
  return {
    memoryEntries: translationMemoryCache.size,
    pendingRequests: pendingRequests.size
  };
}

export { SUPPORTED_LANGUAGES, LANGUAGES_MAP, getLanguageMetadata, CRITICAL_CATALOG };

export const CentralEngine = {
  t,
  translateDynamic,
  translateBatch,
  interpolate,
  clearTranslationCache,
  getCacheStats,
  SUPPORTED_LANGUAGES,
  LANGUAGES_MAP,
  CRITICAL_CATALOG
};

export default CentralEngine;


