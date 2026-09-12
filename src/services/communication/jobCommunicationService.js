/**
 * COOP HUB — Smart Customer ↔ Pillar Communication + Job Collaboration Service
 * 
 * Production service managing real-time chat, read receipts, system events,
 * parts/extra charge collaboration, customer issue reporting, and Supabase Realtime.
 * 
 * CORE PRINCIPLE:
 * Real messages persisted in PostgreSQL. Realtime delivery via Supabase Realtime + BroadcastChannel.
 * Full support for both live UUIDs and deterministic demo order identifiers.
 */

import { supabase } from '../../lib/supabase';
import { notificationService } from '../notifications/notificationService';

const UUID_CACHE = new Map();

/**
 * Register a known mapping between human booking code (e.g. REQ-9481) and database UUID
 */
export function registerOrderUuid(orderCode, uuid) {
  if (!orderCode || !uuid) return;
  const c = String(orderCode).trim();
  const u = String(uuid).trim();
  UUID_CACHE.set(c, u);
  UUID_CACHE.set(u, u);
}

/**
 * Deterministically produce an RFC4122 v4 UUID from any arbitrary string
 */
export function deterministicUuid(str) {
  if (!str) return '00000000-0000-4000-8000-000000000000';
  let hash1 = 0, hash2 = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash1 = ((hash1 << 5) - hash1) + char;
    hash1 |= 0;
    hash2 = ((hash2 << 7) + hash2) ^ char;
    hash2 |= 0;
  }
  const h1 = Math.abs(hash1).toString(16).padStart(8, '0');
  const h2 = Math.abs(hash2).toString(16).padStart(8, '0');
  const combined = (h1 + h2 + h1 + h2).padEnd(32, '0').slice(0, 32);
  return `${combined.slice(0, 8)}-${combined.slice(8, 12)}-4${combined.slice(13, 16)}-8${combined.slice(17, 20)}-${combined.slice(20, 32)}`;
}

function findUuidInLocalStorage(str) {
  try {
    if (typeof window === 'undefined' || !window.localStorage) return null;
    const keys = [
      'coophub_shared_live_orders',
      'coophub_demo_customer_created_requests',
      'coophub_recent_bookings',
      'coophub_customer_requests'
    ];
    for (const key of keys) {
      const raw = localStorage.getItem(key);
      if (!raw) continue;
      const list = JSON.parse(raw);
      if (Array.isArray(list)) {
        for (const item of list) {
          if (!item) continue;
          const matches = item.id === str || 
                          item.order_id === str || 
                          item.booking_code === str || 
                          item.receipt_number === str ||
                          item.payment_gateway_ref === str ||
                          item.db_id === str ||
                          item.request_id === str;
          if (matches) {
            const candidate = item.db_id || item.id || item.request_id;
            if (candidate && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(candidate)) {
              return candidate;
            }
          }
        }
      }
    }
  } catch (e) {}
  return null;
}

/**
 * Resolves all known aliases (human order code, DB UUID, deterministic UUID) for an order
 */
export function resolveAllOrderAliases(orderOrId) {
  const aliases = new Set();
  if (!orderOrId) return [];

  let strId = '';
  if (typeof orderOrId === 'string') {
    strId = orderOrId.trim();
    aliases.add(strId);
  } else if (typeof orderOrId === 'object') {
    if (orderOrId.id) aliases.add(String(orderOrId.id).trim());
    if (orderOrId.request_id) aliases.add(String(orderOrId.request_id).trim());
    if (orderOrId.order_id) aliases.add(String(orderOrId.order_id).trim());
    if (orderOrId.booking_code) aliases.add(String(orderOrId.booking_code).trim());
    if (orderOrId.receipt_number) aliases.add(String(orderOrId.receipt_number).trim());
    if (orderOrId.payment_gateway_ref) aliases.add(String(orderOrId.payment_gateway_ref).trim());
    if (orderOrId.db_id) aliases.add(String(orderOrId.db_id).trim());
    strId = orderOrId.id || orderOrId.booking_code || orderOrId.order_id || '';
  }

  // Check UUID_CACHE for each alias
  Array.from(aliases).forEach(a => {
    if (UUID_CACHE.has(a)) {
      aliases.add(UUID_CACHE.get(a));
    }
  });

  // Check local storage records
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const keys = [
        'coophub_shared_live_orders',
        'coophub_demo_customer_created_requests',
        'coophub_recent_bookings',
        'coophub_customer_requests'
      ];
      for (const key of keys) {
        const raw = localStorage.getItem(key);
        if (!raw) continue;
        const list = JSON.parse(raw);
        if (Array.isArray(list)) {
          for (const item of list) {
            if (!item) continue;
            const itemMatches = Array.from(aliases).some(a => 
              item.id === a || 
              item.order_id === a || 
              item.booking_code === a || 
              item.receipt_number === a ||
              item.payment_gateway_ref === a ||
              item.db_id === a ||
              item.request_id === a
            );
            if (itemMatches) {
              if (item.id) aliases.add(String(item.id).trim());
              if (item.order_id) aliases.add(String(item.order_id).trim());
              if (item.booking_code) aliases.add(String(item.booking_code).trim());
              if (item.receipt_number) aliases.add(String(item.receipt_number).trim());
              if (item.payment_gateway_ref) aliases.add(String(item.payment_gateway_ref).trim());
              if (item.db_id) aliases.add(String(item.db_id).trim());
              if (item.request_id) aliases.add(String(item.request_id).trim());
            }
          }
        }
      }
    }
  } catch (e) {}

  // Add deterministic UUID for any human code (e.g. REQ-9843)
  Array.from(aliases).forEach(a => {
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a)) {
      aliases.add(deterministicUuid(a));
    }
  });

  return Array.from(aliases).filter(Boolean);
}

