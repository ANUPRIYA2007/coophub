import { supabase } from "../../lib/supabase.js";
import { registerOrderUuid } from "../communication/jobCommunicationService.js";

const DEMO_ORDERS = [
  {
    id: "ORD-9842",
    order_id: "ORD-9842",
    booking_code: "ORD-9842",
    service_id: "SRV-ELEC-101",
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
    service: { id: "SRV-ELEC-101", name: "Ceiling Fan Installation", category: "Electrician", price: 450 },
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
    order_id: "ORD-9843",
    booking_code: "ORD-9843",
    service_id: "SRV-ELEC-102",
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
    service: { id: "SRV-ELEC-102", name: "Wiring Inspection", category: "Electrician", price: 650 },
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
    order_id: "ORD-9801",
    booking_code: "ORD-9801",
    service_id: "SRV-ELEC-103",
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
    service: { id: "SRV-ELEC-103", name: "AC Point Installation", category: "Electrician", price: 850 }
  },
  {
    id: "ORD-9788",
    order_id: "ORD-9788",
    booking_code: "ORD-9788",
    service_id: "SRV-ELEC-104",
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
    service: { id: "SRV-ELEC-104", name: "Inverter Wiring", category: "Electrician", price: 550 }
  },
  {
    id: "ORD-9750",
    order_id: "ORD-9750",
    booking_code: "ORD-9750",
    service_id: "SRV-ELEC-105",
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
    service: { id: "SRV-ELEC-105", name: "Exhaust Fan Installation", category: "Electrician", price: 350 }
  }
];

export function getDeterministicArrivalOtp(requestId) {
  if (!requestId) return "489201";
  const num = Math.abs(requestId.split('-').reduce((acc, part) => acc + (parseInt(part, 16) || 0), 489201));
  return String((num % 900000) + 100000);
}

export function formatOrderTime(timestamp) {
  if (!timestamp) return "Today";
  try {
    const d = new Date(timestamp);
    if (isNaN(d.getTime())) return String(timestamp);
    return d.toLocaleString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  } catch (e) {
    return String(timestamp);
  }
}

const KNOWN_CUSTOMERS = [
  { full_name: "Anupriya", mobile: "+91 98401 23456", email: "anupriya@coophub.in" },
  { full_name: "Karthik Rajan", mobile: "+91 94440 98765", email: "karthik.rajan@outlook.com" },
  { full_name: "Meenakshi Sundaram", mobile: "+91 97910 44556", email: "meenakshi.s@gmail.com" },
  { full_name: "Deepak Srinivasan", mobile: "+91 98840 11223", email: "deepak.srini@yahoo.com" },
  { full_name: "Radhika Ramachandran", mobile: "+91 91760 33221", email: "radhika.r@gmail.com" },
  { full_name: "Venkatesh Kumar", mobile: "+91 98412 88776", email: "venkat.k@gmail.com" }
];

export function isOrderForPillar(order, pillarId, pillarProfile = null) {
  if (!order) return false;

  // Normalise target pillar IDs, codes, and names
  const targetIds = new Set();
  const targetCodes = new Set();
  const targetNames = new Set();

  if (pillarId && pillarId !== "00000000-0000-0000-0000-000000000000") {
    targetIds.add(String(pillarId).toLowerCase());
    targetCodes.add(String(pillarId).toUpperCase());
  }

  if (pillarProfile) {
    if (pillarProfile.id) {
      targetIds.add(String(pillarProfile.id).toLowerCase());
      targetCodes.add(String(pillarProfile.id).toUpperCase());
    }
    if (pillarProfile.alias_id) {
      targetIds.add(String(pillarProfile.alias_id).toLowerCase());
    }
    if (pillarProfile.pillar_code) {
      targetCodes.add(String(pillarProfile.pillar_code).toUpperCase());
      targetIds.add(String(pillarProfile.pillar_code).toLowerCase());
    }
    if (pillarProfile.alias_code) {
      targetCodes.add(String(pillarProfile.alias_code).toUpperCase());
      targetIds.add(String(pillarProfile.alias_code).toLowerCase());
    }
    if (pillarProfile.full_name) {
      targetNames.add(pillarProfile.full_name.toLowerCase());
    }
  }

  // Check demo user / active pillar in localStorage
  let demoName = "";
  try {
    demoName = localStorage.getItem("coophub_demo_user_name") || "";
    if (demoName) targetNames.add(demoName.toLowerCase());
    const activePCode = localStorage.getItem("coophub_active_pillar_code");
    if (activePCode) targetCodes.add(activePCode.toUpperCase());
    const activePId = localStorage.getItem("coophub_active_pillar_id");
    if (activePId) targetIds.add(activePId.toLowerCase());
  } catch(e) {}

  // Check if current pillar is Raj Kumar / PIL-CHE-042 / PIL-CHE-111 / Senthil Kumar (default demo pillar)
  const isRaj = Array.from(targetIds).some(id => 
    id === "7842d4fd-ac93-4014-93ed-001c0237a36c" || 
    id === "c0000000-0000-0000-0000-000000000011" ||
    id === "pil-che-042" ||
    id === "pil-che-111"
  ) || Array.from(targetCodes).some(c => c === "PIL-CHE-042" || c === "PIL-CHE-111")
    || (demoName && /raj\s*kumar/i.test(demoName)) 
    || (targetIds.size === 0 && localStorage.getItem("coophub_demo_user") === "true")
    || (!pillarId || pillarId === "00000000-0000-0000-0000-000000000000");

  if (isRaj) {
    targetIds.add("7842d4fd-ac93-4014-93ed-001c0237a36c");
    targetIds.add("c0000000-0000-0000-0000-000000000011");
    targetIds.add("pil-che-042");
    targetIds.add("pil-che-111");
    targetCodes.add("PIL-CHE-042");
    targetCodes.add("PIL-CHE-111");
    targetNames.add("raj kumar");
    targetNames.add("senthil kumar");
  }

  const orderPillarId = order.pillar_id ? String(order.pillar_id).toLowerCase() : (order.pillar?.id ? String(order.pillar.id).toLowerCase() : null);
  const orderPillarName = (order.pillar_name || order.pillar?.full_name || "").toLowerCase();
  const orderPillarCode = (order.pillar_code || order.pillar?.pillar_code || "").toUpperCase();

  // 1. Direct match by ID
  if (orderPillarId && (targetIds.has(orderPillarId) || targetCodes.has(orderPillarId.toUpperCase()))) return true;

  // 2. Direct match by Pillar Code
  if (orderPillarCode && (targetCodes.has(orderPillarCode) || targetIds.has(orderPillarCode.toLowerCase()))) return true;

  // 3. Direct match by Name
  if (orderPillarName && targetNames.has(orderPillarName)) return true;

  // 4. If this is the demo pillar (PIL-CHE-042), match variations
  if (isRaj) {
    if (orderPillarCode === "PIL-CHE-042" || orderPillarCode === "PIL-CHE-111") return true;
    if (orderPillarId === "pil-che-042" || orderPillarId === "pil-che-111") return true;
    if (/raj\s*kumar/i.test(orderPillarName) || /senthil/i.test(orderPillarName)) return true;
  }

  // 5. If order is unassigned pool (status === 'pending' or 'assigned' without explicit pillar)
  const s = (order.status || order.db_status || "").toLowerCase();
  if (!orderPillarId && !orderPillarCode && (s === 'pending' || s === 'assigned' || s === '')) {
    return true; // Available for any eligible pillar in trade pool
  }

  // 6. Check if order was created by customer in local storage without explicit pillar ID
  if (order.id && !orderPillarId && !orderPillarCode) {
    return true;
  }

  return false;
}

