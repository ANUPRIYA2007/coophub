import { supabase } from "../../lib/supabase";

export const pillarChatService = {
  // Fetch active conversations/orders for a pillar
  async getActiveConversations(pillarId) {
    try {
      // 1. Check bookings table
      const { data: bookings } = await supabase
        .from("bookings")
        .select(`
          id,
          booking_code,
          service_name,
          customer_name,
          customer_mobile,
          status,
          created_at
        `)
        .eq("pillar_id", pillarId)
        .order("created_at", { ascending: false });

      if (bookings && bookings.length > 0) {
        return { data: bookings, error: null };
      }

      // 2. Check service_requests table as fallback
      const { data: serviceReqs } = await supabase
        .from("service_requests")
        .select(`
          id,
          status,
          created_at,
          address_line,
          area,
          city
        `)
        .eq("pillar_id", pillarId)
        .order("created_at", { ascending: false });

      if (serviceReqs && serviceReqs.length > 0) {
        const mapped = serviceReqs.map(r => ({
          id: r.id,
          booking_code: "REQ-" + r.id.substring(0, 6).toUpperCase(),
          service_name: "On-Demand Service",
          customer_name: "Verified Customer",
          customer_mobile: "+91 98400 00000",
          status: r.status || "in_progress",
          created_at: r.created_at
        }));
        return { data: mapped, error: null };
      }

      return { data: [], error: null };
    } catch (error) {
      console.error("Fetch conversations error:", error);
      return { data: [], error };
    }
  },

  // Fetch messages for a specific booking / request
  async getMessages(bookingId) {
    try {
      let query = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      if (bookingId) {
        query = query.or(`booking_id.eq.${bookingId},request_id.eq.${bookingId}`);
      }

      const { data, error } = await query;

      if (error) throw error;
      return { data: (data || []).map(m => ({ ...m, content: m.content || m.message })), error: null };
    } catch (error) {
      console.error("Chat fetch error:", error);
      return { data: [], error };
    }
  },

  // Send a message
  async sendMessage(bookingId, senderId, senderType, messageText) {
    try {
      const payload = {
        booking_id: bookingId && bookingId.length === 36 ? bookingId : null,
        request_id: bookingId && bookingId.length === 36 ? bookingId : null,
        sender_type: senderType || 'pillar',
        content: messageText,
        message: messageText
      };

      if (senderId && typeof senderId === 'string' && senderId.length === 36) {
        payload.sender_id = senderId;
      }

      const { data, error } = await supabase
        .from("messages")
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.warn("Retrying sendMessage with minimal payload:", error.message);
        const { data: fallbackData, error: fbError } = await supabase
          .from("messages")
          .insert([{
            booking_id: bookingId,
            request_id: bookingId,
            sender_type: senderType,
            content: messageText,
            message: messageText
          }])
          .select()
          .single();
        if (fbError) throw fbError;
        return { data: fallbackData, error: null };
      }
      return { data, error: null };
    } catch (error) {
      console.error("Send message error:", error);
      return { data: null, error };
    }
  },

  // Subscribe to live messages for a specific booking / request
  subscribeToChat(bookingId, callback) {
    const channel = supabase
      .channel(`chat-realtime-${bookingId || 'global'}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (!payload.new) return;
          const msg = payload.new;
          if (!bookingId || msg.booking_id === bookingId || msg.request_id === bookingId) {
            if (callback) callback({ ...msg, content: msg.content || msg.message });
          }
        }
      )
      .subscribe();

    return channel;
  }
};

export default pillarChatService;

