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
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
}

/**
 * Send OTP to the user's email address.
 * @param {string} email
 */
export async function sendOtp(email) {
    const { data, error } = await supabase.auth.signInWithOtp({ email });
    if (error) throw error;

    // Trigger OTP login template integration
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
}

/**
 * Verify OTP entered by the user.
 * @param {string} email
 * @param {string} token - 6-digit OTP code
 */
export async function verifyOtp(email, token) {
    const { data, error } = await supabase.auth.verifyOtp({
        email,
        token,
        type: 'email',
    });
    if (error) throw error;
    return data;
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
