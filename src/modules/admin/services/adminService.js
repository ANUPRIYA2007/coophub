import { supabase } from "../../../lib/supabase";

const isDemoMode = () => {
  return localStorage.getItem("coophub_demo_admin") === "true" || localStorage.getItem("coophub_demo_user") === "true";
};

// 🧪 DEMO DATASETS (Only served when in Demo Mode)
const DEMO_STATS = {
  totalPillars: 126,
  activePillars: 84,
  pendingPillars: 12,
  activeRequests: 18,
  totalRevenue: 238500,
  openTickets: 3
};

const DEMO_PILLARS = [
  {
    id: "p-1",
    pillar_code: "PIL-CHE-042",
    full_name: "Senthil Kumar",
    mobile: "+91 98401 23456",
    email: "senthil@coophub.in",
    main_services: ["Electrician", "AC Repair"],
    service_area: ["Guindy", "Velachery", "Adyar"],
    status: "verified",
    is_available: true,
    experience_years: "6",
    created_at: new Date(Date.now() - 30 * 86400000).toISOString()
  },
  {
    id: "p-2",
    pillar_code: "PIL-CHE-019",
    full_name: "Ramesh Kannan",
    mobile: "+91 98840 54321",
    email: "ramesh.k@coophub.in",
    main_services: ["Plumbing & Motors"],
    service_area: ["T. Nagar", "Kodambakkam", "Nungambakkam"],
    status: "verified",
    is_available: true,
    experience_years: "8",
    created_at: new Date(Date.now() - 45 * 86400000).toISOString()
  },
  {
    id: "p-3",
    pillar_code: "PIL-CHE-088",
    full_name: "Kavitha Sundar",
    mobile: "+91 97910 88776",
    email: "kavitha.s@coophub.in",
    main_services: ["Appliance & AC Repair"],
    service_area: ["Anna Nagar", "Kilpauk", "Shenoy Nagar"],
    status: "verified",
    is_available: false,
    experience_years: "4",
    created_at: new Date(Date.now() - 60 * 86400000).toISOString()
  },
  {
    id: "p-4",
    pillar_code: "PIL-CHE-104",
    full_name: "Murugan V.",
    mobile: "+91 91760 99887",
    email: "murugan.v@coophub.in",
    main_services: ["Deep Home Cleaning"],
    service_area: ["Tambaram", "Chromepet", "Pallavaram"],
    status: "pending_review",
    is_available: false,
    experience_years: "3",
    created_at: new Date(Date.now() - 2 * 86400000).toISOString()
  },
  {
    id: "p-5",
    pillar_code: "PIL-CHE-112",
    full_name: "Anand Raj",
    mobile: "+91 94440 33221",
    email: "anand.raj@coophub.in",
    main_services: ["Electrician"],
    service_area: ["Mylapore", "Mandaveli", "Alwarpet"],
    status: "verified",
    is_available: true,
    experience_years: "5",
    created_at: new Date(Date.now() - 15 * 86400000).toISOString()
  }
];

const DEMO_REQUESTS = [
  {
    id: "req-1",
    order_code: "ORD-9842",
    customer_name: "Meenakshi Sundaram",
    customer_phone: "+91 98401 23456",
    customer_address: "Flat 4B, Shanthi Apts, Guindy, Chennai",
    service_name: "Ceiling Fan & Switchboard Wiring",
    category: "Electrician",
    amount: 450,
    final_amount: 450,
    status: "in_progress",
    payment_status: "paid",
    location_name: "Guindy Hub",
    pillar: { full_name: "Senthil Kumar", pillar_code: "PIL-CHE-042", mobile: "+91 98401 23456" },
    scheduled_at: new Date().toISOString()
  },
  {
    id: "req-2",
    order_code: "ORD-9843",
    customer_name: "Karthik Rajan",
    customer_phone: "+91 94440 98765",
    customer_address: "Plot 12, 2nd Main Road, Velachery, Chennai",
    service_name: "Main Power MCB Tripping Inspection",
    category: "Electrician",
    amount: 650,
    final_amount: 650,
    status: "pending",
    payment_status: "pending",
    location_name: "Velachery Hub",
    pillar: null,
    scheduled_at: new Date().toISOString()
  },
  {
    id: "req-3",
    order_code: "ORD-9839",
    customer_name: "Suresh Balaji",
    customer_phone: "+91 98841 77665",
    customer_address: "88, Usman Road, T. Nagar, Chennai",
    service_name: "Bathroom Pipe Leak & Tap Fitting",
    category: "Plumbing",
    amount: 550,
    final_amount: 550,
    status: "assigned",
    payment_status: "paid",
    location_name: "T. Nagar Hub",
    pillar: { full_name: "Ramesh Kannan", pillar_code: "PIL-CHE-019", mobile: "+91 98840 54321" },
    scheduled_at: new Date().toISOString()
  },
  {
    id: "req-4",
    order_code: "ORD-9801",
    customer_name: "Deepak S.",
    customer_phone: "+91 98840 11223",
    customer_address: "18, Gandhi Nagar 1st Main Rd, Adyar, Chennai",
    service_name: "AC Power Point & 16A Socket",
    category: "Electrician",
    amount: 850,
    final_amount: 850,
    status: "completed",
    payment_status: "paid",
    location_name: "Adyar Hub",
    pillar: { full_name: "Senthil Kumar", pillar_code: "PIL-CHE-042", mobile: "+91 98401 23456" },
    scheduled_at: new Date(Date.now() - 86400000).toISOString()
  }
];

