import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import { auditLogService } from "../services/auditLogService";
import { useTranslation } from "../../../i18n/useTranslation";
import { 
  Settings, Save, CheckCircle, Shield, Sliders, DollarSign, 
  Phone, Map, Radio, History, Search, Filter, ChevronDown, 
  ChevronRight, RefreshCw, UserCheck, AlertTriangle, FileText
} from "lucide-react";

export default function AdminSettings() {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState("settings"); // 'settings' | 'audit'

  // Settings State
  const [settings, setSettings] = useState({
    commission_rate: 8.5,
    emergency_contact: "+91 94440 12345",
    auto_dispatch_enabled: true,
    max_service_radius_km: 15,
    payout_cycle: "weekly",
    system_notice: "Cooperative operations running normally."
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  // Audit Logs State
  const [auditLogs, setAuditLogs] = useState([]);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditSearchQuery, setAuditSearchQuery] = useState("");
  const [auditActionFilter, setAuditActionFilter] = useState("all");
  const [auditEntityFilter, setAuditEntityFilter] = useState("all");
  const [expandedLogId, setExpandedLogId] = useState(null);

  useEffect(() => {
    fetchSettings();
    if (activeTab === "audit") {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const fetchSettings = async () => {
    setLoading(true);
    const data = await adminService.getAdminSettings();
    if (data) setSettings(data);
    setLoading(false);
  };

  const fetchAuditLogs = async () => {
    setAuditLoading(true);
    const logs = await auditLogService.getAuditLogs({
      action: auditActionFilter,
      entityType: auditEntityFilter,
      searchQuery: auditSearchQuery
    });
    setAuditLogs(logs || []);
    setAuditLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await adminService.saveAdminSettings(settings);
    if (res.success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
      // Record audit log for configuration update
      await auditLogService.logAction({
        action: "settings_update",
        entity_type: "platform_settings",
        entity_id: "global",
        entity_name: "Platform Configuration",
        reason: "Administrative update of commission, dispatch, and emergency settings",
        metadata: { commission_rate: settings.commission_rate, auto_dispatch: settings.auto_dispatch_enabled }
      });
    } else {
      alert("Failed to save settings: " + res.error);
    }
    setSaving(false);
  };

  const handleAuditFilterChange = async (action, entity) => {
    setAuditActionFilter(action);
    setAuditEntityFilter(entity);
    setAuditLoading(true);
    const logs = await auditLogService.getAuditLogs({
      action,
      entityType: entity,
      searchQuery: auditSearchQuery
    });
    setAuditLogs(logs || []);
    setAuditLoading(false);
  };

  const handleAuditSearch = async (e) => {
    const query = e.target.value;
    setAuditSearchQuery(query);
    const logs = await auditLogService.getAuditLogs({
      action: auditActionFilter,
      entityType: auditEntityFilter,
      searchQuery: query
    });
    setAuditLogs(logs || []);
  };

  const formatActionBadge = (action) => {
    if (action.includes("approve")) return { bg: "rgba(16, 185, 129, 0.15)", color: "#10B981", label: action.replace("_", " ").toUpperCase() };
    if (action.includes("reject") || action.includes("suspend") || action.includes("delete")) return { bg: "rgba(239, 68, 68, 0.15)", color: "#EF4444", label: action.replace("_", " ").toUpperCase() };
    if (action.includes("warn")) return { bg: "rgba(245, 158, 11, 0.15)", color: "#F59E0B", label: action.replace("_", " ").toUpperCase() };
    return { bg: "rgba(255, 121, 0, 0.15)", color: "var(--color-primary)", label: action.replace("_", " ").toUpperCase() };
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: "var(--space-5)" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
          {t("admin.settings_title") || "Platform & Cooperative Administration"}
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Fine-tune financial parameters, auto-dispatch rules, and inspect the immutable administrative audit trail.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: "flex", borderBottom: "1px solid var(--color-border)", marginBottom: "var(--space-5)", gap: "8px" }}>
        <button
          onClick={() => setActiveTab("settings")}
          style={{
            padding: "10px 18px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "settings" ? "3px solid var(--color-primary)" : "3px solid transparent",
            color: activeTab === "settings" ? "var(--color-primary)" : "var(--color-text-secondary)",
            fontWeight: activeTab === "settings" ? "800" : "600",
            fontSize: "0.92rem",
            cursor: "pointer"
          }}
        >
          ⚙️ Configuration Settings
        </button>
        <button
          onClick={() => setActiveTab("audit")}
          style={{
            padding: "10px 18px",
            background: "none",
            border: "none",
            borderBottom: activeTab === "audit" ? "3px solid var(--color-primary)" : "3px solid transparent",
            color: activeTab === "audit" ? "var(--color-primary)" : "var(--color-text-secondary)",
            fontWeight: activeTab === "audit" ? "800" : "600",
            fontSize: "0.92rem",
            cursor: "pointer"
          }}
        >
          📜 Administrative Audit Trail
        </button>
      </div>

      {/* TAB 1: CONFIGURATION SETTINGS */}
      {activeTab === "settings" && (
        <div style={{ maxWidth: "800px" }} className="fade-in">
          <div style={{ 
            background: "var(--color-surface)", 
            borderRadius: "var(--radius-lg)", 
            border: "1px solid var(--color-border)",
            padding: "var(--space-5)",
            boxShadow: "var(--shadow-sm)"
          }}>
            {savedSuccess && (
              <div style={{ 
                background: "var(--color-success-light)", 
                color: "var(--color-success)", 
                padding: "12px 16px", 
                borderRadius: "var(--radius-md)", 
                marginBottom: "var(--space-4)",
                display: "flex",
                alignItems: "center",
                gap: "8px",
                fontWeight: "600"
              }}>
                <CheckCircle size={18} /> {t("admin.saved_success") || "Admin system settings saved and applied in real-time!"}
              </div>
            )}

            {loading ? (
              <div style={{ padding: "var(--space-6)", textAlign: "center" }}><div className="spinner"></div></div>
            ) : (
              <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
                
                {/* Financial Section */}
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <DollarSign size={18} color="var(--color-secondary)" /> {t("admin.financial_commission") || "Financial & Cooperative Commission"}
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-4)" }}>
                    <div>
                      <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                        {t("admin.commission_fee") || "Cooperative Commission Fee (%)"}
                      </label>
                      <input
                        type="number"
                        step="0.1"
                        min="0"
                        max="100"
                        className="form-input"
                        value={settings.commission_rate || ""}
                        onChange={(e) => setSettings({ ...settings, commission_rate: parseFloat(e.target.value) || 0 })}
                      />
                      <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                        {t("admin.commission_desc") || "Default cooperative platform share (standard: 8.5%)"}
                      </span>
                    </div>

                    <div>
                      <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                        {t("admin.payout_cycle") || "Pillar Payout Frequency"}
                      </label>
                      <select
                        className="form-input"
                        value={settings.payout_cycle || "weekly"}
                        onChange={(e) => setSettings({ ...settings, payout_cycle: e.target.value })}
                      >
                        <option value="instant">Instant on Job Complete</option>
                        <option value="daily">Daily Settlement</option>
                        <option value="weekly">Weekly Cycle (Recommended)</option>
                        <option value="biweekly">Bi-weekly (1st & 15th)</option>
                        <option value="monthly">Monthly</option>
                      </select>
                    </div>
                  </div>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid var(--color-border)" }} />

                {/* Dispatch & Operations Section */}
                <div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: "8px" }}>
                    <Sliders size={18} color="var(--color-primary)" /> {t("admin.dispatch_controls") || "Dispatch & Geospatial Controls"}
                  </h3>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-4)" }}>
                    <div>
                      <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                        {t("admin.max_radius") || "Maximum Service Search Radius (KM)"}
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="100"
                        className="form-input"
                        value={settings.max_service_radius_km || ""}
                        onChange={(e) => setSettings({ ...settings, max_service_radius_km: parseInt(e.target.value) || 10 })}
                      />
                    </div>

                    <div>
                      <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                        {t("admin.sos_contact") || "Emergency SOS Contact Number"}
                      </label>
                      <input
                        type="text"
                        className="form-input"
                        value={settings.emergency_contact || ""}
                        onChange={(e) => setSettings({ ...settings, emergency_contact: e.target.value })}
                      />
                    </div>
                  </div>

                  <div style={{ marginTop: "var(--space-4)" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={settings.auto_dispatch_enabled !== false}
                        onChange={(e) => setSettings({ ...settings, auto_dispatch_enabled: e.target.checked })}
                        style={{ width: "18px", height: "18px", accentColor: "var(--color-primary)" }}
                      />
                      <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                        {t("admin.auto_dispatch") || "Enable AI Intelligent Auto-Dispatch (Auto matches nearest qualified Pillar)"}
                      </span>
                    </label>
                  </div>
                </div>

                <hr style={{ border: "none", borderTop: "1px solid var(--color-border)" }} />

                {/* System Notice */}
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                    {t("admin.system_notice") || "Global System Notice / Banner"}
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={settings.system_notice || ""}
                    onChange={(e) => setSettings({ ...settings, system_notice: e.target.value })}
                    placeholder="e.g. Cooperative operations running smoothly."
                  />
                </div>

                {/* Action Buttons */}
                <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn btn-primary"
                    style={{ minWidth: "160px" }}
                  >
                    <Save size={16} /> {saving ? "Saving..." : (t("admin.save_settings") || "Save Platform Settings")}
                  </button>
                </div>

              </form>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: ADMINISTRATIVE AUDIT TRAIL */}
      {activeTab === "audit" && (
        <div className="fade-in">
          {/* Header Notice */}
          <div style={{ background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.25)", padding: "14px 18px", borderRadius: "var(--radius-lg)", marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "12px" }}>
            <History size={22} color="#3B82F6" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: "0.85rem", color: "var(--color-text)", lineHeight: "1.4" }}>
              <strong>Append-Only Audit Log:</strong> Chronological record of administrative state changes including Pillar approvals, rejections, suspensions, warnings, PF withdrawals, and insurance claim determinations. Sensitive identity fields are automatically masked.
            </div>
          </div>

          {/* Filter & Search Bar */}
          <div style={{ 
            background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", 
            border: "1px solid var(--color-border)", marginBottom: "var(--space-4)", 
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" 
          }}>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <select
                value={auditEntityFilter}
                onChange={(e) => handleAuditFilterChange(auditActionFilter, e.target.value)}
                className="input"
                style={{ fontSize: "0.82rem", height: "36px", padding: "4px 10px" }}
              >
                <option value="all">All Entity Types</option>
                <option value="pillar">Pillar Records</option>
                <option value="pf_withdrawal">PF Withdrawals</option>
                <option value="insurance_claim">Insurance Claims</option>
                <option value="platform_settings">Platform Settings</option>
              </select>

              <select
                value={auditActionFilter}
                onChange={(e) => handleAuditFilterChange(e.target.value, auditEntityFilter)}
                className="input"
                style={{ fontSize: "0.82rem", height: "36px", padding: "4px 10px" }}
              >
                <option value="all">All Actions</option>
                <option value="pillar_approve">Pillar Approvals</option>
                <option value="pillar_reject">Pillar Rejections</option>
                <option value="pillar_suspend">Pillar Suspensions</option>
                <option value="pillar_reactivate">Pillar Reactivations</option>
                <option value="pillar_warning">Disciplinary Warnings</option>
                <option value="pf_withdrawal_approve">PF Withdrawal Approvals</option>
                <option value="pf_withdrawal_reject">PF Withdrawal Rejections</option>
                <option value="claim_approve">Claim Approvals</option>
                <option value="claim_reject">Claim Rejections</option>
              </select>

              <button 
                onClick={fetchAuditLogs} 
                disabled={auditLoading}
                className="btn btn-outline btn-sm"
                style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.82rem" }}
              >
                <RefreshCw size={14} className={auditLoading ? "spin" : ""} /> Refresh Logs
              </button>
            </div>

            <div style={{ position: "relative", width: "260px" }}>
              <Search size={15} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--color-text-muted)" }} />
              <input
                type="text"
                value={auditSearchQuery}
                onChange={handleAuditSearch}
                placeholder="Search Action, Admin, Reason..."
                className="input"
                style={{ paddingLeft: "32px", fontSize: "0.85rem", height: "36px" }}
              />
            </div>
          </div>

          {/* Audit Logs Table */}
          <div style={{ 
            background: "var(--color-surface)", borderRadius: "var(--radius-lg)", 
            border: "1px solid var(--color-border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" 
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", width: "160px" }}>Timestamp</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Admin</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Action</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Entity Target</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Justification / Reason</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Inspect</th>
                </tr>
              </thead>
              <tbody>
                {auditLoading ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "30px", textAlign: "center" }}>
                      <div className="spinner"></div>
                    </td>
                  </tr>
                ) : auditLogs.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: "30px", textAlign: "center", color: "var(--color-text-muted)" }}>
                      No administrative audit records found matching current query.
                    </td>
                  </tr>
                ) : (
                  auditLogs.map((log) => {
                    const badge = formatActionBadge(log.action || "action");
                    const isExpanded = expandedLogId === log.id;
                    return (
                      <React.Fragment key={log.id}>
                        <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                          <td style={{ padding: "12px 16px", color: "var(--color-text-muted)", fontSize: "0.8rem", whiteSpace: "nowrap" }}>
                            {new Date(log.created_at).toLocaleString()}
                          </td>
                          <td style={{ padding: "12px 16px", fontWeight: "700", color: "var(--color-text)" }}>
                            {log.admin_id || "ADM-SYSTEM"}
                          </td>
                          <td style={{ padding: "12px 16px" }}>
                            <span style={{
                              padding: "3px 8px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: "800",
                              background: badge.bg, color: badge.color
                            }}>
                              {badge.label}
                            </span>
                          </td>
                          <td style={{ padding: "12px 16px", color: "var(--color-text)" }}>
                            <div style={{ fontWeight: "700" }}>{log.entity_name || log.entity_id}</div>
                            <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{log.entity_type}</div>
                          </td>
                          <td style={{ padding: "12px 16px", color: "var(--color-text-secondary)", maxWidth: "260px" }}>
                            {log.reason || "N/A"}
                          </td>
                          <td style={{ padding: "12px 16px", textAlign: "right" }}>
                            <button
                              onClick={() => setExpandedLogId(isExpanded ? null : log.id)}
                              className="btn btn-ghost btn-sm"
                              style={{ padding: "4px 8px", fontSize: "0.75rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            >
                              {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />} {isExpanded ? "Hide" : "Details"}
                            </button>
                          </td>
                        </tr>
                        {isExpanded && (
                          <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                            <td colSpan={6} style={{ padding: "14px 20px" }}>
                              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "14px", fontSize: "0.8rem" }}>
                                <div style={{ background: "var(--color-surface)", padding: "10px", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                                  <div style={{ fontWeight: "700", color: "var(--color-text-secondary)", marginBottom: "4px" }}>PREVIOUS VALUE</div>
                                  <pre style={{ margin: 0, fontSize: "0.75rem", color: "#EF4444", whiteSpace: "pre-wrap" }}>
                                    {JSON.stringify(log.previous_value || {}, null, 2)}
                                  </pre>
                                </div>
                                <div style={{ background: "var(--color-surface)", padding: "10px", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                                  <div style={{ fontWeight: "700", color: "var(--color-text-secondary)", marginBottom: "4px" }}>NEW VALUE</div>
                                  <pre style={{ margin: 0, fontSize: "0.75rem", color: "#10B981", whiteSpace: "pre-wrap" }}>
                                    {JSON.stringify(log.new_value || {}, null, 2)}
                                  </pre>
                                </div>
                                <div style={{ background: "var(--color-surface)", padding: "10px", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                                  <div style={{ fontWeight: "700", color: "var(--color-text-secondary)", marginBottom: "4px" }}>METADATA & CONTEXT</div>
                                  <pre style={{ margin: 0, fontSize: "0.75rem", color: "var(--color-text)", whiteSpace: "pre-wrap" }}>
                                    {JSON.stringify(log.metadata || {}, null, 2)}
                                  </pre>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
