import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { useTranslation } from "../../../i18n/useTranslation";
import { 
  Building2, Globe, Users, ShieldCheck, MapPin, RefreshCw, 
  ChevronRight, CheckCircle2, UserPlus, X, Layers, Eye, Search,
  Check, ArrowRight, Shield
} from "lucide-react";
import { getZoneManagementData, assignZoneAdmin, getAdmins } from "../../../services/admin/governanceService";
import { getZoneStates } from "../../../services/admin/geographyService";

export default function SuperAdminZoneManagement() {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  const [zones, setZones] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedZone, setSelectedZone] = useState(null);
  const [zoneStates, setZoneStates] = useState(null);
  const [statesLoading, setStatesLoading] = useState(false);
  const [showViewModal, setShowViewModal] = useState(false);

  // Assign Scope Modal State
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [assignScopeLevel, setAssignScopeLevel] = useState("ZONE"); // 'ZONE' | 'STATE' | 'UNION_TERRITORY'
  const [assignTargetZone, setAssignTargetZone] = useState(null);
  const [allAdmins, setAllAdmins] = useState([]);
  const [selectedAdminId, setSelectedAdminId] = useState("");
  const [selectedScopeCodes, setSelectedScopeCodes] = useState([]);
  const [assignSearch, setAssignSearch] = useState("");
  const [assignLoading, setAssignLoading] = useState(false);
  const [assignSuccess, setAssignSuccess] = useState(null);
  const [assignError, setAssignError] = useState(null);

  const fetchZones = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getZoneManagementData();
      setZones(data.zones || []);
      // If a zone was selected, update its reference
      if (selectedZone) {
        const updated = (data.zones || []).find(z => z.code === selectedZone.code);
        if (updated) setSelectedZone(updated);
      }
    } catch (err) {
      console.error("Error fetching zone management data:", err);
    } finally {
      setLoading(false);
    }
  }, [selectedZone]);

  useEffect(() => {
    fetchZones();
  }, []);

  // Load zone states on view / drill-down
  const handleViewZone = async (zone) => {
    setSelectedZone(zone);
    setShowViewModal(true);
    setStatesLoading(true);
    try {
      const data = await getZoneStates(zone.code);
      setZoneStates(data);
    } catch (err) {
      console.error("Failed to load zone states:", err);
      // Fall back to states_list / uts_list if present on zone
      if (zone.states_list || zone.uts_list) {
        setZoneStates({
          zone,
          states: zone.states_list || [],
          union_territories: zone.uts_list || [],
          total_units: (zone.states_list?.length || 0) + (zone.uts_list?.length || 0)
        });
      }
    } finally {
      setStatesLoading(false);
    }
  };

  // Open assign modal with specified target and scope level
  const handleOpenAssign = async (zone = null, level = "ZONE", preselectedCode = null) => {
    const targetZ = zone || selectedZone || zones[0];
    setAssignTargetZone(targetZ);
    setAssignScopeLevel(level);
    
    if (preselectedCode) {
      setSelectedScopeCodes([preselectedCode]);
    } else if (level === "ZONE" && targetZ) {
      setSelectedScopeCodes([targetZ.code]);
    } else {
      setSelectedScopeCodes([]);
    }

    setAssignSearch("");
    setAssignSuccess(null);
    setAssignError(null);
    setShowAssignModal(true);

    try {
      const data = await getAdmins({ limit: 100 });
      const adminList = data.admins || data.data || [];
      setAllAdmins(adminList);
      if (adminList.length > 0 && !selectedAdminId) {
        setSelectedAdminId(adminList[0].id);
      }
    } catch (err) {
      console.error("Failed to load admins:", err);
    }
  };

  // Handle assign submit
  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAdminId) {
      setAssignError("Please select an administrator to assign.");
      return;
    }
    if (selectedScopeCodes.length === 0) {
      setAssignError(`Please select at least one ${assignScopeLevel.toLowerCase().replace('_', ' ')}.`);
      return;
    }

    setAssignLoading(true);
    setAssignError(null);
    try {
      await assignZoneAdmin(selectedAdminId, selectedScopeCodes, assignScopeLevel);
      setAssignSuccess(`${assignScopeLevel.replace('_', ' ')} assignment updated successfully.`);
      setTimeout(() => {
        setShowAssignModal(false);
        fetchZones();
        if (selectedZone) {
          handleViewZone(selectedZone);
        }
      }, 1000);
    } catch (err) {
      setAssignError(err.message || "Failed to save assignment.");
    } finally {
      setAssignLoading(false);
    }
  };

  const toggleScopeCode = (code) => {
    if (selectedScopeCodes.includes(code)) {
      setSelectedScopeCodes(selectedScopeCodes.filter(c => c !== code));
    } else {
      setSelectedScopeCodes([...selectedScopeCodes, code]);
    }
  };

  // Helper to get selectable units for assign modal based on level
  const getSelectableUnits = () => {
    if (assignScopeLevel === "ZONE") {
      return zones.map(z => ({
        code: z.code,
        name: z.name,
        meta: `${z.states || z.state_count || 0} States, ${z.union_territories || z.ut_count || 0} UTs`
      }));
    }

    const currentZoneStates = (selectedZone?.states_list || zoneStates?.states || []);
    const currentZoneUTs = (selectedZone?.uts_list || zoneStates?.union_territories || []);

    if (assignScopeLevel === "STATE") {
      let list = currentZoneStates;
      if (list.length === 0 && assignTargetZone?.states_list) {
        list = assignTargetZone.states_list;
      }
      return list
        .filter(st => !assignSearch || st.name?.toLowerCase().includes(assignSearch.toLowerCase()) || st.code?.toLowerCase().includes(assignSearch.toLowerCase()))
        .map(st => ({
          code: st.code,
          name: st.name,
          meta: `Capital: ${st.capital || 'N/A'}`
        }));
    }

    if (assignScopeLevel === "UNION_TERRITORY") {
      let list = currentZoneUTs;
      if (list.length === 0 && assignTargetZone?.uts_list) {
        list = assignTargetZone.uts_list;
      }
      return list
        .filter(ut => !assignSearch || ut.name?.toLowerCase().includes(assignSearch.toLowerCase()) || ut.code?.toLowerCase().includes(assignSearch.toLowerCase()))
        .map(ut => ({
          code: ut.code,
          name: ut.name,
          meta: `Capital: ${ut.capital || 'N/A'}`
        }));
    }

    return [];
  };

  return (
    <div className="fade-in" style={{ paddingBottom: "40px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A", margin: 0 }}>
              {t("National Zonal Sector Management")}
            </h1>
            <span style={{ 
              background: "rgba(59, 130, 246, 0.12)", color: "#3B82F6", 
              fontSize: "0.75rem", fontWeight: "800", padding: "3px 10px", borderRadius: "12px", border: "1px solid rgba(59, 130, 246, 0.3)"
            }}>
              {t("4 ZONAL SECTORS")}
            </span>
          </div>
          <p style={{ margin: 0, color: isDark ? "#94A3B8" : "#64748B", fontSize: "0.88rem" }}>
            {t("Supervise national operational zones, state/UT aggregates, and multi-tier administrator assignments")}
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => handleOpenAssign(null, "ZONE")}
            style={{
              background: "#FF7900",
              border: "none",
              color: "#050A12",
              padding: "8px 16px",
              borderRadius: "8px",
              fontWeight: "800",
              fontSize: "12.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(255, 121, 0, 0.25)"
            }}
          >
            <UserPlus size={14} /> {t("Assign Administrator")}
          </button>

          <button
            onClick={fetchZones}
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
            <RefreshCw size={14} className={loading ? "spin" : ""} /> {t("Refresh")}
          </button>
        </div>
      </div>

      {/* 4 National Zone Cards Grid */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "18px", marginBottom: "28px" }}>
        {zones.map((zone) => {
          const isSelected = selectedZone?.code === zone.code;

          return (
            <div
              key={zone.code}
              style={{
                background: isDark ? "#0A1220" : "#FFFFFF",
                border: isSelected 
                  ? "2px solid #FF7900" 
                  : isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #E2E8F0",
                borderRadius: "14px",
                padding: "20px",
                position: "relative",
                transition: "all 0.2s ease",
                boxShadow: isSelected ? "0 8px 24px rgba(255, 121, 0, 0.15)" : "none"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "12px" }}>
                <div>
                  <span style={{ 
                    fontFamily: "monospace", fontWeight: "800", fontSize: "11px", 
                    color: "#FF7900", background: "rgba(255,121,0,0.1)", 
                    padding: "2px 6px", borderRadius: "4px" 
                  }}>
                    {zone.code}
                  </span>
                  <h3 style={{ margin: "4px 0 0", fontSize: "1.2rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A" }}>
                    {t(zone.name)}
                  </h3>
                </div>

                <span style={{
                  background: "rgba(16, 185, 129, 0.12)", color: "#10B981",
                  border: "1px solid rgba(16, 185, 129, 0.3)",
                  fontSize: "10.5px", fontWeight: "700", padding: "2px 8px", borderRadius: "10px"
                }}>
                  {t(zone.status?.toUpperCase() || "ACTIVE")}
                </span>
              </div>

              <p style={{ fontSize: "12px", color: isDark ? "#94A3B8" : "#64748B", margin: "0 0 16px", minHeight: "36px" }}>
                {t(zone.description)}
              </p>

              {/* Aggregates row */}
              <div style={{ 
                display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", 
                background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", 
                padding: "10px", borderRadius: "8px", marginBottom: "16px",
                textAlign: "center"
              }}>
                <div>
                  <div style={{ fontSize: "10px", color: isDark ? "#94A3B8" : "#64748B", fontWeight: "700" }}>{t("STATES")}</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A" }}>{zone.states || zone.state_count || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: isDark ? "#94A3B8" : "#64748B", fontWeight: "700" }}>{t("UTS")}</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A" }}>{zone.union_territories || zone.ut_count || 0}</div>
                </div>
                <div>
                  <div style={{ fontSize: "10px", color: isDark ? "#94A3B8" : "#64748B", fontWeight: "700" }}>{t("TOTAL UNITS")}</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#FF7900" }}>{zone.total_units || 0}</div>
                </div>
              </div>

              {/* Assigned Admins */}
              <div style={{ marginBottom: "16px" }}>
                <div style={{ fontSize: "11px", fontWeight: "700", color: isDark ? "#CBD5E1" : "#475569", marginBottom: "6px", display: "flex", justifyContent: "space-between" }}>
                  <span>{t("Assigned Zone Admins")}</span>
                  <span style={{ color: "#3B82F6", fontWeight: "800" }}>{zone.assigned_admins?.length || 0}</span>
                </div>

                {!zone.assigned_admins || zone.assigned_admins.length === 0 ? (
                  <div style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B", fontStyle: "italic" }}>
                    {t("No Zone Admin assigned")}
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                    {zone.assigned_admins.map(adm => (
                      <div key={adm.id} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11.5px", color: isDark ? "#E2E8F0" : "#1E293B" }}>
                        <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#3B82F6" }} />
                        <strong>{adm.full_name}</strong>
                        <span style={{ color: isDark ? "#94A3B8" : "#64748B", fontSize: "10.5px" }}>({adm.admin_code})</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Action Buttons: VIEW States & UTs and ASSIGN */}
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => handleViewZone(zone)}
                  style={{
                    flex: 1,
                    background: isSelected ? "#FF7900" : isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
                    color: isSelected ? "#050A12" : isDark ? "#FFFFFF" : "#0F172A",
                    border: isDark ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid #CBD5E1",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "5px"
                  }}
                >
                  <Eye size={13} /> {t("View States & UTs")}
                </button>

                <button
                  onClick={() => handleOpenAssign(zone, "ZONE")}
                  style={{
                    background: "none",
                    border: isDark ? "1px solid rgba(59, 130, 246, 0.4)" : "1px solid #93C5FD",
                    color: "#3B82F6",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontWeight: "700",
                    fontSize: "12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}
                  title={t("Assign Administrator")}
                >
                  <UserPlus size={13} /> {t("Assign")}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Zone Hierarchy View Section */}
      {selectedZone && (
        <div style={{ 
          background: isDark ? "#0A1220" : "#FFFFFF", 
          border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #E2E8F0",
          borderRadius: "14px", 
          padding: "24px",
          marginBottom: "28px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "18px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: "#FF7900", fontWeight: "800", fontSize: "12px" }}>{t("ZONAL HIERARCHY OVERVIEW")}</span>
                <ChevronRight size={14} color="#94A3B8" />
                <h3 style={{ margin: 0, fontSize: "1.25rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A" }}>
                  {t(selectedZone.name)} ({selectedZone.code})
                </h3>
              </div>
              <span style={{ fontSize: "12px", color: isDark ? "#94A3B8" : "#64748B" }}>
                {t("View official States, Union Territories, and assigned administrators for this sector")}
              </span>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <button
                onClick={() => handleOpenAssign(selectedZone, "STATE")}
                style={{
                  background: isDark ? "rgba(255, 121, 0, 0.15)" : "#FFF7ED",
                  border: "1px solid #FF7900",
                  color: "#FF7900",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "11.5px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <UserPlus size={12} /> {t("Assign State Admin")}
              </button>

              <button
                onClick={() => handleOpenAssign(selectedZone, "UNION_TERRITORY")}
                style={{
                  background: isDark ? "rgba(59, 130, 246, 0.15)" : "#EFF6FF",
                  border: "1px solid #3B82F6",
                  color: "#3B82F6",
                  padding: "6px 12px",
                  borderRadius: "8px",
                  fontSize: "11.5px",
                  fontWeight: "700",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                <UserPlus size={12} /> {t("Assign UT Admin")}
              </button>

              <button
                onClick={() => setSelectedZone(null)}
                style={{ background: "none", border: "none", color: isDark ? "#94A3B8" : "#64748B", cursor: "pointer", padding: "4px" }}
                title={t("Close View")}
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {statesLoading ? (
            <div style={{ padding: "40px", textAlign: "center", color: isDark ? "#94A3B8" : "#64748B" }}>
              <RefreshCw size={24} className="spin" style={{ margin: "0 auto 10px" }} />
              {t("Querying database hierarchy...")}
            </div>
          ) : (
            <div>
              {/* States Section */}
              <div style={{ marginBottom: "24px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                  <h4 style={{ fontSize: "12.5px", fontWeight: "800", color: "#FF7900", textTransform: "uppercase", margin: 0 }}>
                    {t("States")} ({zoneStates?.states?.length || selectedZone.states_list?.length || selectedZone.states || 0})
                  </h4>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
                  {(zoneStates?.states || selectedZone.states_list || []).map(st => (
                    <div
                      key={st.code}
                      style={{
                        background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC",
                        border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0",
                        padding: "12px 14px",
                        borderRadius: "10px",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between"
                      }}
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                          <span style={{ fontWeight: "800", fontSize: "13px", color: isDark ? "#FFFFFF" : "#0F172A" }}>{t(st.name)}</span>
                          <span style={{ fontFamily: "monospace", fontSize: "11px", fontWeight: "800", color: "#FF7900", background: "rgba(255,121,0,0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                            {st.code}
                          </span>
                        </div>
                        <div style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B", marginBottom: "8px" }}>
                          {t("Capital")}: {st.capital || "N/A"}
                        </div>

                        {/* Assigned Admin Status */}
                        <div style={{ fontSize: "11px", marginBottom: "8px" }}>
                          <span style={{ color: isDark ? "#94A3B8" : "#64748B", fontWeight: "600" }}>{t("Admin")}: </span>
                          {st.assigned_admins && st.assigned_admins.length > 0 ? (
                            <strong style={{ color: "#10B981" }}>{st.assigned_admins[0].full_name}</strong>
                          ) : (
                            <span style={{ color: isDark ? "#64748B" : "#94A3B8", fontStyle: "italic" }}>{t("Inherits Zonal Command")}</span>
                          )}
                        </div>
                      </div>

                      <button
                        onClick={() => handleOpenAssign(selectedZone, "STATE", st.code)}
                        style={{
                          background: "none",
                          border: isDark ? "1px solid rgba(255,121,0,0.3)" : "1px solid #FED7AA",
                          color: "#FF7900",
                          padding: "5px 10px",
                          borderRadius: "6px",
                          fontSize: "11px",
                          fontWeight: "700",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "4px",
                          marginTop: "6px"
                        }}
                      >
                        <UserPlus size={11} /> {t("Assign State Scope")}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Union Territories Section */}
              {((zoneStates?.union_territories?.length || 0) > 0 || (selectedZone.uts_list?.length || 0) > 0) && (
                <div>
                  <h4 style={{ fontSize: "12.5px", fontWeight: "800", color: "#3B82F6", textTransform: "uppercase", marginBottom: "12px" }}>
                    {t("Union Territories")} ({zoneStates?.union_territories?.length || selectedZone.uts_list?.length || selectedZone.union_territories || 0})
                  </h4>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "12px" }}>
                    {(zoneStates?.union_territories || selectedZone.uts_list || []).map(ut => (
                      <div
                        key={ut.code}
                        style={{
                          background: isDark ? "rgba(59, 130, 246, 0.05)" : "#EFF6FF",
                          border: isDark ? "1px solid rgba(59, 130, 246, 0.2)" : "1px solid #BFDBFE",
                          padding: "12px 14px",
                          borderRadius: "10px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between"
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <span style={{ fontWeight: "800", fontSize: "13px", color: isDark ? "#FFFFFF" : "#0F172A" }}>{t(ut.name)}</span>
                            <span style={{ fontFamily: "monospace", fontSize: "11px", fontWeight: "800", color: "#3B82F6", background: "rgba(59,130,246,0.1)", padding: "2px 6px", borderRadius: "4px" }}>
                              {ut.code}
                            </span>
                          </div>
                          <div style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B", marginBottom: "8px" }}>
                            {t("Capital")}: {ut.capital || "N/A"}
                          </div>

                          <div style={{ fontSize: "11px", marginBottom: "8px" }}>
                            <span style={{ color: isDark ? "#94A3B8" : "#64748B", fontWeight: "600" }}>{t("Admin")}: </span>
                            {ut.assigned_admins && ut.assigned_admins.length > 0 ? (
                              <strong style={{ color: "#3B82F6" }}>{ut.assigned_admins[0].full_name}</strong>
                            ) : (
                              <span style={{ color: isDark ? "#64748B" : "#94A3B8", fontStyle: "italic" }}>{t("Inherits Zonal Command")}</span>
                            )}
                          </div>
                        </div>

                        <button
                          onClick={() => handleOpenAssign(selectedZone, "UNION_TERRITORY", ut.code)}
                          style={{
                            background: "none",
                            border: isDark ? "1px solid rgba(59,130,246,0.3)" : "1px solid #BFDBFE",
                            color: "#3B82F6",
                            padding: "5px 10px",
                            borderRadius: "6px",
                            fontSize: "11px",
                            fontWeight: "700",
                            cursor: "pointer",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            gap: "4px",
                            marginTop: "6px"
                          }}
                        >
                          <UserPlus size={11} /> {t("Assign UT Scope")}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ENHANCED MULTI-TIER ASSIGN SCOPES MODAL */}
      {showAssignModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ 
            background: isDark ? "#0A1220" : "#FFFFFF", 
            border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #E2E8F0",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "540px",
            overflow: "hidden",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
          }}>
            <div style={{ padding: "18px 20px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A" }}>
                  {t("Assign Geographic Scopes")}
                </h3>
                <span style={{ fontSize: "11.5px", color: isDark ? "#94A3B8" : "#64748B" }}>
                  {t("Bind Zone, State, or Union Territory administrative jurisdictions")}
                </span>
              </div>
              <button onClick={() => setShowAssignModal(false)} style={{ background: "none", border: "none", color: isDark ? "#94A3B8" : "#64748B", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleAssignSubmit} style={{ padding: "20px" }}>
              {assignError && (
                <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#EF4444", fontSize: "12px", marginBottom: "14px", fontWeight: "600" }}>
                  {assignError}
                </div>
              )}
              {assignSuccess && (
                <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#10B981", fontSize: "12px", marginBottom: "14px", fontWeight: "600" }}>
                  {assignSuccess}
                </div>
              )}

              {/* Step 1: Select Scope Tier Level */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#CBD5E1" : "#475569", marginBottom: "6px" }}>
                  {t("1. Choose Jurisdiction Tier *")}
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignScopeLevel("ZONE");
                      setSelectedScopeCodes(assignTargetZone ? [assignTargetZone.code] : ["SZ"]);
                    }}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: assignScopeLevel === "ZONE" ? "2px solid #FF7900" : isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #CBD5E1",
                      background: assignScopeLevel === "ZONE" ? "rgba(255,121,0,0.12)" : "transparent",
                      color: assignScopeLevel === "ZONE" ? "#FF7900" : isDark ? "#CBD5E1" : "#475569",
                      fontWeight: "700",
                      fontSize: "12px",
                      cursor: "pointer"
                    }}
                  >
                    🌐 {t("Zone Level")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignScopeLevel("STATE");
                      setSelectedScopeCodes([]);
                    }}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: assignScopeLevel === "STATE" ? "2px solid #FF7900" : isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #CBD5E1",
                      background: assignScopeLevel === "STATE" ? "rgba(255,121,0,0.12)" : "transparent",
                      color: assignScopeLevel === "STATE" ? "#FF7900" : isDark ? "#CBD5E1" : "#475569",
                      fontWeight: "700",
                      fontSize: "12px",
                      cursor: "pointer"
                    }}
                  >
                    🏛️ {t("State Level")}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAssignScopeLevel("UNION_TERRITORY");
                      setSelectedScopeCodes([]);
                    }}
                    style={{
                      padding: "8px 10px",
                      borderRadius: "8px",
                      border: assignScopeLevel === "UNION_TERRITORY" ? "2px solid #3B82F6" : isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #CBD5E1",
                      background: assignScopeLevel === "UNION_TERRITORY" ? "rgba(59,130,246,0.12)" : "transparent",
                      color: assignScopeLevel === "UNION_TERRITORY" ? "#3B82F6" : isDark ? "#CBD5E1" : "#475569",
                      fontWeight: "700",
                      fontSize: "12px",
                      cursor: "pointer"
                    }}
                  >
                    📍 {t("Union Territory")}
                  </button>
                </div>
              </div>

              {/* Step 2: Select Administrator */}
              <div style={{ marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#CBD5E1" : "#475569", marginBottom: "4px" }}>
                  {t("2. Select Administrator Account *")}
                </label>
                {allAdmins.length === 0 ? (
                  <div style={{ fontSize: "12px", color: "#EF4444", background: "rgba(239,68,68,0.08)", padding: "10px", borderRadius: "8px" }}>
                    {t("Loading administrator directory...")}
                  </div>
                ) : (
                  <select
                    value={selectedAdminId}
                    onChange={(e) => setSelectedAdminId(e.target.value)}
                    style={{ 
                      width: "100%", padding: "9px 12px", borderRadius: "8px", 
                      border: "1px solid #CBD5E1", background: isDark ? "#0A1220" : "#FFFFFF", 
                      color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "13px" 
                    }}
                  >
                    {allAdmins.map(adm => (
                      <option key={adm.id} value={adm.id}>
                        {adm.full_name} ({adm.admin_code}) — {adm.role}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Step 3: Select Entities */}
              <div style={{ marginBottom: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <label style={{ fontSize: "11.5px", fontWeight: "700", color: isDark ? "#CBD5E1" : "#475569" }}>
                    3. {t("Select")} {t(assignScopeLevel.replace('_', ' '))} {t("Unit(s) *")}
                  </label>
                  {assignScopeLevel !== "ZONE" && (
                    <span style={{ fontSize: "11px", color: "#FF7900", fontWeight: "700" }}>
                      {t("Sector")}: {assignTargetZone?.name ? t(assignTargetZone.name) : t("All Sectors")}
                    </span>
                  )}
                </div>

                {assignScopeLevel !== "ZONE" && (
                  <div style={{ position: "relative", marginBottom: "10px" }}>
                    <input
                      type="text"
                      placeholder={`${t("Search")} ${assignScopeLevel.toLowerCase().replace('_', ' ')}...`}
                      value={assignSearch}
                      onChange={(e) => setAssignSearch(e.target.value)}
                      style={{
                        width: "100%",
                        padding: "7px 10px 7px 30px",
                        borderRadius: "6px",
                        border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #CBD5E1",
                        background: isDark ? "rgba(255,255,255,0.03)" : "#FFFFFF",
                        color: isDark ? "#FFFFFF" : "#0F172A",
                        fontSize: "12px"
                      }}
                    />
                    <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#94A3B8" }} />
                  </div>
                )}

                <div style={{ maxHeight: "200px", overflowY: "auto", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  {getSelectableUnits().map(unit => {
                    const isChecked = selectedScopeCodes.includes(unit.code);
                    return (
                      <div
                        key={unit.code}
                        onClick={() => toggleScopeCode(unit.code)}
                        style={{
                          padding: "8px 10px",
                          borderRadius: "8px",
                          border: isChecked ? "2px solid #3B82F6" : isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #CBD5E1",
                          background: isChecked ? "rgba(59, 130, 246, 0.12)" : isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC",
                          cursor: "pointer",
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "space-between"
                        }}
                      >
                        <div>
                          <div style={{ fontWeight: "700", fontSize: "12px", color: isDark ? "#FFFFFF" : "#0F172A" }}>
                            {t(unit.name)} ({unit.code})
                          </div>
                          <div style={{ fontSize: "10px", color: isDark ? "#94A3B8" : "#64748B" }}>
                            {unit.meta}
                          </div>
                        </div>
                        {isChecked && <CheckCircle2 size={16} color="#3B82F6" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowAssignModal(false)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #CBD5E1", background: "none", color: isDark ? "#CBD5E1" : "#475569", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}
                >
                  {t("Cancel")}
                </button>
                <button
                  type="submit"
                  disabled={assignLoading || allAdmins.length === 0}
                  style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#FF7900", color: "#050A12", fontWeight: "800", fontSize: "12px", cursor: assignLoading ? "not-allowed" : "pointer" }}
                >
                  {assignLoading ? t("Saving...") : t("Save Scope Assignment")}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
