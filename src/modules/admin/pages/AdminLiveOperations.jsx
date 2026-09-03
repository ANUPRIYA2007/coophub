import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { emergencyDispatchService } from "../../../services/emergency/emergencyDispatchService";
import { adminService } from "../services/adminService";
import { 
  AlertTriangle, Radio, ShieldAlert, Clock, CheckCircle2, User, 
  MapPin, Phone, RefreshCw, Zap, Navigation, ArrowRight, XCircle
} from "lucide-react";

export default function AdminLiveOperations() {
  const [emergencies, setEmergencies] = useState([]);
  const [logs, setLogs] = useState([]);
  const [pillars, setPillars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [showReassignModal, setShowReassignModal] = useState(false);
  const [reassignPillarId, setReassignPillarId] = useState("");
  const [reassignReason, setReassignReason] = useState("");

  const fetchOperationsData = async () => {
    setLoading(true);
    try {
      // 1. Fetch active emergency requests
      const { data: emReqs, error: reqErr } = await supabase
        .from("service_requests")
        .select("*")
        .eq("is_emergency", true)
        .order("created_at", { ascending: false });

      if (!reqErr && emReqs) {
        setEmergencies(emReqs);
      }

      // 2. Fetch recent dispatch logs
      const { data: dispatchLogs } = await supabase
        .from("emergency_dispatch_logs")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);

      if (dispatchLogs) {
        setLogs(dispatchLogs);
      }

      // 3. Fetch verified available pillars for manual re-dispatch
      const { data: pList } = await supabase
        .from("pillar_profiles")
        .select("id, full_name, mobile, main_services, is_available, status")
        .eq("status", "verified");

      if (pList) {
        setPillars(pList);
      }
    } catch (e) {
      console.error("fetchOperationsData error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOperationsData();

    // Supabase Realtime subscription to live incidents
    const channel = emergencyDispatchService.subscribeToLiveEmergencyOperations(() => {
      fetchOperationsData();
    });

    const interval = setInterval(fetchOperationsData, 10000); // 10s polling fallback

    return () => {
      channel?.unsubscribe();
      clearInterval(interval);
    };
  }, []);

  const handleManualReassign = async (e) => {
    e.preventDefault();
    if (!selectedIncident || !reassignPillarId) return;

    try {
      await emergencyDispatchService.adminReassignEmergency(
        selectedIncident.id,
        reassignPillarId,
        "admin-user-uuid",
        reassignReason || "Admin manual dispatch override"
      );
      setShowReassignModal(false);
      fetchOperationsData();
      alert("Technician assigned and dispatched successfully.");
    } catch (err) {
      alert("Manual reassignment failed: " + err.message);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ACCEPTED":
      case "accepted":
        return { label: "ACCEPTED", bg: "rgba(16, 185, 129, 0.15)", text: "#059669" };
      case "EN_ROUTE":
      case "on_the_way":
        return { label: "EN ROUTE", bg: "rgba(59, 130, 246, 0.15)", text: "#2563EB" };
      case "ARRIVED":
      case "arrived":
        return { label: "ON SCENE", bg: "rgba(139, 92, 246, 0.15)", text: "#7C3AED" };
      case "OFFERED":
        return { label: "OFFERED (90s)", bg: "rgba(245, 158, 11, 0.15)", text: "#D97706" };
      case "ESCALATED":
        return { label: "ESCALATED", bg: "rgba(239, 68, 68, 0.2)", text: "#DC2626" };
      case "DISPATCHING":
      case "EMERGENCY_CREATED":
      default:
        return { label: "DISPATCHING", bg: "rgba(255, 121, 0, 0.15)", text: "#FF7900" };
    }
  };

  const counts = {
    total: emergencies.length,
    dispatching: emergencies.filter(e => ["EMERGENCY_CREATED", "DISPATCHING", "OFFERED"].includes(e.dispatch_status)).length,
    enRoute: emergencies.filter(e => ["ACCEPTED", "EN_ROUTE", "accepted", "on_the_way"].includes(e.dispatch_status || e.status)).length,
    arrived: emergencies.filter(e => ["ARRIVED", "arrived", "in_progress"].includes(e.dispatch_status || e.status)).length,
    escalated: emergencies.filter(e => e.dispatch_status === "ESCALATED").length
  };

  return (
    <div style={{ padding: "24px", maxWidth: "1400px", margin: "0 auto" }}>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ background: "rgba(239, 68, 68, 0.12)", color: "#EF4444", padding: "2px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "800", textTransform: "uppercase" }}>
              Mission-Critical Dispatch
            </span>
            <span style={{ fontSize: "0.78rem", color: "#10B981", display: "flex", alignItems: "center", gap: "4px", fontWeight: "700" }}>
              <Radio size={14} className="spin" /> Supabase Realtime Active
            </span>
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "900", color: "var(--color-text)", margin: 0 }}>
            Live Operations & Emergency Control Tower
          </h1>
          <p style={{ margin: "4px 0 0", fontSize: "0.88rem", color: "var(--color-text-secondary)" }}>
            High-velocity technician matching, real-time geolocation vectors, 90s offer timeouts, and escalation management.
          </p>
        </div>

        <button onClick={fetchOperationsData} className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Feed
        </button>
      </div>

      {/* Operations Metric Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "14px", marginBottom: "24px" }}>
        <div style={{ background: "var(--color-surface)", padding: "16px", borderRadius: "12px", border: "1px solid var(--color-border)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Total Emergencies</div>
          <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "var(--color-text)", marginTop: "4px" }}>{counts.total}</div>
        </div>
        <div style={{ background: "var(--color-surface)", padding: "16px", borderRadius: "12px", border: "1px solid #FF7900" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#FF7900", textTransform: "uppercase" }}>Dispatching / Offered</div>
          <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#FF7900", marginTop: "4px" }}>{counts.dispatching}</div>
        </div>
        <div style={{ background: "var(--color-surface)", padding: "16px", borderRadius: "12px", border: "1px solid #2563EB" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#2563EB", textTransform: "uppercase" }}>En Route / Assigned</div>
          <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#2563EB", marginTop: "4px" }}>{counts.enRoute}</div>
        </div>
        <div style={{ background: "var(--color-surface)", padding: "16px", borderRadius: "12px", border: "1px solid #10B981" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#10B981", textTransform: "uppercase" }}>On Scene / In Progress</div>
          <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#10B981", marginTop: "4px" }}>{counts.arrived}</div>
        </div>
        <div style={{ background: "var(--color-surface)", padding: "16px", borderRadius: "12px", border: "1px solid #EF4444" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#EF4444", textTransform: "uppercase" }}>Escalated / Blocked</div>
          <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#EF4444", marginTop: "4px" }}>{counts.escalated}</div>
        </div>
      </div>

      {/* Grid: Left: Active Incidents, Right: Dispatch Event Stream */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "24px" }}>
        
        {/* Active Emergency Incidents */}
        <div style={{ background: "var(--color-surface)", borderRadius: "16px", border: "1px solid var(--color-border)", padding: "20px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-text)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <AlertTriangle size={18} color="#EF4444" /> Active Emergency Incidents
          </h2>

          {emergencies.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)", fontSize: "0.9rem" }}>
              ✓ All quiet. No active emergency incidents currently in the queue.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {emergencies.map((em) => {
                const badge = getStatusBadge(em.dispatch_status || em.status);
                const isSelected = selectedIncident?.id === em.id;
                return (
                  <div
                    key={em.id}
                    onClick={() => setSelectedIncident(em)}
                    style={{
                      background: isSelected ? "var(--color-surface-hover)" : "var(--color-surface)",
                      border: `1.5px solid ${em.dispatch_status === 'ESCALATED' ? '#EF4444' : isSelected ? 'var(--color-primary)' : 'var(--color-border)'}`,
                      borderRadius: "12px",
                      padding: "16px",
                      cursor: "pointer",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                      <div>
                        <span style={{ fontSize: "0.8rem", fontWeight: "800", fontFamily: "monospace", color: "var(--color-primary)" }}>
                          #{em.id.slice(0, 8)}
                        </span>
                        <h3 style={{ fontSize: "0.95rem", fontWeight: "800", color: "var(--color-text)", margin: "2px 0 0" }}>
                          {em.service_name || "Emergency Hazard"}
                        </h3>
                      </div>
                      <span style={{
                        background: badge.bg, color: badge.text,
                        fontSize: "0.72rem", fontWeight: "800", padding: "3px 8px", borderRadius: "8px"
                      }}>
                        {badge.label}
                      </span>
                    </div>

                    <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", margin: "0 0 10px" }}>
                      <strong>Hazard:</strong> {em.emergency_reason || "Urgent assistance required"}
                    </p>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.78rem", color: "var(--color-text-muted)", flexWrap: "wrap", gap: "8px" }}>
                      <div>
                        📍 {em.area || "Chennai Central"} {em.latitude ? `(${em.latitude.toFixed(3)}, ${em.longitude?.toFixed(3)})` : "• (GPS Pending)"}
                      </div>
                      <div>
                        Attempts: <strong>{em.dispatch_attempts || 0}</strong> • OTP: <strong>{em.arrival_otp || '489201'}</strong>
                      </div>
                      {em.dispatch_status === 'ESCALATED' && (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedIncident(em);
                            setShowReassignModal(true);
                          }}
                          className="btn btn-xs btn-primary"
                          style={{ background: "#EF4444", color: "white", fontWeight: "800" }}
                        >
                          ⚡ Manual Reassign
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Live Dispatch Event Stream */}
        <div style={{ background: "var(--color-surface)", borderRadius: "16px", border: "1px solid var(--color-border)", padding: "20px" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-text)", margin: "0 0 16px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Radio size={18} color="#FF7900" /> Dispatch Audit Stream
          </h2>

          {logs.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
              No recent dispatch logs.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", maxHeight: "480px", overflowY: "auto" }}>
              {logs.map((log) => (
                <div key={log.id} style={{ background: "var(--color-surface-hover)", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "0.78rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                    <span style={{ fontWeight: "800", color: log.event_type === 'ACCEPTED' ? '#059669' : log.event_type === 'ESCALATED' ? '#DC2626' : '#D97706' }}>
                      {log.event_type}
                    </span>
                    <span style={{ color: "var(--color-text-muted)" }}>
                      {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>
                  <div style={{ color: "var(--color-text)" }}>
                    Order #{log.request_id ? log.request_id.slice(0, 8) : 'N/A'} • Actor: <strong>{log.actor_role}</strong>
                  </div>
                  {log.distance_km && (
                    <div style={{ color: "var(--color-text-secondary)", marginTop: "2px" }}>
                      Distance: {log.distance_km} km • ETA: {log.eta_minutes || '10'} mins
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Manual Reassignment Modal */}
      {showReassignModal && selectedIncident && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(5, 10, 18, 0.85)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: "16px"
        }}>
          <div style={{
            background: "var(--color-surface)",
            borderRadius: "16px",
            border: "1px solid var(--color-border)",
            maxWidth: "500px",
            width: "100%",
            padding: "24px"
          }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "900", color: "var(--color-text)", margin: "0 0 10px" }}>
              Override & Reassign Emergency Order
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", margin: "0 0 16px" }}>
              Order #{selectedIncident.id.slice(0, 8)} ({selectedIncident.service_name})
            </p>

            <form onSubmit={handleManualReassign}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: "700", display: "block", marginBottom: "6px" }}>
                  Select On-Duty Technician:
                </label>
                <select
                  required
                  value={reassignPillarId}
                  onChange={(e) => setReassignPillarId(e.target.value)}
                  style={{
                    width: "100%", padding: "10px", borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface-hover)"
                  }}
                >
                  <option value="">-- Choose Verified Pillar --</option>
                  {pillars.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.full_name} ({Array.isArray(p.main_services) ? p.main_services[0] : p.main_services}) - {p.mobile}
                    </option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: "700", display: "block", marginBottom: "6px" }}>
                  Administrative Note / Reason:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Dispatched nearest master technician directly by phone."
                  value={reassignReason}
                  onChange={(e) => setReassignReason(e.target.value)}
                  style={{
                    width: "100%", padding: "10px", borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface-hover)"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button type="button" onClick={() => setShowReassignModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ flex: 2, background: "#EF4444", color: "white", fontWeight: "800" }}>
                  Confirm Reassignment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
