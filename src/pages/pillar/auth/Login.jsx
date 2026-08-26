import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { pillarAuthService } from "../../../services/pillar/authService";
import HeroInteractiveAgent from "../../../components/pillar/ai/HeroInteractiveAgent";
import { ShieldCheck, ChevronRight, Loader2, AlertCircle, Eye, EyeOff, Globe, KeyRound } from "lucide-react";

export default function Login() {
  const { t, language, changeLanguage, supportedLanguages } = useTranslation();
  const navigate = useNavigate();
  const { login } = useAuth();

  // 'enter_id' -> 'enter_otp' -> (optional fallback) 'password_fallback'
  const [step, setStep] = useState("enter_id"); 
  const [formData, setFormData] = useState({ pillarId: "", otp: "", password: "" });
  const [activeField, setActiveField] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMsg, setSuccessMsg] = useState(null);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
    if (successMsg) setSuccessMsg(null);
  };

  // Step 1: Send OTP based on Pillar ID
  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!formData.pillarId.trim()) {
      setError("Please enter your registered Pillar ID");
      setActiveField("pillarId");
      return;
    }

    setLoading(true);
    // Note: We use the pillarId as the identifier for OTP in the service
    const { success, error: otpError } = await pillarAuthService.loginWithOtp(formData.pillarId);
    setLoading(false);

    if (otpError) {
      setError(otpError.message || "Failed to send OTP. Please check your Pillar ID.");
    } else {
      setStep("enter_otp");
      setError(null);
      setSuccessMsg("OTP sent successfully to your registered mobile.");
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

    // 🧪 DEMO MOCK BYPASS: Allow seamless login for demo purposes without triggering Supabase errors
    if (formData.pillarId === "PIL-CHE-042" && formData.password === "password123") {
      setTimeout(() => {
        setLoading(false);
        navigate("/dashboard");
      }, 800);
      return;
    }

    // Assuming the login service can take the pillarId as 'email' or handles it internally
    const { user, error: loginError } = await login({
      email: formData.pillarId, // Mock mapping; real implementation depends on your auth provider
      password: formData.password,
    });
    setLoading(false);

    if (loginError) {
      setError(loginError.message || t("common.error"));
    } else if (user) {
      navigate("/dashboard");
    }
  };

  const resetToStart = () => {
    setStep("enter_id");
    setFormData({ ...formData, otp: "", password: "" });
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
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

            {/* Step 1: Enter Pillar ID */}
            {step === "enter_id" && (
              <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Pillar ID</label>
                  <div className="input-wrapper">
                    <input
                      type="text"
                      name="pillarId"
                      className="form-input"
                      placeholder="e.g. PIL-CHE-042"
                      value={formData.pillarId}
                      onChange={handleInputChange}
                      onFocus={() => setActiveField("pillarId")}
                      onBlur={() => setActiveField(null)}
                      required
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: "4px" }} disabled={loading}>
                  {loading ? <Loader2 size={18} className="spinner" /> : "Send OTP"}
                </button>
              </form>
            )}

            {/* Step 2: OTP Verification Form */}
            {step === "enter_otp" && (
              <form onSubmit={handleVerifyOtp} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ textAlign: "center", marginBottom: "4px" }}>
                  <p style={{ fontSize: "13px", color: "var(--color-text-secondary)" }}>
                    OTP sent to registered mobile for ID: <strong>{formData.pillarId}</strong>
                  </p>
                  <button
                    type="button"
                    className="btn btn-ghost btn-sm"
                    onClick={resetToStart}
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
                  <button
                    type="button"
                    onClick={() => setStep("password_fallback")}
                    style={{ background: "transparent", border: "none", color: "#F87171", fontSize: "12px", fontWeight: "600", cursor: "pointer" }}
                  >
                    Request Admin (OTP not received?)
                  </button>
                </div>
              </form>
            )}

            {/* Fallback Step 3: Password Login */}
            {step === "password_fallback" && (
              <form onSubmit={handlePasswordLogin} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ textAlign: "center", marginBottom: "4px", padding: "10px", background: "rgba(248, 113, 113, 0.1)", borderRadius: "8px", border: "1px solid rgba(248, 113, 113, 0.2)" }}>
                  <p style={{ fontSize: "12px", color: "#DC2626", fontWeight: "600" }}>
                    Admin approved fallback login for Pillar ID: {formData.pillarId}
                  </p>
                </div>

                <div className="form-group">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <label className="form-label">{t("auth.password")}</label>
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

                <button type="submit" className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: "4px" }} disabled={loading}>
                  {loading ? <Loader2 size={18} className="spinner" /> : t("common.login")}
                </button>

                <div style={{ textAlign: "center", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setStep("enter_otp")}
                    style={{ background: "transparent", border: "none", color: "var(--color-secondary)", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                  >
                    Back to OTP Login
                  </button>
                </div>
              </form>
            )}

            {/* Footer */}
            <div style={{ marginTop: "24px", textAlign: "center", borderTop: "1px solid var(--color-border-light)", paddingTop: "16px" }}>
              <p style={{ fontSize: "13.5px", color: "var(--color-text-secondary)" }}>
                {t("auth.newPillar")}{" "}
                <Link to="/register" style={{ color: "var(--color-secondary)", fontWeight: "700" }}>
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