export const pillarOrderService = {
  getDeterministicArrivalOtp,
  formatOrderTime,
  isOrderForPillar,
  async getOrders(pillarId, status = null, pillarProfile = null) {
    const isDemo = localStorage.getItem("coophub_demo_user") === "true" || 
                   pillarId === "00000000-0000-0000-0000-000000000000" ||
                   pillarId === "7842d4fd-ac93-4014-93ed-001c0237a36c" ||
                   pillarId === "c0000000-0000-0000-0000-000000000011" ||
                   pillarId === "pil-che-042" ||
                   pillarId === "PIL-CHE-042" ||
                   pillarId === "c4200000-0000-0000-0000-000000000042";

    // 🔒 REAL USER & DEMO: Query live Supabase database across service_requests and bookings
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

      const { data: sReqs, error: sErr } = await sReqQuery;
      if (sErr) console.warn("service_requests fetch note:", sErr.message);

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
              .select('id, user_id, full_name, mobile, email')
              .or(`id.in.(${custIds.join(',')}),user_id.in.(${custIds.join(',')})`);
            if (cProfiles) {
              cProfiles.forEach(c => { 
                if (c.id) custMap[c.id] = c;
                if (c.user_id) custMap[c.user_id] = c;
              });
            }
          } catch (ce) {}

          // Also check customer_profiles
          try {
            const { data: cpData } = await supabase
              .from('customer_profiles')
              .select('user_id, full_name, mobile, email')
              .in('user_id', custIds);
            if (cpData) {
              cpData.forEach(c => {
                if (c.user_id && !custMap[c.user_id]) custMap[c.user_id] = c;
              });
            }
          } catch (cpe) {}
        }

        sReqs.forEach(r => {
          if (!isOrderForPillar(r, pillarId, pillarProfile)) return;
          const cust = custMap[r.customer_id] || {};
          
          // Deterministic authentic customer fallback when user profile is not public
          const charSum = (r.id || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
          const defaultCust = KNOWN_CUSTOMERS[charSum % KNOWN_CUSTOMERS.length];
          let custName = cust.full_name || r.customer_name;
          let custMobile = cust.mobile || r.customer_mobile || r.customer_phone;
          let custEmail = cust.email || r.customer_email;

          // Parse name and phone from customer description if embedded
          if ((!custName || custName === 'Valued Customer' || custName === 'Coop Customer') && r.customer_description) {
            const matchName = r.customer_description.match(/\[(?:Order:[^|\]]+\|\s*)?Customer:\s*([^|\]]+)/i) || r.customer_description.match(/Customer:\s*([^|\]]+)/i);
            if (matchName && matchName[1] && matchName[1].trim() !== 'Valued Customer') custName = matchName[1].trim();
            const matchPhone = r.customer_description.match(/Phone:\s*([^|\]]+)/i);
            if (matchPhone && matchPhone[1]) custMobile = matchPhone[1].trim();
          }

          if (!custName || custName === 'Valued Customer' || custName === 'Coop Customer' || custName === 'Anupriya Murugan' || custName === 'Anupriya Sundaram') {
            try {
              const demoProf = JSON.parse(localStorage.getItem('coophub_demo_profile') || '{}');
              if (demoProf.full_name && demoProf.full_name !== 'Valued Customer' && demoProf.full_name !== 'Anupriya Murugan' && demoProf.full_name !== 'Anupriya Sundaram') {
                custName = demoProf.full_name;
              }
              const savedName = localStorage.getItem('coophub_customer_name');
              if (savedName && savedName !== 'Anupriya Murugan' && savedName !== 'Anupriya Sundaram') {
                custName = savedName;
              }
            } catch(e) {}
          }

          if (!custName || custName === 'Valued Customer' || custName === 'Coop Customer' || custName === 'Anupriya Murugan' || custName === 'Anupriya Sundaram') {
            custName = 'Anupriya';
          }
          if (!custMobile || custMobile.includes('1234567890')) custMobile = defaultCust.mobile;
          if (!custEmail) custEmail = defaultCust.email;

          // Strip raw coordinates from service_address
          const isCoords = (s) => !s || /^Lat:\s*[\d.-]+/i.test(String(s).trim());
          const cleanLine = !isCoords(r.address_line) ? r.address_line : "";
          const fullAddress = [cleanLine, r.area, r.city].filter(Boolean).join(", ") || (r.area ? `${r.area}, Chennai` : "Chennai Service Zone");

          // Map DB status to Pillar UI Tab status
          let uiStatus = r.status || "pending";
          if (uiStatus === "assigned") uiStatus = "pending";
          if (uiStatus === "on_the_way") uiStatus = "onTheWay";
          if (uiStatus === "in_progress") uiStatus = "inProgress";

          const orderCode = r.receipt_number || 
                            r.payment_gateway_ref || 
                            (r.customer_description?.match(/\[Order:\s*([^|\]]+)/i)?.[1]?.trim()) || 
                            (String(r.id).startsWith("REQ-") || String(r.id).startsWith("ORD-") ? r.id : "REQ-" + r.id.substring(0, 6).toUpperCase());

          registerOrderUuid(orderCode, r.id);
          if (r.receipt_number) registerOrderUuid(r.receipt_number, r.id);
          if (r.payment_gateway_ref) registerOrderUuid(r.payment_gateway_ref, r.id);

          combinedOrders.push({
            id: r.id,
            order_id: orderCode,
            booking_code: orderCode,
            service_id: r.service_id,
            sub_service_id: r.sub_service_id,
            status: uiStatus,
            db_status: r.status,
            customer_name: custName,
            customer_mobile: custMobile,
            customer_email: custEmail,
            customer: {
              id: r.customer_id,
              full_name: custName,
              mobile: custMobile,
              email: custEmail
            },
            service_name: r.services?.name || r.services?.name_translations?.en || "General Home Service",
            sub_service_name: (() => {
              if (r.sub_services?.name) return r.sub_services.name;
              if (r.sub_services?.name_translations?.en) return r.sub_services.name_translations.en;
              if (r.customer_description) {
                const descWithoutTag = r.customer_description.replace(/\[[^\]]+\]\s*/g, '').trim();
                if (descWithoutTag) {
                  return descWithoutTag.split(/\s*-\s*/)[0]?.trim() || "";
                }
              }
              return "";
            })(),
            service: {
              id: r.service_id,
              name: r.services?.name || r.services?.name_translations?.en || "General Home Service",
              category: r.services?.category || "Service",
              price: r.services?.price || 450
            },
            total_amount: r.total_amount || r.final_amount || r.amount || r.services?.price || 450,
            base_amount: r.amount || r.services?.price || 450,
            service_address: fullAddress,
            order_time_formatted: formatOrderTime(r.created_at),
            landmark: r.landmark || "",
            pincode: r.pincode || "",
            latitude: Number(r.latitude || r.lat || 13.0067),
            longitude: Number(r.longitude || r.lng || 80.2025),
            customer_latitude: Number(r.latitude || r.lat || 13.0067),
            customer_longitude: Number(r.longitude || r.lng || 80.2025),
            description: r.customer_description || r.description || r.problem_description || "Standard service request.",
            photo_urls: (() => {
              const raw = r.attachments || r.photo_urls || r.photos || [];
              const list = Array.isArray(raw) ? raw : (raw ? [raw] : []);
              return list.map(a => typeof a === 'object' ? (a.url || a.previewUrl) : a).filter(Boolean);
            })(),
            attachments: (() => {
              const raw = r.attachments || r.photo_urls || r.photos || [];
              const list = Array.isArray(raw) ? raw : (raw ? [raw] : []);
              if (list.length === 0) {
                return [];
              }
              return list.map((att, idx) => {
                if (typeof att === "object" && att !== null) {
                  const resolvedUrl = att.url || att.previewUrl || att.dataUrl || (att.path ? `https://aqzkzaswckfoazpqeeti.supabase.co/storage/v1/object/public/request_attachments/${att.path}` : "");
                  return {
                    ...att,
                    id: att.id || `att-${idx}`,
                    name: att.name || `Attachment_${idx + 1}`,
                    url: resolvedUrl,
                    previewUrl: att.previewUrl || resolvedUrl,
                    type: att.type || ((att.name || resolvedUrl).toLowerCase().includes(".pdf") ? "pdf" : "image"),
                    size: att.size || "Customer File",
                    uploaded_at: att.uploaded_at || (r.created_at ? new Date(r.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Uploaded")
                  };
                }
                const str = String(att);
                const isPdf = str.toLowerCase().endsWith(".pdf") || str.includes("application/pdf");
                const url = (str.startsWith("http://") || str.startsWith("https://") || str.startsWith("data:"))
                  ? str
                  : `https://aqzkzaswckfoazpqeeti.supabase.co/storage/v1/object/public/request_attachments/${str}`;
                const name = str.startsWith("data:") ? `Customer_Photo_${idx + 1}.jpg` : (str.split("/").pop() || `Attachment_${idx + 1}`);
                return {
                  id: `att-${idx}`,
                  name,
                  url,
                  previewUrl: url,
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
            pillar_name: r.pillar?.full_name || r.pillar_name || (r.pillar_id === "7842d4fd-ac93-4014-93ed-001c0237a36c" ? "Raj Kumar" : undefined),
            pillar_code: r.pillar?.pillar_code || r.pillar_code || (r.pillar_id === "7842d4fd-ac93-4014-93ed-001c0237a36c" ? "PIL-CHE-042" : undefined),
            customer_phone: custMobile,
            phone: custMobile,
            raw_data: r
          });
        });
      }

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

      // Map bookings
      if (bookings && bookings.length > 0) {
        const existingIds = new Set(combinedOrders.map(o => o.id));
        bookings.forEach(b => {
          if (!existingIds.has(b.id) && isOrderForPillar(b, pillarId, pillarProfile)) {
            let uiStatus = b.status || "pending";
            if (uiStatus === "assigned") uiStatus = "pending";
            if (uiStatus === "on_the_way") uiStatus = "onTheWay";
            if (uiStatus === "in_progress") uiStatus = "inProgress";

            let bCustName = b.customer_name;
            if (!bCustName || bCustName === 'Valued Customer' || bCustName === 'Coop Customer') {
              const charSum = (b.id || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
              const defaultCust = KNOWN_CUSTOMERS[charSum % KNOWN_CUSTOMERS.length];
              bCustName = defaultCust.full_name;
            }

            combinedOrders.push({
              ...b,
              customer_name: bCustName,
              status: uiStatus,
              db_status: b.status
            });
          }
        });
      }

      // 3. Merge local & shared customer bookings for instantaneous live reflection
      try {
        const localCreated = JSON.parse(localStorage.getItem('coophub_demo_customer_created_requests') || '[]');
        const sharedLive = JSON.parse(localStorage.getItem('coophub_shared_live_orders') || '[]');
        const allLocal = [...localCreated, ...sharedLive];

        const existingIds = new Set(combinedOrders.map(o => o.id));
        allLocal.forEach(loc => {
          if (!loc || !loc.id) return;
          if (!isOrderForPillar(loc, pillarId, pillarProfile)) return;

          let uiStatus = loc.status || "pending";
          if (uiStatus === "assigned") uiStatus = "pending";
          if (uiStatus === "on_the_way") uiStatus = "onTheWay";
          if (uiStatus === "in_progress") uiStatus = "inProgress";

          let locCustName = (loc.customer_name && loc.customer_name !== 'Valued Customer' && loc.customer_name !== 'Coop Customer')
            ? loc.customer_name
            : (loc.customer?.full_name && loc.customer.full_name !== 'Valued Customer' ? loc.customer.full_name : null);

          if (!locCustName) {
            try {
              const demoProf = JSON.parse(localStorage.getItem('coophub_demo_profile') || '{}');
              if (demoProf.full_name && demoProf.full_name !== 'Valued Customer') locCustName = demoProf.full_name;
            } catch(e) {}
          }

          if (!locCustName) {
            const charSum = (loc.id || "").split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
            const defaultCust = KNOWN_CUSTOMERS[charSum % KNOWN_CUSTOMERS.length];
            locCustName = defaultCust.full_name;
          }

          loc.customer_name = locCustName;
          if (loc.customer) loc.customer.full_name = locCustName;

          const existingOrder = combinedOrders.find(o => 
            o.id === loc.id || 
            o.booking_code === loc.id || 
            o.booking_code === loc.booking_code || 
            (loc.db_id && o.id === loc.db_id) ||
            (loc.order_id && (o.id === loc.order_id || o.booking_code === loc.order_id))
          );
          if (existingOrder) {
            const humanCode = loc.booking_code || (String(loc.id).startsWith("REQ-") || String(loc.id).startsWith("ORD-") ? loc.id : null);
            if (humanCode) {
              existingOrder.booking_code = humanCode;
              existingOrder.order_id = humanCode;
            }
            if (existingOrder.customer_name === 'Valued Customer' || !existingOrder.customer_name) {
              existingOrder.customer_name = locCustName;
            }
            if (loc.status === 'cancelled' || loc.status === 'declined' || loc.status === 'rejected') {
              existingOrder.status = 'cancelled';
              existingOrder.db_status = 'cancelled';
              existingOrder.cancel_reason = loc.cancel_reason || existingOrder.cancel_reason;
              existingOrder.cancelled_by = loc.cancelled_by || existingOrder.cancelled_by;
              existingOrder.cancelled_at = loc.cancelled_at || existingOrder.cancelled_at;
            } else if (loc.status) {
              existingOrder.status = uiStatus;
              existingOrder.db_status = loc.status;
            }
            return;
          }

          existingIds.add(loc.id);

          const locHumanCode = loc.booking_code || (String(loc.id).startsWith("REQ-") || String(loc.id).startsWith("ORD-") ? loc.id : "REQ-" + String(loc.id).slice(0, 6).toUpperCase());

          combinedOrders.unshift({
            id: loc.id,
            booking_code: locHumanCode,
            order_id: locHumanCode,
            status: uiStatus,
            db_status: loc.status || "pending",
            customer_name: locCustName,
            customer_mobile: loc.customer_phone || loc.customer_mobile || loc.customer?.mobile || "+91 98401 23456",
            customer_email: loc.customer_email || loc.email || "customer@coophub.in",
            customer: {
              id: loc.customer_id || "cust-demo",
              full_name: locCustName,
              mobile: loc.customer_phone || loc.customer_mobile || loc.customer?.mobile || "+91 98401 23456",
              email: loc.customer_email || loc.email || "customer@coophub.in"
            },
            service_name: loc.service_name || loc.services?.name || loc.services?.name_translations?.en || "General Home Service",
            sub_service_name: loc.sub_service_name || loc.sub_services?.name || loc.sub_services?.name_translations?.en || "",
            service: {
              id: loc.service_id,
              name: loc.service_name || "General Home Service",
              category: loc.category || "Service",
              price: loc.amount || loc.total_amount || 450
            },
            total_amount: loc.total_amount || loc.amount || 450,
            base_amount: loc.amount || 450,
            service_address: [loc.address_line, loc.area, loc.city].filter(Boolean).join(", ") || "Guindy, Chennai",
            order_time_formatted: formatOrderTime(loc.created_at || new Date().toISOString()),
            landmark: loc.landmark || "",
            pincode: loc.postal_code || loc.pincode || "",
            latitude: Number(loc.latitude || loc.lat || 13.0067),
            longitude: Number(loc.longitude || loc.lng || 80.2025),
            customer_latitude: Number(loc.latitude || loc.lat || 13.0067),
            customer_longitude: Number(loc.longitude || loc.lng || 80.2025),
            photo_urls: (() => {
              const raw = loc.photo_urls || loc.attachments || loc.photos || [];
              const list = Array.isArray(raw) ? raw : (raw ? [raw] : []);
              return list.map(a => typeof a === 'object' ? (a.url || a.previewUrl) : a).filter(Boolean);
            })(),
            attachments: (() => {
              const raw = loc.attachments || loc.photo_urls || loc.photos || [];
              const list = Array.isArray(raw) ? raw : (raw ? [raw] : []);
              return list.map((att, idx) => {
                if (typeof att === "object" && att !== null) {
                  const resolvedUrl = att.url || att.previewUrl || att.dataUrl || (att.path ? `https://aqzkzaswckfoazpqeeti.supabase.co/storage/v1/object/public/request_attachments/${att.path}` : "");
                  return {
                    ...att,
                    id: att.id || `att-loc-${idx}`,
                    name: att.name || `Customer_Attachment_${idx + 1}`,
                    url: resolvedUrl,
                    previewUrl: att.previewUrl || resolvedUrl,
                    type: att.type || ((att.name || resolvedUrl).toLowerCase().includes(".pdf") ? "pdf" : "image"),
                    size: att.size || "Customer Upload",
                    uploaded_at: att.uploaded_at || "Attached"
                  };
                }
                const str = String(att);
                const isPdf = str.toLowerCase().endsWith(".pdf") || str.includes("application/pdf");
                const url = (str.startsWith("http://") || str.startsWith("https://") || str.startsWith("data:"))
                  ? str
                  : `https://aqzkzaswckfoazpqeeti.supabase.co/storage/v1/object/public/request_attachments/${str}`;
                return {
                  id: `att-loc-${idx}`,
                  name: str.startsWith("data:") ? `Customer_Photo_${idx + 1}.jpg` : (str.split("/").pop() || `Attachment_${idx + 1}`),
                  url,
                  previewUrl: url,
                  type: isPdf ? "pdf" : "image",
                  size: isPdf ? "PDF Document" : "Photo",
                  uploaded_at: "Uploaded"
                };
              });
            })(),
            scheduled_time: loc.preferred_time || loc.scheduled_time || "Flexible Time Slot",
            payment_method: "Cash on Service / UPI",
            payment_status: loc.payment_status || "Pending Completion",
            latitude: loc.latitude || 13.0067,
            longitude: loc.longitude || 80.2025,
            customer_latitude: loc.latitude || 13.0067,
            customer_longitude: loc.longitude || 80.2025,
            arrival_otp: loc.arrival_otp || "489201",
            extra_charge_status: loc.extra_charge_status || "none",
            extra_charge_amount: loc.extra_charge_amount || 0,
            created_at: loc.created_at || new Date().toISOString(),
            pillar_id: loc.pillar_id,
            raw_data: loc
          });
        });
      } catch (locErr) {
        console.warn("Local orders merge note:", locErr);
      }

      // Ensure DEMO_ORDERS are available if this is demo pillar / Raj Kumar or if combinedOrders is empty
      const targetIds = new Set();
      if (pillarId) targetIds.add(String(pillarId).toLowerCase());
      if (pillarProfile?.id) targetIds.add(String(pillarProfile.id).toLowerCase());
      if (pillarProfile?.pillar_code) targetIds.add(String(pillarProfile.pillar_code).toLowerCase());
      const isRajPillar = targetIds.has("pil-che-042") || targetIds.has("pil-che-111") || targetIds.has("c0000000-0000-0000-0000-000000000011") || isDemo;

      if (isRajPillar) {
        const existingIds = new Set(combinedOrders.map(o => o.id));
        const hasLivePending = combinedOrders.some(o => o.status === 'pending');
        DEMO_ORDERS.forEach(demoOrd => {
          // If there is already a live pending order in the dashboard, don't show the static pending demo order ORD-9843
          if (hasLivePending && demoOrd.status === 'pending') return;
          if (!existingIds.has(demoOrd.id)) {
            combinedOrders.push(demoOrd);
            existingIds.add(demoOrd.id);
          }
        });
      }
 
      // Apply local status & payment overrides for immediate cross-tab reflection
      try {
        if (typeof window !== "undefined") {
          combinedOrders.forEach(o => {
            const localStatus = localStorage.getItem(`coophub_status_${o.id}`) ||
              (o.booking_code ? localStorage.getItem(`coophub_status_${o.booking_code}`) : null) ||
              (o.order_id ? localStorage.getItem(`coophub_status_${o.order_id}`) : null);
            if (localStatus) {
              o.db_status = localStatus;
              if (localStatus === 'completed') o.status = 'completed';
              else if (localStatus === 'in_progress') o.status = 'inProgress';
              else if (localStatus === 'on_the_way') o.status = 'onTheWay';
              else if (localStatus === 'cancelled') o.status = 'cancelled';
            }
            const localPay = localStorage.getItem(`coophub_payment_status_${o.id}`) ||
              (o.booking_code ? localStorage.getItem(`coophub_payment_status_${o.booking_code}`) : null) ||
              (o.order_id ? localStorage.getItem(`coophub_payment_status_${o.order_id}`) : null);
            if (localPay === 'completed') {
              o.payment_status = 'completed';
            }
          });
        }
      } catch (e) {}

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
      pending: ['matching', 'assigned', 'accepted', 'cancelled', 'declined', 'rejected'],
      matching: ['assigned', 'pending', 'cancelled'],
      assigned: ['accepted', 'declined', 'rejected', 'cancelled', 'pending'],
      accepted: ['on_the_way', 'cancelled', 'declined', 'rejected'],
      on_the_way: ['arrived', 'cancelled'],
      arrived: ['in_progress', 'cancelled'],
      in_progress: ['completed', 'cancelled'],
      completed: [],
      cancelled: []
    };

    return allowed[normCurrent]?.includes(normNew) ?? false;
  },

  async updateOrderStatus(bookingId, status, metadata = {}) {
    // Map UI status back to DB status
    let dbStatus = status;
    if (status === "onTheWay") dbStatus = "on_the_way";
    if (status === "inProgress") dbStatus = "in_progress";
    if (status === "rejected" || status === "declined") dbStatus = "cancelled";

    const nowIso = new Date().toISOString();
    const isUuid = (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(val || ""));

    // Sanitize metadata: Supabase service_requests.pillar_id MUST be a valid UUID or omitted
    const safeMetadata = { ...metadata };
    if (safeMetadata.pillar_id) {
      if (!isUuid(safeMetadata.pillar_id)) {
        if (String(safeMetadata.pillar_id).toUpperCase() === "PIL-CHE-042" || String(safeMetadata.pillar_id).toUpperCase() === "PIL-CHE-111") {
          safeMetadata.pillar_id = "7842d4fd-ac93-4014-93ed-001c0237a36c";
        } else {
          delete safeMetadata.pillar_id; // Never crash Postgres with non-UUID string in UUID column
        }
      }
    }

    const matchesTarget = (o) => (
      o && (
        o.id === bookingId ||
        o.booking_code === bookingId ||
        o.order_id === bookingId ||
        (o.db_id && o.db_id === bookingId) ||
        (o.receipt_number && o.receipt_number === bookingId)
      )
    );

    // Resolve target database UUID dynamically
    let targetUuid = isUuid(bookingId) ? bookingId : null;
    if (!targetUuid) {
      if (bookingId === 'ORD-9842' || bookingId === 'REQ-8942') {
        targetUuid = '00000000-0000-0000-0000-000000008942';
      } else {
        try {
          const { data: matched } = await supabase
            .from("service_requests")
            .select("id")
            .or(`receipt_number.eq.${bookingId},payment_gateway_ref.eq.${bookingId},customer_description.ilike.%${bookingId}%`)
            .limit(1)
            .maybeSingle();
          if (matched?.id) targetUuid = matched.id;
        } catch (e) {}
      }
    }

    // 1. Update in DEMO_ORDERS if matched
    const match = DEMO_ORDERS.find(o => matchesTarget(o) || (targetUuid && (o.id === targetUuid || (targetUuid === '00000000-0000-0000-0000-000000008942' && o.id === 'ORD-9842'))));
    if (match) {
      match.status = status === "rejected" || status === "declined" ? "cancelled" : status;
      match.updated_at = nowIso;
      if (safeMetadata.pillar_id) match.pillar_id = safeMetadata.pillar_id;
    }

    // 2. Update in Supabase
    try {
      const updates = {
        status: dbStatus,
        updated_at: nowIso,
        ...safeMetadata,
      };

      if (targetUuid) {
        const { error: sErr } = await supabase
          .from("service_requests")
          .update(updates)
          .eq("id", targetUuid);
        if (sErr) console.warn("Supabase service_requests update error:", sErr);
      } else {
        const { error: sErr } = await supabase
          .from("service_requests")
          .update(updates)
          .or(`receipt_number.eq.${bookingId},payment_gateway_ref.eq.${bookingId},customer_description.ilike.%${bookingId}%`);
        if (sErr) console.warn("Supabase service_requests update error:", sErr);
      }

      // Also update bookings table
      try {
        if (targetUuid) {
          await supabase
            .from("bookings")
            .update({
              ...updates,
              status: dbStatus === 'in_progress' ? 'inProgress' : (dbStatus === 'on_the_way' ? 'onTheWay' : dbStatus)
            })
            .or(`id.eq.${targetUuid},booking_code.eq.${bookingId}`);
        } else {
          await supabase
            .from("bookings")
            .update({
              ...updates,
              status: dbStatus === 'in_progress' ? 'inProgress' : (dbStatus === 'on_the_way' ? 'onTheWay' : dbStatus)
            })
            .eq("booking_code", bookingId);
        }
      } catch (bErr) {}
    } catch (error) {
      console.warn("Update order status Supabase note:", error);
    }

    // 3. Update in localStorage feeds
    const relatedKeys = [
      bookingId,
      targetUuid,
      bookingId === 'ORD-9842' ? 'REQ-8942' : null,
      bookingId === 'REQ-8942' ? 'ORD-9842' : null,
      targetUuid === '00000000-0000-0000-0000-000000008942' ? 'REQ-8942' : null,
      targetUuid === '00000000-0000-0000-0000-000000008942' ? 'ORD-9842' : null
    ].filter(Boolean);

    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const sharedOrders = JSON.parse(localStorage.getItem('coophub_shared_live_orders') || '[]');
        let updatedShared = false;
        sharedOrders.forEach(o => {
          if (matchesTarget(o) || (targetUuid && (o.id === targetUuid || o.db_id === targetUuid))) {
            o.status = dbStatus;
            o.updated_at = nowIso;
            if (safeMetadata.pillar_id) o.pillar_id = safeMetadata.pillar_id;
            updatedShared = true;
          }
        });
        if (updatedShared) {
          localStorage.setItem('coophub_shared_live_orders', JSON.stringify(sharedOrders));
        }

        const custRequests = JSON.parse(localStorage.getItem('coophub_demo_customer_created_requests') || '[]');
        let updatedCust = false;
        custRequests.forEach(o => {
          if (matchesTarget(o) || (targetUuid && (o.id === targetUuid || o.db_id === targetUuid))) {
            o.status = dbStatus;
            o.updated_at = nowIso;
            if (safeMetadata.pillar_id) o.pillar_id = safeMetadata.pillar_id;
            updatedCust = true;
          }
        });
        if (updatedCust) {
          localStorage.setItem('coophub_demo_customer_created_requests', JSON.stringify(custRequests));
        }

        relatedKeys.forEach(k => {
          try {
            localStorage.setItem(`coophub_status_${k}`, dbStatus);
          } catch(e) {}
        });

        localStorage.setItem('coophub_last_order_event', JSON.stringify({
          id: bookingId,
          targetUuid,
          relatedKeys,
          action: 'status_updated',
          status: dbStatus,
          time: Date.now()
        }));
      }
    } catch (lsErr) {
      console.warn("Update order status localStorage note:", lsErr);
    }

    // 4. Multi-channel broadcast across tabs and browsers
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('coophub_orders_sync');
        bc.postMessage({
          type: 'ORDER_UPDATED',
          action: 'status_updated',
          orderId: bookingId,
          resolvedId: targetUuid,
          relatedIds: relatedKeys,
          status: dbStatus,
          uiStatus: status,
          timestamp: Date.now()
        });
        setTimeout(() => { try { bc.close(); } catch(e){} }, 500);
      }
    } catch (bcErr) {}

    // Global Supabase Realtime Broadcast (reaches other browsers like Chrome <-> Edge)
    try {
      const globalOrderChannel = supabase.channel('coophub_global_orders');
      globalOrderChannel.send({
        type: 'broadcast',
        event: 'ORDER_UPDATED',
        payload: {
          orderId: bookingId,
          targetUuid,
          relatedIds: relatedKeys,
          status: dbStatus,
          uiStatus: status,
          timestamp: Date.now()
        }
      });
    } catch (be) {}

    try {
      window.dispatchEvent(new CustomEvent('coophub_order_updated', {
        detail: { id: bookingId, targetUuid, relatedIds: relatedKeys, status: dbStatus }
      }));
      window.dispatchEvent(new CustomEvent('coophub_order_status_updated', {
        detail: { id: bookingId, targetUuid, relatedIds: relatedKeys, status: dbStatus }
      }));
    } catch (we) {}

    return { data: { id: bookingId, targetUuid, status: dbStatus }, error: null };
  },

  async cancelOrder(bookingId, reason, pillarId) {
    const fullReason = reason || "Cancelled by technician";
    const nowIso = new Date().toISOString();
    const isUuid = (val) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(val || ""));

    const matchesTarget = (o) => (
      o && (
        o.id === bookingId ||
        o.booking_code === bookingId ||
        o.order_id === bookingId ||
        (o.db_id && o.db_id === bookingId) ||
        (o.receipt_number && o.receipt_number === bookingId)
      )
    );

    // 1. Update in DEMO_ORDERS if matched
    const match = DEMO_ORDERS.find(matchesTarget);
    if (match) {
      match.status = "cancelled";
      match.cancel_reason = fullReason;
      match.cancelled_by = "pillar";
      match.cancelled_at = nowIso;
    }

    // 2. Update Supabase
    try {
      const updates = {
        status: "cancelled",
        cancel_reason: fullReason,
        escalation_reason: fullReason,
        cancelled_by: "pillar",
        cancelled_at: nowIso,
        updated_at: nowIso,
      };

      const bookingIsUuid = isUuid(bookingId);
      if (bookingIsUuid) {
        await supabase
          .from("service_requests")
          .update(updates)
          .eq("id", bookingId);

        await supabase
          .from("bookings")
          .update(updates)
          .eq("id", bookingId);
      } else {
        await supabase
          .from("service_requests")
          .update(updates)
          .or(`receipt_number.eq.${bookingId},payment_gateway_ref.eq.${bookingId},customer_description.ilike.%${bookingId}%`);

        await supabase
          .from("bookings")
          .update(updates)
          .or(`booking_code.eq.${bookingId}`);
      }
    } catch (dbErr) {
      console.warn("Cancel order Supabase update note:", dbErr);
    }

    // 3. Update localStorage feeds
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        const sharedOrders = JSON.parse(localStorage.getItem('coophub_shared_live_orders') || '[]');
        let updatedShared = false;
        sharedOrders.forEach(o => {
          if (matchesTarget(o)) {
            o.status = 'cancelled';
            o.cancel_reason = fullReason;
            o.cancelled_by = 'pillar';
            o.cancelled_at = nowIso;
            updatedShared = true;
          }
        });
        if (updatedShared) {
          localStorage.setItem('coophub_shared_live_orders', JSON.stringify(sharedOrders));
        }

        const custRequests = JSON.parse(localStorage.getItem('coophub_demo_customer_created_requests') || '[]');
        let updatedCust = false;
        custRequests.forEach(o => {
          if (matchesTarget(o)) {
            o.status = 'cancelled';
            o.cancel_reason = fullReason;
            o.cancelled_by = 'pillar';
            o.cancelled_at = nowIso;
            updatedCust = true;
          }
        });
        if (updatedCust) {
          localStorage.setItem('coophub_demo_customer_created_requests', JSON.stringify(custRequests));
        }

        localStorage.setItem('coophub_last_order_event', JSON.stringify({
          id: bookingId,
          action: 'cancelled',
          cancelled_by: 'pillar',
          reason: fullReason,
          time: Date.now()
        }));
      }
    } catch (lsErr) {
      console.warn("Cancel order localStorage note:", lsErr);
    }

    // 4. Multi-channel broadcast
    try {
      if (typeof BroadcastChannel !== 'undefined') {
        const bc = new BroadcastChannel('coophub_orders_sync');
        bc.postMessage({
          type: 'ORDER_CANCELLED',
          orderId: bookingId,
          reason: fullReason,
          cancelled_by: 'pillar',
          timestamp: Date.now()
        });
        setTimeout(() => { try { bc.close(); } catch(e){} }, 500);
      }
    } catch (bcErr) {}

    try {
      window.dispatchEvent(new CustomEvent('coophub_order_cancelled', {
        detail: { id: bookingId, reason: fullReason, cancelled_by: 'pillar' }
      }));
    } catch (we) {}

    return { success: true, data: { id: bookingId, status: 'cancelled' }, error: null };
  },

  async completeOrderAndFinalizeBill(orderId, payload) {
    try {
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(orderId || ''));
      let targetReqId = isUuid ? orderId : null;

      // Dynamically lookup the matching record in service_requests if orderId is human booking code
      if (!targetReqId) {
        try {
          const { data: matched } = await supabase
            .from("service_requests")
            .select("id, amount, extra_charge_status, extra_charge_amount, payment_gateway_ref, customer_id, pillar_id")
            .or(`receipt_number.eq.${orderId},payment_gateway_ref.eq.${orderId},customer_description.ilike.%${orderId}%`)
            .limit(1)
            .maybeSingle();
          if (matched?.id) targetReqId = matched.id;
        } catch (e) {}
      }

      // Fetch request from Supabase to check approved extra charges and amounts
      let req = null;
      if (targetReqId) {
        try {
          const res = await supabase
            .from("service_requests")
            .select("*")
            .eq("id", targetReqId)
            .maybeSingle();
          req = res.data;
        } catch (e) {}
      }

      const humanCode = req?.receipt_number || req?.payment_gateway_ref || (orderId !== targetReqId ? orderId : null);

      const baseAmount = Number(payload.amount || payload.service_charge || req?.amount || 350);
      const isExtraApproved = req?.extra_charge_status === 'accepted' || payload.extra_charge_status === 'accepted';
      const extraAmount = Number(payload.extra_charge_amount || (payload.materials_parts ? Number(payload.materials_parts) + Number(payload.additional_charges || 0) : 0) || req?.extra_charge_amount || 0);
      const taxAmount = Number(payload.gst_amount) || Math.round((baseAmount + extraAmount) * 0.18 * 100) / 100;
      const totalAmount = Number(payload.final_amount) || Math.round((baseAmount + extraAmount + taxAmount) * 100) / 100;
      const nowIso = new Date().toISOString();

      // Only mark payment completed if explicitly prepaid or confirmed; otherwise it remains 'pending'
      const isAlreadyPrepaid = req?.payment_status === 'completed' && req?.payment_method !== 'HAND CASH' && req?.payment_gateway_ref && req?.payment_gateway_ref !== 'HAND_CASH';
      const paymentStatus = isAlreadyPrepaid ? 'completed' : 'pending';
      const paymentGatewayRef = paymentStatus === 'completed' ? (req?.payment_gateway_ref || null) : null;

      // Note: payment_method is NOT a column on service_requests; payment_status & payment_gateway_ref are.
      const updates = {
        status: "completed",
        final_amount: totalAmount,
        total_amount: totalAmount,
        service_charge: baseAmount,
        subtotal: baseAmount + extraAmount,
        gst_amount: taxAmount,
        extra_charge_amount: extraAmount,
        extra_charge_reason: payload.extra_charge_reason || (payload.work_summary ? `Work Done: ${payload.work_summary}` : null) || req?.extra_charge_reason || null,
        extra_charge_status: extraAmount > 0 ? 'accepted' : 'none',
        payment_status: paymentStatus,
        payment_gateway_ref: paymentGatewayRef,
        completed_at: nowIso,
        updated_at: nowIso
      };

      // 1. Update in service_requests directly using resolved UUID or booking code
      let sData = null;
      try {
        if (targetReqId) {
          const { data, error: sErr } = await supabase
            .from("service_requests")
            .update(updates)
            .eq("id", targetReqId)
            .select()
            .maybeSingle();
          sData = data;
          if (sErr) console.warn("Supabase complete service_requests note:", sErr?.message);
        }
        if (!sData && orderId) {
          const { data, error: sErr } = await supabase
            .from("service_requests")
            .update(updates)
            .or(`receipt_number.eq.${orderId},payment_gateway_ref.eq.${orderId},customer_description.ilike.%${orderId}%`)
            .select()
            .maybeSingle();
          sData = data;
          if (sErr) console.warn("Supabase complete service_requests fallback note:", sErr?.message);
        }
      } catch (e) {
        console.warn("Supabase complete service_requests exception:", e);
      }

      // 2. Update in bookings if applicable
      try {
        if (isUuid) {
          await supabase.from("bookings").update(updates).eq("id", orderId);
        } else {
          await supabase.from("bookings").update(updates).eq("booking_code", orderId);
        }
      } catch (e) {}

      // 3. Create or update authoritative invoice in invoices table softly
      try {
        const invNumber = `INV-${String(orderId).replace(/[^0-9a-zA-Z]/g, '').slice(0, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`;
        const invoicePayload = {
          request_id: targetReqId,
          booking_id: isUuid ? orderId : null,
          invoice_number: invNumber,
          customer_id: sData?.customer_id || req?.customer_id || null,
          pillar_id: sData?.pillar_id || req?.pillar_id || null,
          base_amount: baseAmount,
          extra_charges: extraAmount,
          tax_amount: taxAmount,
          total_amount: totalAmount,
          currency: 'INR',
          invoice_status: paymentStatus === 'completed' ? 'paid' : 'pending',
          payment_method: paymentStatus === 'completed' ? (payload.payment_method || req?.payment_method || null) : null
        };

        const { data: exInv } = await supabase.from('invoices').select('id').eq('request_id', targetReqId).maybeSingle();
        if (exInv) {
          await supabase.from('invoices').update(invoicePayload).eq('id', exInv.id);
        } else {
          await supabase.from('invoices').insert([invoicePayload]);
        }
      } catch (ie) {
        console.warn("Invoice generation note:", ie?.message);
      }

      // 4. Update in DEMO_ORDERS
      const match = DEMO_ORDERS.find(o => o.id === orderId || o.booking_code === orderId || (orderId === 'REQ-8942' && o.id === 'ORD-9842'));
      if (match) {
        match.status = "completed";
        match.payment_status = paymentStatus;
        match.final_amount = totalAmount;
        match.extra_charge_amount = extraAmount;
        match.extra_charge_reason = payload.extra_charge_reason;
        if (payload.work_summary) match.work_summary = payload.work_summary;
      }

      // 5. Update localStorage status overrides across all related IDs
      const isDemoOrder = orderId === 'REQ-8942' || orderId === 'ORD-9842' || targetReqId === '00000000-0000-0000-0000-000000008942';
      const relatedIds = [
        orderId,
        targetReqId !== '00000000-0000-0000-0000-000000008942' ? targetReqId : (isDemoOrder ? targetReqId : null),
        isDemoOrder ? 'REQ-8942' : null,
        isDemoOrder ? 'ORD-9842' : null
      ].filter(Boolean);
      relatedIds.forEach(idKey => {
        try {
          localStorage.setItem(`coophub_status_${idKey}`, 'completed');
          localStorage.setItem(`coophub_payment_status_${idKey}`, paymentStatus);
          if (payload.work_summary) {
            localStorage.setItem(`coophub_work_summary_${idKey}`, payload.work_summary);
          }
          if (paymentStatus === 'completed' && payload.payment_method) {
            localStorage.setItem(`coophub_payment_method_${idKey}`, payload.payment_method);
          } else {
            localStorage.removeItem(`coophub_payment_method_${idKey}`);
          }
        } catch (e) {}
      });

      // 6. Update local customer created requests and shared live orders
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          const sharedOrders = JSON.parse(localStorage.getItem('coophub_shared_live_orders') || '[]');
          sharedOrders.forEach(o => {
            if (o.id === orderId || o.booking_code === orderId || (isDemoOrder && (o.id === 'ORD-9842' || o.id === 'REQ-8942'))) {
              o.status = 'completed';
              o.payment_status = paymentStatus;
              if (payload.work_summary) o.work_summary = payload.work_summary;
              if (paymentStatus === 'completed' && payload.payment_method) {
                o.payment_method = payload.payment_method;
              } else {
                delete o.payment_method;
              }
              o.final_amount = totalAmount;
              o.completed_at = nowIso;
            }
          });
          localStorage.setItem('coophub_shared_live_orders', JSON.stringify(sharedOrders));

          const custRequests = JSON.parse(localStorage.getItem('coophub_demo_customer_created_requests') || '[]');
          custRequests.forEach(o => {
            if (o.id === orderId || o.booking_code === orderId || (isDemoOrder && (o.id === 'ORD-9842' || o.id === 'REQ-8942'))) {
              o.status = 'completed';
              o.payment_status = paymentStatus;
              if (payload.work_summary) o.work_summary = payload.work_summary;
              if (paymentStatus === 'completed' && payload.payment_method) {
                o.payment_method = payload.payment_method;
              } else {
                delete o.payment_method;
              }
              o.final_amount = totalAmount;
              o.completed_at = nowIso;
            }
          });
          localStorage.setItem('coophub_demo_customer_created_requests', JSON.stringify(custRequests));

          // Also cache invoice locally for instant offline/demo reflection
          const invoiceObj = {
            id: `INV-${String(orderId).slice(0, 8)}`,
            request_id: targetReqId,
            invoice_number: `INV-${String(orderId).replace(/[^0-9a-zA-Z]/g, '').slice(0, 6).toUpperCase()}-001`,
            base_amount: baseAmount,
            extra_charges: extraAmount,
            tax_amount: taxAmount,
            total_amount: totalAmount,
            invoice_status: paymentStatus === 'completed' ? 'paid' : 'pending',
            payment_method: paymentStatus === 'completed' ? (payload.payment_method || 'HAND CASH') : null,
            work_summary: payload.work_summary || null
          };
          localStorage.setItem(`coophub_invoice_${orderId}`, JSON.stringify(invoiceObj));
          if (targetReqId && (targetReqId !== '00000000-0000-0000-0000-000000008942' || isDemoOrder)) {
            localStorage.setItem(`coophub_invoice_${targetReqId}`, JSON.stringify(invoiceObj));
          }
          if (isDemoOrder) {
            localStorage.setItem('coophub_invoice_REQ-8942', JSON.stringify(invoiceObj));
            localStorage.setItem('coophub_invoice_ORD-9842', JSON.stringify(invoiceObj));
          }

          localStorage.setItem('coophub_last_order_event', JSON.stringify({
            id: orderId,
            action: 'completed',
            status: 'completed',
            payment_status: paymentStatus,
            work_summary: payload.work_summary || null,
            final_amount: totalAmount,
            time: Date.now()
          }));
        }
      } catch (lsErr) {
        console.warn("completeOrder localStorage note:", lsErr);
      }

      // 7. Send system event in chat
      try {
        const { jobCommunicationService } = await import('../communication/jobCommunicationService.js');
        await jobCommunicationService.sendMessage({
          requestId: orderId,
          senderType: 'system',
          content: `🎉 Service completed! Final bill of ₹${totalAmount} generated. Please review work summary and proceed to payment.`,
          messageType: 'SYSTEM',
          metadata: { event_type: 'SERVICE_COMPLETED', final_amount: totalAmount, work_summary: payload.work_summary }
        });
      } catch(me) {}

      // 8. Multi-channel broadcast across tabs and windows
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('coophub_orders_sync');
          bc.postMessage({
            type: 'ORDER_COMPLETED',
            status: 'completed',
            payment_status: paymentStatus,
            work_summary: payload.work_summary,
            extra_charge_reason: payload.extra_charge_reason,
            orderId,
            targetReqId,
            finalAmount: totalAmount,
            timestamp: Date.now()
          });
          setTimeout(() => { try { bc.close(); } catch(e){} }, 500);
        }
      } catch (bcErr) {}

      // Global Supabase Realtime Broadcast (reaches other browsers like Chrome <-> Edge instantly)
      try {
        const globalOrderChannel = supabase.channel('coophub_global_orders');
        globalOrderChannel.send({
          type: 'broadcast',
          event: 'ORDER_COMPLETED',
          payload: {
            orderId,
            targetReqId,
            humanCode,
            status: 'completed',
            payment_status: paymentStatus,
            work_summary: payload.work_summary,
            extra_charge_reason: payload.extra_charge_reason,
            final_amount: totalAmount,
            subtotal: baseAmount + extraAmount,
            service_charge: baseAmount,
            extra_charge_amount: extraAmount,
            gst_amount: taxAmount,
            timestamp: Date.now()
          }
        });
      } catch (be) {}

      try {
        window.dispatchEvent(new CustomEvent('coophub_order_updated', {
          detail: { id: orderId, status: 'completed', final_amount: totalAmount }
        }));
        window.dispatchEvent(new CustomEvent('coophub_order_status_updated', {
          detail: { id: orderId, status: 'completed', final_amount: totalAmount }
        }));
      } catch (we) {}

      // 9. If booking was already prepaid, trigger automatic PF contribution
      if (sData?.payment_status === 'completed' || req?.payment_status === 'completed') {
        try {
          const { pfContributionService } = await import('../welfare/pfContributionService.js');
          await pfContributionService.processBookingPFContribution({
            pillarId: sData?.pillar_id || req?.pillar_id,
            bookingId: orderId,
            baseAmount: baseAmount,
            isPrepaid: true
          });
        } catch (pfErr) {}
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

      // Check service_requests for live arrival_otp by ID
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(bookingId));

      let sData = null;
      try {
        let sQuery = supabase.from("service_requests").select("id, arrival_otp, otp_attempts, status");
        if (isUuid) {
          sQuery = sQuery.eq("id", bookingId);
        } else {
          sQuery = sQuery.or(`receipt_number.eq.${bookingId},payment_gateway_ref.eq.${bookingId},customer_description.ilike.%${bookingId}%`);
        }
        const res = await sQuery.maybeSingle();
        sData = res.data;
      } catch (e) {}

      let bData = null;
      try {
        let bQuery = supabase.from("bookings").select("id, arrival_otp, otp_attempts, status, booking_code");
        if (isUuid) {
          bQuery = bQuery.eq("id", bookingId);
        } else {
          bQuery = bQuery.eq("booking_code", bookingId);
        }
        const res = await bQuery.maybeSingle();
        bData = res.data;
      } catch (e) {}

      const realOtp = sData?.arrival_otp || bData?.arrival_otp;
      const currentAttempts = (sData?.otp_attempts || bData?.otp_attempts || 0);

      // Attempt limit protection (max 5 tries)
      if (currentAttempts >= 5) {
        return { success: false, error: "Too many failed OTP attempts. Please contact cooperative support." };
      }

      // Compute deterministic fallback OTP matching Customer Portal
      const deterministicOtp = String(
        Math.abs(
          String(bookingId)
            .split("-")
            .reduce((acc, part) => acc + (parseInt(part, 16) || 0), 489201) % 900000 + 100000
        )
      );

      // Valid OTP if matches:
      // 1. DB arrival_otp
      // 2. Customer Portal display fallback PIN '489201'
      // 3. Demo testing PIN '123456'
      // 4. Deterministic algorithm OTP
      const isValid = (realOtp && realOtp.trim() === cleanEntered) ||
                      (cleanEntered === "489201") ||
                      (cleanEntered === "123456") ||
                      (cleanEntered === deterministicOtp);

      if (isValid) {
        const resolvedId = sData?.id || bData?.id || bookingId;
        const nowIso = new Date().toISOString();

        // Valid OTP -> Transition to in_progress & record start time
        await this.updateOrderStatus(resolvedId, "in_progress", {
          started_at: nowIso,
          arrived_at: nowIso,
          arrival_otp: cleanEntered,
          otp_attempts: 0
        });

        const relatedIds = [
          bookingId,
          resolvedId,
          sData?.id,
          sData?.booking_code,
          bData?.id,
          bData?.booking_code,
          bookingId === 'ORD-9842' || resolvedId === 'ORD-9842' ? 'REQ-8942' : null,
          bookingId === 'REQ-8942' || resolvedId === 'REQ-8942' ? 'ORD-9842' : null
        ].filter(Boolean);

        // Store status overrides in localStorage for instant synchronization across tabs
        relatedIds.forEach(idKey => {
          try {
            localStorage.setItem(`coophub_status_${idKey}`, 'in_progress');
          } catch (e) {}
        });

        // Also sync service_requests directly by UUID
        try {
          const targetReqId = sData?.id || (isUuid ? bookingId : null);
          if (targetReqId) {
            await supabase
              .from("service_requests")
              .update({
                status: "in_progress",
                arrival_otp: cleanEntered,
                otp_attempts: 0,
                arrived_at: nowIso,
                started_at: nowIso,
                updated_at: nowIso
              })
              .eq("id", targetReqId);
          }
        } catch (e) {}

        // Also update local storage if cached orders exist
        try {
          const raw = localStorage.getItem("coophub_pillar_orders");
          if (raw) {
            const list = JSON.parse(raw);
            const updated = list.map(o => (relatedIds.includes(o.id) || relatedIds.includes(o.booking_code)) ? {
              ...o,
              status: "inProgress",
              db_status: "in_progress",
              arrived_at: nowIso,
              started_at: nowIso
            } : o);
            localStorage.setItem("coophub_pillar_orders", JSON.stringify(updated));
          }
        } catch (e) {}

        // Update shared live orders and customer created requests
        try {
          const sharedOrders = JSON.parse(localStorage.getItem('coophub_shared_live_orders') || '[]');
          let sharedChanged = false;
          sharedOrders.forEach(o => {
            if (relatedIds.includes(o.id) || relatedIds.includes(o.booking_code)) {
              o.status = 'in_progress';
              o.db_status = 'in_progress';
              o.arrived_at = nowIso;
              o.started_at = nowIso;
              sharedChanged = true;
            }
          });
          if (sharedChanged) {
            localStorage.setItem('coophub_shared_live_orders', JSON.stringify(sharedOrders));
          }
        } catch (e) {}

        try {
          const custRequests = JSON.parse(localStorage.getItem('coophub_demo_customer_created_requests') || '[]');
          let custChanged = false;
          custRequests.forEach(o => {
            if (relatedIds.includes(o.id) || relatedIds.includes(o.booking_code)) {
              o.status = 'in_progress';
              o.arrived_at = nowIso;
              o.started_at = nowIso;
              custChanged = true;
            }
          });
          if (custChanged) {
            localStorage.setItem('coophub_demo_customer_created_requests', JSON.stringify(custRequests));
          }
        } catch (e) {}

        // Set last order event for storage listener
        try {
          localStorage.setItem('coophub_last_order_event', JSON.stringify({
            id: resolvedId,
            relatedIds,
            action: 'otp_verified',
            status: 'in_progress',
            time: Date.now()
          }));
        } catch (e) {}

        // Broadcast cross-tab updates
        try {
          if (typeof BroadcastChannel !== 'undefined') {
            const bc = new BroadcastChannel('coophub_orders_sync');
            bc.postMessage({
              type: 'ORDER_STATUS_CHANGED',
              action: 'otp_verified',
              orderId: resolvedId,
              relatedIds,
              status: 'in_progress',
              timestamp: Date.now()
            });
            setTimeout(() => { try { bc.close(); } catch(e){} }, 500);
          }
        } catch (bcErr) {}

        try {
          window.dispatchEvent(new CustomEvent('coophub_order_updated', {
            detail: { id: resolvedId, relatedIds, status: 'in_progress' }
          }));
          window.dispatchEvent(new CustomEvent('coophub_order_status_updated', {
            detail: { id: resolvedId, relatedIds, status: 'in_progress' }
          }));
        } catch (we) {}

        return { success: true, error: null };
      }

      // Increment attempt counter on mismatch
      if (sData?.id) {
        await supabase
          .from("service_requests")
          .update({ otp_attempts: currentAttempts + 1 })
          .eq("id", sData.id);
      }

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
      const nowIso = new Date().toISOString();
      const updates = {
        extra_charge_amount: numAmount,
        extra_charge_reason: reason,
        extra_charge_status: "pending",
        updated_at: nowIso
      };

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(bookingId));
      let targetReqId = isUuid ? bookingId : null;

      if (!targetReqId) {
        try {
          const { data: matched } = await supabase
            .from("service_requests")
            .select("id")
            .or(`receipt_number.eq.${bookingId},payment_gateway_ref.eq.${bookingId},customer_description.ilike.%${bookingId}%`)
            .limit(1)
            .maybeSingle();
          if (matched?.id) targetReqId = matched.id;
        } catch (e) {}
      }

      // 1. Update service_requests so customer immediately gets realtime prompt
      if (targetReqId) {
        try {
          await supabase
            .from("service_requests")
            .update(updates)
            .eq("id", targetReqId);
        } catch (e) {}
      }

      // 2. Update bookings
      if (isUuid) {
        await supabase
          .from("bookings")
          .update(updates)
          .eq("id", bookingId);
      } else {
        await supabase
          .from("bookings")
          .update(updates)
          .eq("booking_code", bookingId);
      }

      // 3. Update DEMO_ORDERS in-memory
      const match = DEMO_ORDERS.find(o => o.id === bookingId || o.booking_code === bookingId || (bookingId === 'REQ-8942' && o.id === 'ORD-9842'));
      if (match) {
        match.extra_charges = numAmount;
        match.extra_charge_amount = numAmount;
        match.extra_charge_reason = reason;
        match.extra_charge_status = "pending";
      }

      // 4. Update in localStorage feeds
      try {
        if (typeof window !== "undefined" && window.localStorage) {
          localStorage.setItem(`coophub_extra_charge_${bookingId}`, JSON.stringify(updates));
          if (bookingId === 'ORD-9842' || bookingId === 'REQ-8942') {
            localStorage.setItem('coophub_extra_charge_REQ-8942', JSON.stringify(updates));
            localStorage.setItem('coophub_extra_charge_ORD-9842', JSON.stringify(updates));
          }

          const sharedOrders = JSON.parse(localStorage.getItem('coophub_shared_live_orders') || '[]');
          sharedOrders.forEach(o => {
            if (o.id === bookingId || o.booking_code === bookingId || (bookingId === 'REQ-8942' && o.id === 'ORD-9842')) {
              o.extra_charge_amount = numAmount;
              o.extra_charge_reason = reason;
              o.extra_charge_status = "pending";
            }
          });
          localStorage.setItem('coophub_shared_live_orders', JSON.stringify(sharedOrders));
        }
      } catch (e) {}

      // 5. Broadcast to Customer Portal
      try {
        if (typeof BroadcastChannel !== 'undefined') {
          const bc = new BroadcastChannel('coophub_orders_sync');
          bc.postMessage({
            type: 'EXTRA_CHARGE_REQUESTED',
            orderId: bookingId,
            amount: numAmount,
            reason,
            status: 'pending',
            timestamp: Date.now()
          });
          setTimeout(() => { try { bc.close(); } catch(e){} }, 500);
        }
      } catch (bcErr) {}

      try {
        window.dispatchEvent(new CustomEvent('coophub_extra_charge_requested', {
          detail: { id: bookingId, amount: numAmount, reason }
        }));
      } catch (we) {}

      return { data: sData || updates, error: sErr };
    } catch (error) {
      console.error("Request extra charge error:", error);
      return { data: null, error };
    }
  },

  // Realtime Live Subscription for incoming Customer bookings and job status updates
  subscribeToPillarOrders(pillarId, callback) {
    // 1. Supabase Realtime Postgres Changes Subscription
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
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'invoices' },
        (payload) => {
          if (callback) callback(payload);
        }
      )
      .subscribe();

    // 1.5 Global Realtime Broadcast listener (Chrome <-> Edge cross-browser sync)
    const globalOrderSub = supabase
      .channel(`pillar-global-orders-${Date.now()}`)
      .on('broadcast', { event: 'ORDER_PAID' }, (e) => { if (callback) callback(e.payload); })
      .on('broadcast', { event: 'ORDER_COMPLETED' }, (e) => { if (callback) callback(e.payload); })
      .on('broadcast', { event: 'ORDER_UPDATED' }, (e) => { if (callback) callback(e.payload); })
      .subscribe();

    // 2. Cross-tab BroadcastChannel for instantaneous reflection across browser tabs
    let bc = null;
    try {
      if (typeof window !== "undefined" && typeof BroadcastChannel !== "undefined") {
        bc = new BroadcastChannel("coophub_orders_sync");
        bc.onmessage = (event) => {
          if (callback) callback(event.data);
        };
      }
    } catch (e) {}

    // 3. Storage event listener (captures changes to localStorage from other tabs/windows)
    const handleStorage = (e) => {
      if (
        e.key === "coophub_demo_customer_created_requests" ||
        e.key === "coophub_shared_live_orders" ||
        e.key === "coophub_last_order_event"
      ) {
        if (callback) callback({ eventType: "STORAGE_SYNC", key: e.key });
      }
    };
    if (typeof window !== "undefined") {
      window.addEventListener("storage", handleStorage);
    }

    // 4. Custom Window Event listeners (same window cross-component events)
    const handleOrderCreated = (e) => {
      if (callback) callback({ eventType: "LOCAL_ORDER_CREATED", detail: e.detail });
    };
    const handleOrderCancelled = (e) => {
      if (callback) callback({ eventType: "LOCAL_ORDER_CANCELLED", detail: e.detail });
    };
    const handleOrderUpdated = (e) => {
      if (callback) callback({ eventType: "LOCAL_ORDER_UPDATED", detail: e.detail });
    };

    if (typeof window !== "undefined") {
      window.addEventListener("coophub_order_created", handleOrderCreated);
      window.addEventListener("coophub_order_cancelled", handleOrderCancelled);
      window.addEventListener("coophub_order_updated", handleOrderUpdated);
    }

    return {
      unsubscribe: () => {
        supabase.removeChannel(channel);
        if (globalOrderSub) {
          try { supabase.removeChannel(globalOrderSub); } catch(ge) {}
        }
        if (bc) {
          try { bc.close(); } catch (bce) {}
        }
        if (typeof window !== "undefined") {
          window.removeEventListener("storage", handleStorage);
          window.removeEventListener("coophub_order_created", handleOrderCreated);
          window.removeEventListener("coophub_order_cancelled", handleOrderCancelled);
          window.removeEventListener("coophub_order_updated", handleOrderUpdated);
        }
      }
    };
  }
};
