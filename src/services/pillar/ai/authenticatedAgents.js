import { supabase } from "../../../lib/supabase.js";
import { callPillarAiApi } from "./aiApi.js";

// ============================================================
// LIVE AI SUB-AGENTS — Every agent queries NVIDIA / Gemini API
// Zero hardcoded responses. Real data → AI prompt → Live reply.
// ============================================================

async function getLiveAiReply({ prompt, language, route, fallback }) {
  try {
    const aiResponse = await callPillarAiApi({ prompt, language, route });
    if (aiResponse && aiResponse.reply) {
      return {
        reply: aiResponse.reply,
        provider: aiResponse.provider,
        intent: aiResponse.intent || "ai_live_reply",
        route,
      };
    }
  } catch (err) {
    console.warn("Live AI API call failed, using minimal fallback:", err.message);
  }
  // Only if both NVIDIA and Gemini are completely down
  return { reply: fallback, intent: "ai_fallback", route };
}

// ─── ORDER AGENT ────────────────────────────────────────────
export const orderAgent = {
  async handle(query, { session, language = "en" }) {
    const pillarId = session?.user?.id;
    const userName = session?.user?.user_metadata?.full_name || "Pillar";
    let dataContext = "";

    try {
      const { data: bookings } = await supabase
        .from("bookings")
        .select("id, booking_code, service_name, customer_name, status, total_amount, scheduled_date")
        .eq("pillar_id", pillarId)
        .order("scheduled_date", { ascending: false })
        .limit(10);

      const pendingCount = (bookings || []).filter((b) => b.status === "pending").length;
      const activeCount = (bookings || []).filter((b) => ["accepted", "onTheWay", "arrived", "inProgress"].includes(b.status)).length;
      const completedCount = (bookings || []).filter((b) => b.status === "completed").length;
      const emergencyBooking = (bookings || []).find((b) => b.is_emergency && ["pending", "assigned", "accepted"].includes(b.status));
      const totalBookings = (bookings || []).length;

      const latestBooking = (bookings || [])[0];
      const latestInfo = latestBooking
        ? `Latest: "${latestBooking.service_name}" for ${latestBooking.customer_name} (${latestBooking.status}, ₹${latestBooking.total_amount})`
        : "No recent bookings found";
      const emergencyInfo = emergencyBooking ? `⚡ URGENT EMERGENCY BOOKING: ${emergencyBooking.service_name} at ${emergencyBooking.service_address || 'assigned locality'}` : "No active emergency alerts";

      dataContext = `Technician: ${userName}. Total bookings: ${totalBookings}. Pending: ${pendingCount}. Active: ${activeCount}. Completed: ${completedCount}. ${latestInfo}. ${emergencyInfo}.`;
    } catch (err) {
      dataContext = `Technician: ${userName}. Could not fetch live booking data.`;
    }

    return getLiveAiReply({
      prompt: `${query}. LIVE DATA: ${dataContext}. Give a concise, helpful 1-2 sentence response about the technician's order status. Include real numbers from the data.`,
      language,
      route: "/dashboard/orders",
      fallback: "Check your Orders tab for live booking updates.",
    });
  },
};

// ─── FINANCE / EARNINGS AGENT ───────────────────────────────
export const financeAgent = {
  async handle(query, { session, language = "en" }) {
    const pillarId = session?.user?.id;
    const userName = session?.user?.user_metadata?.full_name || "Pillar";
    let dataContext = "";

    try {
      const { data: earnings } = await supabase
        .from("pillar_earnings")
        .select("amount, status, created_at")
        .eq("pillar_id", pillarId);

      const total = (earnings || []).reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
      const pending = (earnings || [])
        .filter((e) => e.status === "pending")
        .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
      const paid = (earnings || [])
        .filter((e) => e.status === "paid")
        .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
      const recordCount = (earnings || []).length;

      dataContext = `Technician: ${userName}. Total earnings: ₹${total.toLocaleString()}. Pending payout: ₹${pending.toLocaleString()}. Already paid: ₹${paid.toLocaleString()}. Total records: ${recordCount}.`;
    } catch (err) {
      dataContext = `Technician: ${userName}. Could not fetch live earnings data.`;
    }

    return getLiveAiReply({
      prompt: `${query}. LIVE DATA: ${dataContext}. Give a concise 1-2 sentence response about this technician's earnings and payout status. Use real numbers.`,
      language,
      route: "/dashboard/earnings",
      fallback: "Check your Earnings tab for payout details.",
    });
  },
};

