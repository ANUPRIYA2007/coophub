import React, { useState, useEffect } from "react";
import { DollarSign, Search, CheckCircle, RefreshCw } from "lucide-react";
import { adminService } from "../services/adminService";

export default function AdminFinance() {
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchPayouts();
  }, [filterStatus]);

  const fetchPayouts = async () => {
    setLoading(true);
    const data = await adminService.getPayoutRequests(filterStatus);
    setPayouts(data);
    setLoading(false);
  };

  const handleProcessPayout = async (id) => {
    if (window.confirm("Mark this payout as completed?")) {
      setUpdating(true);
      const res = await adminService.updatePayoutStatus(id, "completed");
      if (res.success) {
        fetchPayouts();
      } else {
        alert("Failed to update payout: " + res.error);
      }
      setUpdating(false);
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-5)" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
            Financials & Payouts
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Manage pillar payout requests and cooperative finances.
          </p>
        </div>
        <button onClick={fetchPayouts} className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "8px" }} disabled={loading}>
          <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
        <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--color-border)", display: "flex", gap: "var(--space-3)" }}>
          {["all", "pending", "completed", "failed"].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status)}
              style={{
                padding: "6px 14px", borderRadius: "20px", fontSize: "0.85rem",
                fontWeight: filterStatus === status ? "700" : "500",
                background: filterStatus === status ? "var(--color-primary)" : "var(--color-surface-hover)",
                color: filterStatus === status ? "white" : "var(--color-text-secondary)",
                border: "none", cursor: "pointer", textTransform: "capitalize",
              }}
            >
              {status}
            </button>
          ))}
        </div>

        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: "var(--space-6)", textAlign: "center" }}><div className="spinner"></div></div>
          ) : payouts.length === 0 ? (
            <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-text-secondary)" }}>No payout requests found.</div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)" }}>ID</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)" }}>Pillar</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)" }}>Bank Details</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)" }}>Amount</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", color: "var(--color-text-secondary)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {payouts.map(req => (
                  <tr key={req.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: "700" }}>{req.id.substring(0,8)}</td>
                    <td style={{ padding: "12px 16px", fontWeight: "600" }}>{req.pillar?.full_name} ({req.pillar?.pillar_code})</td>
                    <td style={{ padding: "12px 16px", fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                      Acc: {req.pillar?.bank_account_number || "N/A"}<br/>IFSC: {req.pillar?.bank_ifsc || "N/A"}
                    </td>
                    <td style={{ padding: "12px 16px", fontWeight: "700", color: "var(--color-primary)" }}>₹{req.amount}</td>
                    <td style={{ padding: "12px 16px", textTransform: "capitalize" }}>
                      <span style={{ 
                        background: req.status === 'completed' ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                        color: req.status === 'completed' ? 'var(--color-success)' : 'var(--color-warning)',
                        padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "bold"
                      }}>
                        {req.status}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      {req.status === 'pending' && (
                        <button onClick={() => handleProcessPayout(req.id)} className="btn btn-primary btn-sm" disabled={updating}>
                          Process
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
