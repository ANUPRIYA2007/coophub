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
        supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
            // AUTHORIZATION BYPASS FOR DEVELOPMENT
            const bypassSession = {
                user: {
                    id: '11111111-1111-1111-1111-111111111111',
                    email: 'demo_bypass@example.com'
                },
                access_token: 'dummy'
            };
            setSession(bypassSession);
            setUser(bypassSession.user);
            setProfile({ user_id: bypassSession.user.id, full_name: 'Demo Bypass User', role: 'customer', email: bypassSession.user.email });
            setLoading(false);
        });

        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (_event, currentSession) => {
                // BYPASS
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
