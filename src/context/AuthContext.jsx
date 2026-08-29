import React, { createContext, useState, useEffect, useContext } from "react";
import { pillarAuthService } from "../services/pillar/authService";
import { pillarProfileService } from "../services/pillar/profileService";
import { getProfile } from "../services/auth/profileService";
import { supabase } from "../lib/supabase";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Global Pillar Availability State
  const [isAvailable, setIsAvailable] = useState(() => {
    return localStorage.getItem("coophub_pillar_available") !== "false";
  });

  const loadProfile = async (userId) => {
    try {
      // 1. Try fetching Pillar Profile first
      const { profile: pillarProfile } = await pillarProfileService.getProfile(userId);
      if (pillarProfile) {
        setProfile({ ...pillarProfile, role: 'pillar' });
        if (pillarProfile.is_available !== undefined) {
          setIsAvailable(pillarProfile.is_available);
          localStorage.setItem("coophub_pillar_available", pillarProfile.is_available ? "true" : "false");
        }
        return;
      }

      // 2. Fallback to Customer Profile
      const customerProfile = await getProfile(userId);
      if (customerProfile) {
        setProfile({ ...customerProfile, role: 'customer' });
      }
    } catch (error) {
      console.error("Error loading unified profile:", error);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        
        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          await loadProfile(currentSession.user.id);
        } else {
          // Handle Demo / Bypass Modes
          const isPillarDemo = localStorage.getItem("coophub_demo_user") === "true";
          const isCustomerDemo = localStorage.getItem("coophub_demo_customer") === "true";
          const isAdminDemo = localStorage.getItem("coophub_demo_admin") === "true";

          if (isPillarDemo || isAdminDemo) {
            const pillarDemoSession = {
              user: { id: "00000000-0000-0000-0000-000000000000", email: "senthil@coophub.in" }
            };
            setSession(pillarDemoSession);
            setUser(pillarDemoSession.user);
            setProfile({
              id: "00000000-0000-0000-0000-000000000000",
              full_name: "Senthil Kumar",
              pillar_code: "PIL-CHE-042",
              main_services: ["Electrician", "AC Repair"],
              sub_services: ["Wiring", "DB Box", "Inverter", "MCB Installation"],
              experience_years: 6,
              service_area: "Guindy, Velachery, Adyar",
              is_available: isAvailable,
              status: "approved",
              rating: 4.9,
              total_orders: 142,
              completion_rate: 98.5,
              role: 'pillar'
            });
          } else if (isCustomerDemo) {
            const customerDemoSession = {
              user: { id: '11111111-1111-1111-1111-111111111111', email: 'demo_bypass@example.com' },
              access_token: 'dummy'
            };
            setSession(customerDemoSession);
            setUser(customerDemoSession.user);
            setProfile({
              user_id: customerDemoSession.user.id,
              full_name: 'Anupriya Murugan',
              role: 'customer',
              email: 'customer@coophub.in'
            });
          }
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for Auth changes from Supabase
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user || null);

        if (currentSession?.user) {
          if (event === "SIGNED_IN") {
            await loadProfile(currentSession.user.id);
          }
        } else {
          // If not in demo bypass, clear profile
          const isPillarDemo = localStorage.getItem("coophub_demo_user") === "true";
          const isCustomerDemo = localStorage.getItem("coophub_demo_customer") === "true";
          if (!isPillarDemo && !isCustomerDemo) {
            setProfile(null);
          }
        }
        setLoading(false);
      }
    );

    const handleAvailabilitySync = (e) => {
      if (e.detail?.isAvailable !== undefined) {
        setIsAvailable(e.detail.isAvailable);
      } else {
        setIsAvailable(localStorage.getItem("coophub_pillar_available") !== "false");
      }
    };
    window.addEventListener("coophub_availability_change", handleAvailabilitySync);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener("coophub_availability_change", handleAvailabilitySync);
    };
  }, []);

  const updateAvailability = async (nextStatus) => {
    setIsAvailable(nextStatus);
    localStorage.setItem("coophub_pillar_available", nextStatus ? "true" : "false");
    setProfile((prev) => prev ? { ...prev, is_available: nextStatus } : null);

    window.dispatchEvent(new CustomEvent("coophub_availability_change", { detail: { isAvailable: nextStatus } }));

    if (user?.id && user.id !== "00000000-0000-0000-0000-000000000000") {
      try {
        await supabase
          .from("pillar_profiles")
          .update({ is_available: nextStatus, last_active_at: new Date().toISOString() })
          .eq("id", user.id);
      } catch (err) {
        console.warn("Failed to persist availability to Supabase:", err.message);
      }
    }
  };

  const login = async (credentials) => {
    const res = await pillarAuthService.login(credentials);
    if (res?.user) {
      setUser(res.user);
      if (res.profile) {
        setProfile({ ...res.profile, role: "pillar" });
        if (res.profile.is_available !== undefined) {
          setIsAvailable(res.profile.is_available);
          localStorage.setItem("coophub_pillar_available", res.profile.is_available ? "true" : "false");
        }
      } else {
        await loadProfile(res.user.id);
      }
    }
    return res;
  };

  const loginCustomerDemo = () => {
    localStorage.setItem("coophub_demo_customer", "true");
    localStorage.removeItem("coophub_demo_user");
    localStorage.removeItem("coophub_demo_admin");
    const customerDemoSession = {
      user: { id: '11111111-1111-1111-1111-111111111111', email: 'customer@coophub.in' },
      access_token: 'dummy'
    };
    setSession(customerDemoSession);
    setUser(customerDemoSession.user);
    setProfile({
      user_id: customerDemoSession.user.id,
      full_name: 'Anupriya Murugan',
      role: 'customer',
      email: 'customer@coophub.in'
    });
  };

  const register = async (data) => {
    return await pillarAuthService.register(data);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setUser(null);
    setProfile(null);
    setSession(null);
    localStorage.removeItem("coophub_demo_user");
    localStorage.removeItem("coophub_demo_admin");
    localStorage.removeItem("coophub_demo_customer");
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        session,
        loading,
        isAvailable,
        setIsAvailable,
        updateAvailability,
        login,
        loginCustomerDemo,
        register,
        logout,
        signOut: logout, // compatibility alias for customer portal
        isAuthenticated: !!user,
        isVerified: true
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export default AuthContext;

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined || context === null) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
