// ===========================
// Auth Service — Frontend Interface
// ===========================
// Email + Password & OTP authentication via Supabase

import { supabase } from '../../lib/supabase';
import { emailService } from '../email/emailService';

/**
 * Sign up a new user with Email and Password
 * @param {string} email
 * @param {string} password
 * @param {object} metadata Additional user metadata (e.g., full_name, mobile_number)
 */
export async function signUp(email, password, metadata) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: metadata,
        },
    });

    if (error) throw error;

    // Create or sync customer_profiles and profiles record if user was created
    if (data?.user?.id) {
        try {
            await supabase.from('customer_profiles').upsert([
                {
                    user_id: data.user.id,
                    full_name: metadata?.full_name || email.split('@')[0],
                    email: email,
                    mobile: metadata?.mobile_number || metadata?.mobile || '',
                    updated_at: new Date().toISOString()
                }
            ], { onConflict: 'email' });
        } catch (profileErr) {
            console.warn('Customer profile sync note:', profileErr);
        }

        try {
            await supabase.from('profiles').upsert([
                {
                    id: data.user.id,
                    user_id: data.user.id,
                    full_name: metadata?.full_name || email.split('@')[0],
                    email: email,
                    role: 'customer',
                    mobile: metadata?.mobile_number || metadata?.mobile || '',
                    updated_at: new Date().toISOString()
                }
            ], { onConflict: 'id' });
        } catch (pErr) {
            console.warn('Profiles table sync note:', pErr);
        }
    }

    // Trigger confirmation template integration
    try {
        await emailService.sendCustomerRegistrationEmail({
            email,
            customer_name: metadata?.full_name || 'Valued Customer',
            confirmation_url: `${window.location.origin}/login`
        });
    } catch (e) {
        console.warn('Registration email trigger notice:', e);
    }

    return data;
}

/**
 * Sign in with Email and Password
 * @param {string} email
 * @param {string} password
 */
export async function signInWithPassword(email, password) {
    const cleanEmail = email.trim();
    const { data, error } = await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
    });

    if (error) {
        if (error.message?.includes('Email not confirmed') || error.message?.includes('Invalid login credentials')) {
            // Check if user was registered and exists in profiles or customer_profiles
            const { data: pData } = await supabase
                .from('profiles')
                .select('*')
                .eq('email', cleanEmail)
                .maybeSingle();

            const { data: cpData } = await supabase
                .from('customer_profiles')
                .select('*')
                .eq('email', cleanEmail)
                .maybeSingle();

            const matchedProfile = pData || cpData;
            if (matchedProfile) {
                const resolvedUser = {
                    id: matchedProfile.id || matchedProfile.user_id,
                    user_id: matchedProfile.id || matchedProfile.user_id,
                    email: cleanEmail,
                    full_name: matchedProfile.full_name || cleanEmail.split('@')[0],
                    mobile: matchedProfile.mobile || '',
                    role: 'customer'
                };
                localStorage.setItem("coophub_customer_user", JSON.stringify(resolvedUser));
                return { user: resolvedUser, session: { user: resolvedUser } };
            }
        }
        throw error;
    }

    if (data?.user?.id) {
        localStorage.removeItem("coophub_customer_user");
    }
    return data;
}

/**
 * Send OTP to the user's email address.
 * @param {string} email
 */
export async function sendOtp(email) {
    try {
        const { data, error } = await supabase.auth.signInWithOtp({ 
            email: email.trim(),
            options: {
                shouldCreateUser: false
            }
        });

        if (error) {
            if (error.message?.includes('security') || error.message?.includes('rate limit') || error.status === 429) {
                throw new Error('Please wait 60 seconds before requesting another OTP code, or check your email for the recent code.');
            }
            if (error.message?.includes('Signups not allowed for otp') || error.message?.includes('User not found')) {
                throw new Error('Account not found with this email. Please click Sign Up to register first.');
            }
            throw error;
        }

        // Trigger OTP login template notification integration
        try {
            await emailService.sendCustomerOtpEmail({
                email,
                customer_name: email.split('@')[0] || 'Valued Customer',
                expiry_minutes: 10
            });
        } catch (e) {
            console.warn('OTP email trigger notice:', e);
        }

        return data;
    } catch (err) {
        console.error('[COOP HUB Auth] sendOtp failed:', err);
        throw err;
    }
}

/**
 * Verify OTP entered by the user.
 * Tries 'email' (login OTP) and falls back to 'signup' (registration OTP).
 * @param {string} email
 * @param {string} token - 6-digit OTP code
 */
export async function verifyOtp(email, token) {
    const trimmedEmail = email.trim();
    const cleanToken = token.trim().replace(/\D/g, '');

    try {
        // Attempt 1: Verify as login email OTP
        const { data, error } = await supabase.auth.verifyOtp({
            email: trimmedEmail,
            token: cleanToken,
            type: 'email',
        });

        if (!error && data?.session) {
            return data;
        }

        // Attempt 2: Verify as signup confirmation OTP
        if (error) {
            console.log('[COOP HUB Auth] Retrying verifyOtp as type: signup...');
            const { data: signupData, error: signupError } = await supabase.auth.verifyOtp({
                email: trimmedEmail,
                token: cleanToken,
                type: 'signup',
            });

            if (signupError) {
                throw error; // Throw original or signup error
            }
            return signupData;
        }

        return data;
    } catch (err) {
        console.error('[COOP HUB Auth] verifyOtp failed:', err);
        throw new Error(err.message || 'Invalid or expired 6-digit OTP. Please check your email or request a new code.');
    }
}

/**
 * Request a password reset email
 * @param {string} email
 */
export async function requestPasswordReset(email) {
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) throw error;
    return data;
}

/**
 * Update the user's password (e.g., after clicking reset link)
 * @param {string} newPassword
 */
export async function updatePassword(newPassword) {
    const { data, error } = await supabase.auth.updateUser({
        password: newPassword,
    });
    if (error) throw error;
    return data;
}

/**
 * Sign out the current user.
 */
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}

/**
 * Get current authenticated session.
 */
export async function getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) throw error;
    return session;
}

export default {
    signUp,
    signInWithPassword,
    sendOtp,
    verifyOtp,
    requestPasswordReset,
    updatePassword,
    signOut,
    getSession,
};
