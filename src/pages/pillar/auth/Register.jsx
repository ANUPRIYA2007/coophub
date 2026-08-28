import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { pillarAuthService } from "../../../services/pillar/authService";
import { ocrService } from "../../../services/pillar/ocrService";
import HeroInteractiveAgent from "../../../components/pillar/ai/HeroInteractiveAgent";
import { 
  Loader2, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, 
  Globe, ShieldCheck, FileText, UploadCloud, Lock, Sparkles, CheckCircle2 
} from "lucide-react";

export default function Register() {
  const { t, language, changeLanguage, supportedLanguages } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const { register } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [ocrProcessing, setOcrProcessing] = useState(false);
  const [error, setError] = useState(null);
  const [activeField, setActiveField] = useState(null);
  const [success, setSuccess] = useState(false);
  const [isResubmitting, setIsResubmitting] = useState(false);

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    mainServices: "",
    subServices: "",
    experience: "",
    serviceArea: "",
    preferredLanguage: "en",
    // Step 3: Government ID Verification fields
    documentType: "aadhaar", // 'aadhaar' | 'pan' | 'voter_id' | 'driving_licence' | 'other'
    customDocumentType: "",
    documentNumber: "",
    dob: "",
    documentFile: null,
    documentFileName: "",
    documentFileSize: "",
    documentPreviewUrl: null,
  });

  const [ocrPreview, setOcrPreview] = useState(null);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("resubmit") === "true") {
      setIsResubmitting(true);
      const email = params.get("email");
      if (email) {
        setFormData((prev) => ({ ...prev, email }));
      }
    }
  }, [location.search]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit. Please upload a smaller document.");
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    const sizeFormatted = (file.size / (1024 * 1024)).toFixed(2) + " MB";

    setFormData((prev) => ({
      ...prev,
      documentFile: file,
      documentFileName: file.name,
      documentFileSize: sizeFormatted,
      documentPreviewUrl: previewUrl,
    }));

    // Trigger PaddleOCR simulation pre-check
    setOcrProcessing(true);
    try {
      const extracted = await ocrService.extractDocumentInformation(file, formData.documentType, {
        fullName: formData.fullName,
        documentNumber: formData.documentNumber,
        serviceArea: formData.serviceArea,
        dob: formData.dob,
        customDocumentType: formData.customDocumentType
      });
      setOcrPreview(extracted);
    } catch (err) {
      console.warn("OCR preview notice:", err);
    } finally {
      setOcrProcessing(false);
    }
  };

  const nextToStep2 = () => {
    if (!formData.fullName.trim()) {
      setError("Please enter your Full Name");
      setActiveField("fullName");
      return;
    }
    if (!formData.email.trim()) {
      setError("Please enter your Email Address");
      setActiveField("email");
      return;
    }
    if (!formData.mobile.trim()) {
      setError("Please enter your Mobile Number");
      setActiveField("mobile");
      return;
    }
    if (!isResubmitting) {
      if (!formData.password.trim() || formData.password.length < 8) {
        setError("Password must be at least 8 characters");
        setActiveField("password");
        return;
      }
      if (formData.password !== formData.confirmPassword) {
        setError("Passwords do not match");
        setActiveField("confirmPassword");
        return;
      }
    }
    setError(null);
    setActiveField(null);
    setStep(2);
  };

  const nextToStep3 = () => {
    if (!formData.mainServices) {
      setError("Please select your primary trade service");
      setActiveField("mainServices");
      return;
    }
    if (!formData.experience) {
      setError("Please select your years of experience");
      setActiveField("experience");
      return;
    }
    if (!formData.serviceArea.trim()) {
      setError("Please specify your service area or pincodes");
      setActiveField("serviceArea");
      return;
    }
    setError(null);
    setActiveField(null);
    setStep(3);
  };

  const handleRegister = async (e) => {
    e.preventDefault();

    if (!formData.documentFileName && !formData.documentPreviewUrl) {
      setError("Please upload your Government Identity Document for verification");
      return;
    }

    setLoading(true);

    if (isResubmitting) {
      const res = await pillarAuthService.resubmitVerification(formData.email, {
        ...formData,
        mainServices: [formData.mainServices],
        subServices: formData.subServices ? formData.subServices.split(",").map((s) => s.trim()).filter(Boolean) : [],
      });
      setLoading(false);
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || "Failed to resubmit application.");
      }
      return;
    }

    const { user, error: regError } = await register({
      ...formData,
      mainServices: [formData.mainServices],
      subServices: formData.subServices ? formData.subServices.split(",").map((s) => s.trim()).filter(Boolean) : [],
    });

    setLoading(false);

    if (regError) {
      setError(regError.message || t("common.error"));
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "linear-gradient(135deg, #050A12 0%, #162238 100%)", padding: "var(--space-4)" }}>
        <div className="card" style={{ maxWidth: "560px", width: "100%", textAlign: "center", padding: "36px", borderRadius: "24px", background: "white", boxShadow: "0 20px 40px rgba(0,0,0,0.5)" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "rgba(245, 124, 32, 0.12)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto var(--space-4)",
              color: "#FF7900"
            }}
          >
            <ShieldCheck size={48} />
          </div>

          <h2 style={{ fontSize: "1.6rem", fontWeight: "900", color: "#0B1220", margin: "0 0 8px" }}>
            Registration Submitted Successfully
          </h2>

          <div style={{ display: "inline-block", background: "rgba(245, 158, 11, 0.15)", color: "#B45309", padding: "4px 14px", borderRadius: "12px", fontSize: "0.85rem", fontWeight: "800", textTransform: "uppercase", marginBottom: "16px" }}>
            Status: PENDING_VERIFICATION
          </div>

          <p style={{ color: "#475569", marginTop: "4px", marginBottom: "24px", lineHeight: "1.6", fontSize: "0.95rem" }}>
            Your application details and government identity document have been submitted for PaddleOCR inspection and administrative clearance. Once verified by Cooperative Administration, your unique Pillar ID will be activated and sent to your email.
          </p>

          <Link to="/pillar/login" className="btn btn-primary btn-lg" style={{ width: "100%", background: "#FF7900", color: "white", padding: "14px", fontWeight: "800", borderRadius: "10px" }}>
            Proceed to Pillar Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #050A12 0%, #162238 50%, #050A12 100%)",
        alignItems: "stretch",
      }}
    >
      {/* Top Language Bar */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          right: "24px",
          zIndex: 10,
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "rgba(255, 255, 255, 0.1)",
          padding: "6px 12px",
          borderRadius: "9999px",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(255, 255, 255, 0.15)",
        }}
      >
        <Globe size={16} color="white" />
        <select
          value={language}
          onChange={(e) => changeLanguage(e.target.value)}
          style={{
            background: "transparent",
            color: "white",
            border: "none",
            fontSize: "13px",
            fontWeight: "600",
            cursor: "pointer",
            outline: "none",
          }}
        >
          {supportedLanguages.map((lang) => (
            <option key={lang.code} value={lang.code} style={{ color: "black" }}>
              {lang.nativeName}
            </option>
          ))}
        </select>
      </div>

      {/* Main Container */}
      <div
        style={{
          width: "100%",
          maxWidth: "1300px",
          margin: "0 auto",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "var(--space-6)",
          gap: "var(--space-8)",
        }}
      >
        {/* Left: Interactive Hero Mascot Assistant */}
        <div style={{ flex: 1.1, display: "flex", justifyContent: "center" }} className="hide-on-mobile">
          <HeroInteractiveAgent
            mode="register"
            currentStep={step}
            activeField={activeField}
            customData={formData}
          />
        </div>

        {/* Right: Registration Form Card */}
        <div style={{ flex: 0.95, maxWidth: "560px", width: "100%" }}>
          <div
            className="card"
            style={{
              padding: "36px",
              borderRadius: "24px",
              background: "white",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
              border: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            {/* Step Progress Bar */}
            <div style={{ marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                <span style={{ fontSize: "12px", fontWeight: "800", color: "#FF7900", textTransform: "uppercase", letterSpacing: "1px" }}>
                  {isResubmitting ? "Verification Resubmission" : `Step ${step} of 3`}
                </span>
                <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: "600" }}>
                  {step === 1 ? "Personal Profile" : step === 2 ? "Trade & Competency" : "Government ID Verification"}
                </span>
              </div>
              <div style={{ height: "6px", background: "#E2E8F0", borderRadius: "9999px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(step / 3) * 100}%`,
                    background: "linear-gradient(90deg, #FF7900 0%, #E66A00 100%)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.6rem", fontWeight: "900", color: "var(--color-text)", margin: 0 }}>
                {step === 1 ? "Join the Cooperative Workforce" : step === 2 ? "Professional Trade & Area" : "Government ID Verification"}
              </h2>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "13.5px", marginTop: "4px", margin: 0 }}>
                {step === 1
                  ? "Create your technician account to receive bookings."
                  : step === 2
                  ? "Select your core skill trade and operating zones."
                  : "Upload government identity document for KYC verification."}
              </p>
            </div>

            {/* Error Notification */}
            {error && (
              <div
                style={{
                  background: "var(--color-error-bg)",
                  color: "var(--color-error)",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "13px",
                  fontWeight: "500",
                  border: "1px solid rgba(239, 68, 68, 0.2)",
                  animation: "slideInRight 0.2s ease",
                }}
              >
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            {/* STEP 1: Personal Profile */}
            {step === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">{t("auth.fullName")} <span className="required">*</span></label>
                  <input
                    type="text"
                    name="fullName"
                    className="form-input"
                    placeholder="e.g. Senthil Kumar"
                    value={formData.fullName}
                    onChange={handleInputChange}
                    onFocus={() => setActiveField("fullName")}
                    onBlur={() => setActiveField(null)}
                    required
                  />
                </div>

                <div className="grid grid-2" style={{ gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">{t("auth.email")} <span className="required">*</span></label>
                    <input
                      type="email"
                      name="email"
                      className="form-input"
                      placeholder="senthil@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      onFocus={() => setActiveField("email")}
                      onBlur={() => setActiveField(null)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t("auth.mobile")} <span className="required">*</span></label>
                    <input
                      type="tel"
                      name="mobile"
                      className="form-input"
                      placeholder="9840123456"
                      value={formData.mobile}
                      onChange={handleInputChange}
                      onFocus={() => setActiveField("mobile")}
                      onBlur={() => setActiveField(null)}
                      required
                    />
                  </div>
                </div>

                {!isResubmitting && (
                  <div className="grid grid-2" style={{ gap: "16px" }}>
                    <div className="form-group">
                      <label className="form-label">{t("auth.password")} <span className="required">*</span></label>
                      <input
                        type="password"
                        name="password"
                        className="form-input"
                        placeholder="Minimum 8 chars"
                        value={formData.password}
                        onChange={handleInputChange}
                        onFocus={() => setActiveField("password")}
                        onBlur={() => setActiveField(null)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">{t("auth.confirmPassword")} <span className="required">*</span></label>
                      <input
                        type="password"
                        name="confirmPassword"
                        className="form-input"
                        placeholder="Confirm password"
                        value={formData.confirmPassword}
                        onChange={handleInputChange}
                        onFocus={() => setActiveField("confirmPassword")}
                        onBlur={() => setActiveField(null)}
                        required
                      />
                    </div>
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">{t("auth.preferredLanguage")}</label>
                  <select name="preferredLanguage" className="form-input" value={formData.preferredLanguage} onChange={handleInputChange}>
                    <option value="en">English</option>
                    <option value="ta">Tamil (தமிழ்)</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                    <option value="te">Telugu (తెలుగు)</option>
                    <option value="kn">Kannada (ಕನ್ನಡ)</option>
                  </select>
                </div>

                <button type="button" className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: "6px", background: "#FF7900" }} onClick={nextToStep2}>
                  Next: Trade & Skills <ArrowRight size={18} />
                </button>
              </div>
            )}

            {/* STEP 2: Trade & Competency */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">{t("auth.mainServices")} <span className="required">*</span></label>
                  <select
                    name="mainServices"
                    className="form-input"
                    value={formData.mainServices}
                    onChange={handleInputChange}
                    onFocus={() => setActiveField("mainServices")}
                    onBlur={() => setActiveField(null)}
                    required
                  >
                    <option value="">Select your core trade...</option>
                    <option value="Electrician">Electrician (Home & Industrial)</option>
                    <option value="Plumber">Plumber (Piping & Sanitary)</option>
                    <option value="Carpenter">Carpenter & Woodwork</option>
                    <option value="AC Repair">AC & HVAC Technician</option>
                    <option value="Painter">Painter & Waterproofing</option>
                    <option value="Cleaner">Deep Cleaning Specialist</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">{t("auth.subServices")}</label>
                  <input
                    type="text"
                    name="subServices"
                    className="form-input"
                    placeholder="e.g. Wiring, DB Box, Fan Repair, Inverter"
                    value={formData.subServices}
                    onChange={handleInputChange}
                    onFocus={() => setActiveField("subServices")}
                    onBlur={() => setActiveField(null)}
                  />
                  <span className="form-hint">Comma separated list of specific trade skills</span>
                </div>

                <div className="grid grid-2" style={{ gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">{t("auth.experience")} <span className="required">*</span></label>
                    <select
                      name="experience"
                      className="form-input"
                      value={formData.experience}
                      onChange={handleInputChange}
                      onFocus={() => setActiveField("experience")}
                      onBlur={() => setActiveField(null)}
                      required
                    >
                      <option value="">Select years...</option>
                      <option value="1-2">1-2 Years</option>
                      <option value="3-5">3-5 Years</option>
                      <option value="5-10">5-10 Years</option>
                      <option value="10+">10+ Years (Senior Master)</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label className="form-label">{t("auth.serviceArea")} <span className="required">*</span></label>
                    <input
                      type="text"
                      name="serviceArea"
                      className="form-input"
                      placeholder="e.g. Guindy, Velachery, Adyar"
                      value={formData.serviceArea}
                      onChange={handleInputChange}
                      onFocus={() => setActiveField("serviceArea")}
                      onBlur={() => setActiveField(null)}
                      required
                    />
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(1)}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button type="button" className="btn btn-primary btn-lg" style={{ flex: 2, background: "#FF7900" }} onClick={nextToStep3}>
                    Next: Government ID <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: Government ID Verification */}
            {step === 3 && (
              <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Select Government Document <span className="required">*</span></label>
                  <select
                    name="documentType"
                    className="form-input"
                    value={formData.documentType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="aadhaar">🪪 Aadhaar Card</option>
                    <option value="pan">💳 PAN Card</option>
                    <option value="voter_id">🗳️ Voter ID</option>
                    <option value="driving_licence">🚗 Driving Licence</option>
                    <option value="other">📑 Other Government ID</option>
                  </select>
                </div>

                {formData.documentType === "other" && (
                  <div className="form-group">
                    <label className="form-label">Specify Document Title <span className="required">*</span></label>
                    <input
                      type="text"
                      name="customDocumentType"
                      className="form-input"
                      placeholder="e.g. Passport, State Trade ID"
                      value={formData.customDocumentType}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                )}

                <div className="grid grid-2" style={{ gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">Document Number</label>
                    <input
                      type="text"
                      name="documentNumber"
                      className="form-input"
                      placeholder={formData.documentType === 'pan' ? 'ABCDE1234F' : 'e.g. 4892 1234 5678'}
                      value={formData.documentNumber}
                      onChange={handleInputChange}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Date of Birth</label>
                    <input
                      type="date"
                      name="dob"
                      className="form-input"
                      value={formData.dob}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                {/* Secure File Upload Zone */}
                <div className="form-group">
                  <label className="form-label">Upload Identity Document (Photo / PDF) <span className="required">*</span></label>
                  <div
                    style={{
                      border: "2px dashed #CBD5E1",
                      borderRadius: "12px",
                      padding: "20px",
                      textAlign: "center",
                      background: formData.documentFileName ? "rgba(16, 185, 129, 0.05)" : "#F8FAFC",
                      borderColor: formData.documentFileName ? "#10B981" : "#CBD5E1",
                      position: "relative",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleFileUpload}
                      style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, bottom: 0,
                        opacity: 0,
                        cursor: "pointer",
                        width: "100%",
                        height: "100%"
                      }}
                    />

                    {formData.documentFileName ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "#059669" }}>
                        <CheckCircle2 size={24} />
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontWeight: "700", fontSize: "0.9rem" }}>{formData.documentFileName}</div>
                          <div style={{ fontSize: "0.75rem", color: "#64748B" }}>Size: {formData.documentFileSize} • Ready for OCR inspection</div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <UploadCloud size={32} color="#FF7900" style={{ margin: "0 auto 8px" }} />
                        <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#0B1220" }}>
                          Click to browse or drag & drop document
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#64748B", marginTop: "4px" }}>
                          Supports JPG, PNG, PDF up to 10MB
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* Privacy & OCR Processing Info */}
                <div style={{ background: "#F1F5F9", borderRadius: "8px", padding: "10px 14px", display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: "#475569" }}>
                  <Lock size={14} color="#059669" />
                  <span>Your document is stored in a private, encrypted storage accessible exclusively to Cooperative Central Administration.</span>
                </div>

                {ocrProcessing && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#FF7900", fontSize: "0.85rem", fontWeight: "600" }}>
                    <Sparkles size={16} className="spin" />
                    <span>PaddleOCR analyzing document text...</span>
                  </div>
                )}

                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(2)} disabled={loading}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 2, background: "#FF7900" }} disabled={loading}>
                    {loading ? <Loader2 size={18} className="spinner" /> : isResubmitting ? "Resubmit Application" : "Submit for Verification"}
                  </button>
                </div>
              </form>
            )}

            {/* Footer */}
            <div style={{ marginTop: "24px", textAlign: "center", borderTop: "1px solid var(--color-border-light)", paddingTop: "16px" }}>
              <p style={{ fontSize: "13.5px", color: "var(--color-text-secondary)" }}>
                {t("auth.alreadyRegistered")}{" "}
                <Link to="/pillar/login" style={{ color: "#FF7900", fontWeight: "700" }}>
                  {t("auth.loginHere")}
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
          .hide-on-mobile { display: none !important; }
        }
      `}} />
    </div>
  );
}
