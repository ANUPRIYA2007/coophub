import React, { useState, useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { pillarAuthService } from "../../../services/pillar/authService";
import { ocrService } from "../../../services/pillar/ocrService";
import { kycRouter } from "../../../services/kyc/kycRouter";
import KycConsentModal from "../../../components/kyc/KycConsentModal";
import UidaiQrScannerModal from "../../../components/kyc/UidaiQrScannerModal";
import HeroInteractiveAgent from "../../../components/pillar/ai/HeroInteractiveAgent";
import { 
  Loader2, AlertCircle, CheckCircle, ArrowRight, ArrowLeft, 
  Globe, ShieldCheck, FileText, UploadCloud, Lock, Sparkles, CheckCircle2, QrCode, Cpu 
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
  const [submittedAppId, setSubmittedAppId] = useState("");

  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    mobile: "",
    password: "",
    confirmPassword: "",
    mainServices: "",
    customRole: "",
    subServices: "",
    experience: "",
    serviceArea: "",
    area: "",
    pincode: "",
    locationSharingEnabled: true,
    preferredLanguage: "en",
    // Step 3: Government ID Verification fields (Mandatory)
    documentType: "aadhaar", // 'aadhaar' | 'pan' | 'voter_id' | 'driving_licence' | 'other'
    customDocumentType: "",
    documentNumber: "",
    dob: "",
    documentFile: null,
    documentFileName: "",
    documentFileSize: "",
    documentPreviewUrl: null,
    // Step 4: Professional Trade & Skill Certificates (Optional)
    certificateType: "iti", // 'iti' | 'nsdc' | 'diploma' | 'trade_license' | 'experience' | 'other'
    customCertificateType: "",
    certificateNumber: "",
    certificateFile: null,
    certificateFileName: "",
    certificateFileSize: "",
    certificatePreviewUrl: null,
  });

  const [ocrPreview, setOcrPreview] = useState(null);
  const [certOcrPreview, setCertOcrPreview] = useState(null);
  const [certOcrProcessing, setCertOcrProcessing] = useState(false);
  const [consentModalOpen, setConsentModalOpen] = useState(false);
  const [consentGiven, setConsentGiven] = useState(false);
  const [qrModalOpen, setQrModalOpen] = useState(false);
  const [digilockerStatus, setDigilockerStatus] = useState({ configured: false });
  const [digilockerNotice, setDigilockerNotice] = useState(null);

  useEffect(() => {
    fetch('/api/kyc/digilocker/status')
      .then(res => res.json())
      .then(data => setDigilockerStatus(data))
      .catch(() => setDigilockerStatus({ configured: false }));
  }, []);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("resubmit") === "true") {
      setIsResubmitting(true);
      const email = params.get("email");
      if (email) {
        setFormData((prev) => ({ ...prev, email }));
      }
    }

    const dlStatus = params.get("digilocker_status");
    const dlState = params.get("state");
    const dlSessionId = params.get("session_id");
    const dlError = params.get("error");

    if (dlStatus) {
      setStep(3); // Navigate directly to Step 3 (KYC / Identity)
      if (dlStatus === "verified") {
        const queryKey = dlSessionId ? `session_id=${encodeURIComponent(dlSessionId)}` : (dlState ? `state=${encodeURIComponent(dlState)}` : '');
        if (queryKey) {
          fetch(`/api/kyc/digilocker/session-status?${queryKey}`)
            .then(r => r.json())
            .then(sess => {
              const currentStatus = (sess.status || '').toLowerCase();
              const isTrulyVerified = sess.success && sess.authoritative_verified && ['completed', 'successful', 'verified'].includes(currentStatus);

              if (isTrulyVerified) {
                setConsentGiven(true);
                setDigilockerNotice("DigiLocker Authoritative Verification Complete! Identity verified against government repository.");
                setOcrPreview({
                  engine: `DigiLocker Sandbox (${sess.tsp_provider?.toUpperCase() || 'SANDBOX.CO.IN'})`,
                  document_type: 'Government Issued Record (DigiLocker)',
                  document_type_code: 'digilocker',
                  extracted_name: sess.name || null,
                  extracted_dob: sess.dob || null,
                  extracted_document_number: sess.digilocker_id || sess.document_number || null,
                  raw_document_number_masked: sess.digilocker_id || sess.document_number || null,
                  raw_text_snippet: sess.name ? `DigiLocker Verified Record: ${sess.name}` : 'DigiLocker Verified Record',
                  confidence_score: 1.0,
                  authoritative_verified: true,
                  verification_method: 'digilocker_sandbox',
                  verification_status: 'VERIFIED',
                  processed_at: sess.verified_at || new Date().toISOString()
                });
                if (sess.name) {
                  setFormData(prev => ({ ...prev, fullName: sess.name, dob: sess.dob || prev.dob }));
                }
              } else {
                setDigilockerNotice("DigiLocker session active but identity authorization has not been granted by user.");
              }
            })
            .catch(err => console.warn('DigiLocker session query note:', err.message));
        }
      } else if (dlStatus === "created") {
        setDigilockerNotice("DigiLocker session created. Please complete authentication and grant statutory consent in the DigiLocker window.");
      } else if (dlStatus === "cancelled") {
        setDigilockerNotice("DigiLocker Verification Cancelled. You may retry or proceed with UIDAI Secure QR scan / document upload below.");
      } else if (dlStatus === "failed") {
        setDigilockerNotice(`DigiLocker Verification Failed: ${dlError || 'Authorization code invalid or timeout'}. You may retry or upload documents below.`);
      }
    }
  }, [location.search]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError(null);
  };

  const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

  const handleQrSuccess = (qrResult) => {
    const extracted = qrResult.extracted_data || {};
    setConsentGiven(true);
    setFormData((prev) => ({
      ...prev,
      documentType: 'aadhaar',
      documentNumber: extracted.document_number_masked || prev.documentNumber,
      fullName: prev.fullName || extracted.full_name || '',
      dob: extracted.date_of_birth || prev.dob
    }));

    setOcrPreview({
      engine: 'UIDAI Secure QR (Cryptographic)',
      document_type: 'Aadhaar Card (UIDAI Secure QR)',
      document_type_code: 'aadhaar',
      extracted_name: extracted.full_name,
      extracted_dob: extracted.date_of_birth,
      extracted_document_number: extracted.document_number_masked,
      raw_document_number_masked: extracted.document_number_masked,
      extracted_address: extracted.address,
      raw_text_snippet: `UIDAI Secure QR V2 Decoded: ${extracted.full_name} (${extracted.document_number_masked})`,
      confidence_score: qrResult.authoritative_verified ? 1.0 : 0.90,
      authoritative_verified: qrResult.authoritative_verified,
      qr_status: qrResult.qr_status,
      verification_status: qrResult.verification_status,
      processed_at: qrResult.processed_at
    });
  };

  const handleDigilockerClick = () => {
    if (!consentGiven) {
      setConsentModalOpen(true);
      return;
    }
    if (!digilockerStatus.configured) {
      setDigilockerNotice("DigiLocker Integration: NOT CONFIGURED (Production credentials required). Please proceed with UIDAI Secure QR scan or Document Upload below.");
      return;
    }
    fetch('/api/kyc/digilocker/auth-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pillarId: null })
    })
      .then(r => r.json())
      .then(data => {
        if (data.authUrl) window.location.href = data.authUrl;
        else setDigilockerNotice(data.error || "Could not launch DigiLocker.");
      })
      .catch(err => setDigilockerNotice(err.message));
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!consentGiven) {
      setConsentModalOpen(true);
      return;
    }

    // Strict MIME type validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError("Invalid file format. Please upload a valid JPG, PNG, WEBP image, or PDF document.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("File size exceeds 10MB limit. Please upload a smaller document.");
      return;
    }

    const sizeFormatted = (file.size / (1024 * 1024)).toFixed(2) + " MB";

    // Read as Base64 Data URL for persistent storage
    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      setFormData((prev) => ({
        ...prev,
        documentFile: file,
        documentFileName: file.name.replace(/[^a-zA-Z0-9._-]/g, '_'),
        documentFileSize: sizeFormatted,
        documentPreviewUrl: dataUrl,
      }));

      setOcrProcessing(true);
      try {
        const routerRes = await kycRouter.processDocument({
          document: dataUrl,
          documentType: formData.documentType,
          documentCategory: 'identity',
          pillarProfile: {
            fullName: formData.fullName,
            full_name: formData.fullName,
            dob: formData.dob,
            serviceArea: formData.serviceArea,
            main_services: [formData.mainServices]
          }
        });

        if (routerRes.pipelineResult) {
          const pipe = routerRes.pipelineResult;
          setOcrPreview({
            engine: routerRes.extraction?.ocr?.engine || 'Optical Character Recognition (OCR v4.0)',
            document_type: pipe.document_type || formData.documentType,
            document_type_code: formData.documentType,
            extracted_name: pipe.fields?.full_name,
            extracted_dob: pipe.fields?.date_of_birth,
            extracted_document_number: pipe.fields?.document_number_masked,
            raw_document_number_masked: pipe.fields?.document_number_masked,
            extracted_address: pipe.fields?.address,
            extracted_father_name: pipe.fields?.father_name || pipe.fields?.guardian_name,
            extracted_trade: pipe.fields?.trade,
            extracted_expiry: pipe.fields?.expiry_date,
            raw_text_snippet: routerRes.extraction?.ocr?.rawText?.slice(0, 180) || 'Document scanned successfully.',
            confidence_score: pipe.format_valid ? 0.90 : 0.60,
            verification_status: pipe.verification_status,
            authoritative_verified: pipe.authoritative_verified,
            validation_errors: pipe.validation_errors || [],
            warnings: pipe.warnings || []
          });

          if (pipe.fields?.document_number_masked && !formData.documentNumber) {
            setFormData(prev => ({ ...prev, documentNumber: pipe.fields.document_number_masked }));
          }
        }
      } catch (err) {
        console.warn("KYC Router processing note:", err);
      } finally {
        setOcrProcessing(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleCertificateUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict MIME type validation
    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      setError("Invalid certificate format. Please upload a valid JPG, PNG, WEBP image, or PDF document.");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Certificate file size exceeds 10MB limit.");
      return;
    }

    const sizeFormatted = (file.size / (1024 * 1024)).toFixed(2) + " MB";

    const reader = new FileReader();
    reader.onload = async (event) => {
      const dataUrl = event.target.result;
      setFormData((prev) => ({
        ...prev,
        certificateFile: file,
        certificateFileName: file.name.replace(/[^a-zA-Z0-9._-]/g, '_'),
        certificateFileSize: sizeFormatted,
        certificatePreviewUrl: dataUrl,
      }));

      setCertOcrProcessing(true);
      try {
        const extracted = await ocrService.extractCertificateInformation(dataUrl, formData.certificateType, {
          fullName: formData.fullName,
          mainServices: [formData.mainServices],
          certificateNumber: formData.certificateNumber
        });
        setCertOcrPreview(extracted);
      } catch (err) {
        console.warn("Certificate OCR extraction note:", err);
      } finally {
        setCertOcrProcessing(false);
      }
    };
    reader.readAsDataURL(file);
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
    if (formData.mainServices === "Others" && !formData.customRole.trim()) {
      setError("Please enter your custom job role / trade");
      setActiveField("customRole");
      return;
    }
    if (!formData.experience) {
      setError("Please select your years of experience");
      setActiveField("experience");
      return;
    }
    if (!formData.area.trim()) {
      setError("Please specify your area or locality");
      setActiveField("area");
      return;
    }
    if (!formData.pincode.trim() || !/^\d{6}$/.test(formData.pincode.trim())) {
      setError("Please enter a valid 6-digit numeric Indian pincode");
      setActiveField("pincode");
      return;
    }
    setError(null);
    setActiveField(null);
    setStep(3);
  };

  const nextToStep4 = () => {
    if (!formData.documentFileName && !formData.documentPreviewUrl) {
      setError("Please upload your Government Identity Document for mandatory KYC verification");
      return;
    }
    setError(null);
    setActiveField(null);
    setStep(4);
  };

  const handleRegister = async (e, skipCertificate = false) => {
    if (e) e.preventDefault();

    if (!formData.documentFileName && !formData.documentPreviewUrl) {
      setError("Please upload your Government Identity Document for KYC verification");
      setStep(3);
      return;
    }

    setLoading(true);

    const submissionPayload = {
      ...formData,
      mainServices: [formData.mainServices],
      customRole: formData.mainServices === "Others" ? formData.customRole.trim() : null,
      serviceArea: [formData.area.trim(), formData.pincode.trim()].filter(Boolean),
      area: formData.area.trim(),
      pincode: formData.pincode.trim(),
      location_sharing_enabled: formData.locationSharingEnabled !== false,
      subServices: formData.subServices ? formData.subServices.split(",").map((s) => s.trim()).filter(Boolean) : [],
      // Include OCR / DigiLocker verification metadata
      ocrPreview: ocrPreview,
      certOcrPreview: certOcrPreview,
      // If user clicked skip, clear certificate
      certificateFile: skipCertificate ? null : formData.certificateFile,
      certificatePreviewUrl: skipCertificate ? null : formData.certificatePreviewUrl,
      certificateType: skipCertificate ? null : formData.certificateType,
      certificateNumber: skipCertificate ? null : formData.certificateNumber,
    };

    if (isResubmitting) {
      const res = await pillarAuthService.resubmitVerification(formData.email, submissionPayload);
      setLoading(false);
      if (res.success) {
        setSuccess(true);
      } else {
        setError(res.error || "Failed to resubmit application.");
      }
      return;
    }

    const { user, applicationId, error: regError } = await register(submissionPayload);

    setLoading(false);

    if (regError) {
      setError(regError.message || t("common.error"));
    } else {
      if (applicationId) {
        setSubmittedAppId(applicationId);
      }
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

          {/* Official Application ID Card */}
          <div style={{ background: "#F8FAFC", border: "1.5px solid #FFEDD5", borderRadius: "14px", padding: "16px", marginBottom: "20px", textAlign: "center" }}>
            <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#64748B", textTransform: "uppercase", letterSpacing: "1px" }}>Official Application ID</div>
            <div style={{ fontSize: "1.5rem", fontWeight: "900", color: "#FF7900", fontFamily: "'Courier New', monospace", marginTop: "4px" }}>
              {submittedAppId || `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`}
            </div>
            <div style={{ fontSize: "0.78rem", color: "#64748B", marginTop: "4px" }}>
              Quote this Application ID when inquiring about your verification status.
            </div>
          </div>

          <p style={{ color: "#475569", marginTop: "4px", marginBottom: "24px", lineHeight: "1.6", fontSize: "0.95rem" }}>
            Your application details and government identity document have been submitted for verification and administrative clearance. Once verified by Cooperative Administration, your unique Pillar ID will be activated and sent to your email.
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
      {/* Top Left Back to Portals Button */}
      <div
        style={{
          position: "absolute",
          top: "16px",
          left: "24px",
          zIndex: 10,
        }}
      >
        <button
          onClick={() => navigate("/")}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255, 255, 255, 0.1)",
            color: "white",
            border: "1px solid rgba(255, 255, 255, 0.15)",
            padding: "7px 16px",
            borderRadius: "9999px",
            backdropFilter: "blur(8px)",
            fontSize: "13px",
            fontWeight: "700",
            cursor: "pointer",
            transition: "all 0.2s ease",
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.2)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = "rgba(255, 255, 255, 0.1)";
            e.currentTarget.style.transform = "translateY(0)";
          }}
        >
          <ArrowLeft size={16} /> Back to Portals
        </button>
      </div>

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
                  {isResubmitting ? "Verification Resubmission" : `Step ${step} of 4`}
                </span>
                <span style={{ fontSize: "12px", color: "var(--color-text-secondary)", fontWeight: "600" }}>
                  {step === 1 ? "1. Personal Profile" : step === 2 ? "2. Trade & Area" : step === 3 ? "3. Government KYC" : "4. Skill Certificate (Optional)"}
                </span>
              </div>
              <div style={{ height: "6px", background: "#E2E8F0", borderRadius: "9999px", overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${(step / 4) * 100}%`,
                    background: "linear-gradient(90deg, #FF7900 0%, #E66A00 100%)",
                    transition: "width 0.3s ease",
                  }}
                />
              </div>
            </div>

            {/* Title */}
            <div style={{ marginBottom: "20px" }}>
              <h2 style={{ fontSize: "1.6rem", fontWeight: "900", color: "var(--color-text)", margin: 0 }}>
                {step === 1 
                  ? "Join the Cooperative Workforce" 
                  : step === 2 
                  ? "Professional Trade & Area" 
                  : step === 3 
                  ? "Government ID Verification" 
                  : "Trade & Skill Certificates"}
              </h2>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "13.5px", marginTop: "4px", margin: 0 }}>
                {step === 1
                  ? "Create your technician account to receive bookings."
                  : step === 2
                  ? "Select your core skill trade and operating zones."
                  : step === 3
                  ? "Upload mandatory government identity document for KYC verification."
                  : "Upload ITI, NSDC, Diploma or Trade License for priority dispatch (Optional)."}
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
                        placeholder="••••••••"
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
                        placeholder="••••••••"
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

                <button type="button" className="btn btn-primary btn-lg" style={{ marginTop: "8px", background: "#FF7900" }} onClick={nextToStep2}>
                  Next: Trade & Skills <ArrowRight size={18} />
                </button>
              </div>
            )}

            {/* STEP 2: Trade & Area */}
            {step === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="form-group">
                  <label className="form-label">Primary Skilled Trade <span className="required">*</span></label>
                  <select
                    name="mainServices"
                    className="form-input"
                    value={formData.mainServices}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="">Select your core trade...</option>
                    <option value="Electrician">⚡ Electrician & Wiring</option>
                    <option value="Plumber">🚰 Plumber & Pipe Fitting</option>
                    <option value="AC Technician">❄️ AC & Refrigeration</option>
                    <option value="Carpenter">🪚 Carpenter & Woodwork</option>
                    <option value="Appliance Repair">🔧 Home Appliance Repair</option>
                    <option value="Home Cleaning">✨ Deep Home Cleaning</option>
                    <option value="Painter">🎨 Professional Painter</option>
                    <option value="Others">🛠️ Others (Specify below)</option>
                  </select>
                </div>

                {formData.mainServices === "Others" && (
                  <div className="form-group">
                    <label className="form-label">Specify Custom Job Role / Trade <span className="required">*</span></label>
                    <input
                      type="text"
                      name="customRole"
                      className="form-input"
                      placeholder="e.g. Solar Panel Installer, CCTV Specialist"
                      value={formData.customRole}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                )}

                <div className="grid grid-2" style={{ gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">Years of Experience <span className="required">*</span></label>
                    <select
                      name="experience"
                      className="form-input"
                      value={formData.experience}
                      onChange={handleInputChange}
                      required
                    >
                      <option value="">Select experience...</option>
                      <option value="1">1 Year</option>
                      <option value="2">2 Years</option>
                      <option value="3">3-5 Years</option>
                      <option value="6">6-10 Years</option>
                      <option value="10">10+ Years (Senior Master)</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sub-Skills (Optional)</label>
                    <input
                      type="text"
                      name="subServices"
                      className="form-input"
                      placeholder="e.g. Inverter, MCB, 3-Phase"
                      value={formData.subServices}
                      onChange={handleInputChange}
                    />
                  </div>
                </div>

                <div className="grid grid-2" style={{ gap: "16px" }}>
                  <div className="form-group">
                    <label className="form-label">Operating Area / Locality <span className="required">*</span></label>
                    <input
                      type="text"
                      name="area"
                      className="form-input"
                      placeholder="e.g. Guindy, Adyar"
                      value={formData.area}
                      onChange={handleInputChange}
                      onFocus={() => setActiveField("area")}
                      onBlur={() => setActiveField(null)}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Pincode <span className="required">*</span></label>
                    <input
                      type="text"
                      name="pincode"
                      maxLength={6}
                      className="form-input"
                      placeholder="600032"
                      value={formData.pincode}
                      onChange={handleInputChange}
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

            {/* STEP 3: Government ID Verification (Mandatory KYC) */}
            {step === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Authoritative Digital Verification Header / Fast-Track */}
                <div style={{
                  padding: "16px",
                  borderRadius: "14px",
                  background: "linear-gradient(135deg, rgba(37, 99, 235, 0.06), rgba(16, 185, 129, 0.06))",
                  border: "1px solid rgba(37, 99, 235, 0.2)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "10px"
                }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <ShieldCheck size={18} color="#2563EB" />
                      <span style={{ fontWeight: "700", fontSize: "0.85rem", color: "var(--color-text)" }}>
                        Authoritative Verification Fast-Track
                      </span>
                    </div>
                    <span style={{
                      fontSize: "0.7rem",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background: consentGiven ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                      color: consentGiven ? "#059669" : "#D97706"
                    }}>
                      {consentGiven ? "Consent Granted" : "Consent Required"}
                    </span>
                  </div>
                  <p style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", margin: 0 }}>
                    Digital government verification provides instant confirmation and priority job allocations.
                  </p>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginTop: "4px" }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (!consentGiven) {
                          setConsentModalOpen(true);
                        } else {
                          setQrModalOpen(true);
                        }
                      }}
                      style={{
                        padding: "10px",
                        borderRadius: "10px",
                        border: "1px solid #2563EB",
                        background: "#EFF6FF",
                        color: "#1D4ED8",
                        fontWeight: "700",
                        fontSize: "0.78rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px"
                      }}
                    >
                      <QrCode size={16} />
                      Scan UIDAI QR
                    </button>
                    <button
                      type="button"
                      onClick={handleDigilockerClick}
                      style={{
                        padding: "10px",
                        borderRadius: "10px",
                        border: "1px solid #CBD5E1",
                        background: "#F8FAFC",
                        color: "#475569",
                        fontWeight: "700",
                        fontSize: "0.78rem",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        gap: "6px",
                        position: "relative"
                      }}
                    >
                      <Lock size={15} />
                      DigiLocker
                      <span style={{
                        position: "absolute",
                        top: "-6px",
                        right: "-6px",
                        fontSize: "9px",
                        padding: "1px 5px",
                        borderRadius: "4px",
                        background: digilockerStatus.configured ? "#10B981" : "#94A3B8",
                        color: "#fff",
                        fontWeight: "800"
                      }}>
                        {digilockerStatus.configured ? "ACTIVE" : "UNCONFIGURED"}
                      </span>
                    </button>
                  </div>
                  {digilockerNotice && (
                    <div style={{
                      padding: "8px 12px",
                      borderRadius: "8px",
                      background: "rgba(245, 158, 11, 0.1)",
                      border: "1px solid rgba(245, 158, 11, 0.3)",
                      fontSize: "0.72rem",
                      color: "#B45309"
                    }}>
                      {digilockerNotice}
                    </div>
                  )}
                </div>
                <div className="form-group">
                  <label className="form-label">Select Government Document / Record <span className="required">*</span></label>
                  <select
                    name="documentType"
                    className="form-input"
                    value={formData.documentType}
                    onChange={handleInputChange}
                    required
                  >
                    <option value="aadhaar">🪪 Aadhaar Card (UIDAI)</option>
                    <option value="pan">💳 PAN Card (Income Tax Department)</option>
                    <option value="voter_id">🗳️ Voter Identity Card (EPIC / Election Commission)</option>
                    <option value="driving_licence">🚗 Motor Driving Licence (Transport Dept / RTO)</option>
                    <option value="passport">🛂 Indian Passport (Republic of India)</option>
                    <option value="ration_card">🌾 Smart Ration Card / TNEPDS Family Card</option>
                    <option value="labour_card">🏗️ Construction / Labour Welfare Board Card</option>
                    <option value="other">📑 Other Official Government ID</option>
                  </select>
                </div>

                {formData.documentType === "other" && (
                  <div className="form-group">
                    <label className="form-label">Specify Document Title <span className="required">*</span></label>
                    <input
                      type="text"
                      name="customDocumentType"
                      className="form-input"
                      placeholder="e.g. State Trade ID, Government Employee Card"
                      value={formData.customDocumentType}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                )}

                {/* Secure File Upload Zone */}
                <div className="form-group">
                  <label className="form-label">Upload Government Document (Photo / PDF) <span className="required">*</span></label>
                  <div
                    style={{
                      border: "2px dashed #CBD5E1",
                      borderRadius: "12px",
                      padding: "20px",
                      textAlign: "center",
                      background: formData.documentFileName ? "rgba(16, 185, 129, 0.05)" : "#F8FAFC",
                      borderColor: formData.documentFileName ? "#10B981" : "#CBD5E1",
                      position: "relative",
                      cursor: formData.documentFileName ? "default" : "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    {!formData.documentFileName && (
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
                    )}

                    {formData.documentFileName ? (
                      <div>
                        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "#059669", marginBottom: "12px" }}>
                          <CheckCircle2 size={24} />
                          <div style={{ textAlign: "left" }}>
                            <div style={{ fontWeight: "700", fontSize: "0.9rem" }}>{formData.documentFileName}</div>
                            <div style={{ fontSize: "0.75rem", color: "#64748B" }}>Size: {formData.documentFileSize} • Scanned with OCR</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                          {formData.documentPreviewUrl && (
                            <button
                              type="button"
                              onClick={() => window.open(formData.documentPreviewUrl, '_blank')}
                              style={{
                                padding: "6px 14px",
                                borderRadius: "8px",
                                border: "1px solid #CBD5E1",
                                background: "#FFFFFF",
                                color: "#334155",
                                fontSize: "0.78rem",
                                fontWeight: "700",
                                cursor: "pointer",
                                display: "flex",
                                alignItems: "center",
                                gap: "5px"
                              }}
                            >
                              👁️ Preview Document
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => {
                              setFormData(prev => ({
                                ...prev,
                                documentFile: null,
                                documentFileName: "",
                                documentFileSize: "",
                                documentPreviewUrl: null,
                              }));
                              setOcrPreview(null);
                            }}
                            style={{
                              padding: "6px 14px",
                              borderRadius: "8px",
                              border: "1px solid #FECACA",
                              background: "rgba(239, 68, 68, 0.05)",
                              color: "#DC2626",
                              fontSize: "0.78rem",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "5px"
                            }}
                          >
                            ✕ Remove & Re-upload
                          </button>
                          <label
                            style={{
                              padding: "6px 14px",
                              borderRadius: "8px",
                              border: "1px solid #FF7900",
                              background: "rgba(255, 121, 0, 0.05)",
                              color: "#FF7900",
                              fontSize: "0.78rem",
                              fontWeight: "700",
                              cursor: "pointer",
                              display: "flex",
                              alignItems: "center",
                              gap: "5px"
                            }}
                          >
                            🔄 Replace File
                            <input
                              type="file"
                              accept="image/*,.pdf"
                              onChange={handleFileUpload}
                              style={{ display: "none" }}
                            />
                          </label>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <UploadCloud size={32} color="#FF7900" style={{ margin: "0 auto 8px" }} />
                        <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#0B1220" }}>
                          Click to browse or drag & drop document
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#64748B", marginTop: "4px" }}>
                          Supports Aadhaar, PAN, Voter ID, Driving Licence, Passport, Ration Card (JPG, PNG, PDF)
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {ocrProcessing && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#FF7900", fontSize: "0.85rem", fontWeight: "600" }}>
                    <Sparkles size={16} className="spin" />
                    <span>Extracting document details with Optical Character Recognition...</span>
                  </div>
                )}

                {/* Live Government ID OCR Preview — uses dropdown-selected type, not auto-detected */}
                {ocrPreview && (
                  <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "12px", padding: "14px", animation: "slideInRight 0.2s ease" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#166534", textTransform: "uppercase" }}>
                        🪪 Live OCR Extraction Preview
                      </span>
                      <span style={{ background: "#DCFCE7", color: "#15803D", fontSize: "0.7rem", fontWeight: "700", padding: "2px 8px", borderRadius: "8px" }}>
                        {((ocrPreview.confidence_score || 0) * 100).toFixed(0)}% Confidence
                      </span>
                    </div>
                    <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "#14532D" }}>
                      {formData.documentType === 'pan' ? '💳 PAN Card (Income Tax Department)' :
                       formData.documentType === 'voter_id' ? '🗳️ Voter Identity Card (EPIC)' :
                       formData.documentType === 'driving_licence' ? '🚗 Motor Driving Licence' :
                       formData.documentType === 'passport' ? '🛂 Indian Passport' :
                       formData.documentType === 'ration_card' ? '🌾 Smart Ration Card' :
                       formData.documentType === 'labour_card' ? '🏗️ Labour Welfare Card' :
                       formData.documentType === 'other' ? '📑 Official Government ID' :
                       ocrPreview.document_type || '🪪 UIDAI Aadhaar Card'}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#374151", marginTop: "6px", display: "flex", flexDirection: "column", gap: "3px" }}>
                      {ocrPreview.extracted_name && (
                        <div>Name: <strong>{ocrPreview.extracted_name}</strong></div>
                      )}
                      {ocrPreview.extracted_document_number && (
                        <div>
                          {formData.documentType === 'pan' ? 'PAN' :
                           formData.documentType === 'voter_id' ? 'EPIC' :
                           formData.documentType === 'passport' ? 'Passport' :
                           formData.documentType === 'driving_licence' ? 'DL' :
                           formData.documentType === 'ration_card' ? 'Ration Card' :
                           formData.documentType === 'labour_card' ? 'Reg' : 'Doc'} Number: <strong style={{ fontFamily: "monospace" }}>{ocrPreview.extracted_document_number}</strong>
                        </div>
                      )}
                      {ocrPreview.extracted_dob && (
                        <div>DOB: <strong>{ocrPreview.extracted_dob}</strong></div>
                      )}
                      {ocrPreview.extracted_father_name && formData.documentType === 'pan' && (
                        <div>Father's Name: <strong>{ocrPreview.extracted_father_name}</strong></div>
                      )}
                      {ocrPreview.extracted_trade && (
                        <div>Trade / Occupation: <strong>{ocrPreview.extracted_trade}</strong></div>
                      )}
                      {ocrPreview.extracted_expiry && (
                        <div>Valid Till: <strong>{ocrPreview.extracted_expiry}</strong></div>
                      )}
                      {ocrPreview.extracted_address && formData.documentType !== 'pan' && (
                        <div>Address: <strong>{ocrPreview.extracted_address}</strong></div>
                      )}
                      {!ocrPreview.extracted_name && !ocrPreview.extracted_document_number && !ocrPreview.extracted_dob && (
                        <div style={{ color: "#92400E" }}>⚠️ OCR could not extract fields clearly. Your document will still be submitted for admin Vision AI review.</div>
                      )}
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 1 }} onClick={() => setStep(2)}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button type="button" className="btn btn-primary btn-lg" style={{ flex: 2, background: "#FF7900" }} onClick={nextToStep4}>
                    Next: Skill Certificates <ArrowRight size={18} />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: Professional & Skill Certificates (Optional) */}
            {step === 4 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ background: "rgba(16, 185, 129, 0.08)", border: "1px solid rgba(16, 185, 129, 0.25)", borderRadius: "12px", padding: "12px 14px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#059669", fontWeight: "800", fontSize: "0.85rem", marginBottom: "2px" }}>
                    <ShieldCheck size={18} />
                    <span>Optional Step • Boosts Verification & Priority Bookings</span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#475569", lineHeight: "1.4" }}>
                    Uploading trade credentials (ITI, NSDC Skill India, Polytechnic Diploma or Experience Certificate) awards you a Certified Badge on customer portals.
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Select Certificate / Credential Type</label>
                  <select
                    name="certificateType"
                    className="form-input"
                    value={formData.certificateType}
                    onChange={handleInputChange}
                  >
                    <option value="iti">📜 ITI National Trade Certificate (NTC / NCVT)</option>
                    <option value="nsdc">🌟 Skill India / NSDC Certified Professional</option>
                    <option value="diploma">🎓 Polytechnic Diploma / State Technical Board</option>
                    <option value="trade_license">🛡️ Government Electrical / Trade License</option>
                    <option value="experience">📄 Experience Proof / Service Letter</option>
                    <option value="other">📑 Other Technical Certification</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Certificate / Registration Number (Optional)</label>
                  <input
                    type="text"
                    name="certificateNumber"
                    className="form-input"
                    placeholder="e.g. NTC-2023-TN-8821 or NSDC-ELE-9410"
                    value={formData.certificateNumber}
                    onChange={handleInputChange}
                  />
                </div>

                {/* Secure Certificate Upload Zone */}
                <div className="form-group">
                  <label className="form-label">Upload Certificate Document (Photo / PDF)</label>
                  <div
                    style={{
                      border: "2px dashed #CBD5E1",
                      borderRadius: "12px",
                      padding: "20px",
                      textAlign: "center",
                      background: formData.certificateFileName ? "rgba(16, 185, 129, 0.05)" : "#F8FAFC",
                      borderColor: formData.certificateFileName ? "#10B981" : "#CBD5E1",
                      position: "relative",
                      cursor: "pointer",
                      transition: "all 0.2s ease"
                    }}
                  >
                    <input
                      type="file"
                      accept="image/*,.pdf"
                      onChange={handleCertificateUpload}
                      style={{
                        position: "absolute",
                        top: 0, left: 0, right: 0, bottom: 0,
                        opacity: 0,
                        cursor: "pointer",
                        width: "100%",
                        height: "100%"
                      }}
                    />

                    {formData.certificateFileName ? (
                      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px", color: "#059669" }}>
                        <CheckCircle2 size={24} />
                        <div style={{ textAlign: "left" }}>
                          <div style={{ fontWeight: "700", fontSize: "0.9rem" }}>{formData.certificateFileName}</div>
                          <div style={{ fontSize: "0.75rem", color: "#64748B" }}>Size: {formData.certificateFileSize} • OCR Extracted</div>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <UploadCloud size={32} color="#10B981" style={{ margin: "0 auto 8px" }} />
                        <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "#0B1220" }}>
                          Click to browse or drag & drop certificate
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#64748B", marginTop: "4px" }}>
                          Supports ITI, NSDC, Diploma or Trade License (JPG, PNG, PDF)
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {certOcrProcessing && (
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#10B981", fontSize: "0.85rem", fontWeight: "600" }}>
                    <Sparkles size={16} className="spin" />
                    <span>Extracting certificate credentials with OCR...</span>
                  </div>
                )}

                {/* Certificate OCR Extraction Live Card */}
                {certOcrPreview && (
                  <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "12px", padding: "14px", animation: "slideInRight 0.2s ease" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#166534", textTransform: "uppercase" }}>
                        📜 OCR Certificate Extraction Preview
                      </span>
                      <span style={{ background: "#DCFCE7", color: "#15803D", fontSize: "0.7rem", fontWeight: "700", padding: "2px 8px", borderRadius: "8px" }}>
                        {(certOcrPreview.confidence_score * 100).toFixed(0)}% Confidence
                      </span>
                    </div>
                    <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "#14532D" }}>{certOcrPreview.certificate_type}</div>
                    <div style={{ fontSize: "0.8rem", color: "#374151", marginTop: "4px" }}>
                      Number: <strong style={{ fontFamily: "monospace" }}>{certOcrPreview.extracted_certificate_number}</strong> • Issuer: <strong>{certOcrPreview.extracted_issuer}</strong>
                    </div>
                  </div>
                )}

                <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
                  <button type="button" className="btn btn-outline" style={{ flex: 0.8 }} onClick={() => setStep(3)} disabled={loading}>
                    <ArrowLeft size={16} /> Back
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-outline" 
                    style={{ flex: 1.2, borderColor: "#94A3B8", color: "#475569" }} 
                    onClick={(e) => handleRegister(e, true)} 
                    disabled={loading}
                  >
                    Skip Certificate
                  </button>
                  <button 
                    type="button" 
                    className="btn btn-primary btn-lg" 
                    style={{ flex: 1.5, background: "#FF7900" }} 
                    onClick={(e) => handleRegister(e, false)} 
                    disabled={loading}
                  >
                    {loading ? <Loader2 size={18} className="spinner" /> : isResubmitting ? "Resubmit App" : "Submit Application"}
                  </button>
                </div>
              </div>
            )}

            {/* Footer */}
            <div style={{ marginTop: "24px", textAlign: "center", borderTop: "1px solid var(--color-border-light)", paddingTop: "16px" }}>
              <p style={{ fontSize: "13.5px", color: "var(--color-text-secondary)", margin: 0 }}>
                {t("auth.alreadyRegistered")}{" "}
                <Link to="/pillar/login" style={{ color: "#FF7900", fontWeight: "700" }}>
                  {t("auth.loginHere")}
                </Link>
              </p>
              <div style={{ marginTop: "12px", display: "flex", justifyContent: "center" }}>
                <Link to="/" style={{ color: "#64748B", fontSize: "12.5px", fontWeight: "600", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <ArrowLeft size={14} /> Back to Portal Selection
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Statutory KYC Consent Modal */}
      <KycConsentModal
        isOpen={consentModalOpen}
        onClose={() => setConsentModalOpen(false)}
        onConsentAccepted={() => {
          setConsentGiven(true);
        }}
      />

      {/* Authoritative UIDAI Secure QR Scanner Modal */}
      <UidaiQrScannerModal
        isOpen={qrModalOpen}
        onClose={() => setQrModalOpen(false)}
        pillarProfile={{
          fullName: formData.fullName,
          full_name: formData.fullName,
          dob: formData.dob
        }}
        onQrSuccess={handleQrSuccess}
      />

      <style dangerouslySetInnerHTML={{__html: `
        @media (max-width: 900px) {
          .hide-on-mobile { display: none !important; }
        }
      `}} />
    </div>
  );
}
