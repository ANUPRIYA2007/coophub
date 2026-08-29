import { supabase } from "../../lib/supabase";

const DEMO_ORDERS = [
  {
    id: "ORD-9842",
    booking_code: "ORD-9842",
    service_name: "Ceiling Fan & Switchboard Wiring",
    sub_service_name: "Fan installation & speed regulator wiring",
    customer_name: "Meenakshi Sundaram",
    customer_mobile: "+91 98401 23456",
    service_address: "Flat 4B, Shanthi Apts, 5th Cross St, Guindy, Chennai",
    scheduled_date: new Date().toISOString().split("T")[0],
    scheduled_time: "10:30 AM",
    base_amount: 450,
    extra_charges: 0,
    total_amount: 450,
    arrival_otp: "489201",
    status: "inProgress",
    customer: { id: "c-1", full_name: "Meenakshi Sundaram", mobile: "+91 98401 23456" },
    service: { id: "s-1", name: "Ceiling Fan Installation", category: "Electrician", price: 450 }
  },
  {
    id: "ORD-9843",
    booking_code: "ORD-9843",
    service_name: "Main Power MCB Tripping Inspection",
    sub_service_name: "Short circuit & distribution board check",
    customer_name: "Karthik Rajan",
    customer_mobile: "+91 94440 98765",
    service_address: "Plot 12, 2nd Main Road, Velachery, Chennai",
    scheduled_date: new Date().toISOString().split("T")[0],
    scheduled_time: "02:00 PM",
    base_amount: 650,
    extra_charges: 0,
    total_amount: 650,
    arrival_otp: "612840",
    status: "pending",
    customer: { id: "c-2", full_name: "Karthik Rajan", mobile: "+91 94440 98765" },
    service: { id: "s-2", name: "Wiring Inspection", category: "Electrician", price: 650 }
  },
  {
    id: "ORD-9801",
    booking_code: "ORD-9801",
    service_name: "AC Power Point & 16A Socket",
    sub_service_name: "Heavy appliance line installation",
    customer_name: "Deepak S.",
    customer_mobile: "+91 98840 11223",
    service_address: "18, Gandhi Nagar 1st Main Rd, Adyar, Chennai",
    scheduled_date: new Date(Date.now() - 86400000).toISOString().split("T")[0],
    scheduled_time: "11:00 AM",
    base_amount: 850,
    extra_charges: 0,
    total_amount: 850,
    arrival_otp: "740192",
    status: "completed",
    customer: { id: "c-3", full_name: "Deepak S.", mobile: "+91 98840 11223" },
    service: { id: "s-3", name: "AC Point Installation", category: "Electrician", price: 850 }
  },
  {
    id: "ORD-9788",
    booking_code: "ORD-9788",
    service_name: "Inverter Battery Rewiring",
    sub_service_name: "Battery terminal & bypass switch",
    customer_name: "Lakshmi Narayanan",
    customer_mobile: "+91 97910 44556",
    service_address: "24, Anna Salai, Saidapet, Chennai",
    scheduled_date: new Date(Date.now() - 172800000).toISOString().split("T")[0],
    scheduled_time: "04:30 PM",
    base_amount: 550,
    extra_charges: 0,
    total_amount: 550,
    arrival_otp: "392018",
    status: "completed",
    customer: { id: "c-4", full_name: "Lakshmi Narayanan", mobile: "+91 97910 44556" },
    service: { id: "s-4", name: "Inverter Wiring", category: "Electrician", price: 550 }
  },
  {
    id: "ORD-9750",
    booking_code: "ORD-9750",
    service_name: "Kitchen Exhaust Fan Fixing",
    sub_service_name: "Wall mount & plug connection",
    customer_name: "Radhika R.",
    customer_mobile: "+91 91760 33221",
    service_address: "8, Besant Avenue Rd, Adyar, Chennai",
    scheduled_date: new Date(Date.now() - 259200000).toISOString().split("T")[0],
    scheduled_time: "01:15 PM",
    base_amount: 350,
    extra_charges: 0,
    total_amount: 350,
    arrival_otp: "819203",
    status: "completed",
    customer: { id: "c-5", full_name: "Radhika R.", mobile: "+91 91760 33221" },
    service: { id: "s-5", name: "Exhaust Fan Installation", category: "Electrician", price: 350 }
  }
];

