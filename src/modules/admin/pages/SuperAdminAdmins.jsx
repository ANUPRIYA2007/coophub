import React, { useState, useEffect, useCallback } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { useTranslation } from "../../../i18n/useTranslation";
import { 
  Users, ShieldCheck, Search, Filter, Plus, RefreshCw, 
  AlertTriangle, ShieldAlert, CheckCircle2, XCircle, ArrowUpRight,
  ChevronLeft, ChevronRight, Eye, MoreVertical, X, Lock, Building2, MapPin,
  Sparkles, Trash2, ShieldX, AlertCircle, Pencil
} from "lucide-react";
import { 
  getAdmins, createAdmin, getAdminDetails, enforceAdmin, removeAdmin, getAdminAISummary, updateAdmin 
} from "../../../services/admin/governanceService";
import { getZones } from "../../../services/admin/geographyService";

export default function SuperAdminAdmins() {
  const { isDark } = useTheme();
  const { t } = useTranslation();

  // State
  const [admins, setAdmins] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [scopeFilter, setScopeFilter] = useState("");

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showEnforceModal, setShowEnforceModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [adminDetail, setAdminDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Edit Modal State
  const [editForm, setEditForm] = useState({
    id: "",
    admin_code: "",
    full_name: "",
    email: "",
    phone: "",
    role: "ZONE_ADMIN",
    status: "active",
    scopes: [],
    reason: ""
  });
  const [editScopeLevel, setEditScopeLevel] = useState("ZONE");
  const [editScopeZone, setEditScopeZone] = useState("SZ");
  const [editScopeState, setEditScopeState] = useState("TN");
  const [editScopeDistrict, setEditScopeDistrict] = useState("");
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState(null);
  const [editSuccess, setEditSuccess] = useState(null);

  // AI Summary State
  const [aiSummary, setAiSummary] = useState(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiError, setAiError] = useState(null);

  // Delete State
  const [deleteReason, setDeleteReason] = useState("");
  const [deleting, setDeleting] = useState(false);

  // Form states
  const [createForm, setCreateForm] = useState({
    admin_code: "",
    email: "",
    full_name: "",
    role: "ZONE_ADMIN",
    clearance: "Level 4 Zonal",
    status: "active",
    scopes: []
  });
  const [formZone, setFormZone] = useState("SZ");
  const [formState, setFormState] = useState("TN");
  const [formDistrict, setFormDistrict] = useState("");
  const [formError, setFormError] = useState(null);
  const [formSuccess, setFormSuccess] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // Enforcement form
  const [enforceAction, setEnforceAction] = useState("SUSPEND");
  const [enforceReason, setEnforceReason] = useState("");
  const [enforceError, setEnforceError] = useState(null);
  const [enforcing, setEnforcing] = useState(false);

  // Geographic lookup
  const [geoZones, setGeoZones] = useState([]);

  // Fetch admins list
  const fetchAdminList = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getAdmins({
        page,
        limit,
        search,
        role: roleFilter,
        status: statusFilter,
        scope: scopeFilter
      });
      setAdmins(data.admins || []);
      setTotal(data.total || 0);
    } catch (err) {
      console.error("Error fetching admins:", err);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, roleFilter, statusFilter, scopeFilter]);

  useEffect(() => {
    fetchAdminList();
  }, [fetchAdminList]);

  // Load zones for scope selector
  useEffect(() => {
    (async () => {
      try {
        const data = await getZones();
        setGeoZones(data.zones || []);
      } catch (e) {}
    })();
  }, []);

  // Open detail modal
  const handleOpenDetail = async (admin) => {
    setSelectedAdmin(admin);
    setShowDetailModal(true);
    setDetailLoading(true);
    setAiSummary(null);
    setAiError(null);
    try {
      const data = await getAdminDetails(admin.id);
      setAdminDetail(data);
    } catch (err) {
      console.error("Failed to load details:", err);
    } finally {
      setDetailLoading(false);
    }
  };

  // Generate AI Summary for selected admin
  const handleGenerateAiSummary = async () => {
    if (!selectedAdmin) return;
    setAiLoading(true);
    setAiError(null);
    try {
      const res = await getAdminAISummary(selectedAdmin.id);
      setAiSummary(res.summary || res.data || res);
    } catch (err) {
      console.error("Failed to generate AI summary:", err);
      setAiError(err.message || "Failed to generate AI intelligence summary");
    } finally {
      setAiLoading(false);
    }
  };

  // Open enforcement modal with specific action
  const handleOpenEnforce = (admin, defaultAction = null) => {
    setSelectedAdmin(admin);
    setEnforceAction(defaultAction || (admin.status === "suspended" ? "REINSTATE" : "SUSPEND"));
    setEnforceReason(defaultAction === "WARN" ? "Formal compliance notification issued." : defaultAction === "BLOCK" ? "Account credentials locked by Super Admin directive." : "");
    setEnforceError(null);
    setShowEnforceModal(true);
  };

  // Direct action helpers
  const handleOpenWarn = (admin) => {
    handleOpenEnforce(admin, "WARN");
  };

  const handleOpenBlock = (admin) => {
    handleOpenEnforce(admin, "BLOCK");
  };

  const handleOpenDelete = (admin) => {
    setSelectedAdmin(admin);
    setDeleteReason("");
    setShowDeleteModal(true);
  };

  // Submit delete administrator
  const handleDeleteSubmit = async (e) => {
    e.preventDefault();
    if (!selectedAdmin) return;
    setDeleting(true);
    try {
      await removeAdmin(selectedAdmin.id, deleteReason || "Super Admin Governance Account Removal");
      setShowDeleteModal(false);
      setShowDetailModal(false);
      fetchAdminList();
    } catch (err) {
      alert("Failed to remove administrator: " + err.message);
    } finally {
      setDeleting(false);
    }
  };

  // Open Edit Administrator Modal
  const handleOpenEdit = async (admin) => {
    setSelectedAdmin(admin);
    setEditError(null);
    setEditSuccess(null);
    setEditLoading(false);

    let fullAdmin = admin;
    try {
      const data = await getAdminDetails(admin.id);
      if (data?.admin) fullAdmin = data.admin;
    } catch (e) {}

    setEditForm({
      id: fullAdmin.id,
      admin_code: fullAdmin.admin_code || "",
      full_name: fullAdmin.full_name || "",
      email: fullAdmin.email || "",
      phone: fullAdmin.phone || "",
      role: fullAdmin.role || "ZONE_ADMIN",
      status: fullAdmin.status || "active",
      scopes: Array.isArray(fullAdmin.scopes) ? [...fullAdmin.scopes] : [],
      reason: ""
    });
    setEditScopeLevel("ZONE");
    setEditScopeZone("SZ");
    setEditScopeState("TN");
    setEditScopeDistrict("");
    setShowEditModal(true);
  };

  // Add scope tag in edit modal
  const handleAddEditScope = () => {
    let entityCode = "";
    if (editScopeLevel === "ZONE") {
      entityCode = editScopeZone;
    } else if (editScopeLevel === "STATE") {
      entityCode = editScopeState;
    } else if (editScopeLevel === "DISTRICT") {
      entityCode = editScopeDistrict.trim().toUpperCase();
      if (!entityCode) return;
    }

    const exists = editForm.scopes.some(s => 
      (s.level || s.scope_type) === editScopeLevel && 
      (s.entity_code || s.code) === entityCode
    );

    if (!exists) {
      setEditForm(prev => ({
        ...prev,
        scopes: [...prev.scopes, { level: editScopeLevel, entity_code: entityCode, scope_type: editScopeLevel }]
      }));
      setEditScopeDistrict("");
    }
  };

  // Remove scope tag in edit modal
  const handleRemoveEditScope = (indexToRemove) => {
    setEditForm(prev => ({
      ...prev,
      scopes: prev.scopes.filter((_, idx) => idx !== indexToRemove)
    }));
  };

  // Submit update admin
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!editForm.full_name?.trim()) {
      setEditError("Full Name is mandatory.");
      return;
    }
    if (!editForm.email?.trim() || !editForm.email.includes("@")) {
      setEditError("A valid email address is mandatory.");
      return;
    }
    if (!editForm.reason?.trim() || editForm.reason.trim().length < 5) {
      setEditError("Please provide an authoritative justification (minimum 5 characters) for the audit trail.");
      return;
    }

    setEditLoading(true);
    setEditError(null);
    try {
      await updateAdmin(editForm.id, {
        full_name: editForm.full_name.trim(),
        email: editForm.email.trim(),
        phone: editForm.phone?.trim() || "",
        role: editForm.role,
        status: editForm.status,
        scopes: editForm.scopes,
        reason: editForm.reason.trim()
      });

      setEditSuccess("Administrator profile & scopes updated successfully.");
      setTimeout(() => {
        setShowEditModal(false);
        fetchAdminList();
        if (showDetailModal && selectedAdmin?.id === editForm.id) {
          handleOpenDetail({ ...selectedAdmin, ...editForm });
        }
      }, 900);
    } catch (err) {
      console.error("Failed to update admin:", err);
      setEditError(err.message || "Failed to update administrator");
    } finally {
      setEditLoading(false);
    }
  };

  // Submit create admin
  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setFormError(null);
    setFormSuccess(null);
    setSubmitting(true);

    try {
      // Build scopes based on role
      const scopes = [];
      if (createForm.role === "ZONE_ADMIN") {
        scopes.push({ level: "ZONE", entity_code: formZone });
      } else if (createForm.role === "STATE_ADMIN") {
        scopes.push({ level: "STATE", entity_code: formState });
      } else if (createForm.role === "DISTRICT_ADMIN") {
        scopes.push({ level: "DISTRICT", entity_code: formDistrict.trim().toUpperCase() || `${formState}-D01` });
      }

      await createAdmin({
        ...createForm,
        scopes
      });

      setFormSuccess("Administrator provisioned successfully.");
      setTimeout(() => {
        setShowCreateModal(false);
        setFormSuccess(null);
        setCreateForm({
          admin_code: "",
          email: "",
          full_name: "",
          role: "ZONE_ADMIN",
          clearance: "Level 4 Zonal",
          status: "active",
          scopes: []
        });
        fetchAdminList();
      }, 1000);
    } catch (err) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  // Submit enforcement action
  const handleEnforceSubmit = async (e) => {
    e.preventDefault();
    if (!enforceReason.trim() || enforceReason.trim().length < 5) {
      setEnforceError("A reason (at least 5 characters) is required for compliance audit.");
      return;
    }
    setEnforcing(true);
    setEnforceError(null);

    try {
      await enforceAdmin(selectedAdmin.id, {
        action_type: enforceAction,
        reason: enforceReason.trim()
      });

      setShowEnforceModal(false);
      fetchAdminList();
      if (showDetailModal) {
        handleOpenDetail(selectedAdmin);
      }
    } catch (err) {
      setEnforceError(err.message);
    } finally {
      setEnforcing(false);
    }
  };

  // Role Badge Color
  const getRoleBadge = (role) => {
    switch (role) {
      case "SUPER_ADMIN":
        return { bg: "rgba(255, 121, 0, 0.15)", text: "#FF7900", border: "rgba(255, 121, 0, 0.4)", label: t("Super Admin Apex") };
      case "ZONE_ADMIN":
        return { bg: "rgba(59, 130, 246, 0.15)", text: "#3B82F6", border: "rgba(59, 130, 246, 0.4)", label: t("Zone Admin") };
      case "STATE_ADMIN":
        return { bg: "rgba(168, 85, 247, 0.15)", text: "#A855F7", border: "rgba(168, 85, 247, 0.4)", label: t("State Admin") };
      case "DISTRICT_ADMIN":
        return { bg: "rgba(16, 185, 129, 0.15)", text: "#10B981", border: "rgba(168, 85, 247, 0.4)", label: t("District Admin") };
      case "COOPERATIVE_ADMIN":
        return { bg: "rgba(234, 179, 8, 0.15)", text: "#EAB308", border: "rgba(234, 179, 8, 0.4)", label: t("Cooperative Admin") };
      case "OPERATIONS_ADMIN":
        return { bg: "rgba(14, 165, 233, 0.15)", text: "#0EA5E9", border: "rgba(14, 165, 233, 0.4)", label: t("Operations Admin") };
      default:
        return { bg: "rgba(148, 163, 184, 0.15)", text: "#94A3B8", border: "rgba(148, 163, 184, 0.3)", label: t(role) };
    }
  };

  // Status Badge Color
  const getStatusBadge = (status) => {
    switch (status) {
      case "active":
        return { color: "#10B981", bg: "rgba(16, 185, 129, 0.12)", border: "rgba(16, 185, 129, 0.3)", label: t("Active") };
      case "suspended":
        return { color: "#EF4444", bg: "rgba(239, 68, 68, 0.12)", border: "rgba(239, 68, 68, 0.3)", label: t("Suspended") };
      case "restricted":
        return { color: "#F59E0B", bg: "rgba(245, 158, 11, 0.12)", border: "rgba(245, 158, 11, 0.3)", label: t("Restricted") };
      case "blocked":
        return { color: "#991B1B", bg: "rgba(153, 27, 27, 0.15)", border: "rgba(153, 27, 27, 0.4)", label: t("Blocked") };
      default:
        return { color: "#94A3B8", bg: "rgba(148, 163, 184, 0.1)", border: "rgba(148, 163, 184, 0.3)", label: t(status) };
    }
  };

  return (
    <div className="fade-in" style={{ paddingBottom: "40px" }}>
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A", margin: 0 }}>
              {t("Administrators Governance Directory")}
            </h1>
            <span style={{ 
              background: "rgba(255, 121, 0, 0.12)", color: "#FF7900", 
              fontSize: "0.75rem", fontWeight: "800", padding: "3px 10px", borderRadius: "12px", border: "1px solid rgba(255, 121, 0, 0.3)"
            }}>
              {t("AUTHORITATIVE APEX")}
            </span>
          </div>
          <p style={{ margin: 0, color: isDark ? "#94A3B8" : "#64748B", fontSize: "0.88rem" }}>
            {t("Real database registry of verified administrators, downward geographic scopes, and clearance levels")}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => fetchAdminList()}
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

          <button
            onClick={() => setShowCreateModal(true)}
            style={{
              background: "#FF7900",
              color: "#050A12",
              border: "none",
              padding: "8px 18px",
              borderRadius: "8px",
              fontWeight: "800",
              fontSize: "12.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 14px rgba(255, 121, 0, 0.3)"
            }}
          >
            <Plus size={15} /> {t("Create Administrator")}
          </button>
        </div>
      </div>

      {/* Filter & Search Bar */}
      <div style={{ 
        background: isDark ? "#0A1220" : "#FFFFFF", 
        border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #E2E8F0",
        borderRadius: "12px", 
        padding: "16px", 
        marginBottom: "20px",
        display: "flex",
        flexWrap: "wrap",
        gap: "12px",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        {/* Search input */}
        <div style={{ position: "relative", flex: "1 1 280px" }}>
          <Search size={16} color={isDark ? "#94A3B8" : "#64748B"} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)" }} />
          <input
            type="text"
            placeholder={t("Search by Admin Name, ID, email, role, or scope...")}
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            style={{
              width: "100%",
              padding: "9px 12px 9px 38px",
              borderRadius: "8px",
              border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #CBD5E1",
              background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC",
              color: isDark ? "#FFFFFF" : "#0F172A",
              fontSize: "13px"
            }}
          />
        </div>

        {/* Dropdowns */}
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
          <select
            value={roleFilter}
            onChange={(e) => { setRoleFilter(e.target.value); setPage(1); }}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #CBD5E1",
              background: isDark ? "#0A1220" : "#F8FAFC",
              color: isDark ? "#FFFFFF" : "#0F172A",
              fontSize: "12.5px",
              fontWeight: "600"
            }}
          >
            <option value="">{t("All Roles")}</option>
            <option value="SUPER_ADMIN">{t("Super Admin Apex")}</option>
            <option value="ZONE_ADMIN">{t("Zone Admin")}</option>
            <option value="STATE_ADMIN">{t("State Admin")}</option>
            <option value="DISTRICT_ADMIN">{t("District Admin")}</option>
            <option value="COOPERATIVE_ADMIN">{t("Cooperative Admin")}</option>
            <option value="OPERATIONS_ADMIN">{t("Operations Admin")}</option>
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #CBD5E1",
              background: isDark ? "#0A1220" : "#F8FAFC",
              color: isDark ? "#FFFFFF" : "#0F172A",
              fontSize: "12.5px",
              fontWeight: "600"
            }}
          >
            <option value="">{t("All Statuses")}</option>
            <option value="active">{t("Active")}</option>
            <option value="suspended">{t("Suspended")}</option>
            <option value="restricted">{t("Restricted")}</option>
            <option value="blocked">{t("Blocked")}</option>
          </select>

          <select
            value={scopeFilter}
            onChange={(e) => { setScopeFilter(e.target.value); setPage(1); }}
            style={{
              padding: "8px 12px",
              borderRadius: "8px",
              border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #CBD5E1",
              background: isDark ? "#0A1220" : "#F8FAFC",
              color: isDark ? "#FFFFFF" : "#0F172A",
              fontSize: "12.5px",
              fontWeight: "600"
            }}
          >
            <option value="">{t("All Scopes")}</option>
            <option value="GLOBAL">GLOBAL ({t("India")})</option>
            <option value="ZONE">ZONE ({t("Zonal")})</option>
            <option value="STATE">STATE ({t("State/UT")})</option>
            <option value="DISTRICT">DISTRICT</option>
            <option value="COOPERATIVE">COOPERATIVE</option>
          </select>
        </div>
      </div>

      {/* Main Table */}
      <div style={{ 
        background: isDark ? "#0A1220" : "#FFFFFF", 
        border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #E2E8F0",
        borderRadius: "14px", 
        overflow: "hidden"
      }}>
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "13px" }}>
            <thead>
              <tr style={{ 
                background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", 
                borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0",
                color: isDark ? "#94A3B8" : "#64748B",
                fontWeight: "700",
                fontSize: "11.5px",
                textTransform: "uppercase",
                letterSpacing: "0.5px"
              }}>
                <th style={{ padding: "14px 16px" }}>{t("Admin Identity")}</th>
                <th style={{ padding: "14px 16px" }}>{t("Admin Code")}</th>
                <th style={{ padding: "14px 16px" }}>{t("Role")}</th>
                <th style={{ padding: "14px 16px" }}>{t("Clearance")}</th>
                <th style={{ padding: "14px 16px" }}>{t("Geographic Scope")}</th>
                <th style={{ padding: "14px 16px" }}>{t("Status")}</th>
                <th style={{ padding: "14px 16px" }}>{t("Created")}</th>
                <th style={{ padding: "14px 16px", textAlign: "right" }}>{t("Actions")}</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" style={{ padding: "40px", textAlign: "center", color: isDark ? "#94A3B8" : "#64748B" }}>
                    <RefreshCw size={24} className="spin" style={{ margin: "0 auto 10px" }} />
                    {t("Loading database administrators...")}
                  </td>
                </tr>
              ) : admins.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ padding: "40px", textAlign: "center", color: isDark ? "#94A3B8" : "#64748B" }}>
                    <Users size={32} style={{ margin: "0 auto 10px", opacity: 0.5 }} />
                    <div style={{ fontWeight: "700", fontSize: "15px", marginBottom: "4px" }}>{t("No Administrators Found")}</div>
                    <div style={{ fontSize: "12px" }}>{t("No records match the selected search or filter criteria.")}</div>
                  </td>
                </tr>
              ) : (
                admins.map((adm) => {
                  const roleStyle = getRoleBadge(adm.role);
                  const statusStyle = getStatusBadge(adm.status);
                  const isSuper = adm.role === "SUPER_ADMIN";

                  return (
                    <tr 
                      key={adm.id}
                      style={{ 
                        borderBottom: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid #F1F5F9",
                        transition: "background 0.15s ease"
                      }}
                      className="table-row-hover"
                    >
                      <td style={{ padding: "14px 16px" }}>
                        <div 
                          onClick={() => handleOpenDetail(adm)}
                          style={{ 
                            fontWeight: "700", 
                            color: isDark ? "#FFFFFF" : "#0F172A",
                            cursor: "pointer",
                            transition: "color 0.15s ease"
                          }}
                          onMouseEnter={(e) => e.currentTarget.style.color = "#FF7900"}
                          onMouseLeave={(e) => e.currentTarget.style.color = isDark ? "#FFFFFF" : "#0F172A"}
                          title="Click to view Administrator Dossier"
                        >
                          {adm.full_name}
                        </div>
                        <div style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B" }}>{adm.email}</div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <button
                          onClick={() => handleOpenDetail(adm)}
                          style={{
                            fontFamily: "monospace",
                            fontWeight: "800",
                            fontSize: "12px",
                            color: isSuper ? "#FF7900" : isDark ? "#38BDF8" : "#0284C7",
                            background: isDark ? "rgba(56, 189, 248, 0.1)" : "rgba(2, 132, 199, 0.08)",
                            border: isDark ? "1px solid rgba(56, 189, 248, 0.3)" : "1px solid rgba(2, 132, 199, 0.25)",
                            borderRadius: "6px",
                            padding: "4px 8px",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            transition: "all 0.15s ease",
                            boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.transform = "translateY(-1px)";
                            e.currentTarget.style.boxShadow = "0 4px 10px rgba(56, 189, 248, 0.3)";
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.transform = "translateY(0)";
                            e.currentTarget.style.boxShadow = "0 2px 5px rgba(0,0,0,0.1)";
                          }}
                          title="Click to view Administrator Details & Generative Intelligence"
                        >
                          <span>{adm.admin_code}</span>
                          <Sparkles size={11} color="#FF7900" />
                        </button>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          background: roleStyle.bg,
                          color: roleStyle.text,
                          border: `1px solid ${roleStyle.border}`,
                          fontSize: "11px",
                          fontWeight: "800",
                          padding: "3px 8px",
                          borderRadius: "6px"
                        }}>
                          {roleStyle.label}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", color: isDark ? "#CBD5E1" : "#475569", fontSize: "12px", fontWeight: "600" }}>
                        {adm.clearance}
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12px", color: isDark ? "#E2E8F0" : "#1E293B", fontWeight: "600" }}>
                          <MapPin size={13} color="#FF7900" />
                          <span>{adm.primary_scope}</span>
                        </div>
                      </td>

                      <td style={{ padding: "14px 16px" }}>
                        <span style={{
                          background: statusStyle.bg,
                          color: statusStyle.color,
                          border: `1px solid ${statusStyle.border}`,
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "3px 8px",
                          borderRadius: "12px",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px"
                        }}>
                          <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: statusStyle.color }} />
                          {statusStyle.label}
                        </span>
                      </td>

                      <td style={{ padding: "14px 16px", color: isDark ? "#94A3B8" : "#64748B", fontSize: "11.5px" }}>
                        {new Date(adm.created_at).toLocaleDateString()}
                      </td>

                      <td style={{ padding: "14px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "5px", alignItems: "center" }}>
                          <button
                            onClick={() => handleOpenDetail(adm)}
                            style={{
                              background: isDark ? "rgba(255,255,255,0.06)" : "#F1F5F9",
                              border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #CBD5E1",
                              color: isDark ? "#E2E8F0" : "#334155",
                              padding: "5px 9px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                            title="View Administrator Dossier & AI Summary"
                          >
                            <Eye size={12} /> Dossier
                          </button>

                          <button
                            onClick={() => handleOpenEdit(adm)}
                            style={{
                              background: isDark ? "rgba(59, 130, 246, 0.12)" : "rgba(59, 130, 246, 0.08)",
                              border: isDark ? "1px solid rgba(59, 130, 246, 0.35)" : "1px solid rgba(59, 130, 246, 0.25)",
                              color: "#3B82F6",
                              padding: "5px 8px",
                              borderRadius: "6px",
                              fontSize: "11px",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                            title="Edit Administrator Profile & Scopes"
                          >
                            <Pencil size={11} /> Edit
                          </button>

                          {!isSuper && (
                            <>
                              <button
                                onClick={() => handleOpenWarn(adm)}
                                style={{
                                  background: "rgba(245, 158, 11, 0.1)",
                                  border: "1px solid rgba(245, 158, 11, 0.3)",
                                  color: "#F59E0B",
                                  padding: "5px 8px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px"
                                }}
                                title="Issue formal compliance warning"
                              >
                                <AlertTriangle size={11} /> Warn
                              </button>

                              <button
                                onClick={() => handleOpenBlock(adm)}
                                style={{
                                  background: "rgba(153, 27, 27, 0.12)",
                                  border: "1px solid rgba(153, 27, 27, 0.35)",
                                  color: "#EF4444",
                                  padding: "5px 8px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center",
                                  gap: "3px"
                                }}
                                title="Block administrator access"
                              >
                                <ShieldX size={11} /> Block
                              </button>

                              <button
                                onClick={() => handleOpenDelete(adm)}
                                style={{
                                  background: "rgba(239, 68, 68, 0.1)",
                                  border: "1px solid rgba(239, 68, 68, 0.3)",
                                  color: "#EF4444",
                                  padding: "5px 7px",
                                  borderRadius: "6px",
                                  fontSize: "11px",
                                  fontWeight: "700",
                                  cursor: "pointer",
                                  display: "inline-flex",
                                  alignItems: "center"
                                }}
                                title="Remove / delete administrator"
                              >
                                <Trash2 size={12} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div style={{ 
          padding: "12px 16px", 
          borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "12px",
          color: isDark ? "#94A3B8" : "#64748B"
        }}>
          <div>Showing {admins.length} of {total} administrators</div>
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

      {/* CREATE ADMINISTRATOR MODAL */}
      {showCreateModal && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ 
            background: isDark ? "#0A1220" : "#FFFFFF", 
            border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #E2E8F0",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "520px",
            overflow: "hidden",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
          }}>
            <div style={{ padding: "18px 20px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A" }}>
                  Provision Subordinate Administrator
                </h3>
                <span style={{ fontSize: "11.5px", color: isDark ? "#94A3B8" : "#64748B" }}>
                  Add a verified governance administrator with bound downward scope
                </span>
              </div>
              <button onClick={() => setShowCreateModal(false)} style={{ background: "none", border: "none", color: isDark ? "#94A3B8" : "#64748B", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} style={{ padding: "20px" }}>
              {formError && (
                <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#EF4444", fontSize: "12px", marginBottom: "14px", fontWeight: "600" }}>
                  {formError}
                </div>
              )}
              {formSuccess && (
                <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(16,185,129,0.15)", border: "1px solid rgba(16,185,129,0.4)", color: "#10B981", fontSize: "12px", marginBottom: "14px", fontWeight: "600" }}>
                  {formSuccess}
                </div>
              )}

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#CBD5E1" : "#475569", marginBottom: "4px" }}>Admin Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. ADM-SZ-001"
                    value={createForm.admin_code}
                    onChange={(e) => setCreateForm({ ...createForm, admin_code: e.target.value.toUpperCase() })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "13px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#CBD5E1" : "#475569", marginBottom: "4px" }}>Full Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Rajesh Sharma"
                    value={createForm.full_name}
                    onChange={(e) => setCreateForm({ ...createForm, full_name: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "13px" }}
                  />
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#CBD5E1" : "#475569", marginBottom: "4px" }}>Email Identity *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. zoneadmin.south@coophub.gov.in"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value.toLowerCase() })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "rgba(255,255,255,0.05)" : "#F8FAFC", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "13px" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#CBD5E1" : "#475569", marginBottom: "4px" }}>Role *</label>
                  <select
                    value={createForm.role}
                    onChange={(e) => {
                      const r = e.target.value;
                      let c = "Level 2 Local";
                      if (r === "ZONE_ADMIN") c = "Level 4 Zonal";
                      else if (r === "STATE_ADMIN") c = "Level 3 Regional";
                      setCreateForm({ ...createForm, role: r, clearance: c });
                    }}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "#0A1220" : "#F8FAFC", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "12.5px" }}
                  >
                    <option value="ZONE_ADMIN">ZONE_ADMIN</option>
                    <option value="STATE_ADMIN">STATE_ADMIN</option>
                    <option value="DISTRICT_ADMIN">DISTRICT_ADMIN</option>
                    <option value="COOPERATIVE_ADMIN">COOPERATIVE_ADMIN</option>
                    <option value="OPERATIONS_ADMIN">OPERATIONS_ADMIN</option>
                  </select>
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#CBD5E1" : "#475569", marginBottom: "4px" }}>Clearance Level</label>
                  <input
                    type="text"
                    readOnly
                    value={createForm.clearance}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "rgba(255,255,255,0.02)" : "#E2E8F0", color: isDark ? "#94A3B8" : "#64748B", fontSize: "12.5px" }}
                  />
                </div>
              </div>

              {/* Dynamic Scope Selector */}
              <div style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", padding: "12px", borderRadius: "10px", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0", marginBottom: "16px" }}>
                <label style={{ display: "block", fontSize: "11px", fontWeight: "800", color: "#FF7900", marginBottom: "6px", textTransform: "uppercase" }}>
                  Geographic Scope Binding
                </label>

                {createForm.role === "ZONE_ADMIN" && (
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B", marginBottom: "4px" }}>Assigned National Zone</label>
                    <select
                      value={formZone}
                      onChange={(e) => setFormZone(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "#0A1220" : "#FFFFFF", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "13px" }}
                    >
                      <option value="SZ">SZ — South Zone (TN, KL, KA, AP, TS, AN, LD, PY)</option>
                      <option value="NZ">NZ — North Zone (PB, HR, UP, UK, BR, HP, RJ, DL, CH, JK, LA)</option>
                      <option value="WZ">WZ — West Zone (MH, GJ, GA, CG, MP, DD)</option>
                      <option value="EZ">EZ — East Zone (WB, OR, JH, AS, AR, MN, ML, MZ, NL, SK, TR)</option>
                    </select>
                  </div>
                )}

                {createForm.role === "STATE_ADMIN" && (
                  <div>
                    <label style={{ display: "block", fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B", marginBottom: "4px" }}>Assigned State or Union Territory</label>
                    <select
                      value={formState}
                      onChange={(e) => setFormState(e.target.value)}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "#0A1220" : "#FFFFFF", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "13px" }}
                    >
                      <option value="TN">TN — Tamil Nadu</option>
                      <option value="KL">KL — Kerala</option>
                      <option value="KA">KA — Karnataka</option>
                      <option value="AP">AP — Andhra Pradesh</option>
                      <option value="TS">TS — Telangana</option>
                      <option value="MH">MH — Maharashtra</option>
                      <option value="DL">DL — Delhi (UT)</option>
                      <option value="PB">PB — Punjab</option>
                      <option value="GJ">GJ — Gujarat</option>
                      <option value="WB">WB — West Bengal</option>
                      <option value="RJ">RJ — Rajasthan</option>
                      <option value="UP">UP — Uttar Pradesh</option>
                    </select>
                  </div>
                )}

                {createForm.role === "DISTRICT_ADMIN" && (
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B", marginBottom: "4px" }}>Parent State</label>
                      <select
                        value={formState}
                        onChange={(e) => setFormState(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "#0A1220" : "#FFFFFF", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "13px" }}
                      >
                        <option value="TN">Tamil Nadu</option>
                        <option value="KL">Kerala</option>
                        <option value="KA">Karnataka</option>
                        <option value="MH">Maharashtra</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: "block", fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B", marginBottom: "4px" }}>District Code</label>
                      <input
                        type="text"
                        placeholder="e.g. CHE-01"
                        value={formDistrict}
                        onChange={(e) => setFormDistrict(e.target.value)}
                        style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "#0A1220" : "#FFFFFF", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "13px" }}
                      />
                    </div>
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #CBD5E1", background: "none", color: isDark ? "#CBD5E1" : "#475569", fontWeight: "700", fontSize: "12.5px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#FF7900", color: "#050A12", fontWeight: "800", fontSize: "12.5px", cursor: submitting ? "not-allowed" : "pointer" }}
                >
                  {submitting ? "Provisioning..." : "Provision Administrator"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOSSIER MODAL */}
      {showDetailModal && selectedAdmin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ 
            background: isDark ? "#0A1220" : "#FFFFFF", 
            border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #E2E8F0",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "600px",
            maxHeight: "85vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
          }}>
            <div style={{ padding: "18px 20px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#FF7900", color: "#050A12", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "14px" }}>
                  {selectedAdmin.full_name?.charAt(0) || "A"}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A" }}>
                    {selectedAdmin.full_name}
                  </h3>
                  <div style={{ fontSize: "11.5px", color: isDark ? "#94A3B8" : "#64748B" }}>
                    {selectedAdmin.email} • ID: <strong style={{ color: "#FF7900" }}>{selectedAdmin.admin_code}</strong>
                  </div>
                </div>
              </div>
              <button onClick={() => setShowDetailModal(false)} style={{ background: "none", border: "none", color: isDark ? "#94A3B8" : "#64748B", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
              {detailLoading ? (
                <div style={{ padding: "40px", textAlign: "center", color: isDark ? "#94A3B8" : "#64748B" }}>
                  <RefreshCw size={24} className="spin" style={{ margin: "0 auto 10px" }} />
                  Loading dossier records...
                </div>
              ) : adminDetail ? (
                <div>
                  {/* Status & Clearance Row */}
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", marginBottom: "16px" }}>
                    <div style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", padding: "10px 12px", borderRadius: "10px", border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #E2E8F0" }}>
                      <span style={{ fontSize: "10px", fontWeight: "700", color: isDark ? "#94A3B8" : "#64748B", display: "block" }}>ROLE TIER</span>
                      <span style={{ fontWeight: "800", fontSize: "12.5px", color: "#FF7900" }}>{adminDetail.admin.role}</span>
                    </div>
                    <div style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", padding: "10px 12px", borderRadius: "10px", border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #E2E8F0" }}>
                      <span style={{ fontSize: "10px", fontWeight: "700", color: isDark ? "#94A3B8" : "#64748B", display: "block" }}>CLEARANCE</span>
                      <span style={{ fontWeight: "800", fontSize: "12.5px", color: isDark ? "#FFFFFF" : "#0F172A" }}>{adminDetail.admin.clearance || "Level 4 (Zonal)"}</span>
                    </div>
                    <div style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", padding: "10px 12px", borderRadius: "10px", border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #E2E8F0" }}>
                      <span style={{ fontSize: "10px", fontWeight: "700", color: isDark ? "#94A3B8" : "#64748B", display: "block" }}>STATUS</span>
                      <span style={{ fontWeight: "800", fontSize: "12.5px", color: adminDetail.admin.status === "active" ? "#10B981" : "#EF4444" }}>
                        {adminDetail.admin.status.toUpperCase()}
                      </span>
                    </div>
                    <div style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", padding: "10px 12px", borderRadius: "10px", border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #E2E8F0" }}>
                      <span style={{ fontSize: "10px", fontWeight: "700", color: isDark ? "#94A3B8" : "#64748B", display: "block" }}>GENDER</span>
                      <span style={{ fontWeight: "800", fontSize: "12.5px", color: isDark ? "#FFFFFF" : "#0F172A" }}>
                        {adminDetail.admin.gender || "Not Specified"}
                      </span>
                    </div>
                    <div style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", padding: "10px 12px", borderRadius: "10px", border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #E2E8F0" }}>
                      <span style={{ fontSize: "10px", fontWeight: "700", color: isDark ? "#94A3B8" : "#64748B", display: "block" }}>DATE OF BIRTH</span>
                      <span style={{ fontWeight: "800", fontSize: "12.5px", color: isDark ? "#FFFFFF" : "#0F172A" }}>
                        {adminDetail.admin.date_of_birth || "N/A"}
                      </span>
                    </div>
                  </div>

                  {/* Scopes */}
                  <div style={{ marginBottom: "18px" }}>
                    <h4 style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", color: "#FF7900", marginBottom: "8px" }}>
                      Bound Geographic Scopes ({adminDetail.scopes.length})
                    </h4>
                    {adminDetail.scopes.length === 0 ? (
                      <div style={{ fontSize: "12px", color: isDark ? "#94A3B8" : "#64748B", fontStyle: "italic" }}>
                        {selectedAdmin.role === "SUPER_ADMIN" ? "Global Scope: Sovereign supervision across all 4 zones (SZ, NZ, WZ, EZ)" : "No explicit subordinate scopes assigned"}
                      </div>
                    ) : (
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {adminDetail.scopes.map((sc) => (
                          <div key={sc.id} style={{ background: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9", border: "1px solid rgba(255, 121, 0, 0.3)", borderRadius: "8px", padding: "6px 12px", fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}>
                            <MapPin size={12} color="#FF7900" />
                            <strong>{sc.level}:</strong> {sc.entity_code}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* GENERATIVE INTELLIGENCE SUMMARY SECTION */}
                  <div style={{ 
                    marginBottom: "20px", 
                    background: isDark ? "rgba(255, 121, 0, 0.04)" : "rgba(255, 121, 0, 0.03)", 
                    border: isDark ? "1px solid rgba(255, 121, 0, 0.25)" : "1px solid rgba(255, 121, 0, 0.2)", 
                    borderRadius: "12px", 
                    padding: "16px" 
                  }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ 
                          width: "28px", height: "28px", borderRadius: "8px", 
                          background: "linear-gradient(135deg, #FF7900 0%, #FFB020 100%)", 
                          display: "flex", alignItems: "center", justifyContent: "center", color: "#050A12" 
                        }}>
                          <Sparkles size={16} />
                        </div>
                        <div>
                          <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A", display: "flex", alignItems: "center", gap: "6px" }}>
                            Generative Administrative Intelligence
                            <span style={{ fontSize: "10px", background: "rgba(255,121,0,0.15)", color: "#FF7900", padding: "2px 6px", borderRadius: "8px", fontWeight: "800" }}>
                              AI SYNTHESIS
                            </span>
                          </h4>
                          <span style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B" }}>
                            Authoritative executive briefing, clearance telemetry & risk assessment
                          </span>
                        </div>
                      </div>

                      {!aiSummary && !aiLoading && (
                        <button
                          onClick={handleGenerateAiSummary}
                          style={{
                            background: "linear-gradient(135deg, #FF7900 0%, #E66A00 100%)",
                            color: "#050A12",
                            border: "none",
                            borderRadius: "8px",
                            padding: "6px 14px",
                            fontSize: "11.5px",
                            fontWeight: "800",
                            cursor: "pointer",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            boxShadow: "0 2px 8px rgba(255, 121, 0, 0.25)"
                          }}
                        >
                          <Sparkles size={13} /> Generate AI Summary
                        </button>
                      )}
                    </div>

                    {/* AI Loading State */}
                    {aiLoading && (
                      <div style={{ 
                        padding: "20px", 
                        textAlign: "center", 
                        background: isDark ? "rgba(0,0,0,0.2)" : "rgba(255,255,255,0.7)", 
                        borderRadius: "8px", 
                        border: isDark ? "1px dashed rgba(255,121,0,0.3)" : "1px dashed rgba(255,121,0,0.4)" 
                      }}>
                        <RefreshCw size={20} className="spin" style={{ color: "#FF7900", margin: "0 auto 8px" }} />
                        <div style={{ fontSize: "12.5px", fontWeight: "700", color: isDark ? "#E2E8F0" : "#1E293B" }}>
                          Synthesizing Administrator Dossier via AI Engine...
                        </div>
                        <div style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B", marginTop: "3px" }}>
                          Auditing credentials, geographic scope depth, and compliance history
                        </div>
                      </div>
                    )}

                    {/* AI Error */}
                    {aiError && (
                      <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444", fontSize: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span>{aiError}</span>
                        <button onClick={handleGenerateAiSummary} style={{ background: "none", border: "none", color: "#EF4444", fontWeight: "800", textDecoration: "underline", cursor: "pointer", fontSize: "11px" }}>Retry</button>
                      </div>
                    )}

                    {/* AI Summary Card */}
                    {aiSummary && !aiLoading && (
                      <div style={{ 
                        background: isDark ? "rgba(0, 0, 0, 0.3)" : "#FFFFFF", 
                        border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #E2E8F0", 
                        borderRadius: "10px", 
                        padding: "14px",
                        fontSize: "12px"
                      }}>
                        {/* Provider and Timestamp Header */}
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px", paddingBottom: "8px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #F1F5F9" }}>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "#FF7900", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <Sparkles size={12} /> {aiSummary.ai_provider || "COOP-HUB AI Engine"}
                          </span>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span style={{ fontSize: "10.5px", color: isDark ? "#94A3B8" : "#64748B" }}>
                              {aiSummary.generated_at ? new Date(aiSummary.generated_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Live"}
                            </span>
                            <button
                              onClick={handleGenerateAiSummary}
                              style={{ background: "none", border: "none", color: isDark ? "#94A3B8" : "#64748B", cursor: "pointer", padding: 0 }}
                              title="Re-run AI Analysis"
                            >
                              <RefreshCw size={12} />
                            </button>
                          </div>
                        </div>

                        {/* Administrator Identity & Demographic Profile Card */}
                        <div style={{
                          background: isDark ? "rgba(255, 121, 0, 0.08)" : "rgba(255, 121, 0, 0.05)",
                          border: isDark ? "1px solid rgba(255, 121, 0, 0.3)" : "1px solid rgba(255, 121, 0, 0.25)",
                          borderRadius: "8px",
                          padding: "10px 12px",
                          marginBottom: "12px"
                        }}>
                          <div style={{ fontSize: "10.5px", fontWeight: "800", color: "#FF7900", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                            <Shield size={13} /> Administrator Demographic & Identity Verification
                          </div>
                          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "8px" }}>
                            <div>
                              <span style={{ fontSize: "10px", color: isDark ? "#94A3B8" : "#64748B", display: "block", fontWeight: "700" }}>NAME</span>
                              <strong style={{ fontSize: "12px", color: isDark ? "#FFFFFF" : "#0F172A" }}>
                                {aiSummary.admin_demographics?.name || selectedAdmin.full_name}
                              </strong>
                            </div>
                            <div>
                              <span style={{ fontSize: "10px", color: isDark ? "#94A3B8" : "#64748B", display: "block", fontWeight: "700" }}>GENDER</span>
                              <strong style={{ fontSize: "12px", color: isDark ? "#FFFFFF" : "#0F172A" }}>
                                {aiSummary.admin_demographics?.gender || aiSummary.gender || adminDetail.admin.gender || "Not Specified"}
                              </strong>
                            </div>
                            <div>
                              <span style={{ fontSize: "10px", color: isDark ? "#94A3B8" : "#64748B", display: "block", fontWeight: "700" }}>DATE OF BIRTH</span>
                              <strong style={{ fontSize: "12px", color: isDark ? "#FFFFFF" : "#0F172A" }}>
                                {aiSummary.admin_demographics?.date_of_birth || aiSummary.date_of_birth || adminDetail.admin.date_of_birth || "N/A"}
                              </strong>
                            </div>
                            <div>
                              <span style={{ fontSize: "10px", color: isDark ? "#94A3B8" : "#64748B", display: "block", fontWeight: "700" }}>JURISDICTION</span>
                              <strong style={{ fontSize: "12px", color: "#3B82F6" }}>
                                {aiSummary.admin_demographics?.jurisdiction || (adminDetail.scopes.length > 0 ? adminDetail.scopes.map(s => `${s.level}: ${s.entity_code}`).join(', ') : 'All-India National Scope')}
                              </strong>
                            </div>
                          </div>
                        </div>

                        {/* Executive Summary */}
                        <div style={{ marginBottom: "12px", lineHeight: "1.5", color: isDark ? "#E2E8F0" : "#1E293B", fontWeight: "500" }}>
                          {aiSummary.executive_summary}
                        </div>

                        {/* Risk & Compliance Metric Gauge */}
                        {aiSummary.compliance_risk_assessment && (
                          <div style={{ 
                            background: isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC", 
                            border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #E2E8F0", 
                            borderRadius: "8px", 
                            padding: "10px 12px", 
                            marginBottom: "12px" 
                          }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                              <span style={{ fontSize: "11px", fontWeight: "700", color: isDark ? "#94A3B8" : "#64748B" }}>
                                COMPLIANCE & INTEGRITY SCORE
                              </span>
                              <span style={{ 
                                fontWeight: "800", 
                                fontSize: "12px", 
                                color: aiSummary.compliance_risk_assessment.rating_color || "#10B981" 
                              }}>
                                {aiSummary.compliance_risk_assessment.compliance_score || 95}% ({aiSummary.compliance_risk_assessment.risk_level?.replace("_", " ")})
                              </span>
                            </div>

                            {/* Progress bar */}
                            <div style={{ width: "100%", height: "6px", background: isDark ? "rgba(255,255,255,0.1)" : "#E2E8F0", borderRadius: "3px", overflow: "hidden", marginBottom: "8px" }}>
                              <div style={{ 
                                width: `${Math.min(100, Math.max(0, aiSummary.compliance_risk_assessment.compliance_score || 95))}%`, 
                                height: "100%", 
                                background: aiSummary.compliance_risk_assessment.rating_color || "#10B981", 
                                borderRadius: "3px" 
                              }} />
                            </div>

                            {/* Flags */}
                            {Array.isArray(aiSummary.compliance_risk_assessment.flags) && (
                              <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
                                {aiSummary.compliance_risk_assessment.flags.map((flag, idx) => (
                                  <div key={idx} style={{ fontSize: "11px", color: isDark ? "#CBD5E1" : "#475569" }}>
                                    {flag}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}

                        {/* Clearance & Scope Analysis */}
                        {aiSummary.role_and_clearance_analysis && (
                          <div style={{ marginBottom: "12px" }}>
                            <span style={{ fontSize: "11px", fontWeight: "700", color: isDark ? "#94A3B8" : "#64748B", display: "block", marginBottom: "3px" }}>
                              JURISDICTION & CLEARANCE EVALUATION:
                            </span>
                            <div style={{ color: isDark ? "#CBD5E1" : "#334155", lineHeight: "1.45" }}>
                              {aiSummary.role_and_clearance_analysis}
                            </div>
                          </div>
                        )}

                        {/* Supervisory Recommendations */}
                        {Array.isArray(aiSummary.supervisory_recommendations) && (
                          <div>
                            <span style={{ fontSize: "11px", fontWeight: "700", color: isDark ? "#94A3B8" : "#64748B", display: "block", marginBottom: "4px" }}>
                              SUPERVISORY RECOMMENDATIONS:
                            </span>
                            <ul style={{ margin: 0, paddingLeft: "16px", color: isDark ? "#CBD5E1" : "#334155", display: "flex", flexDirection: "column", gap: "3px" }}>
                              {aiSummary.supervisory_recommendations.map((rec, i) => (
                                <li key={i}>{rec}</li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Enforcement History */}
                  <div style={{ marginBottom: "18px" }}>
                    <h4 style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", color: "#EF4444", marginBottom: "8px" }}>
                      Enforcement Actions History ({adminDetail.enforcement_history.length})
                    </h4>
                    {adminDetail.enforcement_history.length === 0 ? (
                      <div style={{ fontSize: "12px", color: isDark ? "#94A3B8" : "#64748B", fontStyle: "italic" }}>
                        Clean administrative compliance record. No disciplinary actions logged.
                      </div>
                    ) : (
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        {adminDetail.enforcement_history.map((enf) => (
                          <div key={enf.id} style={{ padding: "10px", borderRadius: "8px", background: "rgba(239,68,68,0.08)", border: "1px solid rgba(239,68,68,0.2)", fontSize: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                              <strong style={{ color: "#EF4444" }}>{enf.action_type}</strong>
                              <span style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B" }}>{new Date(enf.created_at).toLocaleString()}</span>
                            </div>
                            <div style={{ color: isDark ? "#CBD5E1" : "#475569" }}>{enf.reason}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ) : null}
            </div>

            {/* MODAL FOOTER CONTROLS */}
            <div style={{ 
              padding: "14px 20px", 
              borderTop: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0", 
              display: "flex", 
              justifyContent: "space-between",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "10px"
            }}>
              <button
                onClick={() => setShowDetailModal(false)}
                style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #CBD5E1", background: "none", color: isDark ? "#CBD5E1" : "#475569", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}
              >
                Close Dossier
              </button>

              {selectedAdmin.role !== "SUPER_ADMIN" && (
                <div style={{ display: "flex", gap: "8px", alignItems: "center", flexWrap: "wrap" }}>
                  {/* Edit Button */}
                  <button
                    onClick={() => { setShowDetailModal(false); handleOpenEdit(selectedAdmin); }}
                    style={{
                      padding: "8px 14px",
                      borderRadius: "8px",
                      border: "1px solid rgba(59, 130, 246, 0.4)",
                      background: isDark ? "rgba(59, 130, 246, 0.15)" : "rgba(59, 130, 246, 0.1)",
                      color: "#3B82F6",
                      fontWeight: "700",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px"
                    }}
                  >
                    <Pencil size={13} /> Edit Profile & Scopes
                  </button>

                  {/* Warn Button */}
                  <button
                    onClick={() => { setShowDetailModal(false); handleOpenWarn(selectedAdmin); }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(245, 158, 11, 0.4)",
                      background: "rgba(245, 158, 11, 0.12)",
                      color: "#F59E0B",
                      fontWeight: "700",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <AlertTriangle size={13} /> Warn
                  </button>

                  {/* Block Button */}
                  <button
                    onClick={() => { setShowDetailModal(false); handleOpenBlock(selectedAdmin); }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(153, 27, 27, 0.4)",
                      background: "rgba(153, 27, 27, 0.15)",
                      color: "#EF4444",
                      fontWeight: "700",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <ShieldX size={13} /> Block
                  </button>

                  {/* Remove Button */}
                  <button
                    onClick={() => { setShowDetailModal(false); handleOpenDelete(selectedAdmin); }}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      border: "1px solid rgba(239, 68, 68, 0.4)",
                      background: "rgba(239, 68, 68, 0.15)",
                      color: "#EF4444",
                      fontWeight: "700",
                      fontSize: "12px",
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <Trash2 size={13} /> Remove
                  </button>

                  {/* Suspend / Reinstate */}
                  <button
                    onClick={() => { setShowDetailModal(false); handleOpenEnforce(selectedAdmin); }}
                    style={{ 
                      padding: "8px 14px", 
                      borderRadius: "8px", 
                      border: "none", 
                      background: selectedAdmin.status === "suspended" ? "#10B981" : "#EF4444", 
                      color: "#FFFFFF", 
                      fontWeight: "800", 
                      fontSize: "12px", 
                      cursor: "pointer",
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "4px"
                    }}
                  >
                    <ShieldAlert size={13} /> {selectedAdmin.status === "suspended" ? "Reinstate" : "Suspend"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE MODAL */}
      {showDeleteModal && selectedAdmin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ 
            background: isDark ? "#0A1220" : "#FFFFFF", 
            border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "460px",
            overflow: "hidden",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
          }}>
            <div style={{ padding: "16px 20px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: "10px", background: "rgba(239,68,68,0.08)" }}>
              <Trash2 size={22} color="#EF4444" />
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "800", color: "#EF4444" }}>
                  Remove Administrator Record
                </h3>
                <span style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B" }}>
                  Permanent de-provisioning from National Registry
                </span>
              </div>
            </div>

            <form onSubmit={handleDeleteSubmit} style={{ padding: "20px" }}>
              <div style={{ fontSize: "12.5px", color: isDark ? "#E2E8F0" : "#1E293B", lineHeight: "1.5", marginBottom: "16px" }}>
                Are you sure you want to permanently remove administrator <strong>{selectedAdmin.full_name} ({selectedAdmin.admin_code})</strong>?
                <div style={{ marginTop: "6px", fontSize: "11.5px", color: isDark ? "#94A3B8" : "#64748B" }}>
                  This will revoke all assigned geographic scopes and purge the account record from the database. This action is permanently audited.
                </div>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#CBD5E1" : "#475569", marginBottom: "4px" }}>
                  Audit Removal Rationale
                </label>
                <input
                  type="text"
                  placeholder="e.g. Contract ended, role decommissioned"
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "12.5px" }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowDeleteModal(false)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #CBD5E1", background: "none", color: isDark ? "#CBD5E1" : "#475569", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={deleting}
                  style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: "#EF4444", color: "#FFFFFF", fontWeight: "800", fontSize: "12px", cursor: deleting ? "not-allowed" : "pointer" }}
                >
                  {deleting ? "Removing..." : "Confirm Removal"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ENFORCEMENT MODAL */}
      {showEnforceModal && selectedAdmin && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)", zIndex: 250, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ 
            background: isDark ? "#0A1220" : "#FFFFFF", 
            border: "1px solid rgba(239, 68, 68, 0.4)",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "480px",
            overflow: "hidden",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
          }}>
            <div style={{ padding: "16px 20px", borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0", display: "flex", alignItems: "center", gap: "10px", background: "rgba(239,68,68,0.08)" }}>
              <ShieldAlert size={22} color="#EF4444" />
              <div>
                <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "800", color: "#EF4444" }}>
                  Administrative Enforcement Action
                </h3>
                <span style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B" }}>
                  Enforcing against: <strong>{selectedAdmin.full_name} ({selectedAdmin.admin_code})</strong>
                </span>
              </div>
            </div>

            <form onSubmit={handleEnforceSubmit} style={{ padding: "20px" }}>
              {enforceError && (
                <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(239,68,68,0.15)", border: "1px solid rgba(239,68,68,0.4)", color: "#EF4444", fontSize: "12px", marginBottom: "14px", fontWeight: "600" }}>
                  {enforceError}
                </div>
              )}

              <div style={{ marginBottom: "14px" }}>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#CBD5E1" : "#475569", marginBottom: "4px" }}>
                  Select Disciplinary Action *
                </label>
                <select
                  value={enforceAction}
                  onChange={(e) => setEnforceAction(e.target.value)}
                  style={{ width: "100%", padding: "9px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "#0A1220" : "#FFFFFF", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "13px", fontWeight: "700" }}
                >
                  <option value="SUSPEND">SUSPEND — Immediately halt admin operations</option>
                  <option value="REINSTATE">REINSTATE — Restore active status</option>
                  <option value="RESTRICT">RESTRICT — Limit high-impact capabilities</option>
                  <option value="WARN">WARN — Issue formal compliance warning</option>
                  <option value="BLOCK">BLOCK — Fully lock access credentials</option>
                </select>
              </div>

              <div style={{ marginBottom: "18px" }}>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#CBD5E1" : "#475569", marginBottom: "4px" }}>
                  Authoritative Compliance Reason * (Min 5 chars)
                </label>
                <textarea
                  required
                  rows="3"
                  placeholder="State the statutory / operational rationale for this administrative action..."
                  value={enforceReason}
                  onChange={(e) => setEnforceReason(e.target.value)}
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
                  disabled={enforcing}
                  style={{ padding: "8px 20px", borderRadius: "8px", border: "none", background: enforceAction === "REINSTATE" ? "#10B981" : "#EF4444", color: "#FFFFFF", fontWeight: "800", fontSize: "12px", cursor: enforcing ? "not-allowed" : "pointer" }}
                >
                  {enforcing ? "Enforcing..." : `Execute ${enforceAction}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* EDIT ADMINISTRATOR MODAL */}
      {showEditModal && editForm && (
        <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.75)", zIndex: 300, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", backdropFilter: "blur(4px)" }}>
          <div style={{ 
            background: isDark ? "#0A1220" : "#FFFFFF", 
            border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #CBD5E1",
            borderRadius: "16px",
            width: "100%",
            maxWidth: "620px",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
          }}>
            {/* Header */}
            <div style={{ 
              padding: "16px 20px", 
              borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0", 
              display: "flex", 
              justifyContent: "space-between", 
              alignItems: "center",
              background: isDark ? "rgba(59, 130, 246, 0.08)" : "rgba(59, 130, 246, 0.04)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(59, 130, 246, 0.15)", border: "1px solid rgba(59, 130, 246, 0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Pencil size={18} color="#3B82F6" />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A" }}>
                    Edit Administrator Profile & Scopes
                  </h3>
                  <div style={{ fontSize: "11.5px", color: isDark ? "#94A3B8" : "#64748B" }}>
                    ID: <strong style={{ color: "#3B82F6" }}>{editForm.admin_code}</strong> • {editForm.full_name}
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setShowEditModal(false)} 
                style={{ background: "none", border: "none", color: isDark ? "#94A3B8" : "#64748B", cursor: "pointer", padding: "4px" }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Scrollable Body */}
            <form onSubmit={handleEditSubmit} style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
              {editError && (
                <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.35)", color: "#EF4444", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertCircle size={15} />
                  <span>{editError}</span>
                </div>
              )}
              {editSuccess && (
                <div style={{ padding: "10px 14px", borderRadius: "8px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.35)", color: "#10B981", fontSize: "12px", fontWeight: "600", display: "flex", alignItems: "center", gap: "8px" }}>
                  <CheckCircle2 size={15} />
                  <span>{editSuccess}</span>
                </div>
              )}

              {/* Grid 1: Basic Identity */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#CBD5E1" : "#475569", marginBottom: "4px" }}>
                    Administrator Code
                  </label>
                  <input
                    type="text"
                    disabled
                    readOnly
                    value={editForm.admin_code}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9", color: isDark ? "#94A3B8" : "#64748B", fontSize: "12.5px", fontWeight: "700", cursor: "not-allowed" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#CBD5E1" : "#475569", marginBottom: "4px" }}>
                    Full Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Administrator Name"
                    value={editForm.full_name}
                    onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "#0A1220" : "#FFFFFF", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "12.5px" }}
                  />
                </div>
              </div>

              {/* Grid 2: Contact Info */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#CBD5E1" : "#475569", marginBottom: "4px" }}>
                    Official Email *
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="admin@coophub.gov.in"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "#0A1220" : "#FFFFFF", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "12.5px" }}
                  />
                </div>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#CBD5E1" : "#475569", marginBottom: "4px" }}>
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "#0A1220" : "#FFFFFF", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "12.5px" }}
                  />
                </div>
              </div>

              {/* Grid 3: Role & Status */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#CBD5E1" : "#475569", marginBottom: "4px" }}>
                    Administrative Role *
                  </label>
                  {selectedAdmin?.role === "SUPER_ADMIN" ? (
                    <select
                      disabled
                      value="SUPER_ADMIN"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9", color: "#FF7900", fontSize: "12.5px", fontWeight: "700", cursor: "not-allowed" }}
                    >
                      <option value="SUPER_ADMIN">SUPER_ADMIN (Apex Protected)</option>
                    </select>
                  ) : (
                    <select
                      value={editForm.role}
                      onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "#0A1220" : "#FFFFFF", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "12.5px", fontWeight: "600" }}
                    >
                      <option value="ZONE_ADMIN">ZONE_ADMIN — Level 4 Zonal</option>
                      <option value="STATE_ADMIN">STATE_ADMIN — Level 3 State</option>
                      <option value="DISTRICT_ADMIN">DISTRICT_ADMIN — Level 2 District</option>
                      <option value="VIEWER_ADMIN">VIEWER_ADMIN — Read-Only Auditor</option>
                    </select>
                  )}
                  {selectedAdmin?.role === "SUPER_ADMIN" && (
                    <div style={{ fontSize: "10.5px", color: "#FF7900", marginTop: "3px" }}>
                      Apex Super Admin role cannot be demoted or escalated.
                    </div>
                  )}
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#CBD5E1" : "#475569", marginBottom: "4px" }}>
                    Operational Status *
                  </label>
                  {editForm.admin_code === "SA-000001" ? (
                    <select
                      disabled
                      value="active"
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9", color: "#10B981", fontSize: "12.5px", fontWeight: "700", cursor: "not-allowed" }}
                    >
                      <option value="active">Active (Apex Protected)</option>
                    </select>
                  ) : (
                    <select
                      value={editForm.status}
                      onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
                      style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "#0A1220" : "#FFFFFF", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "12.5px", fontWeight: "600" }}
                    >
                      <option value="active">Active (Operational)</option>
                      <option value="suspended">Suspended (Operations Halted)</option>
                      <option value="restricted">Restricted (Capabilities Limited)</option>
                      <option value="inactive">Inactive (Decommissioned)</option>
                    </select>
                  )}
                </div>
              </div>

              {/* Geographic Scopes Management */}
              <div style={{ padding: "14px", borderRadius: "10px", background: isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                  <label style={{ fontSize: "11.5px", fontWeight: "800", color: isDark ? "#CBD5E1" : "#334155", display: "flex", alignItems: "center", gap: "5px" }}>
                    <MapPin size={13} color="#FF7900" />
                    Assigned Geographic Scopes ({editForm.scopes.length})
                  </label>
                  <span style={{ fontSize: "10.5px", color: isDark ? "#94A3B8" : "#64748B" }}>
                    Governs regional authorization boundaries
                  </span>
                </div>

                {/* Scopes Tag Cloud */}
                <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "12px", minHeight: "32px", padding: "6px", borderRadius: "8px", background: isDark ? "#0A1220" : "#FFFFFF", border: "1px solid #E2E8F0" }}>
                  {editForm.scopes.length === 0 ? (
                    <span style={{ fontSize: "11px", color: isDark ? "#64748B" : "#94A3B8", fontStyle: "italic", padding: "4px" }}>
                      No specific geographic scopes assigned (Global or Unassigned).
                    </span>
                  ) : (
                    editForm.scopes.map((sc, idx) => (
                      <span
                        key={idx}
                        style={{
                          background: "rgba(59, 130, 246, 0.12)",
                          border: "1px solid rgba(59, 130, 246, 0.35)",
                          color: "#3B82F6",
                          padding: "3px 8px",
                          borderRadius: "14px",
                          fontSize: "11px",
                          fontWeight: "700",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px"
                        }}
                      >
                        <span>{sc.level || sc.scope_type}: {sc.entity_code || sc.code}</span>
                        <button
                          type="button"
                          onClick={() => handleRemoveEditScope(idx)}
                          style={{
                            background: "none",
                            border: "none",
                            color: "#3B82F6",
                            cursor: "pointer",
                            padding: "0 2px",
                            display: "inline-flex",
                            alignItems: "center"
                          }}
                          title="Remove scope"
                        >
                          <X size={11} />
                        </button>
                      </span>
                    ))
                  )}
                </div>

                {/* Add New Scope Row */}
                <div style={{ display: "grid", gridTemplateColumns: "110px 1fr auto", gap: "8px", alignItems: "center" }}>
                  <select
                    value={editScopeLevel}
                    onChange={(e) => setEditScopeLevel(e.target.value)}
                    style={{ padding: "7px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", background: isDark ? "#0A1220" : "#FFFFFF", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "11.5px", fontWeight: "600" }}
                  >
                    <option value="ZONE">ZONE</option>
                    <option value="STATE">STATE</option>
                    <option value="DISTRICT">DISTRICT</option>
                  </select>

                  {editScopeLevel === "ZONE" && (
                    <select
                      value={editScopeZone}
                      onChange={(e) => setEditScopeZone(e.target.value)}
                      style={{ padding: "7px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", background: isDark ? "#0A1220" : "#FFFFFF", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "11.5px" }}
                    >
                      <option value="SZ">SZ — South Zone</option>
                      <option value="NZ">NZ — North Zone</option>
                      <option value="WZ">WZ — West Zone</option>
                      <option value="EZ">EZ — East Zone</option>
                    </select>
                  )}

                  {editScopeLevel === "STATE" && (
                    <select
                      value={editScopeState}
                      onChange={(e) => setEditScopeState(e.target.value)}
                      style={{ padding: "7px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", background: isDark ? "#0A1220" : "#FFFFFF", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "11.5px" }}
                    >
                      <option value="TN">TN — Tamil Nadu</option>
                      <option value="KL">KL — Kerala</option>
                      <option value="KA">KA — Karnataka</option>
                      <option value="AP">AP — Andhra Pradesh</option>
                      <option value="TS">TS — Telangana</option>
                      <option value="MH">MH — Maharashtra</option>
                      <option value="DL">DL — Delhi</option>
                      <option value="PB">PB — Punjab</option>
                      <option value="GJ">GJ — Gujarat</option>
                      <option value="WB">WB — West Bengal</option>
                      <option value="RJ">RJ — Rajasthan</option>
                      <option value="UP">UP — Uttar Pradesh</option>
                    </select>
                  )}

                  {editScopeLevel === "DISTRICT" && (
                    <input
                      type="text"
                      placeholder="e.g. TN-CHE-01 or KL-TVM-01"
                      value={editScopeDistrict}
                      onChange={(e) => setEditScopeDistrict(e.target.value)}
                      style={{ padding: "7px 8px", borderRadius: "6px", border: "1px solid #CBD5E1", background: isDark ? "#0A1220" : "#FFFFFF", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "11.5px" }}
                    />
                  )}

                  <button
                    type="button"
                    onClick={handleAddEditScope}
                    style={{
                      padding: "7px 12px",
                      borderRadius: "6px",
                      border: "none",
                      background: "#3B82F6",
                      color: "#FFFFFF",
                      fontSize: "11px",
                      fontWeight: "700",
                      cursor: "pointer",
                      whiteSpace: "nowrap"
                    }}
                  >
                    + Add Scope
                  </button>
                </div>
              </div>

              {/* Compliance Justification */}
              <div>
                <label style={{ display: "block", fontSize: "11.5px", fontWeight: "700", color: isDark ? "#CBD5E1" : "#475569", marginBottom: "4px" }}>
                  Authoritative Compliance Reason * (Audit Trail Requirement, Min 5 chars)
                </label>
                <textarea
                  required
                  rows="2"
                  placeholder="State the administrative or operational rationale for updating this account..."
                  value={editForm.reason}
                  onChange={(e) => setEditForm({ ...editForm, reason: e.target.value })}
                  style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #CBD5E1", background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", color: isDark ? "#FFFFFF" : "#0F172A", fontSize: "12.5px" }}
                />
              </div>

              {/* Controls */}
              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "8px" }}>
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  style={{ padding: "8px 16px", borderRadius: "8px", border: "1px solid #CBD5E1", background: "none", color: isDark ? "#CBD5E1" : "#475569", fontWeight: "700", fontSize: "12px", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={editLoading}
                  style={{
                    padding: "8px 20px",
                    borderRadius: "8px",
                    border: "none",
                    background: "#3B82F6",
                    color: "#FFFFFF",
                    fontWeight: "800",
                    fontSize: "12px",
                    cursor: editLoading ? "not-allowed" : "pointer",
                    display: "inline-flex",
                    alignItems: "center",
                    gap: "6px"
                  }}
                >
                  {editLoading ? (
                    <>
                      <RefreshCw size={13} className="spin" />
                      <span>Saving Changes...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 size={13} />
                      <span>Save Administrator Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
