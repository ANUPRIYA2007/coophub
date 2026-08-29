import { callPillarAiApi } from "./aiApi.js";

const CUSTOMER_ROUTE_DATA = {
  "/home": {
    en: "Welcome to your Customer Dashboard! You can browse certified cooperative technicians or monitor your active bookings.",
    ta: "வாடிக்கையாளர் முகப்புப் பக்கத்திற்கு வருக! சிறந்த தொழில்நுட்ப வல்லுநர்களைத் தேர்ந்தெடுக்கலாம் அல்லது உங்கள் முன்பதிவுகளைக் கண்காணிக்கலாம்.",
    tipPrompt: "Customer is on the Customer Home Dashboard. Give a 1-sentence helpful tip about booking services or viewing recent requests."
  },
  "/services": {
    en: "Browse verified technicians across Electrical, Plumbing, AC Repair, Carpentry, and Appliance Servicing across Chennai.",
    ta: "மின்சாரம், பிளம்பிங், ஏசி பழுது மற்றும் தச்சு வேலைகளுக்கான சரிபார்க்கப்பட்ட தொழில்நுட்ப வல்லுநர்களை இங்கே தேர்ந்தெடுக்கவும்.",
    tipPrompt: "Customer is browsing Find Services. Give a 1-sentence tip on choosing service categories and verified cooperative technicians in Chennai."
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

export const customerAgent = {
  async handle(query, context = {}) {
    const { language = "en", route = "/home" } = context;
    const matchedRoute = Object.keys(CUSTOMER_ROUTE_DATA).find(
      (r) => route === r || route.startsWith(r)
    ) || "/home";
    const routeInfo = CUSTOMER_ROUTE_DATA[matchedRoute];

    const fallback = routeInfo[language] || routeInfo.en;

    try {
      const aiResponse = await callPillarAiApi({
        prompt: `The user is a customer on the COOP HUB Customer Portal on route '${route}'. ${routeInfo.tipPrompt} Customer query / context: "${query}". Keep response concise (1-2 sentences), friendly, and directly helpful in ${language === "ta" ? "Tamil" : "English"}.`,
        language,
        route,
      });

      if (aiResponse && aiResponse.reply) {
        const clean = aiResponse.reply.split("\n")[0].replace(/[*#_]/g, "").trim();
        if (clean.length > 15) {
          return {
            reply: clean,
            provider: aiResponse.provider,
            intent: "customer_live_guidance",
          };
        }
      }
    } catch (err) {
      console.warn("Customer AI call fallback:", err.message);
    }

    return {
      reply: fallback,
      intent: "customer_route_guidance",
    };
  },
};
