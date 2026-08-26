import { supabase } from "../../lib/supabase";

export const pillarProfileService = {
  // Get Pillar Profile
  async getProfile(userId) {
    try {
      const { data, error } = await supabase
        .from("pillar_profiles")
        .select("*")
        .eq("id", userId)
        .single();

      if (error) throw error;
      return { profile: data, error: null };
    } catch (error) {
      console.error("Get profile error:", error);
      return { profile: null, error };
    }
  },

  // Update Profile
  async updateProfile(userId, updates) {
    try {
      const { data, error } = await supabase
        .from("pillar_profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      return { profile: data, error: null };
    } catch (error) {
      console.error("Update profile error:", error);
      return { profile: null, error };
    }
  },

  // Update Availability Status
  async updateAvailability(userId, isAvailable) {
    try {
      const { data, error } = await supabase
        .from("pillar_profiles")
        .update({ is_available: isAvailable })
        .eq("id", userId)
        .select()
        .single();

      if (error) throw error;
      return { profile: data, error: null };
    } catch (error) {
      console.error("Update availability error:", error);
      return { profile: null, error };
    }
  }
};