export const adminService = {
  // ==========================================
  // 1. DASHBOARD STATS
  // ==========================================
  async getDashboardStats() {
    // 🔒 REAL MODE: Query live Supabase data with 0 mock numbers
    try {
      const { data: pillars, error: pillarsError } = await supabase
        .from('pillar_profiles')
        .select('id, status, is_available');

      let totalPillars = pillars?.length || 0;
      let activePillars = pillars?.filter(p => p.status === 'verified' || p.is_available === true).length || 0;
      let pendingPillars = pillars?.filter(p => p.status === 'pending_review' || !p.status).length || 0;

      let activeRequests = 0;
      let totalRevenue = 0;
      try {
        const { data: requests } = await supabase
          .from('service_requests')
          .select('id, status, amount, final_amount');
        if (requests) {
          activeRequests = requests.filter(r => r.status === 'in_progress' || r.status === 'assigned' || r.status === 'pending').length;
          totalRevenue = requests
            .filter(r => r.status === 'completed')
            .reduce((sum, r) => sum + Number(r.final_amount || r.amount || 0), 0);
        }
      } catch (e) {
        console.log("Service requests count error:", e);
      }

      let openTickets = 0;
      try {
        const { data: tickets } = await supabase
          .from('support_tickets')
          .select('id, status')
          .in('status', ['open', 'in_progress']);
        openTickets = tickets?.length || 0;
      } catch (e) {
        console.log("Tickets count error:", e);
      }

      // If in demo mode and database is fresh/empty, return demo stats
      if (isDemoMode() && totalPillars === 0 && activeRequests === 0) {
        return DEMO_STATS;
      }

      return {
        totalPillars,
        activePillars,
        pendingPillars,
        activeRequests,
        totalRevenue,
        openTickets
      };
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      if (isDemoMode()) return DEMO_STATS;
      return { totalPillars: 0, activePillars: 0, pendingPillars: 0, activeRequests: 0, totalRevenue: 0, openTickets: 0 };
    }
  },

  // ==========================================
  // 2. PILLAR MANAGEMENT
  // ==========================================
  async getAllPillars() {
    try {
      const { data, error } = await supabase
        .from('pillar_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if ((!data || data.length === 0) && isDemoMode()) {
        return DEMO_PILLARS;
      }
      return data || [];
    } catch (error) {
      console.error("Error fetching all pillars:", error);
      if (isDemoMode()) return DEMO_PILLARS;
      return [];
    }
  },

  async getPillarById(pillarId) {
    try {
      const { data, error } = await supabase
        .from('pillar_profiles')
        .select('*')
        .eq('id', pillarId)
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error(`Error fetching pillar ${pillarId}:`, error);
      if (isDemoMode()) {
        return DEMO_PILLARS.find(p => p.id === pillarId || p.pillar_code === pillarId) || DEMO_PILLARS[0];
      }
      return null;
    }
  },

  async updatePillarStatus(pillarId, status) {
    try {
      const { data, error } = await supabase
        .from('pillar_profiles')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', pillarId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error updating pillar status:", error);
      return { success: false, error: error.message };
    }
  },

  async searchPillars(searchTerm) {
    try {
      const { data, error } = await supabase
        .from('pillar_profiles')
        .select('*')
        .or(`full_name.ilike.%${searchTerm}%,pillar_code.ilike.%${searchTerm}%,mobile.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if ((!data || data.length === 0) && isDemoMode()) {
        return DEMO_PILLARS.filter(p => 
          p.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
          p.pillar_code.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }
      return data || [];
    } catch (error) {
      console.error("Error searching pillars:", error);
      return [];
    }
  },

  // ==========================================
  // 3. SERVICE REQUESTS MANAGEMENT
  // ==========================================
  async getServiceRequests(statusFilter = 'all') {
    try {
      let query = supabase
        .from('service_requests')
        .select(`
          *,
          pillar:pillar_profiles(id, full_name, pillar_code, mobile)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      if ((!data || data.length === 0) && isDemoMode()) {
        if (statusFilter && statusFilter !== 'all') {
          return DEMO_REQUESTS.filter(r => r.status === statusFilter);
        }
        return DEMO_REQUESTS;
      }
      return data || [];
    } catch (error) {
      console.error("Error fetching service requests:", error);
      if (isDemoMode()) return DEMO_REQUESTS;
      return [];
    }
  },

  async updateServiceRequest(requestId, updates) {
    try {
      const { data, error } = await supabase
        .from('service_requests')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error updating service request:", error);
      return { success: false, error: error.message };
    }
  },

  // ==========================================
  // 4. LIVE TRACKING & TELEMETRY
  // ==========================================
  async getPillarsLiveTracking() {
    try {
      const { data, error } = await supabase
        .from('pillar_profiles')
        .select('id, full_name, pillar_code, mobile, service_area, main_services, is_available, status, current_lat, current_lng, last_active_at')
        .order('is_available', { ascending: false });

      if (error) throw error;
      if ((!data || data.length === 0) && isDemoMode()) {
        return DEMO_PILLARS.map((p, idx) => ({
          ...p,
          current_lat: 13.0067 + (idx * 0.015),
          current_lng: 80.2025 + (idx * 0.012),
          last_active_at: new Date().toISOString()
        }));
      }
      return data || [];
    } catch (error) {
      console.error("Error fetching live tracking data:", error);
      return [];
    }
  },

  // ==========================================
  // 5. BROADCAST & MESSAGES
  // ==========================================
  async getBroadcastMessages() {
    try {
      const { data, error } = await supabase
        .from('broadcast_messages')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching broadcast messages:", error);
      return [];
    }
  },

  async sendBroadcastMessage(messageData) {
    try {
      const { data, error } = await supabase
        .from('broadcast_messages')
        .insert([{
          title: messageData.title,
          message: messageData.message,
          category: messageData.category || 'all',
          priority: messageData.priority || 'normal',
          target_audience: messageData.target_audience || 'all_pillars',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error sending broadcast message:", error);
      return { success: false, error: error.message };
    }
  },

  // ==========================================
  // 6. SUPPORT TICKETS
  // ==========================================
  async getSupportTickets(statusFilter = 'all') {
    try {
      let query = supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      return [];
    }
  },

  async updateTicketStatus(ticketId, status, adminResponse = null) {
    try {
      const updates = {
        status,
        updated_at: new Date().toISOString()
      };
      if (adminResponse) {
        updates.admin_response = adminResponse;
      }
      if (status === 'resolved') {
        updates.resolved_at = new Date().toISOString();
      }

      const { data, error } = await supabase
        .from('support_tickets')
        .update(updates)
        .eq('id', ticketId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error updating support ticket:", error);
      return { success: false, error: error.message };
    }
  },

  // ==========================================
  // 7. ADMIN SETTINGS
  // ==========================================
  async getAdminSettings() {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .limit(1)
        .maybeSingle();

      if (error) throw error;
      return data || {
        commission_rate: 8.5,
        emergency_contact: "+91 94440 12345",
        auto_dispatch_enabled: true,
        max_service_radius_km: 15,
        payout_cycle: "weekly",
        system_notice: "Cooperative operations running smoothly across all service hubs."
      };
    } catch (error) {
      console.error("Error fetching admin settings:", error);
      return {
        commission_rate: 8.5,
        emergency_contact: "+91 94440 12345",
        auto_dispatch_enabled: true,
        max_service_radius_km: 15,
        payout_cycle: "weekly",
        system_notice: "Cooperative operations running smoothly."
      };
    }
  },

  async saveAdminSettings(settings) {
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .upsert([{
          id: settings.id || 1,
          ...settings,
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error saving admin settings:", error);
      return { success: false, error: error.message };
    }
  },

  // ==========================================
  // 8. SUPABASE REALTIME SUBSCRIPTIONS (LIVE 3-PORTAL SYNC)
  // ==========================================
  subscribeToLiveRequests(callback) {
    const channel = supabase
      .channel('admin-live-requests')
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
  },

  subscribeToLivePillars(callback) {
    const channel = supabase
      .channel('admin-live-pillars')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'pillar_profiles' },
        (payload) => {
          if (callback) callback(payload);
        }
      )
      .subscribe();

    return channel;
  },

  subscribeToLiveTickets(callback) {
    const channel = supabase
      .channel('admin-live-tickets')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'support_tickets' },
        (payload) => {
          if (callback) callback(payload);
        }
      )
      .subscribe();

    return channel;
  }
};
