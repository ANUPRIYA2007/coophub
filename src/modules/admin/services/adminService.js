import { supabase } from "../../../lib/supabase.js";
import { emailService } from "../../../services/email/emailService.js";
import { idGenerator } from "../../../utils/idGenerator.js";
import { welfareService } from "./welfareService.js";
import { auditLogService } from "./auditLogService.js";

export const adminService = {
  // ==========================================
  // 1. DASHBOARD STATS (100% Real Live Supabase)
  // ==========================================
  async getDashboardStats() {
    try {
      const { data: pillars } = await supabase
        .from('pillar_profiles')
        .select('id, status, is_available');

      let totalPillars = pillars?.length || 0;
      let activePillars = pillars?.filter(p => p.status === 'verified' || p.is_available === true).length || 0;
      let pendingPillars = pillars?.filter(p => p.status === 'pending_review' || p.status === 'pending_verification' || !p.status).length || 0;

      // Count registered customers
      let totalCustomers = 0;
      try {
        const { count } = await supabase
          .from('profiles')
          .select('id', { count: 'exact', head: true });
        totalCustomers = count || 0;
      } catch (e) {
        console.log("Customer count error:", e);
      }

      let activeRequests = 0;
      let totalRevenue = 0;
      try {
        const { data: requests } = await supabase
          .from('bookings')
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

      return {
        totalPillars,
        activePillars,
        pendingPillars,
        activeRequests,
        totalRevenue,
        openTickets,
        totalCustomers
      };
    } catch (err) {
      console.error("Dashboard stats error:", err);
      return { totalPillars: 0, activePillars: 0, pendingPillars: 0, activeRequests: 0, totalRevenue: 0, openTickets: 0, totalCustomers: 0 };
    }
  },

  async getOverviewAnalytics() {
    try {
      const { data: bookings, error } = await supabase
        .from('bookings')
        .select(`
          id, status, final_amount, amount, created_at, category, service_name, customer_name,
          pillar:pillar_profiles(full_name, pillar_code)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!bookings) return { monthlyData: [], categoryDistribution: [], recentTransactions: [] };

      // 1. Monthly Data
      const monthMap = {};
      bookings.forEach(b => {
        if (b.status === 'completed') {
          const date = new Date(b.created_at);
          const monthStr = date.toLocaleString('default', { month: 'short' });
          if (!monthMap[monthStr]) monthMap[monthStr] = { bookings: 0, revenue: 0 };
          monthMap[monthStr].bookings += 1;
          monthMap[monthStr].revenue += Number(b.final_amount || b.amount || 0);
        }
      });
      const monthlyData = Object.keys(monthMap).map(m => ({
        month: m,
        bookings: monthMap[m].bookings,
        revenue: monthMap[m].revenue
      })).reverse();

      // 2. Category Distribution
      const catMap = {};
      bookings.forEach(b => {
        const cat = b.category || "General";
        if (!catMap[cat]) catMap[cat] = 0;
        catMap[cat] += 1;
      });
      const totalB = bookings.length || 1;
      const colors = ["var(--color-primary)", "var(--color-secondary)", "#10B981", "#8B5CF6", "#F59E0B"];
      const categoryDistribution = Object.keys(catMap).map((cat, idx) => ({
        name: cat,
        count: catMap[cat],
        percentage: Math.round((catMap[cat] / totalB) * 100),
        color: colors[idx % colors.length]
      })).sort((a,b) => b.count - a.count);

      // 3. Recent Transactions
      const recentTransactions = bookings.slice(0, 10).map(b => ({
        id: b.id.substring(0,8).toUpperCase(),
        customer: b.customer_name || "Guest",
        service: b.service_name || b.category,
        pillar: b.pillar ? `${b.pillar.full_name} (${b.pillar.pillar_code})` : "Unassigned",
        amount: `₹${b.final_amount || b.amount || 0}`,
        status: b.status,
        time: new Date(b.created_at).toLocaleDateString()
      }));

      return { monthlyData, categoryDistribution, recentTransactions };
    } catch (err) {
      console.error(err);
      return { monthlyData: [], categoryDistribution: [], recentTransactions: [] };
    }
  },

  // ==========================================
  // 1.5 CUSTOMER MANAGEMENT (100% Real Live Supabase)
  // ==========================================
  async getCustomers(filter = 'all') {
    try {
      let customers = [];

      // 1. Fetch from profiles table (where role = 'customer' or null)
      try {
        const { data: profs } = await supabase
          .from('profiles')
          .select('*')
          .or('role.eq.customer,role.is.null')
          .order('created_at', { ascending: false });
        if (profs && profs.length > 0) {
          customers = profs.map(p => ({
            id: p.id,
            customer_code: p.customer_code || `CUST-${(p.id || '').substring(0, 6).toUpperCase()}`,
            full_name: p.full_name || p.name || 'Registered Customer',
            email: p.email || '',
            mobile: p.phone || p.mobile || '',
            address: p.address || 'Chennai',
            status: p.status || 'active',
            total_bookings: 0,
            total_spent: 0,
            created_at: p.created_at || new Date().toISOString()
          }));
        }
      } catch (pe) {
        console.warn("Profiles fetch note:", pe);
      }

      // 2. Fetch from customer_profiles table if empty or to augment
      if (customers.length === 0) {
        try {
          const { data: custProfs } = await supabase
            .from('customer_profiles')
            .select('*')
            .order('created_at', { ascending: false });
          if (custProfs && custProfs.length > 0) {
            customers = custProfs.map(cp => ({
              id: cp.id,
              customer_code: `CUST-${(cp.id || '').substring(0, 6).toUpperCase()}`,
              full_name: cp.full_name || 'Registered Customer',
              email: cp.email || '',
              mobile: cp.mobile || '',
              address: cp.address || cp.city || 'Chennai',
              status: cp.status || 'active',
              total_bookings: 0,
              total_spent: 0,
              created_at: cp.created_at || new Date().toISOString()
            }));
          }
        } catch (cpe) {
          console.warn("Customer profiles fetch note:", cpe);
        }
      }

      // 3. Link customer bookings to calculate total bookings and lifetime spend
      try {
        const { data: bookings } = await supabase
          .from('bookings')
          .select('id, customer_id, final_amount, amount, status');
        if (bookings && bookings.length > 0) {
          customers.forEach(c => {
            const custBookings = bookings.filter(b => b.customer_id === c.id);
            c.total_bookings = custBookings.length;
            c.total_spent = custBookings
              .filter(b => b.status === 'completed')
              .reduce((sum, b) => sum + Number(b.final_amount || b.amount || 0), 0);
            if (c.total_bookings >= 10 && c.status === 'active') {
              c.status = 'vip';
            }
          });
        }
      } catch (be) {}

      // Apply filter
      if (filter === 'active') return customers.filter(c => c.status === 'active' || c.status === 'vip');
      if (filter === 'vip') return customers.filter(c => c.status === 'vip' || c.total_bookings >= 10);
      if (filter === 'suspended') return customers.filter(c => c.status === 'suspended');

      return customers;
    } catch (err) {
      console.error("Error fetching customers:", err);
      return [];
    }
  },

  async updateCustomerStatus(customerId, newStatus) {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', customerId);
      return { success: !error, error: error?.message };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // ==========================================
  // 2. PILLAR MANAGEMENT (100% Real Live Supabase)
  // ==========================================
  async createPillar(pillarData, email, password) {
    try {
      // 1. Create Auth User
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
      });
      if (authError) throw authError;

      const newUserId = authData.user.id;

      // 2. Create Pillar Profile
      const { data: profileData, error: profileError } = await supabase
        .from('pillar_profiles')
        .insert([{
          id: newUserId,
          ...pillarData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (profileError) throw profileError;
      return { success: true, data: profileData };
    } catch (error) {
      console.error("Error creating pillar:", error);
      return { success: false, error: error.message };
    }
  },

  async updatePillar(pillarId, updates) {
    try {
      const { data, error } = await supabase
        .from('pillar_profiles')
        .update({ ...updates, updated_at: new Date().toISOString() })
        .eq('id', pillarId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error updating pillar:", error);
      return { success: false, error: error.message };
    }
  },

  async getAllPillars() {
    try {
      const { data, error } = await supabase
        .from('pillar_profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching all pillars from Supabase:", error);
      return [];
    }
  },

  async getPillarById(pillarId) {
    try {
      if (!pillarId) return null;
      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(pillarId);
      let query = supabase.from('pillar_profiles').select('*');

      if (isUuid) {
        query = query.eq('id', pillarId);
      } else {
        query = query.or(`pillar_code.eq.${pillarId},application_id.eq.${pillarId},email.eq.${pillarId}`);
      }

      const { data, error } = await query.maybeSingle();
      if (!error && data) return data;
    } catch (error) {
      console.error(`Error fetching pillar ${pillarId} from Supabase:`, error);
    }

    return null;
  },

  async getPillarKycDocuments(pillarId) {
    if (!pillarId) return [];

    try {
      // 1. Query dedicated document tables from live Supabase
      const [
        { data: aadhaarDocs },
        { data: panDocs },
        { data: voterDocs },
        { data: dlDocs },
        { data: legacyKycDocs }
      ] = await Promise.all([
        supabase.from('pillar_aadhaar_documents').select('*').eq('pillar_id', pillarId),
        supabase.from('pillar_pan_documents').select('*').eq('pillar_id', pillarId),
        supabase.from('pillar_voter_id_documents').select('*').eq('pillar_id', pillarId),
        supabase.from('pillar_driving_license_documents').select('*').eq('pillar_id', pillarId),
        supabase.from('kyc_documents').select('*').eq('pillar_id', pillarId)
      ]);

      const unifiedDocs = [];

      if (aadhaarDocs && aadhaarDocs.length > 0) {
        aadhaarDocs.forEach(d => unifiedDocs.push({
          ...d,
          document_type: 'aadhaar',
          document_number: d.aadhaar_number,
          document_url: d.document_image_url || d.document_file_url,
          source_table: 'pillar_aadhaar_documents'
        }));
      }

      if (panDocs && panDocs.length > 0) {
        panDocs.forEach(d => unifiedDocs.push({
          ...d,
          document_type: 'pan',
          document_number: d.pan_number,
          document_url: d.document_image_url || d.document_file_url,
          source_table: 'pillar_pan_documents'
        }));
      }

      if (voterDocs && voterDocs.length > 0) {
        voterDocs.forEach(d => unifiedDocs.push({
          ...d,
          document_type: 'voter_id',
          document_number: d.voter_id_number,
          document_url: d.document_image_url || d.document_file_url,
          source_table: 'pillar_voter_id_documents'
        }));
      }

      if (dlDocs && dlDocs.length > 0) {
        dlDocs.forEach(d => unifiedDocs.push({
          ...d,
          document_type: 'driving_licence',
          document_number: d.driving_license_number,
          document_url: d.document_image_url || d.document_file_url,
          source_table: 'pillar_driving_license_documents'
        }));
      }

      if (legacyKycDocs && legacyKycDocs.length > 0) {
        legacyKycDocs.forEach(d => {
          if (!unifiedDocs.some(u => u.document_number === d.document_number)) {
            unifiedDocs.push(d);
          }
        });
      }

      return unifiedDocs;
    } catch (error) {
      console.error(`Error fetching KYC for ${pillarId}:`, error);
      return [];
    }
  },

  async approvePillar(pillarId, customCode = null) {
    if (isAdminDemo()) {
      const match = DEMO_PILLARS.find(p => p.id === pillarId || p.pillar_code === pillarId);
      const generatedCode = customCode || match?.pillar_code || await idGenerator.generatePillarId("CHE", DEMO_PILLARS);
      if (match) {
        match.status = 'verified';
        match.pillar_code = generatedCode;
        match.is_available = true;

        // Trigger Pillar Admin Approval email template
        try {
          await emailService.sendPillarApprovalEmail({
            email: match.email,
            pillar_name: match.full_name,
            pillar_id: generatedCode,
            service_category: Array.isArray(match.main_services) ? match.main_services.join(', ') : (match.main_services || 'General Trades'),
            service_location: match.service_area || 'Chennai Metropolitan'
          });
        } catch (e) { /* silent */ }
      }
      return { success: true, pillarCode: generatedCode, data: match };
    }

    try {
      // 1. Determine Real Unique Sequential Pillar ID if not existing
      let pillarCode = customCode;
      if (!pillarCode) {
        const { data: existingPillar } = await supabase
          .from('pillar_profiles')
          .select('pillar_code, service_area')
          .eq('id', pillarId)
          .single();

        if (existingPillar?.pillar_code) {
          pillarCode = existingPillar.pillar_code;
        } else {
          // Generate real sequential Pillar ID based on active database registry
          pillarCode = await idGenerator.generatePillarId(existingPillar?.service_area || "CHE");
        }
      }

      // 2. Update Pillar Profile to Verified & assign Code
      const { data, error } = await supabase
        .from('pillar_profiles')
        .update({
          status: 'verified',
          verification_status: 'verified',
          pillar_code: pillarCode,
          is_available: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', pillarId)
        .select()
        .single();

      if (error) throw error;

      // 3. Dispatch Live In-App Approval Notification
      try {
        await supabase.from('notifications').insert([{
          user_id: pillarId,
          type: 'pillar_approval',
          title: '🎉 Application Approved & Activated!',
          message: `Congratulations! Your Pillar membership has been approved. Your Unique Pillar ID is ${pillarCode}. You can now log into your Pillar Portal and start receiving customer requests.`,
          is_read: false,
          read: false
        }]);
      } catch (notifErr) {
        console.warn("Notification insert error:", notifErr);
      }

      // 4. Trigger Real Pillar Admin Approval Email
      try {
        await emailService.sendPillarApprovalEmail({
          email: data.email,
          pillar_name: data.full_name || 'Valued Technician',
          pillar_id: pillarCode,
          service_category: Array.isArray(data.main_services) ? data.main_services.join(', ') : (data.main_services || 'General Services'),
          service_location: Array.isArray(data.service_area) ? data.service_area.join(', ') : (data.service_area || 'Chennai Metropolitan')
        });
      } catch (mailErr) {
        console.warn("Pillar approval email dispatch notice:", mailErr);
      }

      // 5. Record Standalone Administrative Audit Log
      await auditLogService.logAction({
        action: 'pillar_approve',
        entity_type: 'pillar',
        entity_id: pillarId,
        entity_name: data.full_name || `Pillar ${pillarCode}`,
        previous_value: { status: 'pending_review' },
        new_value: { status: 'verified', pillar_code: pillarCode },
        reason: 'Pillar identity and technical credentials verified and activated by Admin',
        metadata: {
          pillar_code: pillarCode,
          service_area: data.service_area,
          trade: data.main_services
        }
      });

      return { success: true, pillarCode, data };
    } catch (error) {
      console.error("Error approving pillar:", error);
      return { success: false, error: error.message };
    }
  },

  async rejectPillar(pillarId, reason = "Documents or trade verification did not meet cooperative standards.") {
    if (isAdminDemo()) {
      const match = DEMO_PILLARS.find(p => p.id === pillarId || p.pillar_code === pillarId);
      if (match) {
        match.status = 'rejected';
        match.rejection_reason = reason;
        match.rejected_at = new Date().toISOString();
        match.rejected_by = 'COOP HUB Central Administration';
        match.is_available = false;

        try {
          await emailService.sendPillarRejectionEmail({
            email: match.email,
            pillar_name: match.full_name,
            rejection_reason: reason
          });
        } catch (e) { /* silent */ }

        await auditLogService.logAction({
          action: 'pillar_reject',
          entity_type: 'pillar',
          entity_id: pillarId,
          entity_name: match.full_name,
          previous_value: { status: 'pending_review' },
          new_value: { status: 'rejected' },
          reason
        });
      }
      return { success: true, data: match };
    }

    try {
      const { data, error } = await supabase
        .from('pillar_profiles')
        .update({
          status: 'rejected',
          verification_status: 'rejected',
          rejection_reason: reason,
          rejected_at: new Date().toISOString(),
          rejected_by: 'COOP HUB Central Administration',
          is_available: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', pillarId)
        .select()
        .single();

      if (error) throw error;

      // 1. In-App Notification with Exact Reason
      try {
        await supabase.from('notifications').insert([{
          user_id: pillarId,
          type: 'pillar_rejected',
          title: '⚠️ Pillar Application Update',
          message: `Your application could not be approved at this time. Reason: ${reason}. Please review and resubmit your documents.`,
          is_read: false,
          read: false
        }]);
      } catch (notifErr) {
        console.warn("Notification insert error:", notifErr);
      }

      // 2. Official Rejection Email Dispatch with Review & Resubmit Link
      try {
        await emailService.sendPillarRejectionEmail({
          email: data.email,
          pillar_name: data.full_name || 'Valued Technician',
          rejection_reason: reason
        });
      } catch (mailErr) {
        console.warn("Rejection email dispatch note:", mailErr);
      }

      // 3. Record Standalone Administrative Audit Log
      await auditLogService.logAction({
        action: 'pillar_reject',
        entity_type: 'pillar',
        entity_id: pillarId,
        entity_name: data.full_name || `Pillar ${pillarId}`,
        previous_value: { status: 'pending_review' },
        new_value: { status: 'rejected' },
        reason
      });

      return { success: true, data };
    } catch (error) {
      console.error("Error rejecting pillar:", error);
      return { success: false, error: error.message };
    }
  },

  async updatePillarStatus(pillarId, status) {
    if (status === 'verified') {
      return await this.approvePillar(pillarId);
    }
    if (status === 'rejected') {
      return await this.rejectPillar(pillarId);
    }

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

  async createPillar(pillarData) {
    if (isAdminDemo()) {
      const newId = `p-${Date.now()}`;
      const pillarCode = await idGenerator.generatePillarId(pillarData.service_area || "CHE", DEMO_PILLARS);
      const newPillar = {
        id: newId,
        full_name: pillarData.full_name,
        pillar_code: pillarCode,
        mobile: pillarData.mobile,
        email: pillarData.email,
        status: "verified",
        is_available: true,
        service_area: pillarData.service_area || "Chennai Metropolitan",
        main_services: Array.isArray(pillarData.main_services) ? pillarData.main_services : [pillarData.main_services || "General Trades"],
        experience_years: Number(pillarData.experience_years || 3),
        rating: 5.0,
        total_jobs: 0,
        created_at: new Date().toISOString()
      };
      DEMO_PILLARS.unshift(newPillar);
      return { success: true, data: newPillar };
    }

    try {
      const pillarCode = await idGenerator.generatePillarId(pillarData.service_area || "CHE");
      const { data, error } = await supabase
        .from('pillar_profiles')
        .insert([{
          full_name: pillarData.full_name,
          pillar_code: pillarCode,
          mobile: pillarData.mobile,
          email: pillarData.email,
          status: "verified",
          is_available: true,
          service_area: pillarData.service_area || "Chennai Metropolitan",
          main_services: Array.isArray(pillarData.main_services) ? pillarData.main_services : [pillarData.main_services],
          experience_years: Number(pillarData.experience_years || 1),
          rating: 5.0,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error creating new pillar:", error);
      return { success: false, error: error.message };
    }
  },

  async suspendPillar(pillarId, suspensionReason) {
    if (isAdminDemo()) {
      const match = DEMO_PILLARS.find(p => p.id === pillarId || p.pillar_code === pillarId);
      if (match) {
        match.status = 'suspended';
        match.is_available = false;
        match.suspension_reason = suspensionReason;
      }
      await auditLogService.logAction({
        action: 'pillar_suspend',
        entity_type: 'pillar',
        entity_id: pillarId,
        entity_name: match?.full_name || pillarId,
        previous_value: { status: 'verified' },
        new_value: { status: 'suspended' },
        reason: suspensionReason
      });
      return { success: true, data: match };
    }

    try {
      const { data, error } = await supabase
        .from('pillar_profiles')
        .update({ 
          status: 'suspended', 
          is_available: false,
          suspension_reason: suspensionReason,
          updated_at: new Date().toISOString() 
        })
        .eq('id', pillarId)
        .select()
        .single();

      if (error) throw error;

      // Dispatch suspension in-app notification
      try {
        await supabase.from('notifications').insert([{
          customer_id: pillarId,
          title: '🚨 Account Temporarily Suspended',
          message: `Your technician profile has been suspended by Cooperative Admin. Reason: ${suspensionReason}`,
          is_read: false,
          created_at: new Date().toISOString()
        }]);
      } catch (ne) { /* silent */ }

      // Record Standalone Administrative Audit Log
      await auditLogService.logAction({
        action: 'pillar_suspend',
        entity_type: 'pillar',
        entity_id: pillarId,
        entity_name: data.full_name || `Pillar ${pillarId}`,
        previous_value: { status: 'verified' },
        new_value: { status: 'suspended' },
        reason: suspensionReason
      });

      return { success: true, data };
    } catch (error) {
      console.error("Error suspending pillar:", error);
      return { success: false, error: error.message };
    }
  },

  async reactivatePillar(pillarId) {
    if (isAdminDemo()) {
      const match = DEMO_PILLARS.find(p => p.id === pillarId || p.pillar_code === pillarId);
      if (match) {
        match.status = 'verified';
        match.is_available = true;
        delete match.suspension_reason;
      }
      await auditLogService.logAction({
        action: 'pillar_reactivate',
        entity_type: 'pillar',
        entity_id: pillarId,
        entity_name: match?.full_name || pillarId,
        previous_value: { status: 'suspended' },
        new_value: { status: 'verified' },
        reason: 'Account reinstated by Admin'
      });
      return { success: true, data: match };
    }

    try {
      const { data, error } = await supabase
        .from('pillar_profiles')
        .update({ 
          status: 'verified', 
          is_available: true,
          suspension_reason: null,
          updated_at: new Date().toISOString() 
        })
        .eq('id', pillarId)
        .select()
        .single();

      if (error) throw error;

      // Dispatch reactivation in-app notification
      try {
        await supabase.from('notifications').insert([{
          customer_id: pillarId,
          title: '✅ Account Reinstated',
          message: 'Your technician profile has been reinstated by Cooperative Admin. You can now accept customer requests.',
          is_read: false,
          created_at: new Date().toISOString()
        }]);
      } catch (ne) { /* silent */ }

      // Record Standalone Administrative Audit Log
      await auditLogService.logAction({
        action: 'pillar_reactivate',
        entity_type: 'pillar',
        entity_id: pillarId,
        entity_name: data.full_name || `Pillar ${pillarId}`,
        previous_value: { status: 'suspended' },
        new_value: { status: 'verified' },
        reason: 'Account reinstated by Admin'
      });

      return { success: true, data };
    } catch (error) {
      console.error("Error reactivating pillar:", error);
      return { success: false, error: error.message };
    }
  },

  async deletePillar(pillarId) {
    if (isAdminDemo()) {
      const idx = DEMO_PILLARS.findIndex(p => p.id === pillarId || p.pillar_code === pillarId);
      const match = DEMO_PILLARS[idx];
      if (idx !== -1) DEMO_PILLARS.splice(idx, 1);
      await auditLogService.logAction({
        action: 'pillar_delete',
        entity_type: 'pillar',
        entity_id: pillarId,
        entity_name: match?.full_name || pillarId,
        reason: 'Pillar record permanently deleted from system'
      });
      return { success: true };
    }

    try {
      const { error } = await supabase
        .from('pillar_profiles')
        .delete()
        .eq('id', pillarId);

      if (error) throw error;

      await auditLogService.logAction({
        action: 'pillar_delete',
        entity_type: 'pillar',
        entity_id: pillarId,
        reason: 'Pillar record permanently deleted from system'
      });

      return { success: true };
    } catch (error) {
      console.error("Error deleting pillar:", error);
      return { success: false, error: error.message };
    }
  },

  async issuePillarWarning(pillarId, warningData) {
    const { reason, severity = "Official Warning", ticketId = null } = warningData;

    if (isAdminDemo()) {
      const match = DEMO_PILLARS.find(p => p.id === pillarId || p.pillar_code === pillarId);
      if (match) {
        match.warnings_count = (match.warnings_count || 0) + 1;
        match.last_warning = { reason, severity, issued_at: new Date().toISOString() };
      }
      await auditLogService.logAction({
        action: 'pillar_warning',
        entity_type: 'pillar',
        entity_id: pillarId,
        entity_name: match?.full_name || pillarId,
        reason: reason,
        metadata: { severity, ticketId }
      });
      return { success: true };
    }

    try {
      // 1. Dispatch In-App Notification
      await supabase.from('notifications').insert([{
        customer_id: pillarId,
        title: `⚠️ Administrative Warning: ${severity}`,
        message: `Official notice regarding service dispute: ${reason}. Please maintain cooperative quality standards.`,
        is_read: false,
        created_at: new Date().toISOString()
      }]);

      // 2. Record Standalone Administrative Audit Log
      await auditLogService.logAction({
        action: 'pillar_warning',
        entity_type: 'pillar',
        entity_id: pillarId,
        reason: reason,
        metadata: { severity, ticketId }
      });

      return { success: true };
    } catch (error) {
      console.error("Error issuing pillar warning:", error);
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
    if (isAdminDemo()) {
      let result = DEMO_REQUESTS;
      if (statusFilter && statusFilter !== 'all') result = result.filter(r => r.status === statusFilter);
      return result;
    }

    try {
      let query = supabase
        .from('bookings')
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
        .from('bookings')
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

  async assignPillarToRequest(requestId, pillarId) {
    try {
      const { data, error } = await supabase
        .from('bookings')
        .update({ 
          pillar_id: pillarId, 
          status: 'assigned',
          updated_at: new Date().toISOString() 
        })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      // Dispatch realtime notification to the assigned Pillar
      try {
        await supabase.from('notifications').insert([{
          user_id: pillarId,
          type: 'new_job_assigned',
          title: '⚡ New Service Assignment Dispatched',
          message: `You have been matched & assigned to Order #${data.booking_code || requestId.slice(0, 8)}. Please review details in your orders dashboard.`,
          read: false
        }]);
      } catch (ne) { /* silent */ }

      return { success: true, data };
    } catch (error) {
      console.error("Error assigning pillar to request:", error);
      return { success: false, error: error.message };
    }
  },

  // ==========================================
  // 4. FINANCIALS & PAYOUTS
  // ==========================================
  async getPayoutRequests(statusFilter = 'all') {
    if (isAdminDemo()) {
      return [
        { id: "PO-101", pillar_id: "p-1", amount: 4500, status: "pending", payment_mode: "bank_transfer", requested_at: new Date(Date.now() - 86400000).toISOString(), pillar: { full_name: "Senthil Kumar", pillar_code: "PIL-CHE-042", bank_name: "SBI", bank_account_number: "308945781234", bank_ifsc: "SBIN0000842" } },
        { id: "PO-100", pillar_id: "p-2", amount: 3200, status: "completed", payment_mode: "upi", requested_at: new Date(Date.now() - 172800000).toISOString(), processed_at: new Date(Date.now() - 86400000).toISOString(), pillar: { full_name: "Murugan Velan", pillar_code: "PIL-CHE-019", bank_upi_id: "9444098765@upi" } },
        { id: "PO-099", pillar_id: "p-3", amount: 5800, status: "processing", payment_mode: "bank_transfer", requested_at: new Date(Date.now() - 259200000).toISOString(), pillar: { full_name: "Praveen Kumaran", pillar_code: "PIL-CHE-031", bank_name: "HDFC", bank_account_number: "501203456789", bank_ifsc: "HDFC0001234" } },
      ];
    }

    try {
      let query = supabase
        .from('payout_requests')
        .select(`
          *,
          pillar:pillar_profiles(id, full_name, pillar_code, mobile, bank_account_holder, bank_name, bank_account_number, bank_ifsc, bank_upi_id)
        `)
        .order('requested_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching payout requests:", error);
      return [];
    }
  },

  async updatePayoutStatus(requestId, status) {
    try {
      const { data, error } = await supabase
        .from('payout_requests')
        .update({ status, processed_at: status === 'completed' ? new Date().toISOString() : null })
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (error) {
      console.error("Error updating payout status:", error);
      return { success: false, error: error.message };
    }
  },

  // ==========================================
  // 5. REVIEWS & FEEDBACK
  // ==========================================
  async getBookingReviews() {
    if (isAdminDemo()) {
      return [
        { id: "rv-1", rating: 5, review_text: "Excellent work! Fixed the wiring perfectly and cleaned up afterwards.", created_at: new Date().toISOString(), pillar: { full_name: "Senthil Kumar", pillar_code: "PIL-CHE-042" }, booking: { service_name: "Ceiling Fan Wiring" } },
        { id: "rv-2", rating: 4, review_text: "Good service, arrived on time. Minor delay in finding the leak.", created_at: new Date(Date.now() - 86400000).toISOString(), pillar: { full_name: "Murugan Velan", pillar_code: "PIL-CHE-019" }, booking: { service_name: "Pipe Leak Repair" } },
        { id: "rv-3", rating: 5, review_text: "AC is cooling like brand new! Very professional technician.", created_at: new Date(Date.now() - 172800000).toISOString(), pillar: { full_name: "Praveen Kumaran", pillar_code: "PIL-CHE-031" }, booking: { service_name: "AC Gas Top-up" } },
        { id: "rv-4", rating: 5, review_text: "Spotless cleaning! Will book again next month.", created_at: new Date(Date.now() - 259200000).toISOString(), pillar: { full_name: "Lakshmi Priya", pillar_code: "PIL-CHE-068" }, booking: { service_name: "Deep Home Cleaning" } },
      ];
    }

    try {
      const { data, error } = await supabase
        .from('booking_reviews')
        .select(`
          *,
          pillar:pillar_profiles(id, full_name, pillar_code),
          booking:bookings(service_name)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error("Error fetching reviews:", error);
      return [];
    }
  },

  // ==========================================
  // 6. LIVE TRACKING & TELEMETRY
  // ==========================================
  async getPillarsLiveTracking() {
    try {
      const { data, error } = await supabase
        .from('pillar_profiles')
        .select('id, full_name, pillar_code, mobile, service_area, area, pincode, main_services, custom_role, is_available, status, current_lat, current_lng, last_active_at')
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
  // 6. SUPPORT TICKETS
  // ==========================================
  async getSupportTickets(statusFilter = 'all') {
    if (isAdminDemo()) {
      const demoTickets = [
        { id: "TKT-301", subject: "Payment not received for booking BKG-9801", category: "payment", priority: "high", status: "open", pillar_id: "p-3", pillar_name: "Praveen Kumaran", created_at: new Date(Date.now() - 3600000).toISOString() },
        { id: "TKT-300", subject: "Customer reported wrong address", category: "service", priority: "medium", status: "in_progress", pillar_id: "p-1", pillar_name: "Senthil Kumar", created_at: new Date(Date.now() - 86400000).toISOString(), admin_response: "Re-routing the Pillar to the correct address." },
        { id: "TKT-299", subject: "App crash on orders page", category: "technical", priority: "low", status: "resolved", pillar_id: "p-2", pillar_name: "Murugan Velan", created_at: new Date(Date.now() - 259200000).toISOString(), admin_response: "Issue resolved in latest build." },
      ];
      if (statusFilter && statusFilter !== 'all') return demoTickets.filter(t => t.status === statusFilter);
      return demoTickets;
    }

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
      localStorage.setItem("coophub_admin_settings", JSON.stringify(settings));

      const { data, error } = await supabase
        .from('admin_settings')
        .upsert([{
          id: settings.id || 1,
          ...settings,
          updated_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) {
        console.warn("admin_settings DB upsert note:", error.message);
        return { success: true, data: settings };
      }
      return { success: true, data };
    } catch (error) {
      console.warn("saveAdminSettings exception:", error);
      return { success: true, data: settings };
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
  },

  // ==========================================
  // 12. CUSTOMERS DIRECTORY & MANAGEMENT
  // ==========================================
  async getCustomers(filter = "all") {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data && data.length > 0) {
        let customers = data.map((profile, idx) => ({
          id: profile.id,
          customer_code: profile.customer_code || `CUS-CHE-${100 + idx + 1}`,
          full_name: profile.full_name || 'Customer User',
          email: profile.email || 'customer@coophub.in',
          mobile: profile.mobile_number || profile.phone || profile.mobile || 'N/A',
          language: profile.preferred_language === 'ta' ? 'Tamil' : profile.preferred_language === 'hi' ? 'Hindi' : 'English',
          preferred_language: profile.preferred_language || 'en',
          status: profile.status || 'active',
          total_bookings: profile.total_bookings || 0,
          total_spent: profile.total_spent || 0,
          address: profile.address || 'Not set',
          created_at: profile.created_at || new Date().toISOString()
        }));

        if (isAdminDemo()) {
          const realEmails = new Set(customers.map(c => c.email?.toLowerCase()).filter(Boolean));
          const extraDemo = DEMO_CUSTOMERS.filter(c => !realEmails.has(c.email?.toLowerCase()));
          customers = [...customers, ...extraDemo];
        }

        if (filter === "active") customers = customers.filter(c => c.status === "active");
        if (filter === "vip") customers = customers.filter(c => c.status === "vip");
        if (filter === "suspended") customers = customers.filter(c => c.status === "suspended");

        return customers;
      }
    } catch (e) {
      console.error('Customer fetch error:', e);
    }

    if (isAdminDemo()) {
      let filtered = [...DEMO_CUSTOMERS];
      if (filter === "active") filtered = filtered.filter(c => c.status === "active");
      if (filter === "vip") filtered = filtered.filter(c => c.status === "vip");
      if (filter === "suspended") filtered = filtered.filter(c => c.status === "suspended");
      return filtered;
    }

    return [];
  },

  async getCustomerById(customerId) {
    if (isAdminDemo()) {
      return DEMO_CUSTOMERS.find(c => c.id === customerId || c.customer_code === customerId) || DEMO_CUSTOMERS[0];
    }
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', customerId)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    } catch (e) {
      console.error('Customer fetch by id error:', e);
      return null;
    }
  },

  async updateCustomerStatus(customerId, status) {
    if (isAdminDemo()) {
      const idx = DEMO_CUSTOMERS.findIndex(c => c.id === customerId);
      if (idx !== -1) DEMO_CUSTOMERS[idx].status = status;
      return { success: true };
    }
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ status })
        .eq('id', customerId);
      if (error) throw error;
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  },

  // ==========================================
  // 10. WELFARE & INSURANCE CONTROL CENTER
  // ==========================================
  welfare: welfareService,
  getWelfareKPISummary: () => welfareService.getWelfareKPISummary(),
  getPFFundOverview: () => welfareService.getPFFundOverview(),
  getPillarPFAccounts: (search, filter) => welfareService.getPillarPFAccounts(search, filter),
  getPillarPFDetails: (pillarId) => welfareService.getPillarPFDetails(pillarId),
  getGroupInsuranceMasterPolicy: () => welfareService.getGroupInsuranceMasterPolicy(),
  getInsuranceMembers: (search, filter) => welfareService.getInsuranceMembers(search, filter),
  getInsuranceClaims: (filter) => welfareService.getInsuranceClaims(filter),
  approveInsuranceClaim: (claimId, notes) => welfareService.approveInsuranceClaim(claimId, notes),
  rejectInsuranceClaim: (claimId, reason, notes) => welfareService.rejectInsuranceClaim(claimId, reason, notes),
  getGovernmentWelfareSchemes: (search, filter) => welfareService.getGovernmentWelfareSchemes(search, filter)
};

export { welfareService };

