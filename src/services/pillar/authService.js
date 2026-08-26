import { supabase } from "../../lib/supabase";

export const pillarAuthService = {
  // Login with Email/Phone and Password
  async login({ email, phone, password }) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        phone,
        password,
      });

      if (error) throw error;
      return { user: data.user, error: null };
    } catch (error) {
      console.error("Login error:", error);
      return { user: null, error };
    }
  },

  // Register Pillar
  async register(pillarData) {
    try {
      // 1. Register with Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: pillarData.email,
        password: pillarData.password,
        phone: pillarData.mobile,
        options: {
          data: {
            full_name: pillarData.fullName,
            role: "pillar", // Ensure role is pillar
          },
        },
      });

      if (authError) throw authError;

      const userId = authData.user.id;

      // 2. Create Pillar Profile Record
      const { error: profileError } = await supabase.from("pillar_profiles").insert([
        {
          id: userId,
          full_name: pillarData.fullName,
          email: pillarData.email,
          mobile: pillarData.mobile,
          main_services: pillarData.mainServices,
          sub_services: pillarData.subServices,
          experience_years: pillarData.experience,
          service_area: pillarData.serviceArea,
          preferred_language: pillarData.preferredLanguage,
          status: "pending_review",
        },
      ]);

      if (profileError) throw profileError;

      return { user: authData.user, error: null };
    } catch (error) {
      console.error("Registration error:", error);
      return { user: null, error };
    }
  },

  // Login with OTP
  async loginWithOtp(phone) {
    try {
      const { error } = await supabase.auth.signInWithOtp({
        phone,
      });
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error("OTP login error:", error);
      return { success: false, error };
    }
  },

  // Verify OTP
  async verifyOtp(phone, token) {
    try {
      const { data, error } = await supabase.auth.verifyOtp({
        phone,
        token,
        type: 'sms',
      });
      if (error) throw error;
      return { user: data.user, session: data.session, error: null };
    } catch (error) {
      console.error("OTP verify error:", error);
      return { user: null, session: null, error };
    }
  },

  // Logout
  async logout() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      console.error("Logout error:", error);
      return { success: false, error };
    }
  },

  // Get Current Session
  async getSession() {
    try {
      const { data, error } = await supabase.auth.getSession();
      if (error) throw error;
      return { session: data.session, error: null };
    } catch (error) {
      return { session: null, error };
    }
  }
};