// ─── NOTIFICATION AGENT ─────────────────────────────────────
export const notificationAgent = {
  async handle(query, { session, language = "en" }) {
    const pillarId = session?.user?.id;
    const userName = session?.user?.user_metadata?.full_name || "Pillar";
    let dataContext = "";

    try {
      const { data: notifs } = await supabase
        .from("notifications")
        .select("id, title, message, read, created_at")
        .eq("user_id", pillarId)
        .order("created_at", { ascending: false })
        .limit(5);

      const unreadCount = (notifs || []).filter((n) => !n.read).length;
      const totalCount = (notifs || []).length;
      const latest = (notifs || [])[0];
      const latestInfo = latest ? `Latest: "${latest.title}" — ${latest.message?.slice(0, 60)}` : "No notifications";

      dataContext = `Technician: ${userName}. Unread notifications: ${unreadCount}. Total recent: ${totalCount}. ${latestInfo}.`;
    } catch (err) {
      dataContext = `Technician: ${userName}. Could not fetch live notification data.`;
    }

    return getLiveAiReply({
      prompt: `${query}. LIVE DATA: ${dataContext}. Give a concise 1-2 sentence response about the technician's notifications. Mention unread count and latest alert.`,
      language,
      route: "/dashboard/notifications",
      fallback: "Check your Notifications tab for live alerts.",
    });
  },
};

// ─── COMMUNICATION / CHAT AGENT ─────────────────────────────
export const communicationAgent = {
  async handle(query, { session, language = "en" }) {
    const userName = session?.user?.user_metadata?.full_name || "Pillar";

    return getLiveAiReply({
      prompt: `${query}. Technician: ${userName}. They are on the Customer Chat page. Give a concise 1-2 sentence guide about how to message customers, share arrival times, and use masked calling in the COOP HUB platform.`,
      language,
      route: "/dashboard/chat",
      fallback: "Go to Chat to message your customers securely.",
    });
  },
};

// ─── LOCATION / ARRIVAL AGENT ───────────────────────────────
export const locationAgent = {
  async handle(query, { session, language = "en" }) {
    const userName = session?.user?.user_metadata?.full_name || "Pillar";

    return getLiveAiReply({
      prompt: `${query}. Technician: ${userName}. They need help with customer location navigation and arrival OTP verification. Give a concise 1-2 sentence guide about starting travel, using maps, and verifying OTP on arrival at customer location in COOP HUB.`,
      language,
      route: "/dashboard/orders",
      fallback: "Start travel from Orders and verify the customer OTP on arrival.",
    });
  },
};

// ─── SUPPORT AGENT ──────────────────────────────────────────
export const supportAgent = {
  async handle(query, { session, language = "en" }) {
    const userName = session?.user?.user_metadata?.full_name || "Pillar";
    const pillarId = session?.user?.id;
    let dataContext = "";

    try {
      const { data: tickets } = await supabase
        .from("support_tickets")
        .select("id, subject, status, priority, created_at")
        .eq("pillar_id", pillarId)
        .order("created_at", { ascending: false })
        .limit(5);

      const openCount = (tickets || []).filter((t) => t.status === "open" || t.status === "pending").length;
      const totalCount = (tickets || []).length;
      const latest = (tickets || [])[0];
      const latestInfo = latest ? `Latest ticket: "${latest.subject}" (${latest.status}, ${latest.priority} priority)` : "No support tickets";

      dataContext = `Technician: ${userName}. Open tickets: ${openCount}. Total recent: ${totalCount}. ${latestInfo}.`;
    } catch (err) {
      dataContext = `Technician: ${userName}. Could not fetch live support data.`;
    }

    return getLiveAiReply({
      prompt: `${query}. LIVE DATA: ${dataContext}. Give a concise 1-2 sentence response about support status and how to file or track a dispute. Use real data if available.`,
      language,
      route: "/dashboard/support",
      fallback: "Submit a support ticket in Help & Support for priority assistance.",
    });
  },
};

