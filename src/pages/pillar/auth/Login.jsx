import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { pillarAuthService } from "../../../services/pillar/authService";
import HeroInteractiveAgent from "../../../components/pillar/ai/HeroInteractiveAgent";
import { ShieldCheck, ChevronRight, Loader2, AlertCircle, Eye, EyeOff, Globe, KeyRound, Clock } from "lucide-react";

export default function Login() {
  const { t, language, changeLanguage, supportedLanguages } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // 'password' (default) -> 'enter_id' (OTP) -> 'enter_otp'
  const [step, setStep] = useState("password"); 
  const [formData, setFormData] = useState({ pillarId: "", otp: "", password: "" });
  const [activeField, setActiveField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [rejectedInfo, setRejectedInfo] = useState(null);
  const [pendingInfo, setPendingInfo] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  // Pillar ID / Application Status Lookup States
  const [showLookup, setShowLookup] = useState(false);
  const [lookupInput, setLookupInput] = useState("");
  const [lookupLoading, setLookupLoading] = useState(false);
  const [lookupResult, setLookupResult] = useState(null);
  const [lookupError, setLookupError] = useState(null);

  const handleLookupPillarId = async (e) => {
    e?.preventDefault();
    if (!lookupInput.trim()) {
      setLookupError("Please enter your registered Email, Mobile, or Application ID");
      return;
    }
    setLookupLoading(true);
    setLookupError(null);
    setLookupResult(null);

    const res = await pillarAuthService.checkApplicationStatus(lookupInput);
    setLookupLoading(false);

    if (res.success) {
      setLookupResult(res.data);
    } else {
      setLookupError(res.error || "No technician application found with these details.");
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
    if (successMsg) setSuccessMsg(null);
    if (pendingInfo) setPendingInfo(null);
  };

  // Step 1: Send OTP or Check Status based on Pillar / Application ID
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.pillarId.trim()) {
      setError("Please enter your registered Pillar ID or Application ID");
      setActiveField("pillarId");
      return;
    }

    setLoading(true);
    setError(null);
    setPendingInfo(null);
    setRejectedInfo(null);

    const { success, error: otpError } = await pillarAuthService.loginWithOtp(formData.pillarId);
    setLoading(false);

    if (otpError) {
      if (otpError.isPending) {
        setPendingInfo({
          applicationId: otpError.applicationId,
          name: otpError.name,
          trade: otpError.trade,
          submittedAt: otpError.submittedAt
        });
      } else if (otpError.isRejected) {
        setRejectedInfo({
          reason: otpError.rejectionReason,
          email: otpError.email
        });
      } else {
        setError(otpError.message || "Failed to send OTP. Please check your Pillar ID.");
      }
    } else {
      setStep("enter_otp");
      setError(null);
      setSuccessMsg("OTP sent successfully to your registered email.");
    }
  };

  // Step 2: Verify OTP
  const handleVerifyOtp = async (e) => {
    e.preventDefault();
    if (!formData.otp.trim()) {
      setError("Please enter the 6-digit OTP code");
      setActiveField("otp");
      return;
    }

    setLoading(true);
    const { user, error: verifyError } = await pillarAuthService.verifyOtp(formData.pillarId, formData.otp);
    setLoading(false);

    if (verifyError) {
      setError(verifyError.message || t("auth.invalidOtp"));
    } else if (user) {
      navigate("/dashboard");
    }
  };

  // Resend OTP Action
  const handleResendOtp = async () => {
    setLoading(true);
    setError(null);
    setSuccessMsg(null);
    const { success, error: otpError } = await pillarAuthService.loginWithOtp(formData.pillarId);
    setLoading(false);

    if (otpError) {
      setError(otpError.message || "Failed to resend OTP.");
    } else {
      setSuccessMsg("OTP has been resent to your mobile.");
    }
  };

  // Fallback Step 3: Password Login if Admin requested
  const handlePasswordLogin = async (e) => {
    e.preventDefault();
    if (!formData.password.trim()) {
      setError("Please enter your Password");
      setActiveField("password");
      return;
    }

    setLoading(true);

    // 🧪 PILLAR DEMO BYPASS: Logs into Pillar Dashboard with rich demo data
    if (formData.pillarId === "PIL-CHE-042" && formData.password === "password123") {
      localStorage.setItem("coophub_demo_user", "true");
      localStorage.removeItem("coophub_demo_admin");
      setTimeout(() => {
        setLoading(false);
        navigate("/dashboard");
      }, 800);
      return;
    }

    // 🧪 ADMIN DEMO BYPASS: Logs into Admin Dashboard with rich demo data
    if (formData.pillarId === "ADMIN-DEMO" && formData.password === "admin123") {
      localStorage.setItem("coophub_demo_admin", "true");
      localStorage.removeItem("coophub_demo_user");
      setTimeout(() => {
        setLoading(false);
        navigate("/admin");
      }, 800);
      return;
    }

    // 🔒 REAL USER LOGIN — Clear all demo flags
    localStorage.removeItem("coophub_demo_user");
    localStorage.removeItem("coophub_demo_admin");

    // Assuming the login service can take the pillarId as 'email' or handles it internally
    const { user, error: loginError } = await login({
      email: formData.pillarId, // Mock mapping; real implementation depends on your auth provider
      password: formData.password,
    });
    setLoading(false);

    if (loginError) {
      if (loginError.isRejected) {
        setRejectedInfo({
          reason: loginError.rejectionReason,
          email: loginError.email || formData.pillarId
        });
      } else {
        setRejectedInfo(null);
      }
      setError(loginError.message || t("common.error"));
    } else if (user) {
      navigate("/dashboard");
    }
  };

  const resetToStart = () => {
    setStep("enter_id");
    setFormData({ ...formData, otp: "", password: "" });
    setError(null);
    setRejectedInfo(null);
    setSuccessMsg(null);
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #050A12 0%, #162238 50%, #050A12 100%)",
        alignItems: "stretch",
      }}
    >
      {/* Top Header Bar for Language Switching */}
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

      {/* Main Responsive Grid Container */}
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
            mode="login"
            activeField={activeField}
            formError={error}
          />
        </div>

        {/* Right: Login Card */}
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div
            className="card"
            style={{
              maxWidth: "480px",
              width: "100%",
              borderRadius: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)",
              background: "white",
              padding: "var(--space-8)",
            }}
          >
            {/* Header */}
            <div style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
              <img src="/assets/images/coophub-logo.jpg" alt="Logo" style={{ height: "54px", margin: "0 auto", borderRadius: "10px" }} />
              <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--color-primary)", marginTop: "12px" }}>
                {t("auth.pillarLogin")}
              </h2>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "13.5px", marginTop: "4px" }}>
                Access your assigned jobs, customer requests & earnings
              </p>
            </div>

            {/* Pending Application KYC Tracking Card */}
            {pendingInfo ? (
              <div
                style={{
                  background: "#FFFBEB",
                  border: "1.5px solid #F59E0B",
                  borderRadius: "16px",
                  padding: "20px",
                  marginBottom: "20px",
                  animation: "slideInRight 0.2s ease",
                  textAlign: "left",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#B45309", fontWeight: "800", fontSize: "0.95rem", marginBottom: "8px" }}>
                  <Clock size={20} />
                  <span>⏳ KYC Verification In Progress</span>
                </div>
                
                <div style={{ background: "white", padding: "12px 14px", borderRadius: "10px", border: "1px solid #FDE68A", marginBottom: "12px" }}>
                  <div style={{ fontSize: "0.72rem", color: "#64748B", textTransform: "uppercase", fontWeight: "800", letterSpacing: "0.5px" }}>Official Application ID</div>
                  <div style={{ fontSize: "1.25rem", color: "#FF7900", fontWeight: "900", fontFamily: "'Courier New', monospace" }}>{pendingInfo.applicationId}</div>
                  <div style={{ fontSize: "0.85rem", color: "#1E293B", fontWeight: "600", marginTop: "4px" }}>
                    Applicant: <strong>{pendingInfo.name}</strong> • {pendingInfo.trade}
                  </div>
                </div>

                <div style={{ fontSize: "0.84rem", color: "#92400E", lineHeight: "1.5", marginBottom: "14px" }}>
                  Your registration details and government identity document are currently under administrative review. Once verified by the Cooperative Administration, your permanent <strong>Unique Pillar ID</strong> (e.g. <code>PIL-CHE-042</code>) will be activated and sent to your email.
                </div>

                <button
                  type="button"
                  onClick={() => setPendingInfo(null)}
                  style={{ width: "100%", background: "#F59E0B", color: "white", padding: "10px", borderRadius: "8px", fontWeight: "700", border: "none", cursor: "pointer", fontSize: "0.85rem" }}
                >
                  Dismiss Status
                </button>
              </div>
            ) : rejectedInfo ? (
              <div
                style={{
                  background: "#FEF2F2",
                  border: "1px solid #EF4444",
                  borderRadius: "16px",
                  padding: "18px 20px",
                  marginBottom: "20px",
                  animation: "slideInRight 0.2s ease",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#DC2626", fontWeight: "800", fontSize: "0.95rem", marginBottom: "6px" }}>
                  <AlertCircle size={20} />
                  <span>❌ Verification Rejected</span>
                </div>
                <div style={{ fontSize: "0.82rem", color: "#64748B", textTransform: "uppercase", fontWeight: "700", marginBottom: "2px" }}>
                  Reason for rejection:
                </div>
                <div style={{ fontSize: "0.9rem", color: "#991B1B", fontWeight: "600", marginBottom: "14px", lineHeight: "1.5" }}>
                  {rejectedInfo.reason || error}
                </div>
                <Link
                  to={`/pillar/register?resubmit=true&email=${encodeURIComponent(rejectedInfo.email || formData.pillarId)}`}
                  className="btn btn-primary"
                  style={{ display: "block", textAlign: "center", background: "#FF7900", color: "white", padding: "10px 16px", fontSize: "0.85rem", fontWeight: "800", borderRadius: "8px", textDecoration: "none" }}
                >
                  REVIEW & RESUBMIT
                </Link>
              </div>
            ) : error ? (
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
            ) : null}

            {/* Success Notification */}
            {successMsg && (
              <div
                style={{
                  background: "rgba(16, 185, 129, 0.1)",
                  color: "#059669",
                  padding: "10px 14px",
                  borderRadius: "12px",
                  marginBottom: "16px",
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                  fontSize: "13px",
                  fontWeight: "600",
                  border: "1px solid rgba(16, 185, 129, 0.2)",
                  animation: "slideInRight 0.2s ease",
                }}
              >
                <ShieldCheck size={18} />
                <span>{successMsg}</span>
              </div>
            )}

            {/* Demo Credentials Box */}
            <div
              style={{
                background: "var(--color-surface-hover)",
                border: "1px dashed var(--color-border)",
                padding: "12px",
                borderRadius: "12px",
                marginBottom: "20px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
              }}
            >
              <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                🧪 Demo Access
              </div>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setFormData({ ...formData, pillarId: "PIL-CHE-042", password: "password123" });
                    setStep("password_fallback");
                    setError(null);
                  }}
                  style={{
                    flex: 1,
                    background: "white",
                    border: "1px solid var(--color-border)",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "12px",
                    fontWeight: "600",
                    cursor: "pointer",
                    color: "var(--color-primary)",
                    transition: "all 0.2s",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.borderColor = "var(--color-secondary)")}
                  onMouseLeave={(e) => (e.currentTarget.style.borderColor = "var(--color-border)")}
                >
                  Auto-fill Demo Pillar
                </button>
              </div>
            </div>

            {/* Login Mode Selector Tabs */}
            <div style={{ display: "flex", background: "var(--color-surface-hover)", padding: "4px", borderRadius: "12px", marginBottom: "14px", border: "1px solid var(--color-border)" }}>
              <button
                type="button"
                onClick={() => {
                  setStep("password");
                  setError(null);
                }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: step === "password" || step === "password_fallback" ? "var(--color-surface)" : "transparent",
                  color: step === "password" || step === "password_fallback" ? "var(--color-primary)" : "var(--color-text-secondary)",
                  fontWeight: step === "password" || step === "password_fallback" ? "800" : "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: step === "password" || step === "password_fallback" ? "var(--shadow-sm)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                🔑 Pillar ID & Password
              </button>
              <button
                type="button"
                onClick={() => {
                  setStep("enter_id");
                  setError(null);
                }}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "none",
                  background: step === "enter_id" || step === "enter_otp" ? "var(--color-surface)" : "transparent",
                  color: step === "enter_id" || step === "enter_otp" ? "var(--color-primary)" : "var(--color-text-secondary)",
                  fontWeight: step === "enter_id" || step === "enter_otp" ? "800" : "600",
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: step === "enter_id" || step === "enter_otp" ? "var(--shadow-sm)" : "none",
                  transition: "all 0.2s ease"
                }}
              >
                📱 OTP Login
              </button>
            </div>

            {/* Instant Pillar ID Finder / Application Status Tracker Toggle */}
            <div style={{ marginBottom: "16px", textAlign: "right" }}>
              <button
                type="button"
                onClick={() => {
                  setShowLookup(!showLookup);
                  setLookupError(null);
                  setLookupResult(null);
                }}
                style={{
                  background: "transparent",
                  border: "none",
                  color: "#FF7900",
                  fontSize: "12.5px",
                  fontWeight: "700",
                  cursor: "pointer",
                  textDecoration: "underline",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                {showLookup ? "✕ Close ID Lookup" : "🔍 Don't know your Pillar ID? Find / Check Status"}
              </button>
            </div>

            {/* Instant Pillar ID Lookup Interactive Card */}
            {showLookup && (
              <div
                style={{
                  background: "#F8FAFC",
                  border: "1.5px solid #CBD5E1",
                  borderRadius: "14px",
                  padding: "14px 16px",
                  marginBottom: "18px",
                  animation: "slideInRight 0.2s ease"
                }}
              >
                <div style={{ fontSize: "13px", fontWeight: "800", color: "#0F172A", marginBottom: "6px" }}>
                  🔍 Find Your Assigned Pillar ID
                </div>
                <p style={{ fontSize: "12px", color: "#64748B", marginBottom: "10px" }}>
                  Enter your registered Email or Mobile number to check your approval status and retrieve your ID.
                </p>

                <form onSubmit={handleLookupPillarId} style={{ display: "flex", gap: "8px", marginBottom: "8px" }}>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. anupriyarajaraman07@gmail.com"
                    value={lookupInput}
                    onChange={(e) => setLookupInput(e.target.value)}
                    style={{ fontSize: "12.5px", padding: "8px 10px", flex: 1 }}
                    required
                  />
                  <button
                    type="submit"
                    className="btn btn-primary"
                    disabled={lookupLoading}
                    style={{ padding: "8px 14px", fontSize: "12px", fontWeight: "700", background: "#0F172A", color: "white", whiteSpace: "nowrap" }}
                  >
                    {lookupLoading ? "Searching..." : "Lookup"}
                  </button>
                </form>

                {lookupError && (
                  <div style={{ color: "#DC2626", fontSize: "12px", fontWeight: "600", marginTop: "6px" }}>
                    ❌ {lookupError}
                  </div>
                )}

                {lookupResult && (
                  <div style={{ background: "white", borderRadius: "10px", padding: "12px", border: "1px solid #E2E8F0", marginTop: "10px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontSize: "11px", fontWeight: "800", color: "#64748B", textTransform: "uppercase" }}>Registration Match</span>
                      <span style={{ 
                        fontSize: "11px", 
                        fontWeight: "800", 
                        padding: "2px 8px", 
                        borderRadius: "10px", 
                        background: lookupResult.status === "verified" ? "#DCFCE7" : "#FEF3C7", 
                        color: lookupResult.status === "verified" ? "#15803D" : "#B45309" 
                      }}>
                        {lookupResult.status === "verified" ? "✅ APPROVED & ACTIVE" : "⏳ UNDER VERIFICATION"}
                      </span>
                    </div>

                    <div style={{ fontSize: "13px", fontWeight: "700", color: "#0F172A" }}>
                      {lookupResult.name} • {lookupResult.trade}
                    </div>

                    {lookupResult.pillarCode ? (
                      <div style={{ marginTop: "8px", padding: "8px 10px", background: "#FFF7ED", border: "1px solid #FFEDD5", borderRadius: "8px" }}>
                        <div style={{ fontSize: "11px", color: "#C2410C", fontWeight: "700" }}>Your Unique Pillar ID:</div>
                        <div style={{ fontSize: "1.2rem", fontWeight: "900", color: "#EA580C", fontFamily: "monospace" }}>
                          {lookupResult.pillarCode}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setFormData((prev) => ({ ...prev, pillarId: lookupResult.pillarCode }));
                            setShowLookup(false);
                          }}
                          style={{
                            marginTop: "6px",
                            width: "100%",
                            background: "#EA580C",
                            color: "white",
                            border: "none",
                            borderRadius: "6px",
                            padding: "6px",
                            fontSize: "12px",
                            fontWeight: "800",
                            cursor: "pointer"
                          }}
                        >
                          Use {lookupResult.pillarCode} to Log In
                        </button>
                      </div>
                    ) : (
                      <div style={{ marginTop: "6px", fontSize: "12px", color: "#B45309" }}>
                        Application ID: <strong>{lookupResult.applicationId}</strong> (Clearance pending by Admin)
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Step 1: Default Direct Password Login Form */}
            {(step === "password" || step === "password_fallback") && (
              <form onSubmit={handlePasswordLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Pillar ID / Registered Email / Mobile <span className="required">*</span></label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      name="pillarId"
                      className="form-input"
                      placeholder="e.g. PIL-CHE-044, email, or mobile"
                      value={formData.pillarId}
                      onChange={handleInputChange}
                      onFocus={() => setActiveField("pillarId")}
                      onBlur={() => setActiveField(null)}
                      required
                    />
                  </div>
                </div>

                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className="form-label">{t("auth.password")} <span className="required">*</span></label>
                  </div>
                  <div className="input-wrapper">
                    <KeyRound size={18} className="input-icon" style={{ left: "12px" }} />
                    <input
                      type={showPassword ? "text" : "password"}
                      name="password"
                      className="form-input"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleInputChange}
                      onFocus={() => setActiveField("password")}
                      onBlur={() => setActiveField(null)}
                      style={{ paddingLeft: "38px" }}
                      required
                    />
                    <button
                      type="button"
                      className="input-icon"
                      style={{ left: "auto", right: "12px" }}
                      onClick={() => setShowPassword(!showPassword)}
                      tabIndex={-1}
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: "4px", background: "linear-gradient(135deg, #FF7900 0%, #E05300 100%)", fontWeight: "800" }} disabled={loading}>
                  {loading ? <Loader2 size={18} className="spinner" /> : "Sign In to Pillar Dashboard"}
                </button>
              </form>
            )}

            {/* Step 2: OTP Login - Enter ID */}
            {step === "enter_id" && (
              <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Pillar ID or Application ID <span className="required">*</span></label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      name="pillarId"
                      className="form-input"
                      placeholder="e.g. PIL-CHE-043"
                      value={formData.pillarId}
                      onChange={handleInputChange}
                      onFocus={() => setActiveField("pillarId")}
                      onBlur={() => setActiveField(null)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: "4px", background: "#FF7900", fontWeight: "800" }} disabled={loading}>
                  {loading ? <Loader2 size={18} className="spinner" /> : "Send OTP"}
                </button>
              </form>
            )}

            {/* Step 3: OTP Verification Form */}
            {step === "enter_otp" && (
              <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ textAlign: "center", marginBottom: "4px" }}>
                  <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                    OTP sent to registered email for ID: <strong>{formData.pillarId}</strong>
                  </p>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={() => setStep("enter_id")}
                    style={{ color: "var(--color-secondary)", marginTop: "2px" }}
                  >
                    Change Pillar ID
                  </button>
                </div>

                <div className="form-group">
                  <label className="form-label">{t("auth.enterOtp")}</label>
                  <input
                    type="text"
                    name="otp"
                    className="form-input"
                    placeholder="123456"
                    value={formData.otp}
                    onChange={handleInputChange}
                    onFocus={() => setActiveField("otp")}
                    onBlur={() => setActiveField(null)}
                    style={{ textAlign: "center", letterSpacing: "8px", fontSize: "1.4rem", fontWeight: "bold" }}
                    maxLength={6}
                    required
                  />
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%" }} disabled={loading}>
                  {loading ? <Loader2 size={18} className="spinner" /> : t("auth.verifyOtp")}
                </button>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "8px", alignItems: "center" }}>
                  <button
                    type="button"
                    onClick={handleResendOtp}
                    disabled={loading}
                    style={{ background: "transparent", border: "none", color: "var(--color-secondary)", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                  >
                    Resend OTP
                  </button>
                </div>
              </form>
            )}

            {/* Footer */}
            <div style={{ marginTop: "24px", textAlign: "center", borderTop: "1px solid var(--color-border-light)", paddingTop: "16px" }}>
              <p style={{ fontSize: "13.5px", color: "var(--color-text-secondary)" }}>
                {t("auth.newPillar")}{" "}
                <Link to="/pillar/register" style={{ color: "var(--color-secondary)", fontWeight: "700" }}>
                  {t("auth.registerHere")}
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
