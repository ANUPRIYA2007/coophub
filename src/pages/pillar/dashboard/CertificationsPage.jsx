import React, { useState, useEffect, useRef } from "react";
import { certificationService } from "../../../services/pillar/certificationService";
import { useAuth } from "../../../context/AuthContext";
import { useTranslation } from "../../../i18n/useTranslation";
import { 
  Award, CheckCircle2, Clock, XCircle, Plus, UploadCloud, 
  ExternalLink, FileText, Building2, ShieldCheck, AlertCircle, RefreshCw
} from "lucide-react";

export default function CertificationsPage() {
  const { t } = useTranslation();
  const { user, profile } = useAuth();
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");

  const [form, setForm] = useState({
    skillName: "Electrical Repair",
    certificateName: "",
    issuingOrg: "",
    certificateNumber: "",
    issueDate: new Date().toISOString().split("T")[0],
    expiryDate: ""
  });
  const [selectedFile, setSelectedFile] = useState(null);
  const fileInputRef = useRef(null);

  const TRADE_SKILLS = [
    "Electrical Repair",
    "Plumbing Service",
    "AC Repair & HVAC",
    "Carpentry & Woodwork",
    "Deep Home Cleaning",
    "Professional Driver Services",
    "Specialized & Custom Trades"
  ];

  useEffect(() => {
    fetchCertifications();
  }, [user]);

  const fetchCertifications = async () => {
    setLoading(true);
    const pillarId = user?.id || "00000000-0000-0000-0000-000000000000";
    const { data } = await certificationService.getMyCertifications(pillarId);
    setCertifications(data || []);
    setLoading(false);
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setUploadError("");

    if (!form.certificateName.trim() || !form.issuingOrg.trim()) {
      setUploadError("Please fill in Certificate Title and Issuing Body.");
      return;
    }

    setUploading(true);
    const pillarId = user?.id || "00000000-0000-0000-0000-000000000000";
    const res = await certificationService.submitCertification({
      pillarId,
      skillName: form.skillName,
      certificateName: form.certificateName.trim(),
      issuingOrg: form.issuingOrg.trim(),
      certificateNumber: form.certificateNumber.trim(),
      issueDate: form.issueDate,
      expiryDate: form.expiryDate || null,
      file: selectedFile
    });

    if (res.data) {
      setCertifications(prev => [res.data, ...prev]);
      setShowUploadModal(false);
      setForm({
        skillName: "Electrical Repair",
        certificateName: "",
        issuingOrg: "",
        certificateNumber: "",
        issueDate: new Date().toISOString().split("T")[0],
        expiryDate: ""
      });
      setSelectedFile(null);
    } else {
      setUploadError("Failed to submit certificate. Please try again.");
    }
    setUploading(false);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return { bg: "rgba(16, 185, 129, 0.12)", color: "#10B981", icon: CheckCircle2, label: "Verified & Certified" };
      case "rejected":
        return { bg: "rgba(239, 68, 68, 0.12)", color: "#EF4444", icon: XCircle, label: "Needs Resubmission" };
      case "pending":
      default:
        return { bg: "rgba(245, 158, 11, 0.12)", color: "#F59E0B", icon: Clock, label: "Cooperative Verification Pending" };
    }
  };

  return (
    <div className="fade-in" style={{ paddingBottom: "40px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-5)", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ 
              background: "rgba(255, 121, 0, 0.12)", color: "#FF7900", 
              fontSize: "0.75rem", fontWeight: "800", padding: "3px 8px", borderRadius: "8px", textTransform: "uppercase" 
            }}>
              Professional Credentials
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
              Boost matching rank by up to +20 points
            </span>
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--color-text)", margin: 0 }}>
            My Skills & Certifications
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", margin: "4px 0 0 0" }}>
            Upload government & trade certificates to unlock certified status and receive priority job allocations.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={fetchCertifications}
            disabled={loading}
            className="btn btn-outline btn-sm"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary btn-sm"
            style={{ background: "#FF7900", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}
          >
            <Plus size={16} /> Add Certificate
          </button>
        </div>
      </div>

      {/* Certifications Grid */}
      {loading ? (
        <div style={{ padding: "50px", textAlign: "center" }}>
          <div className="spinner"></div>
        </div>
      ) : certifications.length === 0 ? (
        <div style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px dashed var(--color-border)",
          padding: "48px 24px",
          textAlign: "center"
        }}>
          <Award size={48} color="#FF7900" style={{ margin: "0 auto 12px", opacity: 0.8 }} />
          <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--color-text)", margin: "0 0 6px 0" }}>
            No Certifications Uploaded Yet
          </h3>
          <p style={{ fontSize: "0.88rem", color: "var(--color-text-secondary)", maxWidth: "420px", margin: "0 auto 20px" }}>
            Having approved trade certificates increases your job matching priority score and builds trusted credibility with customers.
          </p>
          <button 
            onClick={() => setShowUploadModal(true)}
            className="btn btn-primary"
            style={{ background: "#FF7900", fontWeight: "800" }}
          >
            Upload Your First Certificate
          </button>
        </div>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "20px" }}>
          {certifications.map((cert) => {
            const badge = getStatusBadge(cert.verification_status);
            const BadgeIcon = badge.icon;
            return (
              <div 
                key={cert.id}
                style={{
                  background: "var(--color-surface)",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--color-border)",
                  boxShadow: "var(--shadow-sm)",
                  overflow: "hidden",
                  display: "flex",
                  flexDirection: "column"
                }}
              >
                {/* Image Header Preview */}
                <div style={{ position: "relative", height: "140px", background: "#000" }}>
                  <img 
                    src={cert.document_url} 
                    alt={cert.certificate_name}
                    style={{ width: "100%", height: "100%", objectFit: "cover", opacity: 0.85 }} 
                  />
                  <div style={{
                    position: "absolute", top: "10px", right: "10px",
                    background: badge.bg, color: badge.color, border: `1px solid ${badge.color}`,
                    padding: "3px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "800",
                    display: "flex", alignItems: "center", gap: "4px", backdropFilter: "blur(4px)"
                  }}>
                    <BadgeIcon size={12} /> {badge.label}
                  </div>
                  <div style={{
                    position: "absolute", bottom: "10px", left: "10px",
                    background: "rgba(0,0,0,0.75)", color: "#FF7900",
                    padding: "3px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "800"
                  }}>
                    {cert.skill_name}
                  </div>
                </div>

                {/* Content */}
                <div style={{ padding: "18px", flex: 1, display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--color-text)", margin: "0 0 6px 0", lineHeight: "1.4" }}>
                      {cert.certificate_name}
                    </h3>
                    <div style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", marginBottom: "12px", display: "flex", alignItems: "center", gap: "4px" }}>
                      <Building2 size={14} color="#FF7900" /> {cert.issuing_organization}
                    </div>

                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", background: "var(--color-surface-hover)", padding: "10px", borderRadius: "8px", marginBottom: "12px" }}>
                      {cert.certificate_number && <div>Doc #: <strong>{cert.certificate_number}</strong></div>}
                      <div>Issued: <strong>{cert.issue_date || "—"}</strong></div>
                    </div>

                    {cert.verification_status === "rejected" && (
                      <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #EF4444", padding: "8px 12px", borderRadius: "8px", fontSize: "0.78rem", color: "#EF4444", marginBottom: "10px" }}>
                        <strong>Rejection Reason:</strong> {cert.rejection_reason || "Unverified details. Please re-upload a clear copy."}
                      </div>
                    )}
                  </div>

                  <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <a 
                      href={cert.document_url} 
                      target="_blank" 
                      rel="noreferrer"
                      style={{ fontSize: "0.8rem", color: "#FF7900", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}
                    >
                      <ExternalLink size={12} /> View Certificate
                    </a>

                    {cert.verification_status === "approved" && (
                      <span style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: "700" }}>
                        ✓ Matching Engine Active
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Modal */}
      {showUploadModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1100, padding: "20px"
        }}>
          <div style={{
            background: "var(--color-surface)", borderRadius: "var(--radius-lg)",
            width: "100%", maxWidth: "540px", maxHeight: "90vh", overflowY: "auto",
            padding: "24px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <h3 style={{ fontSize: "1.3rem", fontWeight: "800", margin: "0 0 4px 0", color: "var(--color-text)" }}>
                  Upload Skill Certificate
                </h3>
                <span style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                  Submit verified trade credentials for cooperative clearance
                </span>
              </div>
              <button 
                onClick={() => setShowUploadModal(false)}
                style={{ background: "transparent", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "var(--color-text-secondary)" }}
              >
                ✕
              </button>
            </div>

            {uploadError && (
              <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #EF4444", padding: "10px 14px", borderRadius: "8px", fontSize: "0.85rem", color: "#EF4444", marginBottom: "16px" }}>
                {uploadError}
              </div>
            )}

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "6px" }}>
                  Trade Skill Category <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <select 
                  name="skillName" 
                  value={form.skillName} 
                  onChange={handleFormChange} 
                  className="form-input"
                  required
                >
                  {TRADE_SKILLS.map(s => (
                    <option key={s} value={s}>{s}</option>
                  ))}
                </select>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "6px" }}>
                  Certificate / Course Title <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input 
                  type="text" 
                  name="certificateName" 
                  placeholder="e.g. ITI National Trade Certificate, HVAC Specialist" 
                  value={form.certificateName} 
                  onChange={handleFormChange} 
                  className="form-input" 
                  required 
                />
              </div>

              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "6px" }}>
                  Issuing Organization / Institute <span style={{ color: "#EF4444" }}>*</span>
                </label>
                <input 
                  type="text" 
                  name="issuingOrg" 
                  placeholder="e.g. NCVT, ITI Guindy, Schneider Electric" 
                  value={form.issuingOrg} 
                  onChange={handleFormChange} 
                  className="form-input" 
                  required 
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "14px" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "6px" }}>
                    Certificate Number
                  </label>
                  <input 
                    type="text" 
                    name="certificateNumber" 
                    placeholder="e.g. NCVT-2022-8491" 
                    value={form.certificateNumber} 
                    onChange={handleFormChange} 
                    className="form-input" 
                  />
                </div>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "6px" }}>
                    Issue Date
                  </label>
                  <input 
                    type="date" 
                    name="issueDate" 
                    value={form.issueDate} 
                    onChange={handleFormChange} 
                    className="form-input" 
                  />
                </div>
              </div>

              {/* Upload Dropzone */}
              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "6px" }}>
                  Upload Document Copy (JPG, PNG, PDF)
                </label>
                <div 
                  onClick={() => fileInputRef.current?.click()}
                  style={{
                    border: "2px dashed var(--color-border)",
                    borderRadius: "12px",
                    padding: "20px",
                    textAlign: "center",
                    cursor: "pointer",
                    background: "var(--color-surface-hover)"
                  }}
                >
                  <UploadCloud size={32} color="#FF7900" style={{ margin: "0 auto 8px" }} />
                  <div style={{ fontSize: "0.85rem", fontWeight: "700" }}>
                    {selectedFile ? selectedFile.name : "Click to select certificate image / PDF"}
                  </div>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                    Supported formats: PNG, JPG, PDF (Max 10MB)
                  </span>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleFileSelect} 
                    accept="image/*,.pdf" 
                    style={{ display: "none" }} 
                  />
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button 
                  type="button" 
                  onClick={() => setShowUploadModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={uploading}
                  className="btn btn-primary"
                  style={{ background: "#FF7900", fontWeight: "800" }}
                >
                  {uploading ? "Submitting for Verification..." : "Submit for Verification"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
