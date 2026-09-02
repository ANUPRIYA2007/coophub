// ==========================================
// COOP HUB — Unified Global Translation Store
// ==========================================
// Merges all Portal translations (Customer, Pillar, Admin, Auth, AI Mascot)
// for seamless platform-wide multilingual support.

import enJson from './en.json';
import taJson from './ta.json';
import hiJson from './hi.json';
import teJson from './te.json';
import knJson from './kn.json';

import { en as enJs } from './translations/en.js';
import { ta as taJs } from './translations/ta.js';
import { hi as hiJs } from './translations/hi.js';
import { te as teJs } from './translations/te.js';
import { kn as knJs } from './translations/kn.js';

// Extra complete portal & admin translations dictionary
const extraTranslations = {
  en: {
    admin: {
      portal_label: "ADMIN PORTAL",
      cooperative_admin: "Cooperative Admin",
      available_online: "Available (Online)",
      offline_paused: "Offline (Paused)",
      overview: "Overview",
      chatai: "Chat AI Operations",
      forecast: "AI Demand Forecast",
      allocation: "AI Workforce Allocation",
      certifications: "Skill Certifications",
      pillars: "Pillars",
      customers: "Customers",
      services: "Services",
      requests: "Service Requests",
      tracking: "Live Tracking",
      finance: "Financials & Payouts",
      feedback: "Customer Feedback",
      messages: "Broadcast Messages",
      settings_group: "Settings & Help",
      support: "Support",
      welfare: "Welfare & PF",
      settings: "Settings",
      logout: "Logout",
      settings_title: "Platform & Cooperative Configuration",
      settings_subtitle: "Fine-tune financial commissions, auto-dispatch parameters, and emergency configurations.",
      financial_commission: "Financial & Cooperative Commission",
      commission_fee: "Cooperative Commission Fee (%)",
      commission_desc: "Default cooperative platform share (standard: 8.5%)",
      payout_cycle: "Payout Cycle Schedule",
      dispatch_controls: "Dispatch & Geospatial Controls",
      max_radius: "Maximum Service Search Radius (KM)",
      sos_contact: "Emergency SOS Contact Number",
      auto_dispatch: "Enable AI Intelligent Auto-Dispatch (Auto matches nearest qualified Pillar)",
      system_notice: "Global System Notice / Banner",
      save_settings: "Save Platform Settings",
      saved_success: "Admin system settings saved and applied in real-time!"
    }
  },
  ta: {
    admin: {
      portal_label: "நிர்வாக போர்ட்டல்",
      cooperative_admin: "கூட்டுறவு நிர்வாகி",
      available_online: "செயலில் (ஆன்லைன்)",
      offline_paused: "ஆஃப்லைன் (நிறுத்தப்பட்டது)",
      overview: "கண்ணோட்டம்",
      chatai: "AI செயல்பாட்டு அரட்டை",
      forecast: "AI தேவை முன்கணிப்பு",
      allocation: "AI பணி ஒதுக்கீடு",
      certifications: "திறன் சான்றிதழ்கள்",
      pillars: "பில்லர்கள்",
      customers: "வாடிக்கையாளர்கள்",
      services: "சேவைகள்",
      requests: "சேவை கோரிக்கைகள்",
      tracking: "நேரலை கண்காணிப்பு",
      finance: "நிதி & கொடுப்பனவுகள்",
      feedback: "வாடிக்கையாளர் கருத்து",
      messages: "அறிவிப்பு செய்திகள்",
      settings_group: "அமைப்புகள் & உதவி",
      support: "ஆதரவு மையம்",
      welfare: "நலன்புரி & PF",
      settings: "அமைப்புகள்",
      logout: "வெளியேறு",
      settings_title: "தளம் மற்றும் கூட்டுறவு கட்டமைப்பு",
      settings_subtitle: "நிதி கமிஷன்கள், தானியங்கி ஒதுக்கீட்டு அளவுருக்கள் மற்றும் அவசர அமைப்புகளை மாற்றியமைக்கவும்.",
      financial_commission: "நிதி & கூட்டுறவு கமிஷன்",
      commission_fee: "கூட்டுறவு கமிஷன் கட்டணம் (%)",
      commission_desc: "நிலையான கூட்டுறவு தளம் பங்கு (இயல்பு: 8.5%)",
      payout_cycle: "பணம் வழங்கும் அட்டவணை",
      dispatch_controls: "ஒதுக்கீடு & புவிசார் கட்டுப்பாடுகள்",
      max_radius: "அதிகபட்ச சேவை தேடல் ஆரம் (கி.மீ)",
      sos_contact: "அவசர உதவி SOS தொடர்பு எண்",
      auto_dispatch: "AI தானியங்கி ஒதுக்கீட்டை இயக்குக (தகுதியான பில்லரை உடனடியாக இணைக்கும்)",
      system_notice: "உலகளாவிய அமைப்பு அறிவிப்பு / பேனர்",
      save_settings: "அமைப்புகளைச் சேமிக்கவும்",
      saved_success: "நிர்வாக அமைப்புகள் வெற்றிகரமாக சேமிக்கப்பட்டு அமல்படுத்தப்பட்டது!"
    }
  },
  hi: {
    admin: {
      portal_label: "व्यवस्थापक पोर्टल",
      cooperative_admin: "सहकारी व्यवस्थापक",
      available_online: "उपलब्ध (ऑनलाइन)",
      offline_paused: "ऑफ़लाइन (रोका गया)",
      overview: "अवलोकन",
      chatai: "एआई संचालन चैट",
      forecast: "एआई मांग पूर्वानुमान",
      allocation: "एआई कार्यबल आवंटन",
      certifications: "कौशल प्रमाणन",
      pillars: "पिलर्स",
      customers: "ग्राहक",
      services: "सेवाएं",
      requests: "सेवा अनुरोध",
      tracking: "लाइव ट्रैकिंग",
      finance: "वित्तीय और भुगतान",
      feedback: "ग्राहक प्रतिक्रिया",
      messages: "प्रसारण संदेश",
      settings_group: "सेटिंग्स और सहायता",
      support: "सहायता",
      welfare: "कल्याण और पीएफ",
      settings: "सेटिंग्स",
      logout: "लॉग आउट",
      settings_title: "प्लेटफ़ॉर्म और सहकारी कॉन्फ़िगरेशन",
      settings_subtitle: "वित्तीय कमीशन, ऑटो-डिस्पैच पैरामीटर और आपातकालीन सेटिंग्स समायोजित करें।",
      financial_commission: "वित्तीय और सहकारी कमीशन",
      commission_fee: "सहकारी कमीशन शुल्क (%)",
      commission_desc: "मानक सहकारी प्लेटफ़ॉर्म हिस्सा (मानक: 8.5%)",
      payout_cycle: "भुगतान चक्र अनुसूची",
      dispatch_controls: "डिस्पैच और भू-स्थानिक नियंत्रण",
      max_radius: "अधिकतम सेवा खोज दायरा (किमी)",
      sos_contact: "आपातकालीन एसओएस संपर्क नंबर",
      auto_dispatch: "एआई इंटेलिजेंट ऑटो-डिस्पैच सक्षम करें",
      system_notice: "ग्लोबल सिस्टम नोटिस / बैनर",
      save_settings: "प्लेटफ़ॉर्म सेटिंग्स सहेजें",
      saved_success: "व्यवस्थापक सेटिंग्स सफलतापूर्वक सहेजी गईं!"
    }
  },
  te: {
    admin: {
      portal_label: "అడ్మిన్ పోర్టల్",
      cooperative_admin: "సహకార అడ్మిన్",
      available_online: "అందుబాటులో ఉంది (ఆన్‌లైన్)",
      offline_paused: "ఆఫ్‌లైన్ (నిలిపివేయబడింది)",
      overview: "అవలోకనం",
      chatai: "AI ఆపరేషన్స్ చాట్",
      forecast: "AI డిమాండ్ అంచనా",
      allocation: "AI వర్క్‌ఫోర్స్ కేటాయింపు",
      certifications: "నైపుణ్య ధృవీకరణలు",
      pillars: "పిల్లర్లు",
      customers: "కస్టమర్లు",
      services: "సేవలు",
      requests: "సేవా అభ్యర్థనలు",
      tracking: "లైవ్ ట్రాకింగ్",
      finance: "ఆర్థిక & చెల్లింపులు",
      feedback: "కస్టమర్ అభిప్రాయం",
      messages: "ప్రసార సందేశాలు",
      settings_group: "సెట్టింగ్‌లు & సహాయం",
      support: "మద్దతు",
      welfare: "సంక్షేమం & పీఎఫ్",
      settings: "సెట్టింగ్‌లు",
      logout: "లాగ్ అవుట్",
      settings_title: "ప్లాట్‌ఫారమ్ మరియు సహకార కాన్ఫిగరేషన్",
      settings_subtitle: "కమిషన్లు, ఆటో-డిస్పాచ్ మరియు అత్యవసర కాన్ఫిగరేషన్‌లను సర్దుబాటు చేయండి.",
      financial_commission: "ఆర్థిక & సహకార కమిషన్",
      commission_fee: "సహకార కమిషన్ రుసుము (%)",
      commission_desc: "డిఫాల్ట్ సహకార వాటా (స్టాండర్డ్: 8.5%)",
      payout_cycle: "చెల్లింపు షెడ్యూల్",
      dispatch_controls: "డిస్పాచ్ & జియోస్పేషియల్ నియంత్రణలు",
      max_radius: "గరిష్ట సేవా శోధన వ్యాసార్థం (కి.మీ)",
      sos_contact: "అత్యవసర SOS సంప్రదింపు సంఖ్య",
      auto_dispatch: "AI ఇంటెలిజెంట్ ఆటో-డిస్పాచ్‌ను ప్రారంభించండి",
      system_notice: "గ్లోబల్ సిస్టమ్ నోటీసు / బ్యానర్",
      save_settings: "సెట్టింగ్‌లను సేవ్ చేయండి",
      saved_success: "అడ్మిన్ సెట్టింగ్‌లు విజయవంతంగా సేవ్ చేయబడ్డాయి!"
    }
  },
  kn: {
    admin: {
      portal_label: "ನಿರ್ವಾಹಕ ಪೋರ್ಟಲ್",
      cooperative_admin: "ಸಹಕಾರಿ ನಿರ್ವಾಹಕ",
      available_online: "ಲಭ್ಯವಿದೆ (ಆನ್‌ಲೈನ್)",
      offline_paused: "ಆಫ್‌ಲೈನ್ (ವಿರಾಮಗೊಳಿಸಲಾಗಿದೆ)",
      overview: "ಅವಲೋಕನ",
      chatai: "AI ಕಾರ್ಯಾಚರಣೆ ಚಾಟ್",
      forecast: "AI ಬೇಡಿಕೆ ಮುನ್ಸೂಚನೆ",
      allocation: "AI ಕಾರ್ಯಪಡೆ ಹಂಚಿಕೆ",
      certifications: "ಕೌಶಲ್ಯ ಪ್ರಮಾಣಪತ್ರಗಳು",
      pillars: "ಪಿಲ್ಲರ್‌ಗಳು",
      customers: "ಗ್ರಾಹಕರು",
      services: "ಸೇವೆಗಳು",
      requests: "ಸೇವಾ ವಿನಂತಿಗಳು",
      tracking: "ಲೈವ್ ಟ್ರ್ಯಾಕಿಂಗ್",
      finance: "ಹಣಕಾಸು & ಪಾವತಿಗಳು",
      feedback: "ಗ್ರಾಹಕರ ಪ್ರತಿಕ್ರಿಯೆ",
      messages: "ಪ್ರಸಾರ ಸಂದೇಶಗಳು",
      settings_group: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು & ಸಹಾಯ",
      support: "ಬೆಂಬಲ",
      welfare: "ಕ್ಷೇಮಾಭಿವೃದ್ಧಿ & ಪಿಎಫ್",
      settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳು",
      logout: "ಲಾಗ್ ಔಟ್",
      settings_title: "ಪ್ಲಾಟ್‌ಫಾರ್ಮ್ ಮತ್ತು ಸಹಕಾರ ಸಂರಚನೆ",
      settings_subtitle: "ಕಮಿಷನ್, ಸ್ವಯಂ-ರವಾನೆ ನಿಯತಾಂಕಗಳು ಮತ್ತು ತುರ್ತು ಸಂರಚನೆಗಳನ್ನು ಹೊಂದಿಸಿ.",
      financial_commission: "ಹಣಕಾಸು & ಸಹಕಾರಿ ಕಮಿಷನ್",
      commission_fee: "ಸಹಕಾರಿ ಕಮಿಷನ್ ಶುಲ್ಕ (%)",
      commission_desc: "ಪ್ರಮಾಣಿತ ಸಹಕಾರಿ ಪಾಲು (8.5%)",
      payout_cycle: "ಪಾವತಿ ವೇಳಾಪಟ್ಟಿ",
      dispatch_controls: "ರವಾನೆ ಮತ್ತು ಜಿಯೋಸ್ಪೇಷಿಯಲ್ ನಿಯಂತ್ರಣಗಳು",
      max_radius: "ಗರಿಷ್ಠ ಸೇವಾ ಹುಡುಕಾಟ ತ್ರಿಜ್ಯ (ಕಿ.ಮೀ)",
      sos_contact: "ತುರ್ತು SOS ಸಂಪರ್ಕ ಸಂಖ್ಯೆ",
      auto_dispatch: "AI ಇಂಟೆಲಿಜೆಂಟ್ ಆಟೋ-ರವಾನೆಯನ್ನು ಸಕ್ರಿಯಗೊಳಿಸಿ",
      system_notice: "ಜಾಗತಿಕ ಸಿಸ್ಟಮ್ ಸೂಚನೆ / ಬ್ಯಾನರ್",
      save_settings: "ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಉಳಿಸಿ",
      saved_success: "ನಿರ್ವಾಹಕ ಸೆಟ್ಟಿಂಗ್‌ಗಳನ್ನು ಯಶಸ್ವಿಯಾಗಿ ಉಳಿಸಲಾಗಿದೆ!"
    }
  }
};

