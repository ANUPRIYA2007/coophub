import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { getProfile } from '../services/auth/profileService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null);
    const [session, setSession] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);

    // Helper to fetch and set profile
    const loadProfile = async (userId) => {
        try {
            const p = await getProfile(userId);
            setProfile(p);
        } catch (err) {
            console.error('Failed to load profile:', err);
            setProfile(null);
        }
    };

    useEffect(() => {
        // Initial fetch
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            setSession(currentSession);
            const currentUser = currentSession?.user ?? null;
            setUser(currentUser);

            if (currentUser) {
                loadProfile(currentUser.id).finally(() => setLoading(false));
            } else {
                setLoading(false);
            }
        });

        // Sub to auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, currentSession) => {
                setSession(currentSession);
                const currentUser = currentSession?.user ?? null;
                setUser(currentUser);

                if (currentUser) {
                    await loadProfile(currentUser.id);
                } else {
                    setProfile(null);
                }
                setLoading(false);
            }
        );

        return () => subscription.unsubscribe();
    }, []);

    const value = {
        user,
        session,
        profile,
        loading,
        signOut: () => supabase.auth.signOut(),
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
