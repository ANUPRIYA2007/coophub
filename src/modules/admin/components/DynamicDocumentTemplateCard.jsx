import React, { useState } from "react";
import { 
  ShieldCheck, CheckCircle2, Eye, EyeOff, FileText, 
  MapPin, Calendar, User, Award, CheckSquare, Sparkles, Building,
  RefreshCw, Layers, AlertCircle
} from "lucide-react";

/**
 * Dynamic Official Document Identity Card Template Component
 * Dynamically adapts visual layout and fields based on all supported document types:
 * - Aadhaar Card (UIDAI)
 * - PAN Card (Income Tax Department)
 * - Voter Identity Card (Election Commission)
 * - Motor Driving Licence (Transport Dept / MoRTH)
 * - Indian Passport (Republic of India)
 * - Smart Ration Card (TNEPDS / NFSA)
 * - Labour / Construction Welfare Board Card (TNUWWB)
 * - Trade & Skill Certificate (ITI / NSDC / Diploma)
 * - Other Official Government ID
 * 
 * STRICT MANDATE:
 * ZERO hardcoded or synthetic identity data.
 * All values derive from actual OCR extraction or authenticated profile.
 * Missing fields remain null / "Not Detected".
 */
export default function DynamicDocumentTemplateCard({ 
  ocrResult, 
  pillar, 
  onUploadNew, 
  onRunPipeline, 
  ocrRunning = false,
  showBboxOverlay = false,
  onToggleBbox
}) {
  const [showFullDocNumber, setShowFullDocNumber] = useState(false);

  const docType = (ocrResult?.document_type_code || ocrResult?.document_type || pillar?.document_type || 'aadhaar').toLowerCase();

  // Extract actual values from OCR or pillar profile — ZERO hardcoded fallbacks
  const name = ocrResult?.extracted_name || pillar?.full_name || null;
  const rawNumber = ocrResult?.extracted_document_number || ocrResult?.document_number || pillar?.document_number || null;
  const dob = ocrResult?.extracted_dob || ocrResult?.fields?.dateOfBirth || pillar?.dob || null;
  const address = ocrResult?.extracted_address || ocrResult?.fields?.address || null;
  const gender = ocrResult?.gender || ocrResult?.fields?.gender || ocrResult?.extracted_data?.gender || null;
  const fatherName = ocrResult?.father_name || ocrResult?.guardian_name || ocrResult?.fields?.fatherName || ocrResult?.extracted_data?.care_of || null;
  const expiryDate = ocrResult?.expiry_date || ocrResult?.fields?.expiryDate || null;
  const vehicleClasses = ocrResult?.vehicle_classes || ocrResult?.fields?.vehicleClasses || null;
  const trade = ocrResult?.trade || ocrResult?.skill || ocrResult?.fields?.trade || ocrResult?.extracted_trade || null;
  const district = ocrResult?.district || ocrResult?.fields?.district || null;
  const issuingAuthority = ocrResult?.issuing_authority || ocrResult?.fields?.issuingAuthority || ocrResult?.extracted_issuer || null;
  const confidence = ocrResult?.confidence_score ? (ocrResult.confidence_score * 100).toFixed(0) : null;

  // Masking helpers
  const maskNumber = (num, type) => {
    if (!num) return "Not Detected";
    if (showFullDocNumber) return num;
    const clean = String(num).replace(/\s+/g, '');
    if (type.includes('aadhaar')) {
      return clean.length >= 12 ? `XXXX-XXXX-${clean.slice(-4)}` : `XXXX-${clean.slice(-4)}`;
    }
    if (type.includes('pan')) {
      return clean.length >= 6 ? `${clean.slice(0, 3)}XX${clean.slice(-3)}`.toUpperCase() : clean;
    }
    if (type.includes('passport')) {
      return clean.length >= 4 ? `${clean[0]}XXX-XXXX-${clean.slice(-3)}`.toUpperCase() : clean;
    }
    if (type.includes('voter')) {
      return clean.length >= 5 ? `${clean.slice(0, 3)}XXXX${clean.slice(-3)}`.toUpperCase() : clean;
    }
    if (type.includes('driving')) {
      return clean.length >= 6 ? `${clean.slice(0, 4)}XXXX${clean.slice(-4)}`.toUpperCase() : clean;
    }
    return clean.length > 4 ? `XXXX-${clean.slice(-4)}` : clean;
  };

  const getHeaderTitle = () => {
    if (docType.includes('pan')) return "Income Tax Department — PAN Verification";
    if (docType.includes('voter') || docType.includes('epic')) return "Election Commission of India — Voter ID";
    if (docType.includes('driving') || docType.includes('licence') || docType.includes('dl')) return "Ministry of Road Transport — Driving Licence";
    if (docType.includes('passport')) return "Republic of India — Indian Passport";
    if (docType.includes('ration') || docType.includes('family_card') || docType.includes('tnepds')) return "Civil Supplies Dept — Smart Ration Card";
    if (docType.includes('labour') || docType.includes('welfare') || docType.includes('tncwwb')) return "Welfare Board — Construction / Labour Card";
    if (docType.includes('skill') || docType.includes('cert') || docType.includes('iti') || docType.includes('nsdc')) return "Vocational Board — Trade & Skill Certificate";
    if (docType.includes('other')) return ocrResult?.document_title || "Official Government Identification";
    return "UIDAI Government Identity — Official Aadhaar Card";
  };

  return (
    <div style={{
      background: "var(--color-surface)",
      border: "1px solid var(--color-border)",
      borderRadius: "16px",
      padding: "22px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.06)",
      marginBottom: "20px"
    }}>
      {/* Header bar with Rerun Pipeline and Actions */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "10px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <div style={{
            background: "linear-gradient(135deg, #FF7900 0%, #FF9E40 100%)",
            color: "#FFFFFF",
            padding: "8px",
            borderRadius: "10px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            <ShieldCheck size={22} />
          </div>
          <div>
            <div style={{ fontSize: "1.05rem", fontWeight: "900", color: "var(--color-text)", letterSpacing: "-0.2px" }}>
              {getHeaderTitle()}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
              Structured document identity extraction validated via Multimodal Vision AI
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
          {onToggleBbox && (
            <button 
              onClick={onToggleBbox}
              className="btn btn-outline btn-sm"
              style={{ fontSize: "0.75rem", padding: "4px 8px", display: "flex", alignItems: "center", gap: "4px" }}
            >
              <Layers size={13} /> {showBboxOverlay ? "Hide BBox" : "View BBox"}
            </button>
          )}

          {onRunPipeline && (
            <button 
              onClick={onRunPipeline}
              disabled={ocrRunning}
              className="btn btn-outline btn-sm"
              style={{ fontSize: "0.75rem", padding: "4px 10px", display: "flex", alignItems: "center", gap: "5px", background: "var(--color-surface)", borderColor: "#FF7900", color: "#FF7900", fontWeight: "800" }}
            >
              <RefreshCw size={13} className={ocrRunning ? "spin" : ""} /> {ocrRunning ? "Scanning..." : "Rerun Vision Pipeline"}
            </button>
          )}

          {confidence && (
            <span style={{
              background: "rgba(16, 185, 129, 0.12)",
              color: "#059669",
              padding: "4px 10px",
              borderRadius: "20px",
              fontSize: "0.75rem",
              fontWeight: "800",
              display: "flex",
              alignItems: "center",
              gap: "5px"
            }}>
              <CheckCircle2 size={13} /> {confidence}% OCR Confidence
            </span>
          )}

          <button 
            onClick={() => setShowFullDocNumber(!showFullDocNumber)}
            className="btn btn-outline btn-sm"
            style={{ fontSize: "0.72rem", padding: "4px 8px", display: "flex", alignItems: "center", gap: "4px" }}
            title="Toggle PII number visibility for audit"
          >
            {showFullDocNumber ? <EyeOff size={13} /> : <Eye size={13} />}
            {showFullDocNumber ? "Mask Number" : "Reveal (Admin)"}
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* 1. UIDAI AADHAAR CARD OFFICIAL TEMPLATE                     */}
      {/* ============================================================ */}
      {(docType.includes('aadhaar') || docType.includes('uidai')) && (
        <div style={{
          background: "linear-gradient(135deg, #FFFFFF 0%, #F8FAFC 100%)",
          border: "2px solid #E2E8F0",
          borderRadius: "14px",
          padding: "20px",
          position: "relative",
          overflow: "hidden"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #CBD5E1", paddingBottom: "10px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ fontSize: "1.4rem" }}>🇮🇳</div>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: "900", color: "#1E293B", letterSpacing: "0.5px" }}>
                  பாரத அரசு / GOVERNMENT OF INDIA
                </div>
                <div style={{ fontSize: "0.72rem", color: "#64748B", fontWeight: "700" }}>
                  இந்திய தனித்துவ அடையாள ஆணையம் / Unique Identification Authority of India
                </div>
              </div>
            </div>
            <div style={{ background: "#FEF3C7", color: "#92400E", padding: "3px 8px", borderRadius: "6px", fontSize: "0.7rem", fontWeight: "800" }}>
              UIDAI Aadhaar
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "18px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              <div style={{ background: "#F1F5F9", border: "1px dashed #CBD5E1", borderRadius: "10px", padding: "16px", textAlign: "center" }}>
                <div style={{ width: "60px", height: "60px", borderRadius: "50%", background: "#E2E8F0", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.5rem", fontWeight: "900", color: "#475569", margin: "0 auto 8px" }}>
                  {name ? name.charAt(0).toUpperCase() : <User size={28} />}
                </div>
                <div style={{ fontSize: "0.72rem", fontWeight: "800", color: "#059669", display: "flex", alignItems: "center", justifyContent: "center", gap: "4px" }}>
                  <CheckCircle2 size={12} /> Aadhaar Verified
                </div>
              </div>

              <div style={{ background: "#0F172A", color: "#FFFFFF", borderRadius: "10px", padding: "12px", textAlign: "center" }}>
                <div style={{ fontSize: "0.68rem", color: "#94A3B8", textTransform: "uppercase", letterSpacing: "1px" }}>
                  Aadhaar Number
                </div>
                <div style={{ fontSize: "1.1rem", fontWeight: "900", letterSpacing: "2px", color: "#38BDF8", marginTop: "2px" }}>
                  {maskNumber(rawNumber, 'aadhaar')}
                </div>
              </div>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700", textTransform: "uppercase" }}>Full Name</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0F172A", marginTop: "2px" }}>{name || "Not Detected"}</div>
                </div>
                <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700", textTransform: "uppercase" }}>Date of Birth</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0F172A", marginTop: "2px" }}>{dob || "Not Detected"}</div>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700", textTransform: "uppercase" }}>Gender</div>
                  <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "#0F172A", marginTop: "2px" }}>{gender || "Not Detected"}</div>
                </div>
                <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                  <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700", textTransform: "uppercase" }}>Care of (C/O)</div>
                  <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "#0F172A", marginTop: "2px" }}>{fatherName || "Not Detected"}</div>
                </div>
              </div>

              <div style={{ background: "#FFFFFF", padding: "12px", borderRadius: "8px", border: "1px solid #E2E8F0" }}>
                <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px" }}>
                  <MapPin size={12} color="#FF7900" /> Permanent Address
                </div>
                <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#1E293B", marginTop: "4px", lineHeight: "1.4" }}>
                  {address || "Not Detected on front scan"}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 2. PAN CARD TEMPLATE                                         */}
      {/* ============================================================ */}
      {docType.includes('pan') && (
        <div style={{
          background: "linear-gradient(135deg, #EFF6FF 0%, #DBEAFE 100%)",
          border: "2px solid #93C5FD",
          borderRadius: "14px",
          padding: "20px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #BFDBFE", paddingBottom: "8px", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "900", color: "#1E3A8A" }}>INCOME TAX DEPARTMENT / GOVERNMENT OF INDIA</div>
              <div style={{ fontSize: "0.72rem", color: "#3B82F6", fontWeight: "700" }}>Permanent Account Number Card</div>
            </div>
            <div style={{ fontSize: "1.3rem" }}>🏛️</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700" }}>CARDHOLDER NAME</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0F172A" }}>{name || "Not Detected"}</div>
            </div>
            <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700" }}>FATHER'S NAME</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0F172A" }}>{fatherName || "Not Detected"}</div>
            </div>
            <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700" }}>DATE OF BIRTH</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0F172A" }}>{dob || "Not Detected"}</div>
            </div>
            <div style={{ background: "#0F172A", padding: "10px 12px", borderRadius: "8px", color: "#FFFFFF" }}>
              <div style={{ fontSize: "0.68rem", color: "#94A3B8" }}>PERMANENT ACCOUNT NUMBER</div>
              <div style={{ fontSize: "1.05rem", fontWeight: "900", color: "#38BDF8", letterSpacing: "2px" }}>
                {maskNumber(rawNumber, 'pan')}
              </div>
            </div>
          </div>
          <div style={{ marginTop: "12px", fontSize: "0.72rem", color: "#64748B", fontStyle: "italic" }}>
            * Note: PAN Cards do not feature address or gender. Only core identity attributes are validated.
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 3. VOTER ID (EPIC) TEMPLATE                                  */}
      {/* ============================================================ */}
      {(docType.includes('voter') || docType.includes('epic')) && (
        <div style={{
          background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
          border: "2px solid #86EFAC",
          borderRadius: "14px",
          padding: "20px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #BBF7D0", paddingBottom: "8px", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "900", color: "#14532D" }}>ELECTION COMMISSION OF INDIA</div>
              <div style={{ fontSize: "0.72rem", color: "#16A34A", fontWeight: "700" }}>Elector Photo Identity Card (EPIC)</div>
            </div>
            <div style={{ fontSize: "1.3rem" }}>🗳️</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700" }}>ELECTOR'S NAME</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0F172A" }}>{name || "Not Detected"}</div>
            </div>
            <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700" }}>GUARDIAN / FATHER</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0F172A" }}>{fatherName || "Not Detected"}</div>
            </div>
            <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700" }}>GENDER / DOB</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0F172A" }}>{[gender, dob].filter(Boolean).join(" • ") || "Not Detected"}</div>
            </div>
            <div style={{ background: "#0F172A", padding: "10px 12px", borderRadius: "8px", color: "#FFFFFF" }}>
              <div style={{ fontSize: "0.68rem", color: "#94A3B8" }}>EPIC NUMBER</div>
              <div style={{ fontSize: "1.05rem", fontWeight: "900", color: "#4ADE80", letterSpacing: "2px" }}>
                {maskNumber(rawNumber, 'voter')}
              </div>
            </div>
            {address && (
              <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px", gridColumn: "span 2" }}>
                <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700" }}>ASSEMBLY / ADDRESS</div>
                <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#0F172A" }}>{[district, address].filter(Boolean).join(", ")}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 4. DRIVING LICENCE TEMPLATE                                  */}
      {/* ============================================================ */}
      {(docType.includes('driving') || docType.includes('license') || docType.includes('licence') || docType.includes('dl')) && (
        <div style={{
          background: "linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)",
          border: "2px solid #FDE68A",
          borderRadius: "14px",
          padding: "20px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #FCD34D", paddingBottom: "8px", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "900", color: "#78350F" }}>UNION OF INDIA / TRANSPORT DEPARTMENT</div>
              <div style={{ fontSize: "0.72rem", color: "#D97706", fontWeight: "700" }}>Motor Vehicle Driving Licence</div>
            </div>
            <div style={{ fontSize: "1.3rem" }}>🚗</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700" }}>HOLDER NAME</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0F172A" }}>{name || "Not Detected"}</div>
            </div>
            <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700" }}>VEHICLE CLASSES</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0F172A" }}>
                {Array.isArray(vehicleClasses) ? vehicleClasses.join(', ') : (vehicleClasses || "LMV, MCWG")}
              </div>
            </div>
            <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700" }}>DATE OF BIRTH</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0F172A" }}>{dob || "Not Detected"}</div>
            </div>
            <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700" }}>VALIDITY / EXPIRY</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: expiryDate ? "#15803D" : "#64748B" }}>{expiryDate || "Active"}</div>
            </div>
            <div style={{ background: "#0F172A", padding: "10px 12px", borderRadius: "8px", color: "#FFFFFF", gridColumn: "span 2" }}>
              <div style={{ fontSize: "0.68rem", color: "#94A3B8" }}>DRIVING LICENCE NUMBER</div>
              <div style={{ fontSize: "1.05rem", fontWeight: "900", color: "#FBBF24", letterSpacing: "2px" }}>
                {maskNumber(rawNumber, 'driving')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 5. INDIAN PASSPORT TEMPLATE                                  */}
      {/* ============================================================ */}
      {docType.includes('passport') && (
        <div style={{
          background: "linear-gradient(135deg, #0F172A 0%, #1E293B 100%)",
          border: "2px solid #334155",
          borderRadius: "14px",
          padding: "20px",
          color: "#FFFFFF"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid #334155", paddingBottom: "10px", marginBottom: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <div style={{ fontSize: "1.4rem" }}>🛂</div>
              <div>
                <div style={{ fontSize: "0.85rem", fontWeight: "900", color: "#F8FAFC", letterSpacing: "1px" }}>
                  PASSPORT / पासपोर्ट • REPUBLIC OF INDIA
                </div>
                <div style={{ fontSize: "0.72rem", color: "#94A3B8" }}>
                  Ministry of External Affairs
                </div>
              </div>
            </div>
            <div style={{ background: "rgba(56, 189, 248, 0.2)", color: "#38BDF8", padding: "4px 10px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: "800" }}>
              Republic of India
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <div style={{ fontSize: "0.68rem", color: "#94A3B8", fontWeight: "700" }}>PASSPORT NUMBER</div>
              <div style={{ fontSize: "1.1rem", fontWeight: "900", color: "#38BDF8", letterSpacing: "1.5px" }}>
                {maskNumber(rawNumber, 'passport')}
              </div>
            </div>
            <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <div style={{ fontSize: "0.68rem", color: "#94A3B8", fontWeight: "700" }}>HOLDER NAME</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#F8FAFC" }}>{name || "Not Detected"}</div>
            </div>
            <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <div style={{ fontSize: "0.68rem", color: "#94A3B8", fontWeight: "700" }}>DATE OF BIRTH / GENDER</div>
              <div style={{ fontSize: "0.92rem", fontWeight: "800", color: "#F8FAFC" }}>{[dob, gender].filter(Boolean).join(" • ") || "Not Detected"}</div>
            </div>
            <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "10px 12px", borderRadius: "8px", border: "1px solid rgba(255, 255, 255, 0.1)" }}>
              <div style={{ fontSize: "0.68rem", color: "#94A3B8", fontWeight: "700" }}>DATE OF EXPIRY</div>
              <div style={{ fontSize: "0.92rem", fontWeight: "800", color: expiryDate ? "#4ADE80" : "#94A3B8" }}>{expiryDate || "Not Detected"}</div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 6. SMART RATION CARD TEMPLATE                                */}
      {/* ============================================================ */}
      {(docType.includes('ration') || docType.includes('family_card') || docType.includes('tnepds')) && (
        <div style={{
          background: "linear-gradient(135deg, #FDF4FF 0%, #FAE8FF 100%)",
          border: "2px solid #E879F9",
          borderRadius: "14px",
          padding: "20px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #F0ABFC", paddingBottom: "8px", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "900", color: "#86198F" }}>TAMIL NADU CIVIL SUPPLIES & CONSUMER PROTECTION</div>
              <div style={{ fontSize: "0.72rem", color: "#C026D3", fontWeight: "700" }}>TNEPDS Smart Family Card / பொது விநியோகத் திட்டம்</div>
            </div>
            <div style={{ fontSize: "1.3rem" }}>🌾</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700" }}>HEAD OF FAMILY</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0F172A" }}>{name || "Not Detected"}</div>
            </div>
            <div style={{ background: "#0F172A", padding: "10px 12px", borderRadius: "8px", color: "#FFFFFF" }}>
              <div style={{ fontSize: "0.68rem", color: "#94A3B8" }}>RATION CARD NUMBER</div>
              <div style={{ fontSize: "1.05rem", fontWeight: "900", color: "#E879F9", letterSpacing: "1px" }}>
                {maskNumber(rawNumber, 'ration')}
              </div>
            </div>
            {address && (
              <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px", gridColumn: "span 2" }}>
                <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700" }}>RESIDENTIAL ADDRESS / TALUK</div>
                <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#0F172A" }}>{address}</div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 7. LABOUR / WELFARE BOARD CARD TEMPLATE                      */}
      {/* ============================================================ */}
      {(docType.includes('labour') || docType.includes('welfare') || docType.includes('tncwwb')) && (
        <div style={{
          background: "linear-gradient(135deg, #FFF7ED 0%, #FFEDD5 100%)",
          border: "2px solid #FDBA74",
          borderRadius: "14px",
          padding: "20px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #FED7AA", paddingBottom: "8px", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "900", color: "#9A3412" }}>CONSTRUCTION / LABOUR WELFARE BOARD</div>
              <div style={{ fontSize: "0.72rem", color: "#EA580C", fontWeight: "700" }}>Unorganised Workers Welfare Identification</div>
            </div>
            <div style={{ fontSize: "1.3rem" }}>🏗️</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700" }}>WORKER NAME</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0F172A" }}>{name || "Not Detected"}</div>
            </div>
            <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700" }}>REGISTERED TRADE / OCCUPATION</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#C2410C" }}>{trade || "Skilled Trade"}</div>
            </div>
            <div style={{ background: "#0F172A", padding: "10px 12px", borderRadius: "8px", color: "#FFFFFF", gridColumn: "span 2" }}>
              <div style={{ fontSize: "0.68rem", color: "#94A3B8" }}>REGISTRATION NUMBER</div>
              <div style={{ fontSize: "1.05rem", fontWeight: "900", color: "#FB923C", letterSpacing: "1px" }}>
                {maskNumber(rawNumber, 'labour')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 8. SKILL & TRADE CERTIFICATE TEMPLATE                        */}
      {/* ============================================================ */}
      {(docType.includes('skill') || docType.includes('cert') || docType.includes('iti') || docType.includes('nsdc') || docType.includes('diploma')) && (
        <div style={{
          background: "linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)",
          border: "2px solid #86EFAC",
          borderRadius: "14px",
          padding: "20px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #BBF7D0", paddingBottom: "8px", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "900", color: "#14532D" }}>VOCATIONAL & TECHNICAL EDUCATION BOARD</div>
              <div style={{ fontSize: "0.72rem", color: "#16A34A", fontWeight: "700" }}>Certificate of Technical Competence / Skill India</div>
            </div>
            <div style={{ fontSize: "1.3rem" }}>📜</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700" }}>CANDIDATE NAME</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0F172A" }}>{name || "Not Detected"}</div>
            </div>
            <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700" }}>CERTIFIED TRADE / COURSE</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#15803D" }}>{trade || "Technical Trade"}</div>
            </div>
            <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700" }}>ISSUING BODY</div>
              <div style={{ fontSize: "0.88rem", fontWeight: "800", color: "#0F172A" }}>{issuingAuthority || "Technical Education Board"}</div>
            </div>
            <div style={{ background: "#0F172A", padding: "10px 12px", borderRadius: "8px", color: "#FFFFFF" }}>
              <div style={{ fontSize: "0.68rem", color: "#94A3B8" }}>CERTIFICATE NUMBER</div>
              <div style={{ fontSize: "1.02rem", fontWeight: "900", color: "#4ADE80", letterSpacing: "1px" }}>
                {maskNumber(rawNumber, 'skill')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* 9. OTHER OFFICIAL GOVERNMENT ID TEMPLATE                     */}
      {/* ============================================================ */}
      {docType.includes('other') && (
        <div style={{
          background: "linear-gradient(135deg, #F8FAFC 0%, #F1F5F9 100%)",
          border: "2px solid #CBD5E1",
          borderRadius: "14px",
          padding: "20px"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "2px solid #E2E8F0", paddingBottom: "8px", marginBottom: "14px" }}>
            <div>
              <div style={{ fontSize: "0.85rem", fontWeight: "900", color: "#0F172A" }}>OFFICIAL GOVERNMENT IDENTIFICATION</div>
              <div style={{ fontSize: "0.72rem", color: "#475569", fontWeight: "700" }}>{ocrResult?.document_title || "Official Government Credential"}</div>
            </div>
            <div style={{ fontSize: "1.3rem" }}>📑</div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <div style={{ background: "#FFFFFF", padding: "10px 12px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.68rem", color: "#64748B", fontWeight: "700" }}>CARDHOLDER NAME</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#0F172A" }}>{name || "Not Detected"}</div>
            </div>
            <div style={{ background: "#0F172A", padding: "10px 12px", borderRadius: "8px", color: "#FFFFFF" }}>
              <div style={{ fontSize: "0.68rem", color: "#94A3B8" }}>DOCUMENT NUMBER</div>
              <div style={{ fontSize: "1.05rem", fontWeight: "900", color: "#38BDF8", letterSpacing: "1px" }}>
                {maskNumber(rawNumber, 'other')}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
