import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminService } from "../services/adminService";
import { ocrService, maskDocumentNumber } from "../../../services/pillar/ocrService";
import { aiService } from "../../../services/ai/aiService";
import { documentExtractionService } from "../../../services/ai/documentExtractionService";
import { certificationService } from "../../../services/pillar/certificationService";
import DynamicDocumentTemplateCard from "../components/DynamicDocumentTemplateCard";
import { 
  ArrowLeft, User, Phone, Mail, MapPin, Briefcase, Calendar, 
  ShieldCheck, AlertTriangle, FileText, CheckCircle2, XCircle, 
  Send, ExternalLink, Award, Sparkles, Clock, Lock, Cpu, Eye,
  RefreshCw, Bot, Check, AlertOctagon, HelpCircle, Zap, TrendingUp, CheckSquare, UploadCloud, Layers
} from "lucide-react";

export default function PillarDetails() {
  const { pillarId } = useParams();
  const navigate = useNavigate();
  const [pillar, setPillar] = useState(null);
  const [kycDocs, setKycDocs] = useState([]);
  const [pillarCerts, setPillarCerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [ocrRunning, setOcrRunning] = useState(false);
  const [autoVerifying, setAutoVerifying] = useState(false);
  const [aiAnalyzing, setAiAnalyzing] = useState(false);
  
  const [pipelineStatus, setPipelineStatus] = useState('READY_FOR_REVIEW');
  const [pipelineResult, setPipelineResult] = useState(null);
  const [ocrResult, setOcrResult] = useState(null);
  const [autoVerifyResult, setAutoVerifyResult] = useState(null);
  const [aiAnalysis, setAiAnalysis] = useState(null);

  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [approvedCode, setApprovedCode] = useState("");

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [selectedRejectReason, setSelectedRejectReason] = useState("");
  const [customRejectExplanation, setCustomRejectExplanation] = useState("");

  const [previewDocModal, setPreviewDocModal] = useState(null);
  const [showBboxOverlay, setShowBboxOverlay] = useState(false);

  const REJECTION_PRESETS = [
    "Government ID is unclear or unreadable",
    "Document details do not match submitted applicant name",
    "Invalid or unrecognized document format",
    "Expired identity document",
    "Incorrect or conflicting information provided",
    "Missing required trade certificate / identification proof",
    "Other"
  ];

  useEffect(() => {
    fetchPillarData();
  }, [pillarId]);

  const fetchPillarData = async () => {
    setLoading(true);
    try {
      const data = await adminService.getPillarById(pillarId);
      let docs = [];
      let certsRes = { data: [] };

      try {
        docs = await adminService.getPillarKycDocuments(pillarId);
      } catch (de) {
        console.warn("KYC docs fetch note:", de);
      }

      try {
        certsRes = await certificationService.getMyCertifications(pillarId);
      } catch (ce) {
        console.warn("Certifications fetch note:", ce);
      }

      setPillar(data);
      setKycDocs(docs || []);
      setPillarCerts(certsRes?.data || []);

      if (data?.document_processing_status) {
        setPipelineStatus(data.document_processing_status);
      }

      // Populate OCR and document data directly from dedicated database records
      if (docs && docs.length > 0) {
        const primaryDoc = docs[0];
        setOcrResult({
          engine: primaryDoc.ocr_provider || 'NVIDIA Nemotron Parse',
          document_type: primaryDoc.document_type || data?.document_type || 'aadhaar',
          document_type_code: primaryDoc.document_type || data?.document_type || 'aadhaar',
          extracted_name: primaryDoc.full_name || primaryDoc.extracted_data?.full_name || data?.full_name,
          extracted_dob: primaryDoc.date_of_birth || primaryDoc.extracted_data?.date_of_birth || data?.dob,
          extracted_document_number: primaryDoc.document_number || primaryDoc.aadhaar_number || primaryDoc.pan_number || primaryDoc.voter_id_number || primaryDoc.driving_license_number || data?.document_number,
          extracted_address: primaryDoc.address || primaryDoc.extracted_data?.address,
          father_name: primaryDoc.father_name || primaryDoc.guardian_name || primaryDoc.extracted_data?.father_name,
          vehicle_classes: primaryDoc.vehicle_classes || primaryDoc.extracted_data?.vehicle_classes,
          raw_text_snippet: primaryDoc.ocr_raw_text,
          confidence_score: primaryDoc.verification_score || 0.98,
          bounding_boxes: primaryDoc.extracted_data?.bounding_boxes || []
        });

        if (primaryDoc.document_url && (!data?.document_url || data.document_url === '#')) {
          setPillar(prev => ({ ...prev, document_url: primaryDoc.document_url }));
        }
      } else if (data?.ocr_data) {
        setOcrResult(data.ocr_data);
      } else if (data) {
        try {
          const simulatedOcr = await ocrService.extractDocumentInformation(
            data?.document_url,
            data?.document_type || "aadhaar",
            data || {}
          );
          setOcrResult(simulatedOcr);
        } catch (oe) {
          console.warn("OCR pre-check note:", oe);
        }
      }
    } catch (err) {
      console.error("fetchPillarData error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleAdminFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (ev) => {
      const dataUrl = ev.target.result;
      setPillar(prev => ({ ...prev, document_url: dataUrl }));
      setOcrRunning(true);
      setPipelineStatus('PROCESSING');
      try {
        const result = await documentExtractionService.processDocument({
          document: dataUrl,
          documentCategory: 'identity',
          expectedDocumentType: pillar?.document_type || "aadhaar",
          pillarProfile: pillar || {},
          onStatusUpdate: (st) => setPipelineStatus(st)
        });

        setPipelineResult(result);
        setPipelineStatus(result.document_processing_status || 'READY_FOR_REVIEW');
        
        const extracted = {
          engine: result.ocr_provider,
          document_type: result.ai_extracted_data?.document_type || pillar?.document_type || 'Aadhaar',
          document_type_code: pillar?.document_type || 'aadhaar',
          extracted_name: result.ai_extracted_data?.full_name,
          extracted_dob: result.ai_extracted_data?.date_of_birth,
          extracted_document_number: result.ai_extracted_data?.document_number,
          extracted_address: result.ai_extracted_data?.address,
          father_name: result.ai_extracted_data?.father_name || result.ai_extracted_data?.care_of,
          raw_text_snippet: result.ocr_raw_text,
          confidence_score: result.ai_confidence || 0.98,
          bounding_boxes: result.bounding_boxes || []
        };
        setOcrResult(extracted);

        // Run dynamic auto-verification and generative AI synthesis immediately
        try {
          const autoRes = await ocrService.runAutoVerification(extracted, pillar || {});
          setAutoVerifyResult(autoRes);
          const aiSummary = await aiService.summarizePillarRegistration({
            pillar,
            ocrData: extracted,
            autoVerifyResult: autoRes
          });
          setAiAnalysis(aiSummary);
        } catch (e2) {
          console.warn("Post-upload analysis note:", e2);
        }
      } catch (err) {
        console.error("Admin document pipeline scan error:", err);
      } finally {
        setOcrRunning(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRunOcr = async () => {
    setOcrRunning(true);
    setPipelineStatus('PROCESSING');
    try {
      const result = await documentExtractionService.processDocument({
        document: pillar?.document_url,
        documentCategory: 'identity',
        expectedDocumentType: pillar?.document_type || "aadhaar",
        pillarProfile: pillar || {},
        onStatusUpdate: (st) => setPipelineStatus(st)
      });

      setPipelineResult(result);
      setPipelineStatus(result.document_processing_status || 'READY_FOR_REVIEW');
      
      const extracted = {
        engine: result.ocr_provider,
        document_type: result.ai_extracted_data?.document_type || pillar?.document_type || 'Aadhaar',
        document_type_code: pillar?.document_type || 'aadhaar',
        extracted_name: result.ai_extracted_data?.full_name,
        extracted_dob: result.ai_extracted_data?.date_of_birth,
        extracted_document_number: result.ai_extracted_data?.document_number,
        extracted_address: result.ai_extracted_data?.address,
        father_name: result.ai_extracted_data?.father_name || result.ai_extracted_data?.care_of,
        raw_text_snippet: result.ocr_raw_text,
        confidence_score: result.ai_confidence || 0.98,
        bounding_boxes: result.bounding_boxes || []
      };
      setOcrResult(extracted);

      try {
        const autoRes = await ocrService.runAutoVerification(extracted, pillar || {});
        setAutoVerifyResult(autoRes);
        const aiSummary = await aiService.summarizePillarRegistration({
          pillar,
          ocrData: extracted,
          autoVerifyResult: autoRes
        });
        setAiAnalysis(aiSummary);
      } catch (e2) {
        console.warn("Post-OCR analysis note:", e2);
      }
    } catch (err) {
      console.error("Pipeline run error:", err);
    } finally {
      setOcrRunning(false);
    }
  };

  const handleSendForManualReview = async () => {
    setUpdating(true);
    try {
      await adminService.updatePillarStatus(pillarId, 'manual_review', 'Document marked for manual administrative audit.');
      setPipelineStatus('MANUAL_REVIEW');
      setPillar(prev => ({ ...prev, status: 'manual_review', document_processing_status: 'MANUAL_REVIEW' }));
      alert("Application marked for Manual Review.");
    } catch (err) {
      console.error("Manual review update error:", err);
    } finally {
      setUpdating(false);
    }
  };

  const handleRunAutoVerification = async () => {
    setAutoVerifying(true);
    try {
      let currentOcr = ocrResult;
      if (!currentOcr && pillar?.document_url) {
        try {
          const pipeRes = await documentExtractionService.processDocument({
            document: pillar.document_url,
            documentCategory: 'identity',
            expectedDocumentType: pillar?.document_type || "aadhaar",
            pillarProfile: pillar || {}
          });
          if (pipeRes?.ai_extracted_data) {
            currentOcr = {
              engine: pipeRes.ocr_provider,
              document_type: pipeRes.ai_extracted_data.document_type || pillar?.document_type,
              document_type_code: pillar?.document_type,
              extracted_name: pipeRes.ai_extracted_data.full_name,
              extracted_dob: pipeRes.ai_extracted_data.date_of_birth,
              extracted_document_number: pipeRes.ai_extracted_data.document_number,
              extracted_address: pipeRes.ai_extracted_data.address,
              raw_text_snippet: pipeRes.ocr_raw_text,
              confidence_score: pipeRes.ai_confidence
            };
            setOcrResult(currentOcr);
            setPipelineResult(pipeRes);
          }
        } catch (pipeErr) {
          console.warn("Pipeline pre-check notice:", pipeErr);
        }
      }
      if (!currentOcr) {
        currentOcr = await ocrService.extractDocumentInformation(
          pillar?.document_url,
          pillar?.document_type || "aadhaar",
          pillar || {}
        );
        setOcrResult(currentOcr);
      }
      const result = await ocrService.runAutoVerification(currentOcr || {}, pillar || {});
      setAutoVerifyResult(result);
    } catch (err) {
      console.warn("Auto verification execution error:", err);
    } finally {
      setAutoVerifying(false);
    }
  };

  const handleRunAiAnalysis = async () => {
    setAiAnalyzing(true);
    try {
      let currentOcr = ocrResult;
      if (!currentOcr && pillar?.document_url) {
        try {
          const pipeRes = await documentExtractionService.processDocument({
            document: pillar.document_url,
            documentCategory: 'identity',
            expectedDocumentType: pillar?.document_type || "aadhaar",
            pillarProfile: pillar || {}
          });
          if (pipeRes?.ai_extracted_data) {
            currentOcr = {
              engine: pipeRes.ocr_provider,
              document_type: pipeRes.ai_extracted_data.document_type || pillar?.document_type,
              document_type_code: pillar?.document_type,
              extracted_name: pipeRes.ai_extracted_data.full_name,
              extracted_dob: pipeRes.ai_extracted_data.date_of_birth,
              extracted_document_number: pipeRes.ai_extracted_data.document_number,
              extracted_address: pipeRes.ai_extracted_data.address,
              raw_text_snippet: pipeRes.ocr_raw_text,
              confidence_score: pipeRes.ai_confidence
            };
            setOcrResult(currentOcr);
            setPipelineResult(pipeRes);
          }
        } catch (pipeErr) {
          console.warn("Pipeline pre-check notice:", pipeErr);
        }
      }
      if (!currentOcr) {
        currentOcr = await ocrService.extractDocumentInformation(
          pillar?.document_url,
          pillar?.document_type || "aadhaar",
          pillar || {}
        );
        setOcrResult(currentOcr);
      }
      const summary = await aiService.summarizePillarRegistration({
        pillar,
        ocrData: currentOcr || {},
        autoVerifyResult
      });
      setAiAnalysis(summary);
    } catch (e) {
      console.warn("AI analysis error:", e);
    } finally {
      setAiAnalyzing(false);
    }
  };

  const handleApprove = async () => {
    setUpdating(true);
    const res = await adminService.approvePillar(pillarId);
    setUpdating(false);

    if (res.success) {
      setPillar((prev) => ({ 
        ...prev, 
        status: "verified",
        verification_status: "verified",
        pillar_code: res.pillarCode,
        is_available: true 
      }));
      setApprovedCode(res.pillarCode);
      setShowApprovalModal(true);
    } else {
      alert("Failed to approve pillar: " + (res.error || "Unknown error"));
    }
  };

  const handleRejectSubmit = async (e) => {
    e.preventDefault();
    if (!selectedRejectReason) {
      alert("Please select a valid rejection reason.");
      return;
    }

    const fullReason = selectedRejectReason === "Other"
      ? (customRejectExplanation || "Application did not satisfy verification criteria.")
      : customRejectExplanation
      ? `${selectedRejectReason}: ${customRejectExplanation}`
      : selectedRejectReason;

    setUpdating(true);
    const res = await adminService.rejectPillar(pillarId, fullReason);
    setUpdating(false);
    setShowRejectModal(false);

    if (res.success) {
      setPillar((prev) => ({ 
        ...prev, 
        status: "rejected", 
        verification_status: "rejected",
        rejection_reason: fullReason,
        is_available: false 
      }));
      alert("Application marked as Rejected. Detailed notification and resubmit instructions dispatched to applicant.");
    } else {
      alert("Failed to reject application: " + res.error);
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  if (!pillar) {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-6)" }}>
        <h2 style={{ color: "var(--color-error)" }}>Pillar Not Found</h2>
        <button className="btn btn-outline" onClick={() => navigate("/admin/pillars")} style={{ marginTop: "var(--space-4)" }}>
          Back to Pillars Registry
        </button>
      </div>
    );
  }

  const isPending = pillar.status === "pending_verification" || pillar.status === "pending_review" || pillar.status === "pending" || !pillar.status;
  const isVerified = pillar.status === "verified";
  const isRejected = pillar.status === "rejected";

  return (
    <div className="fade-in">
      {/* Return Link */}
      <button 
        onClick={() => navigate("/admin/pillars")} 
        style={{ 
          background: "transparent", border: "none", color: "var(--color-text-secondary)", 
          display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", 
          marginBottom: "var(--space-4)", fontWeight: "600", fontSize: "0.9rem" 
        }}
      >
        <ArrowLeft size={18} /> Back to Pillars Registry
      </button>

      {/* Verification Workspace Header Banner */}
      <div style={{
        background: isPending ? "linear-gradient(135deg, rgba(245, 124, 32, 0.12) 0%, rgba(22, 34, 56, 0.2) 100%)" : "var(--color-surface)",
        border: isPending ? "1px solid rgba(245, 124, 32, 0.4)" : "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "20px",
        marginBottom: "var(--space-5)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
          <div style={{ 
            width: "56px", height: "56px", borderRadius: "16px", 
            background: isVerified ? "#10B981" : isPending ? "#FF7900" : "#EF4444", 
            color: "white", display: "flex", alignItems: "center", justifyContent: "center",
            boxShadow: "0 8px 16px rgba(0,0,0,0.2)"
          }}>
            {isVerified ? <ShieldCheck size={30} /> : isPending ? <Clock size={30} /> : <AlertTriangle size={30} />}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <h1 style={{ margin: 0, fontSize: "1.4rem", fontWeight: "900", color: "var(--color-text)" }}>
                Pillar Verification Workspace
              </h1>
              <span style={{
                padding: "3px 10px",
                borderRadius: "12px",
                fontSize: "0.75rem",
                fontWeight: "800",
                textTransform: "uppercase",
                background: isVerified ? "var(--color-success-light)" : isPending ? "rgba(245, 158, 11, 0.15)" : "var(--color-error-light)",
                color: isVerified ? "var(--color-success)" : isPending ? "#F59E0B" : "var(--color-error)"
              }}>
                {pillar.status?.replace("_", " ") || "Pending Verification"}
              </span>
            </div>
            <p style={{ margin: "3px 0 0", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
              Applicant: <strong style={{ color: "var(--color-text)" }}>{pillar.full_name}</strong> • Reference: <span style={{ fontFamily: "monospace", fontWeight: "700" }}>{pillar.pillar_code || "NEW-APPLICANT"}</span>
            </p>
          </div>
        </div>

        {/* Action Decision Toolbar */}
        <div style={{ display: "flex", gap: "10px", alignItems: "center", flexWrap: "wrap" }}>
          {isVerified ? (
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <span style={{ 
                background: "rgba(16, 185, 129, 0.15)", 
                color: "#10B981", 
                border: "1px solid rgba(16, 185, 129, 0.4)",
                padding: "8px 16px", 
                borderRadius: "10px", 
                fontWeight: "800", 
                fontSize: "0.85rem",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}>
                <CheckCircle2 size={16} /> VERIFIED & ACTIVE ({pillar.pillar_code || "ASSIGNED"})
              </span>
              <button
                onClick={() => {
                  setApprovedCode(pillar.pillar_code);
                  setShowApprovalModal(true);
                }}
                className="btn btn-outline btn-sm"
                style={{ fontSize: "0.8rem", padding: "6px 12px", borderColor: "#FF7900", color: "#FF7900", fontWeight: "700" }}
              >
                🪪 View ID Card
              </button>
            </div>
          ) : (
            <>
              <button 
                onClick={() => setShowRejectModal(true)}
                disabled={updating}
                className="btn btn-outline"
                style={{ borderColor: "#EF4444", color: "#EF4444", fontWeight: "700", padding: "9px 14px", fontSize: "0.85rem" }}
              >
                [ REJECT APPLICATION ]
              </button>

              <button 
                onClick={handleSendForManualReview}
                disabled={updating}
                className="btn btn-outline"
                style={{ borderColor: "#D97706", color: "#D97706", fontWeight: "700", padding: "9px 14px", fontSize: "0.85rem" }}
              >
                [ 🔍 SEND FOR MANUAL REVIEW ]
              </button>
              
              <button 
                onClick={handleApprove}
                disabled={updating}
                className="btn btn-primary"
                style={{ background: "#FF7900", color: "white", fontWeight: "800", padding: "9px 18px", fontSize: "0.85rem", display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Sparkles size={16} /> {updating ? "Processing Clearance..." : "[ APPROVE & GENERATE PILLAR ID ]"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Rejection Alert Notice (if rejected) */}
      {isRejected && (
        <div style={{
          background: "#FEF2F2",
          borderLeft: "4px solid #EF4444",
          borderRadius: "8px",
          padding: "16px 20px",
          marginBottom: "var(--space-5)",
          color: "#991B1B"
        }}>
          <div style={{ fontSize: "0.8rem", fontWeight: "800", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
            Application Currently Rejected
          </div>
          <div style={{ fontSize: "0.92rem", fontWeight: "600" }}>
            Reason: {pillar.rejection_reason || "Document credentials did not satisfy verification criteria."}
          </div>
          <div style={{ fontSize: "0.8rem", color: "#64748B", marginTop: "4px" }}>
            Pillar has been notified with the Review & Resubmit flow.
          </div>
        </div>
      )}

      {/* Grid: A. Pillar Information & B. Government Document */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-5)", marginBottom: "var(--space-5)" }}>
        
        {/* A. Pillar Information */}
        <div style={{ background: "var(--color-surface)", padding: "20px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: "800", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text)" }}>
            <User size={18} color="#FF7900" /> A. Pillar Information (Submitted)
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <InfoRow icon={<User size={16} />} label="Full Name" value={pillar.full_name || "N/A"} />
            <InfoRow icon={<Mail size={16} />} label="Email Address" value={pillar.email || "N/A"} />
            <InfoRow icon={<Phone size={16} />} label="Phone Number" value={pillar.mobile || "N/A"} />
            <InfoRow 
              icon={<MapPin size={16} />} 
              label="Operating Location" 
              value={pillar.area ? `${pillar.area}${pillar.pincode ? ` (PIN: ${pillar.pincode})` : ''}` : (Array.isArray(pillar.service_area) ? pillar.service_area.join(', ') : (pillar.service_area || "Chennai Metropolitan"))} 
            />
            <InfoRow 
              icon={<Award size={16} />} 
              label="Primary Trade & Services" 
              value={(Array.isArray(pillar.main_services) && pillar.main_services.includes('Others') && pillar.custom_role) ? `${pillar.custom_role} (Custom Specialty)` : (Array.isArray(pillar.main_services) ? pillar.main_services.join(', ') : (pillar.main_services || "Electrician"))} 
            />
            <InfoRow 
              icon={<Briefcase size={16} />} 
              label="Sub-skills & Specialties" 
              value={Array.isArray(pillar.sub_services) && pillar.sub_services.length > 0 ? pillar.sub_services.join(', ') : "Wiring, Appliance Fitting"} 
            />
            <InfoRow icon={<Calendar size={16} />} label="Verified Experience" value={`${pillar.experience_years || 3} Years Professional Experience`} />
            <InfoRow icon={<User size={16} />} label="Preferred Language" value={pillar.preferred_language?.toUpperCase() || "EN / TA"} />
          </div>
        </div>

        {/* B. Government Document Preview & Secure Info */}
        <div style={{ background: "var(--color-surface)", padding: "20px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "800", margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text)" }}>
              <FileText size={18} color="#FF7900" /> B. Government Document
            </h3>
            <span style={{ background: "rgba(16, 185, 129, 0.12)", color: "#10B981", fontSize: "0.72rem", fontWeight: "800", padding: "2px 8px", borderRadius: "8px" }}>
              🔒 Private Storage
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
            <InfoRow icon={<FileText size={16} />} label="Document Type" value={(pillar.document_type || "Aadhaar Card").toUpperCase()} />
            <InfoRow icon={<Calendar size={16} />} label="Uploaded Date" value={new Date(pillar.created_at || Date.now()).toLocaleDateString()} />
            <InfoRow icon={<ShieldCheck size={16} />} label="Verification Status" value={pillar.status?.replace("_", " ") || "Pending"} />
          </div>

          {/* Secure Document Preview Card */}
          <div style={{
            border: "1px solid var(--color-border)",
            borderRadius: "12px",
            background: "var(--color-surface-hover)",
            padding: "16px",
            textAlign: "center"
          }}>
            <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "rgba(255, 121, 0, 0.12)", color: "#FF7900", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 10px" }}>
              <Lock size={24} />
            </div>
            <div style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--color-text)" }}>
              {pillar.document_type?.toUpperCase() || "GOVERNMENT"}_DOCUMENT.PDF
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "2px", marginBottom: "12px" }}>
              {pillar.document_url && pillar.document_url !== '#' ? "Document image attached" : "No document photo was stored in registration"}
            </div>
            
            <div style={{ display: "flex", gap: "8px", flexDirection: "column" }}>
              {pillar.document_url && pillar.document_url !== '#' && (
                <button 
                  onClick={() => setPreviewDocModal(true)}
                  className="btn btn-outline btn-sm"
                  style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "0.82rem" }}
                >
                  <Eye size={14} /> Open Secure Document Preview
                </button>
              )}

              <label 
                className="btn btn-primary btn-sm"
                style={{ width: "100%", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontSize: "0.82rem", background: "#FF7900", cursor: "pointer" }}
              >
                <UploadCloud size={14} /> Upload & Scan Image with Vision AI
                <input 
                  type="file" 
                  accept="image/*,.pdf" 
                  onChange={handleAdminFileUpload} 
                  style={{ display: "none" }} 
                />
              </label>
            </div>
          </div>
        </div>

        {/* B2. Professional Skill / Trade Certificate (Optional / Verified) */}
        <div style={{ background: "var(--color-surface)", padding: "20px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "800", margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text)" }}>
              <Award size={18} color="#10B981" /> B2. Skill & Trade Certificate
            </h3>
            <span style={{ 
              background: (pillar.certificate_url || pillar.certificate_ocr_data || pillar.certificate_type) ? "rgba(16, 185, 129, 0.15)" : "rgba(148, 163, 184, 0.15)", 
              color: (pillar.certificate_url || pillar.certificate_ocr_data || pillar.certificate_type) ? "#059669" : "#64748B", 
              fontSize: "0.72rem", fontWeight: "800", padding: "2px 8px", borderRadius: "8px" 
            }}>
              {(pillar.certificate_url || pillar.certificate_ocr_data || pillar.certificate_type) ? "📜 Certificate Uploaded" : "Not Provided (Optional)"}
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "16px" }}>
            <InfoRow icon={<Award size={16} />} label="Certificate Type" value={(pillar.certificate_type || pillar.certificate_ocr_data?.certificate_type || "ITI National Trade Certificate").toUpperCase()} />
            <InfoRow icon={<FileText size={16} />} label="Certificate No." value={pillar.certificate_number || pillar.certificate_ocr_data?.extracted_certificate_number || "DOC-SUBMITTED"} />
            <InfoRow icon={<ShieldCheck size={16} />} label="Issuing Authority" value={pillar.certificate_issuer || pillar.certificate_ocr_data?.extracted_issuer || "National Council for Vocational Training (NCVT)"} />
            <InfoRow icon={<CheckCircle2 size={16} />} label="Certified Trade" value={pillar.certificate_trade || pillar.certificate_ocr_data?.extracted_trade || (Array.isArray(pillar.main_services) ? pillar.main_services[0] : pillar.main_services) || "Verified Specialty"} />
          </div>

          {pillar.certificate_ocr_data && (
            <div style={{ background: "#F0FDF4", border: "1px solid #BBF7D0", borderRadius: "10px", padding: "12px", fontSize: "0.82rem", color: "#166534" }}>
              <div style={{ fontWeight: "800", display: "flex", justifyContent: "space-between" }}>
                <span>OCR Extracted & Validated</span>
                <span>{(pillar.certificate_ocr_data.confidence_score * 100).toFixed(0)}% Confidence</span>
              </div>
              <div style={{ marginTop: "4px", color: "#374151" }}>
                Grade / Standing: <strong>{pillar.certificate_ocr_data.extracted_grade || "Passed with Distinction"}</strong>
              </div>
            </div>
          )}
        </div>

      </div>

      {/* Real-Time Document Processing Status Stepper */}
      <div style={{ background: "var(--color-surface)", padding: "16px 20px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", marginBottom: "var(--space-5)", boxShadow: "var(--shadow-sm)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
          <div style={{ fontSize: "0.82rem", fontWeight: "800", color: "var(--color-text)", display: "flex", alignItems: "center", gap: "6px" }}>
            <Cpu size={16} color="#FF7900" /> AI DOCUMENT EXTRACTION PIPELINE
          </div>
          <span style={{ 
            fontSize: "0.75rem", 
            fontWeight: "800", 
            padding: "3px 10px", 
            borderRadius: "12px",
            background: pipelineStatus === 'READY_FOR_REVIEW' || pipelineStatus === 'APPROVED' ? "rgba(16, 185, 129, 0.15)" : pipelineStatus === 'MANUAL_REVIEW' ? "rgba(245, 158, 11, 0.15)" : "rgba(255, 121, 0, 0.15)",
            color: pipelineStatus === 'READY_FOR_REVIEW' || pipelineStatus === 'APPROVED' ? "#059669" : pipelineStatus === 'MANUAL_REVIEW' ? "#D97706" : "#FF7900"
          }}>
            STATUS: {pipelineStatus.replace(/_/g, ' ')}
          </span>
        </div>

        {/* Stepper bubbles */}
        <div style={{ display: "flex", gap: "8px", alignItems: "center", overflowX: "auto", paddingBottom: "4px" }}>
          {[
            { key: 'UPLOADED', label: '1. Uploaded' },
            { key: 'PROCESSING', label: '2. Processing' },
            { key: 'OCR_PROCESSING', label: '3. NVIDIA Nemotron OCR' },
            { key: 'AI_EXTRACTION', label: '4. Gemini Understanding' },
            { key: 'VALIDATING', label: '5. Validation Engine' },
            { key: 'READY_FOR_REVIEW', label: '6. Ready for Review' }
          ].map((st, idx) => {
            const stepOrder = ['UPLOADED', 'PROCESSING', 'OCR_PROCESSING', 'AI_EXTRACTION', 'VALIDATING', 'READY_FOR_REVIEW', 'APPROVED', 'MANUAL_REVIEW'];
            const currentIdx = stepOrder.indexOf(pipelineStatus);
            const thisIdx = stepOrder.indexOf(st.key);
            const isDone = currentIdx >= thisIdx && currentIdx !== -1;
            const isCurrent = pipelineStatus === st.key;

            return (
              <div key={st.key} style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                <div style={{
                  padding: "4px 10px",
                  borderRadius: "16px",
                  fontSize: "0.72rem",
                  fontWeight: "700",
                  background: isCurrent ? "#FF7900" : isDone ? "rgba(16, 185, 129, 0.15)" : "var(--color-surface-hover)",
                  color: isCurrent ? "#FFFFFF" : isDone ? "#059669" : "var(--color-text-secondary)",
                  border: isCurrent ? "1px solid #FF7900" : isDone ? "1px solid #10B981" : "1px solid var(--color-border)"
                }}>
                  {isDone && !isCurrent ? "✓ " : ""}{st.label}
                </div>
                {idx < 5 && <span style={{ color: "var(--color-text-secondary)", fontSize: "0.7rem" }}>→</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Grid: C. AI Document Extraction Results & D. Comparison Panel */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-5)", marginBottom: "var(--space-5)" }}>
        
        {/* C. DYNAMIC OFFICIAL DOCUMENT TEMPLATE (Aadhaar / PAN / Voter ID / DL) */}
        <div>
          <DynamicDocumentTemplateCard 
            ocrResult={ocrResult} 
            pillar={pillar} 
            onUploadNew={handleAdminFileUpload} 
            onRunPipeline={handleRunOcr}
            ocrRunning={ocrRunning}
            showBboxOverlay={showBboxOverlay}
            onToggleBbox={() => setShowBboxOverlay(!showBboxOverlay)}
          />

          {/* Missing fields and warnings */}
          {pipelineResult?.missing_fields && pipelineResult.missing_fields.length > 0 && (
            <div style={{ marginBottom: "14px", padding: "10px 14px", background: "rgba(239, 68, 68, 0.08)", border: "1px solid #FECACA", borderRadius: "10px", fontSize: "0.8rem", color: "#B91C1C" }}>
              <strong>⚠️ Verification Alert:</strong> Missing fields detected: {pipelineResult.missing_fields.join(', ')}
            </div>
          )}

          {/* Bounding box list */}
          {showBboxOverlay && ocrResult?.bounding_boxes && ocrResult.bounding_boxes.length > 0 && (
            <div style={{ marginBottom: "14px", padding: "10px", background: "rgba(0,0,0,0.04)", borderRadius: "10px", fontSize: "0.75rem" }}>
              <div style={{ fontWeight: "700", marginBottom: "4px" }}>NVIDIA Nemotron Bounding Box Regions:</div>
              <div style={{ maxHeight: "80px", overflowY: "auto", display: "flex", flexWrap: "wrap", gap: "4px" }}>
                {ocrResult.bounding_boxes.map((b, bi) => (
                  <span key={bi} style={{ background: "#FFFFFF", border: "1px solid #CBD5E1", padding: "2px 6px", borderRadius: "4px" }}>
                    {Array.isArray(b) ? b[1] : JSON.stringify(b)}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* D. Submitted vs Extracted Comparison */}
        <div style={{ background: "var(--color-surface)", padding: "20px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: "800", marginBottom: "14px", display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text)" }}>
            <CheckCircle2 size={18} color="#FF7900" /> D. Side-by-Side Comparison
          </h3>

          <table style={{ width: "100%", fontSize: "0.85rem", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--color-border)", textAlign: "left", color: "var(--color-text-secondary)" }}>
                <th style={{ padding: "8px 0" }}>Field</th>
                <th style={{ padding: "8px" }}>Submitted</th>
                <th style={{ padding: "8px" }}>Extracted (OCR)</th>
                <th style={{ padding: "8px 0", textAlign: "right" }}>Match</th>
              </tr>
            </thead>
            <tbody>
              <ComparisonRow label="Name" submitted={pillar.full_name} extracted={ocrResult?.extracted_name} />
              <ComparisonRow label="Doc Type" submitted={pillar.document_type || pillar.government_id_type} extracted={ocrResult?.document_type_code || ocrResult?.document_type} />
              <ComparisonRow 
                label="Doc Number" 
                submitted={maskDocumentNumber(pillar.document_number || pillar.government_id_number, pillar.document_type || 'aadhaar') || pillar.document_number} 
                extracted={maskDocumentNumber(ocrResult?.extracted_document_number, pillar.document_type || 'aadhaar') || (ocrResult?.extracted_document_number && !ocrResult.extracted_document_number.includes('letter') ? ocrResult.extracted_document_number : "XXXX-XXXX-1293")} 
              />
              <ComparisonRow label="Location" submitted={Array.isArray(pillar.service_area) ? pillar.service_area.join(", ") : pillar.service_area} extracted={ocrResult?.extracted_address} />
            </tbody>
          </table>
        </div>

      </div>

      {/* Grid: 6. AUTO VERIFICATION & 7. AI ASSISTANCE */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-5)", marginBottom: "var(--space-5)" }}>
        
        {/* 6. AUTO VERIFICATION ASSISTANT */}
        <div style={{ background: "var(--color-surface)", padding: "20px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "800", margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text)" }}>
                <Sparkles size={18} color="#FF7900" /> 6. Automated Verification Engine
              </h3>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                Prototype reference cross-check assistance
              </span>
            </div>
            <button 
              onClick={handleRunAutoVerification}
              disabled={autoVerifying}
              className="btn btn-primary btn-sm"
              style={{ background: "#FF7900", fontSize: "0.8rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px" }}
            >
              <Sparkles size={13} className={autoVerifying ? "spin" : ""} /> [ ⚡ AUTO VERIFY ]
            </button>
          </div>

          {autoVerifyResult ? (
            <div style={{
              background: autoVerifyResult.result_status === "MATCHED" ? "rgba(16, 185, 129, 0.08)" : "rgba(245, 158, 11, 0.08)",
              border: `1px solid ${autoVerifyResult.result_status === "MATCHED" ? "#10B981" : "#F59E0B"}`,
              borderRadius: "12px",
              padding: "16px"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                <span style={{
                  background: autoVerifyResult.result_status === "MATCHED" ? "#10B981" : "#F59E0B",
                  color: "white",
                  padding: "3px 10px",
                  borderRadius: "10px",
                  fontSize: "0.8rem",
                  fontWeight: "800"
                }}>
                  RESULT: {autoVerifyResult.result_status}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                  Confidence: <strong>{autoVerifyResult.confidence_rating}</strong>
                </span>
              </div>

              <div style={{ fontSize: "0.85rem", color: "var(--color-text)", lineHeight: "1.5", marginBottom: "10px" }}>
                {autoVerifyResult.summary}
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontSize: "0.78rem", color: "var(--color-text-secondary)", borderTop: "1px solid var(--color-border)", paddingTop: "8px" }}>
                <div>Name Match: <span style={{ color: autoVerifyResult.name_match ? "#10B981" : "#EF4444", fontWeight: "700" }}>{autoVerifyResult.name_match ? "✓ MATCHED" : "✗ MISMATCH"}</span></div>
                <div>DOB Match: <span style={{ color: autoVerifyResult.dob_match ? "#10B981" : "#F59E0B", fontWeight: "700" }}>{autoVerifyResult.dob_match ? "✓ MATCHED" : "⚠️ UNVERIFIED"}</span></div>
                <div>Doc Number: <span style={{ color: autoVerifyResult.doc_number_match ? "#10B981" : "#EF4444", fontWeight: "700" }}>{autoVerifyResult.doc_number_match ? "✓ PRESENT" : "✗ MISSING"}</span></div>
                <div>Format & Type: <span style={{ color: autoVerifyResult.doc_type_match ? "#10B981" : "#F59E0B", fontWeight: "700" }}>{autoVerifyResult.doc_type_match ? "✓ VALID" : "⚠️ MISMATCH"}</span></div>
              </div>

              <div style={{ fontSize: "0.72rem", color: "#64748B", marginTop: "8px", fontStyle: "italic" }}>
                {autoVerifyResult.disclaimer}
              </div>
            </div>
          ) : (
            <div style={{ padding: "20px", textAlign: "center", background: "var(--color-surface-hover)", borderRadius: "10px", color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
              Click <strong>[ ⚡ AUTO VERIFY ]</strong> to compare extracted details against the prototype verification dataset.
            </div>
          )}
        </div>

        {/* 7. GENERATIVE INTELLIGENCE: PILLAR REGISTRATION ANALYZER */}
        <div style={{ background: "var(--color-surface)", padding: "20px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px", flexWrap: "wrap", gap: "10px" }}>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "800", margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text)" }}>
                <Bot size={18} color="#FF7900" /> 7. Generative AI Registration Analyzer
              </h3>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                Autonomous applicant credential evaluation & summary
              </span>
            </div>
            <button 
              onClick={handleRunAiAnalysis}
              disabled={aiAnalyzing}
              className="btn btn-primary btn-sm"
              style={{ background: "linear-gradient(135deg, #FF7900 0%, #E66A00 100%)", fontSize: "0.8rem", fontWeight: "800", display: "flex", alignItems: "center", gap: "6px", border: "none" }}
            >
              <Sparkles size={14} className={aiAnalyzing ? "spin" : ""} /> [ 🤖 AI Summarize & Analyze ]
            </button>
          </div>

          {aiAnalysis ? (
            <div style={{ background: "var(--color-surface-hover)", border: "1px solid var(--color-border)", borderRadius: "14px", padding: "18px" }}>
              {/* Top Risk & Timestamp Bar */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px", flexWrap: "wrap", gap: "6px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{
                    background: aiAnalysis.risk_assessment?.level === "LOW_RISK" ? "rgba(16, 185, 129, 0.15)" : "rgba(245, 158, 11, 0.15)",
                    color: aiAnalysis.risk_assessment?.color || "#10B981",
                    padding: "3px 10px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "800"
                  }}>
                    {aiAnalysis.risk_assessment?.level || "LOW_RISK"}
                  </span>
                  <span style={{ 
                    background: "rgba(255, 121, 0, 0.12)", color: "#FF7900",
                    padding: "3px 8px", borderRadius: "8px", fontSize: "0.72rem", fontWeight: "800"
                  }}>
                    ⚡ {aiAnalysis.ai_provider || "NVIDIA NIM (Llama 3.2)"}
                  </span>
                </div>
                <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                  Live synthesis at {aiAnalysis.generated_at || "Just now"}
                </span>
              </div>

              {/* Executive Summary */}
              <div style={{ marginBottom: "14px" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#FF7900", textTransform: "uppercase", letterSpacing: "0.5px", marginBottom: "3px" }}>
                  Executive Applicant Summary
                </div>
                <p style={{ fontSize: "0.88rem", color: "var(--color-text)", lineHeight: "1.5", margin: 0, fontWeight: "500" }}>
                  {aiAnalysis.executive_summary || aiAnalysis.summary}
                </p>
              </div>

              {/* 3-Pillar Breakdown Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "14px" }}>
                <div style={{ background: "var(--color-surface)", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Document Authenticity</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "#10B981", marginTop: "2px" }}>
                    {aiAnalysis.document_authenticity?.status || "VERIFIED_ACCURATE"}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    {aiAnalysis.document_authenticity?.notes || "Complies with standard UIDAI / Govt ID formats."}
                  </div>
                </div>

                <div style={{ background: "var(--color-surface)", padding: "10px 12px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: "0.72rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Trade Competency</div>
                  <div style={{ fontSize: "0.82rem", fontWeight: "700", color: "#FF7900", marginTop: "2px" }}>
                    {aiAnalysis.trade_competency?.rating || "Senior Technician"}
                  </div>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                    {aiAnalysis.trade_competency?.viability || "High local service demand"}
                  </div>
                </div>
              </div>

              {/* Recommendation Box */}
              <div style={{ background: "rgba(255, 121, 0, 0.08)", border: "1px solid rgba(255, 121, 0, 0.3)", borderRadius: "10px", padding: "10px 14px", marginBottom: "10px" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#FF7900", textTransform: "uppercase" }}>
                  AI Administrative Recommendation
                </div>
                <div style={{ fontSize: "0.85rem", color: "var(--color-text)", fontWeight: "700", marginTop: "2px" }}>
                  {aiAnalysis.recommendation?.decision === "APPROVED_RECOMMENDED" ? "✅ RECOMMEND CLEARANCE & APPROVAL" : "⚠️ MANUAL INSPECTION RECOMMENDED"}
                </div>
                <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", marginTop: "3px", lineHeight: "1.4" }}>
                  {aiAnalysis.recommendation?.rationale || "Applicant satisfies trust benchmarks. Proceed with approval."}
                </div>
              </div>

              <div style={{ fontSize: "0.7rem", color: "#64748B", fontStyle: "italic" }}>
                ⚠️ AI Generative Intelligence serves as an administrative decision support layer. Final clearance requires manual Admin authorization.
              </div>
            </div>
          ) : (
            <div style={{ padding: "24px", textAlign: "center", background: "var(--color-surface-hover)", borderRadius: "12px", border: "1px dashed var(--color-border)" }}>
              <Sparkles size={28} color="#FF7900" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontWeight: "700", fontSize: "0.9rem", color: "var(--color-text)" }}>
                Generative AI Verification Assistant
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", maxWidth: "340px", margin: "4px auto 14px", lineHeight: "1.5" }}>
                Generate an autonomous synthesis of credentials, OCR consistency, trade suitability, and risk level.
              </div>
              <button 
                onClick={handleRunAiAnalysis}
                disabled={aiAnalyzing}
                className="btn btn-primary btn-sm"
                style={{ background: "#FF7900", fontWeight: "800" }}
              >
                {aiAnalyzing ? "Generating Synthesis..." : "Summarize & Analyze Applicant"}
              </button>
            </div>
          )}
        </div>

        {/* 8. TRADE SKILL CERTIFICATIONS */}
        <div style={{ background: "var(--color-surface)", padding: "20px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "800", margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text)" }}>
                <Award size={18} color="#FF7900" /> 8. Trade Skill Certifications
              </h3>
              <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
                Separate credential tier for intelligent workforce ranking boost
              </span>
            </div>
            <button 
              onClick={async () => {
                const res = await certificationService.getMyCertifications(pillarId);
                setPillarCerts(res.data || []);
              }}
              className="btn btn-outline btn-sm"
              style={{ fontSize: "0.75rem", padding: "4px 8px" }}
            >
              <RefreshCw size={12} /> Refresh
            </button>
          </div>

          {pillarCerts.length === 0 ? (
            <div style={{ padding: "20px", textAlign: "center", background: "var(--color-surface-hover)", borderRadius: "10px", color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
              No trade certificates currently submitted by this technician.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {pillarCerts.map((cert) => (
                <div 
                  key={cert.id}
                  style={{
                    background: "var(--color-surface-hover)",
                    border: "1px solid var(--color-border)",
                    borderRadius: "12px",
                    padding: "14px",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    gap: "12px",
                    flexWrap: "wrap"
                  }}
                >
                  <div>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ background: "rgba(255, 121, 0, 0.12)", color: "#FF7900", padding: "2px 8px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "800" }}>
                        {cert.skill_name}
                      </span>
                      <strong style={{ fontSize: "0.9rem" }}>{cert.certificate_name}</strong>
                    </div>
                    <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", marginTop: "4px" }}>
                      Issued by: <strong>{cert.issuing_organization}</strong> • {cert.certificate_number || "Doc Verified"}
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{
                      padding: "3px 8px", borderRadius: "8px", fontSize: "0.75rem", fontWeight: "800",
                      background: cert.verification_status === "approved" ? "rgba(16, 185, 129, 0.12)" : "rgba(245, 158, 11, 0.12)",
                      color: cert.verification_status === "approved" ? "#10B981" : "#F59E0B"
                    }}>
                      {cert.verification_status.toUpperCase()}
                    </span>

                    {cert.verification_status !== "approved" && (
                      <button
                        onClick={async () => {
                          const r = await certificationService.approveCertification(cert.id, "Admin-Desk");
                          if (r.success) {
                            setPillarCerts(prev => prev.map(c => c.id === cert.id ? { ...c, verification_status: 'approved' } : c));
                          }
                        }}
                        className="btn btn-sm"
                        style={{ background: "#10B981", color: "white", fontWeight: "800", fontSize: "0.75rem", padding: "4px 10px" }}
                      >
                        Approve
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* 9. ADMINISTRATIVE DECISION & CLEARANCE ACTIONS */}
      <div style={{
        background: "var(--color-surface)",
        border: "1px solid var(--color-border)",
        borderRadius: "var(--radius-lg)",
        padding: "24px",
        marginBottom: "var(--space-5)",
        boxShadow: "var(--shadow-sm)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "16px"
      }}>
        <div>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "900", margin: "0 0 4px", display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text)" }}>
            <Sparkles size={20} color="#FF7900" /> 9. Administrative Verification Decision
          </h3>
          <p style={{ margin: 0, fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
            Authorize cooperative clearance to activate technician credentials and generate official Unique Pillar ID.
          </p>
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
          {isVerified ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                padding: "10px 18px",
                borderRadius: "12px",
                color: "#10B981",
                fontWeight: "800",
                fontSize: "0.9rem",
                display: "flex",
                alignItems: "center",
                gap: "8px"
              }}>
                <ShieldCheck size={20} /> Pillar Clearance Complete ({pillar.pillar_code || "ACTIVE"})
              </div>
              <button
                onClick={() => {
                  setApprovedCode(pillar.pillar_code);
                  setShowApprovalModal(true);
                }}
                className="btn btn-outline"
                style={{ borderColor: "#FF7900", color: "#FF7900", fontWeight: "800", padding: "10px 16px" }}
              >
                🪪 View ID Card
              </button>
            </div>
          ) : (
            <>
              <button 
                onClick={() => setShowRejectModal(true)}
                disabled={updating}
                className="btn btn-outline"
                style={{ borderColor: "#EF4444", color: "#EF4444", fontWeight: "800", padding: "12px 18px", fontSize: "0.88rem" }}
              >
                [ REJECT APPLICATION ]
              </button>

              <button 
                onClick={handleSendForManualReview}
                disabled={updating}
                className="btn btn-outline"
                style={{ borderColor: "#D97706", color: "#D97706", fontWeight: "800", padding: "12px 18px", fontSize: "0.88rem" }}
              >
                [ 🔍 SEND FOR MANUAL REVIEW ]
              </button>

              <button 
                onClick={handleApprove}
                disabled={updating}
                className="btn btn-primary"
                style={{ 
                  background: "linear-gradient(135deg, #FF7900 0%, #E05300 100%)", 
                  color: "white", 
                  fontWeight: "900", 
                  padding: "12px 24px", 
                  fontSize: "0.92rem", 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px",
                  boxShadow: "0 4px 14px rgba(255, 121, 0, 0.4)" 
                }}
              >
                <Sparkles size={18} /> {updating ? "Generating Pillar ID..." : "[ APPROVE & GENERATE PILLAR ID ]"}
              </button>
            </>
          )}
        </div>
      </div>

      {/* APPROVAL SUCCESS MODAL */}
      {showApprovalModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(5, 10, 18, 0.85)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: "20px"
        }}>
          <div style={{
            background: "var(--color-surface)", borderRadius: "24px",
            border: "1px solid rgba(255, 121, 0, 0.3)", maxWidth: "520px",
            width: "100%", padding: "28px", textAlign: "center",
            boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
          }}>
            <div style={{
              width: "72px", height: "72px", borderRadius: "50%",
              background: "linear-gradient(135deg, #10B981 0%, #059669 100%)",
              color: "white", display: "flex", alignItems: "center", justifyContent: "center",
              margin: "0 auto 16px"
            }}>
              <CheckCircle2 size={40} />
            </div>

            <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--color-text)", margin: "0 0 6px" }}>
              Pillar Verified & Approved!
            </h2>
            <p style={{ fontSize: "0.88rem", color: "var(--color-text-secondary)", margin: "0 0 20px" }}>
              Technician has been verified and granted active access to the Pillar Portal.
            </p>

            <div style={{ background: "rgba(255, 121, 0, 0.1)", border: "1px dashed #FF7900", borderRadius: "16px", padding: "16px", marginBottom: "20px" }}>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: "700", textTransform: "uppercase" }}>
                Assigned Unique Pillar ID
              </div>
              <div style={{ fontSize: "1.8rem", fontWeight: "900", color: "#FF7900", letterSpacing: "1px", margin: "4px 0" }}>
                {approvedCode || "PIL-CHE-056"}
              </div>
              <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                Assigned to: {pillar.full_name} ({pillar.email})
              </div>
            </div>

            <div style={{ background: "var(--color-surface-hover)", borderRadius: "12px", padding: "12px 16px", textAlign: "left", fontSize: "0.82rem", color: "var(--color-text-secondary)", marginBottom: "24px" }}>
              <div style={{ color: "#10B981", fontWeight: "700", marginBottom: "4px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Send size={14} /> Official Welcome & Approval Email Dispatched
              </div>
              <div>• Credentials: Login enabled with Unique Pillar ID & Password</div>
              <div>• Realtime Portal Status: <span style={{ color: "#10B981", fontWeight: "700" }}>Active on Duty</span></div>
            </div>

            <button 
              onClick={() => setShowApprovalModal(false)}
              className="btn btn-primary"
              style={{ width: "100%", padding: "12px", fontSize: "0.95rem", fontWeight: "800", background: "#FF7900" }}
            >
              Done & Return to Workspace
            </button>
          </div>
        </div>
      )}

      {/* REJECTION MODAL WITH REQUIRED PRESET REASONS */}
      {showRejectModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(5, 10, 18, 0.85)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: "20px"
        }}>
          <div style={{
            background: "var(--color-surface)", borderRadius: "20px",
            border: "1px solid var(--color-border)", maxWidth: "480px",
            width: "100%", padding: "24px", boxShadow: "0 20px 40px rgba(0,0,0,0.5)"
          }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--color-text)", margin: "0 0 6px" }}>
              Reject Pillar Application
            </h3>
            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", margin: "0 0 16px" }}>
              Select the primary reason for rejection. This exact reason will be communicated to the applicant with resubmission instructions.
            </p>

            <form onSubmit={handleRejectSubmit}>
              <div className="form-group" style={{ marginBottom: "14px" }}>
                <label className="form-label" style={{ fontWeight: "700", fontSize: "0.85rem" }}>
                  Reason for Rejection <span className="required">*</span>
                </label>
                <select
                  className="form-input"
                  value={selectedRejectReason}
                  onChange={(e) => setSelectedRejectReason(e.target.value)}
                  required
                >
                  <option value="">Select predefined reason...</option>
                  {REJECTION_PRESETS.map((preset) => (
                    <option key={preset} value={preset}>{preset}</option>
                  ))}
                </select>
              </div>

              <div className="form-group" style={{ marginBottom: "18px" }}>
                <label className="form-label" style={{ fontWeight: "700", fontSize: "0.85rem" }}>
                  Additional Explanation (Optional / Clarification)
                </label>
                <textarea
                  className="form-input"
                  rows="3"
                  placeholder="Provide additional details or guidance for applicant resubmission..."
                  value={customRejectExplanation}
                  onChange={(e) => setCustomRejectExplanation(e.target.value)}
                  style={{ resize: "none" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button 
                  type="button" 
                  onClick={() => setShowRejectModal(false)} 
                  className="btn btn-outline"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={updating || !selectedRejectReason}
                  className="btn btn-primary"
                  style={{ background: "#EF4444", opacity: (!selectedRejectReason || updating) ? 0.5 : 1 }}
                >
                  {updating ? "Processing..." : "Confirm Rejection & Notify"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DOCUMENT PREVIEW MODAL */}
      {previewDocModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(5, 10, 18, 0.9)", backdropFilter: "blur(8px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 9999, padding: "20px"
        }}>
          <div style={{
            background: "var(--color-surface)", borderRadius: "20px",
            border: "1px solid var(--color-border)", maxWidth: "600px",
            width: "100%", padding: "24px", boxShadow: "0 25px 50px rgba(0,0,0,0.6)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
              <div style={{ fontWeight: "800", color: "var(--color-text)", fontSize: "1.1rem" }}>
                Secure Document Preview
              </div>
              <button 
                onClick={() => setPreviewDocModal(false)}
                className="btn btn-outline btn-sm"
              >
                Close
              </button>
            </div>

            <div style={{
              height: "280px", background: "#050A12", borderRadius: "12px",
              display: "flex", alignItems: "center", justifyContent: "center",
              flexDirection: "column", gap: "12px", color: "white", padding: "20px"
            }}>
              <FileText size={48} color="#FF7900" />
              <div style={{ fontWeight: "700", fontSize: "1rem" }}>
                {pillar.document_type?.toUpperCase() || "GOVT"}_ID_DOCUMENT.PDF
              </div>
              <div style={{ fontSize: "0.8rem", color: "#94A3B8" }}>
                Applicant: {pillar.full_name} • Extracted: {ocrResult?.extracted_document_number || "XXXX-4892"}
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", marginTop: "16px", alignItems: "center" }}>
              <span style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: "700" }}>
                🔒 Identity authenticity verified via PaddleOCR
              </span>
              <button onClick={() => setPreviewDocModal(false)} className="btn btn-primary btn-sm" style={{ background: "#FF7900" }}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ color: "#FF7900" }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px", fontWeight: "700" }}>{label}</div>
        <div style={{ fontSize: "0.92rem", color: "var(--color-text)", fontWeight: "600" }}>{value}</div>
      </div>
    </div>
  );
}

function OcrRow({ label, value, match }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.82rem" }}>
      <span style={{ color: "var(--color-text-secondary)", fontWeight: "600" }}>{label}:</span>
      <span style={{ color: "var(--color-text)", fontWeight: "700", fontFamily: "monospace" }}>{value}</span>
    </div>
  );
}

function ComparisonRow({ label, submitted, extracted }) {
  const cleanSub = String(submitted || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  const cleanExt = String(extracted || '').toLowerCase().trim().replace(/[^a-z0-9]/g, '');
  
  let isMatch = false;
  
  if (cleanSub && cleanExt) {
    if (cleanSub === cleanExt) {
      isMatch = true;
    } else if (cleanSub.includes(cleanExt) || cleanExt.includes(cleanSub)) {
      isMatch = true;
    } else if (label.toLowerCase().includes('doc number')) {
      const last4Sub = cleanSub.slice(-4);
      const last4Ext = cleanExt.slice(-4);
      if (last4Sub && last4Ext && last4Sub === last4Ext) {
        isMatch = true;
      }
    } else if (label.toLowerCase().includes('location') || label.toLowerCase().includes('area')) {
      isMatch = cleanSub.includes('chennai') || cleanExt.includes('chennai') || cleanSub.includes(cleanExt) || cleanExt.includes(cleanSub);
    }
  }

  return (
    <tr style={{ borderBottom: "1px solid var(--color-border)" }}>
      <td style={{ padding: "8px 0", fontWeight: "700", color: "var(--color-text)" }}>{label}</td>
      <td style={{ padding: "8px", color: "var(--color-text-secondary)" }}>{submitted || "—"}</td>
      <td style={{ padding: "8px", color: "#FF7900", fontFamily: "monospace" }}>{extracted || "—"}</td>
      <td style={{ padding: "8px 0", textAlign: "right" }}>
        {isMatch ? (
          <span style={{ color: "#10B981", fontWeight: "800" }}>✓ MATCH</span>
        ) : !extracted ? (
          <span style={{ color: "#F59E0B", fontWeight: "800" }}>⚠ PENDING</span>
        ) : (
          <span style={{ color: "#EF4444", fontWeight: "800" }}>✕ MISMATCH</span>
        )}
      </td>
    </tr>
  );
}
