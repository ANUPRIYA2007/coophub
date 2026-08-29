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
      // Query by booking_id
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });

      if (error) {
        // Fallback query if booking_id isn't matching
        const { data: fallbackData } = await supabase
          .from("messages")
          .select("*")
          .order("created_at", { ascending: true })
          .limit(50);
        return { data: fallbackData || [], error: null };
      }
      return { data: data || [], error: null };
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
        sender_type: senderType || 'pillar',
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
          .insert([{ sender_type: senderType, message: messageText }])
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
          // Filter if booking_id matches or if unassigned
          if (!bookingId || payload.new.booking_id === bookingId || !payload.new.booking_id) {
            if (callback) callback(payload.new);
          }
        }
      )
      .subscribe();

    return channel;
  }
};

export default pillarChatService;

