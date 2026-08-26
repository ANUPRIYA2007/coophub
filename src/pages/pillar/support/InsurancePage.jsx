import React from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { Shield, AlertTriangle, FileHeart, BriefcaseMedical } from "lucide-react";

export default function InsurancePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  
  // Dynamic validity (1 year from now)
  const validityDate = new Date();
  validityDate.setFullYear(validityDate.getFullYear() + 1);
  const validityString = validityDate.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });

  return (
    <div className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-12)" }}>
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <div>
          <h1 className="page-title">Insurance & Coverage</h1>
          <p className="page-subtitle">Your active cooperative insurance policies and claims</p>
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: "var(--space-6)" }}>
        <div className="card">
          <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <Shield size={20} color="var(--color-success)" />
            <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: "700", margin: 0 }}>Active Coverage</h3>
          </div>
          <div className="card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              <div style={{ padding: "var(--space-4)", background: "var(--color-success-bg)", borderRadius: "var(--radius-md)", border: "1px solid var(--color-success)" }}>
                <h4 style={{ color: "var(--color-success)", margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                  <BriefcaseMedical size={16} /> Accident & Health
                </h4>
                <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                  Coverage up to ₹5,000,000 for on-duty accidents. Valid until {validityString}.
                </p>
              </div>
              <div style={{ padding: "var(--space-4)", background: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
                <h4 style={{ margin: "0 0 4px 0", display: "flex", alignItems: "center", gap: "6px" }}>
                  <AlertTriangle size={16} color="var(--color-warning)" /> Liability Protection
                </h4>
                <p style={{ margin: 0, fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                  Coverage for accidental customer property damage during service.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <FileHeart size={20} color="var(--color-secondary)" />
            <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: "700", margin: 0 }}>File a Claim</h3>
          </div>
          <div className="card-body">
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
              To file an insurance claim, please contact the cooperative support desk directly or initiate a request here.
            </p>
            <button className="btn btn-secondary" style={{ width: "100%" }}>
              Initiate Claim Request
            </button>
            <p style={{ marginTop: "var(--space-4)", fontSize: "12px", color: "var(--color-text-muted)", textAlign: "center" }}>
              Note: Requires valid incident report and supervisor verification.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
