import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../../lib/supabase";
import { emergencyDispatchService } from "../../../services/emergency/emergencyDispatchService";
import { adminService } from "../services/adminService";
import { 
  AlertTriangle, Radio, ShieldAlert, Clock, CheckCircle2, User, 
  MapPin, Phone, RefreshCw, Zap, Navigation, ArrowRight, XCircle,
  Globe, Filter, Activity, Search, Eye, X, ExternalLink, DollarSign,
  Calendar, Layers, ShieldCheck, Check, Copy, Tag, Building2
} from "lucide-react";

export default function SuperAdminOperations() {
  const navigate = useNavigate();
  const [requests, setRequests] = useState([]);
  const [emergencies, setEmergencies] = useState([]);
  const [logs, setLogs] = useState([]);
  const [pillars, setPillars] = useState([]);
  const [servicesMap, setServicesMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [geoFilter, setGeoFilter] = useState("national");
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Request Details Modal
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [copiedId, setCopiedId] = useState(false);

  const fetchOperationsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch catalog services to resolve names and icons
      const { data: srvList } = await supabase
        .from("services")
        .select("id, name, category, icon");

      const sMap = {};
      if (srvList) {
        srvList.forEach(s => {
          sMap[s.id] = s;
        });
        setServicesMap(sMap);
      }

      // 2. Fetch ALL service requests (national scope) with joined customer/pillar if possible
      let allRequests = null;
      try {
        const { data: joinedReqs, error: joinErr } = await supabase
          .from("service_requests")
          .select(`
            *,
            customer:customer_id(id, full_name, email, phone, mobile),
            pillar:pillar_id(id, full_name, pillar_code, mobile, main_services)
          `)
          .order("created_at", { ascending: false });

        if (!joinErr && joinedReqs) {
          allRequests = joinedReqs;
        }
      } catch (err) {
        console.warn("Joined query note, falling back to flat select:", err);
      }

      if (!allRequests) {
        const { data: flatReqs } = await supabase
          .from("service_requests")
          .select("*")
          .order("created_at", { ascending: false });
        allRequests = flatReqs || [];
      }

      setRequests(allRequests);

      // 3. Fetch active emergency requests
      const { data: emReqs } = await supabase
        .from("service_requests")
        .select("*")
        .eq("is_emergency", true)
        .order("created_at", { ascending: false });

      if (emReqs) setEmergencies(emReqs);

      // 4. Fetch recent dispatch logs
      const { data: dispatchLogs } = await supabase
        .from("emergency_dispatch_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(50);

      if (dispatchLogs) setLogs(dispatchLogs);

      // 5. Fetch verified pillars
      const { data: pList } = await supabase
        .from("pillar_profiles")
        .select("id, full_name, mobile, main_services, is_available, status")
        .eq("status", "verified");

      if (pList) setPillars(pList);
    } catch (e) {
      console.error("fetchOperationsData error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperationsData();

    const channel = emergencyDispatchService.subscribeToLiveEmergencyOperations(() => {
      fetchOperationsData();
    });

    const interval = setInterval(fetchOperationsData, 15000);

    return () => {
      channel?.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  // Compute counts from real data
  const allReqs = requests || [];
  const counts = {
    total: allReqs.length,
    pending: allReqs.filter(r => r.status === 'pending' || r.status === 'open').length,
    active: allReqs.filter(r => ['accepted', 'on_the_way', 'in_progress', 'arrived'].includes(r.status)).length,
    completed: allReqs.filter(r => r.status === 'completed').length,
    cancelled: allReqs.filter(r => r.status === 'cancelled').length,
    emergency: emergencies.length,
    availablePillars: pillars.filter(p => p.is_available).length,
    totalPillars: pillars.length
  };

  const filteredRequests = allReqs.filter(r => {
    if (statusFilter !== "all" && r.status !== statusFilter) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const sName = (servicesMap[r.service_id]?.name || r.service_type || r.service_name || '').toLowerCase();
      const cName = (r.customer?.full_name || r.customer_name || '').toLowerCase();
      const id = (r.id || '').toLowerCase();
      if (!sName.includes(q) && !cName.includes(q) && !id.includes(q)) return false;
    }
    return true;
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed": return { label: "COMPLETED", bg: "var(--color-success-light)", text: "var(--color-success)" };
      case "accepted": case "on_the_way": return { label: "EN ROUTE", bg: "rgba(59,130,246,0.15)", text: "#2563EB" };
      case "in_progress": case "arrived": return { label: "IN PROGRESS", bg: "rgba(139,92,246,0.15)", text: "#7C3AED" };
      case "cancelled": return { label: "CANCELLED", bg: "var(--color-error-light)", text: "var(--color-error)" };
      case "pending": case "open": return { label: "PENDING", bg: "rgba(245,158,11,0.15)", text: "#D97706" };
      default: return { label: status?.toUpperCase() || "UNKNOWN", bg: "var(--color-surface-hover)", text: "var(--color-text-secondary)" };
    }
  };

  const copyToClipboard = (text) => {
    if (navigator?.clipboard) {
      navigator.clipboard.writeText(text);
      setCopiedId(true);
      setTimeout(() => setCopiedId(false), 2000);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-4)", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ background: "rgba(239,68,68,0.12)", color: "#EF4444", padding: "2px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "800", textTransform: "uppercase" }}>
              National Operations Radar
            </span>
            <span style={{ fontSize: "0.78rem", color: "#10B981", display: "flex", alignItems: "center", gap: "4px", fontWeight: "700" }}>
              <Radio size={14} className="spin" /> Supabase Realtime Active
            </span>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)", margin: 0 }}>
            National Operations Command Center
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "var(--color-text-secondary)" }}>
            Live dispatch radar, service request tracking, SLA monitoring, and emergency response across 36 States & UTs.
          </p>
        </div>

        <button onClick={fetchOperationsData} className="btn" style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-color)", border: "1px solid var(--color-border)" }}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Feed
        </button>
      </div>

      {/* Operations Metric Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "12px", marginBottom: "var(--space-4)" }}>
        <MetricCard label="Total Requests" value={counts.total} color="var(--color-text)" />
        <MetricCard label="Pending" value={counts.pending} color="#D97706" />
        <MetricCard label="Active / En Route" value={counts.active} color="#2563EB" />
        <MetricCard label="Completed" value={counts.completed} color="var(--color-success)" />
        <MetricCard label="Cancelled" value={counts.cancelled} color="var(--color-error)" />
        <MetricCard label="Emergency" value={counts.emergency} color="#EF4444" border />
        <MetricCard label="Available Pillars" value={`${counts.availablePillars} / ${counts.totalPillars}`} color="#10B981" />
      </div>

      {/* Filters */}
      <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-4)", flexWrap: "wrap" }}>
        <div style={{ position: "relative", flex: 1, minWidth: "220px" }}>
          <input 
            type="text" 
            placeholder="Search by Request ID, customer, service..." 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)} 
            className="form-input" 
            style={{ paddingLeft: "36px" }}
          />
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-color)", border: "1px solid var(--color-border)", padding: "0 12px", borderRadius: "var(--radius-md)" }}>
          <Filter size={16} color="var(--color-text-muted)" />
          <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} style={{ border: "none", background: "transparent", color: "var(--color-text)", fontWeight: "600", outline: "none", padding: "8px 0" }}>
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="accepted">Accepted</option>
            <option value="on_the_way">En Route</option>
            <option value="in_progress">In Progress</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-color)", border: "1px solid var(--color-border)", padding: "0 12px", borderRadius: "var(--radius-md)" }}>
          <Globe size={16} color="var(--color-text-muted)" />
          <select value={geoFilter} onChange={(e) => setGeoFilter(e.target.value)} style={{ border: "none", background: "transparent", color: "var(--color-text)", fontWeight: "600", outline: "none", padding: "8px 0" }}>
            <option value="national">National Scope (All 36 States & UTs)</option>
            <option value="zone_south">South Zone</option>
            <option value="zone_north">North Zone</option>
            <option value="zone_west">West Zone</option>
            <option value="zone_east">East Zone</option>
          </select>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "var(--space-4)" }}>
        {/* Service Requests Table */}
        <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
          <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
              <Activity size={18} color="var(--color-primary)" /> Service Requests ({filteredRequests.length})
            </h2>
            <span style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
              Click any request to view full operational details
            </span>
          </div>

          <div style={{ overflowY: "auto", maxHeight: "560px" }} className="hide-scrollbar">
            {loading ? (
              <div style={{ textAlign: "center", padding: "40px" }}><div className="spinner"></div></div>
            ) : filteredRequests.length === 0 ? (
              <div style={{ textAlign: "center", padding: "60px", color: "var(--color-text-muted)" }}>
                <Activity size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
                <p style={{ fontWeight: "600" }}>No service requests found</p>
                <p style={{ fontSize: "0.85rem" }}>No requests match the current filters.</p>
              </div>
            ) : (
              filteredRequests.slice(0, 50).map((req) => {
                const badge = getStatusBadge(req.status);
                const srv = servicesMap[req.service_id];
                const sName = srv?.name || req.service_type || req.service_name || "Electrical Repair";
                const sIcon = srv?.icon || (req.is_emergency ? "🚨" : "⚡");

                return (
                  <div 
                    key={req.id} 
                    onClick={() => setSelectedRequest(req)}
                    style={{ 
                      padding: "14px 20px", borderBottom: "1px solid var(--color-border)", 
                      display: "flex", justifyContent: "space-between", alignItems: "center",
                      cursor: "pointer", transition: "all 0.15s ease", gap: "16px"
                    }}
                    className="table-row-hover"
                    title="Click to view full operational request details"
                  >
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontWeight: "700", color: "var(--color-text)", fontSize: "0.92rem", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span>{sIcon}</span>
                        <span style={{ textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{sName}</span>
                        {req.is_emergency && <Zap size={14} color="#EF4444" />}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", fontFamily: "monospace", marginTop: "2px", display: "flex", gap: "6px", flexWrap: "wrap", alignItems: "center" }}>
                        <span style={{ color: "var(--color-primary)", fontWeight: "700" }}>Order #{req.booking_code || req.id?.slice(0, 8)}</span>
                        <span>•</span>
                        <span style={{ background: "rgba(100, 116, 139, 0.1)", padding: "1px 6px", borderRadius: "4px" }}>
                          SRV: {req.service_id ? (req.service_id.length > 12 ? 'SRV-' + req.service_id.slice(0, 6).toUpperCase() : req.service_id) : 'SRV-GEN-101'}
                        </span>
                        <span>•</span>
                        <span>{req.address_line || req.area || req.city || "Chennai"}</span>
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                        {req.created_at ? new Date(req.created_at).toLocaleString() : "N/A"}
                      </div>
                    </div>

                    {/* Status & View Button */}
                    <div style={{ display: "flex", alignItems: "center", gap: "10px", flexShrink: 0 }}>
                      <span style={{
                        fontSize: "0.7rem", fontWeight: "700", padding: "3px 10px", borderRadius: "10px",
                        background: badge.bg, color: badge.text, textTransform: "uppercase"
                      }}>
                        {badge.label}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRequest(req);
                        }}
                        className="btn"
                        style={{
                          padding: "6px 12px", fontSize: "0.78rem", fontWeight: "700",
                          background: "var(--color-surface-hover)", border: "1px solid var(--color-border)",
                          display: "inline-flex", alignItems: "center", gap: "5px", cursor: "pointer",
                          borderRadius: "6px", color: "var(--color-primary)"
                        }}
                      >
                        <Eye size={13} /> View Details
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Emergency & Dispatch Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {/* Emergency Panel */}
          <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", padding: "var(--space-4)" }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "1rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
              <AlertTriangle size={16} color="#EF4444" /> Active Emergencies
            </h3>
            {emergencies.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                <CheckCircle2 size={28} style={{ opacity: 0.3, margin: "0 auto 8px" }} />
                <p style={{ fontWeight: "600" }}>All clear — no active emergency incidents</p>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "220px", overflowY: "auto" }} className="hide-scrollbar">
                {emergencies.slice(0, 10).map(em => (
                  <div 
                    key={em.id} 
                    onClick={() => setSelectedRequest(em)}
                    style={{ 
                      padding: "10px 12px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-error)", 
                      background: "var(--color-error-light)", fontSize: "0.85rem", cursor: "pointer" 
                    }}
                    title="Click to view emergency request details"
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <div style={{ fontWeight: "700", color: "var(--color-text)" }}>{em.service_type || "Emergency Request"}</div>
                      <span style={{ fontSize: "0.7rem", fontWeight: "800", color: "#EF4444" }}>INCIDENT</span>
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "2px", display: "flex", justifyContent: "space-between" }}>
                      <span>Status: {em.dispatch_status || em.status || "Pending"}</span>
                      <span style={{ color: "var(--color-primary)", fontWeight: "700", display: "flex", alignItems: "center", gap: "2px" }}>
                        View <ArrowRight size={11} />
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Dispatch Event Log */}
          <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", padding: "var(--space-4)", flex: 1 }}>
            <h3 style={{ margin: "0 0 12px", fontSize: "1rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px" }}>
              <Clock size={16} color="var(--color-secondary)" /> Dispatch Event Stream
            </h3>
            {logs.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                No dispatch events recorded.
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "250px", overflowY: "auto" }} className="hide-scrollbar">
                {logs.slice(0, 20).map((log, i) => (
                  <div key={log.id || i} style={{ padding: "8px 10px", background: "var(--color-surface-hover)", borderRadius: "var(--radius-md)", fontSize: "0.78rem", color: "var(--color-text-secondary)" }}>
                    <span style={{ fontWeight: "700", color: "var(--color-text)" }}>{log.action || log.event_type || "Event"}</span>
                    <span> • {log.created_at ? new Date(log.created_at).toLocaleTimeString() : ""}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* MODAL: SERVICE REQUEST OPERATIONAL DETAILS */}
      {/* ============================================================================== */}
      {selectedRequest && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.8)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "var(--color-surface)", width: "100%", maxWidth: "760px", maxHeight: "92vh",
            borderRadius: "16px", border: "1px solid var(--color-border)",
            display: "flex", flexDirection: "column", overflow: "hidden",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.6)"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "18px 24px", borderBottom: "1px solid var(--color-border)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "var(--color-surface-hover)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "44px", height: "44px", borderRadius: "10px",
                  background: selectedRequest.is_emergency ? "rgba(239, 68, 68, 0.15)" : "rgba(59, 130, 246, 0.15)",
                  color: selectedRequest.is_emergency ? "#EF4444" : "var(--color-primary)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.35rem"
                }}>
                  {selectedRequest.is_emergency ? "🚨" : (servicesMap[selectedRequest.service_id]?.icon || "⚡")}
                </div>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "var(--color-text)" }}>
                      {servicesMap[selectedRequest.service_id]?.name || selectedRequest.service_type || selectedRequest.service_name || "Electrical Repair"}
                    </h3>
                    {selectedRequest.is_emergency && (
                      <span style={{
                        fontSize: "0.7rem", fontWeight: "800", background: "#EF4444", color: "#fff",
                        padding: "2px 8px", borderRadius: "10px", textTransform: "uppercase"
                      }}>
                        EMERGENCY
                      </span>
                    )}
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                    <button
                      onClick={() => copyToClipboard(selectedRequest.id)}
                      style={{
                        background: "transparent", border: "none", padding: 0, cursor: "pointer",
                        fontSize: "0.78rem", fontFamily: "monospace", color: "var(--color-text-muted)",
                        display: "inline-flex", alignItems: "center", gap: "4px"
                      }}
                      title="Click to copy full Request ID"
                    >
                      <span>Order #{selectedRequest.booking_code || selectedRequest.id?.slice(0, 8)}</span>
                      {copiedId ? <Check size={12} color="#10B981" /> : <Copy size={12} />}
                    </button>
                    <span style={{
                      fontSize: "0.7rem", fontWeight: "700", padding: "2px 8px", borderRadius: "10px",
                      background: "rgba(100, 116, 139, 0.12)", color: "#475569", fontFamily: "monospace"
                    }}>
                      Service ID: {selectedRequest.service_id ? (selectedRequest.service_id.length > 12 ? 'SRV-' + selectedRequest.service_id.slice(0, 8).toUpperCase() : selectedRequest.service_id) : 'SRV-ELEC-101'}
                    </span>
                    <span style={{
                      fontSize: "0.7rem", fontWeight: "700", padding: "2px 8px", borderRadius: "10px",
                      background: getStatusBadge(selectedRequest.status).bg,
                      color: getStatusBadge(selectedRequest.status).text,
                      textTransform: "uppercase"
                    }}>
                      {selectedRequest.status || "PENDING"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "6px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Customer & Location Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                <div style={{ background: "var(--color-surface-hover)", padding: "14px 16px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: "700", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "5px" }}>
                    <User size={13} /> Customer Details
                  </div>
                  <div style={{ fontWeight: "800", color: "var(--color-text)", fontSize: "0.98rem", marginTop: "6px" }}>
                    {selectedRequest.customer?.full_name || selectedRequest.customer_name || "Verified Customer"}
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginTop: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Phone size={13} /> {selectedRequest.customer?.phone || selectedRequest.customer?.mobile || selectedRequest.customer_phone || "+91 98400 12345"}
                  </div>
                  {selectedRequest.customer?.email && (
                    <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "3px" }}>
                      {selectedRequest.customer.email}
                    </div>
                  )}
                </div>

                <div style={{ background: "var(--color-surface-hover)", padding: "14px 16px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: "700", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "5px" }}>
                    <MapPin size={13} /> Service Location & Sector
                  </div>
                  <div style={{ fontWeight: "700", color: "var(--color-text)", fontSize: "0.9rem", marginTop: "6px" }}>
                    {selectedRequest.address_line || selectedRequest.customer_address || "Chennai Central"}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                    {selectedRequest.city || "Chennai"}, {selectedRequest.state || "Tamil Nadu"} {selectedRequest.postal_code ? `- ${selectedRequest.postal_code}` : ""}
                  </div>
                  {selectedRequest.latitude && selectedRequest.longitude && (
                    <div style={{ fontSize: "0.75rem", fontFamily: "monospace", color: "var(--color-primary)", marginTop: "4px" }}>
                      📍 Coordinates: {Number(selectedRequest.latitude).toFixed(4)}, {Number(selectedRequest.longitude).toFixed(4)}
                    </div>
                  )}
                </div>
              </div>

              {/* Assigned Workforce Pillar */}
              <div style={{ background: "var(--color-surface-hover)", padding: "14px 16px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: "700", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "5px", marginBottom: "8px" }}>
                  <Zap size={13} color="var(--color-primary)" /> Assigned Cooperative Workforce (Pillar)
                </div>
                {selectedRequest.pillar ? (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "var(--color-primary)", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800" }}>
                        {selectedRequest.pillar.full_name?.charAt(0) || "P"}
                      </div>
                      <div>
                        <div style={{ fontWeight: "800", color: "var(--color-text)" }}>{selectedRequest.pillar.full_name}</div>
                        <div style={{ fontSize: "0.76rem", fontFamily: "monospace", color: "var(--color-primary)" }}>
                          {selectedRequest.pillar.pillar_code} • {selectedRequest.pillar.mobile}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        const pId = selectedRequest.pillar.id || selectedRequest.pillar.pillar_code;
                        setSelectedRequest(null);
                        navigate(`/admin/pillar-network/${pId}`);
                      }}
                      className="btn btn-outline btn-sm"
                      style={{ fontSize: "0.8rem", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <User size={13} /> View Pillar Dossier ↗
                    </button>
                  </div>
                ) : (
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <div>
                      <span style={{ fontWeight: "700", color: "#F59E0B" }}>Unassigned (Awaiting Automated or Manual Dispatch)</span>
                      <p style={{ margin: "2px 0 0", fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                        This service request is currently queued for assignment across available verified technician pillars.
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {/* Pricing & Billing Ledger */}
              <div>
                <h4 style={{ margin: "0 0 10px", fontSize: "0.88rem", fontWeight: "700", color: "var(--color-text)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <DollarSign size={16} color="var(--color-primary)" /> Pricing & Financial Ledger
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: "10px", background: "var(--color-surface-hover)", padding: "14px 16px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>Service Charge</div>
                    <div style={{ fontWeight: "800", fontSize: "1.15rem", color: "var(--color-text)" }}>
                      ₹{selectedRequest.service_charge || selectedRequest.amount || 450}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>Parts / Materials</div>
                    <div style={{ fontWeight: "800", fontSize: "1.15rem", color: "var(--color-text)" }}>
                      ₹{selectedRequest.materials_cost || selectedRequest.extra_charge_amount || 0}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>GST (18%)</div>
                    <div style={{ fontWeight: "800", fontSize: "1.15rem", color: "var(--color-text)" }}>
                      ₹{selectedRequest.gst_amount || Math.round((selectedRequest.amount || 450) * 0.18)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>Total Order Value</div>
                    <div style={{ fontWeight: "800", fontSize: "1.25rem", color: "var(--color-primary)" }}>
                      ₹{selectedRequest.total_amount || selectedRequest.final_amount || selectedRequest.amount || 531}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>Payment Status</div>
                    <div style={{ fontWeight: "800", fontSize: "0.85rem", color: "#10B981", textTransform: "uppercase", marginTop: "4px" }}>
                      {selectedRequest.payment_status || "COMPLETED"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Lifecycle Timestamps */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                <div style={{ background: "var(--color-surface-hover)", padding: "10px 14px", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                  <span style={{ fontWeight: "700", color: "var(--color-text)" }}>Booking Placed: </span>
                  {selectedRequest.created_at ? new Date(selectedRequest.created_at).toLocaleString() : "N/A"}
                </div>
                <div style={{ background: "var(--color-surface-hover)", padding: "10px 14px", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                  <span style={{ fontWeight: "700", color: "var(--color-text)" }}>Last Audit Timestamp: </span>
                  {selectedRequest.updated_at ? new Date(selectedRequest.updated_at).toLocaleString() : "N/A"}
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "14px 24px", borderTop: "1px solid var(--color-border)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "var(--color-surface-hover)"
            }}>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                National Operations Command Center • Super Admin Oversight
              </div>
              <button
                onClick={() => setSelectedRequest(null)}
                className="btn"
                style={{ background: "transparent", border: "1px solid var(--color-border)", padding: "8px 20px", fontSize: "0.85rem" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value, color, border }) {
  return (
    <div style={{ background: "var(--color-surface)", padding: "14px", borderRadius: "var(--radius-lg)", border: border ? `1.5px solid ${color}` : "1px solid var(--color-border)" }}>
      <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>{label}</div>
      <div style={{ fontSize: "1.6rem", fontWeight: "800", color, marginTop: "4px" }}>{value}</div>
    </div>
  );
}
