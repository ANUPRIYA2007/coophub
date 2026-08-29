import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import { supabase } from "../../../lib/supabase";
import AdminRadarMap from "../../../components/maps/AdminRadarMap";
import { MapPin, Navigation, Radio, Battery, Signal, RefreshCw, CheckCircle, Clock, AlertTriangle, ShieldCheck, Star } from "lucide-react";

function formatLocation(pillar) {
  if (!pillar) return "Chennai Central";
  if (pillar.area) {
    return `${pillar.area}${pillar.pincode ? ` (PIN: ${pillar.pincode})` : ""}`;
  }
  let area = pillar.service_area;
  if (Array.isArray(area)) {
    return area.filter(Boolean).join(", ") || "Chennai Central";
  }
  if (typeof area === "string") {
    if (area.startsWith("[") || area.startsWith("{")) {
      try {
        const parsed = JSON.parse(area);
        if (Array.isArray(parsed)) {
          return parsed.filter(Boolean).join(", ") || "Chennai Central";
        }
      } catch (e) { /* ignore */ }
    }
    const cleaned = area.replace(/[\[\]"']/g, "").trim();
    return cleaned || "Chennai Central";
  }
  return "Chennai Central";
}

export default function AdminTracking() {
  const [pillars, setPillars] = useState([]);
  const [emergencyRequests, setEmergencyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPillar, setSelectedPillar] = useState(null);
  const [filterActiveOnly, setFilterActiveOnly] = useState(false);

  useEffect(() => {
    fetchTrackingData();
    const interval = setInterval(fetchTrackingData, 15000); // Auto refresh every 15s
    return () => clearInterval(interval);
  }, []);

  const fetchTrackingData = async () => {
    setLoading(true);
    const data = await adminService.getPillarsLiveTracking();
    setPillars(data);

    // Fetch active emergency requests
    try {
      const { data: emReqs } = await supabase
        .from("service_requests")
        .select("id, service_name, customer_name, customer_phone, latitude, longitude, is_emergency, status")
        .eq("is_emergency", true)
        .in("status", ["pending", "assigned", "on_the_way", "arrived"]);
      setEmergencyRequests(emReqs || []);
    } catch (e) {
      console.warn("Could not fetch emergency requests for radar:", e);
    }

    if (!selectedPillar && data && data.length > 0) {
      setSelectedPillar(data[0]);
    }
    setLoading(false);
  };

  const displayedPillars = filterActiveOnly ? pillars.filter(p => p.is_available) : pillars;

  return (
    <div className="fade-in space-y-6">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-4)", flexWrap: "wrap", gap: "10px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)", marginBottom: "var(--space-1)" }}>
            Live Google Maps Radar & Field Telemetry
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
            Real-time geospatial monitor and duty telemetry for all cooperative technicians.
          </p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", flexWrap: "wrap" }}>
          <button 
            onClick={() => setFilterActiveOnly(!filterActiveOnly)}
            className={`btn ${filterActiveOnly ? 'btn-primary' : 'btn-outline'}`}
            style={{ fontSize: "0.82rem" }}
          >
            <Radio size={14} style={{ marginRight: "6px" }} /> {filterActiveOnly ? "Showing Available Only" : "Show All Pillars"}
          </button>
          <button 
            onClick={fetchTrackingData} 
            className="btn btn-outline" 
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.82rem" }}
            disabled={loading}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Grid Layout: Google Radar Map + Live Telemetry Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-5)" }}>
        
        {/* Google Maps Radar Component */}
        <div style={{ 
          background: "var(--color-surface)", 
          borderRadius: "var(--radius-lg)", 
          border: "1px solid var(--color-border)",
          padding: "var(--space-3)",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-2)" }}>
            <h3 style={{ fontSize: "0.95rem", fontWeight: "700", display: "flex", alignItems: "center", gap: "8px", margin: 0 }}>
              <Navigation size={16} color="var(--color-primary)" /> 
              {selectedPillar ? `${selectedPillar.full_name} (${formatLocation(selectedPillar)})` : "Chennai Metropolitan Hub"}
            </h3>
            <span style={{ 
              fontSize: "0.72rem", 
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

          {/* Real Google Maps Live Radar */}
          <AdminRadarMap
            pillars={displayedPillars}
            emergencyRequests={emergencyRequests}
            selectedPillar={selectedPillar}
            onSelectPillar={(p) => setSelectedPillar(p)}
            height="440px"
          />
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
                          {p.pillar_code || "PIL-ID"} • {(Array.isArray(p.main_services) && p.main_services.includes('Others') && p.custom_role) ? p.custom_role : (Array.isArray(p.main_services) ? p.main_services[0] : (p.main_services || "Technician"))}
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
                        <MapPin size={13} color="var(--color-primary)" /> {formatLocation(p)}
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
