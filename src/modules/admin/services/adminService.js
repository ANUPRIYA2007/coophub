import { supabase } from "../../../lib/supabase";

export const adminService = {
  // ==========================================
  // 1. DASHBOARD STATS
  // ==========================================
  async getDashboardStats() {
    try {
      const { data: pillars, error: pillarsError } = await supabase
        .from('pillar_profiles')
        .select('id, status, is_available');

      if (pillarsError && pillarsError.code !== 'PGRST116') {
        console.warn("Pillar profiles query error:", pillarsError.message);
      }

      const totalPillars = pillars?.length || 0;
      const activePillars = pillars?.filter(p => p.status === 'verified' || p.is_available === true).length || 0;
      const pendingPillars = pillars?.filter(p => p.status === 'pending_review' || !p.status).length || 0;

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
        console.log("Could not fetch service requests stats", e);
      }

      let openTickets = 0;
      try {
        const { data: tickets } = await supabase
          .from('support_tickets')
          .select('id, status')
          .in('status', ['open', 'in_progress']);
        openTickets = tickets?.length || 0;
      } catch (e) {
        console.log("Could not fetch tickets stats", e);
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
      return data || [];
    } catch (error) {
      console.error("Error fetching all pillars:", error);
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
      return data || [];
    } catch (error) {
      console.error("Error fetching service requests:", error);
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
  // 6. SUPPORT TICKETS MANAGEMENT
  // ==========================================
  async getSupportTickets(statusFilter = 'all') {
    try {
      let query = supabase
        .from('support_tickets')
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
      return data || [];
    } catch (error) {
      console.error("Error fetching support tickets:", error);
      return [];
    }
  },

  async updateSupportTicket(ticketId, updates) {
    try {
      const { data, error } = await supabase
        .from('support_tickets')
        .update({ ...updates, updated_at: new Date().toISOString() })
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
  // 7. PLATFORM SETTINGS
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
  }
};