/**
 * Resolves any order / request identifier to a valid PostgreSQL UUID dynamically.
 */
export async function resolveRequestUuidAsync(reqId) {
  if (!reqId) return null;
  const str = String(reqId).trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    UUID_CACHE.set(str, str);
    return str;
  }
  if (UUID_CACHE.has(str)) return UUID_CACHE.get(str);

  // Check local storage records
  const localUuid = findUuidInLocalStorage(str);
  if (localUuid) {
    UUID_CACHE.set(str, localUuid);
    UUID_CACHE.set(localUuid, localUuid);
    return localUuid;
  }

  // Query live Supabase service_requests
  try {
    const { data } = await supabase
      .from('service_requests')
      .select('id')
      .or(`receipt_number.eq.${str},payment_gateway_ref.eq.${str},customer_description.ilike.%${str}%`)
      .limit(1)
      .maybeSingle();
    if (data?.id) {
      UUID_CACHE.set(str, data.id);
      UUID_CACHE.set(data.id, data.id);
      return data.id;
    }
  } catch (e) {}

  // Fallback to deterministic UUID (so both sender and receiver match the same UUID)
  const fallback = deterministicUuid(str);
  UUID_CACHE.set(str, fallback);
  return fallback;
}

/**
 * Synchronous resolver fallback
 */
export function resolveRequestUuid(reqId) {
  if (!reqId) return null;
  const str = String(reqId).trim();
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str)) {
    return str;
  }
  if (UUID_CACHE.has(str)) return UUID_CACHE.get(str);
  const localUuid = findUuidInLocalStorage(str);
  if (localUuid) {
    UUID_CACHE.set(str, localUuid);
    return localUuid;
  }
  const fallback = deterministicUuid(str);
  UUID_CACHE.set(str, fallback);
  return fallback;
}

