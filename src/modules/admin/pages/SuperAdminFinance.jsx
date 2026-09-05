import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import { supabase } from "../../../lib/supabase";
import { 
  DollarSign, Search, CheckCircle, RefreshCw, FileText, CreditCard, 
  TrendingUp, ShieldCheck, Clock, AlertTriangle, XCircle, RotateCcw,
  Globe, Filter, Download
} from "lucide-react";
import { exportToCSV, exportToExcel, exportToPDF, copyToClipboard } from "../../../utils/analyticsExport";

export default function SuperAdminFinance() {
  const [activeTab, setActiveTab] = useState("overview"); // 'overview' | 'invoices' | 'payouts' | 'refunds'
  const [financeOverview, setFinanceOverview] = useState({
    totalGmv: 0, settledRevenue: 0, platformCommission: 0, pillarEarnings: 0,
    totalRefunded: 0, pendingRefundsCount: 0,
    invoicesCount: 0, paymentsCount: 0, payoutsCount: 0, refundsCount: 0,
    invoices: [], payments: [], payouts: [], refunds: [], anomalies: []
  });
  const [loading, setLoading] = useState(true);
  const [geoFilter, setGeoFilter] = useState("national");
  const [exportOpen, setExportOpen] = useState(false);

  useEffect(() => {
    fetchFinancialData();

    const channel = supabase
      .channel(`sa-finance-live-${Date.now()}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'invoices' }, () => fetchFinancialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, () => fetchFinancialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payout_requests' }, () => fetchFinancialData())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'refunds' }, () => fetchFinancialData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

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

  const fo = financeOverview;
  const fmt = (val) => val > 0 ? `₹${val.toLocaleString('en-IN', { minimumFractionDigits: 2 })}` : "₹0.00";

  // Pending payouts
  const pendingPayouts = (fo.payouts || []).filter(p => p.status === 'pending');
  const completedPayouts = (fo.payouts || []).filter(p => p.status === 'completed');

  const handleExport = (type) => {
    const rows = (fo.invoices || []).map(inv => ({
      ID: inv.id?.slice(0, 12),
      Amount: inv.total_amount,
      Status: inv.status,
      Date: inv.created_at
    }));
    if (type === 'csv') exportToCSV("COOP_HUB_Finance_National", rows);
    if (type === 'xlsx') exportToExcel("COOP_HUB_Finance_National", rows);
    if (type === 'pdf') exportToPDF("National Financial Audit Report", "finance-data-container");
    if (type === 'clipboard') copyToClipboard(rows).then(() => alert("Copied to clipboard!"));
    setExportOpen(false);
  };

  const tabs = [
    { id: "overview", label: "Financial Overview" },
    { id: "invoices", label: `Invoices (${fo.invoicesCount})` },
    { id: "payouts", label: `Payouts (${fo.payoutsCount})` },
    { id: "refunds", label: `Refunds (${fo.refundsCount})` }
  ];

  return (
    <div className="fade-in" id="finance-data-container">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-4)", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)", margin: 0, marginBottom: "var(--space-2)" }}>
            National Financial Audit & Settlement Ledger
          </h1>
          <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
            Statutory 91.5% Pillar / 8.5% Cooperative financial oversight with real-time reconciliation.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-color)", border: "1px solid var(--color-border)", padding: "0 12px", borderRadius: "var(--radius-md)" }}>
            <Globe size={14} color="var(--color-text-muted)" />
            <select value={geoFilter} onChange={(e) => setGeoFilter(e.target.value)} style={{ border: "none", background: "transparent", color: "var(--color-text)", fontWeight: "600", outline: "none", padding: "8px 0", fontSize: "0.85rem" }}>
              <option value="national">National</option>
              <option value="zone_south">South Zone</option>
              <option value="zone_north">North Zone</option>
            </select>
          </div>
          <div style={{ position: "relative" }}>
            <button onClick={() => setExportOpen(!exportOpen)} className="btn btn-primary" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}>
              <Download size={14} /> Export
            </button>
            {exportOpen && (
              <div style={{ position: "absolute", right: 0, top: "40px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-lg)", padding: "6px", zIndex: 50, minWidth: "160px" }}>
                <button onClick={() => handleExport('csv')} style={exportBtnStyle}>CSV</button>
                <button onClick={() => handleExport('xlsx')} style={exportBtnStyle}>Excel (.xlsx)</button>
                <button onClick={() => handleExport('pdf')} style={exportBtnStyle}>PDF Report</button>
                <button onClick={() => handleExport('clipboard')} style={exportBtnStyle}>Clipboard</button>
              </div>
            )}
          </div>
          <button onClick={fetchFinancialData} className="btn" style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-color)", border: "1px solid var(--color-border)" }}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Top-Level Financial KPIs */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
        <FinKpi label="Gross Merchandise Value" value={fmt(fo.totalGmv)} sub={`${fo.invoicesCount} invoices`} color="var(--color-secondary)" />
        <FinKpi label="Pillar Earnings (91.5%)" value={fmt(fo.pillarEarnings)} sub="Direct pillar payouts" color="var(--color-success)" />
        <FinKpi label="Cooperative Share (8.5%)" value={fmt(fo.platformCommission)} sub="Reserve fund" color="var(--color-primary)" />
        <FinKpi label="Settled Revenue" value={fmt(fo.settledRevenue)} sub={`${fo.paymentsCount} payments`} color="#8B5CF6" />
        <FinKpi label="Total Refunded" value={fmt(fo.totalRefunded)} sub={`${fo.pendingRefundsCount} pending`} color="var(--color-error)" />
      </div>

      {/* Anomaly Alerts */}
      {fo.anomalies && fo.anomalies.length > 0 && (
        <div style={{ marginBottom: "var(--space-4)" }}>
          {fo.anomalies.map((a, i) => (
            <div key={i} style={{ padding: "12px 16px", marginBottom: "8px", borderRadius: "var(--radius-md)", background: a.severity === 'CRITICAL' ? "var(--color-error-light)" : "rgba(245,158,11,0.1)", border: `1px solid ${a.severity === 'CRITICAL' ? 'var(--color-error)' : '#D97706'}`, display: "flex", alignItems: "center", gap: "10px" }}>
              <AlertTriangle size={16} color={a.severity === 'CRITICAL' ? "var(--color-error)" : "#D97706"} />
              <div>
                <span style={{ fontWeight: "700", fontSize: "0.85rem", color: "var(--color-text)" }}>[{a.type}]</span>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginLeft: "8px" }}>{a.message}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "var(--space-4)", background: "var(--bg-color)", padding: "4px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "8px 16px", borderRadius: "var(--radius-md)", border: "none", fontSize: "0.85rem", fontWeight: "700", cursor: "pointer",
            background: activeTab === t.id ? "var(--color-primary)" : "transparent",
            color: activeTab === t.id ? "#fff" : "var(--color-text-secondary)"
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px" }}><div className="spinner"></div></div>
        ) : activeTab === "overview" ? (
          <div style={{ padding: "var(--space-4)" }}>
            <h3 style={{ margin: "0 0 16px", fontWeight: "700" }}>Financial Summary</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
              <div>
                <h4 style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: "8px" }}>Revenue Breakdown</h4>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "10px 0", fontWeight: "600" }}>Gross Merchandise Value</td>
                      <td style={{ padding: "10px 0", textAlign: "right", fontWeight: "800" }}>{fmt(fo.totalGmv)}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "10px 0" }}>Settled Revenue (Payments)</td>
                      <td style={{ padding: "10px 0", textAlign: "right" }}>{fmt(fo.settledRevenue)}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "10px 0", color: "var(--color-success)" }}>Pillar Share (91.5%)</td>
                      <td style={{ padding: "10px 0", textAlign: "right", fontWeight: "700", color: "var(--color-success)" }}>{fmt(fo.pillarEarnings)}</td>
                    </tr>
                    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "10px 0", color: "var(--color-primary)" }}>Cooperative Share (8.5%)</td>
                      <td style={{ padding: "10px 0", textAlign: "right", fontWeight: "700", color: "var(--color-primary)" }}>{fmt(fo.platformCommission)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: "10px 0", color: "var(--color-error)" }}>Total Refunded</td>
                      <td style={{ padding: "10px 0", textAlign: "right", fontWeight: "700", color: "var(--color-error)" }}>{fmt(fo.totalRefunded)}</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h4 style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: "8px" }}>Transaction Counts</h4>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <tbody>
                    <tr style={{ borderBottom: "1px solid var(--color-border)" }}><td style={{ padding: "10px 0" }}>Invoices</td><td style={{ padding: "10px 0", textAlign: "right", fontWeight: "800" }}>{fo.invoicesCount}</td></tr>
                    <tr style={{ borderBottom: "1px solid var(--color-border)" }}><td style={{ padding: "10px 0" }}>Payments</td><td style={{ padding: "10px 0", textAlign: "right", fontWeight: "800" }}>{fo.paymentsCount}</td></tr>
                    <tr style={{ borderBottom: "1px solid var(--color-border)" }}><td style={{ padding: "10px 0" }}>Payout Requests</td><td style={{ padding: "10px 0", textAlign: "right", fontWeight: "800" }}>{fo.payoutsCount}</td></tr>
                    <tr><td style={{ padding: "10px 0" }}>Refund Records</td><td style={{ padding: "10px 0", textAlign: "right", fontWeight: "800" }}>{fo.refundsCount}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                  {activeTab === "invoices" && <><th style={thS}>Invoice ID</th><th style={thS}>Amount</th><th style={thS}>Status</th><th style={thS}>Date</th></>}
                  {activeTab === "payouts" && <><th style={thS}>Pillar</th><th style={thS}>Amount</th><th style={thS}>Status</th><th style={thS}>Requested</th></>}
                  {activeTab === "refunds" && <><th style={thS}>Refund ID</th><th style={thS}>Amount</th><th style={thS}>Status</th><th style={thS}>Date</th></>}
                </tr>
              </thead>
              <tbody>
                {(activeTab === "invoices" ? fo.invoices : activeTab === "payouts" ? fo.payouts : fo.refunds).length === 0 ? (
                  <tr><td colSpan={4} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>
                    <FileText size={40} style={{ opacity: 0.2, margin: "0 auto 12px" }} />
                    <p style={{ fontWeight: "600" }}>No {activeTab} records found</p>
                  </td></tr>
                ) : (
                  (activeTab === "invoices" ? fo.invoices : activeTab === "payouts" ? fo.payouts : fo.refunds).map((rec) => (
                    <tr key={rec.id} style={{ borderBottom: "1px solid var(--color-border)" }} className="table-row-hover">
                      <td style={tdS}><span style={{ fontFamily: "monospace", fontWeight: "700" }}>{(rec.id || '').slice(0, 12)}</span></td>
                      <td style={tdS}><span style={{ fontWeight: "700" }}>{fmt(Number(rec.total_amount || rec.amount || rec.net_refund_amount || 0))}</span></td>
                      <td style={tdS}>
                        <span style={{ fontSize: "0.7rem", fontWeight: "700", padding: "2px 8px", borderRadius: "10px", textTransform: "uppercase",
                          background: rec.status === 'completed' || rec.status === 'processed' || rec.status === 'paid' ? "var(--color-success-light)" : rec.status === 'pending' ? "rgba(245,158,11,0.15)" : "var(--color-surface-hover)",
                          color: rec.status === 'completed' || rec.status === 'processed' || rec.status === 'paid' ? "var(--color-success)" : rec.status === 'pending' ? "#D97706" : "var(--color-text-secondary)"
                        }}>
                          {rec.status || "N/A"}
                        </span>
                      </td>
                      <td style={tdS}>{rec.created_at || rec.requested_at ? new Date(rec.created_at || rec.requested_at).toLocaleDateString() : "N/A"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function FinKpi({ label, value, sub, color }) {
  return (
    <div style={{ background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
      <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--color-text-secondary)" }}>{label}</span>
      <div style={{ fontSize: "1.6rem", fontWeight: "800", color, marginTop: "4px" }}>{value}</div>
      <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: "2px", display: "block" }}>{sub}</span>
    </div>
  );
}

const thS = { padding: "10px 20px", fontSize: "0.72rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left" };
const tdS = { padding: "12px 20px", color: "var(--color-text)" };

const exportBtnStyle = { width: "100%", textAlign: "left", padding: "8px 10px", background: "transparent", border: "none", color: "var(--color-text)", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer" };
