import { supabase } from "../../../lib/supabase";
import { emailService } from "../../../services/email/emailService";
import { idGenerator } from "../../../utils/idGenerator";
import { welfareService } from "./welfareService";
import { auditLogService } from "./auditLogService";

const isAdminDemo = () => localStorage.getItem("coophub_demo_admin") === "true";

// ==========================================
// ADMIN DEMO DATA
// ==========================================
const DEMO_PILLARS = [
  { id: "p-1", full_name: "Senthil Kumar", pillar_code: "PIL-CHE-042", mobile: "+91 98401 23456", email: "senthil@coophub.in", status: "verified", is_available: true, service_area: "Guindy, Adyar, Chennai", main_services: ["Electrician"], experience_years: 5, rating: 4.8, total_jobs: 127, created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: "p-2", full_name: "Murugan Velan", pillar_code: "PIL-CHE-019", mobile: "+91 94440 98765", email: "murugan@coophub.in", status: "verified", is_available: true, service_area: "T Nagar, Kodambakkam", main_services: ["Plumber"], experience_years: 8, rating: 4.6, total_jobs: 95, created_at: new Date(Date.now() - 60 * 86400000).toISOString() },
  { id: "p-3", full_name: "Praveen Kumaran", pillar_code: "PIL-CHE-031", mobile: "+91 98840 11223", email: "praveen@coophub.in", status: "verified", is_available: false, service_area: "Velachery, Pallikaranai", main_services: ["AC Technician"], experience_years: 4, rating: 4.9, total_jobs: 82, created_at: new Date(Date.now() - 45 * 86400000).toISOString() },
  { id: "p-4", full_name: "Ramesh Pandi", pillar_code: "PIL-CHE-055", mobile: "+91 97910 44556", email: "ramesh@coophub.in", status: "pending_review", is_available: false, service_area: "Saidapet, Ashok Nagar", main_services: ["Carpenter"], experience_years: 6, rating: 0, total_jobs: 0, created_at: new Date(Date.now() - 5 * 86400000).toISOString() },
  { id: "p-5", full_name: "Lakshmi Priya", pillar_code: "PIL-CHE-068", mobile: "+91 91760 33221", email: "lakshmi@coophub.in", status: "verified", is_available: true, service_area: "Adyar, Besant Nagar", main_services: ["Home Cleaning"], experience_years: 3, rating: 4.7, total_jobs: 64, created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
];

const DEMO_REQUESTS = [
  { id: "r-1", booking_code: "BKG-9842", service_name: "Ceiling Fan & Switchboard Wiring", customer_name: "Meenakshi S.", customer_mobile: "+91 98401 23456", service_address: "Flat 4B, Shanthi Apts, Guindy", status: "in_progress", amount: 450, is_emergency: false, category: "Electrician", created_at: new Date().toISOString(), pillar: { id: "p-1", full_name: "Senthil Kumar", pillar_code: "PIL-CHE-042" } },
  { id: "r-2", booking_code: "BKG-9843", service_name: "Main Power MCB Tripping", customer_name: "Karthik R.", customer_mobile: "+91 94440 98765", service_address: "Plot 12, Velachery", status: "pending", amount: 650, is_emergency: true, category: "Electrician", created_at: new Date(Date.now() - 3600000).toISOString(), pillar: null },
  { id: "r-3", booking_code: "BKG-9801", service_name: "AC Deep Gas Top-up", customer_name: "Deepak S.", customer_mobile: "+91 98840 11223", service_address: "18, Gandhi Nagar, Adyar", status: "completed", amount: 1200, final_amount: 1200, is_emergency: false, category: "AC Repair", created_at: new Date(Date.now() - 86400000).toISOString(), pillar: { id: "p-3", full_name: "Praveen Kumaran", pillar_code: "PIL-CHE-031" } },
  { id: "r-4", booking_code: "BKG-9788", service_name: "Kitchen Sink Drain Unclog", customer_name: "Lakshmi M.", customer_mobile: "+91 97910 44556", service_address: "24, Anna Salai, Saidapet", status: "completed", amount: 300, final_amount: 300, is_emergency: false, category: "Plumbing", created_at: new Date(Date.now() - 172800000).toISOString(), pillar: { id: "p-2", full_name: "Murugan Velan", pillar_code: "PIL-CHE-019" } },
  { id: "r-5", booking_code: "BKG-9775", service_name: "Deep Home Cleaning - 2BHK", customer_name: "Radhika R.", customer_mobile: "+91 91760 33221", service_address: "8, Besant Avenue Rd, Adyar", status: "completed", amount: 1800, final_amount: 1800, is_emergency: false, category: "Home Cleaning", created_at: new Date(Date.now() - 259200000).toISOString(), pillar: { id: "p-5", full_name: "Lakshmi Priya", pillar_code: "PIL-CHE-068" } },
];

const DEMO_CUSTOMERS = [
  { id: "c-1", customer_code: "CUS-CHE-101", full_name: "Meenakshi Sundaram", email: "meenakshi@gmail.com", mobile: "+91 98401 55678", language: "Tamil", preferred_language: "ta", status: "active", total_bookings: 14, total_spent: 6850, address: "Flat 4B, Shanthi Apts, Guindy, Chennai", created_at: new Date(Date.now() - 120 * 86400000).toISOString() },
  { id: "c-2", customer_code: "CUS-CHE-102", full_name: "Karthik Raghavan", email: "karthik.r@outlook.com", mobile: "+91 94440 22334", language: "English", preferred_language: "en", status: "vip", total_bookings: 28, total_spent: 14200, address: "Plot 12, 3rd Cross, Velachery, Chennai", created_at: new Date(Date.now() - 180 * 86400000).toISOString() },
  { id: "c-3", customer_code: "CUS-CHE-103", full_name: "Deepak Sharma", email: "deepak.sharma@yahoo.com", mobile: "+91 98840 77889", language: "Hindi", preferred_language: "hi", status: "active", total_bookings: 8, total_spent: 4900, address: "18, Gandhi Nagar, Adyar, Chennai", created_at: new Date(Date.now() - 45 * 86400000).toISOString() },
  { id: "c-4", customer_code: "CUS-CHE-104", full_name: "Lakshmi Manoharan", email: "lakshmi.m@gmail.com", mobile: "+91 97910 88990", language: "Tamil", preferred_language: "ta", status: "active", total_bookings: 19, total_spent: 9450, address: "24, Anna Salai, Saidapet, Chennai", created_at: new Date(Date.now() - 90 * 86400000).toISOString() },
  { id: "c-5", customer_code: "CUS-CHE-105", full_name: "Radhika Ramesh", email: "radhika.r@gmail.com", mobile: "+91 91760 11224", language: "Tamil", preferred_language: "ta", status: "active", total_bookings: 6, total_spent: 3200, address: "8, Besant Avenue Rd, Adyar, Chennai", created_at: new Date(Date.now() - 30 * 86400000).toISOString() },
  { id: "c-6", customer_code: "CUS-CHE-106", full_name: "Anand Venkatesh", email: "anand.v@gmail.com", mobile: "+91 98412 33445", language: "English", preferred_language: "en", status: "active", total_bookings: 11, total_spent: 5600, address: "55, 1st Main Rd, T Nagar, Chennai", created_at: new Date(Date.now() - 60 * 86400000).toISOString() },
  { id: "c-7", customer_code: "CUS-CHE-107", full_name: "Suresh Babu", email: "suresh.babu@gmail.com", mobile: "+91 94451 66778", language: "Telugu", preferred_language: "te", status: "active", total_bookings: 5, total_spent: 2450, address: "12, 100 Feet Rd, Vadapalani, Chennai", created_at: new Date(Date.now() - 20 * 86400000).toISOString() },
  { id: "c-8", customer_code: "CUS-CHE-108", full_name: "Priya Chandran", email: "priya.c@gmail.com", mobile: "+91 98845 99001", language: "Tamil", preferred_language: "ta", status: "suspended", total_bookings: 2, total_spent: 850, address: "7, Lake View St, Nungambakkam, Chennai", created_at: new Date(Date.now() - 15 * 86400000).toISOString() },
];

export const adminService = {
  // ==========================================
  // 1. DASHBOARD STATS
  // ==========================================
  async getDashboardStats() {
    // 🧪 DEMO MODE
    if (isAdminDemo()) {
      return { totalPillars: 126, activePillars: 89, pendingPillars: 12, activeRequests: 34, totalRevenue: 238500, openTickets: 7, totalCustomers: 342 };
    }

    // 🔒 REAL MODE: Query live Supabase data with 0 mock numbers
    try {
      const { data: pillars, error: pillarsError } = await supabase
        .from('pillar_profiles')
        .select('id, status, is_available');

      let totalPillars = pillars?.length || 0;
      let activePillars = pillars?.filter(p => p.status === 'verified' || p.is_available === true).length || 0;
      let pendingPillars = pillars?.filter(p => p.status === 'pending_review' || !p.status).length || 0;

      // Count registered customers
      let totalCustomers = 0;
      try {
        const { data: customers, count } = await supabase
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
    } catch (error) {
      console.error("Error fetching admin stats:", error);
      return { totalPillars: 0, activePillars: 0, pendingPillars: 0, activeRequests: 0, totalRevenue: 0, openTickets: 0, totalCustomers: 0 };
    }
  },

  async getOverviewAnalytics() {
    // 🧪 DEMO MODE
    if (isAdminDemo()) {
      return {
        monthlyData: [
          { month: "Apr", bookings: 120, revenue: 48000 },
          { month: "May", bookings: 180, revenue: 72000 },
          { month: "Jun", bookings: 240, revenue: 96000 },
          { month: "Jul", bookings: 310, revenue: 135000 },
          { month: "Aug", bookings: 420, revenue: 184000 },
          { month: "Sep", bookings: 530, revenue: 238500 },
        ],
        categoryDistribution: [
          { name: "Electrician Services", count: 48, percentage: 38, color: "var(--color-primary)" },
          { name: "Plumbing & Motors", count: 35, percentage: 28, color: "var(--color-secondary)" },
          { name: "Appliance & AC Repair", count: 28, percentage: 22, color: "#10B981" },
          { name: "Deep Home Cleaning", count: 15, percentage: 12, color: "#8B5CF6" },
        ],
        recentTransactions: [
          { id: "TX-9081", customer: "Meenakshi S.", service: "Fan Wiring & Switchboard", pillar: "Senthil Kumar (PIL-042)", amount: "₹450", status: "Completed", time: "10 mins ago" },
          { id: "TX-9080", customer: "Karthik R.", service: "Main Pipe Leak Repair", pillar: "Murugan V (PIL-019)", amount: "₹350", status: "Completed", time: "42 mins ago" },
          { id: "TX-9079", customer: "Deepak S.", service: "AC Deep Gas Top-up", pillar: "Praveen K (PIL-031)", amount: "₹1,200", status: "In Progress", time: "1h ago" },
          { id: "TX-9078", customer: "Lakshmi M.", service: "Kitchen Sink Drain Unclog", pillar: "Ramesh P (PIL-055)", amount: "₹300", status: "Completed", time: "2h ago" },
        ]
      };
    }

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
      })).reverse(); // Very simple sorting, assumes descending fetch

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
  // 2. PILLAR MANAGEMENT
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
    if (isAdminDemo()) return DEMO_PILLARS;

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
    if (isAdminDemo()) {
      const match = DEMO_PILLARS.find(p => p.id === pillarId || p.pillar_code === pillarId);
      if (match) return match;
    }

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

  async getPillarKycDocuments(pillarId) {
    if (isAdminDemo()) {
      return [
        {
          id: `kyc-1-${pillarId}`,
          document_type: "Aadhaar Card (Govt Identity)",
          document_number: "XXXX-XXXX-4892",
          verification_status: "Verified Authenticity",
          document_url: "#",
          created_at: new Date().toISOString()
        },
        {
          id: `kyc-2-${pillarId}`,
          document_type: "Trade Competency / ITI Certificate",
          document_number: "ITI-TN-2021-098",
          verification_status: "Certified Electrician / Plumber",
          document_url: "#",
          created_at: new Date().toISOString()
        },
        {
          id: `kyc-3-${pillarId}`,
          document_type: "Address Proof & Police Clearance",
          document_number: "PCC-CHE-4410",
          verification_status: "Clearance Verified",
          document_url: "#",
          created_at: new Date().toISOString()
        }
      ];
    }

    try {
      const { data, error } = await supabase
        .from('kyc_documents')
        .select('*')
        .eq('pillar_id', pillarId);
      
      if (error) throw error;
      return data || [];
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
  },

  // ==========================================
  // 12. CUSTOMERS DIRECTORY & MANAGEMENT
  // ==========================================
  async getCustomers(filter = "all") {
    if (isAdminDemo()) {
      let filtered = [...DEMO_CUSTOMERS];
      if (filter === "active") filtered = filtered.filter(c => c.status === "active");
      if (filter === "vip") filtered = filtered.filter(c => c.status === "vip");
      if (filter === "suspended") filtered = filtered.filter(c => c.status === "suspended");
      return filtered;
    }

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (!data || data.length === 0) return [];

      let customers = data.map((profile, idx) => ({
        id: profile.id,
        customer_code: profile.customer_code || `CUS-CHE-${100 + idx + 1}`,
        full_name: profile.full_name || 'Customer User',
        email: profile.email || 'customer@coophub.in',
        mobile: profile.phone || profile.mobile || 'N/A',
        language: profile.preferred_language === 'ta' ? 'Tamil' : profile.preferred_language === 'hi' ? 'Hindi' : 'English',
        preferred_language: profile.preferred_language || 'en',
        status: profile.status || 'active',
        total_bookings: profile.total_bookings || 0,
        total_spent: profile.total_spent || 0,
        address: profile.address || 'Not set',
        created_at: profile.created_at || new Date().toISOString()
      }));

      if (filter === "active") customers = customers.filter(c => c.status === "active");
      if (filter === "vip") customers = customers.filter(c => c.status === "vip");
      if (filter === "suspended") customers = customers.filter(c => c.status === "suspended");

      return customers;
    } catch (e) {
      console.error('Customer fetch error:', e);
      return [];
    }
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

