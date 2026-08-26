// ===========================
// Supabase Realtime Service
// ===========================
// Prepares the architecture for subscribing to Supabase Realtime events.
// Future events: booking.created, booking.accepted, worker.location.updated,
// worker.arrived, arrival.verified, service.started, extra_charge.requested,
// service.completed, payment.completed, notification.created

import { supabase } from '../../lib/supabase';

/**
 * Subscribe to changes on a specific table.
 * @param {string} table - Supabase table name
 * @param {string} event - 'INSERT' | 'UPDATE' | 'DELETE' | '*'
 * @param {function} callback - Handler for the payload
 * @param {object} filter - Optional filter e.g. { column: 'user_id', value: '...' }
 * @returns {object} Supabase RealtimeChannel (call .unsubscribe() to clean up)
 */
export function subscribeToTable(table, event = '*', callback, filter = null) {
    let channel = supabase
        .channel(`public:${table}`)
        .on(
            'postgres_changes',
            {
                event,
                schema: 'public',
                table,
                ...(filter ? { filter: `${filter.column}=eq.${filter.value}` } : {}),
            },
            (payload) => callback(payload),
        );

    channel.subscribe();
    return channel;
}

/**
 * Unsubscribe from a realtime channel.
 * @param {object} channel
 */
export function unsubscribe(channel) {
    if (channel) {
        supabase.removeChannel(channel);
    }
}

export default {
    subscribeToTable,
    unsubscribe,
};