// ─── PROFILE AGENT ──────────────────────────────────────────
export const profileAgent = {
  async handle(query, { session, language = "en" }) {
    const pillarId = session?.user?.id;
    const userName = session?.user?.user_metadata?.full_name || "Pillar";
    let dataContext = "";

    try {
      const { data: profile } = await supabase
        .from("pillar_profiles")
        .select("full_name, pillar_id, status, service_area, phone, skills, main_services")
        .eq("id", pillarId)
        .single();

      const { data: certs } = await supabase
        .from("pillar_certificates")
        .select("skill_name")
        .eq("pillar_id", pillarId)
        .eq("verification_status", "approved");

      const certList = certs && certs.length > 0 ? certs.map(c => c.skill_name).join(', ') : "None uploaded yet";

      dataContext = `Technician: ${profile?.full_name || userName}. Pillar ID: ${profile?.pillar_id || "N/A"}. Verification: ${profile?.status || "Pending"}. Service Area: ${profile?.service_area || "Not set"}. Skills: ${profile?.skills || profile?.main_services || "Not listed"}. Approved Certifications: ${certList}.`;
    } catch (err) {
      dataContext = `Technician: ${userName}. Could not fetch live profile data.`;
    }

    return getLiveAiReply({
      prompt: `${query}. LIVE DATA: ${dataContext}. Give a concise 1-2 sentence response about this technician's profile status, verification, and trade credentials.`,
      language,
      route: "/dashboard/profile",
      fallback: "Update your profile, trade categories, and coverage areas in the Profile page.",
    });
  },
};

// ─── SETTINGS AGENT ─────────────────────────────────────────
export const settingsAgent = {
  async handle(query, { session, language = "en" }) {
    const userName = session?.user?.user_metadata?.full_name || "Pillar";

    return getLiveAiReply({
      prompt: `${query}. Technician: ${userName}. Current language: ${language}. They are on the Settings page. Give a concise 1-2 sentence guide about customizing language (English, Tamil, Hindi, Telugu, Kannada), dark/light mode, and account preferences on COOP HUB.`,
      language,
      route: "/dashboard/settings",
      fallback: "Customize your language and display preferences in Settings.",
    });
  },
};

