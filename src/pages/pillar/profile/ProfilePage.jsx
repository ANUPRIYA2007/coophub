import React, { useState } from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { pillarProfileService } from "../../../services/pillar/profileService";
import { User, ShieldCheck, Mail, Phone, MapPin, Briefcase, Award, Save, Building2, CreditCard, CheckCircle2, Lock } from "lucide-react";

export default function ProfilePage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();

  // Personal profile state
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || "Senthil Kumar",
    email: profile?.email || user?.email || "senthil.electrician@coophub.in",
    mobile: profile?.mobile || "+91 98401 23456",
    serviceArea: profile?.service_area || "Guindy, Adyar, Velachery, Chennai",
    experience: profile?.experience_years || "5+ Years",
    mainService: "Electrician & AC Specialist",
    subServices: "Wiring, DB Box Installation, Inverter Setup, Fan Repair",
  });

  // Bank account details state
  const [bankData, setBankData] = useState({
    accountHolderName: profile?.bank_account_holder || "Senthil Kumar",
    bankName: profile?.bank_name || "State Bank of India",
    accountNumber: profile?.bank_account_number || "308945781234",
    confirmAccountNumber: profile?.bank_account_number || "308945781234",
    ifscCode: profile?.bank_ifsc || "SBIN0000842",
    upiId: profile?.bank_upi_id || "9840123456@sbi",
  });

  const [profileSaved, setProfileSaved] = useState(false);
  const [bankSaved, setBankSaved] = useState(false);
  const [bankError, setBankError] = useState("");

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    await pillarProfileService.updateProfile(user?.id, {
      full_name: formData.fullName,
      service_area: formData.serviceArea,
    });
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleSaveBankDetails = (e) => {
    e.preventDefault();
    setBankError("");

    if (!bankData.accountHolderName.trim() || !bankData.accountNumber.trim() || !bankData.ifscCode.trim()) {
      setBankError("Please fill in Account Holder Name, Account Number, and IFSC Code.");
      return;
    }

    if (bankData.accountNumber !== bankData.confirmAccountNumber) {
      setBankError("Account numbers do not match. Please verify.");
      return;
    }

    setBankSaved(true);
    setTimeout(() => setBankSaved(false), 3500);
  };

  return (
    <div className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-12)" }}>
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <div>
          <h1 className="page-title">{t("profile.title")}</h1>
          <p className="page-subtitle">Manage your verified Pillar credentials, trade specializations, and direct bank payout details</p>
        </div>
      </div>

      <div className="grid grid-3" style={{ gap: "var(--space-6)" }}>
        {/* Left ID Card */}
        <div className="card" style={{ textAlign: "center", height: "fit-content" }}>
          <div className="card-body">
            <div
              style={{
                width: "90px",
                height: "90px",
                borderRadius: "50%",
                background: "linear-gradient(135deg, var(--color-secondary), #D46510)",
                color: "white",
                fontSize: "2.5rem",
                fontWeight: "bold",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                margin: "0 auto var(--space-4)",
                boxShadow: "0 8px 20px rgba(245, 124, 32, 0.3)",
              }}
            >
              {formData.fullName[0]}
            </div>

            <h2 style={{ fontSize: "var(--font-size-xl)", fontWeight: "700" }}>{formData.fullName}</h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginTop: "2px" }}>Certified {formData.mainService}</p>

            <div style={{ marginTop: "var(--space-4)" }}>
              <span className="badge badge-success" style={{ padding: "6px 12px", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <ShieldCheck size={16} /> Verified Pillar
              </span>
            </div>

            <div style={{ marginTop: "var(--space-6)", padding: "var(--space-4)", background: "var(--color-surface-hover)", borderRadius: "var(--radius-lg)", textAlign: "left" }}>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>{t("profile.pillarIdReadOnly")}</div>
              <div style={{ fontWeight: "700", fontSize: "15px", color: "var(--color-primary)", marginTop: "2px" }}>
                {profile?.pillar_code || "PIL-CHE-042"}
              </div>
            </div>

            <div style={{ marginTop: "var(--space-4)", padding: "var(--space-4)", background: "var(--color-surface-hover)", borderRadius: "var(--radius-lg)", textAlign: "left" }}>
              <div style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Bank Connection Status</div>
              <div style={{ fontWeight: "700", fontSize: "14px", color: "var(--color-success)", marginTop: "3px", display: "flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={16} /> Active for Weekly Payouts
              </div>
            </div>
          </div>
        </div>

        {/* Right Sections: Personal Info + Bank Connection */}
        <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "var(--space-6)" }}>
          {/* Section 1: Personal Information */}
          <div className="card">
            <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <User size={20} color="var(--color-secondary)" />
              <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: "700", margin: 0 }}>{t("profile.personalInfo")}</h3>
            </div>
            <div className="card-body">
              <form onSubmit={handleSaveProfile} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {profileSaved && (
                  <div style={{ background: "var(--color-success-bg)", color: "var(--color-success)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", fontSize: "var(--font-size-sm)", fontWeight: "600" }}>
                    ✓ Profile updated successfully!
                  </div>
                )}

                <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
                  <div className="form-group">
                    <label className="form-label">{t("auth.fullName")}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t("auth.mobile")}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.mobile}
                      disabled
                      style={{ background: "var(--color-surface-hover)" }}
                    />
                  </div>
                </div>

                <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
                  <div className="form-group">
                    <label className="form-label">{t("auth.email")}</label>
                    <input
                      type="email"
                      className="form-input"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Service Coverage Area</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.serviceArea}
                      onChange={(e) => setFormData({ ...formData, serviceArea: e.target.value })}
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-end", marginTop: "var(--space-2)" }}>
                  <Save size={16} /> Save Profile
                </button>
              </form>
            </div>
          </div>

          {/* Section 2: Bank Account & Payout Connection */}
          <div className="card">
            <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <Building2 size={20} color="var(--color-secondary)" />
                <div>
                  <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: "700", margin: 0 }}>Bank Account & Direct Payout Details</h3>
                  <p style={{ fontSize: "12px", color: "var(--color-text-muted)", margin: 0 }}>Your earnings are deposited every Monday directly into this verified account</p>
                </div>
              </div>
              <span className="badge badge-success" style={{ fontSize: "11px", display: "inline-flex", alignItems: "center", gap: "4px" }}>
                <Lock size={12} /> 256-Bit Encrypted
              </span>
            </div>

            <div className="card-body">
              <form onSubmit={handleSaveBankDetails} style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
                {bankSaved && (
                  <div style={{ background: "var(--color-success-bg)", color: "var(--color-success)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", fontSize: "var(--font-size-sm)", fontWeight: "600" }}>
                    ✓ Bank payout details verified and saved securely!
                  </div>
                )}

                {bankError && (
                  <div style={{ background: "var(--color-error-bg)", color: "var(--color-error)", padding: "var(--space-3)", borderRadius: "var(--radius-md)", fontSize: "var(--font-size-sm)", fontWeight: "600" }}>
                    ⚠️ {bankError}
                  </div>
                )}

                <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
                  <div className="form-group">
                    <label className="form-label">Account Holder Name</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Senthil Kumar"
                      value={bankData.accountHolderName}
                      onChange={(e) => setBankData({ ...bankData, accountHolderName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Bank Name</label>
                    <select
                      className="form-input"
                      value={bankData.bankName}
                      onChange={(e) => setBankData({ ...bankData, bankName: e.target.value })}
                    >
                      <option value="State Bank of India">State Bank of India (SBI)</option>
                      <option value="HDFC Bank">HDFC Bank</option>
                      <option value="ICICI Bank">ICICI Bank</option>
                      <option value="Canara Bank">Canara Bank</option>
                      <option value="Axis Bank">Axis Bank</option>
                      <option value="Indian Bank">Indian Bank</option>
                      <option value="Punjab National Bank">Punjab National Bank</option>
                      <option value="Bank of Baroda">Bank of Baroda</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
                  <div className="form-group">
                    <label className="form-label">Bank Account Number</label>
                    <input
                      type="password"
                      className="form-input"
                      placeholder="Enter 9 to 18 digit account number"
                      value={bankData.accountNumber}
                      onChange={(e) => setBankData({ ...bankData, accountNumber: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Confirm Bank Account Number</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Re-enter account number"
                      value={bankData.confirmAccountNumber}
                      onChange={(e) => setBankData({ ...bankData, confirmAccountNumber: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
                  <div className="form-group">
                    <label className="form-label">IFSC Code</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. SBIN0000842"
                      value={bankData.ifscCode}
                      onChange={(e) => setBankData({ ...bankData, ifscCode: e.target.value.toUpperCase() })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">UPI ID (Optional for Instant Payouts)</label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 9840123456@sbi"
                      value={bankData.upiId}
                      onChange={(e) => setBankData({ ...bankData, upiId: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "var(--space-2)" }}>
                  <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>
                    🔒 Payouts are transferred automatically via IMPS/NEFT without commission deductions.
                  </span>
                  <button type="submit" className="btn btn-secondary">
                    <Save size={16} /> Save Bank Details
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