// Deep merge helper
function deepMerge(target = {}, source = {}) {
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          output[key] = source[key];
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        output[key] = source[key];
      }
    });
  }
  return output;
}

function isObject(item) {
  return item && typeof item === 'object' && !Array.isArray(item);
}

// Construct merged translation tables
export const unifiedTranslations = {
  en: deepMerge(deepMerge(enJson || {}, enJs || {}), extraTranslations.en),
  ta: deepMerge(deepMerge(taJson || {}, taJs || {}), extraTranslations.ta),
  hi: deepMerge(deepMerge(hiJson || {}, hiJs || {}), extraTranslations.hi),
  te: deepMerge(deepMerge(teJson || {}, teJs || {}), extraTranslations.te),
  kn: deepMerge(deepMerge(knJson || {}, knJs || {}), extraTranslations.kn),
};

export const SUPPORTED_LANGUAGES = [
  { code: 'en', name: 'English', nativeName: 'English' },
  { code: 'ta', name: 'Tamil', nativeName: 'தமிழ்' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी' },
  { code: 'te', name: 'Telugu', nativeName: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', nativeName: 'ಕನ್ನಡ' }
];

export const LANGUAGES_MAP = {
  en: 'English',
  ta: 'தமிழ்',
  hi: 'हिन्दी',
  te: 'తెలుగు',
  kn: 'ಕನ್ನಡ'
};

export function getTranslation(lang, key, params = {}) {
  const dictionary = unifiedTranslations[lang] || unifiedTranslations.en || {};
  const keys = key.split('.');
  let val = dictionary;
  for (const k of keys) {
    if (val && typeof val === 'object' && k in val) {
      val = val[k];
    } else {
      val = null;
      break;
    }
  }

  // Fallback to English if not found
  if (val === null || val === undefined) {
    let fallback = unifiedTranslations.en;
    for (const k of keys) {
      if (fallback && typeof fallback === 'object' && k in fallback) {
        fallback = fallback[k];
      } else {
        fallback = key;
        break;
      }
    }
    val = fallback;
  }

  if (typeof val === 'string' && params && typeof params === 'object') {
    Object.keys(params).forEach(p => {
      val = val.replace(new RegExp(`{${p}}`, 'g'), params[p]);
    });
  }

  return val || key;
}

export default unifiedTranslations;