// ─── WELFARE & INSURANCE AGENT ─────────────────────────────
export const welfareAgent = {
  async handle(query, { session, language = "en" }) {
    const pillarId = session?.user?.id;
    const userName = session?.user?.user_metadata?.full_name || "Pillar";
    const isDemo = typeof localStorage !== 'undefined' 
      ? (localStorage.getItem("coophub_demo_user") === "true" || localStorage.getItem("coophub_demo_pillar") === "true") 
      : false;
    let dataContext = "";

    if (isDemo) {
      // DEMO MODE CONTEXT
      dataContext = `Technician: ${userName} (Demo Account). PF Balance: ₹48,500. Total PF Contributions: ₹54,000 (Worker Share: ₹27,000, Coop Match: ₹27,000). Last PF Deposit: 2 days ago. Group Insurance: Active (COOP HUB Suraksha Group Shield). Coverage: ₹5,00,000. Monthly Premium: ₹500. Policy Expiry: 2026-12-31. Nominee: Radha Senthil (Spouse). Claims: 1 approved claim for ₹15,000. Available Govt Schemes: TNUWWB (Manual Workers Board), PMJJBY (Life ₹2L at ₹436/yr), PMSBY (Accident ₹2L at ₹20/yr), PM-SYM (Pension ₹3k/mo), Ayushman Bharat PM-JAY (Health ₹5L/yr).`;
    } else {
      // REAL PRODUCTION MODE: STRICTLY REAL DATA ONLY
      try {
        // 1. Fetch Real PF Record
        const { data: pfAccount } = await supabase
          .from("pf_accounts")
          .select("current_balance, total_contributions, last_contribution_at, account_status, pillar_contribution_total, coop_contribution_total")
          .eq("pillar_id", pillarId)
          .maybeSingle();

        const pfInfo = pfAccount
          ? `PF Balance: ₹${Number(pfAccount.current_balance || 0).toLocaleString('en-IN')}, Total Contributions: ₹${Number(pfAccount.total_contributions || 0).toLocaleString('en-IN')} (Worker Share: ₹${Number(pfAccount.pillar_contribution_total || 0).toLocaleString('en-IN')}, Coop Match: ₹${Number(pfAccount.coop_contribution_total || 0).toLocaleString('en-IN')}), Last Deposit: ${pfAccount.last_contribution_at ? new Date(pfAccount.last_contribution_at).toLocaleDateString() : 'None'}`
          : "PF Balance: Not available yet (No PF account record found on file).";

        // 2. Fetch Real Insurance Record
        const { data: insMember } = await supabase
          .from("insurance_members")
          .select("coverage_amount, monthly_premium, start_date, expiry_date, nominee_name, nominee_relation, status, member_id")
          .eq("pillar_id", pillarId)
          .maybeSingle();

        const insInfo = insMember
          ? `Insurance: ${insMember.status}, Member ID: ${insMember.member_id}, Coverage: ₹${Number(insMember.coverage_amount || 0).toLocaleString('en-IN')}, Monthly Premium: ₹${Number(insMember.monthly_premium || 0)}, Policy Period: ${insMember.start_date} to ${insMember.expiry_date}, Nominee: ${insMember.nominee_name || 'Not provided'} (${insMember.nominee_relation || 'Dependent'})`
          : "Insurance: No active insurance policy found on file for this technician.";

        // 3. Fetch Real Claims
        const { data: claims } = await supabase
          .from("insurance_claims")
          .select("claim_code, claim_type, claim_amount, status, rejection_reason")
          .eq("pillar_id", pillarId)
          .order("submitted_date", { ascending: false })
          .limit(3);

        const claimsInfo = (claims && claims.length > 0)
          ? `Claims: ${claims.map(c => `${c.claim_code}: ${c.claim_type} for ₹${Number(c.claim_amount || 0).toLocaleString('en-IN')} (${c.status})${c.rejection_reason ? ` [Rejection Reason: ${c.rejection_reason}]` : ''}`).join("; ")}`
          : "Claims: No insurance claims found on record.";

        dataContext = `Technician: ${userName}. Real Production Account. ${pfInfo}. ${insInfo}. ${claimsInfo}. Available Govt Schemes: TNUWWB, PMJJBY, PMSBY, PM-SYM, Ayushman Bharat PM-JAY.`;
      } catch (err) {
        dataContext = `Technician: ${userName}. Real Production Account. Database records are currently being updated. No mock data should be displayed.`;
      }
    }

    return getLiveAiReply({
      prompt: `${query}. LIVE WELFARE CONTEXT: ${dataContext}. Answer the technician's question concisely in 1-2 sentences using ONLY the real facts provided. If information is not available/found, clearly state that it is not available yet rather than inventing any mock numbers.`,
      language,
      route: "/dashboard/welfare",
      fallback: "You can review your PF balance, group insurance, claims, and welfare schemes in the Welfare & Insurance tab.",
    });
  },
};

// ─── GENERAL TECHNICAL & TRADE ASSISTANT AGENT ──────────────
export const generalPillarAssistantAgent = {
  async handle(query, { session, language = "en", route = "/dashboard" }) {
    const userName = session?.user?.user_metadata?.full_name || "Pillar";
    return getLiveAiReply({
      prompt: `Technician question: "${query}". You are speaking with technician ${userName}. Provide a comprehensive, actionable, and structured technical answer with clear steps, tools needed, and safety recommendations.`,
      language,
      route,
      fallback: "I am your 24/7 technical assistant. Please ask any question regarding tools, repairs, electrical, plumbing, AC, carpentry, or safety procedures.",
    });
  },
};

// ─── NAVIGATION AGENT ───────────────────────────────────────
export const navigationAgent = {
  async handle(route, language = "en", session) {
    const userName = session?.user?.user_metadata?.full_name || "Pillar";
    const section = route.replace("/dashboard/", "").replace("/", "") || "dashboard";

    return getLiveAiReply({
      prompt: `Technician ${userName} just navigated to the ${section} section. Give a concise 1-sentence welcome/guidance for this page on the COOP HUB Pillar Portal.`,
      language,
      route,
      fallback: `Navigating to ${section}...`,
    });
  },
};
