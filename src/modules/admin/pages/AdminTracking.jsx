import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import { MapPin, Navigation, Radio, Battery, Signal, RefreshCw, CheckCircle, Clock, AlertTriangle } from "lucide-react";

export default function AdminTracking() {
  const [pillars, setPillars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState(null);
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);
  const [viewMode, setViewMode] = useState("maps"); // 'maps' | 'radar'

  useEffect(() => {
    fetchTrackingData();
    const interval = setInterval(fetchTrackingData, 15000); // Auto refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const fetchTrackingData = async () => {
    setLoading(true);
    const data = await adminService.getPillarsLiveTracking();
    setPillars(data);
    if (!selectedPillar && data && data.length > 0) {
      setSelectedPillar(data[0]);
    }
    setLoading(false);
  };

  const displayedPillars = filterActiveOnly ? pillars.filter(p => p.is_available) : pillars;

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-5)", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
            Live Pillar & Field Telemetry
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Real-time geospatial monitor and duty telemetry for all cooperative technicians.
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
          {/* View Mode Toggle */}
          <div style={{ display: "flex", background: "var(--color-surface)", padding: "3px", borderRadius: "20px", border: "1px solid var(--color-border)" }}>
            <button
              onClick={() => setViewMode("maps")}
              style={{
                padding: "4px 12px", borderRadius: "16px", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: "700",
                background: viewMode === "maps" ? "var(--color-primary)" : "transparent",
                color: viewMode === "maps" ? "white" : "var(--color-text-secondary)"
              }}
            >
              🗺️ Google Maps
            </button>
            <button
              onClick={() => setViewMode("radar")}
              style={{
                padding: "4px 12px", borderRadius: "16px", border: "none", cursor: "pointer", fontSize: "0.78rem", fontWeight: "700",
                background: viewMode === "radar" ? "var(--color-primary)" : "transparent",
                color: viewMode === "radar" ? "white" : "var(--color-text-secondary)"
              }}
            >
              📡 Radar Live
            </button>
          </div>

          <button 
            onClick={() => setFilterActiveOnly(!filterActiveOnly)}
            className={`btn ${filterActiveOnly ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: "0.85rem" }}
          >
            <Radio size={14} style={{ marginRight: "6px" }} /> {filterActiveOnly ? "Showing Available Only" : "Show All Pillars"}
          </button>
          <button 
            onClick={fetchTrackingData} 
            className="btn btn-outline" 
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Grid Layout: Map Simulation + Live Telemetry Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-5)" }}>
        
        {/* Visual Map / Radar Container */}
        <div style={{ 
          background: "var(--color-surface)", 
          borderRadius: "var(--radius-lg)", 
          border: "1px solid var(--color-border)",
          padding: "var(--space-4)",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
            <h3 style={{ fontSize: "1.05rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <Navigation size={18} color="var(--color-primary)" /> 
              {selectedPillar ? `${selectedPillar.full_name} (${selectedPillar.service_area || 'Chennai Hub'})` : "Chennai Metropolitan Hub"}
            </h3>
            <span style={{ 
              fontSize: "0.75rem", 
              background: "rgba(16, 185, 129, 0.15)", 
              color: "#10B981", 
              fontWeight: "700", 
              padding: "2px 8px", 
              borderRadius: "10px",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981", animation: "pulse 2s infinite" }}></span>
              GPS Live
            </span>
          </div>

          {/* Interactive Google Map vs Radar Visual */}
          {viewMode === "maps" ? (
            <div style={{ height: "360px", borderRadius: "var(--radius-md)", overflow: "hidden", border: "1px solid var(--color-border)" }}>
              <iframe 
                title="Google Maps Live Tracking"
                width="100%" 
                height="100%" 
                style={{ border: 0 }} 
                loading="lazy" 
                allowFullScreen 
                src={`https://maps.google.com/maps?q=${encodeURIComponent((selectedPillar?.service_area || 'Guindy, Chennai') + ', Tamil Nadu')}&t=&z=14&ie=UTF8&iwloc=&output=embed`} 
              />
            </div>
          ) : (
            <div style={{ 
              height: "360px", 
              borderRadius: "var(--radius-md)", 
              background: "radial-gradient(circle at center, rgba(14, 34, 61, 0.9) 0%, rgba(7, 18, 33, 0.98) 100%)",
              border: "1px solid rgba(255,255,255,0.1)",
              position: "relative",
              overflow: "hidden",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              {/* Concentric Radar Rings */}
              <div style={{ position: "absolute", width: "100px", height: "100px", borderRadius: "50%", border: "1px dashed rgba(245, 124, 32, 0.4)" }} />
              <div style={{ position: "absolute", width: "220px", height: "220px", borderRadius: "50%", border: "1px solid rgba(255, 255, 255, 0.1)" }} />
              <div style={{ position: "absolute", width: "320px", height: "320px", borderRadius: "50%", border: "1px solid rgba(255, 255, 255, 0.05)" }} />

              {/* Radar Center Hub */}
              <div style={{ 
                width: "14px", height: "14px", borderRadius: "50%", background: "var(--color-secondary)", 
                boxShadow: "0 0 16px var(--color-secondary)", zIndex: 2 
              }} title="Cooperative HQ - Guindy Hub" />
              <span style={{ position: "absolute", top: "54%", fontSize: "10px", color: "rgba(255,255,255,0.6)", fontWeight: "600" }}>
                HQ Center (Guindy)
              </span>

              {/* Pillar Geolocation Pins */}
              {displayedPillars.map((p, index) => {
                const angles = [30, 85, 140, 210, 270, 320];
                const radii = [60, 110, 80, 130, 95, 120];
                const angle = (angles[index % angles.length] * Math.PI) / 180;
                const radius = radii[index % radii.length];
                const x = Math.cos(angle) * radius;
                const y = Math.sin(angle) * radius;

                const isSelected = selectedPillar?.id === p.id;

                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPillar(p)}
                    style={{
                      position: "absolute",
                      transform: `translate(${x}px, ${y}px)`,
                      cursor: "pointer",
                      zIndex: isSelected ? 10 : 3,
                      transition: "transform 0.3s ease"
                    }}
                    title={`${p.full_name} (${p.pillar_code || 'Pillar'})`}
                  >
                    <div style={{
                      width: isSelected ? "24px" : "16px",
                      height: isSelected ? "24px" : "16px",
                      borderRadius: "50%",
                      background: p.is_available ? "#10B981" : "#F59E0B",
                      border: "2px solid white",
                      boxShadow: isSelected ? "0 0 12px #3B82F6" : "0 2px 6px rgba(0,0,0,0.5)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "8px",
                      color: "white",
                      fontWeight: "bold"
                    }}>
                      {p.full_name?.charAt(0) || "P"}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div style={{ marginTop: "var(--space-3)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981" }}></span> Available ({pillars.filter(p => p.is_available).length})
            </span>
            {selectedPillar && (
              <a
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent((selectedPillar.service_area || selectedPillar.full_name) + ' Chennai')}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{ color: "var(--color-primary)", fontWeight: "700", textDecoration: "none", fontSize: "0.78rem" }}
              >
                📍 Open {selectedPillar.full_name} in Google Maps ↗
              </a>
            )}
            <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#F59E0B" }}></span> Busy / On Job ({pillars.filter(p => !p.is_available).length})
            </span>
          </div>
        </div>

        {/* Pillar Telemetry Stream List */}
        <div style={{ 
          background: "var(--color-surface)", 
          borderRadius: "var(--radius-lg)", 
          border: "1px solid var(--color-border)",
          padding: "var(--space-4)",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column"
        }}>
          <h3 style={{ fontSize: "1.05rem", fontWeight: "700", marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Radio size={18} color="var(--color-secondary)" /> Live Pillar Telemetry Feed
          </h3>

          <div style={{ flex: 1, overflowY: "auto", maxHeight: "400px", display: "flex", flexDirection: "column", gap: "10px" }} className="hide-scrollbar">
            {loading && pillars.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--space-5)" }}><div className="spinner"></div></div>
            ) : displayedPillars.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--space-5)", color: "var(--color-text-secondary)" }}>
                No active pillars currently in telemetry stream.
              </div>
            ) : (
              displayedPillars.map((p) => {
                const isSelected = selectedPillar?.id === p.id;
                return (
                  <div
                    key={p.id}
                    onClick={() => setSelectedPillar(p)}
                    style={{
                      padding: "12px",
                      borderRadius: "var(--radius-md)",
                      border: isSelected ? "2px solid var(--color-primary)" : "1px solid var(--color-border)",
                      background: isSelected ? "var(--color-surface-hover)" : "transparent",
                      cursor: "pointer",
                      transition: "all 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                      <div>
                        <span style={{ fontWeight: "700", fontSize: "0.95rem", color: "var(--color-text)" }}>
                          {p.full_name || "Coop Pillar"}
                        </span>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-secondary)", fontWeight: "700" }}>
                          {p.pillar_code || "PIL-ID"} • {p.main_services?.[0] || "Technician"}
                        </div>
                      </div>
                      <span style={{
                        fontSize: "0.7rem",
                        fontWeight: "700",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        background: p.is_available ? "var(--color-success-light)" : "var(--color-warning-light)",
                        color: p.is_available ? "var(--color-success)" : "var(--color-warning)"
                      }}>
                        {p.is_available ? "Available" : "Busy"}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.8rem", color: "var(--color-text-secondary)", marginTop: "8px" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                        <MapPin size={13} color="var(--color-primary)" /> {p.service_area?.[0] || "Chennai Central"}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><Signal size={12} color="#10B981" /> 4G</span>
                        <span style={{ display: "flex", alignItems: "center", gap: "3px" }}><Battery size={12} color="#10B981" /> 92%</span>
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
