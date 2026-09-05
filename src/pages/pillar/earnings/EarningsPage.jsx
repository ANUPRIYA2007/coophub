import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { pillarEarningsService } from "../../../services/pillar/earningsService";
import { 
  Wallet, TrendingUp, Clock, CheckCircle2, Loader2, AlertCircle, 
  ArrowLeft, X, DollarSign, ShieldCheck, AlertTriangle
} from "lucide-react";

export default function EarningsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [data, setData] = useState({
    summary: { total: 0, today: 0, pending: 0, paid: 0, withdrawable: 0 },
    transactions: [],
    payouts: [],
    bankDetails: {}
  });
  const [loading, setLoading] = useState(true);
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("bank_transfer");
  const [submitting, setSubmitting] = useState(false);
  const [payoutError, setPayoutError] = useState(null);

  const loadData = async () => {
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
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleOpenPayoutModal = () => {
    setPayoutAmount(data.summary.withdrawable > 0 ? String(data.summary.withdrawable) : "");
    setPayoutError(null);
    setShowPayoutModal(true);
  };

  const handleSubmitPayout = async (e) => {
    e.preventDefault();
    setPayoutError(null);
    const amt = Number(payoutAmount);
    if (isNaN(amt) || amt <= 0) {
      setPayoutError("Please enter a valid positive payout amount.");
      return;
    }
    if (amt > data.summary.withdrawable) {
      setPayoutError(`Requested amount exceeds your withdrawable balance (₹${data.summary.withdrawable}).`);
      return;
    }

    setSubmitting(true);
    const res = await pillarEarningsService.requestPayout(user.id, amt, paymentMode);
    if (res.error) {
      setPayoutError(res.error);
      setSubmitting(false);
      return;
    }

    setSubmitting(false);
    setShowPayoutModal(false);
    alert("Payout request submitted successfully! Internal settlement queued for cooperative processing.");
    loadData();
  };

  return (
    <div className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-12)" }}>
      <div className="page-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ marginBottom: "6px" }}>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-outline btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", fontSize: "12px", fontWeight: "700" }}
              title="Back to Pillar Dashboard Home"
            >
              <ArrowLeft size={14} /> {t("Back to Dashboard")}
            </button>
          </div>
          <h1 className="page-title">{t("earnings.title")}</h1>
          <p className="page-subtitle">{t("Track your net earnings, payout history, and withdrawable balance")}</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={handleOpenPayoutModal}
          disabled={data.summary.withdrawable <= 0}
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Wallet size={16} /> {t("Request Payout")} (₹{data.summary.withdrawable.toLocaleString()})
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
              <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>{t("Total Net Earnings")}</span>
              <span style={{ background: "rgba(16, 185, 129, 0.1)", color: "var(--color-success)", padding: "6px", borderRadius: "var(--radius-md)" }}><Wallet size={18} /></span>
            </div>
            <h2 style={{ fontSize: "var(--font-size-3xl)", marginTop: "var(--space-2)", color: "var(--color-success)" }}>₹{data.summary.total.toLocaleString()}</h2>
          </div>
        </div>

        <div className="card" style={{ border: "1.5px solid #10B981" }}>
          <div className="card-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#059669", fontSize: "var(--font-size-sm)", fontWeight: "700" }}>{t("Withdrawable Balance")}</span>
              <span style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10B981", padding: "6px", borderRadius: "var(--radius-md)" }}><DollarSign size={18} /></span>
            </div>
            <h2 style={{ fontSize: "var(--font-size-3xl)", marginTop: "var(--space-2)", color: "#10B981", fontWeight: "800" }}>₹{data.summary.withdrawable.toLocaleString()}</h2>
          </div>
        </div>

        <div className="card">
          <div className="card-body">
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)" }}>{t("Pending / Settled Payouts")}</span>
              <span style={{ background: "rgba(245, 158, 11, 0.1)", color: "var(--color-warning)", padding: "6px", borderRadius: "var(--radius-md)" }}><Clock size={18} /></span>
            </div>
            <h2 style={{ fontSize: "var(--font-size-3xl)", marginTop: "var(--space-2)", color: "var(--color-warning)" }}>₹{(data.summary.pending + data.summary.paid).toLocaleString()}</h2>
          </div>
        </div>
      </div>

      {/* Payout History Section */}
      {data.payouts && data.payouts.length > 0 && (
        <div className="card" style={{ marginBottom: "var(--space-8)" }}>
          <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h3 style={{ fontSize: "var(--font-size-lg)", margin: 0 }}>{t("Payout Requests History")}</h3>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
              {t("Settlements processed per weekly cooperative cycle")}
            </span>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ padding: "var(--space-3) var(--space-4)" }}>{t("Request ID")}</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)" }}>{t("Date")}</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)" }}>{t("Mode")}</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)" }}>{t("Status")}</th>
                  <th style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right" }}>{t("Amount")}</th>
                </tr>
              </thead>
              <tbody>
                {data.payouts.map((po) => (
                  <tr key={po.id} style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                    <td style={{ padding: "var(--space-3) var(--space-4)", fontWeight: "600" }}>{po.id.slice(0, 8)}</td>
                    <td style={{ padding: "var(--space-3) var(--space-4)", color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                      {new Date(po.requested_at).toLocaleDateString()}
                    </td>
                    <td style={{ padding: "var(--space-3) var(--space-4)", textTransform: "uppercase", fontSize: "0.78rem" }}>
                      {po.payment_mode === "bank_transfer" ? "Bank Transfer" : "UPI"}
                    </td>
                    <td style={{ padding: "var(--space-3) var(--space-4)" }}>
                      <span className={`badge ${po.status === "completed" ? "badge-success" : po.status === "rejected" ? "badge-danger" : "badge-warning"}`} style={{ textTransform: "capitalize" }}>
                        {po.status}
                      </span>
                      {po.rejection_reason && (
                        <div style={{ fontSize: "0.72rem", color: "#EF4444", marginTop: "2px" }}>
                          {po.rejection_reason}
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "var(--space-3) var(--space-4)", textAlign: "right", fontWeight: "700" }}>
                      ₹{parseFloat(po.amount || 0).toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

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
                  <th style={{ padding: "var(--space-4)", textAlign: "right" }}>Net Credited</th>
                </tr>
              </thead>
              <tbody>
                {data.transactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                    <td style={{ padding: "var(--space-4)", fontWeight: "600" }}>{tx.id.slice(0, 8)}</td>
                    <td style={{ padding: "var(--space-4)", color: "var(--color-text-secondary)" }}>{new Date(tx.created_at).toLocaleDateString()}</td>
                    <td style={{ padding: "var(--space-4)", textTransform: "capitalize" }}>{tx.type || "service"}</td>
                    <td style={{ padding: "var(--space-4)" }}>
                      <span className={`badge ${tx.status === "paid" || tx.status === "credited" ? "badge-success" : "badge-warning"}`}>
                        {tx.status || "credited"}
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

      {/* Payout Request Modal */}
      {showPayoutModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(5, 10, 18, 0.8)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 10000, padding: "16px"
        }}>
          <div style={{
            background: "var(--color-surface)",
            borderRadius: "16px",
            border: "1px solid var(--color-border)",
            maxWidth: "480px",
            width: "100%",
            padding: "24px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Wallet size={20} color="#10B981" />
                <h3 style={{ fontSize: "1.15rem", fontWeight: "800", margin: 0 }}>Request Earnings Payout</h3>
              </div>
              <button onClick={() => setShowPayoutModal(false)} className="btn btn-xs btn-outline">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmitPayout}>
              <div style={{
                background: "rgba(16, 185, 129, 0.08)",
                border: "1px solid rgba(16, 185, 129, 0.25)",
                padding: "12px", borderRadius: "10px", marginBottom: "16px",
                display: "flex", justifyContent: "space-between", alignItems: "center"
              }}>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>Withdrawable Balance:</span>
                <strong style={{ fontSize: "1.1rem", color: "#10B981" }}>₹{data.summary.withdrawable.toLocaleString()}</strong>
              </div>

              {payoutError && (
                <div style={{
                  background: "rgba(239, 68, 68, 0.1)", color: "#EF4444",
                  padding: "10px 14px", borderRadius: "8px", fontSize: "0.82rem",
                  marginBottom: "14px", display: "flex", alignItems: "center", gap: "6px"
                }}>
                  <AlertCircle size={16} /> {payoutError}
                </div>
              )}

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", display: "block", marginBottom: "6px" }}>
                  Payout Amount (₹):
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  max={data.summary.withdrawable}
                  value={payoutAmount}
                  onChange={(e) => setPayoutAmount(e.target.value)}
                  style={{
                    width: "100%", padding: "10px 14px", borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface-hover)",
                    fontSize: "1rem", fontWeight: "700"
                  }}
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "0.82rem", fontWeight: "700", display: "block", marginBottom: "6px" }}>
                  Disbursement Destination:
                </label>
                <div style={{ display: "flex", gap: "10px", marginBottom: "10px" }}>
                  <button
                    type="button"
                    onClick={() => setPaymentMode("bank_transfer")}
                    className={`btn btn-sm ${paymentMode === "bank_transfer" ? "btn-primary" : "btn-outline"}`}
                    style={{ flex: 1 }}
                  >
                    Bank Transfer
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaymentMode("upi")}
                    className={`btn btn-sm ${paymentMode === "upi" ? "btn-primary" : "btn-outline"}`}
                    style={{ flex: 1 }}
                  >
                    UPI ID
                  </button>
                </div>

                <div style={{
                  fontSize: "0.78rem", color: "var(--color-text-secondary)",
                  background: "var(--color-surface-hover)", padding: "10px 12px", borderRadius: "8px"
                }}>
                  {paymentMode === "bank_transfer" ? (
                    data.bankDetails?.bank_account_number ? (
                      <>
                        <strong>Bank:</strong> {data.bankDetails.bank_name || "Primary Bank"}<br/>
                        <strong>Account:</strong> {data.bankDetails.bank_account_number}<br/>
                        <strong>IFSC:</strong> {data.bankDetails.bank_ifsc}
                      </>
                    ) : (
                      <span style={{ color: "#EF4444" }}>⚠️ Bank account details missing in Profile.</span>
                    )
                  ) : (
                    data.bankDetails?.bank_upi_id ? (
                      <><strong>UPI ID:</strong> {data.bankDetails.bank_upi_id}</>
                    ) : (
                      <span style={{ color: "#EF4444" }}>⚠️ UPI ID missing in Profile.</span>
                    )
                  )}
                </div>
              </div>

              <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginBottom: "16px" }}>
                ℹ️ External bank API disbursement is currently in manual settlement mode. Your request will be reviewed and authorized by Cooperative Treasury.
              </div>

              <div style={{ display: "flex", gap: "10px" }}>
                <button
                  type="button"
                  onClick={() => setShowPayoutModal(false)}
                  className="btn btn-outline"
                  style={{ flex: 1 }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="btn btn-primary"
                  style={{ flex: 2, fontWeight: "800" }}
                >
                  {submitting ? "Submitting..." : `Confirm Payout ₹${payoutAmount || 0}`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
