import React, { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import { workforceAllocationEngine } from "../../../services/ai/workforceAllocationEngine";
import { useTranslation } from "../../../i18n/useTranslation";
import { 
  Zap, Users, MapPin, Wrench, AlertTriangle, 
  CheckCircle2, Sparkles, RefreshCw, Clock, Filter, ShieldAlert,
  ChevronRight, Calendar, ArrowUpRight, ShieldCheck, Eye, RotateCcw, UserX, UserCheck, Radio
} from "lucide-react";

export default function AdminAllocation() {
  const { t } = useTranslation();
  const [requests, setRequests] = useState([]);
  const [allocations, setAllocations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [analyzingId, setAnalyzingId] = useState(null);
  const [allocatingId, setAllocatingId] = useState(null);
  const [overrideModal, setOverrideModal] = useState(null);
  const [allVerifiedPillars, setAllVerifiedPillars] = useState([]);
  const [overridePillarId, setOverridePillarId] = useState("");
  const [overrideReason, setOverrideReason] = useState("");

  const [lastRefreshed, setLastRefreshed] = useState(null);
  const [liveConnected, setLiveConnected] = useState(false);

  useEffect(() => {
    loadData();

    // Real-time subscriptions on both source tables
    const srChannel = supabase
      .channel('allocation-sr-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => loadData())
      .subscribe((status) => { if (status === 'SUBSCRIBED') setLiveConnected(true); });

    const bookingsChannel = supabase
      .channel('allocation-bookings-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => loadData())
      .subscribe();

    const allocChannel = supabase
      .channel('allocation-trail-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workforce_allocations' }, () => loadData())
      .subscribe();

    return () => {
      supabase.removeChannel(srChannel);
      supabase.removeChannel(bookingsChannel);
      supabase.removeChannel(allocChannel);
    };
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // 1. Fetch from service_requests (primary source)
      const { data: srData } = await supabase
        .from('service_requests')
        .select(`
          *,
          pillar:pillar_profiles(id, full_name, pillar_code, mobile),
          service:services(id, name, category)
        `)
        .order('created_at', { ascending: false });

      // 2. Fetch from bookings table
      const { data: bookingsData } = await supabase
        .from('bookings')
        .select(`
          *,
          pillar:pillar_profiles(id, full_name, pillar_code, mobile)
        `)
        .order('created_at', { ascending: false });

      // 3. Normalize both into unified shape
      const normalizeBooking = (b) => ({
        id: b.id,
        _source: 'booking',
        order_code: b.booking_code || `ORD-${b.id.slice(0, 6).toUpperCase()}`,
        service_name: b.service_name || 'Service Order',
        sub_service_name: b.sub_service_name || '',
        category: b.category || 'General',
        customer_name: b.customer_name || 'Customer',
        customer_phone: b.customer_mobile || '—',
        service_address: b.service_address || b.address_line || 'Chennai',
        status: b.status || 'pending',
        amount: b.base_amount || b.amount || 0,
        pillar_id: b.pillar_id || null,
        pillar: b.pillar || null,
        created_at: b.created_at,
        is_emergency: b.is_emergency || false
      });

      const normalizeSR = (r) => ({
        id: r.id,
        _source: 'service_request',
        order_code: r.receipt_number || r.payment_gateway_ref ||
          (r.customer_description?.match(/\[Order:\s*([^|\]]+)/i)?.[1]?.trim()) ||
          r.order_code || `REQ-${r.id.slice(0, 6).toUpperCase()}`,
        service_name: r.service?.name || r.category || r.service_name || 'Service',
        sub_service_name: r.sub_service_name || '',
        category: r.service?.category || r.category || 'Service',
        customer_name: r.customer_name ||
          r.customer_description?.match(/Customer:\s*([^|\]]+)/i)?.[1]?.trim() ||
          'Verified Customer',
        customer_phone: r.customer_phone ||
          r.customer_description?.match(/Phone:\s*([^|\]]+)/i)?.[1]?.trim() || '—',
        service_address: [r.address_line, r.area, r.city].filter(Boolean).join(', ') || 'Chennai Hub',
        status: r.status || 'pending',
        amount: r.amount || r.final_amount || 0,
        pillar_id: r.pillar_id || null,
        pillar: r.pillar || null,
        created_at: r.created_at,
        is_emergency: r.is_emergency || false
      });

      const srNorm = (srData || []).map(normalizeSR);
      const bookNorm = (bookingsData || []).map(normalizeBooking);

      // Merge: avoid duplicates by id
      const srIds = new Set(srNorm.map(r => r.id));
      const merged = [
        ...srNorm,
        ...bookNorm.filter(b => !srIds.has(b.id))
      ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

      // 4. Fetch workforce allocations audit log
      const { data: allocData } = await supabase
        .from('workforce_allocations')
        .select(`
          *,
          pillar:pillar_profiles(full_name, pillar_code, mobile)
        `)
        .order('allocated_at', { ascending: false })
        .limit(25);

      // 5. Fetch all verified pillars for override modal
      const { data: pillarsData } = await supabase
        .from('pillar_profiles')
        .select('id, full_name, pillar_code, main_services, service_area, is_available')
        .eq('status', 'verified');

      setRequests(merged);
      setAllocations(allocData || []);
      setAllVerifiedPillars(pillarsData || []);
      setLastRefreshed(new Date());
    } catch (err) {
      console.error("Error loading allocation data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleInspectCandidates = async (req) => {
    setAnalyzingId(req.id);
    setSelectedRequest(req);
    try {
      const { eligible, approvedCerts } = await workforceAllocationEngine.getEligibleCandidates(req);
      const scored = eligible.map(p => workforceAllocationEngine.scoreCandidate(p, req, approvedCerts))
                             .sort((a, b) => b.score - a.score);
      setCandidates(scored);
    } catch (e) {
      console.error("Error inspecting candidates:", e);
      setCandidates([]);
    } finally {
      setAnalyzingId(null);
    }
  };

  const handleAutoAllocate = async (req) => {
    setAllocatingId(req.id);
    try {
      const res = await workforceAllocationEngine.allocateBestPillar(req.id, req);
      if (res.success) {
        alert(`Successfully allocated ${res.allocated_pillar.full_name} (${res.allocated_pillar.pillar_code}) with match score ${res.allocated_pillar.score}/100!`);
        await loadData();
        if (selectedRequest && selectedRequest.id === req.id) {
          setSelectedRequest(null);
        }
      } else {
        alert("Allocation notice: " + res.message);
      }
    } catch (err) {
      alert("Allocation error: " + err.message);
    } finally {
      setAllocatingId(null);
    }
  };

  const handleReallocate = async (req, prevPillarId) => {
    const reason = prompt("Enter reason for auto-reallocation (e.g. Technician unavailable / Job rejected):", "Technician unavailable");
    if (!reason) return;

    setAllocatingId(req.id);
    try {
      const res = await workforceAllocationEngine.reallocateRequest(req.id, req, prevPillarId, reason);
      if (res.success) {
        alert(`Auto-reallocated to next best candidate: ${res.reallocated_to.full_name} (${res.reallocated_to.score}/100)!`);
        await loadData();
      } else {
        alert(res.message);
      }
    } catch (e) {
      alert("Reallocation error: " + e.message);
    } finally {
      setAllocatingId(null);
    }
  };

  const handleAdminOverrideSubmit = async () => {
    if (!overridePillarId) {
      alert("Please select a technician for override.");
      return;
    }
    try {
      const res = await workforceAllocationEngine.adminOverrideAllocation({
        bookingId: overrideModal.id,
        newPillarId: overridePillarId,
        adminId: "ADMIN-001",
        overrideReason: overrideReason || "Administrative operational adjustment"
      });
      if (res.success) {
        alert("Manual admin override logged and dispatched successfully!");
        setOverrideModal(null);
        setOverridePillarId("");
        setOverrideReason("");
        await loadData();
      } else {
        alert("Override failed: " + res.error);
      }
    } catch (e) {
      alert("Override error: " + e.message);
    }
  };

  const pendingRequests = requests.filter(r => r.status === 'pending' || !r.pillar_id);
  const assignedRequests = requests.filter(r => r.pillar_id && r.status !== 'completed' && r.status !== 'cancelled');

  return (
    <div className="fade-in" style={{ paddingBottom: "40px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-5)", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ 
              background: "rgba(255, 121, 0, 0.15)", color: "#FF7900", 
              fontSize: "0.75rem", fontWeight: "800", padding: "3px 8px", borderRadius: "8px", textTransform: "uppercase" 
            }}>
              Workforce Dispatch Center
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
              AI-Assisted Allocation Engine
            </span>
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--color-text)", margin: 0 }}>
            Automated Workforce Allocation Control Tower
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", margin: "4px 0 0 0" }}>
            Real-time candidate ranking, multi-factor skill & proximity scoring, and audited dispatch logging.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {liveConnected && (
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.75rem", color: "#10B981", fontWeight: "700" }}>
              <Radio size={13} style={{ animation: "pulse 2s ease-in-out infinite" }} />
              Live
            </div>
          )}
          {lastRefreshed && (
            <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
              Updated {lastRefreshed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          )}
          <button 
            onClick={loadData} 
            disabled={loading}
            className="btn btn-outline btn-sm"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh Dispatch Queue
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "var(--space-5)" }}>
        <div style={{ background: "var(--color-surface)", padding: "18px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
            Pending Unallocated Requests
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: "900", color: pendingRequests.length > 0 ? "#EF4444" : "#10B981", marginTop: "6px" }}>
            {pendingRequests.length}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Awaiting automatic or manual assignment
          </div>
        </div>

        <div style={{ background: "var(--color-surface)", padding: "18px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
            Active Dispatched Jobs
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: "900", color: "var(--color-primary)", marginTop: "6px" }}>
            {assignedRequests.length}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Currently in progress across Chennai hubs
          </div>
        </div>

        <div style={{ background: "var(--color-surface)", padding: "18px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
            Active Verified Workforce
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: "900", color: "#10B981", marginTop: "6px" }}>
            {allVerifiedPillars.filter(p => p.is_available).length}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
            On-duty verified technicians available
          </div>
        </div>

        <div style={{ background: "var(--color-surface)", padding: "18px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
          <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
            Total Audited AI Allocations
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: "900", color: "#8B5CF6", marginTop: "6px" }}>
            {allocations.length}
          </div>
          <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Tracked in immutable dispatch ledger
          </div>
        </div>
      </div>

      {/* Main Queue Table */}
      <div style={{
        background: "var(--color-surface)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)",
        marginBottom: "var(--space-5)"
      }}>
        <div style={{ padding: "16px 20px", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: "800", margin: 0, color: "var(--color-text)" }}>
            Live Booking Dispatch & Allocation Queue
          </h3>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
            {requests.length} Total Records (service_requests + bookings)
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}><div className="spinner"></div></div>
        ) : requests.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-secondary)" }}>
            <Wrench size={32} color="var(--color-text-muted)" style={{ margin: "0 auto 10px" }} />
            <div style={{ fontWeight: "700" }}>No booking requests found in database</div>
            <div style={{ fontSize: "0.85rem", marginTop: "4px" }}>New customer requests will populate here in real-time.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)", color: "var(--color-text-secondary)", fontSize: "0.75rem", textTransform: "uppercase" }}>
                  <th style={{ padding: "12px 16px" }}>Order Code</th>
                  <th style={{ padding: "12px 16px" }}>Service & Category</th>
                  <th style={{ padding: "12px 16px" }}>Customer & Area</th>
                  <th style={{ padding: "12px 16px" }}>Status</th>
                  <th style={{ padding: "12px 16px" }}>Assigned Pillar</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {requests.slice(0, 15).map(req => {
                  const isPending = !req.pillar_id || req.status === 'pending';
                  return (
                    <tr key={req.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "12px 16px", fontWeight: "700", fontFamily: "monospace", color: "#FF7900", fontSize: "0.82rem" }}>
                        {req.order_code}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: "700", color: "var(--color-text)" }}>{req.service_name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                          {req.sub_service_name || req.category || "Standard Service"}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: "600" }}>{req.customer_name}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>{req.service_address}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          padding: "3px 8px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: "800",
                          background: isPending ? "rgba(239, 68, 68, 0.15)" : "rgba(16, 185, 129, 0.15)",
                          color: isPending ? "#EF4444" : "#10B981"
                        }}>
                          {req.status?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {req.pillar ? (
                          <div>
                            <div style={{ fontWeight: "700", color: "#FF7900", fontSize: "0.82rem" }}>
                              {req.pillar.full_name}
                            </div>
                            <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontFamily: "monospace" }}>
                              {req.pillar.pillar_code}
                            </div>
                          </div>
                        ) : req.pillar_id ? (
                          <span style={{ color: "#F59E0B", fontSize: "0.78rem", fontWeight: "700" }}>Assigned (loading…)</span>
                        ) : (
                          <span style={{ color: "var(--color-text-muted)", fontSize: "0.78rem" }}>Unassigned</span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px" }}>
                          <button
                            onClick={() => handleInspectCandidates(req)}
                            disabled={analyzingId === req.id}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                          >
                            <Eye size={13} /> {analyzingId === req.id ? "Analyzing..." : "Rank"}
                          </button>

                          {isPending ? (
                            <button
                              onClick={() => handleAutoAllocate(req)}
                              disabled={allocatingId === req.id}
                              className="btn btn-primary btn-sm"
                              style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                            >
                              <Zap size={13} /> {allocatingId === req.id ? "Assigning..." : "Auto-Allocate"}
                            </button>
                          ) : (
                            <button
                              onClick={() => handleReallocate(req, req.pillar_id)}
                              className="btn btn-outline btn-sm"
                              style={{ fontSize: "0.75rem", padding: "4px 8px", color: "#F59E0B" }}
                              title="Reallocate to next candidate"
                            >
                              <RotateCcw size={13} /> Reallocate
                            </button>
                          )}

                          <button
                            onClick={() => setOverrideModal(req)}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                          >
                            Override
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Candidate Ranking Drawer (if inspecting a request) */}
      {selectedRequest && (
        <div style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          border: "2px solid #FF7900",
          padding: "22px",
          marginBottom: "var(--space-5)",
          boxShadow: "var(--shadow-md)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <div style={{ fontSize: "0.75rem", color: "#FF7900", fontWeight: "800", textTransform: "uppercase" }}>
                AI Candidate Ranking Matrix
              </div>
              <h3 style={{ fontSize: "1.15rem", fontWeight: "800", margin: "2px 0 0 0", color: "var(--color-text)" }}>
                Eligible Technicians for {selectedRequest.service_name} ({selectedRequest.service_address})
              </h3>
            </div>
            <button onClick={() => setSelectedRequest(null)} className="btn btn-outline btn-sm">Close</button>
          </div>

          {candidates.length === 0 ? (
            <div style={{ padding: "30px", textAlign: "center", color: "var(--color-text-secondary)" }}>
              No verified pillars matching this trade skill are currently available in the database.
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {candidates.map((cand, idx) => (
                <div key={cand.pillar_id} style={{
                  background: idx === 0 ? "rgba(255, 121, 0, 0.05)" : "var(--color-surface-hover)",
                  border: idx === 0 ? "1px solid rgba(255, 121, 0, 0.4)" : "1px solid var(--color-border)",
                  borderRadius: "12px",
                  padding: "16px 20px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "12px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
                    <div style={{
                      width: "36px", height: "36px", borderRadius: "50%",
                      background: idx === 0 ? "#FF7900" : "var(--color-surface)",
                      color: idx === 0 ? "white" : "var(--color-text)",
                      border: "1px solid var(--color-border)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontWeight: "900", fontSize: "0.9rem"
                    }}>
                      #{idx + 1}
                    </div>

                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <strong style={{ fontSize: "0.95rem" }}>{cand.full_name}</strong>
                        <span style={{ fontSize: "0.72rem", background: "var(--color-surface)", padding: "1px 6px", borderRadius: "4px", border: "1px solid var(--color-border)" }}>
                          {cand.pillar_code}
                        </span>
                        {cand.isCertified && (
                          <span style={{ fontSize: "0.72rem", background: "rgba(16, 185, 129, 0.15)", color: "#10B981", padding: "1px 6px", borderRadius: "4px", fontWeight: "700" }}>
                            ✓ Certified
                          </span>
                        )}
                      </div>
                      <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", marginTop: "3px" }}>
                        {cand.gps_status} • {cand.distanceKm !== null ? `${cand.distanceKm} km away` : 'Locality match'} • {cand.active_jobs_count} active job(s) • {cand.rating}★ rating
                      </div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "1.3rem", fontWeight: "900", color: idx === 0 ? "#FF7900" : "var(--color-text)" }}>
                        {cand.score}<span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>/100</span>
                      </div>
                      <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Match Score</div>
                    </div>

                    {idx === 0 && (
                      <button
                        onClick={() => handleAutoAllocate(selectedRequest)}
                        disabled={allocatingId === selectedRequest.id}
                        className="btn btn-primary btn-sm"
                      >
                        <Zap size={14} /> Assign Best Candidate
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Audited Workforce Allocation Log Table */}
      <div style={{
        background: "var(--color-surface)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
        padding: "20px",
        boxShadow: "var(--shadow-sm)"
      }}>
        <h3 style={{ fontSize: "1.05rem", fontWeight: "800", marginBottom: "14px", color: "var(--color-text)" }}>
          Audited Workforce Allocation & Reassignment Trail
        </h3>
        {allocations.length === 0 ? (
          <div style={{ padding: "30px", textAlign: "center", color: "var(--color-text-secondary)" }}>
            No allocation records logged yet. Assignments will appear here with full scoring audits.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)", color: "var(--color-text-secondary)", fontSize: "0.72rem", textTransform: "uppercase" }}>
                  <th style={{ padding: "10px 14px" }}>Timestamp</th>
                  <th style={{ padding: "10px 14px" }}>Service</th>
                  <th style={{ padding: "10px 14px" }}>Pillar Assigned</th>
                  <th style={{ padding: "10px 14px" }}>Score</th>
                  <th style={{ padding: "10px 14px" }}>Method</th>
                  <th style={{ padding: "10px 14px" }}>AI Operational Reasoning</th>
                </tr>
              </thead>
              <tbody>
                {allocations.map(al => (
                  <tr key={al.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "10px 14px", color: "var(--color-text-muted)" }}>
                      {new Date(al.allocated_at || al.created_at).toLocaleTimeString()}
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: "600" }}>{al.service_name}</td>
                    <td style={{ padding: "10px 14px", fontWeight: "700", color: "#FF7900" }}>
                      {al.pillar?.full_name || al.allocated_pillar_id?.slice(0, 8)}
                    </td>
                    <td style={{ padding: "10px 14px", fontWeight: "800" }}>{al.match_score}/100</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{
                        padding: "2px 6px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "800",
                        background: al.allocation_method === 'ADMIN_OVERRIDE' ? "rgba(239, 68, 68, 0.15)" : "rgba(139, 92, 246, 0.15)",
                        color: al.allocation_method === 'ADMIN_OVERRIDE' ? "#EF4444" : "#8B5CF6"
                      }}>
                        {al.allocation_method}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", color: "var(--color-text-secondary)", fontSize: "0.8rem", maxWidth: "340px" }}>
                      {al.ai_recommendation || "Deterministic scoring allocation"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Admin Manual Override Modal */}
      {overrideModal && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(5, 10, 18, 0.8)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
        }}>
          <div style={{
            background: "var(--color-surface)", borderRadius: "16px",
            width: "100%", maxWidth: "500px", border: "1px solid var(--color-border)",
            padding: "24px"
          }}>
            <h3 style={{ fontSize: "1.15rem", fontWeight: "800", margin: "0 0 12px 0", color: "var(--color-text)" }}>
              Admin Manual Allocation Override
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", margin: "0 0 16px 0" }}>
              Manually assign a specific verified technician to <strong>{overrideModal.service_name}</strong> ({overrideModal.service_address}). This action is recorded in the audit trail.
            </p>

            <div style={{ marginBottom: "14px" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", marginBottom: "6px" }}>Select Verified Pillar:</label>
              <select
                value={overridePillarId}
                onChange={(e) => setOverridePillarId(e.target.value)}
                className="form-input"
                style={{ width: "100%", fontSize: "0.85rem", padding: "8px 12px" }}
              >
                <option value="">-- Select Technician --</option>
                {allVerifiedPillars.map(p => (
                  <option key={p.id} value={p.id}>
                    {p.full_name} ({p.pillar_code}) • {Array.isArray(p.main_services) ? p.main_services.join(', ') : p.main_services}
                  </option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "20px" }}>
              <label style={{ display: "block", fontSize: "0.8rem", fontWeight: "700", marginBottom: "6px" }}>Override Reason / Justification:</label>
              <input
                type="text"
                value={overrideReason}
                onChange={(e) => setOverrideReason(e.target.value)}
                placeholder="e.g. VIP customer request / Direct supervisor dispatch"
                className="form-input"
                style={{ width: "100%", fontSize: "0.85rem", padding: "8px 12px" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button onClick={() => setOverrideModal(null)} className="btn btn-outline btn-sm">Cancel</button>
              <button onClick={handleAdminOverrideSubmit} className="btn btn-primary btn-sm">Submit Override</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
