import React, { useState, useEffect } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { 
  Lock, Shield, Check, X, ChevronRight, Layers, 
  ArrowDown, AlertCircle, RefreshCw, KeyRound, Sparkles,
  Sliders, Edit3, RotateCcw, Save, Plus, CheckSquare, Square, Info
} from "lucide-react";
import { 
  getPermissionsMatrix, 
  updateRolePermissions, 
  resetRolePermissions 
} from "../../../services/admin/governanceService";

export default function SuperAdminAccessPermissions() {
  const { isDark } = useTheme();

  const [matrix, setMatrix] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedRole, setSelectedRole] = useState("SUPER_ADMIN");

  // Edit Modal State
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [editingPermissions, setEditingPermissions] = useState({});
  const [editingScope, setEditingScope] = useState("");
  const [editingClearance, setEditingClearance] = useState("");
  const [editingDescription, setEditingDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [toastMsg, setToastMsg] = useState(null);
  const [focusedResource, setFocusedResource] = useState(null);

  // Simulator
  const [simRole, setSimRole] = useState("ZONE_ADMIN");
  const [simResource, setSimResource] = useState("kyc");
  const [simAction, setSimAction] = useState("APPROVE");
  const [simResult, setSimResult] = useState(null);

  useEffect(() => {
    loadPermissions();
  }, []);

  const loadPermissions = async () => {
    setLoading(true);
    try {
      const data = await getPermissionsMatrix();
      setMatrix(data);
    } catch (err) {
      console.error("Failed to load permissions matrix:", err);
    } finally {
      setLoading(false);
    }
  };

  // Run permission simulator check
  const runSimulation = () => {
    if (!matrix) return;
    const roleObj = matrix.roles?.find(r => r.id === simRole);
    if (!roleObj) return;

    const allowedActions = roleObj.permissions[simResource] || [];
    const isAllowed = allowedActions.includes(simAction);

    let explanation = "";
    if (isAllowed) {
      explanation = `Action '${simAction}' on resource '${simResource.toUpperCase()}' is AUTHORIZED for ${roleObj.title} within its bound ${roleObj.scope}.`;
    } else {
      explanation = `Action '${simAction}' on resource '${simResource.toUpperCase()}' is FORBIDDEN. ${roleObj.title} lacks '${simAction}' authority on this resource tier.`;
    }

    setSimResult({
      allowed: isAllowed,
      roleTitle: roleObj.title,
      scope: roleObj.scope,
      explanation
    });
  };

  useEffect(() => {
    if (matrix) runSimulation();
  }, [matrix, simRole, simResource, simAction]);

  // Open Edit Modal
  const openEditModal = (roleObj, targetResource = null) => {
    if (!roleObj) return;
    setEditingRole(roleObj);
    // Deep clone permissions
    const perms = {};
    (matrix?.resources || []).forEach(res => {
      perms[res] = [...(roleObj.permissions?.[res] || [])];
    });
    setEditingPermissions(perms);
    setEditingScope(roleObj.scope || "");
    setEditingClearance(roleObj.clearance || "");
    setEditingDescription(roleObj.description || "");
    setFocusedResource(targetResource);
    setIsEditModalOpen(true);
  };

  // Toggle single action on a resource
  const togglePermission = (resource, action) => {
    setEditingPermissions(prev => {
      const current = prev[resource] || [];
      const updated = current.includes(action)
        ? current.filter(a => a !== action)
        : [...current, action];
      return { ...prev, [resource]: updated };
    });
  };

  // Quick resource actions
  const grantAllForResource = (resource) => {
    const allActions = matrix?.actions || ['VIEW', 'CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'ASSIGN', 'SUSPEND', 'EXPORT', 'BROADCAST'];
    setEditingPermissions(prev => ({
      ...prev,
      [resource]: [...allActions]
    }));
  };

  const setReadOnlyForResource = (resource) => {
    setEditingPermissions(prev => ({
      ...prev,
      [resource]: ['VIEW']
    }));
  };

  const clearResource = (resource) => {
    setEditingPermissions(prev => ({
      ...prev,
      [resource]: []
    }));
  };

  // Quick global presets
  const applyPreset = (presetType) => {
    const allActions = matrix?.actions || ['VIEW', 'CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'ASSIGN', 'SUSPEND', 'EXPORT', 'BROADCAST'];
    const resources = matrix?.resources || [];
    const newPerms = {};

    resources.forEach(res => {
      if (presetType === 'full') {
        newPerms[res] = [...allActions];
      } else if (presetType === 'readonly') {
        newPerms[res] = ['VIEW'];
      } else if (presetType === 'operational') {
        newPerms[res] = ['VIEW', 'CREATE', 'UPDATE', 'ASSIGN', 'EXPORT'];
      } else if (presetType === 'clear') {
        newPerms[res] = [];
      }
    });

    setEditingPermissions(newPerms);
  };

  // Save changes
  const handleSavePermissions = async () => {
    if (!editingRole) return;
    setSaving(true);
    try {
      await updateRolePermissions(editingRole.id, {
        permissions: editingPermissions,
        scope: editingScope,
        clearance: editingClearance,
        description: editingDescription
      });

      // Update local matrix state
      setMatrix(prev => {
        if (!prev) return prev;
        const updatedRoles = prev.roles.map(r => {
          if (r.id === editingRole.id) {
            return {
              ...r,
              permissions: editingPermissions,
              scope: editingScope,
              clearance: editingClearance,
              description: editingDescription
            };
          }
          return r;
        });
        return { ...prev, roles: updatedRoles };
      });

      setToastMsg(`✓ Access policy for ${editingRole.title || editingRole.id} updated successfully!`);
      setTimeout(() => setToastMsg(null), 4500);
      setIsEditModalOpen(false);
    } catch (err) {
      alert("Failed to save permissions: " + err.message);
    } finally {
      setSaving(false);
    }
  };

  // Reset role to defaults
  const handleResetRole = async (roleId) => {
    if (!confirm(`Are you sure you want to reset ${roleId} permissions to factory standards?`)) return;
    setLoading(true);
    try {
      await resetRolePermissions(roleId);
      await loadPermissions();
      setToastMsg(`✓ Access policy for ${roleId} reset to standard defaults.`);
      setTimeout(() => setToastMsg(null), 4500);
    } catch (err) {
      alert("Failed to reset role: " + err.message);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "60px", textAlign: "center", color: isDark ? "#94A3B8" : "#64748B" }}>
        <RefreshCw size={28} className="spin" style={{ margin: "0 auto 12px" }} />
        <div>Loading authoritative capability matrix...</div>
      </div>
    );
  }

  const activeRoleData = matrix?.roles?.find(r => r.id === selectedRole);

  // Color mapping for actions
  const getActionColor = (act) => {
    switch(act) {
      case "APPROVE": return { bg: "rgba(16, 185, 129, 0.15)", text: "#10B981" };
      case "SUSPEND": return { bg: "rgba(239, 68, 68, 0.15)", text: "#EF4444" };
      case "REJECT": return { bg: "rgba(244, 63, 94, 0.15)", text: "#F43F5E" };
      case "CREATE": return { bg: "rgba(59, 130, 246, 0.15)", text: "#3B82F6" };
      case "UPDATE": return { bg: "rgba(245, 158, 11, 0.15)", text: "#F59E0B" };
      case "ASSIGN": return { bg: "rgba(139, 92, 246, 0.15)", text: "#8B5CF6" };
      case "EXPORT": return { bg: "rgba(236, 72, 153, 0.15)", text: "#EC4899" };
      case "BROADCAST": return { bg: "rgba(6, 182, 212, 0.15)", text: "#06B6D4" };
      default: return { bg: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9", text: isDark ? "#E2E8F0" : "#334155" };
    }
  };

  return (
    <div className="fade-in" style={{ paddingBottom: "40px" }}>
      {/* Toast Alert */}
      {toastMsg && (
        <div style={{
          position: "fixed", top: "20px", right: "20px", zIndex: 10000,
          background: "#10B981", color: "#FFFFFF", padding: "12px 20px",
          borderRadius: "8px", fontWeight: "700", fontSize: "0.9rem",
          boxShadow: "0 10px 25px rgba(16, 185, 129, 0.4)",
          display: "flex", alignItems: "center", gap: "8px"
        }}>
          <Check size={18} /> {toastMsg}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A", margin: 0 }}>
            Access & Capability Policy Engine
          </h1>
          <span style={{ 
            background: "rgba(168, 85, 247, 0.12)", color: "#A855F7", 
            fontSize: "0.75rem", fontWeight: "800", padding: "3px 10px", borderRadius: "12px", border: "1px solid rgba(168, 85, 247, 0.3)"
          }}>
            RBAC + ABAC HIERARCHY
          </span>
        </div>
        <p style={{ margin: 0, color: isDark ? "#94A3B8" : "#64748B", fontSize: "0.88rem" }}>
          Authoritative mapping of Administrative Roles → Geographic Scopes → System Resources → Permitted Operations
        </p>
      </div>

      {/* Downward Scope Inheritance Banner */}
      <div style={{ 
        background: isDark ? "#0A1220" : "#FFFFFF", 
        border: "1px solid rgba(255, 121, 0, 0.3)",
        borderRadius: "14px", 
        padding: "18px 20px", 
        marginBottom: "24px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
          <Layers size={18} color="#FF7900" />
          <h3 style={{ margin: 0, fontSize: "1rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A" }}>
            Authoritative Downward Scope Inheritance Principle
          </h3>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "14px" }}>
          {["GLOBAL (India)", "ZONE (Regional)", "STATE (State/UT)", "DISTRICT", "COOPERATIVE", "OPERATIONS"].map((step, idx, arr) => (
            <React.Fragment key={step}>
              <span style={{ 
                background: idx === 0 ? "rgba(255, 121, 0, 0.15)" : isDark ? "rgba(255,255,255,0.04)" : "#F1F5F9", 
                color: idx === 0 ? "#FF7900" : isDark ? "#E2E8F0" : "#334155",
                fontWeight: "700",
                fontSize: "11.5px",
                padding: "6px 10px",
                borderRadius: "6px",
                border: idx === 0 ? "1px solid rgba(255, 121, 0, 0.4)" : "1px solid rgba(255,255,255,0.08)"
              }}>
                {step}
              </span>
              {idx < arr.length - 1 && <ChevronRight size={14} color="#94A3B8" />}
            </React.Fragment>
          ))}
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "10px", fontSize: "11.5px", color: isDark ? "#94A3B8" : "#64748B" }}>
          {matrix?.inheritance_rules?.map((rule, i) => (
            <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: "6px" }}>
              <span style={{ color: "#10B981", fontWeight: "800" }}>✓</span>
              <span>{rule}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Main Grid: Role Selector & Resource Action Matrix */}
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr", gap: "20px", marginBottom: "28px" }}>
        
        {/* Role Tabs Sidebar */}
        <div style={{ 
          background: isDark ? "#0A1220" : "#FFFFFF", 
          border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #E2E8F0",
          borderRadius: "14px", 
          padding: "12px",
          display: "flex",
          flexDirection: "column",
          gap: "6px",
          height: "fit-content"
        }}>
          <div style={{ fontSize: "11px", fontWeight: "800", color: isDark ? "#94A3B8" : "#64748B", textTransform: "uppercase", padding: "6px 8px" }}>
            Select Admin Tier
          </div>

          {matrix?.roles?.map((r) => {
            const isSelected = selectedRole === r.id;
            return (
              <button
                key={r.id}
                onClick={() => setSelectedRole(r.id)}
                style={{
                  textAlign: "left",
                  padding: "10px 12px",
                  borderRadius: "8px",
                  border: isSelected ? "1px solid rgba(255, 121, 0, 0.4)" : "1px solid transparent",
                  background: isSelected ? "rgba(255, 121, 0, 0.12)" : "transparent",
                  color: isSelected ? "#FF7900" : isDark ? "#E2E8F0" : "#334155",
                  fontWeight: isSelected ? "800" : "600",
                  fontSize: "12.5px",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  display: "flex",
                  flexDirection: "column",
                  gap: "2px"
                }}
              >
                <div>{r.id}</div>
                <div style={{ fontSize: "10px", color: isDark ? "#94A3B8" : "#64748B", fontWeight: "normal" }}>
                  {r.clearance}
                </div>
              </button>
            );
          })}
        </div>

        {/* Detailed Permissions Table for Selected Role */}
        <div style={{ 
          background: isDark ? "#0A1220" : "#FFFFFF", 
          border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #E2E8F0",
          borderRadius: "14px", 
          padding: "20px"
        }}>
          {activeRoleData && (
            <div>
              {/* Role Card Banner with Edit Button */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px", paddingBottom: "14px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #F1F5F9", flexWrap: "wrap", gap: "12px" }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A" }}>
                    {activeRoleData.title}
                  </h3>
                  <div style={{ fontSize: "12px", color: "#FF7900", fontWeight: "700", marginTop: "2px" }}>
                    Authority: {activeRoleData.scope} • Clearance: {activeRoleData.clearance}
                  </div>
                  <p style={{ fontSize: "12px", color: isDark ? "#94A3B8" : "#64748B", margin: "6px 0 0" }}>
                    {activeRoleData.description}
                  </p>
                </div>

                {/* EDIT ACCESS BUTTON */}
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <button
                    onClick={() => openEditModal(activeRoleData)}
                    className="btn btn-primary"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      fontSize: "12.5px", fontWeight: "800", padding: "8px 16px",
                      background: "linear-gradient(135deg, #FF7900, #EA580C)",
                      border: "none", color: "#FFFFFF", borderRadius: "8px",
                      boxShadow: "0 2px 8px rgba(255, 121, 0, 0.35)", cursor: "pointer"
                    }}
                  >
                    <Sliders size={14} /> Edit Access Policy
                  </button>

                  <button
                    onClick={() => handleResetRole(activeRoleData.id)}
                    className="btn"
                    title="Reset role permissions to system defaults"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "4px",
                      fontSize: "12px", fontWeight: "700", padding: "8px 12px",
                      background: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
                      border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #CBD5E1",
                      color: isDark ? "#CBD5E1" : "#475569", borderRadius: "8px", cursor: "pointer"
                    }}
                  >
                    <RotateCcw size={13} /> Reset
                  </button>
                </div>
              </div>

              {/* Matrix Table */}
              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12px" }}>
                  <thead>
                    <tr style={{ 
                      background: isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC", 
                      borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0",
                      textAlign: "left"
                    }}>
                      <th style={{ padding: "10px 12px", fontWeight: "800", color: isDark ? "#CBD5E1" : "#475569" }}>System Resource</th>
                      <th style={{ padding: "10px 12px", fontWeight: "800", color: isDark ? "#CBD5E1" : "#475569" }}>Permitted Operations</th>
                      <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: "800", color: isDark ? "#CBD5E1" : "#475569" }}>Capability Level</th>
                      <th style={{ padding: "10px 12px", textAlign: "right", fontWeight: "800", color: isDark ? "#CBD5E1" : "#475569" }}>Configure</th>
                    </tr>
                  </thead>
                  <tbody>
                    {matrix?.resources?.map((res) => {
                      const allowed = activeRoleData.permissions[res] || [];
                      const hasFullAccess = allowed.length >= 6;
                      const hasReadonly = allowed.length > 0 && !allowed.includes("UPDATE") && !allowed.includes("CREATE");

                      return (
                        <tr 
                          key={res} 
                          style={{ borderBottom: isDark ? "1px solid rgba(255,255,255,0.04)" : "1px solid #F1F5F9" }}
                        >
                          <td style={{ padding: "12px", fontWeight: "700", color: isDark ? "#FFFFFF" : "#0F172A", textTransform: "capitalize" }}>
                            {res}
                          </td>

                          <td style={{ padding: "12px" }}>
                            {allowed.length === 0 ? (
                              <span style={{ color: "#EF4444", fontSize: "11px", fontStyle: "italic" }}>
                                ✕ No access (Strictly Blocked)
                              </span>
                            ) : (
                              <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                                {allowed.map(act => {
                                  const c = getActionColor(act);
                                  return (
                                    <span
                                      key={act}
                                      style={{
                                        background: c.bg,
                                        color: c.text,
                                        fontSize: "10px",
                                        fontWeight: "800",
                                        padding: "2px 6px",
                                        borderRadius: "4px"
                                      }}
                                    >
                                      {act}
                                    </span>
                                  );
                                })}
                              </div>
                            )}
                          </td>

                          <td style={{ padding: "12px", textAlign: "right" }}>
                            {allowed.length === 0 ? (
                              <span style={{ fontSize: "10.5px", color: "#EF4444", fontWeight: "700" }}>RESTRICTED</span>
                            ) : hasFullAccess ? (
                              <span style={{ fontSize: "10.5px", color: "#FF7900", fontWeight: "800" }}>FULL GOVERNANCE</span>
                            ) : hasReadonly ? (
                              <span style={{ fontSize: "10.5px", color: "#3B82F6", fontWeight: "700" }}>READ ONLY</span>
                            ) : (
                              <span style={{ fontSize: "10.5px", color: "#10B981", fontWeight: "700" }}>OPERATIONAL</span>
                            )}
                          </td>

                          {/* Quick Edit Access Button per row */}
                          <td style={{ padding: "12px", textAlign: "right" }}>
                            <button
                              onClick={() => openEditModal(activeRoleData, res)}
                              style={{
                                display: "inline-flex", alignItems: "center", gap: "4px",
                                padding: "4px 8px", borderRadius: "6px",
                                background: "rgba(255, 121, 0, 0.08)", border: "1px solid rgba(255, 121, 0, 0.25)",
                                color: "#FF7900", fontSize: "11px", fontWeight: "700", cursor: "pointer"
                              }}
                              title={`Configure access permissions for ${res}`}
                            >
                              <Edit3 size={11} /> Configure
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Live Permission Simulator */}
      <div style={{ 
        background: isDark ? "#0A1220" : "#FFFFFF", 
        border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #E2E8F0",
        borderRadius: "14px", 
        padding: "20px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "14px" }}>
          <Sparkles size={18} color="#FF7900" />
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A" }}>
            Live Role-Capability Policy Simulator
          </h3>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "16px" }}>
          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: isDark ? "#94A3B8" : "#64748B", marginBottom: "4px" }}>Admin Tier</label>
            <select
              value={simRole}
              onChange={(e) => setSimRole(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "#0A1220" : "#FFFFFF", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "12.5px" }}
            >
              {matrix?.roles?.map(r => <option key={r.id} value={r.id}>{r.id}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: isDark ? "#94A3B8" : "#64748B", marginBottom: "4px" }}>Target Resource</label>
            <select
              value={simResource}
              onChange={(e) => setSimResource(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "#0A1220" : "#FFFFFF", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "12.5px", textTransform: "capitalize" }}
            >
              {matrix?.resources?.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>

          <div>
            <label style={{ display: "block", fontSize: "11px", fontWeight: "700", color: isDark ? "#94A3B8" : "#64748B", marginBottom: "4px" }}>Action Attempt</label>
            <select
              value={simAction}
              onChange={(e) => setSimAction(e.target.value)}
              style={{ width: "100%", padding: "8px 10px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "#0A1220" : "#FFFFFF", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "12.5px" }}
            >
              {matrix?.actions?.map(a => <option key={a} value={a}>{a}</option>)}
            </select>
          </div>
        </div>

        {/* Simulation Output Card */}
        {simResult && (
          <div style={{ 
            padding: "14px 18px", 
            borderRadius: "10px", 
            background: simResult.allowed ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
            border: simResult.allowed ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid rgba(239, 68, 68, 0.3)",
            display: "flex",
            alignItems: "center",
            gap: "14px"
          }}>
            <div style={{ 
              width: "36px", height: "36px", borderRadius: "50%", 
              background: simResult.allowed ? "#10B981" : "#EF4444", 
              color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center",
              flexShrink: 0
            }}>
              {simResult.allowed ? <Check size={20} /> : <X size={20} />}
            </div>

            <div>
              <div style={{ fontWeight: "800", fontSize: "13px", color: simResult.allowed ? "#10B981" : "#EF4444" }}>
                {simResult.allowed ? "AUTHORIZED ACCESS GRANTED" : "FORBIDDEN ACCESS REJECTED (HTTP 403)"}
              </div>
              <div style={{ fontSize: "12px", color: isDark ? "#CBD5E1" : "#475569", marginTop: "2px" }}>
                {simResult.explanation}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================================== */}
      {/* MODAL: EDIT CAPABILITY & ACCESS PERMISSION POLICY */}
      {/* ============================================================================== */}
      {isEditModalOpen && editingRole && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.8)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: isDark ? "#0A1220" : "#FFFFFF",
            width: "100%", maxWidth: "860px", maxHeight: "92vh",
            borderRadius: "16px",
            border: isDark ? "1px solid rgba(255, 121, 0, 0.35)" : "1px solid #E2E8F0",
            display: "flex", flexDirection: "column", overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "18px 24px",
              borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #E2E8F0",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: isDark ? "rgba(255, 121, 0, 0.05)" : "#F8FAFC"
            }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sliders size={20} color="#FF7900" />
                  <h2 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A" }}>
                    Configure Capability Policy: {editingRole.title}
                  </h2>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                  <span style={{
                    fontSize: "11px", fontWeight: "800", padding: "2px 8px", borderRadius: "4px",
                    background: "rgba(255, 121, 0, 0.15)", color: "#FF7900", fontFamily: "monospace"
                  }}>
                    {editingRole.id}
                  </span>
                  <span style={{ fontSize: "12px", color: isDark ? "#94A3B8" : "#64748B" }}>
                    Clearance: {editingClearance} • Scope: {editingScope}
                  </span>
                </div>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                style={{ background: "transparent", border: "none", color: isDark ? "#94A3B8" : "#64748B", cursor: "pointer", padding: "6px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Quick Presets Toolbar */}
            <div style={{
              padding: "10px 24px",
              background: isDark ? "rgba(255, 255, 255, 0.02)" : "#F1F5F9",
              borderBottom: isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid #E2E8F0",
              display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "8px"
            }}>
              <span style={{ fontSize: "11.5px", fontWeight: "700", color: isDark ? "#94A3B8" : "#64748B" }}>
                Quick Policy Presets:
              </span>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                <button
                  type="button"
                  onClick={() => applyPreset('full')}
                  style={{
                    padding: "4px 10px", fontSize: "11px", fontWeight: "700", borderRadius: "6px",
                    background: "rgba(255, 121, 0, 0.12)", border: "1px solid rgba(255, 121, 0, 0.3)", color: "#FF7900", cursor: "pointer"
                  }}
                >
                  ⚡ Grant All
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('operational')}
                  style={{
                    padding: "4px 10px", fontSize: "11px", fontWeight: "700", borderRadius: "6px",
                    background: "rgba(16, 185, 129, 0.12)", border: "1px solid rgba(16, 185, 129, 0.3)", color: "#10B981", cursor: "pointer"
                  }}
                >
                  🛡️ Operational Standard
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('readonly')}
                  style={{
                    padding: "4px 10px", fontSize: "11px", fontWeight: "700", borderRadius: "6px",
                    background: "rgba(59, 130, 246, 0.12)", border: "1px solid rgba(59, 130, 246, 0.3)", color: "#3B82F6", cursor: "pointer"
                  }}
                >
                  👁️ Read-Only
                </button>
                <button
                  type="button"
                  onClick={() => applyPreset('clear')}
                  style={{
                    padding: "4px 10px", fontSize: "11px", fontWeight: "700", borderRadius: "6px",
                    background: "rgba(239, 68, 68, 0.12)", border: "1px solid rgba(239, 68, 68, 0.3)", color: "#EF4444", cursor: "pointer"
                  }}
                >
                  🚫 Revoke All
                </button>
              </div>
            </div>

            {/* Modal Body: Resources & Checkboxes */}
            <div style={{ padding: "18px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px" }}>
              <div style={{ fontSize: "12px", color: isDark ? "#94A3B8" : "#64748B", display: "flex", alignItems: "center", gap: "6px" }}>
                <Info size={14} color="#FF7900" />
                <span>Click any operation badge to toggle authorization. Active capabilities display highlighted with checkmarks.</span>
              </div>

              {matrix?.resources?.map((res) => {
                const allowed = editingPermissions[res] || [];
                const allActions = matrix?.actions || [];
                const isFocused = focusedResource === res;

                return (
                  <div 
                    key={res}
                    style={{
                      padding: "12px 16px",
                      borderRadius: "10px",
                      border: isFocused ? "1.5px solid #FF7900" : isDark ? "1px solid rgba(255, 255, 255, 0.06)" : "1px solid #E2E8F0",
                      background: isDark ? "rgba(255, 255, 255, 0.02)" : "#FAFAFA"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <span style={{ fontWeight: "800", fontSize: "13px", color: isDark ? "#FFFFFF" : "#0F172A", textTransform: "capitalize" }}>
                        {res}
                      </span>
                      <div style={{ display: "flex", gap: "6px" }}>
                        <button
                          type="button"
                          onClick={() => grantAllForResource(res)}
                          style={{
                            fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "4px",
                            background: "transparent", border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #CBD5E1",
                            color: isDark ? "#CBD5E1" : "#475569", cursor: "pointer"
                          }}
                        >
                          + All
                        </button>
                        <button
                          type="button"
                          onClick={() => setReadOnlyForResource(res)}
                          style={{
                            fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "4px",
                            background: "transparent", border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #CBD5E1",
                            color: isDark ? "#CBD5E1" : "#475569", cursor: "pointer"
                          }}
                        >
                          View Only
                        </button>
                        <button
                          type="button"
                          onClick={() => clearResource(res)}
                          style={{
                            fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "4px",
                            background: "transparent", border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #CBD5E1",
                            color: isDark ? "#CBD5E1" : "#475569", cursor: "pointer"
                          }}
                        >
                          Clear
                        </button>
                      </div>
                    </div>

                    {/* Action Toggle Pills */}
                    <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                      {allActions.map(act => {
                        const isGranted = allowed.includes(act);
                        const c = getActionColor(act);

                        return (
                          <button
                            key={act}
                            type="button"
                            onClick={() => togglePermission(res, act)}
                            style={{
                              padding: "4px 10px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "800",
                              cursor: "pointer",
                              transition: "all 0.15s ease",
                              border: isGranted ? `1.5px solid ${c.text}` : isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #CBD5E1",
                              background: isGranted ? c.bg : "transparent",
                              color: isGranted ? c.text : isDark ? "#64748B" : "#94A3B8",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            {isGranted ? <Check size={11} /> : <Plus size={11} />}
                            {act}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "16px 24px",
              borderTop: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #E2E8F0",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: isDark ? "rgba(255, 255, 255, 0.02)" : "#F8FAFC"
            }}>
              <button
                type="button"
                onClick={() => setIsEditModalOpen(false)}
                className="btn"
                style={{
                  padding: "8px 18px", fontSize: "12.5px", fontWeight: "700",
                  background: "transparent", border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #CBD5E1",
                  color: isDark ? "#CBD5E1" : "#475569", borderRadius: "8px", cursor: "pointer"
                }}
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleSavePermissions}
                disabled={saving}
                className="btn btn-primary"
                style={{
                  display: "inline-flex", alignItems: "center", gap: "8px",
                  padding: "10px 22px", fontSize: "13px", fontWeight: "800",
                  background: "linear-gradient(135deg, #FF7900, #EA580C)",
                  border: "none", color: "#FFFFFF", borderRadius: "8px",
                  boxShadow: "0 4px 12px rgba(255, 121, 0, 0.4)", cursor: saving ? "not-allowed" : "pointer"
                }}
              >
                {saving ? (
                  <>
                    <RefreshCw size={14} className="spin" /> Deploying Policy...
                  </>
                ) : (
                  <>
                    <Save size={15} /> Save & Deploy Access Policy
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
