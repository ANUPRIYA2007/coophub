import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { pillarEarningsService } from "../../../services/pillar/earningsService";
import { Wallet, TrendingUp, Clock, CheckCircle2, Loader2, AlertCircle, ArrowLeft } from "lucide-react";

export default function EarningsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState({
    summary: { total: 0, today: 0, pending: 0, paid: 0 },
    transactions: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const res = await pillarEarningsService.getEarningsSummary(user.id);
      if (res && res.summary) {
        setData(res);
      }
      setLoading(false);
    }
    load();
  }, [user]);

  return (
    <div className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-12)" }}>
      <div className="page-header">
        <div>
          <div style={{ marginBottom: "6px" }}>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-outline btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", fontSize: "12px", fontWeight: "700" }}
              title="Back to Pillar Dashboard Home"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
          </div>
          <h1 className="page-title">{t("earnings.title")}</h1>
          <p className="page-subtitle">Track your revenue, payouts, and incentives</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => alert("Payout request submitted! It will be processed to your registered bank account.")}
          disabled={data.summary.pending <= 0}
        >
          <Wallet size={16} /> Request Payout
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-4" style={{ marginBottom: "var(--space-8)" }}>
        <div className="card">
          <div className="card-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>{t("earnings.today")}</span>
              <span style={{ background: "rgba(245, 124, 32, 0.1)", color: "var(--color-secondary)", padding: "6px", borderRadius: "var(--radius-md)" }}><TrendingUp size={18} /></span>
            </div>
            <h2 style={{ fontSize: "var(--font-size-3xl)", marginTop: "var(--space-2)", color: "var(--color-primary)" }}>₹{data.summary.today.toLocaleString()}</h2>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>{t("earnings.total")}</span>
              <span style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--color-success)", padding: "6px", borderRadius: "var(--radius-md)" }}><Wallet size={18} /></span>
            </div>
            <h2 style={{ fontSize: "var(--font-size-3xl)", marginTop: "var(--space-2)", color: "var(--color-success)" }}>₹{data.summary.total.toLocaleString()}</h2>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>{t("earnings.pendingEarnings")}</span>
              <span style={{ background: "rgba(245, 158, 11, 0.1)", color: "var(--color-warning)", padding: "6px", borderRadius: "var(--radius-md)" }}><Clock size={18} /></span>
            </div>
            <h2 style={{ fontSize: "var(--font-size-3xl)", marginTop: "var(--space-2)", color: "var(--color-warning)" }}>₹{data.summary.pending.toLocaleString()}</h2>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>{t("earnings.paidEarnings")}</span>
              <span style={{ background: "rgba(59, 130, 246, 0.1)", color: "var(--color-info)", padding: "6px", borderRadius: "var(--radius-md)" }}><CheckCircle2 size={18} /></span>
            </div>
            <h2 style={{ fontSize: "var(--font-size-3xl)", marginTop: "var(--space-2)", color: "var(--color-info)" }}>₹{data.summary.paid.toLocaleString()}</h2>
          </div>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: "var(--font-size-lg)" }}>{t("earnings.transactions")}</h3>
        </div>
        <div className="card-body" style={{ padding: 0 }}>
          {loading ? (
            <div className="loading-container">
              <Loader2 size={32} className="spinner" />
              <p>Fetching real-time transactions...</p>
            </div>
          ) : data.transactions.length === 0 ? (
            <div className="empty-state">
              <Wallet size={36} color="var(--color-text-muted)" />
              <h4 className="empty-state-title">No transactions recorded yet</h4>
              <p className="empty-state-text">Your earnings from completed customer jobs will appear here automatically.</p>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ padding: "var(--space-4)" }}>ID</th>
                  <th style={{ padding: "var(--space-4)" }}>Date</th>
                  <th style={{ padding: "var(--space-4)" }}>Type</th>
                  <th style={{ padding: "var(--space-4)" }}>Status</th>
                  <th style={{ padding: "var(--space-4)", textAlign: "right" }}>Amount</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                    <td style={{ padding: "var(--space-4)", fontWeight: "600" }}>{tx.id.slice(0, 8)}</td>
                    <td style={{ padding: "var(--space-4)", color: "var(--color-text-secondary)" }}>{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: "var(--space-4)", textTransform: "capitalize" }}>{tx.type || "service"}</td>
                    <td style={{ padding: "var(--space-4)" }}>
                      <span className={`badge ${tx.status === "paid" ? "badge-success" : "badge-warning"}`}>
                        {tx.status}
                      </span>
                    </td>
                    <td style={{ padding: "var(--space-4)", textAlign: "right", fontWeight: "700", color: "var(--color-primary)" }}>
                      +₹{parseFloat(tx.amount || 0).toLocaleString()}
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
