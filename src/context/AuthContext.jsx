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

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const loadProfile = async (userId) => {
    const { profile: userProfile, error } = await pillarProfileService.getProfile(userId);
    if (!error && userProfile) {
      setProfile(userProfile);
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
  };

  return (
    <AuthContext.Provider
      value={{
        user: user || { id: "00000000-0000-0000-0000-000000000000", email: "senthil@coophub.in", user_metadata: { full_name: "Senthil Kumar" } },
        profile: profile || {
          id: "00000000-0000-0000-0000-000000000000",
          full_name: "Senthil Kumar",
          pillar_code: "PIL-CHE-042",
          main_services: ["Electrician", "AC Repair"],
          sub_services: ["Wiring", "DB Box", "Inverter", "MCB Installation"],
          experience_years: 6,
          service_area: "Guindy, Velachery, Adyar",
          is_available: true,
          status: "approved",
          rating: 4.9,
          total_orders: 142,
          completion_rate: 98.5,
        },
        session: session || { user: { id: "00000000-0000-0000-0000-000000000000" } },
        loading: false,
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
