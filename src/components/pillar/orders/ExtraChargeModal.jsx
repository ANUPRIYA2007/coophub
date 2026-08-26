import React, { useState } from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { DollarSign, AlertCircle, X, Loader2 } from "lucide-react";
import { pillarOrderService } from "../../../services/pillar/orderService";

export default function ExtraChargeModal({ bookingId, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!amount || parseFloat(amount) <= 0 || !reason.trim()) {
      setError(t("validation.required"));
      return;
    }

    setLoading(true);
    setError(null);
    const { data, error: reqError } = await pillarOrderService.requestExtraCharge(bookingId, amount, reason);
    setLoading(false);

    if (reqError) {
      setError(reqError.message || t("common.error"));
    } else {
      onSuccess?.(data);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "450px" }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <DollarSign size={20} color="var(--color-secondary)" />
            <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: "600" }}>{t("orders.extraCharge.title")}</h3>
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

            <div className="form-group">
              <label className="form-label">{t("orders.extraCharge.amount")} (₹) <span className="required">*</span></label>
              <input
                type="number"
                min="1"
                className="form-input"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="250"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">{t("orders.extraCharge.reason")} <span className="required">*</span></label>
              <textarea
                className="form-input"
                rows={3}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                placeholder="Additional parts required (e.g. Copper pipe replacement)"
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              {t("common.cancel")}
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 size={16} className="spinner" /> : t("orders.extraCharge.submit")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
