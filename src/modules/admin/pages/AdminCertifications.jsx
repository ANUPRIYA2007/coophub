import React, { useState, useEffect } from "react";
import { certificationService } from "../../../services/pillar/certificationService";
import { useTranslation } from "../../../i18n/useTranslation";
import { 
  Award, CheckCircle2, XCircle, Clock, Eye, Filter, Search, 
  ExternalLink, FileText, Check, AlertCircle, RefreshCw, Sparkles, Building2
} from "lucide-react";

export default function AdminCertifications() {
  const { t } = useTranslation();
  const [certifications, setCertifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCert, setSelectedCert] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [customRejectNote, setCustomRejectNote] = useState("");
  const [actionLoading, setActionLoading] = useState(false);

  const REJECTION_PRESETS = [
    "Certificate is blurry, obscured or unreadable",
    "Issuing organization accreditation cannot be validated",
    "Candidate name on certificate does not match registered technician",
    "Certificate has expired beyond permissible validity window",
    "Certificate does not correspond with selected trade skill",
    "Other"
  ];

  useEffect(() => {
    fetchCertifications();
  }, [filterStatus]);

  const fetchCertifications = async () => {
    setLoading(true);
    const { data } = await certificationService.getAllCertifications(filterStatus);
    setCertifications(data || []);
    setLoading(false);
  };

  const handleApprove = async (certId) => {
    setActionLoading(true);
    const res = await certificationService.approveCertification(certId, "Admin-Verifier");
    if (res.success) {
      setCertifications(prev => prev.map(c => c.id === certId ? { ...c, verification_status: 'approved', verified_at: new Date().toISOString() } : c));
      if (selectedCert && selectedCert.id === certId) {
        setSelectedCert(prev => ({ ...prev, verification_status: 'approved' }));
      }
    } else {
      alert("Error approving certificate: " + res.error);
    }
    setActionLoading(false);
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedCert || !rejectReason) return;
    setActionLoading(true);
    const reasonText = rejectReason === "Other" ? (customRejectNote || "Does not meet verification standards") : rejectReason;
    const res = await certificationService.rejectCertification(selectedCert.id, reasonText);
    if (res.success) {
      setCertifications(prev => prev.map(c => c.id === selectedCert.id ? { ...c, verification_status: 'rejected', rejection_reason: reasonText } : c));
      setSelectedCert(prev => ({ ...prev, verification_status: 'rejected', rejection_reason: reasonText }));
      setShowRejectModal(false);
      setRejectReason("");
      setCustomRejectNote("");
    } else {
      alert("Error rejecting certificate: " + res.error);
    }
    setActionLoading(false);
  };

  const filteredCerts = certifications.filter(c => {
    const q = searchQuery.toLowerCase();
    const sName = (c.skill_name || "").toLowerCase();
    const cName = (c.certificate_name || "").toLowerCase();
    const pName = (c.pillar?.full_name || "").toLowerCase();
    const org = (c.issuing_organization || "").toLowerCase();
    return sName.includes(q) || cName.includes(q) || pName.includes(q) || org.includes(q);
  });

  const getStatusBadge = (status) => {
    switch (status) {
      case "approved":
        return { bg: "rgba(16, 185, 129, 0.12)", color: "#10B981", label: "Approved" };
      case "rejected":
        return { bg: "rgba(239, 68, 68, 0.12)", color: "#EF4444", label: "Rejected" };
      case "under_review":
        return { bg: "rgba(59, 130, 246, 0.12)", color: "#3B82F6", label: "Under Review" };
      case "pending":
      default:
        return { bg: "rgba(245, 158, 11, 0.12)", color: "#F59E0B", label: "Pending Review" };
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
              Workforce Verification
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
              Trade Competency & Skill Credentials
            </span>
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--color-text)", margin: 0 }}>
            Worker Skill Certifications Review
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", margin: "4px 0 0 0" }}>
            Review trade certificates, approve verified credentials, and empower AI intelligent workforce matching.
          </p>
        </div>

        <button 
          onClick={fetchCertifications}
          disabled={loading}
          className="btn btn-outline btn-sm"
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {/* Main Container */}
      <div style={{
        background: "var(--color-surface)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden"
      }}>
        {/* Filter Bar */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          flexWrap: "wrap",
          gap: "14px",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          {/* Status Tabs */}
          <div style={{ display: "flex", gap: "6px" }}>
            {["all", "pending", "approved", "rejected"].map(st => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  fontWeight: filterStatus === st ? "700" : "500",
                  background: filterStatus === st ? "var(--color-primary)" : "var(--color-surface-hover)",
                  color: filterStatus === st ? "white" : "var(--color-text-secondary)",
                  border: "none",
                  cursor: "pointer",
                  textTransform: "capitalize",
                  transition: "all 0.2s"
                }}
              >
                {st}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="input-wrapper" style={{ width: "280px" }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search skill, cert, technician..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={16} className="input-icon" />
          </div>
        </div>

        {/* Certifications Table */}
        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <div className="spinner"></div>
            </div>
          ) : filteredCerts.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-secondary)" }}>
              <Award size={36} style={{ opacity: 0.3, margin: "0 auto 12px" }} />
              <p style={{ fontWeight: "700" }}>No skill certifications found</p>
              <span style={{ fontSize: "0.85rem" }}>
                {filterStatus === "all" ? "Technician certificate submissions will appear here." : `No submissions in "${filterStatus}" status.`}
              </span>
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Technician</th>
                  <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Skill / Trade</th>
                  <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Certificate Name</th>
                  <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Issuing Organization</th>
                  <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", color: "var(--color-text-secondary)" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCerts.map((cert) => {
                  const badge = getStatusBadge(cert.verification_status);
                  return (
                    <tr key={cert.id} style={{ borderBottom: "1px solid var(--color-border)" }} className="hover-row">
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: "700" }}>{cert.pillar?.full_name || "Senthil Kumar"}</div>
                        <div style={{ fontSize: "0.75rem", color: "#FF7900", fontWeight: "700" }}>
                          {cert.pillar?.pillar_code || "PIL-CHE-001"}
                        </div>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: "700" }}>
                        <span style={{ background: "rgba(255, 121, 0, 0.08)", color: "#FF7900", padding: "3px 8px", borderRadius: "6px", fontSize: "0.8rem" }}>
                          {cert.skill_name}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: "600", maxWidth: "260px" }}>
                        <div style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {cert.certificate_name}
                        </div>
                        {cert.certificate_number && (
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                            Doc #: {cert.certificate_number}
                          </div>
                        )}
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                        {cert.issuing_organization}
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "800",
                          background: badge.bg, color: badge.color
                        }}>
                          {badge.label}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedCert(cert)}
                          className="btn btn-outline btn-sm"
                          style={{ padding: "4px 10px", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          <Eye size={13} /> Inspect & Verify
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Certification Review Modal */}
      {selectedCert && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.7)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1100, padding: "20px"
        }}>
          <div style={{
            background: "var(--color-surface)", borderRadius: "var(--radius-lg)",
            width: "100%", maxWidth: "680px", maxHeight: "90vh", overflowY: "auto",
            padding: "24px", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#FF7900", textTransform: "uppercase" }}>
                  SKILL CERTIFICATION INSPECTION
                </span>
                <h2 style={{ fontSize: "1.3rem", fontWeight: "800", margin: "2px 0 0 0" }}>
                  {selectedCert.certificate_name}
                </h2>
                <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                  Submitted by: <strong>{selectedCert.pillar?.full_name || "Senthil Kumar"}</strong>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCert(null)}
                style={{ background: "transparent", border: "none", fontSize: "1.4rem", cursor: "pointer", color: "var(--color-text-secondary)" }}
              >
                ✕
              </button>
            </div>

            {/* Document Preview */}
            <div style={{ marginBottom: "18px", border: "1px solid var(--color-border)", borderRadius: "12px", overflow: "hidden", background: "#000" }}>
              <img 
                src={selectedCert.document_url} 
                alt="Certificate Document" 
                style={{ width: "100%", maxHeight: "280px", objectFit: "cover", display: "block" }} 
              />
              <div style={{ padding: "8px 12px", background: "var(--color-surface-hover)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  Uploaded on {new Date(selectedCert.created_at || Date.now()).toLocaleDateString()}
                </span>
                <a 
                  href={selectedCert.document_url} 
                  target="_blank" 
                  rel="noreferrer" 
                  style={{ fontSize: "0.8rem", color: "#FF7900", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <ExternalLink size={12} /> View Full Resolution
                </a>
              </div>
            </div>

            {/* Credential Data Grid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", background: "var(--color-surface-hover)", padding: "16px", borderRadius: "12px", marginBottom: "20px", fontSize: "0.85rem" }}>
              <div>
                <span style={{ color: "var(--color-text-secondary)", display: "block", fontSize: "0.75rem" }}>Skill Category:</span>
                <strong style={{ color: "#FF7900" }}>{selectedCert.skill_name}</strong>
              </div>
              <div>
                <span style={{ color: "var(--color-text-secondary)", display: "block", fontSize: "0.75rem" }}>Issuing Organization:</span>
                <strong>{selectedCert.issuing_organization}</strong>
              </div>
              <div>
                <span style={{ color: "var(--color-text-secondary)", display: "block", fontSize: "0.75rem" }}>Certificate / Registry Number:</span>
                <strong>{selectedCert.certificate_number || "Not specified"}</strong>
              </div>
              <div>
                <span style={{ color: "var(--color-text-secondary)", display: "block", fontSize: "0.75rem" }}>Validity:</span>
                <strong>{selectedCert.issue_date || "—"} to {selectedCert.expiry_date || "Permanent"}</strong>
              </div>
            </div>

            {/* Rejection Note (if rejected) */}
            {selectedCert.verification_status === "rejected" && (
              <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid #EF4444", padding: "12px", borderRadius: "8px", marginBottom: "18px", fontSize: "0.85rem", color: "#EF4444" }}>
                <strong>Rejection Rationale:</strong> {selectedCert.rejection_reason || "Document failed verification audit."}
              </div>
            )}

            {/* Action Buttons */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "16px" }}>
              <button 
                type="button" 
                onClick={() => setSelectedCert(null)} 
                className="btn btn-outline"
              >
                Close
              </button>

              <div style={{ display: "flex", gap: "10px" }}>
                {selectedCert.verification_status !== "rejected" && (
                  <button
                    onClick={() => setShowRejectModal(true)}
                    disabled={actionLoading}
                    className="btn"
                    style={{ background: "rgba(239, 68, 68, 0.15)", color: "#EF4444", border: "1px solid #EF4444", fontWeight: "700" }}
                  >
                    Reject Certificate
                  </button>
                )}

                {selectedCert.verification_status !== "approved" && (
                  <button
                    onClick={() => handleApprove(selectedCert.id)}
                    disabled={actionLoading}
                    className="btn btn-primary"
                    style={{ background: "#10B981", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <Check size={16} /> Approve & Grant Skill Badge
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0,0,0,0.8)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 1200, padding: "20px"
        }}>
          <div style={{
            background: "var(--color-surface)", borderRadius: "var(--radius-lg)",
            width: "100%", maxWidth: "480px", padding: "24px",
            border: "1px solid var(--color-border)", boxShadow: "var(--shadow-xl)"
          }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "#EF4444", margin: "0 0 8px 0" }}>
              Reject Skill Certificate
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", margin: "0 0 16px 0" }}>
              Please specify the rejection reason. The technician will be notified with instructions for resubmission.
            </p>

            <form onSubmit={handleRejectSubmit}>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "6px" }}>
                  Primary Reason:
                </label>
                <select 
                  className="form-input" 
                  value={rejectReason} 
                  onChange={(e) => setRejectReason(e.target.value)}
                  required
                >
                  <option value="">Select preset reason...</option>
                  {REJECTION_PRESETS.map((p, idx) => (
                    <option key={idx} value={p}>{p}</option>
                  ))}
                </select>
              </div>

              {rejectReason === "Other" && (
                <div style={{ marginBottom: "16px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", display: "block", marginBottom: "6px" }}>
                    Custom Explanation:
                  </label>
                  <textarea 
                    className="form-input" 
                    rows="3" 
                    placeholder="Provide specific notes for the applicant..."
                    value={customRejectNote}
                    onChange={(e) => setCustomRejectNote(e.target.value)}
                    required
                  />
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px", marginTop: "18px" }}>
                <button 
                  type="button" 
                  onClick={() => setShowRejectModal(false)}
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={!rejectReason || actionLoading}
                  className="btn"
                  style={{ background: "#EF4444", color: "white", fontWeight: "800" }}
                >
                  {actionLoading ? "Processing..." : "Confirm Rejection"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
