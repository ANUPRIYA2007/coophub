import React, { createContext, useState, useEffect, useContext } from "react";
import { pillarAuthService } from "../services/pillar/authService";
import { pillarProfileService } from "../services/pillar/profileService";
import { supabase } from "../lib/supabase";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  // Global Pillar Availability State (Synchronized across all components & portals)
  const [isAvailable, setIsAvailable] = useState(() => {
    return localStorage.getItem("coophub_pillar_available") !== "false";
  });

  useEffect(() => {
    // Initial session check
    const initializeAuth = async () => {
      try {
        const { session: currentSession, error: sessionError } = await pillarAuthService.getSession();
        if (sessionError) throw sessionError;

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          await loadProfile(currentSession.user.id);
        }
      } catch (error) {
        console.error("Auth initialization error:", error);
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        setSession(currentSession);
        setUser(currentSession?.user || null);

        if (currentSession?.user) {
          if (event === "SIGNED_IN") {
            await loadProfile(currentSession.user.id);
          }
        } else {
          setProfile(null);
        }
        setLoading(false);
      }
    );

    // Cross-tab / cross-component sync listener
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

  const loadProfile = async (userId) => {
    const { profile: userProfile, error } = await pillarProfileService.getProfile(userId);
    if (!error && userProfile) {
      setProfile(userProfile);
      if (userProfile.is_available !== undefined) {
        setIsAvailable(userProfile.is_available);
        localStorage.setItem("coophub_pillar_available", userProfile.is_available ? "true" : "false");
      }
    }
  };

  // Centralized Global Availability Updater (Live 3-Portal Sync)
  const updateAvailability = async (nextStatus) => {
    setIsAvailable(nextStatus);
    localStorage.setItem("coophub_pillar_available", nextStatus ? "true" : "false");
    setProfile((prev) => prev ? { ...prev, is_available: nextStatus } : null);

    // Broadcast event to update all mounted components immediately
    window.dispatchEvent(new CustomEvent("coophub_availability_change", { detail: { isAvailable: nextStatus } }));

    // Persist to live Supabase database if real user
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
    return await pillarAuthService.login(credentials);
  };

  const register = async (data) => {
    return await pillarAuthService.register(data);
  };

  const logout = async () => {
    await pillarAuthService.logout();
    setUser(null);
    setProfile(null);
    setSession(null);
    localStorage.removeItem("coophub_demo_user");
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || { id: "00000000-0000-0000-0000-000000000000", email: "senthil@coophub.in", user_metadata: { full_name: "Senthil Kumar" } },
        profile: {
          id: profile?.id || "00000000-0000-0000-0000-000000000000",
          full_name: profile?.full_name || "Senthil Kumar",
          pillar_code: profile?.pillar_code || "PIL-CHE-042",
          main_services: profile?.main_services || ["Electrician", "AC Repair"],
          sub_services: profile?.sub_services || ["Wiring", "DB Box", "Inverter", "MCB Installation"],
          experience_years: profile?.experience_years || 6,
          service_area: profile?.service_area || "Guindy, Velachery, Adyar",
          is_available: isAvailable,
          status: profile?.status || "approved",
          rating: profile?.rating || 4.9,
          total_orders: profile?.total_orders || 142,
          completion_rate: profile?.completion_rate || 98.5,
        },
        session: session || { user: { id: "00000000-0000-0000-0000-000000000000" } },
        loading: false,
        isAvailable,
        setIsAvailable,
        updateAvailability,
        login,
        register,
        logout,
        isAuthenticated: true,
        isVerified: true,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
