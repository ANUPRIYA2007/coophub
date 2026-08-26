import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import HeroInteractiveAgent from "../../../components/pillar/ai/HeroInteractiveAgent";
import { Loader2, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, Globe } from "lucide-react";

export default function Register() {
  const { t, language, changeLanguage, supportedLanguages } = useTranslation();
  const navigate = useNavigate();
  const { register } = useAuth();

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [activeField, setActiveField] = useState(null);
  const [success, setSuccess] = useState(false);

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
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const nextStep = () => {
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
    setError(null);
    setActiveField(null);
    setStep(2);
  };

  const handleRegister = async (e) => {
    e.preventDefault();
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

    setLoading(true);
    const { user, error: regError } = await register({
      ...formData,
      mainServices: [formData.mainServices],
      subServices: formData.subServices.split(",").map((s) => s.trim()).filter(Boolean),
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
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh", background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)", padding: "var(--space-4)" }}>
        <div className="card" style={{ maxWidth: "520px", width: "100%", textAlign: "center", padding: "var(--space-8)", borderRadius: "24px", background: "white" }}>
          <div
            style={{
              width: "80px",
              height: "80px",
              borderRadius: "50%",
              background: "var(--color-success-bg)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              margin: "0 auto var(--space-4)",
            }}
          >
            <CheckCircle size={48} color="var(--color-success)" />
          </div>
          <h2 style={{ fontSize: "var(--font-size-2xl)", fontWeight: "800", color: "var(--color-primary)" }}>
            Registration Submitted!
          </h2>
          <p style={{ color: "var(--color-text-secondary)", marginTop: "var(--space-2)", marginBottom: "var(--space-6)", lineHeight: "1.6" }}>
            {t("auth.registrationSuccess")} Your Pillar ID will be active upon review approval.
          </p>
          <Link to="/login" className="btn btn-primary btn-lg" style={{ width: "100%" }}>
            Proceed to Login
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
        background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)",
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
            formError={error}
          />
        </div>

        {/* Right: Registration Multi-Step Card */}
        <div style={{ flex: 1.2, display: "flex", justifyContent: "center" }}>
          <div
            className="card"
            style={{
              maxWidth: "580px",
              width: "100%",
              borderRadius: "24px",
              boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5), 0 0 0 1px rgba(255, 255, 255, 0.1)",
              background: "white",
              padding: "var(--space-8)",
            }}
          >
            {/* Header Branding */}
            <div style={{ textAlign: "center", marginBottom: "var(--space-6)" }}>
              <img src="/assets/images/coophub-logo.jpg" alt="Logo" style={{ height: "54px", margin: "0 auto", borderRadius: "10px" }} />
              <h2 style={{ fontSize: "24px", fontWeight: "800", color: "var(--color-primary)", marginTop: "10px" }}>
                {t("auth.pillarRegister")}
              </h2>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "13.5px", marginTop: "4px" }}>
                Join our verified professional technician and service provider team
              </p>
            </div>

            {/* Stepper Bar */}
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px", position: "relative" }}>
              <div style={{ position: "absolute", top: "14px", left: "15%", right: "15%", height: "3px", background: "var(--color-border)", zIndex: 0 }}></div>
              <div
                style={{
                  position: "absolute",
                  top: "14px",
                  left: "15%",
                  width: step === 2 ? "70%" : "0%",
                  height: "3px",
                  background: "var(--color-secondary)",
                  zIndex: 0,
                  transition: "width 0.3s ease",
                }}
              ></div>

              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: "var(--color-secondary)",
                    color: "white",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: "13px",
                  }}
                >
                  1
                </div>
                <span style={{ fontSize: "12px", marginTop: "4px", color: "var(--color-primary)", fontWeight: "700" }}>
                  Personal Info
                </span>
              </div>

              <div style={{ position: "relative", zIndex: 1, display: "flex", flexDirection: "column", alignItems: "center" }}>
                <div
                  style={{
                    width: "30px",
                    height: "30px",
                    borderRadius: "50%",
                    background: step === 2 ? "var(--color-secondary)" : "var(--color-surface)",
                    border: step === 2 ? "none" : "2px solid var(--color-border)",
                    color: step === 2 ? "white" : "var(--color-text-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontWeight: "bold",
                    fontSize: "13px",
                    transition: "all 0.3s ease",
                  }}
                >
                  2
                </div>
                <span style={{ fontSize: "12px", marginTop: "4px", color: step === 2 ? "var(--color-primary)" : "var(--color-text-muted)", fontWeight: step === 2 ? "700" : "500" }}>
                  Trade & Skills
                </span>
              </div>
            </div>

            {/* Error Banner */}
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

            {/* Step 1: Personal Info */}
            {step === 1 ? (
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

                <button type="button" className="btn btn-primary btn-lg" style={{ width: "100%", marginTop: "6px" }} onClick={nextStep}>
                  Next: Trade & Skills <ArrowRight size={18} />
                </button>
              </div>
            ) : (
              <form onSubmit={handleRegister} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
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
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(1)} disabled={loading}>
                    <ArrowLeft size={16} /> {t("common.back")}
                  </button>
                  <button type="submit" className="btn btn-primary btn-lg" style={{ flex: 2 }} disabled={loading}>
                    {loading ? <Loader2 size={18} className="spinner" /> : t("common.submit")}
                  </button>
                </div>
              </form>
            )}

            {/* Footer */}
            <div style={{ marginTop: "24px", textAlign: "center", borderTop: "1px solid var(--color-border-light)", paddingTop: "16px" }}>
              <p style={{ fontSize: "13.5px", color: "var(--color-text-secondary)" }}>
                {t("auth.alreadyRegistered")}{" "}
                <Link to="/login" style={{ color: "var(--color-secondary)", fontWeight: "700" }}>
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
