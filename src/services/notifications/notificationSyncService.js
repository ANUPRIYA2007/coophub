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
      if (customerId) {
        const { data: reqs } = await supabase
          .from('service_requests')
          .select('id, status, updated_at, created_at')
          .eq('customer_id', customerId)
          .order('created_at', { ascending: false })
          .limit(10);

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

  async getPortalNotifications(portalRole, userId, userProfile = null) {
    const readIds = new Set(this.getReadIds());
    const dismissedIds = new Set(this.getDismissedIds());

    // Collect all valid target identifiers for this pillar to isolate notifications strictly
    const targetIds = new Set();
    const targetCodes = new Set();
    let pillarDisplayName = 'Technician';

    if (portalRole === 'pillar') {
      if (userId) {
        targetIds.add(String(userId).toLowerCase());
        targetCodes.add(String(userId).toUpperCase());
      }
      if (userProfile) {
        if (userProfile.id) {
          targetIds.add(String(userProfile.id).toLowerCase());
          targetCodes.add(String(userProfile.id).toUpperCase());
        }
        if (userProfile.user_id) {
          targetIds.add(String(userProfile.user_id).toLowerCase());
        }
        if (userProfile.pillar_code) {
          targetCodes.add(String(userProfile.pillar_code).toUpperCase());
          targetIds.add(String(userProfile.pillar_code).toLowerCase());
        }
        if (userProfile.alias_id) {
          targetIds.add(String(userProfile.alias_id).toLowerCase());
        }
        if (userProfile.alias_code) {
          targetCodes.add(String(userProfile.alias_code).toUpperCase());
          targetIds.add(String(userProfile.alias_code).toLowerCase());
        }
        if (userProfile.full_name) {
          pillarDisplayName = userProfile.full_name;
        }
      }

      // Check localStorage active pillar items
      try {
        const storedCode = localStorage.getItem('coophub_active_pillar_code');
        if (storedCode) {
          targetCodes.add(storedCode.toUpperCase());
          targetIds.add(storedCode.toLowerCase());
        }
        const storedId = localStorage.getItem('coophub_active_pillar_id');
        if (storedId) targetIds.add(storedId.toLowerCase());
        const storedName = localStorage.getItem('coophub_demo_user_name');
        if (storedName && (!userProfile || !userProfile.full_name)) {
          pillarDisplayName = storedName;
        }
      } catch (e) {}

      // Check if current user is demo pillar Raj Kumar (PIL-CHE-042)
      const isRaj = Array.from(targetCodes).some(c => c === 'PIL-CHE-042' || c === 'PIL-CHE-111') ||
                    Array.from(targetIds).some(id => id === 'pil-che-042' || id === 'pil-che-111' || id === '7842d4fd-ac93-4014-93ed-001c0237a36c') ||
                    (targetIds.size === 0 && localStorage.getItem('coophub_demo_user') === 'true');

      if (isRaj) {
        targetIds.add('7842d4fd-ac93-4014-93ed-001c0237a36c');
        targetIds.add('c0000000-0000-0000-0000-000000000011');
        targetIds.add('pil-che-042');
        targetIds.add('pil-che-111');
        targetCodes.add('PIL-CHE-042');
        targetCodes.add('PIL-CHE-111');
      }
    }

    const matchesPillar = (idOrCode) => {
      if (!idOrCode) return false;
      const strLower = String(idOrCode).toLowerCase();
      const strUpper = String(idOrCode).toUpperCase();
      return targetIds.has(strLower) || targetCodes.has(strUpper);
    };

    const targetCodeStr = Array.from(targetCodes)[0] || 'Active';
    const initialPillar = [
      {
        id: `pillar-welcome-${targetCodeStr.toLowerCase()}`,
        title: `Welcome, ${pillarDisplayName}!`,
        message: `Your service technician profile (${targetCodeStr}) is verified and ready for assigned bookings.`,
        created_at: 'Just now',
        is_read: readIds.has(`pillar-welcome-${targetCodeStr.toLowerCase()}`) || dismissedIds.has(`pillar-welcome-${targetCodeStr.toLowerCase()}`),
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
      let items = [];

      // 1. Fetch from Supabase notifications table (Strictly filtered by pillar or role)
      try {
        let dbQuery = supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(25);

        if (portalRole === 'pillar') {
          // Build query filters for this pillar specifically or broadcast announcements
          const orConditions = [];
          targetIds.forEach(id => {
            orConditions.push(`user_id.eq.${id}`);
            orConditions.push(`customer_id.eq.${id}`);
          });
          targetCodes.forEach(code => {
            orConditions.push(`user_id.eq.${code}`);
            orConditions.push(`customer_id.eq.${code}`);
          });
          orConditions.push('type.eq.admin_broadcast');

          if (orConditions.length > 0) {
            dbQuery = dbQuery.or(orConditions.join(','));
          }
        } else if (portalRole === 'admin') {
          dbQuery = dbQuery.or('type.eq.admin_broadcast,type.eq.system,type.eq.pillar_approval,type.eq.pillar_rejected,type.eq.certification_submitted');
        }

        const { data, error } = await dbQuery;

        if (!error && data && data.length > 0) {
          // Additional safety isolation: reject items explicitly targeted to other users
          const filteredData = portalRole === 'pillar' ? data.filter(n => {
            if (n.type === 'admin_broadcast') return true;
            if (n.user_id && matchesPillar(n.user_id)) return true;
            if (n.customer_id && matchesPillar(n.customer_id)) return true;
            if (n.pillar_id && matchesPillar(n.pillar_id)) return true;
            if (n.pillar_code && matchesPillar(n.pillar_code)) return true;
            return false;
          }) : data;

          items = filteredData.map(n => {
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
              type: n.type || 'system',
              order_id: n.order_id || null
            };
          });
        }
      } catch (dbErr) {
        console.warn('DB notifications query note:', dbErr);
      }

      // 2. For Pillar Portal, merge dedicated pillar booking notifications from localStorage
      if (portalRole === 'pillar') {
        const existingIds = new Set(items.map(i => i.id));

        try {
          const storedPillarNotifs = JSON.parse(localStorage.getItem('coophub_pillar_notifications') || '[]');
          storedPillarNotifs.forEach(pNotif => {
            if (!pNotif || !pNotif.id || existingIds.has(pNotif.id)) return;

            // STRICT ISOLATION: Only include if this notification belongs to THIS pillar
            const isForThisPillar = 
              pNotif.type === 'admin_broadcast' ||
              matchesPillar(pNotif.pillar_id) ||
              matchesPillar(pNotif.pillar_code) ||
              matchesPillar(pNotif.user_id) ||
              matchesPillar(pNotif.order?.pillar_id) ||
              matchesPillar(pNotif.order?.assigned_pillar_id) ||
              matchesPillar(pNotif.order?.pillar_code) ||
              matchesPillar(pNotif.order?.assigned_pillar_code);

            // If it explicitly belongs to another pillar, reject it
            const isExplicitlyForOther = 
              (pNotif.pillar_id && !matchesPillar(pNotif.pillar_id)) ||
              (pNotif.pillar_code && !matchesPillar(pNotif.pillar_code));

            if (isForThisPillar && !isExplicitlyForOther) {
              existingIds.add(pNotif.id);
              items.unshift({
                ...pNotif,
                is_read: Boolean(pNotif.is_read || readIds.has(pNotif.id) || dismissedIds.has(pNotif.id)),
                created_at: pNotif.created_at ? new Date(pNotif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now'
              });
            }
          });
        } catch (spErr) {}

        // Also synthesize notification items from shared live orders if any request exists ASSIGNED to this pillar
        try {
          const liveOrders = JSON.parse(localStorage.getItem('coophub_shared_live_orders') || '[]');
          const custOrders = JSON.parse(localStorage.getItem('coophub_demo_customer_created_requests') || '[]');
          const combinedLocal = [...liveOrders, ...custOrders];

          const isRaj = Array.from(targetCodes).some(c => c === 'PIL-CHE-042' || c === 'PIL-CHE-111');

          combinedLocal.forEach(ord => {
            if (!ord || !ord.id) return;
            const notifId = `notif-booking-${ord.id}`;
            if (existingIds.has(notifId)) return;

            // STRICT ISOLATION: Check if order is assigned specifically to this pillar
            const isOrderAssignedToThisPillar = 
              matchesPillar(ord.pillar_id) ||
              matchesPillar(ord.assigned_pillar_id) ||
              matchesPillar(ord.pillar_code) ||
              matchesPillar(ord.assigned_pillar_code) ||
              (ord.pillar && (matchesPillar(ord.pillar.id) || matchesPillar(ord.pillar.pillar_code)));

            // If not explicitly assigned to another pillar and status is pending, check trade match
            let isTradeMatch = false;
            const hasOtherPillarAssigned = (ord.pillar_id && !matchesPillar(ord.pillar_id)) || (ord.pillar_code && !matchesPillar(ord.pillar_code));

            if (!hasOtherPillarAssigned && (ord.status === 'pending' || ord.status === 'assigned')) {
              if (userProfile?.main_services) {
                const servicesList = Array.isArray(userProfile.main_services) ? userProfile.main_services : [userProfile.main_services];
                isTradeMatch = servicesList.some(s => 
                  ord.service_name?.toLowerCase().includes(s.toLowerCase()) || 
                  ord.service?.category?.toLowerCase().includes(s.toLowerCase()) ||
                  s.toLowerCase().includes(ord.service_name?.toLowerCase() || '')
                );
              } else if (isRaj) {
                const sName = (ord.service_name || '').toLowerCase();
                isTradeMatch = sName.includes('electric') || sName.includes('wiring') || sName.includes('fan') || sName.includes('ac') || sName.includes('mcb');
              }
            }

            if (isOrderAssignedToThisPillar || isTradeMatch) {
              existingIds.add(notifId);
              items.unshift({
                id: notifId,
                title: `New Booking Request: ${ord.service_name || 'Home Service'}`,
                message: `New booking #${ord.booking_code || ord.id} from ${ord.customer_name || 'Customer'} at ${ord.service_address || 'Chennai'}. Amount: ₹${ord.total_amount || 450}`,
                created_at: ord.created_at ? new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Just now',
                is_read: readIds.has(notifId) || dismissedIds.has(notifId),
                type: 'booking_new',
                order_id: ord.id
              });
            }
          });
        } catch (loErr) {}
      }

      if (items.length === 0) {
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
