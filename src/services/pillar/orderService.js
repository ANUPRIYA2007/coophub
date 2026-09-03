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
    service: { id: "s-1", name: "Ceiling Fan Installation", category: "Electrician", price: 450 },
    attachments: [
      {
        id: "att-1",
        name: "Broken_Switchboard_Wiring.jpg",
        url: "https://images.unsplash.com/photo-1621905251189-08b45d6a269e?w=800&auto=format&fit=crop&q=80",
        type: "image",
        size: "1.2 MB",
        uploaded_at: "Today, 10:15 AM"
      },
      {
        id: "att-2",
        name: "Fan_Model_Specification.pdf",
        url: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
        type: "pdf",
        size: "340 KB",
        uploaded_at: "Today, 10:18 AM"
      }
    ]
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
    service: { id: "s-2", name: "Wiring Inspection", category: "Electrician", price: 650 },
    attachments: [
      {
        id: "att-3",
        name: "MCB_Fuse_Panel_Issue.jpg",
        url: "https://images.unsplash.com/photo-1558494949-ef010cbdcc31?w=800&auto=format&fit=crop&q=80",
        type: "image",
        size: "1.8 MB",
        uploaded_at: "Today, 01:45 PM"
      }
    ]
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

export function getDeterministicArrivalOtp(requestId) {
  if (!requestId) return "489201";
  const num = Math.abs(requestId.split('-').reduce((acc, part) => acc + (parseInt(part, 16) || 0), 489201));
  return String((num % 900000) + 100000);
}

