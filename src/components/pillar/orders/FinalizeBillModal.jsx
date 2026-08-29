import React, { useState } from "react";
import { CheckCircle2, AlertCircle, X, Loader2, DollarSign, Wrench, ShieldCheck, Plus } from "lucide-react";
import { pillarOrderService } from "../../../services/pillar/orderService";

export default function FinalizeBillModal({ order, onClose, onSuccess }) {
  const basePrice = Number(order?.total_amount || order?.base_amount || 450);
  const [hasExtra, setHasExtra] = useState(false);
  const [extraAmount, setExtraAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const finalAmount = hasExtra ? basePrice + (parseFloat(extraAmount) || 0) : basePrice;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (hasExtra) {
      if (!extraAmount || parseFloat(extraAmount) <= 0) {
        setError("Please enter the additional amount or select standard billing.");
        return;
      }
      if (!reason.trim()) {
        setError("Please enter the reason/breakdown for the extra parts or labor.");
        return;
      }
    }

    setLoading(true);
    setError(null);

    const payload = {
      status: "completed",
      amount: basePrice,
      final_amount: finalAmount,
      extra_charge_amount: hasExtra ? parseFloat(extraAmount) : 0,
      extra_charge_reason: hasExtra ? reason.trim() : null,
      extra_charge_status: hasExtra ? "accepted" : "none",
      completed_at: new Date().toISOString()
    };

    const { success, error: reqError } = await pillarOrderService.completeOrderAndFinalizeBill(order.id, payload);
    setLoading(false);

    if (reqError) {
      setError(reqError.message || "Failed to complete order. Please try again.");
    } else {
      onSuccess?.();
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "480px" }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <CheckCircle2 size={22} color="var(--color-primary)" />
            <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: "700" }}>Finalize Bill & Complete Service</h3>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
            {error && (
              <div style={{ background: "var(--color-error-bg)", color: "var(--color-error)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", display: "flex", alignItems: "center", gap: "8px", fontSize: "var(--font-size-sm)" }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {/* Service & Order Summary Card */}
            <div style={{ background: "var(--color-surface-hover)", border: "1px solid var(--color-border-light)", padding: "var(--space-3)", borderRadius: "var(--radius-lg)", fontSize: "var(--font-size-xs)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Order ID:</span>
                <span style={{ fontWeight: "bold", fontFamily: "monospace" }}>{order.booking_code || order.id.slice(0, 8)}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Service:</span>
                <span style={{ fontWeight: "600" }}>{order.service_name}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed var(--color-border-light)", paddingTop: "4px", marginTop: "4px" }}>
                <span style={{ color: "var(--color-text-muted)" }}>Initial Base Estimate:</span>
                <span style={{ fontWeight: "bold", color: "var(--color-primary)" }}>₹{basePrice}</span>
              </div>
            </div>

            {/* Scope of Work Selection */}
            <div>
              <label style={{ fontSize: "var(--font-size-xs)", fontWeight: "700", textTransform: "uppercase", color: "var(--color-text-muted)", display: "block", marginBottom: "var(--space-2)" }}>
                Actual On-Site Work Scope
              </label>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "var(--radius-md)", border: `1px solid ${!hasExtra ? 'var(--color-primary)' : 'var(--color-border-light)'}`, background: !hasExtra ? 'rgba(230, 81, 0, 0.05)' : 'white', cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="scopeType"
                    checked={!hasExtra}
                    onChange={() => { setHasExtra(false); setExtraAmount(""); setReason(""); }}
                  />
                  <div style={{ fontSize: "var(--font-size-xs)" }}>
                    <span style={{ fontWeight: "bold", display: "block" }}>Standard Work Completed (Base ₹{basePrice})</span>
                    <span style={{ color: "var(--color-text-muted)" }}>Job matched initial customer request with no extra materials.</span>
                  </div>
                </label>

                <label style={{ display: "flex", alignItems: "center", gap: "10px", padding: "10px 14px", borderRadius: "var(--radius-md)", border: `1px solid ${hasExtra ? 'var(--color-primary)' : 'var(--color-border-light)'}`, background: hasExtra ? 'rgba(230, 81, 0, 0.05)' : 'white', cursor: "pointer" }}>
                  <input
                    type="radio"
                    name="scopeType"
                    checked={hasExtra}
                    onChange={() => setHasExtra(true)}
                  />
                  <div style={{ fontSize: "var(--font-size-xs)" }}>
                    <span style={{ fontWeight: "bold", display: "block", color: "var(--color-primary)" }}>Additional Work / Parts Added</span>
                    <span style={{ color: "var(--color-text-muted)" }}>Extra materials, spare parts, or expanded labor required.</span>
                  </div>
                </label>
              </div>
            </div>

            {/* Extra Amount & Reason Fields (If Extra Work) */}
            {hasExtra && (
              <div style={{ background: "rgba(230, 81, 0, 0.04)", border: "1px solid rgba(230, 81, 0, 0.2)", padding: "var(--space-3)", borderRadius: "var(--radius-lg)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "var(--font-size-xs)", fontWeight: "bold" }}>
                    Additional Amount (₹) <span className="required">*</span>
                  </label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    value={extraAmount}
                    onChange={(e) => setExtraAmount(e.target.value)}
                    placeholder="e.g. 250"
                    required
                    autoFocus
                  />
                </div>

                <div className="form-group">
                  <label className="form-label" style={{ fontSize: "var(--font-size-xs)", fontWeight: "bold" }}>
                    Reason / Itemized Parts Breakdown <span className="required">*</span>
                  </label>
                  <textarea
                    className="form-input"
                    rows={2}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="e.g. Replaced 2 heavy-duty brass joints and applied sealant tape"
                    required
                  />
                </div>
              </div>
            )}

            {/* Live Grand Total Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-navy-900, #0f172a)", color: "white", padding: "14px 18px", borderRadius: "var(--radius-lg)" }}>
              <div>
                <span style={{ fontSize: "11px", color: "#94a3b8", display: "block", textTransform: "uppercase", fontWeight: "bold" }}>
                  Customer Final Total Due
                </span>
                <span style={{ fontSize: "12px", color: "#fdba74" }}>
                  {hasExtra ? `₹${basePrice} (Base) + ₹${parseFloat(extraAmount) || 0} (Extra)` : `Standard ₹${basePrice}`}
                </span>
              </div>
              <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#f97316", fontFamily: "monospace" }}>
                ₹{finalAmount}
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" disabled={loading} style={{ fontWeight: "bold" }}>
              {loading ? <Loader2 size={16} className="spinner" /> : `✓ Confirm & Complete Job (₹${finalAmount})`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
