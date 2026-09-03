/**
 * COOP HUB — Welfare Assistance Workflow Service
 * 
 * Enables Pillars to request cooperative assistance for government & statutory welfare applications.
 * Explicitly disclaims automated government submission. All Admin reviews are auditable.
 */

import { supabase } from '../../lib/supabase.js';

export const welfareAssistanceService = {
  /**
   * Pillar submits request for scheme application assistance
   */
  async requestAssistance({ pillarId, schemeId, schemeCode, notes = '', documents = [] }) {
    if (!pillarId || !schemeId) {
      return { success: false, error: "Pillar ID and Scheme ID are required." };
    }

    try {
      // 1. Check for existing open request for this scheme
      const { data: existing } = await supabase
        .from('welfare_assistance_requests')
        .select('*')
        .eq('pillar_id', pillarId)
        .eq('scheme_id', schemeId)
        .in('status', ['requested', 'under_review', 'documents_required', 'submitted'])
        .maybeSingle();

      if (existing) {
        return {
          success: false,
          alreadyOpen: true,
          error: `An active assistance request (${existing.id.slice(0, 8)}) is already in progress for this scheme.`
        };
      }

      // 2. Insert new assistance request
      const { data, error } = await supabase
        .from('welfare_assistance_requests')
        .insert([{
          pillar_id: pillarId,
          scheme_id: schemeId,
          scheme_code: schemeCode || 'SCHEME',
          status: 'requested',
          submitted_documents: documents || [],
          admin_notes: notes || 'Cooperative paperwork assistance requested by Pillar.',
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;
      return { success: true, data };
    } catch (err) {
      console.error("requestAssistance error:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Fetch assistance requests for a specific Pillar
   */
  async getPillarAssistanceRequests(pillarId) {
    try {
      const { data, error } = await supabase
        .from('welfare_assistance_requests')
        .select(`
          *,
          scheme:welfare_schemes(id, scheme_name, category, department, official_source_url)
        `)
        .eq('pillar_id', pillarId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      console.error("getPillarAssistanceRequests error:", err);
      return { data: [], error: err.message };
    }
  },

  /**
   * Fetch all assistance requests for Admin Welfare Control Tower
   */
  async getAllAssistanceRequests(statusFilter = 'all') {
    try {
      let query = supabase
        .from('welfare_assistance_requests')
        .select(`
          *,
          pillar:pillar_profiles(id, full_name, pillar_code, mobile),
          scheme:welfare_schemes(id, scheme_name, category, department, official_source_url)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return { data: data || [], error: null };
    } catch (err) {
      console.error("getAllAssistanceRequests error:", err);
      return { data: [], error: err.message };
    }
  },

  /**
   * Admin reviews and updates assistance request status
   */
  async updateAssistanceStatus(requestId, { status, adminNotes = '', rejectionReason = '', adminId = 'ADM-CHE-001' }) {
    try {
      const updates = {
        status,
        admin_notes: adminNotes || null,
        rejection_reason: rejectionReason || null,
        reviewed_by: adminId,
        reviewed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('welfare_assistance_requests')
        .update(updates)
        .eq('id', requestId)
        .select()
        .single();

      if (error) throw error;

      // Log in admin_audit_logs
      try {
        await supabase.from('admin_audit_logs').insert([{
          action: `WELFARE_ASSISTANCE_${status.toUpperCase()}`,
          entity_type: 'welfare_assistance_request',
          entity_id: requestId,
          reason: rejectionReason || adminNotes || `Assistance status updated to ${status}`,
          created_at: new Date().toISOString()
        }]);
      } catch (logErr) {}

      return { success: true, data };
    } catch (err) {
      console.error("updateAssistanceStatus error:", err);
      return { success: false, error: err.message };
    }
  }
};

export default welfareAssistanceService;
