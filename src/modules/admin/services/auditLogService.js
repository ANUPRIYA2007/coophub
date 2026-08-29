/**
 * COOP HUB — Central Administrative Audit Logging Service
 * 
 * Manages an append-only audit trail recording critical state-changing actions across COOP HUB:
 * 1. Pillar verification, approvals, rejections, suspensions, warnings, deletions
 * 2. KYC auto-verification & manual reviews
 * 3. PF withdrawal approvals and rejections
 * 4. Insurance claim approvals and rejections
 * 
 * Security:
 * - Sanitizes and masks sensitive identifiers (Aadhaar, PAN, etc.) prior to recording.
 * - Enforces append-only semantics.
 */

import { supabase } from '../../../lib/supabase.js';

const isAdminDemo = () => localStorage.getItem("coophub_demo_admin") === "true";

// In-Memory / LocalStorage Demo Audit Trail for Demo Admin
const DEMO_AUDIT_KEY = "coophub_demo_audit_logs";

const INITIAL_DEMO_LOGS = [
  {
    id: "log-1",
    admin_id: "ADM-CHE-001",
    admin_name: "Cooperative Admin",
    action: "claim_approve",
    entity_type: "insurance_claim",
    entity_id: "CLM-2025-001",
    entity_name: "Senthil Kumar (PIL-CHE-001)",
    previous_value: { status: "under_review" },
    new_value: { status: "approved", approved_amount: 18500 },
    reason: "Hospitalization bills and discharge summary verified against master policy terms.",
    metadata: { policy_no: "COOP-GROUP-MED-2025", hospital: "Apollo Hospital, Chennai" },
    created_at: new Date(Date.now() - 3600000 * 4).toISOString()
  },
  {
    id: "log-2",
    admin_id: "ADM-CHE-001",
    admin_name: "Cooperative Admin",
    action: "pillar_approve",
    entity_type: "pillar",
    entity_id: "PIL-CHE-001",
    entity_name: "Senthil Kumar",
    previous_value: { status: "pending_review" },
    new_value: { status: "verified", pillar_code: "PIL-CHE-001" },
    reason: "Government Aadhaar & ITI Electrical Trade certificate verified.",
    metadata: { service_area: "Chennai Central", document_type: "Aadhaar Card (XXXX-XXXX-4892)" },
    created_at: new Date(Date.now() - 3600000 * 24).toISOString()
  },
  {
    id: "log-3",
    admin_id: "ADM-CHE-001",
    admin_name: "Cooperative Admin",
    action: "pf_withdrawal_approve",
    entity_type: "pf_withdrawal",
    entity_id: "WDR-2025-001",
    entity_name: "Murugan Swamy (PIL-CHE-002)",
    previous_value: { status: "pending" },
    new_value: { status: "approved", amount: 5000 },
    reason: "Annual medical allowance withdrawal approved within 50% eligible limit.",
    metadata: { current_pf_balance: 18450, requested_amount: 5000 },
    created_at: new Date(Date.now() - 3600000 * 48).toISOString()
  }
];

// Mask sensitive document numbers (e.g. 1234 5678 9012 -> XXXX-XXXX-9012)
function sanitizeMetadata(meta = {}) {
  if (!meta || typeof meta !== 'object') return {};
  const sanitized = { ...meta };
  for (const [key, val] of Object.entries(sanitized)) {
    if (typeof val === 'string') {
      if (key.toLowerCase().includes('aadhaar') || key.toLowerCase().includes('document_number')) {
        sanitized[key] = val.replace(/\d{4}\s?\d{4}\s?(\d{4})/, 'XXXX-XXXX-$1');
      } else if (key.toLowerCase().includes('pan')) {
        sanitized[key] = val.replace(/([A-Z]{3})[A-Z0-9]{4}([A-Z0-9]{3})/, '$1XXXX$2');
      }
    }
  }
  return sanitized;
}

export const auditLogService = {
  /**
   * Log an administrative action into the audit trail
   */
  async logAction({
    admin_id = "ADM-CHE-001",
    action,
    entity_type,
    entity_id,
    entity_name = "",
    previous_value = null,
    new_value = null,
    reason = "",
    metadata = {}
  }) {
    const cleanedMeta = sanitizeMetadata(metadata);
    const logEntry = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      admin_id: admin_id || "ADM-SYSTEM",
      action,
      entity_type,
      entity_id: String(entity_id || ""),
      entity_name: String(entity_name || ""),
      previous_value: previous_value || {},
      new_value: new_value || {},
      reason: reason || "Administrative action executed",
      metadata: cleanedMeta,
      created_at: new Date().toISOString()
    };

    if (isAdminDemo()) {
      try {
        const stored = JSON.parse(localStorage.getItem(DEMO_AUDIT_KEY) || 'null') || INITIAL_DEMO_LOGS;
        stored.unshift(logEntry);
        localStorage.setItem(DEMO_AUDIT_KEY, JSON.stringify(stored.slice(0, 100)));
      } catch (e) {
        console.warn("Demo audit store notice:", e);
      }
      return { success: true, data: logEntry };
    }

    try {
      const { data, error } = await supabase
        .from('admin_audit_logs')
        .insert([{
          admin_id: logEntry.admin_id,
          action: logEntry.action,
          entity_type: logEntry.entity_type,
          entity_id: logEntry.entity_id,
          entity_name: logEntry.entity_name,
          previous_value: logEntry.previous_value,
          new_value: logEntry.new_value,
          reason: logEntry.reason,
          metadata: logEntry.metadata,
          created_at: logEntry.created_at
        }])
        .select()
        .single();

      if (error) {
        // If table does not yet exist or query fails, record error without breaking parent workflow
        console.warn("Real audit log table notice:", error.message);
        return { success: false, error: error.message };
      }
      return { success: true, data };
    } catch (err) {
      console.error("Audit log error:", err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Fetch audit logs with filtering support
   */
  async getAuditLogs(filters = {}) {
    const { action = "all", entityType = "all", searchQuery = "", limit = 50 } = filters;

    if (isAdminDemo()) {
      try {
        let logs = JSON.parse(localStorage.getItem(DEMO_AUDIT_KEY) || 'null') || INITIAL_DEMO_LOGS;
        if (action !== "all") logs = logs.filter(l => l.action === action);
        if (entityType !== "all") logs = logs.filter(l => l.entity_type === entityType);
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          logs = logs.filter(l => 
            (l.entity_id || "").toLowerCase().includes(q) ||
            (l.entity_name || "").toLowerCase().includes(q) ||
            (l.reason || "").toLowerCase().includes(q) ||
            (l.action || "").toLowerCase().includes(q) ||
            (l.admin_id || "").toLowerCase().includes(q)
          );
        }
        return logs.slice(0, limit);
      } catch (e) {
        return INITIAL_DEMO_LOGS;
      }
    }

    try {
      let query = supabase
        .from('admin_audit_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (action !== "all") query = query.eq('action', action);
      if (entityType !== "all") query = query.eq('entity_type', entityType);
      if (searchQuery.trim()) {
        query = query.or(`entity_id.ilike.%${searchQuery}%,entity_name.ilike.%${searchQuery}%,reason.ilike.%${searchQuery}%,action.ilike.%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (err) {
      console.warn("Audit logs fetch notice:", err.message);
      return [];
    }
  }
};

export default auditLogService;
