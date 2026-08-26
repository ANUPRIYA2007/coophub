import React, { useState } from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { LifeBuoy, AlertCircle, X, Loader2 } from "lucide-react";
import { pillarSupportService } from "../../../services/pillar/supportService";
import { useAuth } from "../../../context/AuthContext";

export default function CreateTicketModal({ onClose, onSuccess }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    subject: "",
    category: "booking",
    priority: "medium",
    description: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.description.trim()) {
      setError(t("validation.required"));
      return;
    }

    setLoading(true);
    setError(null);
    const { data, error: submitErr } = await pillarSupportService.createTicket({
      pillar_id: user?.id || "mock-pillar-1",
      ...formData,
    });
    setLoading(false);

    if (submitErr) {
      setError(submitErr.message || t("common.error"));
    } else {
      onSuccess?.(data);
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: "520px" }}>
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <LifeBuoy size={20} color="var(--color-secondary)" />
            <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: "600" }}>{t("support.createTicket")}</h3>
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
              <label className="form-label">{t("support.subject")} <span className="required">*</span></label>
              <input
                type="text"
                className="form-input"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Brief description of the problem"
                required
              />
            </div>

            <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
              <div className="form-group">
                <label className="form-label">Category</label>
                <select
                  className="form-input"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                >
                  <option value="account">{t("support.categories.account")}</option>
                  <option value="booking">{t("support.categories.booking")}</option>
                  <option value="payment">{t("support.categories.payment")}</option>
                  <option value="customer">{t("support.categories.customer")}</option>
                  <option value="technical">{t("support.categories.technical")}</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">{t("support.priority")}</label>
                <select
                  className="form-input"
                  value={formData.priority}
                  onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                >
                  <option value="low">{t("support.low")}</option>
                  <option value="medium">{t("support.medium")}</option>
                  <option value="high">{t("support.high")}</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">{t("support.description")} <span className="required">*</span></label>
              <textarea
                className="form-input"
                rows={4}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Provide detailed information regarding your inquiry..."
                required
              />
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-outline" onClick={onClose} disabled={loading}>
              {t("common.cancel")}
            </button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? <Loader2 size={16} className="spinner" /> : t("support.submitTicket")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
