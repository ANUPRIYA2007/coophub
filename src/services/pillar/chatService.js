import { supabase } from "../../lib/supabase";

export const pillarChatService = {
  // Fetch active conversations/orders for a pillar
  async getActiveConversations(pillarId) {
    try {
      // 1. Check service_requests table (primary table for orders in COOP HUB)
      let sReqQuery = supabase
        .from("service_requests")
        .select(`
          id,
          status,
          created_at,
          address_line,
          area,
          city,
          customer_id,
          pillar_id,
          services (id, name, category),
          sub_services (id, name)
        `)
        .order("created_at", { ascending: false });

      if (pillarId && pillarId !== "00000000-0000-0000-0000-000000000000") {
        sReqQuery = sReqQuery.or(`pillar_id.eq.${pillarId},and(pillar_id.is.null,status.in.(pending,accepted,on_the_way,in_progress,arrived))`);
      }

      const { data: serviceReqs } = await sReqQuery.limit(20);

      if (serviceReqs && serviceReqs.length > 0) {
        // Collect customer IDs for name resolution
        const custIds = [...new Set(serviceReqs.map(r => r.customer_id).filter(Boolean))];
        let customerMap = {};

        if (custIds.length > 0) {
          try {
            const { data: cProfiles } = await supabase
              .from('customer_profiles')
              .select('user_id, full_name, mobile')
              .in('user_id', custIds);

            if (cProfiles) {
              cProfiles.forEach(c => {
                customerMap[c.user_id] = { name: c.full_name, mobile: c.mobile };
              });
            }

            // Fallback to profiles
            const missingIds = custIds.filter(id => !customerMap[id]);
            if (missingIds.length > 0) {
              const { data: profiles } = await supabase
                .from('profiles')
                .select('id, full_name, mobile')
                .in('id', missingIds);
              if (profiles) {
                profiles.forEach(p => {
                  customerMap[p.id] = { name: p.full_name, mobile: p.mobile };
                });
              }
            }
          } catch (pe) {
            console.warn("Customer name resolution note:", pe);
          }
        }

        const mapped = serviceReqs.map(r => {
          const cust = customerMap[r.customer_id] || {};
          const serviceTitle = r.services?.name || r.sub_services?.name || "Home Repair Service";
          return {
            id: r.id,
            booking_code: "REQ-" + r.id.substring(0, 6).toUpperCase(),
            service_name: serviceTitle,
            customer_name: cust.name || "Customer (" + (r.area || r.city || "Client") + ")",
            customer_mobile: cust.mobile || "+91 98400 00000",
            status: r.status || "in_progress",
            created_at: r.created_at
          };
        });
        return { data: mapped, error: null };
      }

      // 2. Check bookings table as fallback
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
        .order("created_at", { ascending: false })
        .limit(10);

      if (bookings && bookings.length > 0) {
        return { data: bookings, error: null };
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
      if (!bookingId) return { data: [], error: null };

      let query = supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });

      query = query.or(`request_id.eq.${bookingId},booking_id.eq.${bookingId}`);

      const { data, error } = await query;

      if (error) throw error;
      return { 
        data: (data || []).map(m => ({ 
          ...m, 
          content: m.content || m.message || '',
          message: m.message || m.content || '',
          text: m.content || m.message || ''
        })), 
        error: null 
      };
    } catch (error) {
      console.error("Chat fetch error:", error);
      return { data: [], error };
    }
  },

  // Send a message
  async sendMessage(bookingId, senderId, senderType, messageText) {
    try {
      const cleanText = (messageText || '').trim();
      if (!cleanText) return { data: null, error: 'Empty message' };

      // Crucial: Set request_id to bookingId (since orders are in service_requests).
      // Leave booking_id as null to prevent foreign key violation messages_booking_id_fkey.
      const payload = {
        request_id: bookingId,
        booking_id: null,
        sender_type: senderType || 'pillar',
        content: cleanText,
        message: cleanText,
        message_type: 'TEXT',
        is_read: false,
        read: false,
        created_at: new Date().toISOString()
      };

      if (senderId && typeof senderId === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(senderId)) {
        payload.sender_id = senderId;
      }

      const { data, error } = await supabase
        .from("messages")
        .insert([payload])
        .select()
        .single();

      if (error) {
        console.error("Send message error from Supabase:", error);
        throw error;
      }

      return { 
        data: {
          ...data,
          content: data.content || data.message,
          message: data.message || data.content,
          text: data.content || data.message
        }, 
        error: null 
      };
    } catch (error) {
      console.error("Send message error:", error);
      return { data: null, error };
    }
  },

  // Subscribe to live messages for a specific booking / request
  subscribeToChat(bookingId, callback) {
    const channelName = `chat-realtime-${bookingId || 'global'}-${Date.now()}`;
    const channel = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'messages' },
        (payload) => {
          if (!payload.new) return;
          const msg = payload.new;
          if (!bookingId || msg.request_id === bookingId || msg.booking_id === bookingId) {
            console.log('[Realtime] Pillar received new message:', msg);
            if (callback) {
              callback({ 
                ...msg, 
                content: msg.content || msg.message || '',
                message: msg.message || msg.content || '',
                text: msg.content || msg.message || ''
              });
            }
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'messages' },
        (payload) => {
          if (!payload.new) return;
          const msg = payload.new;
          if (!bookingId || msg.request_id === bookingId || msg.booking_id === bookingId) {
            console.log('[Realtime] Pillar received message update:', msg);
            if (callback) {
              callback({ 
                ...msg, 
                content: msg.content || msg.message || '',
                message: msg.message || msg.content || '',
                text: msg.content || msg.message || ''
              });
            }
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log(`[Realtime] Pillar subscribed to ${channelName}`);
        }
      });

    // Provide clean unsubscribe teardown
    const unsub = () => {
      try {
        console.log(`[Realtime] Pillar removing channel ${channelName}`);
        supabase.removeChannel(channel);
      } catch (e) {
        console.warn('Pillar teardown note:', e);
      }
    };
    channel.unsubscribe = unsub;
    return channel;
  }
};

export default pillarChatService;