export const jobCommunicationService = {
  /**
   * Fetch conversation messages for a request / booking
   */
  async getMessages(orderOrId, { limit = 50, offset = 0, order = null } = {}) {
    if (!orderOrId) return { data: [], error: null };

    const allAliases = resolveAllOrderAliases(order || orderOrId);
    let targetUuid = allAliases.find(a => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a));
    if (!targetUuid) {
      targetUuid = await resolveRequestUuidAsync(typeof orderOrId === 'string' ? orderOrId : (orderOrId.id || orderOrId.booking_code));
      if (targetUuid && !allAliases.includes(targetUuid)) allAliases.push(targetUuid);
    }

    let dbMessages = [];

    // 1. Fetch from Supabase PostgreSQL
    try {
      const validUuids = allAliases.filter(a => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a));
      const humanCodes = allAliases.filter(a => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a));
      
      const orClauses = [];
      if (validUuids.length > 0) {
        orClauses.push(`request_id.in.(${validUuids.join(',')})`);
      }
      humanCodes.forEach(code => {
        orClauses.push(`metadata->>order_code.eq.${code}`);
        orClauses.push(`metadata->>original_request_id.eq.${code}`);
      });

      if (orClauses.length > 0) {
        const { data, error } = await supabase
          .from('messages')
          .select('*')
          .or(orClauses.join(','))
          .order('created_at', { ascending: true })
          .range(offset, offset + limit - 1);

        if (!error && data) {
          dbMessages = data;
        }
      }
    } catch (err) {
      console.warn("Supabase fetch messages note:", err?.message);
    }

    // 2. Read from localStorage fallback cache across all aliases
    let localMessages = [];
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const keysToRead = new Set(allAliases.map(a => `coophub_messages_${a}`));

        keysToRead.forEach(k => {
          try {
            const raw = localStorage.getItem(k);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (Array.isArray(parsed)) {
                localMessages.push(...parsed);
              }
            }
          } catch(e) {}
        });
      }
    } catch (e) {}

    // 3. Deduplicate and merge
    const map = new Map();
    [...localMessages, ...dbMessages].forEach(m => {
      if (m && (m.id || m.content || m.message)) {
        const key = m.id || `${m.sender_type}-${m.created_at}-${m.content || m.message}`;
        map.set(key, {
          id: m.id || key,
          request_id: m.request_id || targetUuid || allAliases[0],
          booking_id: m.booking_id || allAliases[0],
          sender_id: m.sender_id,
          sender_type: m.sender_type || 'customer',
          content: m.content || m.message || '',
          message: m.content || m.message || '',
          text: m.content || m.message || '',
          message_type: m.message_type || 'TEXT',
          metadata: m.metadata || {},
          is_read: m.read || m.is_read || false,
          read_at: m.read_at,
          created_at: m.created_at || new Date().toISOString()
        });
      }
    });

    const combined = Array.from(map.values()).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

    return { data: combined, error: null };
  },

  /**
   * Send a message in a conversation
   */
  async sendMessage({
    requestId,
    senderId,
    senderType = 'customer',
    content = '',
    messageType = 'TEXT',
    metadata = {},
    order = null
  }) {
    const cleanContent = (content || '').trim();
    if (!cleanContent) {
      return { data: null, error: 'Message content cannot be empty.' };
    }
    if (cleanContent.length > 1000) {
      return { data: null, error: 'Message exceeds maximum allowable length of 1,000 characters.' };
    }

    const allAliases = resolveAllOrderAliases(order || requestId);
    let targetUuid = allAliases.find(a => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a));
    if (!targetUuid) {
      targetUuid = await resolveRequestUuidAsync(typeof requestId === 'string' ? requestId : (order?.id || order?.booking_code));
      if (targetUuid && !allAliases.includes(targetUuid)) allAliases.push(targetUuid);
    }
    const humanCode = allAliases.find(a => !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a)) || requestId;

    const nowIso = new Date().toISOString();
    const tempId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substring(2, 8);

    const payload = {
      request_id: targetUuid,
      booking_id: null,
      sender_type: senderType,
      content: cleanContent,
      message: cleanContent,
      message_type: messageType,
      metadata: { 
        ...metadata, 
        original_request_id: requestId,
        order_code: humanCode,
        aliases: allAliases
      },
      read: false,
      is_read: false,
      created_at: nowIso
    };

    if (senderId && typeof senderId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(senderId)) {
      payload.sender_id = senderId;
    }

    let createdMsg = {
      id: tempId,
      ...payload
    };

    // 1. Insert into Supabase with automatic retry on foreign key / schema violation
    try {
      if (targetUuid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUuid)) {
        let { data, error } = await supabase
          .from('messages')
          .insert([payload])
          .select()
          .single();

        // If foreign key constraint on sender_id fails, retry without sender_id
        if (error && (error.code === '23503' || String(error.message || '').includes('sender_id'))) {
          const retryPayload = { ...payload, sender_id: null };
          retryPayload.metadata = { ...retryPayload.metadata, sender_id: senderId };
          const resRetry = await supabase
            .from('messages')
            .insert([retryPayload])
            .select()
            .single();
          data = resRetry.data;
          error = resRetry.error;
        }

        if (!error && data) {
          createdMsg = {
            ...data,
            content: data.content || cleanContent,
            message: data.message || cleanContent
          };
        } else if (error) {
          console.warn("Supabase send message error:", error);
        }
      }
    } catch (err) {
      console.warn("Supabase send message exception:", err);
    }

    // 2. Persist to localStorage cache across ALL known aliases
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const cacheKeys = new Set(allAliases.map(a => `coophub_messages_${a}`));
        cacheKeys.add(`coophub_messages_${requestId}`);
        if (targetUuid) cacheKeys.add(`coophub_messages_${targetUuid}`);

        cacheKeys.forEach(key => {
          try {
            const list = JSON.parse(localStorage.getItem(key) || '[]');
            if (!list.some(m => m.id === createdMsg.id)) {
              list.push(createdMsg);
              localStorage.setItem(key, JSON.stringify(list));
            }
          } catch(e) {}
        });
      }
    } catch (e) {}

    // 3. Multi-channel broadcast (BroadcastChannel + Window Events)
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('coophub_chat_sync');
        bc.postMessage({
          type: 'NEW_CHAT_MESSAGE',
          requestId,
          targetUuid,
          aliases: allAliases,
          message: createdMsg,
          timestamp: Date.now()
        });
        setTimeout(() => { try { bc.close(); } catch(e){} }, 500);
      }
    } catch (bcErr) {}

    try {
      window.dispatchEvent(new CustomEvent('coophub_new_chat_message', {
        detail: { requestId, targetUuid, aliases: allAliases, message: createdMsg }
      }));
    } catch (we) {}

    // 4. Trigger push notification to counterparty
    try {
      const targetRole = senderType === 'customer' ? 'pillar' : 'customer';
      notificationService.notifyUser(requestId, {
        type: 'new_chat_message',
        title: `💬 New Message from ${senderType === 'customer' ? 'Customer' : 'Technician'}`,
        message: cleanContent.length > 60 ? cleanContent.slice(0, 57) + '...' : cleanContent,
        data: { request_id: requestId, targetUuid, sender_type: senderType }
      });
    } catch (ne) {}

    return { data: createdMsg, error: null };
  },

  /**
   * Mark all unread messages from counterparty as READ
   */
  async markAsRead(requestId, readerType) {
    if (!requestId) return;
    const targetUuid = await resolveRequestUuidAsync(requestId);
    if (!targetUuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUuid)) return;
    try {
      const nowIso = new Date().toISOString();
      await supabase
        .from('messages')
        .update({
          read: true,
          is_read: true,
          read_at: nowIso
        })
        .eq('request_id', targetUuid)
        .neq('sender_type', readerType)
        .eq('read', false);
    } catch (err) {
      console.warn("markAsRead note:", err);
    }
  },

  /**
   * Emit a smart system message during lifecycle state transitions (deduplicated)
   */
  async emitSystemEvent(requestId, { eventType, text, metadata = {} }) {
    if (!requestId || !eventType) return;
    const targetUuid = await resolveRequestUuidAsync(requestId);
    if (!targetUuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUuid)) return;

    try {
      const { data: existing } = await supabase
        .from('messages')
        .select('id')
        .eq('request_id', targetUuid)
        .eq('message_type', 'SYSTEM')
        .contains('metadata', { event_type: eventType })
        .limit(1);

      if (existing && existing.length > 0) {
        return; // Already emitted
      }

      await this.sendMessage({
        requestId,
        senderType: 'system',
        content: text,
        messageType: 'SYSTEM',
        metadata: { event_type: eventType, ...metadata }
      });
    } catch (err) {
      console.warn("emitSystemEvent note:", err);
    }
  },

  /**
   * Pillar requests parts or extra charges within the conversation
   */
  async requestPartsOrExtraCharge({ requestId, pillarId, description, amount, reason }) {
    const numAmount = Number(amount);
    if (!numAmount || numAmount <= 0) {
      return { success: false, error: 'Extra charge amount must be a positive number.' };
    }

    const targetUuid = await resolveRequestUuidAsync(requestId);

    try {
      // 1. Update service_requests with extra charge request
      if (targetUuid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUuid)) {
        await supabase
          .from('service_requests')
          .update({
            extra_charge_amount: numAmount,
            extra_charge_reason: `${description} - ${reason}`,
            extra_charge_status: 'pending',
            updated_at: new Date().toISOString()
          })
          .eq('id', targetUuid);
      }

      // 2. Insert structured PARTS_REQUEST message
      const msgRes = await this.sendMessage({
        requestId,
        senderId: pillarId,
        senderType: 'pillar',
        content: `📦 [Parts / Extra Charge Request] Technician requested ₹${numAmount} for: "${description}". Reason: ${reason}`,
        messageType: 'PARTS_REQUEST',
        metadata: {
          amount: numAmount,
          description,
          reason,
          status: 'pending'
        }
      });

      return { success: true, message: msgRes.data };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  async requestExtraCharges(args) {
    return this.requestPartsOrExtraCharge(args);
  },

  /**
   * Customer approves or rejects parts / extra charge
   */
  async respondToExtraCharge({ requestId, customerId, action }) {
    const isApproved = action === 'APPROVE';
    const newStatus = isApproved ? 'accepted' : 'rejected';
    const targetUuid = await resolveRequestUuidAsync(requestId);

    try {
      let baseAmount = 450;
      let extraAmount = 0;

      if (targetUuid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUuid)) {
        const { data: req } = await supabase
          .from('service_requests')
          .select('amount, extra_charge_amount')
          .eq('id', targetUuid)
          .maybeSingle();

        baseAmount = Number(req?.amount || 450);
        extraAmount = Number(req?.extra_charge_amount || 0);
        const finalAmount = isApproved ? (baseAmount + extraAmount) : baseAmount;

        await supabase
          .from('service_requests')
          .update({
            extra_charge_status: newStatus,
            final_amount: finalAmount,
            updated_at: new Date().toISOString()
          })
          .eq('id', targetUuid);

        const text = isApproved
          ? `✓ [Additional Charge Approved] Customer approved extra charge of ₹${extraAmount}. Revised total: ₹${finalAmount}.`
          : `✕ [Additional Charge Rejected] Customer declined the extra charge request.`;

        await this.sendMessage({
          requestId,
          senderId: customerId,
          senderType: 'customer',
          content: text,
          messageType: 'PRICE_CHANGE',
          metadata: { action, extra_amount: extraAmount, final_amount: finalAmount }
        });

        return { success: true, status: newStatus, finalAmount };
      }

      return { success: true, status: newStatus, finalAmount: baseAmount };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Customer reports an issue / dispute during service
   */
  async reportCustomerIssue({ requestId, customerId, category, description }) {
    const targetUuid = await resolveRequestUuidAsync(requestId);

    try {
      let ticketId = null;
      if (targetUuid && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUuid)) {
        const { data: ticket } = await supabase
          .from('support_tickets')
          .insert([{
            request_id: targetUuid,
            customer_id: customerId && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(customerId) ? customerId : null,
            subject: `Customer Dispute: ${category} on Order #${String(requestId).slice(0, 8)}`,
            issue_type: category,
            category: category,
            description: description,
            priority: 'high',
            status: 'open',
            created_at: new Date().toISOString()
          }])
          .select()
          .maybeSingle();

        ticketId = ticket?.id;
      }

      await this.sendMessage({
        requestId,
        senderId: customerId,
        senderType: 'customer',
        content: `⚠️ [Customer Issue Reported] Issue filed under "${category}": ${description}. Customer Support alerted.`,
        messageType: 'ISSUE_REPORT',
        metadata: { ticket_id: ticketId, category }
      });

      return { success: true, ticketId };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Calculate exact count of unread messages for a role
   */
  async getUnreadCount(requestId, userRole) {
    if (!requestId) return 0;
    const targetUuid = await resolveRequestUuidAsync(requestId);
    if (!targetUuid || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(targetUuid)) return 0;
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('request_id', targetUuid)
        .neq('sender_type', userRole)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (err) {
      return 0;
    }
  },

  subscribeToConversation(orderOrId, callback, options = {}) {
    return subscribeToMessages(orderOrId, callback, options);
  },

  subscribeToMessages(orderOrId, callbacks, options = {}) {
    return subscribeToMessages(orderOrId, callbacks, options);
  }
};

/**
 * Standalone export: Subscribe to live messages for a specific request across
 * Supabase Realtime, BroadcastChannel, Window Storage events, and Window Events.
 */
export function subscribeToMessages(orderOrId, callbacks = {}, options = {}) {
  if (!orderOrId) return () => {};

  const onInsertCb = typeof callbacks === 'function' ? callbacks : callbacks?.onInsert;
  const onUpdateCb = typeof callbacks === 'object' ? callbacks?.onUpdate : null;
  const onErrorCb = typeof callbacks === 'object' ? callbacks?.onError : null;

  const order = options?.order || (typeof orderOrId === 'object' ? orderOrId : null);
  const myAliases = resolveAllOrderAliases(order || orderOrId);
  const requestId = typeof orderOrId === 'string' ? orderOrId : (order?.id || order?.booking_code || myAliases[0]);

  let currentTargetUuid = myAliases.find(a => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(a)) || resolveRequestUuid(requestId);

  resolveRequestUuidAsync(requestId).then(asyncUuid => {
    if (asyncUuid && !myAliases.includes(asyncUuid)) {
      myAliases.push(asyncUuid);
      currentTargetUuid = asyncUuid;
    }
  }).catch(() => {});

  const channelName = `coophub_chat_${String(requestId).replace(/[^a-zA-Z0-9]/g, '_')}_${Date.now()}`;

  const formatMsg = (msg) => ({
    id: msg.id,
    request_id: msg.request_id || currentTargetUuid || requestId,
    booking_id: msg.booking_id || requestId,
    sender_id: msg.sender_id,
    sender_type: msg.sender_type || 'customer',
    content: msg.content || msg.message || '',
    message: msg.content || msg.message || '',
    text: msg.content || msg.message || '',
    message_type: msg.message_type || 'TEXT',
    metadata: msg.metadata || {},
    is_read: msg.read || msg.is_read || false,
    read_at: msg.read_at,
    created_at: msg.created_at || new Date().toISOString()
  });

  const isMatchingMessage = (msg, evAliases = []) => {
    if (!msg) return false;
    const incomingAliases = new Set([
      msg.request_id,
      msg.booking_id,
      msg.metadata?.original_request_id,
      msg.metadata?.order_code,
      ...(Array.isArray(evAliases) ? evAliases : []),
      ...(Array.isArray(msg.metadata?.aliases) ? msg.metadata.aliases : [])
    ].filter(Boolean));

    for (const a of myAliases) {
      if (incomingAliases.has(a)) return true;
    }
    return false;
  };

  // 1. Supabase Realtime Subscription
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        if (!payload.new) return;
        const msg = payload.new;
        if (isMatchingMessage(msg)) {
          if (onInsertCb) onInsertCb(formatMsg(msg));
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'messages' },
      (payload) => {
        if (!payload.new) return;
        const msg = payload.new;
        if (isMatchingMessage(msg)) {
          if (onUpdateCb) onUpdateCb(formatMsg(msg));
          else if (onInsertCb) onInsertCb(formatMsg(msg));
        }
      }
    )
    .subscribe((status, err) => {
      if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        if (onErrorCb) onErrorCb(err);
      }
    });

  // 2. BroadcastChannel cross-tab listener
  let bc = null;
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      bc = new BroadcastChannel('coophub_chat_sync');
      bc.onmessage = (event) => {
        const { type, requestId: msgReqId, targetUuid: msgTargetUuid, aliases: evAliases, message } = event.data || {};
        if (type === 'NEW_CHAT_MESSAGE' && message) {
          if (isMatchingMessage(message, evAliases) || (msgReqId && myAliases.includes(msgReqId)) || (msgTargetUuid && myAliases.includes(msgTargetUuid))) {
            if (onInsertCb) onInsertCb(formatMsg(message));
          }
        }
      };
    }
  } catch (e) {}

  // 3. Window Storage event listener (fires across tabs in same browser when localStorage changes)
  const handleStorage = (e) => {
    if (e.key && e.key.startsWith('coophub_messages_')) {
      const keySuffix = e.key.replace('coophub_messages_', '');
      if (myAliases.includes(keySuffix)) {
        try {
          const list = JSON.parse(e.newValue || '[]');
          if (Array.isArray(list) && list.length > 0) {
            const newest = list[list.length - 1];
            if (onInsertCb) onInsertCb(formatMsg(newest));
          }
        } catch(err) {}
      }
    }
  };
  window.addEventListener('storage', handleStorage);

  // 4. Same-window custom event listener
  const handleCustomMessage = (e) => {
    const { requestId: evReqId, targetUuid: evTargetUuid, aliases: evAliases, message } = e.detail || {};
    if (message && (isMatchingMessage(message, evAliases) || (evReqId && myAliases.includes(evReqId)) || (evTargetUuid && myAliases.includes(evTargetUuid)))) {
      if (onInsertCb) onInsertCb(formatMsg(message));
    }
  };
  window.addEventListener('coophub_new_chat_message', handleCustomMessage);

  // Return cleanup function
  const cleanup = () => {
    try {
      supabase.removeChannel(channel);
    } catch (e) {}
    try {
      if (bc) bc.close();
    } catch (e) {}
    window.removeEventListener('storage', handleStorage);
    window.removeEventListener('coophub_new_chat_message', handleCustomMessage);
  };

  cleanup.channel = channel;
  cleanup.unsubscribe = cleanup;
  return cleanup;
}

export default jobCommunicationService;
