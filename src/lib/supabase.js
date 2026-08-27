import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn(
        '[COOP HUB] Supabase environment variables are not set. ' +
        'Please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'
    );
}

const rawSupabase = createClient(
    supabaseUrl || '',
    supabaseAnonKey || '',
);

// Intercept auth methods to return demo session if demo flag is enabled in localStorage
const getDemoSession = () => {
    if (localStorage.getItem("coophub_demo_user") === "true" || localStorage.getItem("coophub_demo_admin") === "true") {
        return {
            session: {
                user: { id: "00000000-0000-0000-0000-000000000000", email: "senthil@coophub.in" },
                access_token: 'dummy-pillar'
            },
            user: { id: "00000000-0000-0000-0000-000000000000", email: "senthil@coophub.in" }
        };
    }
    if (localStorage.getItem("coophub_demo_customer") === "true") {
        return {
            session: {
                user: { id: '11111111-1111-1111-1111-111111111111', email: 'demo_bypass@example.com' },
                access_token: 'dummy-customer'
            },
            user: { id: '11111111-1111-1111-1111-111111111111', email: 'demo_bypass@example.com' }
        };
    }
    return null;
};

const authHandler = {
    get: function(target, prop, receiver) {
        if (prop === 'getSession') {
            return async () => {
                const demo = getDemoSession();
                if (demo) {
                    return { data: { session: demo.session }, error: null };
                }
                return await target.getSession();
            };
        }
        if (prop === 'getUser') {
            return async () => {
                const demo = getDemoSession();
                if (demo) {
                    return { data: { user: demo.user }, error: null };
                }
                return await target.getUser();
            };
        }
        return Reflect.get(target, prop, receiver);
    }
};

const supabaseProxyHandler = {
    get: function(target, prop, receiver) {
        if (prop === 'auth') {
            return new Proxy(target.auth, authHandler);
        }
        return Reflect.get(target, prop, receiver);
    }
};

export const supabase = new Proxy(rawSupabase, supabaseProxyHandler);
