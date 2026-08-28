import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import { HelpCircle, Search, Filter, CheckCircle, Clock, AlertCircle, MessageSquare, User, RefreshCw } from "lucide-react";

export default function AdminSupport() {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [adminReply, setAdminReply] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    fetchTickets();
  }, [filterStatus]);

  const fetchTickets = async () => {
    setLoading(true);
    const data = await adminService.getSupportTickets(filterStatus);
    setTickets(data);
    setLoading(false);
  };

  const handleResolveTicket = async (ticketId, resolutionStatus = "resolved") => {
    setActionLoading(true);
    const res = await adminService.updateTicketStatus(
      ticketId, 
      resolutionStatus, 
      adminReply || "Issue reviewed and resolved by Cooperative Admin."
    );

    if (res.success) {
      setTickets(prev => prev.map(t => t.id === ticketId ? { ...t, status: resolutionStatus, admin_response: adminReply } : t));
      setSelectedTicket(null);
      setAdminReply("");
    } else {
      alert("Failed to update ticket: " + res.error);
    }
    setActionLoading(false);
  };

  const filteredTickets = tickets.filter(t => {
    const q = searchQuery.toLowerCase();
    const sub = (t.subject || t.issue_type || "").toLowerCase();
    const desc = (t.description || "").toLowerCase();
    const pillar = (t.pillar?.full_name || "").toLowerCase();
    return sub.includes(q) || desc.includes(q) || pillar.includes(q);
  });

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-5)" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
            Support & Helpdesk Management
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Resolve technical, payment, and booking disputes submitted by Cooperative Pillars and customers.
          </p>
        </div>
        <button 
          onClick={fetchTickets} 
          className="btn btn-outline" 
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
          disabled={loading}
        >
          <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh Tickets
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
        {/* Toolbar */}
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
          <div style={{ display: "flex", gap: "6px" }}>
            {["all", "open", "in_progress", "resolved"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  fontWeight: filterStatus === st ? "700" : "500",
                  background: filterStatus === st ? "var(--color-primary)" : "var(--color-surface-hover)",
                  color: filterStatus === st ? "white" : "var(--color-text-secondary)",
                  border: "none",
                  cursor: "pointer",
                  textTransform: "capitalize",
                  transition: "all 0.2s"
                }}
              >
                {st.replace("_", " ")}
              </button>
            ))}
          </div>

          <div className="input-wrapper" style={{ width: "280px" }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search subject, pillar, ticket ID..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={16} className="input-icon" />
          </div>
        </div>

        {/* Tickets Table */}
        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: "var(--space-6)", textAlign: "center" }}>
              <div className="spinner"></div>
            </div>
          ) : filteredTickets.length === 0 ? (
            <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-text-secondary)" }}>
              <HelpCircle size={36} style={{ opacity: 0.3, margin: "0 auto var(--space-3)" }} />
              <p style={{ fontWeight: "600" }}>No support tickets found</p>
              <span style={{ fontSize: "0.85rem" }}>Tickets opened by Pillars from their mobile app will show up here.</span>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Ticket ID</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Submitted By</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Subject / Category</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Priority</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", color: "var(--color-text-secondary)", fontWeight: "600" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredTickets.map((t) => (
                  <tr key={t.id} style={{ borderBottom: "1px solid var(--color-border)" }} className="hover-row">
                    <td style={{ padding: "12px 16px", fontWeight: "700", color: "var(--color-primary)" }}>
                      #{t.id.substring(0, 8).toUpperCase()}
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: "600" }}>{t.pillar?.full_name || t.user_name || "Pillar Member"}</div>
                      <div style={{ fontSize: "0.75rem", color: "var(--color-secondary)", fontWeight: "700" }}>{t.pillar?.pillar_code || "PIL"}</div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <div style={{ fontWeight: "600" }}>{t.subject || t.issue_type || "General Inquiry"}</div>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", maxWidth: "260px" }}>
                        {t.description}
                      </div>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "3px 8px",
                        borderRadius: "10px",
                        fontSize: "0.7rem",
                        fontWeight: "700",
                        textTransform: "uppercase",
                        background: t.priority === 'urgent' || t.priority === 'high' ? 'var(--color-error-light)' : 'var(--color-surface-hover)',
                        color: t.priority === 'urgent' || t.priority === 'high' ? 'var(--color-error)' : 'var(--color-text)'
                      }}>
                        {t.priority || "Medium"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{
                        padding: "3px 10px",
                        borderRadius: "12px",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        textTransform: "capitalize",
                        background: t.status === 'resolved' ? 'var(--color-success-light)' : t.status === 'in_progress' ? 'rgba(59,130,246,0.15)' : 'var(--color-warning-light)',
                        color: t.status === 'resolved' ? 'var(--color-success)' : t.status === 'in_progress' ? '#3B82F6' : 'var(--color-warning)'
                      }}>
                        {t.status || "Open"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <button 
                        onClick={() => setSelectedTicket(t)} 
                        className="btn btn-outline btn-sm"
                        style={{ padding: "4px 10px" }}
                      >
                        Respond & Resolve
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Ticket Response Modal */}
      {selectedTicket && (
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
            maxWidth: "540px",
            padding: "var(--space-5)",
            boxShadow: "var(--shadow-xl)",
            border: "1px solid var(--color-border)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
              <div>
                <span style={{ fontSize: "0.8rem", color: "var(--color-secondary)", fontWeight: "700" }}>SUPPORT TICKET</span>
                <h3 style={{ margin: "2px 0 0 0", fontSize: "1.2rem", fontWeight: "800" }}>
                  {selectedTicket.subject || "Support Inquiry"}
                </h3>
              </div>
              <button 
                onClick={() => setSelectedTicket(null)}
                style={{ background: "transparent", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "var(--color-text-secondary)" }}
              >
                ✕
              </button>
            </div>

            <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "var(--radius-md)", marginBottom: "var(--space-4)" }}>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                Submitted by: <strong style={{ color: "var(--color-text)" }}>{selectedTicket.pillar?.full_name || "Pillar"}</strong>
              </div>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text)", lineHeight: "1.4" }}>
                {selectedTicket.description}
              </p>
            </div>

            <div style={{ marginBottom: "var(--space-4)" }}>
              <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "6px" }}>
                Admin Resolution / Response Note:
              </label>
              <textarea
                className="form-input"
                rows={3}
                placeholder="Type resolution instructions or response..."
                value={adminReply}
                onChange={(e) => setAdminReply(e.target.value)}
                style={{ resize: "vertical" }}
              />
            </div>

            {/* Disciplinary & Compliance Actions if ticket involves a Pillar */}
            {selectedTicket.pillar_id && (
              <div style={{ 
                background: "rgba(245, 158, 11, 0.1)", border: "1px solid rgba(245, 158, 11, 0.3)", 
                padding: "10px 14px", borderRadius: "var(--radius-md)", marginBottom: "var(--space-4)",
                display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px"
              }}>
                <div>
                  <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#F59E0B", textTransform: "uppercase" }}>
                    DISCIPLINARY ACTIONS (PILLAR COMPLIANCE)
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--color-text)" }}>
                    Technician: <strong>{selectedTicket.pillar?.full_name || selectedTicket.pillar_name || "Assigned Pillar"}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "6px" }}>
                  <button
                    type="button"
                    onClick={async () => {
                      const reason = prompt("Enter formal warning reason to dispatch to technician:", "Service complaint received from customer regarding quality standards.");
                      if (reason) {
                        setActionLoading(true);
                        await adminService.issuePillarWarning(selectedTicket.pillar_id, {
                          reason,
                          severity: "Official Warning",
                          ticketId: selectedTicket.id
                        });
                        alert("⚠️ Formal warning issued and dispatched to technician.");
                        setActionLoading(false);
                      }
                    }}
                    className="btn btn-sm"
                    style={{ background: "rgba(245, 158, 11, 0.2)", color: "#F59E0B", border: "1px solid #F59E0B", fontSize: "0.75rem", fontWeight: "700" }}
                  >
                    ⚠️ Issue Formal Warning
                  </button>

                  <button
                    type="button"
                    onClick={async () => {
                      const reason = prompt("Enter temporary suspension justification:", "Multiple unresolved customer disputes under investigation.");
                      if (reason) {
                        setActionLoading(true);
                        await adminService.suspendPillar(selectedTicket.pillar_id, reason);
                        alert("🚫 Technician account has been suspended.");
                        setActionLoading(false);
                      }
                    }}
                    className="btn btn-sm"
                    style={{ background: "rgba(239, 68, 68, 0.15)", color: "#EF4444", border: "1px solid #EF4444", fontSize: "0.75rem", fontWeight: "700" }}
                  >
                    🚫 Suspend Pillar
                  </button>
                </div>
              </div>
            )}

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
              <button className="btn btn-outline" onClick={() => setSelectedTicket(null)}>
                Cancel
              </button>
              <button 
                className="btn btn-primary" 
                disabled={actionLoading}
                onClick={() => handleResolveTicket(selectedTicket.id, "resolved")}
              >
                {actionLoading ? "Updating..." : "Mark as Resolved"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
