// ===========================
// Profile Service — Frontend Interface
// ===========================

import { supabase } from '../../lib/supabase';

/**
 * Fetch the customer profile matching the currently authenticated user
 * @param {string} userId - Auth user UUID
 */
export async function getProfile(userId) {
    const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

    if (error) {
        if (error.code === 'PGRST116') {
            // Profile not found
            return null;
        }
        throw error;
    }

    return data;
}

/**
 * Create or update a profile
 * @param {object} profileData - Profile fields to save
 */
export async function upsertProfile(profileData) {
    const { data, error } = await supabase
        .from('profiles')
        .upsert(profileData, { onConflict: 'user_id' })
        .select()
        .single();

    if (error) throw error;
    return data;
}

export default {
    getProfile,
    upsertProfile,
};
