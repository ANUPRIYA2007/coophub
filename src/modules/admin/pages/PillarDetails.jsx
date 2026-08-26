import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { adminService } from "../services/adminService";
import { ArrowLeft, User, Phone, Mail, MapPin, Briefcase, Calendar } from "lucide-react";

export default function PillarDetails() {
  const { pillarId } = useParams();
  const navigate = useNavigate();
  const [pillar, setPillar] = useState(null);
  const [kycDocs, setKycDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    const fetchPillar = async () => {
      setLoading(true);
      const data = await adminService.getPillarById(pillarId);
      const docs = await adminService.getPillarKycDocuments(pillarId);
      setPillar(data);
      setKycDocs(docs);
      setLoading(false);
    };
    if (pillarId) fetchPillar();
  }, [pillarId]);

  const handleUpdateStatus = async (status) => {
    if (window.confirm(`Are you sure you want to mark this Pillar as ${status}?`)) {
      setUpdating(true);
      const res = await adminService.updatePillarStatus(pillarId, status);
      if (res.success) {
        setPillar(prev => ({ ...prev, status }));
      } else {
        alert("Failed to update status: " + res.error);
      }
      setUpdating(false);
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
          Back to List
        </button>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <button 
        onClick={() => navigate("/admin/pillars")} 
        style={{ background: "transparent", border: "none", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "8px", cursor: "pointer", marginBottom: "var(--space-5)" }}
      >
        <ArrowLeft size={18} /> Back to Pillars
      </button>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-5)" }}>
        <div style={{ display: "flex", gap: "var(--space-4)", alignItems: "center" }}>
          <div style={{ 
            width: "80px", height: "80px", borderRadius: "50%", 
            background: "var(--color-primary)", color: "white", 
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "2rem", fontWeight: "bold"
          }}>
            {pillar.full_name?.charAt(0) || "U"}
          </div>
          <div>
            <h1 style={{ fontSize: "1.8rem", fontWeight: "800", color: "var(--color-text)", margin: 0 }}>
              {pillar.full_name || "Unknown Name"}
            </h1>
            <div style={{ fontSize: "0.9rem", color: "var(--color-secondary)", fontWeight: "700", marginTop: "4px" }}>
              {pillar.pillar_code || "No Pillar ID"}
            </div>
            <div style={{ marginTop: "8px" }}>
              <span style={{ 
                padding: "4px 10px", 
                borderRadius: "12px", 
                fontSize: "0.75rem", 
                fontWeight: "700",
                textTransform: "capitalize",
                background: pillar.status === 'verified' ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                color: pillar.status === 'verified' ? 'var(--color-success)' : 'var(--color-warning)'
              }}>
                {pillar.status?.replace("_", " ") || "Pending"}
              </span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", gap: "var(--space-3)" }}>
          <button className="btn btn-outline" onClick={() => alert("Edit functionality to be implemented")}>Edit Pillar</button>
          {pillar.status !== 'verified' && (
            <button className="btn btn-primary" onClick={() => handleUpdateStatus('verified')} disabled={updating}>
              {updating ? "Updating..." : "Verify Pillar"}
            </button>
          )}
          {pillar.status === 'verified' && (
            <button className="btn btn-outline" style={{ borderColor: 'var(--color-error)', color: 'var(--color-error)' }} onClick={() => handleUpdateStatus('rejected')} disabled={updating}>
              Reject
            </button>
          )}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-4)" }}>
        
        {/* Contact Info */}
        <div style={{ background: "var(--color-surface)", padding: "var(--space-5)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "8px" }}>
            <User size={18} color="var(--color-secondary)" /> Contact Information
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <InfoRow icon={<Phone size={16} />} label="Mobile" value={pillar.mobile || "N/A"} />
            <InfoRow icon={<Mail size={16} />} label="Email" value={pillar.email || "N/A"} />
            <InfoRow icon={<MapPin size={16} />} label="Service Area" value={pillar.service_area?.join(", ") || "N/A"} />
          </div>
        </div>

        {/* Professional Info */}
        <div style={{ background: "var(--color-surface)", padding: "var(--space-5)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Briefcase size={18} color="var(--color-secondary)" /> Professional Details
          </h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <InfoRow icon={<Briefcase size={16} />} label="Main Services" value={pillar.main_services?.join(", ") || "N/A"} />
            <InfoRow icon={<Calendar size={16} />} label="Experience" value={`${pillar.experience_years || 0} years`} />
            <InfoRow icon={<User size={16} />} label="Preferred Language" value={pillar.preferred_language || "N/A"} />
          </div>
        </div>
      </div>

      {/* KYC Documents */}
      <div style={{ background: "var(--color-surface)", padding: "var(--space-5)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", marginTop: "var(--space-4)" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "var(--space-4)" }}>KYC Documents</h3>
        {kycDocs.length === 0 ? (
          <div style={{ color: "var(--color-text-secondary)" }}>No documents uploaded yet.</div>
        ) : (
          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
            {kycDocs.map(doc => (
              <div key={doc.id} style={{ padding: "12px", border: "1px solid var(--color-border)", borderRadius: "8px", background: "var(--color-background)", minWidth: "200px" }}>
                <div style={{ fontWeight: "600", textTransform: "capitalize", marginBottom: "4px" }}>{doc.document_type.replace('_', ' ')}</div>
                <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: "8px" }}>Status: {doc.verification_status}</div>
                <a href={doc.document_url} target="_blank" rel="noreferrer" className="btn btn-outline btn-sm" style={{ padding: "4px 8px", fontSize: "0.8rem", display: "inline-block" }}>View Document</a>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function InfoRow({ icon, label, value }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <div style={{ color: "var(--color-text-muted)" }}>{icon}</div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.5px" }}>{label}</div>
        <div style={{ fontSize: "0.95rem", color: "var(--color-text)", fontWeight: "500" }}>{value}</div>
      </div>
    </div>
  );
}
