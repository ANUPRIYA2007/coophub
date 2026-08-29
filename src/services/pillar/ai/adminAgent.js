import { supabase } from "../../../lib/supabase.js";
import { callPillarAiApi } from "./aiApi.js";
import { chronosForecastService } from "../../ai/chronosForecastService.js";
import { workforceAllocationEngine } from "../../ai/workforceAllocationEngine.js";

// Store last pending allocation recommendation in memory for conversational confirmation
let pendingAllocationSession = null;

export const adminAgent = {
  async handle(query, { language = "en", route = "/admin" }) {
    const q = query.toLowerCase().trim();

    // ─── 1. CHRONOS-2 DEMAND FORECASTING & SHORTAGE INTELLIGENCE ───
    if (
      q.includes("forecast") ||
      q.includes("demand") ||
      q.includes("shortage") ||
      q.includes("tomorrow") ||
      q.includes("peak") ||
      q.includes("surge") ||
      q.includes("தேவை") ||
      q.includes("முன்னறிவிப்பு")
    ) {
      try {
        const forecast = await chronosForecastService.getDemandForecast({ horizon: "24h" });
        const shortage = await chronosForecastService.calculateWorkforceShortage(forecast);

        if (!forecast || !forecast.forecastSeries || forecast.forecastSeries.length === 0) {
          return {
            reply: language === "ta"
              ? "நம்பகமான தேவை முன்னறிவிப்பை உருவாக்க போதுமான வரலாற்று தரவு இல்லை."
              : "Insufficient historical data to produce a reliable forecast.",
            route: "/admin/forecast",
            intent: "admin_forecast_insufficient",
          };
        }

        const totalForecast = forecast.metrics?.totalVolume || 0;
        const peakWindow = forecast.peakPeriods?.[0] ? `${forecast.peakPeriods[0].period} (+${forecast.peakPeriods[0].velocity}%)` : "Evening (17:00–20:00)";
        const shortageCount = shortage?.shortageCount || 0;
        const shortageSev = shortage?.severity || "low";

        let forecastSummary = "";
        if (shortageCount > 0 && shortageSev !== "low") {
          forecastSummary = language === "ta"
            ? `⚡ Chronos-2 முன்னறிவிப்பு: அடுத்த 24 மணிநேரத்தில் ${totalForecast} கோரிக்கைகள் எதிர்பார்க்கப்படுகின்றன. உச்ச நேரம்: ${peakWindow}. எச்சரிக்கை: ${shortageCount} சான்றளிக்கப்பட்ட தொழில்நுட்ப வல்லுநர் பற்றாக்குறை கண்டறியப்பட்டது!`
            : `⚡ Chronos-2 Forecast: Estimated demand of ${totalForecast} bookings in next 24h. Peak demand window: ${peakWindow}. Advisory: Forecasted workforce shortage of ${shortageCount} certified technicians (${shortageSev.toUpperCase()} severity).`;
        } else {
          forecastSummary = language === "ta"
            ? `⚡ Chronos-2 முன்னறிவிப்பு: அடுத்த 24 மணிநேரத்தில் ${totalForecast} கோரிக்கைகள் எதிர்பார்க்கப்படுகின்றன. உச்ச நேரம்: ${peakWindow}. பணியாளர் திறன் போதுமானதாக உள்ளது.`
            : `⚡ Chronos-2 Forecast: Projected volume of ${totalForecast} bookings in next 24h across Chennai hubs. Peak window: ${peakWindow}. Current workforce supply is balanced.`;
        }

        return {
          reply: forecastSummary,
          route: "/admin/forecast",
          intent: "admin_demand_forecast",
          forecastData: forecast
        };
      } catch (err) {
        console.warn("Forecast query note:", err.message);
        return {
          reply: "Chronos-2 forecast engine is synchronizing historical data. You can inspect detailed time-series charts on the AI Demand Forecast page.",
          route: "/admin/forecast",
          intent: "admin_demand_forecast_fallback",
        };
      }
    }

    // ─── 2. WORKFORCE ALLOCATION RECOMMENDATION & DISPATCH ───
    if (
      q.includes("allocate") ||
      q.includes("who should") ||
      q.includes("assign") ||
      q.includes("match") ||
      q.includes("candidate") ||
      q.includes("recommend worker") ||
      q.includes("யார்") ||
      q.includes("ஒதுக்க")
    ) {
      try {
        // Query real pending bookings
        const { data: pendingBookings } = await supabase
          .from("bookings")
          .select("*")
          .or("status.eq.pending,pillar_id.is.null")
          .order("created_at", { ascending: false })
          .limit(1);

        const targetBooking = pendingBookings?.[0];

        if (!targetBooking) {
          return {
            reply: language === "ta"
              ? "தற்போது ஒதுக்கீடு செய்ய நிலுவையில் உள்ள சேவை கோரிக்கைகள் எதுவும் இல்லை. அனைத்து பணிகளும் ஒதுக்கப்பட்டுள்ளன!"
              : "There are currently no unassigned pending service requests in the queue. All bookings are dispatched!",
            route: "/admin/allocation",
            intent: "admin_allocation_empty",
          };
        }

        const { eligible, approvedCerts } = await workforceAllocationEngine.getEligibleCandidates(targetBooking);

        if (eligible.length === 0) {
          return {
            reply: language === "ta"
              ? `கோரிக்கை "${targetBooking.service_name}" (${targetBooking.service_address || 'சென்னை'}) க்கான தகுதியான சரிபார்க்கப்பட்ட பில்லர்கள் தற்போது கிடைக்கவில்லை.`
              : `Insufficient real-time data for allocation. No verified pillars currently available matching "${targetBooking.service_name}" in ${targetBooking.service_address || 'Chennai'}.`,
            route: "/admin/allocation",
            intent: "admin_allocation_no_candidates",
          };
        }

        const scored = eligible.map(p => workforceAllocationEngine.scoreCandidate(p, targetBooking, approvedCerts))
                               .sort((a, b) => b.score - a.score);

        const top = scored[0];
        const second = scored[1];

        // Store in memory for confirmation
        pendingAllocationSession = {
          bookingId: targetBooking.id,
          request: targetBooking,
          topCandidate: top,
          timestamp: Date.now()
        };

        const distStr = top.distanceKm !== null ? `${top.distanceKm} km away` : 'Locality Hub matched';
        const certStr = top.isCertified ? '✓ Certified' : 'Verified Trade Experience';

        let recommendationMsg = `🎯 Best Match for ${targetBooking.service_name} (${targetBooking.service_address || 'Chennai'}):\n` +
          `• 1st: ${top.full_name} (${top.pillar_code}) — Score ${top.score}/100, ${distStr}, ${certStr}, ${top.active_jobs_count} active job(s), ${top.rating}★\n`;

        if (second) {
          const sDist = second.distanceKm !== null ? `${second.distanceKm} km away` : 'Locality match';
          recommendationMsg += `• 2nd: ${second.full_name} (${second.pillar_code}) — Score ${second.score}/100, ${sDist}, ${second.rating}★\n\n`;
        } else {
          recommendationMsg += `\n`;
        }

        recommendationMsg += `Shall I allocate this request to ${top.full_name}? Reply "Yes allocate" to confirm, or review on the Allocation page.`;

        return {
          reply: recommendationMsg,
          route: "/admin/allocation",
          intent: "admin_allocation_recommendation",
          candidate: top
        };
      } catch (allocErr) {
        console.error("Allocation matching error:", allocErr);
        return {
          reply: "Workforce allocation engine is ready. Please inspect the live candidate ranking queue in the AI Workforce Allocation Control Tower.",
          route: "/admin/allocation",
          intent: "admin_allocation_error",
        };
      }
    }

    // ─── 3. HUMAN CONFIRMATION & EXECUTION OF ALLOCATION ───
    if (
      (q.includes("yes allocate") || q.includes("confirm allocate") || q.includes("approve allocation") || q.includes("assign now") || q.includes("ஆம் ஒதுக்க")) &&
      pendingAllocationSession
    ) {
      const sess = pendingAllocationSession;
      try {
        const result = await workforceAllocationEngine.allocateBestPillar(sess.bookingId, sess.request);
        pendingAllocationSession = null;

        if (result.success) {
          return {
            reply: language === "ta"
              ? `✅ ஒதுக்கீடு உறுதி செய்யப்பட்டது: ${result.allocated_pillar.full_name} (${result.allocated_pillar.pillar_code}) கோரிக்கை #${sess.bookingId.slice(0, 6)} க்கு வெற்றிகரமாக நியமிக்கப்பட்டார்!`
              : `✅ Allocation Confirmed: Dispatched ${result.allocated_pillar.full_name} (${result.allocated_pillar.pillar_code}, ${result.allocated_pillar.score}/100 match) to booking #${sess.bookingId.slice(0, 6).toUpperCase()}. In-app alert sent to technician.`,
            route: "/admin/allocation",
            intent: "admin_allocation_confirmed",
          };
        } else {
          return {
            reply: `⚠️ Allocation Notice: ${result.message}`,
            route: "/admin/allocation",
            intent: "admin_allocation_failed",
          };
        }
      } catch (err) {
        return {
          reply: `⚠️ Allocation execution failed: ${err.message}`,
          route: "/admin/allocation",
          intent: "admin_allocation_error",
        };
      }
    }

    // ─── 4. PILLARS / WORKFORCE DIRECTORY ───
    if (q.includes("pillar") || q.includes("technician") || q.includes("workforce") || q.includes("member") || q.includes("worker") || q.includes("பணியாளர்")) {
      try {
        const { data: pillars } = await supabase.from("pillar_profiles").select("id, status, is_available");
        const total = pillars?.length || 0;
        const active = pillars?.filter(p => p.is_available && p.status === "verified").length || 0;
        const pending = pillars?.filter(p => p.status === "pending_review" || p.status === "pending").length || 0;

        const summary = language === "ta"
          ? `தற்போது ${total} பதிவு செய்யப்பட்ட பில்லர்கள் உள்ளனர் (${active} பணியில் உள்ளனர், ${pending} சரிபார்ப்பில் உள்ளனர்).`
          : `We currently have ${total} registered cooperative pillars (${active} active on duty, ${pending} pending verification) across Chennai hubs.`;

        return {
          reply: summary,
          route: "/admin/pillars",
          intent: "admin_pillars_overview",
        };
      } catch {
        return {
          reply: "Workforce directory is active. You can review all registered technicians in the Pillars tab.",
          route: "/admin/pillars",
          intent: "admin_pillars_overview",
        };
      }
    }

    // ─── 5. SERVICE REQUESTS / BOOKINGS ───
    if (q.includes("request") || q.includes("order") || q.includes("booking") || q.includes("job") || q.includes("ticket") || q.includes("கோரிக்கை")) {
      try {
        const { data: requests } = await supabase.from("bookings").select("id, status, pillar_id");
        const total = requests?.length || 0;
        const pending = requests?.filter(r => !r.pillar_id || r.status === "pending").length || 0;
        const inProgress = requests?.filter(r => r.status === "inProgress" || r.status === "assigned" || r.status === "accepted").length || 0;

        const summary = language === "ta"
          ? `சேவை கோரிக்கைகள்: மொத்தம் ${total} கோரிக்கைகள் உள்ளன (${pending} நிலுவையில், ${inProgress} செயல்பாட்டில்).`
          : `Service pipeline status: ${total} total customer bookings (${pending} unallocated/pending assignment, ${inProgress} active in field).`;

        return {
          reply: summary,
          route: "/admin/requests",
          intent: "admin_requests_overview",
        };
      } catch {
        return {
          reply: "Service requests pipeline is active. You can review all active customer bookings in the Service Requests tab.",
          route: "/admin/requests",
          intent: "admin_requests_overview",
        };
      }
    }

    // ─── 6. LIVE TRACKING / RADAR / TELEMETRY ───
    if (q.includes("track") || q.includes("radar") || q.includes("location") || q.includes("gps") || q.includes("map") || q.includes("வரைபடம்")) {
      try {
        const { data: activeGpsPillars } = await supabase
          .from("pillar_profiles")
          .select("id")
          .eq("is_available", true)
          .eq("status", "verified");

        const count = activeGpsPillars?.length || 0;
        return {
          reply: language === "ta"
            ? `நேரலை கண்காணிப்பு: சென்னை மையத்தில் ${count} பில்லர்களின் GPS டெலிமெட்ரி இயங்குகிறது.`
            : `Live Field Telemetry: Active radar is monitoring ${count} available verified technicians across Chennai hubs.`,
          route: "/admin/tracking",
          intent: "admin_tracking_status",
        };
      } catch {
        return {
          reply: "Live Field Telemetry: Active radar is monitoring available technicians across Chennai hubs.",
          route: "/admin/tracking",
          intent: "admin_tracking_status",
        };
      }
    }

    // ─── 7. FINANCIAL / REVENUE / GMV / PAYOUTS ───
    if (q.includes("revenue") || q.includes("gmv") || q.includes("money") || q.includes("earning") || q.includes("commission") || q.includes("payout") || q.includes("வருவாய்")) {
      return {
        reply: language === "ta"
          ? "வருவாய் விவரம்: நிதி டாஷ்போர்டில் நேரலை கட்டணங்கள் மற்றும் வாராந்திர தீர்வுகளைக் கண்காணிக்கலாம்."
          : "Financial Performance: Real-time platform earnings, cooperative commission, and automated weekly payouts are tracked in the Financials section.",
        route: "/admin/finance",
        intent: "admin_finance_status",
      };
    }

    // ─── 8. FEEDBACK / CSAT / QUALITY ───
    if (q.includes("feedback") || q.includes("rating") || q.includes("review") || q.includes("csat") || q.includes("satisfaction") || q.includes("கருத்து")) {
      return {
        reply: language === "ta"
          ? "வாடிக்கையாளர் மதிப்பீடு: ஒட்டுமொத்த வாடிக்கையாளர் திருப்தி மற்றும் மதிப்பாய்வுகளை கருத்துகள் பக்கத்தில் பார்க்கலாம்."
          : "Customer Satisfaction Index: Track verified customer reviews, service quality scores, and technician ratings in the Customer Feedback portal.",
        route: "/admin/feedback",
        intent: "admin_csat_status",
      };
    }

    // ─── 9. SERVICES / CATALOG / TARIFFS ───
    if (q.includes("service") || q.includes("tariff") || q.includes("catalog") || q.includes("price") || q.includes("rate") || q.includes("விலை")) {
      return {
        reply: language === "ta"
          ? "சேவை பட்டியல்: எலக்ட்ரீசியன், பிளம்பர் மற்றும் உபகரண பழுதுபார்ப்பு கட்டணங்களை சேவைகள் பிரிவில் நிர்வகிக்கலாம்."
          : "Cooperative Service Master: Manage standard trade rate cards, categories, and service offerings in the Services tab.",
        route: "/admin/services",
        intent: "admin_services_status",
      };
    }

    // ─── 10. GENERAL OPERATIONAL AI QUERY (NVIDIA NIM / GEMINI RELAY) ───
    const liveAi = await callPillarAiApi({
      prompt: `You are CoopBot, the AI Operations Intern & Dispatch Assistant for the Cooperative Admin Portal.
Answer concisely in 1-2 professional sentences grounded in reality. User query: "${query}"`,
      language,
      route,
    });

    if (liveAi && liveAi.reply) {
      return {
        reply: liveAi.reply,
        provider: liveAi.provider,
        route,
        intent: "admin_live_ai",
      };
    }

    return {
      reply: language === "ta"
        ? "வணக்கம் நிர்வாகி! நான் CoopBot AI செயல்பாட்டு உதவியாளர். தேவை முன்னறிவிப்பு, பணியாளர் ஒதுக்கீடு, பில்லர்கள், அல்லது சேவை கோரிக்கைகள் பற்றி என்னிடம் கேட்கலாம்."
        : "Hello Administrator! I am CoopBot, your AI Operations Intern. You can ask me for Chronos-2 demand forecasts, workforce allocations, technician availability, or request dispatch updates.",
      route,
      intent: "admin_greeting",
    };
  }
};

export default adminAgent;
