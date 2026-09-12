import { supabase } from "../../lib/supabase";
import { jobCommunicationService } from "../communication/jobCommunicationService";

export const pillarChatService = {
  // Fetch active conversations/orders for a pillar
  async getActiveConversations(pillarId) {
    try {
      // 1. Check service_requests table (primary table for orders in COOP HUB)
      let sReqQuery = supabase
        .from("service_requests")
        .select(`
          id,
          receipt_number,
          payment_gateway_ref,
          customer_description,
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
        if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pillarId)) {
          sReqQuery = sReqQuery.or(`pillar_id.eq.${pillarId},and(pillar_id.is.null,status.in.(pending,accepted,on_the_way,in_progress,arrived))`);
        } else {
          sReqQuery = sReqQuery.or(`status.in.(pending,accepted,on_the_way,in_progress,arrived)`);
        }
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
          const orderCode = r.receipt_number || r.payment_gateway_ref || (r.customer_description?.match(/\[Order:\s*([^|\]]+)/i)?.[1]?.trim()) || (String(r.id).startsWith("REQ-") || String(r.id).startsWith("ORD-") ? r.id : "REQ-" + r.id.substring(0, 6).toUpperCase());
          return {
            id: r.id,
            booking_code: orderCode,
            service_name: serviceTitle,
            customer_name: (cust.name === "Anupriya Murugan" || cust.name === "Anupriya Sundaram" || cust.name === "Valued Customer") ? (localStorage.getItem('coophub_customer_name') || "Anupriya") : (cust.name || "Customer (" + (r.area || r.city || "Client") + ")"),
            customer_mobile: cust.mobile || "+91 98401 23456",
            status: r.status || "in_progress",
            created_at: r.created_at
          };
        });
        
        // Merge with local demo orders if present
        const localItems = [];
        try {
          const created = JSON.parse(localStorage.getItem('coophub_demo_customer_created_requests') || '[]');
          const shared = JSON.parse(localStorage.getItem('coophub_shared_live_orders') || '[]');
          [...created, ...shared].forEach(item => {
            if (item && item.id && !localItems.some(l => l.id === item.id)) {
              localItems.push({
                id: item.id,
                booking_code: item.booking_code || (String(item.id).startsWith('REQ-') ? item.id : `REQ-${String(item.id).slice(0, 6).toUpperCase()}`),
                service_name: item.service_name || item.service?.name || "Electrical Repair",
                customer_name: item.customer_name || item.customer?.full_name || "Anupriya",
                customer_mobile: item.customer_mobile || item.customer_phone || "+91 98401 23456",
                status: item.status || "in_progress",
                created_at: item.created_at || new Date().toISOString()
              });
            }
          });
        } catch(e) {}

        const allList = [...mapped, ...localItems];
        const seen = new Set();
        const deduped = allList.filter(c => {
          if (!c?.id || seen.has(c.id)) return false;
          seen.add(c.id);
          return true;
        });

        return { data: deduped, error: null };
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

      // 3. Fallback to local demo conversations & created requests
      const demoList = [];
      try {
        const created = JSON.parse(localStorage.getItem('coophub_demo_customer_created_requests') || '[]');
        const shared = JSON.parse(localStorage.getItem('coophub_shared_live_orders') || '[]');
        [...created, ...shared].forEach(item => {
          if (item && item.id && !demoList.some(d => d.id === item.id)) {
            demoList.push({
              id: item.id,
              booking_code: item.booking_code || (String(item.id).startsWith('REQ-') ? item.id : `REQ-${String(item.id).slice(0, 6).toUpperCase()}`),
              service_name: item.service_name || item.service?.name || "Electrical Repair",
              customer_name: item.customer_name || item.customer?.full_name || "Anupriya",
              customer_mobile: item.customer_mobile || item.customer_phone || "+91 98401 23456",
              status: item.status || "in_progress",
              created_at: item.created_at || new Date().toISOString()
            });
          }
        });
      } catch (e) {}

      const combined = [...(bookings || []), ...demoList];
      const seen = new Set();
      const deduped = combined.filter(c => {
        if (!c?.id || seen.has(c.id)) return false;
        seen.add(c.id);
        return true;
      });

      return { data: deduped, error: null };
    } catch (error) {
      console.error("Fetch conversations error:", error);
      return { data: [], error };
    }
  },

  // Fetch messages for a specific booking / request
  async getMessages(bookingId) {
    return jobCommunicationService.getMessages(bookingId);
  },

  // Send a message
  async sendMessage(bookingId, senderId, senderType, messageText) {
    return jobCommunicationService.sendMessage({
      requestId: bookingId,
      senderId,
      senderType: senderType || 'pillar',
      content: messageText,
      messageType: 'TEXT'
    });
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

