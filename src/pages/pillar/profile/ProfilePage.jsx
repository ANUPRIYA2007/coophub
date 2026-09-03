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
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [ocrResult, setOcrResult] = useState(null);
  const [ocrError, setOcrError] = useState(null);
  const [pipelineStage, setPipelineStage] = useState(null);
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
    setOcrProcessing(true);
    setOcrResult(null);
    setOcrError(null);
    setPipelineStage('UPLOADING');

    try {
      // 1. Upload the file first
      setPipelineStage('UPLOADING');
      const { data: uploadedDoc } = await pillarProfileService.uploadKycDocument(user.id, selectedDocType, file);
      if (uploadedDoc) {
        setKycDocs(prev => [uploadedDoc, ...prev]);
      }

      // 2. Read file as base64 for OCR
      setPipelineStage('PREPROCESSING');
      const base64 = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // 3. Send to server-side OCR pipeline
      setPipelineStage('OCR_PROCESSING');
      const ocrRes = await fetch('/api/ai/process-document', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: base64,
          documentCategory: selectedDocType === 'skill_certificate' ? 'skill_certificate' : 'identity',
          expectedDocumentType: selectedDocType,
          pillarProfile: {
            id: user.id,
            full_name: profile?.full_name || formData.fullName,
            dob: profile?.dob,
            mobile: profile?.mobile || formData.mobile,
            main_services: profile?.main_services || formData.mainService
          }
        })
      });

      const ocrData = await ocrRes.json();

      if (ocrData.success) {
        setPipelineStage('COMPLETE');
        setOcrResult(ocrData);
        setOcrError(null);
      } else {
        setPipelineStage('FAILED');
        setOcrError(ocrData.error || 'OCR extraction failed');
        setOcrResult(null);
      }
    } catch (err) {
      setPipelineStage('FAILED');
      setOcrError(err.message || 'Document processing failed');
      setOcrResult(null);
    } finally {
      setUploadingKyc(false);
      setOcrProcessing(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
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
                Upload official documents to maintain your "Verified Pillar" badge. Documents are processed with real OCR extraction.
              </p>
              
              <div style={{ display: "flex", gap: "var(--space-4)", marginBottom: "var(--space-4)", flexWrap: "wrap" }}>
                <select 
                  className="form-input" 
                  value={selectedDocType} 
                  onChange={(e) => setSelectedDocType(e.target.value)}
                  style={{ width: "200px" }}
                >
                  <option value="aadhaar">Aadhaar Card</option>
                  <option value="pan">PAN Card</option>
                  <option value="voter_id">Voter ID</option>
                  <option value="skill_certificate">Skill Certificate</option>
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
                  disabled={uploadingKyc || ocrProcessing}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  {(uploadingKyc || ocrProcessing) ? <Loader2 size={16} className="spinner" /> : <UploadCloud size={16} />} 
                  {uploadingKyc ? "Processing..." : "Upload & Extract"}
                </button>
              </div>

              {/* Pipeline Processing Status */}
              {pipelineStage && pipelineStage !== 'COMPLETE' && pipelineStage !== 'FAILED' && (
                <div style={{ 
                  padding: "var(--space-4)", 
                  background: "rgba(245, 124, 32, 0.08)", 
                  border: "1px solid rgba(245, 124, 32, 0.3)", 
                  borderRadius: "var(--radius-md)", 
                  marginBottom: "var(--space-4)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px"
                }}>
                  <Loader2 size={18} className="spinner" style={{ color: "#FF7900" }} />
                  <div>
                    <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "var(--color-text)" }}>
                      {pipelineStage === 'UPLOADING' && 'Uploading document...'}
                      {pipelineStage === 'PREPROCESSING' && 'Preprocessing image (grayscale, contrast, sharpen)...'}
                      {pipelineStage === 'OCR_PROCESSING' && 'Running OCR text extraction...'}
                    </div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                      Server-side processing with image optimization for best accuracy
                    </div>
                  </div>
                </div>
              )}

              {/* OCR Error Display */}
              {ocrError && (
                <div style={{ 
                  padding: "var(--space-4)", 
                  background: "rgba(239, 68, 68, 0.08)", 
                  border: "1px solid rgba(239, 68, 68, 0.3)", 
                  borderRadius: "var(--radius-md)", 
                  marginBottom: "var(--space-4)"
                }}>
                  <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "#EF4444", marginBottom: "4px" }}>
                    ⚠️ Document Extraction Failed
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
                    {ocrError}
                  </div>
                </div>
              )}

              {/* OCR Success Result Display */}
              {ocrResult && ocrResult.success && (
                <div style={{ 
                  border: "1px solid rgba(16, 185, 129, 0.3)", 
                  borderRadius: "var(--radius-lg)", 
                  overflow: "hidden",
                  marginBottom: "var(--space-4)"
                }}>
                  {/* Header */}
                  <div style={{ 
                    padding: "12px 16px", 
                    background: "rgba(16, 185, 129, 0.08)", 
                    display: "flex", 
                    justifyContent: "space-between", 
                    alignItems: "center" 
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <CheckCircle2 size={16} color="#10B981" />
                      <span style={{ fontWeight: "700", fontSize: "0.85rem", color: "#10B981" }}>
                        OCR Extraction Complete
                      </span>
                    </div>
                    <span style={{ 
                      padding: "2px 8px", 
                      borderRadius: "8px", 
                      fontSize: "0.72rem", 
                      fontWeight: "800",
                      background: ocrResult.ocr?.confidence >= 70 ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                      color: ocrResult.ocr?.confidence >= 70 ? "#10B981" : "#F59E0B"
                    }}>
                      Confidence: {ocrResult.ocr?.confidence || 0}%
                    </span>
                  </div>

                  {/* Extracted Fields */}
                  <div style={{ padding: "14px 16px" }}>
                    <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--color-text-muted)", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "8px" }}>
                      Extracted Fields
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                      {ocrResult.fields?.name && (
                        <div style={{ fontSize: "0.82rem" }}>
                          <span style={{ color: "var(--color-text-muted)" }}>Name: </span>
                          <strong>{ocrResult.fields.name}</strong>
                        </div>
                      )}
                      {ocrResult.fields?.documentNumberMasked && (
                        <div style={{ fontSize: "0.82rem" }}>
                          <span style={{ color: "var(--color-text-muted)" }}>Doc No: </span>
                          <strong style={{ fontFamily: "monospace" }}>{ocrResult.fields.documentNumberMasked}</strong>
                        </div>
                      )}
                      {ocrResult.fields?.dateOfBirth && (
                        <div style={{ fontSize: "0.82rem" }}>
                          <span style={{ color: "var(--color-text-muted)" }}>DOB: </span>
                          <strong>{ocrResult.fields.dateOfBirth}</strong>
                        </div>
                      )}
                      {ocrResult.fields?.gender && (
                        <div style={{ fontSize: "0.82rem" }}>
                          <span style={{ color: "var(--color-text-muted)" }}>Gender: </span>
                          <strong>{ocrResult.fields.gender}</strong>
                        </div>
                      )}
                      {ocrResult.documentType && (
                        <div style={{ fontSize: "0.82rem" }}>
                          <span style={{ color: "var(--color-text-muted)" }}>Type: </span>
                          <strong style={{ textTransform: "capitalize" }}>{ocrResult.documentType.replace('_', ' ')}</strong>
                        </div>
                      )}
                    </div>
                    {ocrResult.fields?.address && (
                      <div style={{ fontSize: "0.82rem", marginTop: "6px" }}>
                        <span style={{ color: "var(--color-text-muted)" }}>Address: </span>
                        <span>{ocrResult.fields.address}</span>
                      </div>
                    )}

                    {/* Raw OCR Text (collapsible) */}
                    <details style={{ marginTop: "10px" }}>
                      <summary style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--color-text-muted)", cursor: "pointer" }}>
                        View Raw OCR Text ({ocrResult.ocr?.cleanText?.length || 0} chars)
                      </summary>
                      <pre style={{ 
                        fontSize: "0.72rem", 
                        background: "var(--color-surface-hover)", 
                        padding: "8px", 
                        borderRadius: "6px", 
                        marginTop: "6px",
                        whiteSpace: "pre-wrap",
                        wordBreak: "break-word",
                        maxHeight: "120px",
                        overflow: "auto",
                        color: "var(--color-text-secondary)"
                      }}>
                        {ocrResult.ocr?.cleanText || ocrResult.ocr?.rawText || 'No text'}
                      </pre>
                    </details>
                  </div>

                  {/* Validation Status */}
                  <div style={{ 
                    padding: "8px 16px", 
                    borderTop: "1px solid var(--color-border-light)",
                    fontSize: "0.75rem",
                    color: "var(--color-text-secondary)",
                    display: "flex",
                    justifyContent: "space-between"
                  }}>
                    <span>Engine: {ocrResult.ocr?.engine || ocrResult.ocr_provider || 'PaddleOCR / NVIDIA Vision'}</span>
                    <span>Processing: {ocrResult.processingTimeMs || 0}ms</span>
                  </div>
                </div>
              )}

              {/* Uploaded Documents List */}
              {kycDocs.length > 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                  <div style={{ fontSize: "12px", fontWeight: "600", color: "var(--color-text-muted)" }}>UPLOADED DOCUMENTS</div>
                  {kycDocs.map((doc) => (
                    <div key={doc.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-3)", border: "1px solid var(--color-border-light)", borderRadius: "var(--radius-md)" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <FileText size={18} color="var(--color-text-muted)" />
                        <span style={{ fontSize: "var(--font-size-sm)", fontWeight: "500", textTransform: "capitalize" }}>
                          {(doc.document_type || 'document').replace('_', ' ')}
                        </span>
                      </div>
                      <span className={`badge ${doc.verification_status === 'verified' ? 'badge-success' : doc.verification_status === 'rejected' ? 'badge-error' : 'badge-warning'}`}>
                        {doc.verification_status || 'pending'}
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
