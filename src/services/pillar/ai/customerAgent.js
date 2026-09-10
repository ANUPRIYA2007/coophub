import { callPillarAiApi } from "./aiApi.js";
import { formatContextForSystemPrompt } from "../../ai/dynamicContextService.js";
import { getLanguageMetadata } from "../../../i18n/languages.js";
import { translateDynamic } from "../../../i18n/centralEngine.js";
import { SUB_SERVICES_CATALOG } from "../../../utils/subServicesCatalog.js";

const CUSTOMER_ROUTE_DATA = {
  "/home": {
    en: "Welcome to your Customer Dashboard! You can browse certified cooperative technicians or monitor your active bookings.",
    ta: "வாடிக்கையாளர் முகப்புப் பக்கத்திற்கு வருக! சிறந்த தொழில்நுட்ப வல்லுநர்களைத் தேர்ந்தெடுக்கலாம் அல்லது உங்கள் முன்பதிவுகளைக் கண்காணிக்கலாம்.",
    tipPrompt: "Customer is on the Customer Home Dashboard. Give a 1-sentence helpful tip about booking services or viewing recent requests."
  },
  "/services": {
    en: "Browse verified technicians across Electrical, Plumbing, AC Repair, Carpentry, Painting, Cleaning, and 16 certified cooperative services across Chennai.",
    ta: "மின்சாரம், பிளம்பிங், ஏசி பழுது மற்றும் 16 கூட்டுறவு சேவைகளுக்கான சரிபார்க்கப்பட்ட தொழில்நுட்ப வல்லுநர்களை இங்கே தேர்ந்தெடுக்கவும்.",
    tipPrompt: "Customer is browsing Find Services. Give a 1-sentence tip on choosing from our 16 main service categories and 80 sub-service options with transparent tariffs."
  },
  "/requests": {
    en: "Your live bookings queue! Check technician arrival progress, job status, and service dispatch OTP.",
    ta: "உங்கள் நேரடி முன்பதிவுகள் பட்டியல்! தொழில்நுட்ப வல்லுநரின் வருகை மற்றும் சேவை நிலையை இங்கே பார்க்கலாம்.",
    tipPrompt: "Customer is viewing My Requests. Give a 1-sentence tip about tracking arrival OTP and technician dispatch."
  },
  "/messages": {
    en: "Live technician chat! Communicate directly with your assigned cooperative professional in real time.",
    ta: "தொழில்நுட்ப வல்லுநருடன் நேரடி உரையாடல்! உங்கள் முன்பதிவு விவரங்களை இங்கே பகிருங்கள்.",
    tipPrompt: "Customer is in Messages. Give a 1-sentence tip on coordinating with the technician regarding service timings and location."
  },
  "/history": {
    en: "Your complete service history. Review completed jobs, download GST invoices, and rate your technicians.",
    ta: "உங்கள் முந்தைய சேவைகள்! நிறைவு செய்யப்பட்ட பணிகள் மற்றும் கட்டண ரசீதுகளை இங்கே பதிவிறக்கலாம்.",
    tipPrompt: "Customer is reviewing History. Give a 1-sentence tip about checking invoices and providing technician feedback."
  },
  "/support": {
    en: "COOP HUB Help Desk. Need help with a booking or technician? I am here 24/7 to assist you!",
    ta: "உதவி மையம்: முன்பதிவு அல்லது கட்டணம் தொடர்பான எந்தவொரு கேள்விகளுக்கும் உதவ நான் தயார்!",
    tipPrompt: "Customer is on Support page. Give a 1-sentence friendly tip about 24/7 support assistance and ticket resolution."
  },
  "/settings": {
    en: "Account Settings: Manage your notification preferences, preferred language, and security options.",
    ta: "அமைப்புகள்: மொழி விருப்பங்கள், அறிவிப்புகள் மற்றும் கணக்கு பாதுகாப்பை இங்கே நிர்வகிக்கலாம்.",
    tipPrompt: "Customer is in Settings. Give a 1-sentence tip on managing language preferences, dark mode, and security."
  },
  "/profile": {
    en: "Customer Profile: Update your contact info, email address, and saved home service locations.",
    ta: "வாடிக்கையாளர் சுயவிவரம்: உங்கள் தொடர்பு எண்கள் மற்றும் வீட்டு முகவரிகளை இங்கே புதுப்பிக்கலாம்.",
    tipPrompt: "Customer is in Profile. Give a 1-sentence tip on updating home addresses for faster doorstep technician arrival."
  },
};

