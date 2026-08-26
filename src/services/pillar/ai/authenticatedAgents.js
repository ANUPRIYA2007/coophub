import { supabase } from "../../../lib/supabase";
import { callPillarAiApi } from "./aiApi";

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
      const totalBookings = (bookings || []).length;

      const latestBooking = (bookings || [])[0];
      const latestInfo = latestBooking
        ? `Latest: "${latestBooking.service_name}" for ${latestBooking.customer_name} (${latestBooking.status}, ₹${latestBooking.total_amount})`
        : "No recent bookings found";

      dataContext = `Technician: ${userName}. Total bookings: ${totalBookings}. Pending: ${pendingCount}. Active: ${activeCount}. Completed: ${completedCount}. ${latestInfo}.`;
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
        .select("full_name, pillar_id, status, service_area, phone, skills")
        .eq("id", pillarId)
        .single();

      dataContext = `Technician: ${profile?.full_name || userName}. Pillar ID: ${profile?.pillar_id || "N/A"}. Verification: ${profile?.status || "Pending"}. Service Area: ${profile?.service_area || "Not set"}. Skills: ${profile?.skills || "Not listed"}.`;
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
