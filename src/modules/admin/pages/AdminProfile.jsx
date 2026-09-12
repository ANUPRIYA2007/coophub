import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  ShieldCheck, MapPin, Globe, Users, Phone, Mail, Building, 
  CheckCircle2, Clock, Award, Activity, Edit3, Save, Compass, 
  Layers, Radio, AlertTriangle, Shield, Check, RefreshCw, ChevronRight
} from "lucide-react";

export default function AdminProfile() {
  const [isEditing, setIsEditing] = useState(false);
  const [saveToast, setSaveToast] = useState(false);

  // Load persistent profile state with official defaults
  const [profileData, setProfileData] = useState(() => {
    try {
      const saved = localStorage.getItem("coophub_admin_profile");
      if (saved) return JSON.parse(saved);
    } catch (e) {}

    return {
      admin_id: "ADM-CHE-001",
      full_name: "Anupriya",
      role_title: "Regional Zonal Administrator (Grade I)",
      department: "Cooperative Governance & Service Operations Division",
      email: "anupriya@coophub.in",
      mobile: "+91 98401 23456",
      official_id: "TN-COOP-ADMIN-8942",
      authority_level: "Level 4: Zonal Operational Authority (Full Access)",
      zone_name: "Southern Zone (SZ)",
      zone_code: "ZONE-CHE-METRO",
      state: "Tamil Nadu (TN)",
      metro_area: "Greater Chennai Metropolitan Area (CMDA)",
      office_address: "Regional Cooperative Bhavan, 5th Floor, Anna Salai, Guindy, Chennai, Tamil Nadu - 600032",
      joined_date: "15 August 2025",
      clearance_expiry: "31 December 2027",
      emergency_phone: "+91 94440 12345",
      language: "English / Tamil",
      status: "Active & Authoritative"
    };
  });

  // Edit form buffer
  const [formData, setFormData] = useState({ ...profileData });

  // Zonal operational metrics
  const zoneClusters = [
    {
      id: "ZC-01",
      name: "Sector 1: Central-South Metro Hub",
      headquarters: "Guindy Command Center",
      wards: ["Guindy", "Adyar", "Velachery", "Saidapet", "Thiruvanmiyur"],
      pillarsCount: 28,
      activeSociety: "Guindy Industrial Cooperative Society Ltd.",
      status: "Operational",
      avgEta: "7.8 mins",
      health: 99.6
    },
    {
      id: "ZC-02",
      name: "Sector 2: Central-North Commercial Sector",
      headquarters: "Anna Nagar Sub-Hub",
      wards: ["Anna Nagar", "Kilpauk", "T. Nagar", "Nungambakkam", "Alwarpet"],
      pillarsCount: 24,
      activeSociety: "Central Chennai Artisans Cooperative Federation",
      status: "Operational",
      avgEta: "8.2 mins",
      health: 99.2
    },
    {
      id: "ZC-03",
      name: "Sector 3: Coastal & South-East IT Corridor",
      headquarters: "Sholinganallur Hub",
      wards: ["Mylapore", "Besant Nagar", "Sholinganallur", "OMR IT Highway", "ECR"],
      pillarsCount: 16,
      activeSociety: "Mylapore-OMR Cooperative Service Hub",
      status: "Operational",
      avgEta: "9.1 mins",
      health: 98.8
    },
    {
      id: "ZC-04",
      name: "Sector 4: North & Outer Industrial Extension",
      headquarters: "Ambattur Regional Depot",
      wards: ["Kavaraipettai", "Ambattur", "Porur", "Royapettah", "George Town"],
      pillarsCount: 12,
      activeSociety: "North Chennai Technical Workers Cooperative",
      status: "Operational",
      avgEta: "10.4 mins",
      health: 98.4
    }
  ];

  // Zonal Governance Policy Toggles
  const [governanceToggles, setGovernanceToggles] = useState({
    liveGpsRadar: true,
    interZoneSpillover: true,
    emergencyPriorityDispatch: true,
    cooperativeTariffCeiling: true,
    instantOtpValidation: true
  });

  const handleToggleGovernance = (key) => {
    setGovernanceToggles(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const handleSaveProfile = (e) => {
    e.preventDefault();
    setProfileData({ ...formData });
    try {
      localStorage.setItem("coophub_admin_profile", JSON.stringify(formData));
      localStorage.setItem("coophub_admin_name", formData.full_name);
      localStorage.setItem("coophub_admin_id", formData.admin_id);
      window.dispatchEvent(new Event("coophub_admin_profile_updated"));
    } catch (err) {}

    setIsEditing(false);
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 4000);
  };

  return (
    <div className="fade-in" style={{ paddingBottom: "var(--space-6)" }}>
      {/* Toast Notification */}
      {saveToast && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 1200,
          background: "var(--color-surface)",
          border: "1px solid var(--color-success)",
          boxShadow: "var(--shadow-lg)",
          borderRadius: "var(--radius-md)",
          padding: "12px 20px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: "var(--color-text)",
          fontWeight: "700",
          fontSize: "0.9rem"
        }}>
          <CheckCircle2 size={18} color="var(--color-success)" />
          Administrator credentials and zone profile updated successfully!
        </div>
      )}

      {/* Header Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-4)", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <Link to="/admin" style={{ color: "var(--color-text-secondary)", textDecoration: "none", fontSize: "0.85rem" }}>
              Admin Portal
            </Link>
            <ChevronRight size={14} color="var(--color-text-muted)" />
            <span style={{ color: "#FF7900", fontWeight: "700", fontSize: "0.85rem" }}>
              Administrator Profile & Zone Details
            </span>
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--color-text)", margin: 0 }}>
            Administrator Profile & Operational Zone Command
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginTop: "4px", marginBottom: 0 }}>
            Official identity credentials, authoritative state clearances, and geographic zone jurisdiction covering the Chennai Metropolitan Region.
          </p>
        </div>

        <div style={{ display: "flex", gap: "10px" }}>
          {!isEditing ? (
            <button
              onClick={() => {
                setFormData({ ...profileData });
                setIsEditing(true);
              }}
              className="btn btn-primary"
              style={{ display: "flex", alignItems: "center", gap: "8px" }}
            >
              <Edit3 size={15} /> Edit Admin Details
            </button>
          ) : (
            <button
              onClick={() => setIsEditing(false)}
              className="btn btn-outline"
            >
              Cancel
            </button>
          )}
        </div>
      </div>

      {/* ─── TOP PROFILE SUMMARY CARD ─── */}
      <div style={{
        background: "var(--color-surface)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
        padding: "var(--space-5)",
        boxShadow: "var(--shadow-sm)",
        marginBottom: "var(--space-4)"
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-5)", alignItems: "center", justifyContent: "space-between" }}>
          {/* Avatar & Core Identity */}
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
            <div style={{
              width: "76px",
              height: "76px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #FF7900, #F57C20)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              fontSize: "2rem",
              fontWeight: "900",
              boxShadow: "0 8px 24px rgba(245, 124, 32, 0.35)",
              border: "3px solid var(--color-surface)",
              position: "relative",
              flexShrink: 0
            }}>
              {profileData.full_name?.charAt(0)?.toUpperCase() || "A"}
              <span style={{
                position: "absolute",
                bottom: "2px",
                right: "2px",
                width: "16px",
                height: "16px",
                borderRadius: "50%",
                background: "#10B981",
                border: "2px solid var(--color-surface)"
              }} title="Active Administrator Status" />
            </div>

            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                <h2 style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--color-text)", margin: 0 }}>
                  {profileData.full_name}
                </h2>
                <span style={{
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontSize: "0.78rem",
                  fontWeight: "700",
                  background: "rgba(245, 124, 32, 0.12)",
                  color: "#FF7900",
                  fontFamily: "monospace"
                }}>
                  {profileData.admin_id}
                </span>
                <span style={{
                  padding: "3px 10px",
                  borderRadius: "12px",
                  fontSize: "0.75rem",
                  fontWeight: "700",
                  background: "rgba(16, 185, 129, 0.12)",
                  color: "#10B981",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "4px"
                }}>
                  <ShieldCheck size={13} /> {profileData.status}
                </span>
              </div>
              <div style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", fontWeight: "600", marginTop: "4px" }}>
                {profileData.role_title}
              </div>
              <div style={{ color: "var(--color-text-muted)", fontSize: "0.82rem", marginTop: "2px" }}>
                {profileData.department}
              </div>
            </div>
          </div>

          {/* Quick Badges Strip */}
          <div style={{ display: "flex", gap: "var(--space-3)", flexWrap: "wrap" }}>
            <div style={{ background: "var(--color-surface-hover)", padding: "10px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: "700" }}>ASSIGNED ZONE</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "var(--color-text)", marginTop: "2px" }}>
                {profileData.zone_name}
              </div>
              <div style={{ fontSize: "0.75rem", color: "#FF7900", fontWeight: "600" }}>{profileData.zone_code}</div>
            </div>

            <div style={{ background: "var(--color-surface-hover)", padding: "10px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: "700" }}>METRO SECTOR</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "var(--color-text)", marginTop: "2px" }}>
                Chennai (CMDA)
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-success)", fontWeight: "600" }}>4 Zonal Clusters</div>
            </div>

            <div style={{ background: "var(--color-surface-hover)", padding: "10px 16px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: "700" }}>AUTHORITY CLEARANCE</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "800", color: "#3B82F6", marginTop: "2px" }}>
                Level 4 Sovereign
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Valid thru 2027</div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── EDIT PROFILE FORM (Toggled by "Edit Admin Details") ─── */}
      {isEditing && (
        <div style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          border: "2px solid #FF7900",
          padding: "var(--space-5)",
          boxShadow: "var(--shadow-md)",
          marginBottom: "var(--space-4)"
        }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-text)", marginTop: 0, marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Edit3 size={18} color="#FF7900" />
            Edit Administrator Personal & Official Profile
          </h3>

          <form onSubmit={handleSaveProfile} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "var(--space-3)" }}>
            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                Full Name
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                Official Admin Code
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.admin_id}
                onChange={(e) => setFormData({ ...formData, admin_id: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                Official Email
              </label>
              <input
                type="email"
                className="form-input"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                Contact Mobile Number
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.mobile}
                onChange={(e) => setFormData({ ...formData, mobile: e.target.value })}
                required
              />
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                Emergency Hotline
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.emergency_phone}
                onChange={(e) => setFormData({ ...formData, emergency_phone: e.target.value })}
              />
            </div>

            <div>
              <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                Operational Language
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.language}
                onChange={(e) => setFormData({ ...formData, language: e.target.value })}
              />
            </div>

            <div style={{ gridColumn: "1 / -1" }}>
              <label style={{ fontSize: "0.82rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                Official Regional Headquarters Address
              </label>
              <input
                type="text"
                className="form-input"
                value={formData.office_address}
                onChange={(e) => setFormData({ ...formData, office_address: e.target.value })}
              />
            </div>

            <div style={{ gridColumn: "1 / -1", display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-2)" }}>
              <button type="button" className="btn btn-outline" onClick={() => setIsEditing(false)}>
                Cancel
              </button>
              <button type="submit" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <Save size={15} /> Save Profile Changes
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ─── GEOGRAPHIC ZONE JURISDICTION & DETAILS ─── */}
      <div style={{
        background: "var(--color-surface)",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
        padding: "var(--space-5)",
        boxShadow: "var(--shadow-sm)",
        marginBottom: "var(--space-4)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)", flexWrap: "wrap", gap: "var(--space-2)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(245, 124, 32, 0.12)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Compass size={20} color="#FF7900" />
            </div>
            <div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--color-text)", margin: 0 }}>
                Geographic Zone Jurisdiction Details
              </h3>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.82rem", margin: "2px 0 0 0" }}>
                Official administrative boundary, state registry, and metropolitan cooperative coverage territory.
              </p>
            </div>
          </div>
          <span style={{ fontSize: "0.78rem", padding: "4px 10px", borderRadius: "12px", background: "rgba(16, 185, 129, 0.12)", color: "#10B981", fontWeight: "700" }}>
            ● Live Telemetry Radar Connected
          </span>
        </div>

        {/* Zone Specs Grid */}
        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--space-3)",
          marginBottom: "var(--space-4)"
        }}>
          <div style={{ background: "var(--color-surface-hover)", padding: "12px 16px", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: "600" }}>PRIMARY ZONE</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-text)", marginTop: "2px" }}>
              {profileData.zone_name}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Code: {profileData.zone_code}</div>
          </div>

          <div style={{ background: "var(--color-surface-hover)", padding: "12px 16px", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: "600" }}>STATE / UT JURISDICTION</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-text)", marginTop: "2px" }}>
              {profileData.state}
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Tamil Nadu Cooperative Registry</div>
          </div>

          <div style={{ background: "var(--color-surface-hover)", padding: "12px 16px", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: "600" }}>METRO COVERAGE RADIUS</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "#FF7900", marginTop: "2px" }}>
              35 km Diameter
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Greater Chennai (CMA Wards)</div>
          </div>

          <div style={{ background: "var(--color-surface-hover)", padding: "12px 16px", borderRadius: "var(--radius-md)" }}>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: "600" }}>POPULATION GOVERNED</div>
            <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-success)", marginTop: "2px" }}>
              11.2 Million
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Urban & Suburban Households</div>
          </div>
        </div>

        {/* ─── 4 CHENNAI ZONE CLUSTERS MATRIX ─── */}
        <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--color-text)", marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: "6px" }}>
          <Layers size={16} color="var(--color-primary)" />
          Operational Zone Clusters & Ward Sector Allocation
        </h4>

        <div style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
          gap: "var(--space-3)"
        }}>
          {zoneClusters.map((zc) => (
            <div
              key={zc.id}
              style={{
                background: "var(--color-surface)",
                border: "1px solid var(--color-border)",
                borderRadius: "var(--radius-md)",
                padding: "16px",
                position: "relative",
                overflow: "hidden"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <span style={{ fontSize: "0.7rem", fontFamily: "monospace", padding: "1px 6px", borderRadius: "4px", background: "rgba(245, 124, 32, 0.12)", color: "#FF7900", fontWeight: "700" }}>
                    {zc.id}
                  </span>
                  <div style={{ fontWeight: "800", color: "var(--color-text)", fontSize: "0.92rem", marginTop: "4px" }}>
                    {zc.name}
                  </div>
                </div>
                <span style={{ fontSize: "0.72rem", padding: "2px 7px", borderRadius: "10px", background: "var(--color-success-light)", color: "var(--color-success)", fontWeight: "700" }}>
                  {zc.status}
                </span>
              </div>

              <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", marginBottom: "10px" }}>
                <strong>HQ:</strong> {zc.headquarters}
              </div>

              <div style={{ marginBottom: "12px" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: "600", marginBottom: "4px" }}>
                  WARDS & LOCALITIES COVERED:
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: "4px" }}>
                  {zc.wards.map(w => (
                    <span key={w} style={{ fontSize: "0.72rem", padding: "2px 6px", borderRadius: "6px", background: "var(--color-surface-hover)", color: "var(--color-text)" }}>
                      {w}
                    </span>
                  ))}
                </div>
              </div>

              <div style={{
                paddingTop: "10px",
                borderTop: "1px solid var(--color-border)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                fontSize: "0.78rem"
              }}>
                <div>
                  <span style={{ color: "var(--color-text-muted)" }}>Qualified Pillars: </span>
                  <strong style={{ color: "var(--color-text)" }}>{zc.pillarsCount} Specialists</strong>
                </div>
                <div>
                  <span style={{ color: "var(--color-text-muted)" }}>Avg ETA: </span>
                  <strong style={{ color: "#FF7900" }}>{zc.avgEta}</strong>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ─── ZONAL GOVERNANCE CONTROLS & SECURITY CLEARANCE ─── */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
        gap: "var(--space-4)"
      }}>
        {/* Zonal Policy & Enforcement */}
        <div style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
          padding: "var(--space-4)",
          boxShadow: "var(--shadow-sm)"
        }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--color-text)", marginTop: 0, marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Radio size={17} color="#FF7900" />
            Zonal Operational Policies & Toggles
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "var(--color-text)" }}>Live Zonal GPS Radar Broadcasting</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Broadcast pillar locations to customer search radar</div>
              </div>
              <input 
                type="checkbox" 
                checked={governanceToggles.liveGpsRadar} 
                onChange={() => handleToggleGovernance("liveGpsRadar")}
                style={{ width: "18px", height: "18px", accentColor: "#FF7900", cursor: "pointer" }} 
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "var(--color-text)" }}>Inter-Zone Workforce Spillover</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Permit adjacent cluster pillars during surge demand</div>
              </div>
              <input 
                type="checkbox" 
                checked={governanceToggles.interZoneSpillover} 
                onChange={() => handleToggleGovernance("interZoneSpillover")}
                style={{ width: "18px", height: "18px", accentColor: "#FF7900", cursor: "pointer" }} 
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "var(--color-text)" }}>Emergency 24/7 Rapid Dispatch</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Override standard queue for pipeline bursts & electrical faults</div>
              </div>
              <input 
                type="checkbox" 
                checked={governanceToggles.emergencyPriorityDispatch} 
                onChange={() => handleToggleGovernance("emergencyPriorityDispatch")}
                style={{ width: "18px", height: "18px", accentColor: "#FF7900", cursor: "pointer" }} 
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontWeight: "700", fontSize: "0.85rem", color: "var(--color-text)" }}>Cooperative Regulated Tariffs</div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Strict zero-surge price caps across all 16 sectors</div>
              </div>
              <input 
                type="checkbox" 
                checked={governanceToggles.cooperativeTariffCeiling} 
                onChange={() => handleToggleGovernance("cooperativeTariffCeiling")}
                style={{ width: "18px", height: "18px", accentColor: "#FF7900", cursor: "pointer" }} 
              />
            </div>
          </div>
        </div>

        {/* Security & Official Credentials */}
        <div style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
          padding: "var(--space-4)",
          boxShadow: "var(--shadow-sm)"
        }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--color-text)", marginTop: 0, marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Shield size={17} color="#10B981" />
            Official State Credentials & Audit Status
          </h3>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.84rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Government ID Ref:</span>
              <strong style={{ fontFamily: "monospace", color: "var(--color-text)" }}>{profileData.official_id}</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Digital Signature:</span>
              <span style={{ color: "#10B981", fontWeight: "700", display: "flex", alignItems: "center", gap: "4px" }}>
                <CheckCircle2 size={13} /> Active (e-Sign 3.0)
              </span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Two-Factor Authentication:</span>
              <span style={{ color: "#10B981", fontWeight: "700" }}>Enforced (Hardware Token)</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--color-border)", paddingBottom: "8px" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Last Security Audit:</span>
              <strong style={{ color: "var(--color-text)" }}>10 September 2026 (Passed 100%)</strong>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--color-text-secondary)" }}>Zonal Hotline:</span>
              <strong style={{ color: "#FF7900" }}>{profileData.emergency_phone}</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