/**
 * Helper to match query against any of the 80 sub-services
 */
function findSubService(query = '') {
  if (!query) return null;
  const q = query.toLowerCase();

  // 1. Direct name match
  for (const sub of SUB_SERVICES_CATALOG) {
    if (q.includes(sub.name.toLowerCase())) {
      return sub;
    }
  }

  // 2. Keyword match
  const keywordMap = [
    { k: ['ceiling fan', 'switchboard', 'fan wiring', 'fan fix', 'fan repair'], id: 'b0000000-0000-0000-0000-000000000004' },
    { k: ['light', 'tube light', 'led install'], id: 'sub_elec_02' },
    { k: ['rewiring', 'short circuit', 'wiring'], id: 'sub_elec_03' },
    { k: ['mcb', 'distribution board', 'breaker'], id: 'sub_elec_04' },
    { k: ['socket', 'switch repair', 'plug point'], id: 'sub_elec_05' },
    { k: ['pipe leak', 'leakage', 'leaking pipe', 'water pipe'], id: 'b0000000-0000-0000-0000-000000000005' },
    { k: ['tap', 'faucet', 'dripping tap'], id: 'sub_plumb_02' },
    { k: ['sink', 'wash basin'], id: 'sub_plumb_03' },
    { k: ['toilet', 'commode', 'flush'], id: 'sub_plumb_04' },
    { k: ['drainage', 'blockage', 'drain clean'], id: 'sub_plumb_05' },
    { k: ['ac general', 'ac service', 'filter clean'], id: 'b0000000-0000-0000-0000-000000000006' },
    { k: ['ac gas', 'freon', 'cooling low'], id: 'sub_ac_02' },
    { k: ['ac install', 'split ac'], id: 'sub_ac_03' },
    { k: ['ac deep clean', 'foam wash'], id: 'sub_ac_04' },
    { k: ['furniture assembly', 'table assembly'], id: 'b0000000-0000-0000-0000-000000000007' },
    { k: ['door lock', 'handle repair'], id: 'sub_carp_02' },
    { k: ['sofa cleaning', 'upholstery'], id: 'sub_clean_04' },
    { k: ['washing machine'], id: 'b0000000-0000-0000-0000-000000000009' },
    { k: ['refrigerator', 'fridge'], id: 'sub_app_02' },
    { k: ['water purifier', 'ro repair'], id: 'sub_app_04' },
    { k: ['geyser', 'water heater'], id: 'sub_app_05' },
    { k: ['painting', 'interior paint', 'wall paint'], id: 'b0000000-0000-0000-0000-000000000010' },
    { k: ['driver', 'chauffeur', 'car driver'], id: 'b0000000-0000-0000-0000-000000000014' },
    { k: ['maid', 'housekeeping', 'domestic helper'], id: 'b0000000-0000-0000-0000-000000000015' },
    { k: ['cook', 'home cook', 'meal prep'], id: 'sub_help_03' },
    { k: ['caregiver', 'elderly care', 'patient care'], id: 'b0000000-0000-0000-0000-000000000016' },
    { k: ['baby sitting', 'child care', 'nanny'], id: 'sub_care_03' },
    { k: ['welding', 'fabrication', 'grill gate'], id: 'b0000000-0000-0000-0000-000000000018' },
    { k: ['emergency technician', 'instant technician'], id: 'b0000000-0000-0000-0000-000000000019' }
  ];

  for (const item of keywordMap) {
    if (item.k.some(kw => q.includes(kw))) {
      const found = SUB_SERVICES_CATALOG.find(s => s.id === item.id);
      if (found) return found;
    }
  }

  return null;
}

