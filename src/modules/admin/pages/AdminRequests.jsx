import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import { 
  ClipboardList, Search, Filter, Eye, CheckCircle, Clock, 
  AlertCircle, XCircle, User, MapPin, Phone, RefreshCw 
} from "lucide-react";

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  useEffect(() => {
    fetchRequests();

    // Supabase Realtime Live Subscription (Syncs with Customer & Pillar Portal)
    const channel = adminService.subscribeToLiveRequests((payload) => {
      console.log("Realtime order event received:", payload);
      fetchRequests();
    });

    return () => {
      channel?.unsubscribe();
    };
  }, [filterStatus]);

  const fetchRequests = async () => {
    const data = await adminService.getServiceRequests(filterStatus);
    setRequests(data);
    setLoading(false);
  };

  const handleStatusChange = async (requestId, newStatus) => {
    setStatusUpdating(true);
    const res = await adminService.updateServiceRequest(requestId, { status: newStatus });
    if (res.success) {
      setRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: newStatus } : r));
      if (selectedRequest && selectedRequest.id === requestId) {
        setSelectedRequest(prev => ({ ...prev, status: newStatus }));
      }
    } else {
      alert("Failed to update status: " + res.error);
    }
    setStatusUpdating(false);
  };

  const filteredRequests = requests.filter(r => {
    const q = searchQuery.toLowerCase();
    const serviceName = (r.service_name || r.category || "").toLowerCase();
    const customerName = (r.customer_name || "").toLowerCase();
    const pillarName = (r.pillar?.full_name || "").toLowerCase();
    const orderCode = (r.order_code || r.id || "").toLowerCase();
    return serviceName.includes(q) || customerName.includes(q) || pillarName.includes(q) || orderCode.includes(q);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "completed":
        return { bg: "var(--color-success-light)", color: "var(--color-success)", icon: CheckCircle, label: "Completed" };
      case "in_progress":
        return { bg: "rgba(59, 130, 246, 0.15)", color: "#3B82F6", icon: RefreshCw, label: "In Progress" };
      case "assigned":
        return { bg: "rgba(139, 92, 246, 0.15)", color: "#8B5CF6", icon: Clock, label: "Assigned" };
      case "pending":
        return { bg: "var(--color-warning-light)", color: "var(--color-warning)", icon: AlertCircle, label: "Pending" };
      case "cancelled":
        return { bg: "var(--color-error-light)", color: "var(--color-error)", icon: XCircle, label: "Cancelled" };
      default:
        return { bg: "var(--color-surface-hover)", color: "var(--color-text-secondary)", icon: Clock, label: status || "Open" };
    }
  };

  return (
    <div className="fade-in">
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-5)" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
            Service Requests Management
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Real-time control tower for all consumer bookings, technician assignments, and job lifecycles.
          </p>
        </div>
        <button 
          onClick={fetchRequests} 
          className="btn btn-outline" 
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh Requests
        </button>
      </div>

      {/* Main Container */}
      <div style={{ 
        background: "var(--color-surface)", 
        borderRadius: "var(--radius-lg)", 
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden"
      }}>
        {/* Filter Bar & Search */}
        <div style={{ 
          padding: "var(--space-4)", 
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-3)",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          {/* Status Tabs */}
          <div style={{ display: "flex", gap: "6px", overflowX: "auto" }}>
            {["all", "pending", "assigned", "in_progress", "completed", "cancelled"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  fontWeight: filterStatus === status ? "700" : "500",
                  background: filterStatus === status ? "var(--color-primary)" : "var(--color-surface-hover)",
                  color: filterStatus === status ? "white" : "var(--color-text-secondary)",
                  border: "none",
                  cursor: "pointer",
                  textTransform: "capitalize",
                  transition: "all 0.2s"
                }}
              >
                {status.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div className="input-wrapper" style={{ width: "280px" }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search ID, customer, pillar..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={16} className="input-icon" />
          </div>
        </div>

        {/* Requests Table */}
        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: "var(--space-6)", textAlign: "center" }}>
              <div className="spinner"></div>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-text-secondary)" }}>
              <ClipboardList size={36} style={{ opacity: 0.3, margin: "0 auto var(--space-3)" }} />
              <p style={{ fontWeight: "600" }}>No service requests found</p>
              <span style={{ fontSize: "0.85rem" }}>
                {filterStatus === "all" ? "Incoming customer bookings will appear here." : `No requests currently in "${filterStatus}" status.`}
              </span>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Order Code</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Service</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Customer</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Assigned Pillar</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Amount</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", color: "var(--color-text-secondary)", fontWeight: "600" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredRequests.map((req) => {
                  const badge = getStatusBadge(req.status);
                  const BadgeIcon = badge.icon;
                  return (
                    <tr key={req.id} style={{ borderBottom: "1px solid var(--color-border)" }} className="hover-row">
                      <td style={{ padding: "12px 16px", fontWeight: "700", color: "var(--color-primary)" }}>
                        {req.order_code || req.id.substring(0, 8).toUpperCase()}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: "600" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          {req.service_name || req.category || "General Service"}
                          {req.is_emergency && (
                            <span style={{ 
                              background: "var(--color-error)", color: "white", 
                              fontSize: "0.65rem", padding: "2px 6px", borderRadius: "10px", 
                              fontWeight: "bold", textTransform: "uppercase" 
                            }}>
                              Emergency
                            </span>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: "600" }}>{req.customer_name || "Guest Customer"}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>{req.customer_phone || req.customer_mobile || "—"}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        {req.pillar ? (
                          <div>
                            <span style={{ fontWeight: "600", color: "var(--color-text)" }}>{req.pillar.full_name}</span>
                            <div style={{ fontSize: "0.75rem", color: "var(--color-secondary)", fontWeight: "700" }}>
                              {req.pillar.pillar_code || "Pillar"}
                            </div>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontStyle: "italic" }}>
                            Unassigned
                          </span>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: "700", color: "var(--color-text)" }}>
                        ₹{req.final_amount || req.amount || req.estimated_price || "0"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{ 
                          display: "inline-flex", 
                          alignItems: "center", 
                          gap: "4px",
                          padding: "4px 10px", 
                          borderRadius: "12px", 
                          fontSize: "0.75rem", 
                          fontWeight: "700",
                          background: badge.bg,
                          color: badge.color
                        }}>
                          <BadgeIcon size={12} />
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button 
                          onClick={() => setSelectedRequest(req)} 
                          className="btn btn-outline btn-sm"
                          style={{ padding: "4px 10px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          <Eye size={13} /> View & Manage
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Request Details & Actions Modal */}
      {selectedRequest && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1100,
          padding: "var(--space-4)"
        }}>
          <div style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-lg)",
            width: "100%",
            maxWidth: "580px",
            maxHeight: "90vh",
            overflowY: "auto",
            padding: "var(--space-5)",
            boxShadow: "var(--shadow-xl)",
            border: "1px solid var(--color-border)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--color-secondary)", fontWeight: "700" }}>
                  SERVICE REQUEST
                </span>
                <h2 style={{ fontSize: "1.3rem", fontWeight: "800", color: "var(--color-text)", marginTop: "2px" }}>
                  {selectedRequest.service_name || "General Service"}
                </h2>
                <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                  Order: #{selectedRequest.order_code || selectedRequest.id}
                </div>
              </div>
              <button 
                onClick={() => setSelectedRequest(null)}
                style={{ background: "transparent", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "var(--color-text-secondary)" }}
              >
                ✕
              </button>
            </div>

            {/* Customer & Location */}
            <div style={{ background: "var(--color-surface-hover)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", marginBottom: "var(--space-4)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                <User size={16} color="var(--color-primary)" />
                <span style={{ fontWeight: "700" }}>{selectedRequest.customer_name || "Guest Customer"}</span>
                {selectedRequest.customer_phone && <span style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>({selectedRequest.customer_phone})</span>}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                <MapPin size={16} color="var(--color-secondary)" />
                <span>{selectedRequest.customer_address || selectedRequest.location_name || "Chennai, Tamil Nadu"}</span>
              </div>
            </div>

            {/* Assignment & Reassignment */}
            <div style={{ marginBottom: "var(--space-4)", background: "var(--color-surface-hover)", padding: "var(--space-3)", borderRadius: "var(--radius-md)" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "8px" }}>
                Assigned Pillar:
              </label>
              <div style={{ display: "flex", gap: "8px" }}>
                <input 
                  type="text" 
                  className="form-input" 
                  placeholder="Enter Pillar UUID..." 
                  style={{ flex: 1 }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      handleStatusChange(selectedRequest.id, 'assigned');
                      // In a real app we'd update pillar_id in DB here.
                      alert("Assignment updated (Requires Pillar ID logic implementation).");
                    }
                  }}
                />
                <button className="btn btn-primary" onClick={() => alert("Assigned")}>Assign</button>
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
                Current: {selectedRequest.pillar ? `${selectedRequest.pillar.full_name} (${selectedRequest.pillar.pillar_code})` : "None"}
              </div>
            </div>

            {/* Status Transition Buttons */}
            <div style={{ marginBottom: "var(--space-4)" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "8px" }}>
                Update Request Status:
              </label>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                {["pending", "assigned", "in_progress", "completed", "cancelled"].map((st) => (
                  <button
                    key={st}
                    disabled={statusUpdating || selectedRequest.status === st}
                    onClick={() => handleStatusChange(selectedRequest.id, st)}
                    style={{
                      padding: "6px 12px",
                      borderRadius: "var(--radius-md)",
                      fontSize: "0.8rem",
                      fontWeight: "700",
                      cursor: selectedRequest.status === st ? "default" : "pointer",
                      opacity: selectedRequest.status === st ? 1 : 0.7,
                      border: selectedRequest.status === st ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                      background: selectedRequest.status === st ? "var(--color-primary)" : "var(--color-surface)",
                      color: selectedRequest.status === st ? "white" : "var(--color-text)",
                      textTransform: "capitalize"
                    }}
                  >
                    {st.replace("_", " ")}
                  </button>
                ))}
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-5)" }}>
              <button className="btn btn-outline" onClick={() => setSelectedRequest(null)}>
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
