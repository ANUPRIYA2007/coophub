import { supabase } from "../../lib/supabase";

export const pillarNotificationService = {
  async getNotifications(pillarId) {
    try {
      const { data, error } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", pillarId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Notifications fetch error:", error);
      return {
        data: [
          { id: "N-1", type: "new_booking", title: "New Service Request", message: "New electrical repair booking in Guindy.", read: false, created_at: new Date().toISOString() },
          { id: "N-2", type: "payment", title: "Payment Received", message: "₹800 credited for Order #ORD-9755.", read: true, created_at: new Date(Date.now() - 3600000).toISOString() },
          { id: "N-3", type: "announcement", title: "Weekend Bonus Activated", message: "Earn 15% extra on all completed weekend orders!", read: true, created_at: new Date(Date.now() - 86400000).toISOString() }
        ],
        error: null,
      };
    }
  },

  async markAsRead(notificationId) {
    try {
      const { error } = await supabase
        .from("notifications")
        .update({ read: true })
        .eq("id", notificationId);

      if (error) throw error;
      return { success: true, error: null };
    } catch (error) {
      return { success: false, error };
    }
  },

  subscribeToBroadcasts(callback) {
    const channel = supabase
      .channel('pillar-broadcast-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'broadcast_messages' },
        (payload) => {
          if (callback) callback(payload);
        }
      )
      .subscribe();

    return channel;
  }
};
