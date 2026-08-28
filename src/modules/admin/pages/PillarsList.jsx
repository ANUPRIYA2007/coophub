import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import { Search, Eye, Filter, UserCheck, Clock, ShieldCheck, RefreshCw, AlertCircle, CheckCircle2, Plus } from "lucide-react";
import { Link } from "react-router-dom";

export default function PillarsList() {
  const [pillars, setPillars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all"); // 'all' | 'pending_review' | 'verified' | 'rejected'
  const [showAddModal, setShowAddModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newPillarData, setNewPillarData] = useState({
    full_name: "",
    main_services: "Electrician",
    mobile: "",
    email: "",
    service_area: "Guindy, Chennai",
    experience_years: 3
  });

  useEffect(() => {
    fetchPillars();

    // Supabase Realtime Subscription for incoming Pillar registrations
    const channel = adminService.subscribeToLivePillars?.(() => {
      fetchPillars();
    });

    return () => {
      channel?.unsubscribe?.();
    };
  }, []);

  const fetchPillars = async () => {
    setLoading(true);
    const data = await adminService.getAllPillars();
    setPillars(data || []);
    setLoading(false);
  };

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim().length > 2) {
      setLoading(true);
      const data = await adminService.searchPillars(value);
      setPillars(data || []);
      setLoading(false);
    } else if (value.trim().length === 0) {
      fetchPillars();
    }
  };

  const pendingCount = pillars.filter(p => p.status === 'pending_verification' || p.status === 'pending_review' || p.status === 'pending' || !p.status).length;
  const verifiedCount = pillars.filter(p => p.status === 'verified').length;
  const rejectedCount = pillars.filter(p => p.status === 'rejected' || p.status === 'suspended').length;

  const filteredPillars = pillars.filter(p => {
    const status = p.status || 'pending_verification';
    if (statusFilter === 'pending_review') {
      if (status !== 'pending_review' && status !== 'pending' && status !== 'pending_verification') return false;
    } else if (statusFilter === 'verified') {
      if (status !== 'verified') return false;
    } else if (statusFilter === 'rejected') {
      if (status !== 'rejected' && status !== 'suspended') return false;
    }

    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    const name = (p.full_name || '').toLowerCase();
    const code = (p.pillar_code || '').toLowerCase();
    const mobile = (p.mobile || '').toLowerCase();
    const email = (p.email || '').toLowerCase();
    const trade = (Array.isArray(p.main_services) ? p.main_services.join(' ') : (p.main_services || '')).toLowerCase();
    return name.includes(q) || code.includes(q) || mobile.includes(q) || email.includes(q) || trade.includes(q);
  });

  return (
    <div className="fade-in">
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-5)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ 
              background: "rgba(245, 124, 32, 0.15)", color: "var(--color-secondary)", 
              fontSize: "0.75rem", fontWeight: "800", padding: "2px 8px", borderRadius: "10px", textTransform: "uppercase" 
            }}>
              Workforce Verification & Registry
            </span>
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--color-text)", margin: 0 }}>
            Pillar Management & Verification
          </h1>
          <p style={{ color: "var(--color-text-secondary)", marginTop: "4px", fontSize: "0.9rem" }}>
            Review applicant documents, verify skills, assign unique Pillar IDs, and manage verified workforce.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={() => setShowAddModal(true)} 
            className="btn btn-primary" 
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} /> Add New Pillar
          </button>
          <button onClick={fetchPillars} className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "6px" }} disabled={loading}>
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
        <div style={{ background: "var(--color-surface)", padding: "16px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(59, 130, 246, 0.12)", color: "#3B82F6", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <UserCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Total Registered</div>
            <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--color-text)" }}>{pillars.length}</div>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter("pending_review")}
          style={{ 
            background: "var(--color-surface)", 
            padding: "16px", 
            borderRadius: "var(--radius-lg)", 
            border: pendingCount > 0 ? "1px solid rgba(245, 158, 11, 0.5)" : "1px solid var(--color-border)", 
            display: "flex", 
            alignItems: "center", 
            gap: "14px",
            cursor: "pointer",
            boxShadow: pendingCount > 0 ? "0 0 15px rgba(245, 158, 11, 0.1)" : "none"
          }}
        >
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(245, 158, 11, 0.15)", color: "#F59E0B", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Clock size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#F59E0B", fontWeight: "700" }}>Pending Verification</div>
            <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--color-text)" }}>{pendingCount}</div>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter("verified")}
          style={{ background: "var(--color-surface)", padding: "16px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }}
        >
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.12)", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#10B981", fontWeight: "700" }}>Verified & Active</div>
            <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--color-text)" }}>{verifiedCount}</div>
          </div>
        </div>

        <div 
          onClick={() => setStatusFilter("rejected")}
          style={{ background: "var(--color-surface)", padding: "16px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", display: "flex", alignItems: "center", gap: "14px", cursor: "pointer" }}
        >
          <div style={{ width: "42px", height: "42px", borderRadius: "10px", background: "rgba(239, 68, 68, 0.12)", color: "#EF4444", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <AlertCircle size={22} />
          </div>
          <div>
            <div style={{ fontSize: "0.8rem", color: "#EF4444", fontWeight: "700" }}>Suspended / Rejected</div>
            <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--color-text)" }}>{rejectedCount}</div>
          </div>
        </div>
      </div>

      <div style={{ 
        background: "var(--color-surface)", 
        borderRadius: "var(--radius-lg)", 
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden"
      }}>
        <div style={{ 
          padding: "var(--space-4)", 
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={() => setStatusFilter("all")}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "0.85rem",
                fontWeight: statusFilter === "all" ? "700" : "500",
                border: "none",
                cursor: "pointer",
                background: statusFilter === "all" ? "var(--color-secondary)" : "var(--color-surface-hover)",
                color: statusFilter === "all" ? "white" : "var(--color-text-secondary)",
                transition: "all 0.2s ease"
              }}
            >
              All Pillars ({pillars.length})
            </button>

            <button
              onClick={() => setStatusFilter("pending_review")}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "0.85rem",
                fontWeight: statusFilter === "pending_review" ? "700" : "500",
                border: "none",
                cursor: "pointer",
                background: statusFilter === "pending_review" ? "#F59E0B" : "var(--color-surface-hover)",
                color: statusFilter === "pending_review" ? "white" : "var(--color-text-secondary)",
                transition: "all 0.2s ease"
              }}
            >
              Pending ({pendingCount})
            </button>

            <button
              onClick={() => setStatusFilter("verified")}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "0.85rem",
                fontWeight: statusFilter === "verified" ? "700" : "500",
                border: "none",
                cursor: "pointer",
                background: statusFilter === "verified" ? "#10B981" : "var(--color-surface-hover)",
                color: statusFilter === "verified" ? "white" : "var(--color-text-secondary)",
                transition: "all 0.2s ease"
              }}
            >
              Verified ({verifiedCount})
            </button>

            <button
              onClick={() => setStatusFilter("rejected")}
              style={{
                padding: "6px 14px",
                borderRadius: "20px",
                fontSize: "0.85rem",
                fontWeight: statusFilter === "rejected" ? "700" : "500",
                border: "none",
                cursor: "pointer",
                background: statusFilter === "rejected" ? "#EF4444" : "var(--color-surface-hover)",
                color: statusFilter === "rejected" ? "white" : "var(--color-text-secondary)",
                transition: "all 0.2s ease"
              }}
            >
              Suspended ({rejectedCount})
            </button>
          </div>

          <div className="input-wrapper" style={{ flex: 1, maxWidth: "340px", minWidth: "200px" }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search by Name, ID, Trade, Mobile..." 
              value={searchQuery}
              onChange={handleSearch}
            />
            <Search size={18} className="input-icon" />
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: "var(--space-8)", textAlign: "center" }}>
              <div className="spinner" style={{ margin: "0 auto var(--space-3)" }}></div>
              <div style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem" }}>Loading registered workforce...</div>
            </div>
          ) : filteredPillars.length === 0 ? (
            <div style={{ padding: "var(--space-8)", textAlign: "center" }}>
              <AlertCircle size={36} color="var(--color-text-muted)" style={{ margin: "0 auto 12px" }} />
              <h3 style={{ fontSize: "1rem", fontWeight: "700", color: "var(--color-text)", margin: 0 }}>No Pillars Found</h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>
                {statusFilter === "pending_review" ? "All registered applicant pillars have been reviewed and verified." : "No records match the current filter criteria."}
              </p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Pillar ID / Ref</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Technician Name</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Trade & Services</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Contact & Area</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Verification Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", color: "var(--color-text-secondary)", fontWeight: "600" }}>Actions & Controls</th>
                </tr>
              </thead>
              <tbody>
                {filteredPillars.map((pillar) => {
                  const isPending = pillar.status === 'pending_review' || pillar.status === 'pending' || pillar.status === 'pending_verification' || !pillar.status;
                  const isVerified = pillar.status === 'verified';
                  const isSuspended = pillar.status === 'suspended' || pillar.status === 'rejected';
                  const trades = (Array.isArray(pillar.main_services) && pillar.main_services.includes('Others') && pillar.custom_role) 
                    ? `${pillar.custom_role} (Custom)` 
                    : (Array.isArray(pillar.main_services) ? pillar.main_services.join(', ') : (pillar.main_services || 'General Trades'));
                  const areaDisplay = pillar.area 
                    ? `${pillar.area}${pillar.pincode ? ` (${pillar.pincode})` : ''}` 
                    : (Array.isArray(pillar.service_area) ? pillar.service_area.join(', ') : (pillar.service_area || "Chennai"));

                  return (
                    <tr key={pillar.id} style={{ borderBottom: "1px solid var(--color-border)", transition: "background 0.2s" }} className="hover-row">
                      <td style={{ padding: "12px 16px" }}>
                        {pillar.pillar_code ? (
                          <span style={{ fontWeight: "700", color: "var(--color-secondary)", fontFamily: "monospace", fontSize: "0.9rem" }}>
                            {pillar.pillar_code}
                          </span>
                        ) : (
                          <span style={{ 
                            background: "rgba(245, 124, 32, 0.15)", color: "var(--color-secondary)", 
                            fontSize: "0.72rem", fontWeight: "800", padding: "2px 8px", borderRadius: "8px" 
                          }}>
                            NEW APPLICANT
                          </span>
                        )}
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: "700", color: "var(--color-text)" }}>{pillar.full_name || "Applicant"}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>{pillar.email || "No email"}</div>
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: "600", color: "var(--color-text)" }}>{trades}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)" }}>
                          {pillar.experience_years ? `${pillar.experience_years} yrs exp` : "Experience unstated"}
                        </div>
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: "600", color: "var(--color-text)" }}>{pillar.mobile || "N/A"}</div>
                        <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)" }}>
                          {areaDisplay}
                        </div>
                      </td>

                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ 
                          padding: "3px 10px", 
                          borderRadius: "12px", 
                          fontSize: "0.75rem", 
                          fontWeight: "800",
                          textTransform: "capitalize",
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          background: isVerified ? 'var(--color-success-light)' : isPending ? 'rgba(245, 158, 11, 0.15)' : 'var(--color-error-light)',
                          color: isVerified ? 'var(--color-success)' : isPending ? '#F59E0B' : 'var(--color-error)'
                        }}>
                          {isVerified && <CheckCircle2 size={12} />}
                          {isPending && <Clock size={12} />}
                          {pillar.status?.replace("_", " ") || "Pending Review"}
                        </span>
                      </td>

                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "6px", alignItems: "center" }}>
                          {isPending ? (
                            <Link 
                              to={`/admin/pillars/${pillar.id}`} 
                              className="btn btn-primary btn-sm" 
                              style={{ padding: "4px 10px", fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: "5px", background: "var(--color-secondary)" }}
                            >
                              <ShieldCheck size={13} /> Verify
                            </Link>
                          ) : (
                            <Link 
                              to={`/admin/pillars/${pillar.id}`} 
                              className="btn btn-outline btn-sm" 
                              style={{ padding: "4px 10px", fontSize: "0.78rem", display: "inline-flex", alignItems: "center", gap: "4px" }}
                            >
                              <Eye size={13} /> View
                            </Link>
                          )}

                          <button
                            type="button"
                            title="Issue Warning"
                            onClick={async () => {
                              const reason = prompt(`Enter warning reason for ${pillar.full_name}:`, "Customer feedback compliance review required.");
                              if (reason) {
                                await adminService.issuePillarWarning(pillar.id, { reason });
                                alert(`⚠️ Formal warning issued to ${pillar.full_name}.`);
                                fetchPillars();
                              }
                            }}
                            className="btn btn-outline btn-sm"
                            style={{ padding: "4px 8px", color: "#F59E0B", borderColor: "rgba(245, 158, 11, 0.4)", fontSize: "0.75rem" }}
                          >
                            ⚠️
                          </button>

                          {isSuspended ? (
                            <button
                              type="button"
                              title="Reactivate Pillar"
                              onClick={async () => {
                                if (window.confirm(`Reactivate ${pillar.full_name} and allow accepting jobs?`)) {
                                  await adminService.reactivatePillar(pillar.id);
                                  alert(`✅ ${pillar.full_name} has been reactivated.`);
                                  fetchPillars();
                                }
                              }}
                              className="btn btn-sm"
                              style={{ padding: "4px 8px", background: "rgba(16, 185, 129, 0.15)", color: "#10B981", border: "1px solid #10B981", fontSize: "0.75rem" }}
                            >
                              Reactivate
                            </button>
                          ) : (
                            <button
                              type="button"
                              title="Suspend / Block Pillar"
                              onClick={async () => {
                                const reason = prompt(`Enter suspension reason for ${pillar.full_name}:`, "Account under review for policy violations.");
                                if (reason) {
                                  await adminService.suspendPillar(pillar.id, reason);
                                  alert(`🚫 ${pillar.full_name} has been suspended.`);
                                  fetchPillars();
                                }
                              }}
                              className="btn btn-sm"
                              style={{ padding: "4px 8px", background: "rgba(239, 68, 68, 0.15)", color: "#EF4444", border: "1px solid #EF4444", fontSize: "0.75rem" }}
                            >
                              Block
                            </button>
                          )}

                          <button
                            type="button"
                            title="Delete Pillar"
                            onClick={async () => {
                              if (window.confirm(`Are you sure you want to permanently remove ${pillar.full_name} from the platform?`)) {
                                await adminService.deletePillar(pillar.id);
                                alert(`🗑️ ${pillar.full_name} removed.`);
                                fetchPillars();
                              }
                            }}
                            className="btn btn-outline btn-sm"
                            style={{ padding: "4px 8px", color: "var(--color-text-muted)", fontSize: "0.75rem" }}
                          >
                            ✕
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAddModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.8)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)"
        }}>
          <div style={{
            background: "var(--color-surface)", width: "100%", maxWidth: "520px",
            borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)",
            padding: "var(--space-5)", boxShadow: "var(--shadow-xl)"
          }}>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "800", marginBottom: "var(--space-4)" }}>
              ➕ Register New Cooperative Pillar
            </h2>

            <form onSubmit={async (e) => {
              e.preventDefault();
              setCreating(true);
              const res = await adminService.createPillar(newPillarData);
              if (res.success) {
                alert(`✅ Pillar ${newPillarData.full_name} registered successfully with ID: ${res.data?.pillar_code}`);
                setShowAddModal(false);
                setNewPillarData({ full_name: "", main_services: "Electrician", mobile: "", email: "", service_area: "Chennai", experience_years: 3 });
                fetchPillars();
              } else {
                alert("Failed to create pillar: " + res.error);
              }
              setCreating(false);
            }} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: "700", display: "block", marginBottom: "4px" }}>Technician Full Name</label>
                <input 
                  required
                  type="text"
                  value={newPillarData.full_name}
                  onChange={(e) => setNewPillarData({ ...newPillarData, full_name: e.target.value })}
                  placeholder="e.g. Ramesh Pandian"
                  className="input"
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: "700", display: "block", marginBottom: "4px" }}>Primary Trade Skill</label>
                  <select 
                    value={newPillarData.main_services}
                    onChange={(e) => setNewPillarData({ ...newPillarData, main_services: e.target.value })}
                    className="input"
                  >
                    <option value="Electrician">Electrician</option>
                    <option value="Plumber">Plumber</option>
                    <option value="AC Technician">AC Technician</option>
                    <option value="Carpenter">Carpenter</option>
                    <option value="Home Cleaning">Home Cleaning</option>
                    <option value="Appliance Repair">Appliance Repair</option>
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: "700", display: "block", marginBottom: "4px" }}>Experience (Years)</label>
                  <input 
                    type="number"
                    min="1"
                    max="40"
                    value={newPillarData.experience_years}
                    onChange={(e) => setNewPillarData({ ...newPillarData, experience_years: e.target.value })}
                    className="input"
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: "700", display: "block", marginBottom: "4px" }}>Mobile Number</label>
                  <input 
                    required
                    type="tel"
                    value={newPillarData.mobile}
                    onChange={(e) => setNewPillarData({ ...newPillarData, mobile: e.target.value })}
                    placeholder="+91 98401 23456"
                    className="input"
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: "700", display: "block", marginBottom: "4px" }}>Email Address</label>
                  <input 
                    type="email"
                    value={newPillarData.email}
                    onChange={(e) => setNewPillarData({ ...newPillarData, email: e.target.value })}
                    placeholder="technician@coophub.in"
                    className="input"
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: "700", display: "block", marginBottom: "4px" }}>Service Coverage Zone / Area</label>
                <input 
                  type="text"
                  value={newPillarData.service_area}
                  onChange={(e) => setNewPillarData({ ...newPillarData, service_area: e.target.value })}
                  placeholder="e.g. Guindy, Saidapet, Adyar"
                  className="input"
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "10px" }}>
                <button type="button" onClick={() => setShowAddModal(false)} className="btn btn-outline btn-sm">Cancel</button>
                <button type="submit" disabled={creating} className="btn btn-primary btn-sm">
                  {creating ? "Registering..." : "Confirm & Issue Pillar ID"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