export const customerAgent = {
  async handle(query, context = {}) {
    const { language = "en", route = "/home" } = context;
    const langMeta = getLanguageMetadata(language);
    const langName = langMeta?.name || "English";

    // Dynamic Route Context check (including /services/:id)
    let matchedRoute = Object.keys(CUSTOMER_ROUTE_DATA).find(
      (r) => route === r || (route.startsWith(r) && r !== "/home")
    ) || "/home";

    let routeInfo = CUSTOMER_ROUTE_DATA[matchedRoute];

    // Check if on a specific service page (e.g. /services/a0000... or /services/electrical-repair)
    if (route.startsWith("/services/") && !route.endsWith("/request")) {
      const pathParam = route.split("/services/")[1]?.split("/")[0]?.toLowerCase();
      const matchedSubServices = SUB_SERVICES_CATALOG.filter(s => 
        s.service_id.toLowerCase() === pathParam ||
        s.service_name.toLowerCase().replace(/\s+/g, '-').includes(pathParam) ||
        pathParam.includes(s.service_name.toLowerCase().split(' ')[0])
      );
      if (matchedSubServices.length > 0) {
        const sName = matchedSubServices[0].service_name;
        routeInfo = {
          en: `Viewing ${sName}. Select from 5 certified sub-service options starting at ₹${matchedSubServices[0].base_price} with transparent tariffs.`,
          ta: `${sName} சேவையைப் பார்க்கிறீர்கள். 5 சான்றளிக்கப்பட்ட துணை சேவைகளிலிருந்து தேர்வு செய்யவும்.`,
          tipPrompt: `Customer is on ${sName} service details page. Mention that 5 verified sub-services are available starting at ₹${matchedSubServices[0].base_price} with 0% surge.`
        };
      }
    }

    const fallback = routeInfo?.[language] || routeInfo?.en || "How can I assist your home services today?";

    // Pre-match sub-service from query
    const matchedSub = findSubService(query);

    try {
      const isNavTip = query.toLowerCase().includes("just navigated to");
      const ctxSummary = context ? formatContextForSystemPrompt(context) : '';

      // Provide catalog awareness to the LLM
      const subServiceContext = matchedSub
        ? `\nRelevant Catalog Match: "${matchedSub.name}" under category "${matchedSub.service_name}" at standard cooperative tariff ₹${matchedSub.base_price}. Description: ${matchedSub.description}. Actionable booking link: /services/${matchedSub.service_id}/request?sub=${matchedSub.id}.`
        : `\nCOOP HUB Catalog: 16 Main Services, 80 Verified Sub-Services (Electrical, Plumbing, AC Repair, Carpentry, Cleaning, Appliances, Painting, Drivers, Helpers, Caregivers, Welding, etc.) with 0% surge pricing.`;

      const promptText = isNavTip
        ? `The user is a customer on the COOP HUB Customer Portal on route '${route}'. ${ctxSummary}\n${routeInfo?.tipPrompt || ''} ${subServiceContext}\nGive a concise 1-2 sentence friendly tip in ${langName}.`
        : `You are CoopBot, the helpful 24/7 AI Service Assistant for COOP HUB customer home services in Chennai.\n${ctxSummary}\n${subServiceContext}\nThe customer is currently on '${route}' and asks: "${query}". Provide a helpful, clear, and structured response in ${langName}. Mention the exact sub-service rate (₹), cooperative technician guarantee, and direct booking availability.`;

      const aiResponse = await callPillarAiApi({
        prompt: promptText,
        language,
        route,
        context,
      });

      if (aiResponse && aiResponse.reply) {
        const clean = aiResponse.reply.trim();
        if (clean.length > 5) {
          return {
            reply: clean,
            provider: aiResponse.provider,
            intent: matchedSub ? "subservice_booking_guidance" : "customer_live_guidance",
            matchedSubService: matchedSub || null
          };
        }
      }
    } catch (err) {
      console.warn("Customer AI call fallback:", err.message);
    }

    // Intelligent sub-service fallback when LLM is offline
    if (matchedSub) {
      const subInfoText = `We offer certified cooperative **${matchedSub.name}** under ${matchedSub.service_name} at standard tariff ₹${matchedSub.base_price}. ${matchedSub.description} You can proceed directly to book with 0% surge pricing.`;
      const localized = language !== 'en' ? await translateDynamic(subInfoText, language, 'en') : subInfoText;
      return {
        reply: localized,
        provider: 'coophub_catalog',
        intent: 'subservice_booking_guidance',
        matchedSubService: matchedSub
      };
    }

    return {
      reply: fallback,
      intent: "customer_route_guidance",
    };
  },
};