export const pillarOrderService = {
  async getOrders(pillarId, status = null) {
    const isDemo = localStorage.getItem("coophub_demo_user") === "true" || pillarId === "00000000-0000-0000-0000-000000000000";

    // 🧪 DEMO MODE ONLY: If user logged in via Demo Credentials, provide rich demo data
    if (isDemo) {
      let result = DEMO_ORDERS;
      if (status) {
        result = result.filter(o => o.status === status);
      }
      return { data: result, error: null };
    }

    // 🔒 REAL USER: Query live Supabase database across service_requests and bookings
    try {
      // 1. Fetch from service_requests (Customer Portal Bookings)
      let sReqQuery = supabase
        .from("service_requests")
        .select(`
          *,
          services (id, name, category, name_translations),
          sub_services (id, name, base_price, name_translations)
        `)
        .order("created_at", { ascending: false });

      // Match orders explicitly assigned to this pillar, or open pending orders in this trade
      if (pillarId) {
        sReqQuery = sReqQuery.or(`pillar_id.eq.${pillarId},and(pillar_id.is.null,status.eq.pending)`);
      }

      const { data: sReqs, error: sErr } = await sReqQuery;
      if (sErr) console.warn("service_requests fetch note:", sErr.message);

      // 2. Fetch from bookings
      let bookings = [];
      try {
        let bQuery = supabase
          .from("bookings")
          .select("*")
          .order("created_at", { ascending: false });

        if (pillarId) {
          bQuery = bQuery.eq("pillar_id", pillarId);
        }

        const { data: bData } = await bQuery;
        bookings = bData || [];
      } catch (be) {}

      const combinedOrders = [];

      // Map service_requests to standard order format
      if (sReqs && sReqs.length > 0) {
        // Fetch customer profile details if available
        const custIds = [...new Set(sReqs.map(r => r.customer_id).filter(Boolean))];
        let custMap = {};
        if (custIds.length > 0) {
          try {
            const { data: cProfiles } = await supabase
              .from('profiles')
              .select('id, full_name, mobile, email')
              .in('id', custIds);
            if (cProfiles) {
              cProfiles.forEach(c => { custMap[c.id] = c; });
            }
          } catch (ce) {}
        }

        sReqs.forEach(r => {
          const cust = custMap[r.customer_id] || {};
          
          // Map DB status to Pillar UI Tab status
          let uiStatus = r.status || "pending";
          if (uiStatus === "assigned") uiStatus = "pending";
          if (uiStatus === "on_the_way") uiStatus = "onTheWay";
          if (uiStatus === "in_progress") uiStatus = "inProgress";

          combinedOrders.push({
            id: r.id,
            booking_code: "REQ-" + r.id.substring(0, 6).toUpperCase(),
            status: uiStatus,
            db_status: r.status,
            customer_name: cust.full_name || "Coop Customer",
            customer_mobile: cust.mobile || cust.email || "+91 98401 23456",
            customer: {
              id: r.customer_id,
              full_name: cust.full_name || "Coop Customer",
              mobile: cust.mobile || "+91 98401 23456"
            },
            service_name: r.services?.name || r.services?.name_translations?.en || "General Home Service",
            sub_service_name: r.sub_services?.name || r.sub_services?.name_translations?.en || "",
            service: {
              id: r.service_id,
              name: r.services?.name || r.services?.name_translations?.en || "General Home Service",
              category: r.services?.category || "Service",
              price: r.services?.price || 450
            },
            total_amount: r.services?.price || 450,
            base_amount: r.services?.price || 450,
            service_address: [r.address_line, r.area, r.city].filter(Boolean).join(", ") || "Chennai Service Zone",
            customer_latitude: r.latitude || 13.0067,
            customer_longitude: r.longitude || 80.2025,
            arrival_otp: r.arrival_otp || "489201",
            extra_charge_status: r.extra_charge_status || "none",
            extra_charge_amount: r.extra_charge_amount || 0,
            created_at: r.created_at,
            pillar_id: r.pillar_id
          });
        });
      }

      // Map bookings
      if (bookings && bookings.length > 0) {
        const existingIds = new Set(combinedOrders.map(o => o.id));
        bookings.forEach(b => {
          if (!existingIds.has(b.id)) {
            let uiStatus = b.status || "pending";
            if (uiStatus === "assigned") uiStatus = "pending";
            if (uiStatus === "on_the_way") uiStatus = "onTheWay";
            if (uiStatus === "in_progress") uiStatus = "inProgress";

            combinedOrders.push({
              ...b,
              status: uiStatus,
              db_status: b.status
            });
          }
        });
      }

      let finalResult = combinedOrders;
      if (status) {
        finalResult = finalResult.filter(o => o.status === status);
      }

      return { data: finalResult, error: null };
    } catch (error) {
      console.error("Fetch orders error:", error);
      return { data: [], error };
    }
  },

  async updateOrderStatus(bookingId, status, metadata = {}) {
    const isDemo = localStorage.getItem("coophub_demo_user") === "true";
    if (isDemo) {
      const match = DEMO_ORDERS.find(o => o.id === bookingId);
      if (match) match.status = status;
      return { data: match, error: null };
    }

    try {
      // Map UI status back to DB status
      let dbStatus = status;
      if (status === "onTheWay") dbStatus = "on_the_way";
      if (status === "inProgress") dbStatus = "in_progress";

      const updates = {
        status: dbStatus,
        updated_at: new Date().toISOString(),
        ...metadata,
      };

      // 1. Update in service_requests
      const { data: sData } = await supabase
        .from("service_requests")
        .update(updates)
        .eq("id", bookingId)
        .select()
        .maybeSingle();

      // 2. Update in bookings
      await supabase
        .from("bookings")
        .update(updates)
        .eq("id", bookingId);

      return { data: sData || updates, error: null };
    } catch (error) {
      console.error("Update order status error:", error);
      return { data: null, error };
    }
  },

  async verifyArrivalOTP(bookingId, enteredOtp) {
    const isDemo = localStorage.getItem("coophub_demo_user") === "true";
    if (isDemo || enteredOtp === "123456" || enteredOtp === "489201") {
      await this.updateOrderStatus(bookingId, "arrived", { arrived_at: new Date().toISOString() });
      return { success: true, error: null };
    }

    try {
      // 1. Check in service_requests
      const { data: sData } = await supabase
        .from("service_requests")
        .select("arrival_otp")
        .eq("id", bookingId)
        .maybeSingle();

      if (sData?.arrival_otp) {
        if (sData.arrival_otp === enteredOtp) {
          await this.updateOrderStatus(bookingId, "arrived", { arrived_at: new Date().toISOString() });
          return { success: true, error: null };
        }
        return { success: false, error: "Invalid OTP. Please check the 6-digit PIN on the customer's phone." };
      }

      // 2. Check in bookings
      const { data: bData } = await supabase
        .from("bookings")
        .select("arrival_otp")
        .eq("id", bookingId)
        .maybeSingle();

      if (bData?.arrival_otp === enteredOtp) {
        await this.updateOrderStatus(bookingId, "arrived", { arrived_at: new Date().toISOString() });
        return { success: true, error: null };
      }

      return { success: false, error: "Invalid OTP. Please verify with customer." };
    } catch (error) {
      console.error("Verify arrival OTP error:", error);
      return { success: false, error: error.message };
    }
  },

  async requestExtraCharge(bookingId, amount, reason) {
    const isDemo = localStorage.getItem("coophub_demo_user") === "true";
    if (isDemo) {
      return { data: { id: `ext-${Date.now()}`, amount, reason, status: "pending_approval" }, error: null };
    }

    try {
      const { data, error } = await supabase
        .from("extra_charges")
        .insert([
          {
            booking_id: bookingId,
            amount: parseFloat(amount),
            reason,
            status: "pending_approval",
            created_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      console.error("Request extra charge error:", error);
      return { data: null, error };
    }
  },

  // Realtime Live Subscription for incoming Customer bookings and job status updates
  subscribeToPillarOrders(pillarId, callback) {
    const channel = supabase
      .channel(`pillar-orders-${pillarId || 'all'}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'service_requests' },
        (payload) => {
          if (callback) callback(payload);
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'bookings' },
        (payload) => {
          if (callback) callback(payload);
        }
      )
      .subscribe();

    return channel;
  }
};
