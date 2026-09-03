// ==============================================================================
// COOP HUB — Centralized Notification Service
// Handles Realtime alerts for Booking Lifecycle Milestones across Customer & Pillar
// ==============================================================================

import { supabase } from '../../lib/supabase';

export const notificationService = {
  /**
   * Fetch in-app notifications for a user (Customer or Pillar)
   */
  async getNotifications(userId) {
    try {
      if (!userId) return [];
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });

      // Support either customer_id or user_id column
      query = query.or(`customer_id.eq.${userId},user_id.eq.${userId}`);

      const { data, error } = await query;
      if (error) throw error;
      return (data || []).map(n => ({
        id: n.id,
        type: n.type || 'info',
        title: n.title || n.message_translations?.en || 'Cooperative Notification',
        message: n.message || n.message_translations?.en || 'You have an update regarding your service.',
        is_read: n.is_read || n.read || false,
        created_at: n.created_at,
        request_id: n.request_id
      }));
    } catch (err) {
      console.warn('notificationService.getNotifications note:', err.message);
      return [];
    }
  },

  /**
   * Mark a notification as read
   */
  async markAsRead(notificationId) {
    try {
      await supabase
        .from('notifications')
        .update({ is_read: true, read: true })
        .eq('id', notificationId);
      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Dispatch a lifecycle notification record to Supabase
   */
  async createNotification({ userId, customerId, requestId, type, title, message }) {
    try {
      const recipientId = userId || customerId;
      if (!recipientId) return null;

      const payload = {
        request_id: requestId || null,
        type: type || 'service_update',
        title: title || 'Cooperative Update',
        message: message || '',
        message_translations: {
          en: message || title || 'Service notification update',
          ta: message || title || 'சேவை அறிவிப்பு புதுப்பிப்பு'
        },
        is_read: false,
        created_at: new Date().toISOString()
      };

      if (customerId) payload.customer_id = customerId;
      if (userId) payload.user_id = userId;

      const { data, error } = await supabase
        .from('notifications')
        .insert([payload])
        .select()
        .maybeSingle();

      if (error) console.warn('createNotification insert note:', error.message);
      return data || payload;
    } catch (err) {
      console.warn('createNotification exception:', err.message);
      return null;
    }
  },

  /**
   * Live Supabase Realtime channel for new incoming notifications
   */
  subscribeToNotifications(userId, callback) {
    if (!userId) return { unsubscribe: () => {} };

    const channel = supabase
      .channel(`notifications-live-${userId}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'notifications' },
        (payload) => {
          if (!payload.new) return;
          const n = payload.new;
          if (n.customer_id === userId || n.user_id === userId) {
            if (callback) callback({
              id: n.id,
              type: n.type || 'info',
              title: n.title || n.message_translations?.en || 'Service Alert',
              message: n.message || n.message_translations?.en || '',
              is_read: false,
              created_at: n.created_at,
              request_id: n.request_id
            });
          }
        }
      )
      .subscribe();

    return {
      unsubscribe: () => supabase.removeChannel(channel)
    };
  }
};

export default notificationService;