export const pillarOrderService = {
  getDeterministicArrivalOtp,
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
            landmark: r.landmark || "",
            pincode: r.pincode || "",
            description: r.customer_description || r.description || r.problem_description || "Standard service request.",
            photo_urls: r.photo_urls || r.photos || [],
            attachments: (() => {
              const raw = r.attachments || r.photo_urls || r.photos || [];
              const list = Array.isArray(raw) ? raw : (raw ? [raw] : []);
              if (list.length === 0) {
                return [];
              }
              return list.map((att, idx) => {
                if (typeof att === "object" && att !== null) return att;
                const str = String(att);
                const isPdf = str.toLowerCase().endsWith(".pdf") || str.includes("application/pdf");
                const url = (str.startsWith("http://") || str.startsWith("https://") || str.startsWith("data:"))
                  ? str
                  : `https://aqzkzaswckfoazpqeeti.supabase.co/storage/v1/object/public/request_attachments/${str}`;
                const name = str.split("/").pop() || `Attachment_${idx + 1}`;
                return {
                  id: `att-${idx}`,
                  name,
                  url,
                  type: isPdf ? "pdf" : "image",
                  size: isPdf ? "PDF Document" : "Photo",
                  uploaded_at: r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Uploaded"
                };
              });
            })(),
            scheduled_date: r.scheduled_date || (r.created_at ? new Date(r.created_at).toLocaleDateString() : "Today"),
            scheduled_time: r.scheduled_time || r.preferred_time || "Flexible Time Slot",
            payment_method: r.payment_method || "Cash on Service / UPI",
            payment_status: r.payment_status || "Pending Completion",
            latitude: r.latitude || 13.0067,
            longitude: r.longitude || 80.2025,
            customer_latitude: r.latitude || 13.0067,
            customer_longitude: r.longitude || 80.2025,
            arrival_otp: r.arrival_otp || "489201",
            extra_charge_status: r.extra_charge_status || "none",
            extra_charge_amount: r.extra_charge_amount || 0,
            created_at: r.created_at,
            pillar_id: r.pillar_id,
            raw_data: r
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

  // State Machine Validation (Phase 15 Database Integrity)
  isValidStatusTransition(currentStatus, newStatus) {
    if (!currentStatus || currentStatus === newStatus) return true;
    const normCurrent = currentStatus.replace(/([A-Z])/g, '_$1').toLowerCase();
    const normNew = newStatus.replace(/([A-Z])/g, '_$1').toLowerCase();

    const allowed = {
      pending: ['matching', 'assigned', 'accepted', 'cancelled'],
      matching: ['assigned', 'pending', 'cancelled'],
      assigned: ['accepted', 'declined', 'cancelled', 'pending'],
      accepted: ['on_the_way', 'cancelled'],
      on_the_way: ['arrived', 'cancelled'],
      arrived: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };

    return allowed[normCurrent]?.includes(normNew) ?? false;
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

      // 1. Fetch current status to enforce state transition rules
      const { data: currentReq } = await supabase
        .from("service_requests")
        .select("status, customer_id, arrival_otp, otp_attempts")
        .eq("id", bookingId)
        .maybeSingle();

      if (currentReq?.status && !this.isValidStatusTransition(currentReq.status, dbStatus)) {
        return {
          data: null,
          error: new Error(`Invalid status transition from '${currentReq.status}' to '${dbStatus}'.`)
        };
      }

      const updates = {
        status: dbStatus,
        updated_at: new Date().toISOString(),
        ...metadata,
      };

      // 2. Update in service_requests
      const { data: sData } = await supabase
        .from("service_requests")
        .update(updates)
        .eq("id", bookingId)
        .select()
        .maybeSingle();

      // 3. Update in bookings
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

  async completeOrderAndFinalizeBill(orderId, payload) {
    const isDemo = localStorage.getItem("coophub_demo_user") === "true";
    if (isDemo) {
      const match = DEMO_ORDERS.find(o => o.id === orderId);
      if (match) {
        match.status = "completed";
        match.final_amount = payload.final_amount;
        match.extra_charge_amount = payload.extra_charge_amount;
        match.extra_charge_reason = payload.extra_charge_reason;
      }
      return { success: true, error: null };
    }

    try {
      // Fetch request to check approved extra charges
      const { data: req } = await supabase
        .from("service_requests")
        .select("*")
        .eq("id", orderId)
        .maybeSingle();

      const baseAmount = Number(payload.amount || req?.amount || 450);
      const isExtraApproved = req?.extra_charge_status === 'accepted';
      const extraAmount = isExtraApproved ? Number(req?.extra_charge_amount || payload.extra_charge_amount || 0) : 0;
      const taxAmount = Math.round((baseAmount + extraAmount) * 0.18 * 100) / 100;
      const totalAmount = Math.round((baseAmount + extraAmount + taxAmount) * 100) / 100;

      const updates = {
        status: "completed",
        final_amount: totalAmount,
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      // 1. Update in service_requests
      const { data: sData, error: sErr } = await supabase
        .from("service_requests")
        .update(updates)
        .eq("id", orderId)
        .select()
        .maybeSingle();

      // 2. Update in bookings
      await supabase
        .from("bookings")
        .update(updates)
        .eq("id", orderId);

      // 3. Create or update authoritative invoice in invoices table
      try {
        await supabase.from('invoices').upsert([{
          request_id: orderId,
          booking_id: orderId,
          invoice_number: `INV-${orderId.slice(0, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`,
          customer_id: sData?.customer_id || req?.customer_id || null,
          pillar_id: sData?.pillar_id || req?.pillar_id || null,
          base_amount: baseAmount,
          extra_charges: extraAmount,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          currency: 'INR',
          invoice_status: 'pending'
        }], { onConflict: 'request_id' });
      } catch (ie) {
        console.warn("Invoice generation note:", ie.message);
      }

      // 4. If booking was already prepaid, trigger automatic PF contribution
      if (sData?.payment_status === 'completed' || req?.payment_status === 'completed') {
        try {
          const { pfContributionService } = await import('../welfare/pfContributionService.js');
          await pfContributionService.processBookingPFContribution({
            pillarId: sData?.pillar_id || req?.pillar_id,
            bookingId: orderId,
            baseAmount: baseAmount,
            isPrepaid: true
          });
        } catch (pfErr) {
          console.warn("PF contribution completion check notice:", pfErr);
        }
      }

      return { success: true, error: null, totalAmount };
    } catch (error) {
      console.error("completeOrderAndFinalizeBill error:", error);
      return { success: false, error };
    }
  },

  async verifyArrivalOTP(bookingId, enteredOtp) {
    try {
      const cleanEntered = String(enteredOtp || "").trim();
      if (!cleanEntered || cleanEntered.length < 4) {
        return { success: false, error: "Please enter a valid 6-digit PIN." };
      }

      // Check service_requests for live arrival_otp
      const { data: sData } = await supabase
        .from("service_requests")
        .select("id, arrival_otp, otp_attempts, status")
        .eq("id", bookingId)
        .maybeSingle();

      const { data: bData } = await supabase
        .from("bookings")
        .select("id, arrival_otp, otp_attempts, status")
        .eq("id", bookingId)
        .maybeSingle();

      const realOtp = sData?.arrival_otp || bData?.arrival_otp;
      const currentAttempts = (sData?.otp_attempts || bData?.otp_attempts || 0);

      // Attempt limit protection (max 5 tries)
      if (currentAttempts >= 5) {
        return { success: false, error: "Too many failed OTP attempts. Please contact cooperative support." };
      }

      // Strict verification against actual database OTP
      if (realOtp && realOtp.trim() === cleanEntered) {
        // Valid OTP -> Transition to in_progress & record start time
        await this.updateOrderStatus(bookingId, "in_progress", {
          started_at: new Date().toISOString(),
          arrived_at: new Date().toISOString(),
          otp_attempts: 0
        });
        return { success: true, error: null };
      }

      // Increment attempt counter on mismatch
      await supabase
        .from("service_requests")
        .update({ otp_attempts: currentAttempts + 1 })
        .eq("id", bookingId);

      return {
        success: false,
        error: `Invalid OTP PIN (${4 - currentAttempts} attempts remaining). Please check the customer's phone.`
      };
    } catch (error) {
      console.error("Verify arrival OTP error:", error);
      return { success: false, error: error.message };
    }
  },

  async requestExtraCharge(bookingId, amount, reason) {
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return { data: null, error: new Error("Please enter a valid positive extra charge amount.") };
    }

    try {
      const updates = {
        extra_charge_amount: numAmount,
        extra_charge_reason: reason,
        extra_charge_status: "pending",
        updated_at: new Date().toISOString()
      };

      // 1. Update service_requests so customer immediately gets realtime prompt
      const { data: sData, error: sErr } = await supabase
        .from("service_requests")
        .update(updates)
        .eq("id", bookingId)
        .select()
        .maybeSingle();

      // 2. Update bookings
      await supabase
        .from("bookings")
        .update(updates)
        .eq("id", bookingId);

      // 3. Record in extra_charges table
      try {
        await supabase
          .from("extra_charges")
          .insert([{
            booking_id: bookingId,
            amount: numAmount,
            reason,
            status: "pending",
            created_at: new Date().toISOString()
          }]);
      } catch (ece) {}

      // 4. Create customer notification
      if (sData?.customer_id) {
        try {
          await supabase.from("notifications").insert([{
            customer_id: sData.customer_id,
            request_id: bookingId,
            type: "extra_charge_requested",
            message_translations: {
              en: `Technician requested ₹${numAmount} extra for parts/labor: ${reason}`,
              ta: `தொழில்நுட்ப வல்லுநர் உதிரிபாகங்களுக்காக ₹${numAmount} கூடுதல் கட்டணம் கோரியுள்ளார்: ${reason}`
            }
          }]);
        } catch (ne) {}
      }

      return { data: sData || updates, error: sErr };
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

    return {
      unsubscribe: () => supabase.removeChannel(channel)
    };
  }
};
