// ==============================================================================
// COOP HUB — Centralized Notification Synchronization Service
// Provides synchronized unread counts, read tracking, and live Realtime updates
// across all 4 portals: Customer, Pillar, Admin, and Super Admin
// ==============================================================================

import { supabase } from '../../lib/supabase';

const READ_KEY = 'coophub_read_notifs';
const DISMISSED_KEY = 'coophub_dismissed_notifs';

export const notificationSyncService = {
  /**
   * Get all read notification IDs from localStorage
   */
  getReadIds() {
    try {
      return JSON.parse(localStorage.getItem(READ_KEY) || '[]');
    } catch {
      return [];
    }
  },

  /**
   * Get all dismissed notification IDs from localStorage
   */
  getDismissedIds() {
    try {
      return JSON.parse(localStorage.getItem(DISMISSED_KEY) || '[]');
    } catch {
      return [];
    }
  },

  /**
   * Mark a notification as read and dispatch update event
   */
  async markAsRead(id) {
    if (!id) return;
    try {
      const readIds = this.getReadIds();
      if (!readIds.includes(id)) {
        readIds.push(id);
        localStorage.setItem(READ_KEY, JSON.stringify(readIds));
      }

      // If UUID, update Supabase DB in background
      if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) {
        try {
          await supabase.from('notifications').update({ is_read: true, read: true }).eq('id', id);
        } catch (e) {
          // ignore background update error
        }
      }

      window.dispatchEvent(new CustomEvent('coophub_notifications_updated', { detail: { readId: id } }));
    } catch (e) {
      console.warn('markAsRead error:', e);
    }
  },

  /**
   * Mark all specified notification IDs as read
   */
  async markAllAsRead(ids = []) {
    try {
      const currentRead = new Set(this.getReadIds());
      ids.forEach(id => currentRead.add(id));
      localStorage.setItem(READ_KEY, JSON.stringify(Array.from(currentRead)));

      // Update Supabase for valid UUIDs
      const uuidList = ids.filter(id => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id));
      if (uuidList.length > 0) {
        try {
          await supabase.from('notifications').update({ is_read: true, read: true }).in('id', uuidList);
        } catch (e) {
          // ignore background sync error
        }
      }

      window.dispatchEvent(new CustomEvent('coophub_notifications_updated', { detail: { allRead: true } }));
    } catch (e) {
      console.warn('markAllAsRead error:', e);
    }
  },

  /**
   * Dismiss a notification completely
   */
  async dismissNotification(id) {
    if (!id) return;
    try {
      const dismissed = this.getDismissedIds();
      if (!dismissed.includes(id)) {
        dismissed.push(id);
        localStorage.setItem(DISMISSED_KEY, JSON.stringify(dismissed));
      }
      await this.markAsRead(id);
      window.dispatchEvent(new CustomEvent('coophub_notifications_updated', { detail: { dismissedId: id } }));
    } catch (e) {
      console.warn('dismissNotification error:', e);
    }
  },

  /**
   * Clear all notifications
   */
  async clearAll(ids = []) {
    try {
      const currentDismissed = new Set(this.getDismissedIds());
      ids.forEach(id => currentDismissed.add(id));
      localStorage.setItem(DISMISSED_KEY, JSON.stringify(Array.from(currentDismissed)));

      await this.markAllAsRead(ids);
      window.dispatchEvent(new CustomEvent('coophub_notifications_updated', { detail: { cleared: true } }));
    } catch (e) {
      console.warn('clearAll error:', e);
    }
  },

  /**
   * Calculate exact dynamic unread count for Customer Portal
   */
  async getCustomerUnreadCount(profile, user) {
    const customerId = profile?.user_id || user?.id;
    const readIds = new Set(this.getReadIds());
    const dismissedIds = new Set(this.getDismissedIds());

    let unreadCount = 0;
    const seenIds = new Set();

    try {
      // 1. Check notifications table
      if (customerId) {
        const { data: dbNotifs } = await supabase
          .from('notifications')
          .select('id, is_read, read')
          .or(`customer_id.eq.${customerId},user_id.eq.${customerId}`);

        if (dbNotifs && dbNotifs.length > 0) {
          dbNotifs.forEach(n => {
            seenIds.add(n.id);
            const isRead = n.is_read || n.read || readIds.has(n.id) || dismissedIds.has(n.id);
            if (!isRead) {
              unreadCount += 1;
            }
          });
        }
      }

      // 2. Check service_requests lifecycle alerts
      let sReqQuery = supabase
        .from('service_requests')
        .select('id, status, updated_at, created_at')
        .order('created_at', { ascending: false })
        .limit(10);

      if (customerId) {
        sReqQuery = sReqQuery.or(`customer_id.eq.${customerId},customer_id.is.null`);
      }

      const { data: reqs } = await sReqQuery;
      if (reqs && reqs.length > 0) {
        reqs.forEach(r => {
          const statusNotifId = `req-status-${r.id}`;
          if (!seenIds.has(statusNotifId)) {
            seenIds.add(statusNotifId);
            if (!readIds.has(statusNotifId) && !dismissedIds.has(statusNotifId)) {
              unreadCount += 1;
            }
          }
        });
      }

      // 3. If zero notifications from DB and requests, check demo baseline
      if (seenIds.size === 0) {
        const demoIds = ['notif-1', 'notif-2'];
        const activeDemo = demoIds.filter(id => !readIds.has(id) && !dismissedIds.has(id));
        return activeDemo.length;
      }

      return unreadCount;
    } catch (e) {
      console.warn('getCustomerUnreadCount note:', e.message);
      // If error occurs, count remaining unread demo IDs instead of hardcoded 2
      const demoIds = ['notif-1', 'notif-2'];
      return demoIds.filter(id => !readIds.has(id) && !dismissedIds.has(id)).length;
    }
  },

  async getPortalNotifications(portalRole, userId) {
    const readIds = new Set(this.getReadIds());
    const dismissedIds = new Set(this.getDismissedIds());

    const initialPillar = [
      {
        id: 'pillar-alert-1',
        title: 'Welcome to Pillar Workspace',
        message: 'Your service technician profile is verified and active for incoming orders.',
        created_at: 'Just now',
        is_read: readIds.has('pillar-alert-1') || dismissedIds.has('pillar-alert-1'),
        type: 'system'
      }
    ];
    const initialAdmin = [
      {
        id: 'admin-alert-1',
        title: 'System Active & Online',
        message: 'COOP HUB cooperative administration and live Hero AI notifications active.',
        created_at: 'Just now',
        is_read: readIds.has('admin-alert-1') || dismissedIds.has('admin-alert-1'),
        type: 'system'
      }
    ];
    const defaultItems = portalRole === 'pillar' ? initialPillar : initialAdmin;

    try {
      let query = supabase
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(15);

      if (portalRole === 'pillar' && userId) {
        // The notifications table does not have a user_id or pillar_id column in the remote DB.
        // To avoid a 400 Bad Request error, we will not filter by user_id here. 
        // In a production system, we'd join on service_requests to filter by pillar_id.
      }

      const { data, error } = await query;

      let items = [];
      if (!error && data && data.length > 0) {
        items = data.map(n => {
          let derivedTitle = n.title;
          if (!derivedTitle && n.type) {
            derivedTitle = n.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
          }
          let derivedMessage = n.message;
          if (!derivedMessage && n.message_translations && n.message_translations.en) {
            derivedMessage = n.message_translations.en;
          }
          
          return {
            id: n.id,
            title: derivedTitle || 'System Alert',
            message: derivedMessage || 'Notification update',
            created_at: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            is_read: Boolean(n.is_read || n.read || readIds.has(n.id) || dismissedIds.has(n.id)),
            type: n.type || 'system'
          };
        });
      } else {
        items = defaultItems;
      }

      const filtered = items.filter(n => !dismissedIds.has(n.id));
      const unreadCount = filtered.filter(n => !n.is_read).length;

      return {
        notifications: filtered,
        unreadCount
      };
    } catch (e) {
      console.warn('getPortalNotifications note:', e.message);
      const filtered = defaultItems.filter(n => !dismissedIds.has(n.id));
      return {
        notifications: filtered,
        unreadCount: filtered.filter(n => !n.is_read).length
      };
    }
  }
};

export default notificationSyncService;
