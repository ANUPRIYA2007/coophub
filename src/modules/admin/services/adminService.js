import { supabase } from "../../../lib/supabase";

export const adminService = {
  // Fetch overall statistics
  async getDashboardStats() {
    try {
      const { data: pillars, error: pillarsError } = await supabase
        .from('pillar_profiles')
        .select('id, status');

      if (pillarsError) throw pillarsError;

      const totalPillars = pillars?.length || 0;
      const activePillars = pillars?.filter(p => p.status === 'verified').length || 0;
      const pendingPillars = pillars?.filter(p => p.status === 'pending_review').length || 0;

      // Dummy for active requests if orders table doesn't exist or isn't accessible
      let activeRequests = 0;
      try {
        const { data: requests } = await supabase
          .from('service_requests')
          .select('id', { count: 'exact' })
          .eq('status', 'in_progress');
        activeRequests = requests?.length || 0;
      } catch (e) {
        console.log("Could not fetch service requests", e);
      }

      return {
        totalPillars,
        activePillars,
        pendingPillars,
        activeRequests
      };
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      return { totalPillars: 0, activePillars: 0, pendingPillars: 0, activeRequests: 0 };
    }
  },

  // Fetch all pillars
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

  // Fetch single pillar by ID
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
  
  // Search and filter pillars
  async searchPillars(searchTerm) {
    try {
      const { data, error } = await supabase
        .from('pillar_profiles')
        .select('*')
        .or(`full_name.ilike.%${searchTerm}%,pillar_code.ilike.%${searchTerm}%`)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error searching pillars:", error);
      return [];
    }
  }
};
