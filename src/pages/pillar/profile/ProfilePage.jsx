import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { pillarProfileService } from "../../../services/pillar/profileService";
import { User, ShieldCheck, Mail, Phone, MapPin, Briefcase, Award, Save, Building2, CreditCard, CheckCircle2, Lock, FileText, UploadCloud, Loader2, ArrowLeft } from "lucide-react";

export default function ProfilePage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user, profile } = useAuth();

  // Handle arrays correctly
  const mainSvc = Array.isArray(profile?.main_services) ? profile.main_services[0] : (profile?.main_services || "Electrician");
  const subSvc = Array.isArray(profile?.sub_services) ? profile.sub_services.join(", ") : (profile?.sub_services || "Wiring, DB Box Installation, Inverter Setup, Fan Repair");

  // Personal profile state
  const [formData, setFormData] = useState({
    fullName: profile?.full_name || "Senthil Kumar",
    email: profile?.email || user?.email || "senthil.electrician@coophub.in",
    mobile: profile?.mobile || "+91 98401 23456",
    mainService: mainSvc,
    customRole: profile?.custom_role || "",
    area: profile?.area || (Array.isArray(profile?.service_area) ? profile.service_area[0] : profile?.service_area) || "Guindy, Adyar",
    pincode: profile?.pincode || (Array.isArray(profile?.service_area) && profile.service_area[1] ? profile.service_area[1] : "600032"),
    experience: profile?.experience_years || "5+ Years",
    subServices: subSvc,
    locationSharingEnabled: profile?.location_sharing_enabled !== false,
  });

  // Sync state if profile loads dynamically
  useEffect(() => {
    const isDemo = localStorage.getItem("coophub_demo_user") === "true";
    if (isDemo) {
      const savedDemo = JSON.parse(localStorage.getItem("coophub_demo_pillar_profile") || "{}");
      const s = savedDemo.main_services ? (Array.isArray(savedDemo.main_services) ? savedDemo.main_services[0] : savedDemo.main_services) : (Array.isArray(profile?.main_services) ? profile.main_services[0] : (profile?.main_services || "Electrician"));
      setFormData({
        fullName: savedDemo.full_name || profile?.full_name || "Senthil Kumar",
        email: savedDemo.email || profile?.email || user?.email || "senthil.electrician@coophub.in",
        mobile: savedDemo.mobile || profile?.mobile || "+91 98401 23456",
        mainService: s,
        customRole: savedDemo.custom_role || profile?.custom_role || "",
        area: savedDemo.area || profile?.area || (Array.isArray(profile?.service_area) ? profile.service_area[0] : profile?.service_area) || "Guindy, Adyar",
        pincode: savedDemo.pincode || profile?.pincode || (Array.isArray(profile?.service_area) && profile.service_area[1] ? profile.service_area[1] : "600032"),
        experience: savedDemo.experience_years || profile?.experience_years || "5+ Years",
        subServices: Array.isArray(profile?.sub_services) ? profile.sub_services.join(", ") : (profile?.sub_services || ""),
        locationSharingEnabled: savedDemo.location_sharing_enabled !== undefined ? savedDemo.location_sharing_enabled : (profile?.location_sharing_enabled !== false),
      });

      const savedBank = JSON.parse(localStorage.getItem("coophub_demo_pillar_bank") || "{}");
      if (savedBank.accountNumber) {
        setBankData(prev => ({
          ...prev,
          ...savedBank,
          confirmAccountNumber: savedBank.accountNumber
        }));
      }
      return;
    }

    if (profile) {
      const s = Array.isArray(profile.main_services) ? profile.main_services[0] : profile.main_services;
      setFormData({
        fullName: profile.full_name || "",
        email: profile.email || user?.email || "",
        mobile: profile.mobile || "",
        mainService: s || "Electrician",
        customRole: profile.custom_role || "",
        area: profile.area || (Array.isArray(profile.service_area) ? profile.service_area[0] : profile.service_area) || "",
        pincode: profile.pincode || (Array.isArray(profile.service_area) && profile.service_area[1] ? profile.service_area[1] : ""),
        experience: profile.experience_years || "3-5",
        subServices: Array.isArray(profile.sub_services) ? profile.sub_services.join(", ") : (profile.sub_services || ""),
        locationSharingEnabled: profile.location_sharing_enabled !== false,
      });
    }
  }, [profile, user]);

  // KYC State
  const [kycDocs, setKycDocs] = useState([]);
  const [uploadingKyc, setUploadingKyc] = useState(false);
  const fileInputRef = useRef(null);
  const [selectedDocType, setSelectedDocType] = useState("aadhaar");

  useEffect(() => {
    if (user) {
      pillarProfileService.getKycDocuments(user.id).then(({ data }) => setKycDocs(data));
    }
  }, [user]);

  const handleKycUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    
    setUploadingKyc(true);
    setTimeout(async () => {
      const { data } = await pillarProfileService.uploadKycDocument(user.id, selectedDocType, file);
      if (data) {
        setKycDocs(prev => [data, ...prev]);
      }
      setUploadingKyc(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }, 1500);
  };

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
  const [profileError, setProfileError] = useState("");
  const [bankSaved, setBankSaved] = useState(false);
  const [bankError, setBankError] = useState("");

  const handleSaveProfile = async (e) => {
    e.preventDefault();
    setProfileError("");

    if (!formData.fullName.trim()) {
      setProfileError("Full Name is required.");
      return;
    }
    if (formData.mainService === "Others" && !formData.customRole.trim()) {
      setProfileError("Please enter your custom job role / trade.");
      return;
    }
    if (!formData.area.trim()) {
      setProfileError("Area / Locality is required.");
      return;
    }
    if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode.trim())) {
      setProfileError("Please enter a valid 6-digit numeric Indian pincode.");
      return;
    }

    const payload = {
      full_name: formData.fullName.trim(),
      main_services: [formData.mainService],
      custom_role: formData.mainService === "Others" ? formData.customRole.trim() : null,
      area: formData.area.trim(),
      pincode: formData.pincode.trim(),
      service_area: [formData.area.trim(), formData.pincode.trim()].filter(Boolean),
      location_sharing_enabled: formData.locationSharingEnabled !== false,
    };

    const isDemo = localStorage.getItem("coophub_demo_user") === "true";
    if (isDemo) {
      localStorage.setItem("coophub_demo_pillar_profile", JSON.stringify({
        ...profile,
        ...payload
      }));
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 3000);
      return;
    }

    if (user?.id) {
      await pillarProfileService.updateProfile(user.id, payload);
    }
    setProfileSaved(true);
    setTimeout(() => setProfileSaved(false), 3000);
  };

  const handleSaveBankDetails = async (e) => {
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

    const bankPayload = {
      accountHolderName: bankData.accountHolderName,
      bankName: bankData.bankName,
      accountNumber: bankData.accountNumber,
      ifscCode: bankData.ifscCode,
      upiId: bankData.upiId
    };

    const isDemo = localStorage.getItem("coophub_demo_user") === "true";
    if (isDemo) {
      localStorage.setItem("coophub_demo_pillar_bank", JSON.stringify(bankPayload));
      setBankSaved(true);
      setTimeout(() => setBankSaved(false), 3500);
      return;
    }

    if (user?.id) {
      await pillarProfileService.updateProfile(user.id, {
        bank_account_holder: bankData.accountHolderName,
        bank_name: bankData.bankName,
        bank_account_number: bankData.accountNumber,
        bank_ifsc: bankData.ifscCode,
        bank_upi_id: bankData.upiId
      });
    }

    setBankSaved(true);
    setTimeout(() => setBankSaved(false), 3500);
  };

  return (
    <div className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-12)" }}>
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
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
                {profileError && (
                  <div style={{ background: "rgba(239, 68, 68, 0.1)", color: "#EF4444", padding: "var(--space-3)", borderRadius: "var(--radius-md)", fontSize: "var(--font-size-sm)", fontWeight: "600" }}>
                    ⚠️ {profileError}
                  </div>
                )}

                <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
                  <div className="form-group">
                    <label className="form-label">{t("auth.fullName")} <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.fullName}
                      onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">{t("auth.mobile")}</label>
                    <input
                      type="text"
                      className="form-input"
                      value={formData.mobile}
                      disabled
                      style={{ background: "var(--color-surface-hover)", opacity: 0.8 }}
                    />
                  </div>
                </div>

                <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
                  <div className="form-group">
                    <label className="form-label">Core Trade / Job Role <span className="required">*</span></label>
                    <select
                      className="form-input"
                      value={formData.mainService}
                      onChange={(e) => setFormData({ ...formData, mainService: e.target.value })}
                      required
                    >
                      <option value="Electrician">Electrician (Home & Industrial)</option>
                      <option value="Plumber">Plumber (Piping & Sanitary)</option>
                      <option value="Carpenter">Carpenter & Woodwork</option>
                      <option value="AC Repair">AC & HVAC Technician</option>
                      <option value="Painter">Painter & Waterproofing</option>
                      <option value="Cleaner">Deep Cleaning Specialist</option>
                      <option value="Driver">Professional Driver (Personal & Commercial)</option>
                      <option value="Others">Others (Custom Trade / Specialty)</option>
                    </select>
                  </div>

                  {formData.mainService === "Others" ? (
                    <div className="form-group" style={{ animation: "fadeIn 0.3s ease" }}>
                      <label className="form-label">Custom Job Role / Specialty <span className="required">*</span></label>
                      <input
                        type="text"
                        className="form-input"
                        placeholder="e.g. CCTV Installation Technician"
                        value={formData.customRole}
                        onChange={(e) => setFormData({ ...formData, customRole: e.target.value })}
                        required
                      />
                    </div>
                  ) : (
                    <div className="form-group">
                      <label className="form-label">{t("auth.email")}</label>
                      <input
                        type="email"
                        className="form-input"
                        value={formData.email}
                        disabled
                        style={{ background: "var(--color-surface-hover)", opacity: 0.8 }}
                      />
                    </div>
                  )}
                </div>

                <div className="grid grid-2" style={{ gap: "var(--space-4)" }}>
                  <div className="form-group">
                    <label className="form-label">Area / Locality <span className="required">*</span></label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. Guindy, Velachery, Adyar"
                      value={formData.area}
                      onChange={(e) => setFormData({ ...formData, area: e.target.value })}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Pincode <span className="required">*</span></label>
                    <input
                      type="text"
                      maxLength={6}
                      className="form-input"
                      placeholder="600032"
                      value={formData.pincode}
                      onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={{ background: "var(--color-surface-hover)", padding: "12px 14px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "0.85rem", cursor: "pointer", color: "var(--color-text)", fontWeight: "600", userSelect: "none" }}>
                    <input
                      type="checkbox"
                      checked={formData.locationSharingEnabled}
                      onChange={(e) => setFormData({ ...formData, locationSharingEnabled: e.target.checked })}
                      style={{ accentColor: "var(--color-secondary)", width: "18px", height: "18px", cursor: "pointer" }}
                    />
                    <span>Allow live GPS location sharing for dispatch radar and customer approach navigation when Online</span>
                  </label>
                </div>

                <button type="submit" className="btn btn-primary" style={{ alignSelf: "flex-end", marginTop: "var(--space-2)" }}>
                  <Save size={16} /> Save Profile
                </button>
              </form>
            </div>
          </div>

          {/* Section 1.5: Worker Certification / KYC */}
          <div className="card">
            <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <FileText size={20} color="var(--color-secondary)" />
              <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: "700", margin: 0 }}>Worker Certification & KYC</h3>
            </div>
            <div className="card-body">
              <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
                Upload official documents to maintain your "Verified Pillar" badge.
              </p>
              
              <div style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-6)" }}>
                <select 
                  className="form-input" 
                  value={selectedDocType} 
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  style={{ width: "200px" }}
                >
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="pan">PAN Card</option>
                  <option value="skill_certificate">Skill Certificate</option>
                  <option value="police_clearance">Police Clearance</option>
                </select>
                
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  style={{ display: "none" }} 
                  onChange={handleKycUpload}
                  accept=".jpg,.jpeg,.png,.pdf" 
                />
                <button 
                  className="btn btn-outline" 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploadingKyc}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {uploadingKyc ? <Loader2 size={16} className="spinner" /> : <UploadCloud size={16} />} 
                  {uploadingKyc ? "Uploading..." : "Upload Document"}
                </button>
              </div>

              {kycDocs.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--color-text-muted)" }}>UPLOADED DOCUMENTS</div>
                  {kycDocs.map((doc) => (
                    <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-3)", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-md)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <FileText size={18} color="var(--color-text-muted)" />
                        <span style={{ fontSize: "var(--font-size-sm)", fontWeight: "500", textTransform: "capitalize" }}>
                          {doc.document_type.replace('_', ' ')}
                        </span>
                      </div>
                      <span className={`badge ${doc.verification_status === 'verified' ? 'badge-success' : doc.verification_status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>
                        {doc.verification_status}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ padding: "var(--space-4)", textAlign: "center", border: "1px dashed var(--color-border-light)", borderRadius: "var(--radius-md)", color: "var(--color-text-muted)" }}>
                  No KYC documents uploaded yet.
                </div>
              )}
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
