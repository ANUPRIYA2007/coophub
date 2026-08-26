import { supabase } from "../../lib/supabase";

export const pillarEarningsService = {
  async getEarningsSummary(pillarId) {
    const isDemo = localStorage.getItem("coophub_demo_user") === "true";

    // 🧪 DEMO MODE: Rich mock data for SIH presentation
    if (isDemo) {
      return {
        summary: {
          total: 18600,
          today: 850,
          pending: 2300,
          paid: 16300
        },
        transactions: [
          { id: "TXN-801", booking_id: "ORD-9842", amount: 450, status: "paid", type: "service", service_name: "Ceiling Fan Wiring", customer: "Meenakshi S.", created_at: new Date().toISOString() },
          { id: "TXN-800", booking_id: "ORD-9801", amount: 850, status: "paid", type: "service", service_name: "AC Power Point", customer: "Deepak S.", created_at: new Date(Date.now() - 86400000).toISOString() },
          { id: "TXN-799", booking_id: "ORD-9788", amount: 550, status: "paid", type: "service", service_name: "Inverter Rewiring", customer: "Lakshmi N.", created_at: new Date(Date.now() - 172800000).toISOString() },
          { id: "TXN-798", booking_id: "ORD-9750", amount: 350, status: "paid", type: "service", service_name: "Exhaust Fan Fixing", customer: "Radhika R.", created_at: new Date(Date.now() - 259200000).toISOString() },
          { id: "TXN-797", booking_id: "ORD-9710", amount: 1200, status: "paid", type: "service", service_name: "DB Box Replacement", customer: "Srinivasan K.", created_at: new Date(Date.now() - 400000000).toISOString() }
        ],
        error: null,
      };
    }

    // 🔒 REAL USER ONLY
    try {
      const { data, error } = await supabase
        .from("pillar_earnings")
        .select("*")
        .eq("pillar_id", pillarId)
        .order("created_at", { ascending: false });

      if (error) throw error;

      const earningsList = data || [];
      const total = earningsList.reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
      const today = earningsList
        .filter((item) => new Date(item.created_at).toDateString() === new Date().toDateString())
        .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
      const pending = earningsList
        .filter((item) => item.status === "pending")
        .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);
      const paid = earningsList
        .filter((item) => item.status === "paid")
        .reduce((acc, curr) => acc + (parseFloat(curr.amount) || 0), 0);

      return {
        summary: { total, today, pending, paid },
        transactions: earningsList,
        error: null,
      };
    } catch (error) {
      console.error("Earnings fetch error:", error);
      return {
        summary: { total: 0, today: 0, pending: 0, paid: 0 },
        transactions: [],
        error,
      };
    }
  },

  // Request a payout from available balance
  async requestPayout(pillarId, amount) {
    try {
      const { data, error } = await supabase
        .from('payout_requests')
        .insert([{
          pillar_id: pillarId,
          amount: amount,
          status: 'pending',
          payment_mode: 'bank_transfer'
        }])
        .select()
        .single();
        
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Payout request error:", error);
      return { data: null, error };
    }
  }
};
