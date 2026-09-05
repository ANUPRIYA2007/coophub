import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { useTheme } from "../../../context/ThemeContext";
import { auditLogService } from "../services/auditLogService";
import { getEnforcementHistory } from "../../../services/admin/governanceService";
import { exportToCSV } from "../../../utils/analyticsExport";
import { 
  FileText, Shield, AlertTriangle, CheckCircle2, XCircle, 
  Search, Filter, Download, RefreshCw, Calendar, Eye, 
  Lock, ArrowRight, UserCheck, ShieldAlert, ChevronRight, X
} from "lucide-react";

export default function SuperAdminSecurityAudit() {
  const { isDark } = useTheme();

  // State
  const [activeStream, setActiveStream] = useState("all"); // 'all' | 'admin_logs' | 'enforcement'
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [totalRecords, setTotalRecords] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [timeFilter, setTimeFilter] = useState("30D"); // 'TODAY' | '7D' | '30D' | 'ALL'
  const [selectedLog, setSelectedLog] = useState(null);

  // Fetch Audit Records
  const fetchAuditRecords = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch from admin_audit_logs via auditLogService & Supabase
      const auditPromise = (async () => {
        try {
          let query = supabase
            .from("admin_audit_logs")
            .select("*")
            .order("created_at", { ascending: false })
            .limit(100);

          if (timeFilter !== "ALL") {
            const now = new Date();
            let days = 30;
            if (timeFilter === "TODAY") days = 1;
            if (timeFilter === "7D") days = 7;
            const cutoff = new Date(now - days * 86400000).toISOString();
            query = query.gte("created_at", cutoff);
          }

          const { data, error } = await query;
          if (error) {
            console.warn("admin_audit_logs table query note:", error.message);
            // Fallback to service
            return await auditLogService.getAuditLogs({ limit: 100 });
          }
          return data || [];
        } catch (err) {
          return await auditLogService.getAuditLogs({ limit: 100 });
        }
      })();

      // 2. Fetch from admin_enforcement_actions
      const enforcementPromise = (async () => {
        try {
          const res = await getEnforcementHistory({ page: 1, limit: 100 });
          return res.enforcement_actions || res.history || [];
        } catch (err) {
          // Direct Supabase fallback
          try {
            const { data } = await supabase
              .from("admin_enforcement_actions")
              .select("*")
              .order("created_at", { ascending: false })
              .limit(100);
            return data || [];
          } catch (e) {
            return [];
          }
        }
      })();

      const [auditResults, enforcementResults] = await Promise.all([
        auditPromise,
        enforcementPromise
      ]);

      // Normalize records into a unified audit timeline
      const normalizedAudit = (auditResults || []).map(log => ({
        id: log.id || `aud-${Math.random()}`,
        stream: "admin_logs",
        source_table: "admin_audit_logs",
        timestamp: log.created_at || new Date().toISOString(),
        actor_id: log.admin_id || "ADM-SYSTEM",
        actor_name: log.admin_name || "Cooperative Admin",
        actor_role: "ADMINISTRATOR",
        action: log.action || "action_performed",
        category: categorizeAction(log.action),
        target_id: log.entity_id || "N/A",
        target_type: log.entity_type || "platform",
        target_name: log.entity_name || log.entity_id || "",
        reason: log.reason || "Authoritative administrative operation executed",
        correlation_id: log.correlation_id || log.metadata?.correlation_id || "TRC-SEC-" + String(log.id).slice(0, 8),
        metadata: log.metadata || {},
        previous_value: log.previous_value,
        new_value: log.new_value,
        severity: getActionSeverity(log.action)
      }));

      const normalizedEnforcement = (enforcementResults || []).map(enf => ({
        id: enf.id || `enf-${Math.random()}`,
        stream: "enforcement",
        source_table: "admin_enforcement_actions",
        timestamp: enf.created_at || new Date().toISOString(),
        actor_id: enf.issuer_id || enf.enacted_by || "SA-000001",
        actor_name: enf.enacted_by_name || "National Super Admin Apex",
        actor_role: "SUPER_ADMIN",
        action: enf.action_type || "ENFORCEMENT_SANCTION",
        category: "DISCIPLINARY",
        target_id: enf.target_admin_id || enf.target_admin_code || "N/A",
        target_type: "admin_account",
        target_name: enf.target_admin_name || enf.target_admin_code || "Subordinate Admin",
        reason: enf.reason || "Authoritative statutory disciplinary sanction applied",
        correlation_id: enf.correlation_id || enf.metadata?.correlation_id || "TRC-ENF-" + String(enf.id).slice(0, 8),
        metadata: enf.metadata || {},
        previous_value: enf.metadata?.previous_status ? { status: enf.metadata.previous_status } : null,
        new_value: { action: enf.action_type, status: "applied" },
        severity: "CRITICAL"
      }));

      // Combine and sort chronologically
      let combined = [...normalizedAudit, ...normalizedEnforcement];
      combined.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

      setTotalRecords(combined.length);
      setLogs(combined);
    } catch (err) {
      console.error("fetchAuditRecords exception:", err);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  }, [timeFilter]);

  useEffect(() => {
    fetchAuditRecords();
  }, [fetchAuditRecords]);

  // Helpers
  function categorizeAction(action = "") {
    const act = action.toLowerCase();
    if (act.includes("claim") || act.includes("insurance") || act.includes("pf") || act.includes("welfare") || act.includes("payout")) {
      return "FINANCE & WELFARE";
    }
    if (act.includes("pillar") || act.includes("kyc") || act.includes("verify") || act.includes("cert")) {
      return "KYC & PILLAR GOVERNANCE";
    }
    if (act.includes("setting") || act.includes("config") || act.includes("param")) {
      return "PLATFORM SETTINGS";
    }
    if (act.includes("warn") || act.includes("suspend") || act.includes("block") || act.includes("restrict") || act.includes("enforce")) {
      return "DISCIPLINARY";
    }
    if (act.includes("auth") || act.includes("login") || act.includes("password") || act.includes("role")) {
      return "IDENTITY & AUTH";
    }
    return "OPERATIONAL";
  }

  function getActionSeverity(action = "") {
    const act = action.toLowerCase();
    if (act.includes("reject") || act.includes("suspend") || act.includes("block") || act.includes("delete") || act.includes("revoke")) {
      return "CRITICAL";
    }
    if (act.includes("warn") || act.includes("restrict") || act.includes("update") || act.includes("refund")) {
      return "MODERATE";
    }
    return "INFO";
  }

  // Filter application
  const filteredLogs = logs.filter(log => {
    // 1. Stream filter
    if (activeStream === "admin_logs" && log.stream !== "admin_logs") return false;
    if (activeStream === "enforcement" && log.stream !== "enforcement") return false;

    // 2. Category filter
    if (categoryFilter !== "ALL" && log.category !== categoryFilter) return false;

    // 3. Search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        (log.actor_id || "").toLowerCase().includes(q) ||
        (log.actor_name || "").toLowerCase().includes(q) ||
        (log.target_id || "").toLowerCase().includes(q) ||
        (log.target_name || "").toLowerCase().includes(q) ||
        (log.action || "").toLowerCase().includes(q) ||
        (log.reason || "").toLowerCase().includes(q) ||
        (log.correlation_id || "").toLowerCase().includes(q);
      if (!match) return false;
    }

    return true;
  });

  // Handle Export CSV
  const handleExportCSV = () => {
    if (filteredLogs.length === 0) return;
    const exportData = filteredLogs.map(l => ({
      Timestamp: l.timestamp,
      CorrelationID: l.correlation_id,
      ActorID: l.actor_id,
      ActorName: l.actor_name,
      Category: l.category,
      Action: l.action,
      TargetID: l.target_id,
      TargetType: l.target_type,
      Reason: l.reason,
      Severity: l.severity
    }));
    exportToCSV(exportData, `coophub_security_audit_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div style={{ padding: "28px", maxWidth: "1600px", margin: "0 auto" }}>
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & CONTROLS
          ───────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <div style={{
              width: "42px", height: "42px", borderRadius: "12px",
              background: isDark ? "rgba(236, 72, 153, 0.15)" : "#FDF2F8",
              color: "#EC4899", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <ShieldAlert size={24} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: "700", color: isDark ? "#F9FAFB" : "#111827", margin: 0 }}>
                  Security & Audit Explorer
                </h1>
                <span style={{
                  fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "20px",
                  background: isDark ? "rgba(59, 130, 246, 0.15)" : "#EFF6FF",
                  color: "#3B82F6", border: "1px solid rgba(59, 130, 246, 0.3)"
                }}>
                  IMMUTABLE LOGS
                </span>
              </div>
              <p style={{ fontSize: "14px", color: isDark ? "#9CA3AF" : "#6B7280", margin: "2px 0 0 0" }}>
                Authoritative compliance audit trail tracking all state-changing administrative operations with correlation IDs
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={handleExportCSV}
            disabled={filteredLogs.length === 0}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "9px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "600",
              background: isDark ? "#1F2937" : "#F3F4F6", color: isDark ? "#F9FAFB" : "#111827",
              border: isDark ? "1px solid #374151" : "1px solid #D1D5DB", cursor: "pointer"
            }}
          >
            <Download size={15} />
            Export Audit Trail (CSV)
          </button>
          <button
            onClick={fetchAuditRecords}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "9px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "600",
              background: "#3B82F6", color: "#FFFFFF", border: "none", cursor: "pointer"
            }}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            {loading ? "Refreshing..." : "Refresh Audit"}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. AUDIT SUMMARY METRICS
          ───────────────────────────────────────────────────────────── */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        <div style={{
          background: isDark ? "#111827" : "#FFFFFF",
          border: isDark ? "1px solid #1F2937" : "1px solid #E5E7EB",
          borderRadius: "12px", padding: "18px"
        }}>
          <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: isDark ? "#9CA3AF" : "#6B7280" }}>
            Total Audit Records
          </span>
          <div style={{ fontSize: "26px", fontWeight: "700", color: isDark ? "#F9FAFB" : "#111827", margin: "4px 0" }}>
            {totalRecords}
          </div>
          <p style={{ fontSize: "11px", color: isDark ? "#6B7280" : "#9CA3AF", margin: 0 }}>
            Unified records across administrative and enforcement tables
          </p>
        </div>

        <div style={{
          background: isDark ? "#111827" : "#FFFFFF",
          border: isDark ? "1px solid #1F2937" : "1px solid #E5E7EB",
          borderRadius: "12px", padding: "18px"
        }}>
          <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: isDark ? "#9CA3AF" : "#6B7280" }}>
            Disciplinary Sanctions
          </span>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "#EF4444", margin: "4px 0" }}>
            {logs.filter(l => l.category === "DISCIPLINARY").length}
          </div>
          <p style={{ fontSize: "11px", color: isDark ? "#6B7280" : "#9CA3AF", margin: 0 }}>
            Sanctions logged in <code>admin_enforcement_actions</code>
          </p>
        </div>

        <div style={{
          background: isDark ? "#111827" : "#FFFFFF",
          border: isDark ? "1px solid #1F2937" : "1px solid #E5E7EB",
          borderRadius: "12px", padding: "18px"
        }}>
          <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: isDark ? "#9CA3AF" : "#6B7280" }}>
            Finance & Welfare Approvals
          </span>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "#10B981", margin: "4px 0" }}>
            {logs.filter(l => l.category === "FINANCE & WELFARE").length}
          </div>
          <p style={{ fontSize: "11px", color: isDark ? "#6B7280" : "#9CA3AF", margin: 0 }}>
            Insurance claims & PF withdrawal decisions
          </p>
        </div>

        <div style={{
          background: isDark ? "#111827" : "#FFFFFF",
          border: isDark ? "1px solid #1F2937" : "1px solid #E5E7EB",
          borderRadius: "12px", padding: "18px"
        }}>
          <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: isDark ? "#9CA3AF" : "#6B7280" }}>
            Platform Settings Updates
          </span>
          <div style={{ fontSize: "26px", fontWeight: "700", color: "#3B82F6", margin: "4px 0" }}>
            {logs.filter(l => l.category === "PLATFORM SETTINGS").length}
          </div>
          <p style={{ fontSize: "11px", color: isDark ? "#6B7280" : "#9CA3AF", margin: 0 }}>
            Authoritative platform parameter modifications
          </p>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          3. SEARCH & DUAL-STREAM FILTER BAR
          ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: isDark ? "#111827" : "#FFFFFF",
        border: isDark ? "1px solid #1F2937" : "1px solid #E5E7EB",
        borderRadius: "12px", padding: "16px 20px", marginBottom: "20px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", flex: 1, minWidth: "280px" }}>
          <div style={{ position: "relative", flex: 1 }}>
            <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: isDark ? "#9CA3AF" : "#6B7280" }} />
            <input
              type="text"
              placeholder="Search by Actor, Target, Reason, Action, or Correlation ID..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: "100%", padding: "8px 12px 8px 36px", borderRadius: "8px", fontSize: "13px",
                background: isDark ? "#1F2937" : "#F9FAFB", color: isDark ? "#F9FAFB" : "#111827",
                border: isDark ? "1px solid #374151" : "1px solid #D1D5DB", outline: "none"
              }}
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            style={{
              padding: "8px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "500",
              background: isDark ? "#1F2937" : "#F9FAFB", color: isDark ? "#F9FAFB" : "#111827",
              border: isDark ? "1px solid #374151" : "1px solid #D1D5DB", outline: "none"
            }}
          >
            <option value="ALL">All Event Categories</option>
            <option value="DISCIPLINARY">Disciplinary Enforcement</option>
            <option value="FINANCE & WELFARE">Finance & Welfare</option>
            <option value="KYC & PILLAR GOVERNANCE">KYC & Pillar Governance</option>
            <option value="PLATFORM SETTINGS">Platform Settings</option>
            <option value="IDENTITY & AUTH">Identity & Auth</option>
            <option value="OPERATIONAL">Operational Actions</option>
          </select>

          {/* Time Range */}
          <select
            value={timeFilter}
            onChange={(e) => setTimeFilter(e.target.value)}
            style={{
              padding: "8px 12px", borderRadius: "8px", fontSize: "13px", fontWeight: "500",
              background: isDark ? "#1F2937" : "#F9FAFB", color: isDark ? "#F9FAFB" : "#111827",
              border: isDark ? "1px solid #374151" : "1px solid #D1D5DB", outline: "none"
            }}
          >
            <option value="TODAY">Today (24h)</option>
            <option value="7D">Past 7 Days</option>
            <option value="30D">Past 30 Days</option>
            <option value="ALL">All Time</option>
          </select>
        </div>

        {/* Stream Selector */}
        <div style={{ display: "flex", gap: "4px", background: isDark ? "#1F2937" : "#F3F4F6", padding: "4px", borderRadius: "8px" }}>
          {[
            { id: "all", label: "All Streams" },
            { id: "admin_logs", label: "Admin Audit Logs" },
            { id: "enforcement", label: "Enforcement Trail" }
          ].map(str => (
            <button
              key={str.id}
              onClick={() => setActiveStream(str.id)}
              style={{
                padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "600",
                background: activeStream === str.id ? (isDark ? "#374151" : "#FFFFFF") : "transparent",
                color: activeStream === str.id ? (isDark ? "#FFFFFF" : "#111827") : (isDark ? "#9CA3AF" : "#6B7280"),
                boxShadow: activeStream === str.id ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                border: "none", cursor: "pointer"
              }}
            >
              {str.label}
            </button>
          ))}
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          4. AUDIT EVENT LOG TABLE
          ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: isDark ? "#111827" : "#FFFFFF",
        border: isDark ? "1px solid #1F2937" : "1px solid #E5E7EB",
        borderRadius: "12px", overflow: "hidden"
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ background: isDark ? "#1F2937" : "#F8FAFC", borderBottom: isDark ? "1px solid #374151" : "1px solid #E5E7EB", textAlign: "left" }}>
                <th style={{ padding: "12px 14px", color: isDark ? "#9CA3AF" : "#6B7280" }}>Timestamp</th>
                <th style={{ padding: "12px 14px", color: isDark ? "#9CA3AF" : "#6B7280" }}>Actor (Admin)</th>
                <th style={{ padding: "12px 14px", color: isDark ? "#9CA3AF" : "#6B7280" }}>Category</th>
                <th style={{ padding: "12px 14px", color: isDark ? "#9CA3AF" : "#6B7280" }}>Action Performed</th>
                <th style={{ padding: "12px 14px", color: isDark ? "#9CA3AF" : "#6B7280" }}>Target Entity</th>
                <th style={{ padding: "12px 14px", color: isDark ? "#9CA3AF" : "#6B7280" }}>Mandatory Statutory Reason</th>
                <th style={{ padding: "12px 14px", color: isDark ? "#9CA3AF" : "#6B7280" }}>Trace ID</th>
                <th style={{ padding: "12px 14px", color: isDark ? "#9CA3AF" : "#6B7280", textAlign: "center" }}>Dossier</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} style={{ padding: "48px", textAlign: "center", color: isDark ? "#9CA3AF" : "#6B7280" }}>
                    Loading immutable audit trail records...
                  </td>
                </tr>
              ) : filteredLogs.length > 0 ? (
                filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    style={{
                      borderBottom: isDark ? "1px solid #1F2937" : "1px solid #F3F4F6",
                      transition: "background 0.15s ease"
                    }}
                  >
                    {/* Timestamp */}
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: "600", color: isDark ? "#F9FAFB" : "#111827" }}>
                        {new Date(log.timestamp).toLocaleDateString()}
                      </div>
                      <div style={{ fontSize: "11px", color: isDark ? "#9CA3AF" : "#6B7280" }}>
                        {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </div>
                    </td>

                    {/* Actor */}
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: "600", color: isDark ? "#F9FAFB" : "#111827" }}>
                        {log.actor_name}
                      </div>
                      <code style={{ fontSize: "11px", color: "#3B82F6" }}>
                        {log.actor_id}
                      </code>
                    </td>

                    {/* Category */}
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                      <span style={{
                        fontSize: "11px", fontWeight: "600", padding: "2px 8px", borderRadius: "10px",
                        background: log.category === "DISCIPLINARY" ? (isDark ? "rgba(239, 68, 68, 0.15)" : "#FEE2E2") : (log.category === "FINANCE & WELFARE" ? (isDark ? "rgba(16, 185, 129, 0.15)" : "#D1FAE5") : (isDark ? "#1F2937" : "#F3F4F6")),
                        color: log.category === "DISCIPLINARY" ? "#EF4444" : (log.category === "FINANCE & WELFARE" ? "#10B981" : (isDark ? "#D1D5DB" : "#4B5563"))
                      }}>
                        {log.category}
                      </span>
                    </td>

                    {/* Action */}
                    <td style={{ padding: "12px 14px" }}>
                      <span style={{ fontWeight: "700", color: isDark ? "#F9FAFB" : "#111827", textTransform: "uppercase", fontSize: "12px" }}>
                        {log.action}
                      </span>
                    </td>

                    {/* Target */}
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                      <div style={{ fontWeight: "500", color: isDark ? "#D1D5DB" : "#374151" }}>
                        {log.target_name || log.target_id}
                      </div>
                      <div style={{ fontSize: "11px", color: isDark ? "#9CA3AF" : "#6B7280" }}>
                        {log.target_type}
                      </div>
                    </td>

                    {/* Reason */}
                    <td style={{ padding: "12px 14px", maxWidth: "320px" }}>
                      <p style={{
                        margin: 0, fontSize: "12px", color: isDark ? "#D1D5DB" : "#4B5563",
                        overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical"
                      }}>
                        {log.reason}
                      </p>
                    </td>

                    {/* Correlation ID */}
                    <td style={{ padding: "12px 14px", whiteSpace: "nowrap" }}>
                      <code style={{ fontSize: "11px", color: isDark ? "#9CA3AF" : "#6B7280" }}>
                        {String(log.correlation_id).slice(0, 14)}...
                      </code>
                    </td>

                    {/* View Dossier Action */}
                    <td style={{ padding: "12px 14px", textAlign: "center" }}>
                      <button
                        onClick={() => setSelectedLog(log)}
                        style={{
                          display: "inline-flex", alignItems: "center", gap: "4px",
                          padding: "5px 10px", borderRadius: "6px", fontSize: "12px", fontWeight: "600",
                          background: isDark ? "#1F2937" : "#F3F4F6", color: isDark ? "#F9FAFB" : "#111827",
                          border: isDark ? "1px solid #374151" : "1px solid #D1D5DB", cursor: "pointer"
                        }}
                      >
                        <Eye size={13} />
                        Inspect
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={8} style={{ padding: "48px 24px", textAlign: "center" }}>
                    <FileText size={36} style={{ color: isDark ? "#4B5563" : "#9CA3AF", margin: "0 auto 12px auto" }} />
                    <h4 style={{ fontSize: "15px", fontWeight: "600", color: isDark ? "#D1D5DB" : "#374151", margin: "0 0 6px 0" }}>
                      No Audit Records Found
                    </h4>
                    <p style={{ fontSize: "13px", color: isDark ? "#9CA3AF" : "#6B7280", margin: 0 }}>
                      No audit events match your selected filters in the authoritative database.
                    </p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          5. AUDIT EVENT DETAIL INSPECTOR MODAL
          ───────────────────────────────────────────────────────────── */}
      {selectedLog && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0,0,0,0.65)", display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: "20px"
        }}>
          <div style={{
            background: isDark ? "#111827" : "#FFFFFF",
            border: isDark ? "1px solid #374151" : "1px solid #E5E7EB",
            borderRadius: "14px", width: "100%", maxWidth: "680px", maxHeight: "90vh",
            display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 20px 25px -5px rgba(0,0,0,0.3)"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "20px 24px", borderBottom: isDark ? "1px solid #1F2937" : "1px solid #E5E7EB",
              display: "flex", justifyContent: "space-between", alignItems: "center"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Shield size={20} style={{ color: "#3B82F6" }} />
                <h3 style={{ fontSize: "16px", fontWeight: "700", color: isDark ? "#F9FAFB" : "#111827", margin: 0 }}>
                  Audit Event Dossier & Trace Inspector
                </h3>
              </div>
              <button
                onClick={() => setSelectedLog(null)}
                style={{ background: "transparent", border: "none", color: isDark ? "#9CA3AF" : "#6B7280", cursor: "pointer" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
              {/* Event Metadata */}
              <div style={{
                display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px",
                padding: "16px", borderRadius: "8px", background: isDark ? "#1F2937" : "#F9FAFB", fontSize: "13px"
              }}>
                <div>
                  <span style={{ color: isDark ? "#9CA3AF" : "#6B7280", display: "block", fontSize: "11px" }}>Correlation Trace ID</span>
                  <code style={{ color: "#3B82F6", fontWeight: "600" }}>{selectedLog.correlation_id}</code>
                </div>
                <div>
                  <span style={{ color: isDark ? "#9CA3AF" : "#6B7280", display: "block", fontSize: "11px" }}>Source Table</span>
                  <span style={{ color: isDark ? "#D1D5DB" : "#374151" }}>public.{selectedLog.source_table}</span>
                </div>
                <div>
                  <span style={{ color: isDark ? "#9CA3AF" : "#6B7280", display: "block", fontSize: "11px" }}>Executing Actor</span>
                  <strong style={{ color: isDark ? "#F9FAFB" : "#111827" }}>{selectedLog.actor_name} ({selectedLog.actor_id})</strong>
                </div>
                <div>
                  <span style={{ color: isDark ? "#9CA3AF" : "#6B7280", display: "block", fontSize: "11px" }}>Action Performed</span>
                  <strong style={{ color: "#EF4444", textTransform: "uppercase" }}>{selectedLog.action}</strong>
                </div>
                <div>
                  <span style={{ color: isDark ? "#9CA3AF" : "#6B7280", display: "block", fontSize: "11px" }}>Target Entity</span>
                  <span style={{ color: isDark ? "#D1D5DB" : "#374151" }}>{selectedLog.target_name} ({selectedLog.target_type}: {selectedLog.target_id})</span>
                </div>
                <div>
                  <span style={{ color: isDark ? "#9CA3AF" : "#6B7280", display: "block", fontSize: "11px" }}>Recorded Timestamp</span>
                  <span style={{ color: isDark ? "#D1D5DB" : "#374151" }}>{new Date(selectedLog.timestamp).toLocaleString()}</span>
                </div>
              </div>

              {/* Statutory Justification */}
              <div>
                <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: isDark ? "#D1D5DB" : "#374151", marginBottom: "6px" }}>
                  Mandatory Compliance Justification:
                </label>
                <div style={{
                  padding: "12px 16px", borderRadius: "8px", background: isDark ? "#1F2937" : "#F3F4F6",
                  fontSize: "13px", color: isDark ? "#F9FAFB" : "#111827", lineHeight: "1.5"
                }}>
                  {selectedLog.reason}
                </div>
              </div>

              {/* State Diff / Metadata */}
              {(selectedLog.previous_value || selectedLog.new_value) && (
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: isDark ? "#D1D5DB" : "#374151", marginBottom: "6px" }}>
                    State Transition Diff:
                  </label>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                    <div style={{ padding: "12px", borderRadius: "8px", background: isDark ? "#1F2937" : "#FEE2E2", fontSize: "12px" }}>
                      <strong style={{ display: "block", color: "#EF4444", marginBottom: "4px" }}>Previous State:</strong>
                      <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                        {JSON.stringify(selectedLog.previous_value, null, 2)}
                      </pre>
                    </div>
                    <div style={{ padding: "12px", borderRadius: "8px", background: isDark ? "#1F2937" : "#D1FAE5", fontSize: "12px" }}>
                      <strong style={{ display: "block", color: "#10B981", marginBottom: "4px" }}>New State:</strong>
                      <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace" }}>
                        {JSON.stringify(selectedLog.new_value, null, 2)}
                      </pre>
                    </div>
                  </div>
                </div>
              )}

              {/* Sanitized Metadata */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div>
                  <label style={{ display: "block", fontSize: "12px", fontWeight: "700", color: isDark ? "#D1D5DB" : "#374151", marginBottom: "6px" }}>
                    Sanitized Context Metadata:
                  </label>
                  <div style={{ padding: "12px", borderRadius: "8px", background: isDark ? "#1F2937" : "#F9FAFB", fontSize: "12px" }}>
                    <pre style={{ margin: 0, whiteSpace: "pre-wrap", fontFamily: "monospace", color: isDark ? "#9CA3AF" : "#4B5563" }}>
                      {JSON.stringify(selectedLog.metadata, null, 2)}
                    </pre>
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "16px 24px", borderTop: isDark ? "1px solid #1F2937" : "1px solid #E5E7EB",
              display: "flex", justifyContent: "flex-end"
            }}>
              <button
                onClick={() => setSelectedLog(null)}
                style={{
                  padding: "8px 18px", borderRadius: "8px", fontSize: "13px", fontWeight: "600",
                  background: isDark ? "#374151" : "#E5E7EB", color: isDark ? "#F9FAFB" : "#111827",
                  border: "none", cursor: "pointer"
                }}
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
