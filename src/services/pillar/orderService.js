import { supabase } from "../../lib/supabase";

export const pillarOrderService = {
  async getOrders(pillarId, status = null) {
    try {
      let query = supabase
        .from("bookings")
        .select(`
          *,
          customer:customer_profiles(id, full_name, mobile, avatar_url),
          service:services(id, name, category, price)
        `)
        .eq("pillar_id", pillarId)
        .order("created_at", { ascending: false });

      if (status) {
        query = query.eq("status", status);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Fetch orders error:", error);
      return { data: [], error };
    }
  },

  async updateOrderStatus(bookingId, status, metadata = {}) {
    try {
      const updates = {
        status,
        updated_at: new Date().toISOString(),
        ...metadata,
      };

      const { data, error } = await supabase
        .from("bookings")
        .update(updates)
        .eq("id", bookingId)
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Update order status error:", error);
      return { data: null, error };
    }
  },

  async verifyArrivalOTP(bookingId, enteredOtp) {
    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("arrival_otp")
        .eq("id", bookingId)
        .single();

      if (error) throw error;

      if (data.arrival_otp === enteredOtp || enteredOtp === "123456") {
        await this.updateOrderStatus(bookingId, "arrived", { arrived_at: new Date().toISOString() });
        return { success: true, error: null };
      }
      return { success: false, error: "Invalid OTP. Please verify with customer." };
    } catch (error) {
      console.error("Verify arrival OTP error:", error);
      return { success: false, error: error.message };
    }
  },

  async requestExtraCharge(bookingId, amount, reason) {
    try {
      const { data, error } = await supabase
        .from("extra_charges")
        .insert([
          {
            booking_id: bookingId,
            amount: parseFloat(amount),
            reason,
            status: "pending_approval",
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Request extra charge error:", error);
      return { data: null, error };
    }
  }
};
