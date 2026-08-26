import { supabase } from "../../lib/supabase";

export const pillarChatService = {
  // Fetch messages for a specific booking
  async getMessages(bookingId) {
    try {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .eq("booking_id", bookingId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (error) {
      console.error("Chat fetch error:", error);
      return { data: [], error };
    }
  },

  // Send a message
  async sendMessage(bookingId, senderId, senderType, messageText) {
    try {
      const { data, error } = await supabase
        .from("messages")
        .insert([
          {
            booking_id: bookingId,
            sender_id: senderId,
            sender_type: senderType,
            message: messageText,
            read: false,
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Send message error:", error);
      return { data: null, error };
    }
  },

  // Subscribe to live messages for a specific booking
  subscribeToChat(bookingId, callback) {
    const channel = supabase
      .channel(`chat-${bookingId}`)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages', filter: `booking_id=eq.${bookingId}` },
        (payload) => {
          if (callback) callback(payload.new);
        }
      )
      .subscribe();

    return channel;
  }
};
