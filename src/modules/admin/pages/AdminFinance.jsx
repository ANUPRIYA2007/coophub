import React, { useState, useEffect } from "react";
import { 
  DollarSign, Search, CheckCircle, RefreshCw, FileText, CreditCard, 
  ArrowUpRight, TrendingUp, ShieldCheck, Clock, AlertTriangle, XCircle, RotateCcw
} from "lucide-react";
import { adminService } from "../services/adminService";
import { supabase } from "../../../lib/supabase";

export default function AdminFinance() {
  const [activeTab, setActiveTab] = useState("invoices"); // 'invoices' | 'payouts' | 'refunds'
  const [financeOverview, setFinanceOverview] = useState({
    totalGmv: 0,
    settledRevenue: 0,
    platformCommission: 0,
    pillarEarnings: 0,
    totalRefunded: 0,
    pendingRefundsCount: 0,
    invoicesCount: 0,
    paymentsCount: 0,
    payoutsCount: 0,
    refundsCount: 0,
    invoices: [],
    payments: [],
    payouts: [],
    refunds: [],
    anomalies: []
  });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchFinancialData();

    // Supabase Realtime live sync on invoices, payments, refunds & payouts
    const channel = supabase
      .channel(`admin-finance-live-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => fetchFinancialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => fetchFinancialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payout_requests' }, () => fetchFinancialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'refunds' }, () => fetchFinancialData())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [filterStatus]);

  const fetchFinancialData = async () => {
    setLoading(true);
    try {
      const data = await adminService.getFinancialOverview();
      setFinanceOverview(data);
    } catch (err) {
      console.warn("fetchFinancialData error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthorizePayout = async (id) => {
    if (window.confirm("Authorize this payout in internal ledger? (Note: External banking disbursement is not configured)")) {
      setUpdating(true);
      const res = await adminService.updatePayoutStatus(id, "completed", "", "Manual admin settlement authorized");
      if (res.success) {
        fetchFinancialData();
      } else {
        alert("Failed to update payout: " + res.error);
      }
      setUpdating(false);
    }
  };

  const handleRejectPayout = async (id) => {
    const reason = prompt("Enter reason for rejecting this payout request:", "Bank details mismatched or account KYC incomplete");
    if (!reason) return;
    setUpdating(true);
    const res = await adminService.updatePayoutStatus(id, "rejected", reason, "Rejected by Admin");
    if (res.success) {
      fetchFinancialData();
    } else {
      alert("Failed to reject payout: " + res.error);
    }
    setUpdating(false);
  };

  const handleProcessRefund = async (id) => {
    if (window.confirm("Approve and record this refund as settled in the ledger?")) {
      setUpdating(true);
      const res = await adminService.processRefund(id, "processed", "Approved & settled by Admin");
      if (res.success) {
        fetchFinancialData();
      } else {
        alert("Failed to process refund: " + res.error);
      }
      setUpdating(false);
    }
  };

  const filteredInvoices = (financeOverview.invoices || []).filter(i => {
    if (filterStatus === "all") return true;
    return (i.invoice_status || "pending").toLowerCase() === filterStatus.toLowerCase();
  });

  const filteredPayouts = (financeOverview.payouts || []).filter(p => {
    if (filterStatus === "all") return true;
    return (p.status || "pending").toLowerCase() === filterStatus.toLowerCase();
  });

  const filteredRefunds = (financeOverview.refunds || []).filter(r => {
    if (filterStatus === "all") return true;
    return (r.status || "pending").toLowerCase() === filterStatus.toLowerCase();
  });

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-5)", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ 
              background: "rgba(245, 124, 32, 0.15)", color: "var(--color-secondary)", 
              fontSize: "0.75rem", fontWeight: "800", padding: "2px 8px", borderRadius: "10px", textTransform: "uppercase" 
            }}>
              Cooperative Treasury Ledger
            </span>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>• Single Source of Truth</span>
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--color-text)", margin: 0 }}>
            Financial Operations & Settlement Ledger
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", marginTop: "4px" }}>
            Real-time audit of gross merchandise volume, cooperative platform fees, pillar earnings, and payout disbursements.
          </p>
        </div>
        <button onClick={fetchFinancialData} className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "8px" }} disabled={loading}>
          <RefreshCw size={16} className={loading ? "spin" : ""} /> Refresh Ledger
        </button>
      </div>

      {/* 4 Financial KPI Summary Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
        <div style={{ background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Total Gross Volume (GMV)</span>
            <DollarSign size={18} color="var(--color-primary)" />
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)" }}>
            ₹{financeOverview.totalGmv.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
            {financeOverview.invoicesCount} Invoices generated
          </div>
        </div>

        <div style={{ background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Coop Platform Fee (8.5%)</span>
            <ShieldCheck size={18} color="#10B981" />
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#10B981" }}>
            ₹{financeOverview.platformCommission.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Allocated to welfare fund & operations
          </div>
        </div>

        <div style={{ background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Pillar Net Earnings (91.5%)</span>
            <TrendingUp size={18} color="var(--color-secondary)" />
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-secondary)" }}>
            ₹{financeOverview.pillarEarnings.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
            Direct cooperative payout share
          </div>
        </div>

        <div style={{ background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Settled Payments</span>
            <CreditCard size={18} color="#8B5CF6" />
          </div>
          <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#8B5CF6" }}>
            ₹{financeOverview.settledRevenue.toLocaleString()}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "4px" }}>
            {financeOverview.paymentsCount} Transactions confirmed
          </div>
        </div>
      </div>

      {/* Reconciliation & Anomaly Banner */}
      {financeOverview.anomalies && financeOverview.anomalies.length > 0 && (
        <div style={{
          background: "rgba(239, 68, 68, 0.08)",
          border: "1.5px solid #EF4444",
          borderRadius: "12px",
          padding: "14px 18px",
          marginBottom: "var(--space-5)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#EF4444", fontWeight: "800", marginBottom: "6px" }}>
            <AlertTriangle size={18} />
            <span>Financial Reconciliation Anomalies Detected ({financeOverview.anomalies.length})</span>
          </div>
          <ul style={{ margin: 0, paddingLeft: "20px", fontSize: "0.82rem", color: "var(--color-text)" }}>
            {financeOverview.anomalies.map((a, idx) => (
              <li key={idx} style={{ marginBottom: "2px" }}>
                <strong>[{a.severity}]</strong> {a.message}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Tabs Switcher */}
      <div style={{ display: "flex", gap: "10px", borderBottom: "1px solid var(--color-border)", paddingBottom: "10px" }}>
        <button
          onClick={() => { setActiveTab("invoices"); setFilterStatus("all"); }}
          className={`btn ${activeTab === "invoices" ? "btn-primary" : "btn-outline"}`}
          style={{ fontSize: "0.85rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <FileText size={16} /> Official Invoices ({financeOverview.invoicesCount})
        </button>
        <button
          onClick={() => { setActiveTab("payouts"); setFilterStatus("all"); }}
          className={`btn ${activeTab === "payouts" ? "btn-primary" : "btn-outline"}`}
          style={{ fontSize: "0.85rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <DollarSign size={16} /> Pillar Payout Requests ({financeOverview.payoutsCount})
        </button>
        <button
          onClick={() => { setActiveTab("refunds"); setFilterStatus("all"); }}
          className={`btn ${activeTab === "refunds" ? "btn-primary" : "btn-outline"}`}
          style={{ fontSize: "0.85rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "6px" }}
        >
          <RotateCcw size={16} /> Refunds & Cancellations ({financeOverview.refundsCount})
        </button>
      </div>

      {/* Content Table Container */}
      <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
        <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--color-border)", display: "flex", gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap", justifyContent: "space-between" }}>
          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "center" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-text-secondary)" }}>Filter:</span>
            {["all", "pending", "paid", "completed", "processed", "rejected"].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={`btn btn-xs ${filterStatus === status ? "btn-primary" : "btn-outline"}`}
                style={{ textTransform: "capitalize", fontSize: "0.75rem" }}
              >
                {status}
              </button>
            ))}
          </div>

          {(activeTab === "payouts" || activeTab === "refunds") && (
            <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontStyle: "italic" }}>
              ⚠️ External bank gateway disbursement: <strong>MANUAL SETTLEMENT (API NOT CONFIGURED)</strong>
            </span>
          )}
        </div>

        <div style={{ overflowX: "auto" }}>
          {activeTab === "invoices" ? (
            filteredInvoices.length === 0 ? (
              <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-text-secondary)" }}>
                No invoices found matching criteria.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)" }}>Invoice No</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)" }}>Base Amount</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)" }}>Extra Charges</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)" }}>GST (18%)</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)" }}>Total Amount</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)" }}>Status</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", color: "var(--color-text-secondary)" }}>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map(inv => (
                    <tr key={inv.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "12px 16px", fontWeight: "700" }}>{inv.invoice_number}</td>
                      <td style={{ padding: "12px 16px" }}>₹{inv.base_amount}</td>
                      <td style={{ padding: "12px 16px", color: inv.extra_charges > 0 ? "var(--color-secondary)" : "inherit" }}>
                        ₹{inv.extra_charges}
                      </td>
                      <td style={{ padding: "12px 16px" }}>₹{inv.tax_amount}</td>
                      <td style={{ padding: "12px 16px", fontWeight: "800", color: "var(--color-success)" }}>₹{inv.total_amount}</td>
                      <td style={{ padding: "12px 16px", textTransform: "capitalize" }}>
                        <span style={{ 
                          background: inv.invoice_status === 'paid' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: inv.invoice_status === 'paid' ? '#10B981' : '#F59E0B',
                          padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "bold"
                        }}>
                          {inv.invoice_status || 'pending'}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", color: "var(--color-text-secondary)", fontSize: "0.8rem" }}>
                        {new Date(inv.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : activeTab === "payouts" ? (
            filteredPayouts.length === 0 ? (
              <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-text-secondary)" }}>
                No payout requests found.
              </div>
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
                  {filteredPayouts.map(req => (
                    <tr key={req.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "12px 16px", fontWeight: "700" }}>{req.id.substring(0,8)}</td>
                      <td style={{ padding: "12px 16px", fontWeight: "600" }}>{req.pillar?.full_name || "Coop Pillar"} ({req.pillar?.pillar_code || "PIL"})</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                        Bank: {req.pillar?.bank_name || "SBI"} • Acc: {req.pillar?.bank_account_number || "••••1234"}<br/>
                        IFSC: {req.pillar?.bank_ifsc || "SBIN0000842"}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: "700", color: "var(--color-primary)" }}>₹{req.amount}</td>
                      <td style={{ padding: "12px 16px", textTransform: "capitalize" }}>
                        <span style={{ 
                          background: req.status === 'completed' ? 'rgba(16, 185, 129, 0.15)' : req.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: req.status === 'completed' ? '#10B981' : req.status === 'rejected' ? '#EF4444' : '#F59E0B',
                          padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "bold"
                        }}>
                          {req.status}
                        </span>
                        {req.rejection_reason && (
                          <div style={{ fontSize: "0.72rem", color: "#EF4444", marginTop: "2px" }}>
                            {req.rejection_reason}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", whiteSpace: "nowrap" }}>
                        {req.status === 'pending' && (
                          <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                            <button
                              onClick={() => handleRejectPayout(req.id)}
                              className="btn btn-xs btn-outline"
                              disabled={updating}
                              style={{ borderColor: "#EF4444", color: "#EF4444", fontSize: "0.75rem" }}
                            >
                              Reject
                            </button>
                            <button
                              onClick={() => handleAuthorizePayout(req.id)}
                              className="btn btn-xs btn-primary"
                              disabled={updating}
                              style={{ fontSize: "0.75rem" }}
                            >
                              Authorize Settlement
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            filteredRefunds.length === 0 ? (
              <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-text-secondary)" }}>
                No refund requests found.
              </div>
            ) : (
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
                <thead>
                  <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)" }}>Refund ID</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)" }}>Order / Txn</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)" }}>Gross Amount</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)" }}>Cancellation Fee</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)" }}>Net Refund</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)" }}>Reason</th>
                    <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)" }}>Status</th>
                    <th style={{ padding: "12px 16px", textAlign: "right", color: "var(--color-text-secondary)" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredRefunds.map(r => (
                    <tr key={r.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "12px 16px", fontWeight: "700" }}>{r.id.substring(0,8)}</td>
                      <td style={{ padding: "12px 16px", fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                        Order: {r.request_id ? r.request_id.substring(0,8) : "N/A"}<br/>
                        Txn: {r.payment?.transaction_ref || "N/A"}
                      </td>
                      <td style={{ padding: "12px 16px" }}>₹{r.amount}</td>
                      <td style={{ padding: "12px 16px", color: r.cancellation_fee > 0 ? "#EF4444" : "inherit" }}>
                        {r.cancellation_fee > 0 ? `-₹${r.cancellation_fee}` : "₹0"}
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: "800", color: "#10B981" }}>
                        ₹{r.net_refund_amount}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "0.82rem", maxWidth: "200px" }}>
                        {r.reason}
                      </td>
                      <td style={{ padding: "12px 16px", textTransform: "capitalize" }}>
                        <span style={{ 
                          background: r.status === 'processed' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                          color: r.status === 'processed' ? '#10B981' : '#F59E0B',
                          padding: "2px 8px", borderRadius: "10px", fontSize: "0.75rem", fontWeight: "bold"
                        }}>
                          {r.status}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        {r.status === 'pending' && (
                          <button
                            onClick={() => handleProcessRefund(r.id)}
                            className="btn btn-xs btn-primary"
                            disabled={updating}
                            style={{ fontSize: "0.75rem", background: "#10B981" }}
                          >
                            Settle Refund
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>
    </div>
  );
}
