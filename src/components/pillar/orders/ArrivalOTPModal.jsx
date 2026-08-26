import React, { useState } from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { KeyRound, CheckCircle, AlertCircle, X, Loader2 } from "lucide-react";
import { pillarOrderService } from "../../../services/pillar/orderService";

export default function ArrivalOTPModal({ bookingId, onClose, onSuccess }) {
  const { t } = useTranslation();
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!otp || otp.length < 4) {
      setError(t("validation.required"));
      return;
    }

    setLoading(true);
    setError(null);
    const { success, error: otpError } = await pillarOrderService.verifyArrivalOTP(bookingId, otp);
    setLoading(false);

    if (success) {
      onSuccess?.();
      onClose();
    } else {
      setError(otpError || t("orders.arrival.invalidOtp"));
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "420px" }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <KeyRound size={20} color="var(--color-secondary)" />
            <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: "600" }}>{t("orders.arrival.title")}</h3>
          </div>
          <button className="btn-icon" onClick={onClose}><X size={18} /></button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body" style={{ textAlign: "center" }}>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginBottom: "var(--space-4)" }}>
              {t("orders.arrival.enterOtp")}
            </p>

            {error && (
              <div style={{ background: "var(--color-error-bg)", color: "var(--color-error)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "8px", fontSize: "var(--font-size-sm)" }}>
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <input
              type="text"
              className="form-input"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              placeholder="e.g. 1234"
              maxLength={6}
              autoFocus
              style={{ textAlign: "center", fontSize: "1.5rem", letterSpacing: "8px", fontWeight: "bold" }}
            />
            <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)", marginTop: "8px", display: "block" }}>
              Demo testing OTP: 123456
            </span>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              {t("common.cancel")}
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 size={16} className="spinner" /> : t("orders.arrival.verify")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
