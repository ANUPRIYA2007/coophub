import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { 
  ShieldAlert, AlertTriangle, CheckCircle2, XCircle, RefreshCw, 
  Search, Shield, Lock, FileText, ChevronLeft, ChevronRight, X
} from "lucide-react";
import { 
  getAdmins, enforceAdmin, getEnforcementHistory 
} from "../../../services/admin/governanceService";

export default function SuperAdminEnforcement() {
  const { isDark } = useTheme();

  const [history, setHistory] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(true);

  // Quick Action Modal
  const [showEnforceModal, setShowEnforceModal] = useState(false);
  const [subordinateAdmins, setSubordinateAdmins] = useState([]);
  const [targetAdminId, setTargetAdminId] = useState("");
  const [actionType, setActionType] = useState("SUSPEND");
  const [reason, setReason] = useState("");
  const [enforceLoading, setEnforceLoading] = useState(false);
  const [enforceError, setEnforceError] = useState(null);
  const [enforceSuccess, setEnforceSuccess] = useState(null);

  const fetchHistory = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getEnforcementHistory({ page, limit });
      setHistory(data.enforcement_actions || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Failed to load enforcement history:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit]);

  useEffect(() => {
    fetchHistory();
  }, [fetchHistory]);

  const handleOpenQuickEnforce = async () => {
    setShowEnforceModal(true);
    setEnforceSuccess(null);
    setEnforceError(null);
    setReason("");

    try {
      const data = await getAdmins({ limit: 100 });
      // Exclude SUPER_ADMIN from target list
      const subs = (data.admins || []).filter(a => a.role !== "SUPER_ADMIN");
      setSubordinateAdmins(subs);
      if (subs.length > 0) {
        setTargetAdminId(subs[0].id);
      }
    } catch (e) {}
  };

  const handleExecuteEnforce = async (e) => {
    e.preventDefault();
    if (!targetAdminId) {
      setEnforceError("Please select a target subordinate administrator.");
      return;
    }
    if (!reason.trim() || reason.trim().length < 5) {
      setEnforceError("An authoritative reason (minimum 5 characters) is mandatory for compliance audit.");
      return;
    }

    setEnforceLoading(true);
    setEnforceError(null);

    try {
      await enforceAdmin(targetAdminId, {
        action_type: actionType,
        reason: reason.trim()
      });

      setEnforceSuccess(`Enforcement action '${actionType}' executed and immutably audited.`);
      setTimeout(() => {
        setShowEnforceModal(false);
        fetchHistory();
      }, 1000);
    } catch (err) {
      setEnforceError(err.message);
    } finally {
      setEnforceLoading(false);
    }
  };

  return (
    <div className="fade-in" style={{ paddingBottom: "40px" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A", margin: 0 }}>
              National Administrative Enforcement Center
            </h1>
            <span style={{ 
              background: "rgba(239, 68, 68, 0.12)", color: "#EF4444", 
              fontSize: "0.75rem", fontWeight: "800", padding: "3px 10px", borderRadius: "12px", border: "1px solid rgba(239, 68, 68, 0.3)"
            }}>
              STATUTORY COMPLIANCE
            </span>
          </div>
          <p style={{ margin: 0, color: isDark ? "#94A3B8" : "#64748B", fontSize: "0.88rem" }}>
            Execute disciplinary suspensions, revocations, and view the immutable correlation-tracked administrative audit trail
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={fetchHistory}
            style={{
              background: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
              border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #CBD5E1",
              color: isDark ? "#E2E8F0" : "#334155",
              padding: "8px 16px",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "12.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>

          <button
            onClick={handleOpenQuickEnforce}
            style={{
              background: "#EF4444",
              color: "#FFFFFF",
              border: "none",
              padding: "8px 18px",
              borderRadius: "8px",
              fontWeight: "800",
              fontSize: "12.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 14px rgba(239, 68, 68, 0.3)"
            }}
          >
            <ShieldAlert size={15} /> Execute Enforcement Action
          </button>
        </div>
      </div>

      {/* Safety & Immunity Warning Card */}
      <div style={{ 
        background: "rgba(239, 68, 68, 0.08)", 
        border: "1px solid rgba(239, 68, 68, 0.3)",
        borderRadius: "12px", 
        padding: "16px 20px", 
        marginBottom: "20px",
        display: "flex",
        alignItems: "center",
        gap: "14px"
      }}>
        <AlertTriangle size={24} color="#EF4444" style={{ flexShrink: 0 }} />
        <div style={{ fontSize: "12.5px", color: isDark ? "#E2E8F0" : "#1E293B" }}>
          <strong style={{ color: "#EF4444" }}>Apex Security Guard Active:</strong> All enforcement actions require mandatory statutory justification and are written directly to immutable audit logs with cryptographic correlation tracking. Lower-tier administrators are strictly barred from enforcing actions against the National Super Admin Apex.
        </div>
      </div>

      {/* Enforcement History Table */}
      <div style={{ 
        background: isDark ? "#0A1220" : "#FFFFFF", 
        border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #E2E8F0",
        borderRadius: "14px", 
        overflow: "hidden"
      }}>
        <div style={{ padding: "16px 20px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <FileText size={16} color="#FF7900" />
            <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A" }}>
              Enforcement & Compliance Audit Trail
            </h3>
          </div>
          <span style={{ fontSize: "12px", color: isDark ? "#94A3B8" : "#64748B" }}>
            {total} Authoritative Action(s) Logged
          </span>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "12.5px" }}>
            <thead>
              <tr style={{ 
                background: isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC", 
                borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0",
                color: isDark ? "#94A3B8" : "#64748B",
                fontWeight: "700",
                fontSize: "11px",
                textTransform: "uppercase"
              }}>
                <th style={{ padding: "12px 16px" }}>Action</th>
                <th style={{ padding: "12px 16px" }}>Target Administrator</th>
                <th style={{ padding: "12px 16px" }}>Justification / Reason</th>
                <th style={{ padding: "12px 16px" }}>Enforced By</th>
                <th style={{ padding: "12px 16px" }}>Correlation ID</th>
                <th style={{ padding: "12px 16px" }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ padding: "40px", textAlign: "center", color: isDark ? "#94A3B8" : "#64748B" }}>
                    <RefreshCw size={20} className="spin" style={{ margin: "0 auto 8px" }} />
                    Loading enforcement records...
                  </td>
                </tr>
              ) : history.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ padding: "40px", textAlign: "center", color: isDark ? "#94A3B8" : "#64748B" }}>
                    <CheckCircle2 size={32} color="#10B981" style={{ margin: "0 auto 10px", opacity: 0.7 }} />
                    <div style={{ fontWeight: "700", fontSize: "14px", color: isDark ? "#FFFFFF" : "#0F172A" }}>No Disciplinary Actions Active</div>
                    <div style={{ fontSize: "12px", marginTop: "2px" }}>The national administration network is currently in full operational compliance.</div>
                  </td>
                </tr>
              ) : (
                history.map((item) => {
                  const isSuspended = item.action_type === "SUSPEND" || item.action_type === "BLOCK";
                  const isRestored = item.action_type === "REINSTATE";

                  return (
                    <tr 
                      key={item.id} 
                      style={{ borderBottom: isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid #F1F5F9" }}
                    >
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          background: isSuspended ? "rgba(239, 68, 68, 0.15)" : isRestored ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          color: isSuspended ? "#EF4444" : isRestored ? "#10B981" : "#F59E0B",
                          fontSize: "11px",
                          fontWeight: "800",
                          padding: "3px 8px",
                          borderRadius: "6px"
                        }}>
                          {item.action_type}
                        </span>
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: "700", color: isDark ? "#FFFFFF" : "#0F172A" }}>
                          {item.target_admin_name}
                        </div>
                        <div style={{ fontSize: "11px", color: "#FF7900", fontFamily: "monospace" }}>
                          {item.target_admin_code}
                        </div>
                      </td>

                      <td style={{ padding: "12px 16px", maxWidth: "300px", color: isDark ? "#CBD5E1" : "#475569" }}>
                        {item.reason}
                      </td>

                      <td style={{ padding: "12px 16px", color: isDark ? "#CBD5E1" : "#475569", fontSize: "11.5px" }}>
                        {item.issuer_admin_code}
                      </td>

                      <td style={{ padding: "12px 16px", fontFamily: "monospace", fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B" }}>
                        {item.correlation_id?.slice(0, 8)}...
                      </td>

                      <td style={{ padding: "12px 16px", fontSize: "11.5px", color: isDark ? "#94A3B8" : "#64748B" }}>
                        {new Date(item.created_at).toLocaleString()}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div style={{ 
          padding: "12px 16px", 
          borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "12px",
          color: isDark ? "#94A3B8" : "#64748B"
        }}>
          <div>Showing {history.length} of {total} audit records</div>
          <div style={{ display: "flex", gap: "6px" }}>
            <button
              disabled={page <= 1}
              onClick={() => setPage(page - 1)}
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid #CBD5E1",
                background: "none",
                color: isDark ? "#E2E8F0" : "#334155",
                cursor: page <= 1 ? "not-allowed" : "pointer",
                opacity: page <= 1 ? 0.4 : 1
              }}
            >
              <ChevronLeft size={14} />
            </button>
            <span style={{ padding: "4px 8px", fontWeight: "700" }}>Page {page}</span>
            <button
              disabled={page * limit >= total}
              onClick={() => setPage(page + 1)}
              style={{
                padding: "4px 8px",
                borderRadius: "6px",
                border: "1px solid #CBD5E1",
                background: "none",
                color: isDark ? "#E2E8F0" : "#334155",
                cursor: page * limit >= total ? "not-allowed" : "pointer",
                opacity: page * limit >= total ? 0.4 : 1
              }}
            >
              <ChevronRight size={14} />
            </button>
          </div>
        </div>
      </div>

      {/* QUICK ENFORCEMENT MODAL */}
      {showEnforceModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ 
            background: isDark ? "#0A1220" : "#FFFFFF", 
            border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "500px",
            overflow: "hidden",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
          }}>
            <div style={{ padding: "18px 20px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "rgba(239,68,68,0.08)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <ShieldAlert size={22} color="#EF4444" />
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "#EF4444" }}>
                    Execute Administrative Enforcement
                  </h3>
                  <span style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B" }}>
                    Authoritative disciplinary action with statutory logging
                  </span>
                </div>
              </div>
              <button onClick={() => setShowEnforceModal(false)} style={{ background: "none", border: "none", color: isDark ? "#94A3B8" : "#64748B", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleExecuteEnforce} style={{ padding: "20px" }}>
              {enforceError && (
                <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#EF4444", fontSize: "12px", marginBottom: "14px", fontWeight: "600" }}>
                  {enforceError}
                </div>
              )}
              {enforceSuccess && (
                <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#10B981", fontSize: "12px", marginBottom: "14px", fontWeight: "600" }}>
                  {enforceSuccess}
                </div>
              )}

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#CBD5E1" : "#475569", marginBottom: "4px" }}>
                  Target Subordinate Administrator *
                </label>
                {subordinateAdmins.length === 0 ? (
                  <div style={{ fontSize: "12px", color: "#EF4444", background: "rgba(239,68,68,0.08)", padding: "10px", borderRadius: "8px" }}>
                    No subordinate administrators found in database.
                  </div>
                ) : (
                  <select
                    value={targetAdminId}
                    onChange={(e) => setTargetAdminId(e.target.value)}
                    style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "#0A1220" : "#FFFFFF", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "13px" }}
                  >
                    {subordinateAdmins.map(adm => (
                      <option key={adm.id} value={adm.id}>
                        {adm.full_name} ({adm.admin_code}) — {adm.role} [{adm.status.toUpperCase()}]
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#CBD5E1" : "#475569", marginBottom: "4px" }}>
                  Action Type *
                </label>
                <select
                  value={actionType}
                  onChange={(e) => setActionType(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "#0A1220" : "#FFFFFF", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "13px", fontWeight: "700" }}
                >
                  <option value="SUSPEND">SUSPEND — Halt all administrative rights</option>
                  <option value="REINSTATE">REINSTATE — Restore active standing</option>
                  <option value="RESTRICT">RESTRICT — Limit high-risk capability scope</option>
                  <option value="WARN">WARN — Formal compliance citation</option>
                  <option value="BLOCK">BLOCK — Immediate credential lockout</option>
                </select>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#CBD5E1" : "#475569", marginBottom: "4px" }}>
                  Authoritative Statutory Reason * (Min 5 chars)
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="Record formal statutory or audit justification for this administrative enforcement..."
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  style={{ width: "100%", padding: "10px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "12.5px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowEnforceModal(false)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #CBD5E1", background: "none", color: isDark ? "#CBD5E1" : "#475569", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={enforceLoading || subordinateAdmins.length === 0}
                  style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: actionType === "REINSTATE" ? "#10B981" : "#EF4444", color: "#FFFFFF", fontWeight: "800", fontSize: "12px", cursor: enforceLoading ? "not-allowed" : "pointer" }}
                >
                  {enforceLoading ? "Executing..." : `Confirm ${actionType}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
