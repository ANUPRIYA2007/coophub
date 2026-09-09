/**
 * COOP HUB — Smart Customer ↔ Pillar Communication + Job Collaboration Service
 * 
 * Production service managing real-time chat, read receipts, system events,
 * parts/extra charge collaboration, customer issue reporting, and Supabase Realtime.
 * 
 * CORE PRINCIPLE:
 * Real messages persisted in PostgreSQL. Realtime delivery via Supabase Realtime.
 * Zero fabricated chat fixtures, zero fake unread counters.
 */

import { supabase } from '../../lib/supabase';
import { notificationService } from '../notifications/notificationService';

export const jobCommunicationService = {
  /**
   * Fetch conversation messages for a request / booking
   */
  async getMessages(requestId, { limit = 50, offset = 0 } = {}) {
    if (!requestId) return { data: [], error: null };

    try {
      const { data, error } = await supabase
        .from('messages')
        .select('*')
        .or(`request_id.eq.${requestId},booking_id.eq.${requestId}`)
        .order('created_at', { ascending: true })
        .range(offset, offset + limit - 1);

      if (error) throw error;

      const formatted = (data || []).map(m => ({
        id: m.id,
        request_id: m.request_id || m.booking_id,
        booking_id: m.booking_id || m.request_id,
        sender_id: m.sender_id,
        sender_type: m.sender_type || 'customer',
        content: m.content || m.message || '',
        message_type: m.message_type || 'TEXT',
        metadata: m.metadata || {},
        is_read: m.read || m.is_read || false,
        read_at: m.read_at,
        created_at: m.created_at
      }));

      return { data: formatted, error: null };
    } catch (err) {
      console.error("Fetch messages error:", err);
      return { data: [], error: err.message };
    }
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
    metadata = {}
  }) {
    const cleanContent = (content || '').trim();
    if (!cleanContent) {
      return { data: null, error: 'Message content cannot be empty.' };
    }
    if (cleanContent.length > 1000) {
      return { data: null, error: 'Message exceeds maximum allowable length of 1,000 characters.' };
    }

    try {
      const payload = {
        request_id: requestId,
        booking_id: null,
        sender_type: senderType,
        content: cleanContent,
        message: cleanContent,
        message_type: messageType,
        metadata: metadata || {},
        read: false,
        is_read: false,
        created_at: new Date().toISOString()
      };

      if (senderId && typeof senderId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(senderId)) {
        payload.sender_id = senderId;
      }

      const { data, error } = await supabase
        .from('messages')
        .insert([payload])
        .select()
        .single();

      if (error) throw error;

      // Trigger realtime notification to counterparty
      try {
        const targetRole = senderType === 'customer' ? 'pillar' : 'customer';
        await notificationService.notifyUser(requestId, {
          type: 'new_chat_message',
          title: `💬 New Message from ${senderType === 'customer' ? 'Customer' : 'Technician'}`,
          message: cleanContent.length > 60 ? cleanContent.slice(0, 57) + '...' : cleanContent,
          data: { request_id: requestId, sender_type: senderType }
        });
      } catch (ne) {}

      return { data, error: null };
    } catch (err) {
      console.error("Send message error:", err);
      return { data: null, error: err.message };
    }
  },

  /**
   * Mark all unread messages from counterparty as READ
   */
  async markAsRead(requestId, readerType) {
    if (!requestId) return;
    try {
      const nowIso = new Date().toISOString();
      await supabase
        .from('messages')
        .update({
          read: true,
          is_read: true,
          read_at: nowIso
        })
        .or(`request_id.eq.${requestId},booking_id.eq.${requestId}`)
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

    try {
      // 1. Check for existing event of this type to prevent duplicate spam
      const { data: existing } = await supabase
        .from('messages')
        .select('id')
        .or(`request_id.eq.${requestId},booking_id.eq.${requestId}`)
        .eq('message_type', 'SYSTEM')
        .contains('metadata', { event_type: eventType })
        .limit(1);

      if (existing && existing.length > 0) {
        return; // Already emitted
      }

      const payload = {
        request_id: requestId,
        booking_id: null,
        sender_type: 'system',
        content: text,
        message: text,
        message_type: 'SYSTEM',
        metadata: { event_type: eventType, ...metadata },
        read: true,
        is_read: true,
        created_at: new Date().toISOString()
      };

      await supabase.from('messages').insert([payload]);
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

    try {
      // 1. Update service_requests with extra charge request
      await supabase
        .from('service_requests')
        .update({
          extra_charge_amount: numAmount,
          extra_charge_reason: `${description} - ${reason}`,
          extra_charge_status: 'pending',
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

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

  /**
   * Customer approves or rejects parts / extra charge
   */
  async respondToExtraCharge({ requestId, customerId, action }) {
    const isApproved = action === 'APPROVE';
    const newStatus = isApproved ? 'accepted' : 'rejected';

    try {
      // 1. Fetch current request to compute revised billing
      const { data: req } = await supabase
        .from('service_requests')
        .select('amount, extra_charge_amount')
        .eq('id', requestId)
        .single();

      const baseAmount = Number(req?.amount || 450);
      const extraAmount = Number(req?.extra_charge_amount || 0);
      const finalAmount = isApproved ? (baseAmount + extraAmount) : baseAmount;

      await supabase
        .from('service_requests')
        .update({
          extra_charge_status: newStatus,
          final_amount: finalAmount,
          updated_at: new Date().toISOString()
        })
        .eq('id', requestId);

      // 2. Insert confirmation system message
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
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Customer reports an issue / dispute during service
   */
  async reportCustomerIssue({ requestId, customerId, category, description }) {
    try {
      // 1. Insert into support_tickets table
      const { data: ticket, error } = await supabase
        .from('support_tickets')
        .insert([{
          request_id: requestId,
          customer_id: customerId,
          subject: `Customer Dispute: ${category} on Order #${requestId.slice(0, 8)}`,
          issue_type: category,
          category: category,
          description: description,
          priority: 'high',
          status: 'open',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // 2. Post ISSUE_REPORT system notice into conversation
      await this.sendMessage({
        requestId,
        senderId: customerId,
        senderType: 'customer',
        content: `⚠️ [Customer Issue Reported] Issue filed under "${category}": ${description}. Customer Support alerted.`,
        messageType: 'ISSUE_REPORT',
        metadata: { ticket_id: ticket?.id, category }
      });

      return { success: true, ticketId: ticket?.id };
    } catch (err) {
      return { success: false, error: err.message };
    }
  },

  /**
   * Calculate exact count of unread messages for a role
   */
  async getUnreadCount(requestId, userRole) {
    if (!requestId) return 0;
    try {
      const { count, error } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .or(`request_id.eq.${requestId},booking_id.eq.${requestId}`)
        .neq('sender_type', userRole)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (err) {
      return 0;
    }
  },

  /**
   * Subscribe to live messages for a specific request
   */
  subscribeToConversation(requestId, callback) {
    return subscribeToMessages(requestId, callback);
  },

  /**
   * Subscribe to live messages with granular onInsert, onUpdate, onError callbacks
   */
  subscribeToMessages(requestId, callbacks) {
    return subscribeToMessages(requestId, callbacks);
  }
};

/**
 * Standalone export: Subscribe to live messages for a specific request
 * @param {string} requestId - Order/Request UUID or Code
 * @param {Object|Function} callbacks - { onInsert, onUpdate, onError } or a single callback
 * @returns {Function} cleanup - Clean unsubscribe function for useEffect
 */
export function subscribeToMessages(requestId, callbacks = {}) {
  if (!requestId) return () => {};

  const onInsertCb = typeof callbacks === 'function' ? callbacks : callbacks?.onInsert;
  const onUpdateCb = typeof callbacks === 'object' ? callbacks?.onUpdate : null;
  const onErrorCb = typeof callbacks === 'object' ? callbacks?.onError : null;

  const channelName = `conversation-${requestId}-${Date.now()}`;
  
  const channel = supabase
    .channel(channelName)
    .on(
      'postgres_changes',
      { event: 'INSERT', schema: 'public', table: 'messages' },
      (payload) => {
        if (!payload.new) return;
        const msg = payload.new;
        if (msg.request_id === requestId || msg.booking_id === requestId) {
          console.log('[Realtime] New message for request', requestId, payload);
          const formatted = {
            id: msg.id,
            request_id: msg.request_id || requestId,
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
            created_at: msg.created_at
          };
          if (onInsertCb) onInsertCb(formatted);
        }
      }
    )
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'messages' },
      (payload) => {
        if (!payload.new) return;
        const msg = payload.new;
        if (msg.request_id === requestId || msg.booking_id === requestId) {
          console.log('[Realtime] Message update for request', requestId, payload);
          const formatted = {
            id: msg.id,
            request_id: msg.request_id || requestId,
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
            created_at: msg.created_at
          };
          if (onUpdateCb) onUpdateCb(formatted);
          else if (onInsertCb) onInsertCb(formatted);
        }
      }
    )
    .subscribe((status, err) => {
      if (status === 'SUBSCRIBED') {
        console.log(`[Realtime] Connected to conversation channel: ${channelName}`);
      } else if (status === 'CHANNEL_ERROR' || status === 'TIMED_OUT') {
        console.error(`[Realtime] Subscription error on conversation ${requestId}:`, err);
        if (onErrorCb) onErrorCb(err);
      }
    });

  // Return a cleanup function that safely calls removeChannel
  const cleanup = () => {
    try {
      console.log(`[Realtime] Tearing down conversation channel: ${channelName}`);
      supabase.removeChannel(channel);
    } catch (e) {
      console.warn('Channel teardown note:', e);
    }
  };
  cleanup.channel = channel;
  cleanup.unsubscribe = cleanup;
  return cleanup;
}

export default jobCommunicationService;
