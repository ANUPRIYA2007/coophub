import { supabase } from "../../lib/supabase";

export const pillarReviewService = {
  // Fetch reviews for a pillar's bookings
  async getReviews(pillarId) {
    try {
      const { data, error } = await supabase
        .from("booking_reviews")
        .select(`
          *,
          customer:customer_id(full_name),
          booking:booking_id(service_name)
        `)
        .eq("pillar_id", pillarId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error("Reviews fetch error:", error);
      return { data: [], error };
    }
  },

  // Get a single review for a specific booking
  async getReviewForBooking(bookingId) {
    try {
      const { data, error } = await supabase
        .from("booking_reviews")
        .select("*")
        .eq("booking_id", bookingId)
        .single();

      if (error && error.code !== "PGRST116") throw error; // Ignore not found
      return { data, error: null };
    } catch (error) {
      console.error("Review fetch error:", error);
      return { data: null, error };
    }
  }
};
