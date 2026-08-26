import { supabase } from "../../lib/supabase";

export const pillarSupportService = {
  async getTickets(pillarId) {
    const isDemo = localStorage.getItem("coophub_demo_user") === "true";

    // 🧪 DEMO MODE
    if (isDemo) {
      return {
        data: [
          { id: "TKT-104", subject: "Payment delay for ORD-9721", category: "payment", priority: "medium", status: "inProgress", created_at: new Date(Date.now() - 86400000).toISOString(), response: "Under review by accounts department." },
          { id: "TKT-101", subject: "Profile update request", category: "account", priority: "low", status: "resolved", created_at: new Date(Date.now() - 604800000).toISOString(), response: "Updated your service areas as requested." }
        ],
        error: null,
      };
    }

    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .select("*")
        .eq("pillar_id", pillarId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Support fetch error:", error);
      return { data: [], error };
    }
  },

  async createTicket(ticketData) {
    try {
      const { data, error } = await supabase
        .from("support_tickets")
        .insert([
          {
            ...ticketData,
            status: "open",
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Support create error:", error);
      return { data: null, error };
    }
  }
};
