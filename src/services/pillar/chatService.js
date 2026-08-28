import { supabase } from "../../lib/supabase";

export const pillarChatService = {
  // Fetch active conversations/orders for a pillar
  async getActiveConversations(pillarId) {
    try {
      const { data: bookings, error } = await supabase
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

      if (error) throw error;
      return { data: bookings || [], error: null };
    } catch (error) {
      console.error("Fetch conversations error:", error);
      return { data: [], error };
    }
  },

  // Fetch messages for a specific booking / request
  async getMessages(bookingId) {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .or(`request_id.eq.${bookingId},booking_id.eq.${bookingId}`)
        .order("created_at", { ascending: true });

      if (error) {
        // Fallback simple query
        const { data: fallbackData } = await supabase
          .from("messages")
          .select("*")
          .eq("request_id", bookingId)
          .order("created_at", { ascending: true });
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
        request_id: bookingId,
        sender_id: senderId,
        sender_type: senderType,
        content: messageText
      };

      const { data, error } = await supabase
        .from("messages")
        .insert([payload])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Send message error:", error);
      return { data: null, error };
    }
  },

  // Subscribe to live messages for a specific booking / request
  subscribeToChat(bookingId, callback) {
    const channel = supabase
      .channel(`chat-${bookingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `request_id=eq.${bookingId}` },
        (payload) => {
          if (callback) callback(payload.new);
        }
      )
      .subscribe();

    return channel;
  }
};

export default pillarChatService;
