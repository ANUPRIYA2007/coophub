import React, { useState, useEffect } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { useTranslation } from "../../../i18n/useTranslation";
import { 
  Globe, Activity, Users, DollarSign, TrendingUp, 
  MapPin, Shield, Zap, RefreshCw, Sparkles, ChevronRight,
  AlertTriangle, ArrowUpRight, AlertCircle
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { getGeographySummary } from "../../../services/admin/geographyService";

export default function SuperAdminDashboard() {
  const { isDark } = useTheme();
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [geoSummary, setGeoSummary] = useState(null);
  const [geoLoading, setGeoLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const s = await getGeographySummary();
        setGeoSummary(s);
      } catch {}
      setGeoLoading(false);
    })();
  }, []);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 600);
  };

  return (
    <div className="fade-in" style={{ paddingBottom: "30px" }}>
      {/* Top Banner Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
            <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A", margin: 0 }}>
              {t("National Super Admin Command Center")}
            </h1>
            <span style={{ 
              background: "rgba(16, 185, 129, 0.15)", color: "#10B981", 
              fontSize: "0.75rem", fontWeight: "800", padding: "3px 10px", borderRadius: "12px", border: "1px solid rgba(16, 185, 129, 0.3)",
              display: "inline-flex", alignItems: "center", gap: "6px"
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981" }} />
              {t("LIVE RADAR")}
            </span>
          </div>
          <p style={{ margin: 0, color: isDark ? "#94A3B8" : "#64748B", fontSize: "0.88rem" }}>
            {t("Authoritative national command apex governing India's Cooperative Service Network")}
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={handleRefresh}
            disabled={loading}
            style={{
              background: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
              border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #CBD5E1",
              color: isDark ? "#E2E8F0" : "#334155",
              padding: "8px 16px",
              borderRadius: "8px",
              fontWeight: "700",
              fontSize: "12.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} /> {t("Refresh Telemetry")}
          </button>

          <button
            onClick={() => navigate("/admin/analytics")}
            style={{
              background: "#FF7900",
              color: "#050A12",
              border: "none",
              padding: "8px 18px",
              borderRadius: "8px",
              fontWeight: "800",
              fontSize: "12.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 4px 14px rgba(255, 121, 0, 0.35)"
            }}
          >
            <Sparkles size={15} /> {t("AI Intelligence Hub")}
          </button>
        </div>
      </div>

      {/* Top 4 KPI Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "24px" }}>
        
        {/* Card 1: National Footprint — DB-derived */}
        <div style={{ background: isDark ? "#0A1220" : "#FFFFFF", border: isDark ? "1px solid rgba(59, 130, 246, 0.25)" : "1px solid #E2E8F0", padding: "18px", borderRadius: "12px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.78rem", color: isDark ? "#94A3B8" : "#64748B", fontWeight: "600" }}>{t("National Footprint")}</span>
            <Globe size={18} color="#3B82F6" />
          </div>
          {geoLoading ? (
            <div style={{ fontSize: "1rem", fontWeight: "600", color: isDark ? "#94A3B8" : "#64748B" }}>{t("Loading...")}</div>
          ) : (
            <div style={{ fontSize: "1.4rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A" }}>
              {geoSummary ? `${geoSummary.total_zones} ${t("Zones")} · ${geoSummary.total_units} ${t("State/UT Units")}` : "—"}
            </div>
          )}
          <div style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: "700", marginTop: "4px" }}>
            {geoSummary ? `${geoSummary.total_states} ${t("States")} · ${geoSummary.total_union_territories} ${t("Union Territories")}` : ""}
          </div>
          <button onClick={() => navigate("/admin/geography")} style={{ background: "none", border: "none", color: "#3B82F6", fontSize: "11px", fontWeight: "700", padding: 0, marginTop: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
            {t("Explore Hierarchy")} <ArrowUpRight size={12} />
          </button>
        </div>

        {/* Card 2: Pillar Workforce */}
        <div style={{ background: isDark ? "#0A1220" : "#FFFFFF", border: isDark ? "1px solid rgba(245, 158, 11, 0.25)" : "1px solid #E2E8F0", padding: "18px", borderRadius: "12px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.78rem", color: isDark ? "#94A3B8" : "#64748B", fontWeight: "600" }}>{t("Pillar Workforce")}</span>
            <span style={{ fontSize: "9px", fontWeight: "800", background: "rgba(245,158,11,0.12)", color: "#F59E0B", border: "1px solid rgba(245,158,11,0.3)", padding: "1px 6px", borderRadius: "4px" }}>DEMO</span>
          </div>
          <div style={{ fontSize: "1.7rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A" }}>148 {t("Technicians")}</div>
          <div style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: "700", marginTop: "4px" }}>● 124 {t("Active Online (84% ready)")}</div>
          <button onClick={() => navigate("/admin/pillars")} style={{ background: "none", border: "none", color: "#F59E0B", fontSize: "11px", fontWeight: "700", padding: 0, marginTop: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
            {t("View Workforce")} <ArrowUpRight size={12} />
          </button>
        </div>

        {/* Card 3: Daily Dispatch Queue */}
        <div style={{ background: isDark ? "#0A1220" : "#FFFFFF", border: isDark ? "1px solid rgba(239, 68, 68, 0.25)" : "1px solid #E2E8F0", padding: "18px", borderRadius: "12px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.78rem", color: isDark ? "#94A3B8" : "#64748B", fontWeight: "600" }}>{t("Daily Dispatch Queue")}</span>
            <Zap size={18} color="#EF4444" />
          </div>
          <div style={{ fontSize: "1.7rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A" }}>42 {t("Active Jobs")}</div>
          <div style={{ fontSize: "0.75rem", color: isDark ? "#CBD5E1" : "#475569", fontWeight: "600", marginTop: "4px" }}>34 {t("Completed Today • Avg ETA 17.5m")}</div>
          <button onClick={() => navigate("/admin/requests")} style={{ background: "none", border: "none", color: "#EF4444", fontSize: "11px", fontWeight: "700", padding: 0, marginTop: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
            {t("Command Radar")} <ArrowUpRight size={12} />
          </button>
        </div>

        {/* Card 4: Gross Merchandise Value */}
        <div style={{ background: isDark ? "#0A1220" : "#FFFFFF", border: isDark ? "1px solid rgba(16, 185, 129, 0.25)" : "1px solid #E2E8F0", padding: "18px", borderRadius: "12px", position: "relative" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.78rem", color: isDark ? "#94A3B8" : "#64748B", fontWeight: "600" }}>{t("Gross Merchandise Value")}</span>
            <DollarSign size={18} color="#10B981" />
          </div>
          <div style={{ fontSize: "1.7rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A" }}>₹42.80 {t("Lakhs")}</div>
          <div style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: "700", marginTop: "4px" }}>91.5% {t("Pillars")} • 8.5% {t("Cooperative Fund")}</div>
          <button onClick={() => navigate("/admin/finance")} style={{ background: "none", border: "none", color: "#10B981", fontSize: "11px", fontWeight: "700", padding: 0, marginTop: "8px", cursor: "pointer", display: "flex", alignItems: "center", gap: "2px" }}>
            {t("Financial Ledger")} <ArrowUpRight size={12} />
          </button>
        </div>

      </div>

      {/* Main Grid: Zonal Command Telemetry vs AI Demand Alerts */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(380px, 1fr))", gap: "20px" }}>
        
        {/* National Zonal Command Box */}
        <div style={{ background: isDark ? "#0A1220" : "#FFFFFF", border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #E2E8F0", borderRadius: "14px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A" }}>{t("National Zonal Command")}</h3>
              <span style={{ fontSize: "0.78rem", color: isDark ? "#94A3B8" : "#64748B" }}>{t("Active administrative supervision across regional sectors")}</span>
            </div>
            <button onClick={() => navigate("/admin/zones")} style={{ background: "none", border: "none", color: "#FF7900", fontSize: "12px", fontWeight: "700", cursor: "pointer" }}>
              {t("Manage Zones →")}
            </button>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            
            {/* South Zone */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: "10px", background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid #E2E8F0" }}>
              <div>
                <div style={{ fontWeight: "700", fontSize: "13.5px", color: isDark ? "#FFFFFF" : "#0F172A" }}>{t("South Zone")}</div>
                <div style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B" }}>{t("Tamil Nadu, Kerala, Karnataka")}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: "800", fontSize: "13.5px", color: "#10B981" }}>₹36.4L MTD</div>
                <div style={{ fontSize: "11px", color: "#10B981", fontWeight: "700" }}>112 {t("Pillars • Active")}</div>
              </div>
            </div>

            {/* West Zone */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: "10px", background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid #E2E8F0" }}>
              <div>
                <div style={{ fontWeight: "700", fontSize: "13.5px", color: isDark ? "#FFFFFF" : "#0F172A" }}>{t("West Zone")}</div>
                <div style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B" }}>{t("Maharashtra, Gujarat")}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: "800", fontSize: "13.5px", color: "#3B82F6" }}>₹4.8L MTD</div>
                <div style={{ fontSize: "11px", color: "#3B82F6", fontWeight: "700" }}>22 {t("Pillars • Active")}</div>
              </div>
            </div>

            {/* North Zone */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: "10px", background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid #E2E8F0" }}>
              <div>
                <div style={{ fontWeight: "700", fontSize: "13.5px", color: isDark ? "#FFFFFF" : "#0F172A" }}>{t("North Zone")}</div>
                <div style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B" }}>{t("Delhi NCR, Punjab, UP")}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: "800", fontSize: "13.5px", color: "#F59E0B" }}>₹1.6L MTD</div>
                <div style={{ fontSize: "11px", color: "#F59E0B", fontWeight: "700" }}>14 {t("Pillars • Active")}</div>
              </div>
            </div>

            {/* East Zone */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "12px 14px", borderRadius: "10px", background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", border: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid #E2E8F0" }}>
              <div>
                <div style={{ fontWeight: "700", fontSize: "13.5px", color: isDark ? "#FFFFFF" : "#0F172A" }}>{t("East Zone")}</div>
                <div style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B" }}>{t("West Bengal, Odisha")}</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontWeight: "800", fontSize: "13.5px", color: isDark ? "#94A3B8" : "#64748B" }}>₹0.0L MTD</div>
                <div style={{ fontSize: "11px", color: "#F59E0B", fontWeight: "700" }}>0 {t("Pillars • Provisioning")}</div>
              </div>
            </div>

          </div>
        </div>

        {/* AI Demand & Operational Alerts Box */}
        <div style={{ background: isDark ? "#0A1220" : "#FFFFFF", border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #E2E8F0", borderRadius: "14px", padding: "20px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A" }}>{t("AI Demand & Operational Alerts")}</h3>
              <span style={{ fontSize: "0.78rem", color: isDark ? "#94A3B8" : "#64748B" }}>{t("Neural Chronos-2 projections and system alerts")}</span>
            </div>
            <span style={{ fontSize: "10px", fontWeight: "800", background: "rgba(59, 130, 246, 0.15)", color: "#3B82F6", padding: "3px 8px", borderRadius: "6px", border: "1px solid rgba(59, 130, 246, 0.3)" }}>
              CHRONOS-2 NEURAL
            </span>
          </div>

          {/* Surge Alert Banner */}
          <div style={{ padding: "14px", borderRadius: "10px", background: "rgba(255, 121, 0, 0.08)", border: "1px solid rgba(255, 121, 0, 0.3)", marginBottom: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#FF7900", fontWeight: "700", fontSize: "13px", marginBottom: "4px" }}>
              <TrendingUp size={16} /> {t("Weekend Demand Surge Predicted")}
            </div>
            <p style={{ margin: 0, fontSize: "12px", color: isDark ? "#E2E8F0" : "#334155", lineHeight: "1.4" }}>
              {t("+18.4% surge in Air Conditioning & Electrical services expected across Chennai and Coimbatore. Recommended action: Mobilize 14 standby HVAC technicians.")}
            </p>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: "8px", background: isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC" }}>
              <span style={{ fontSize: "12px", color: isDark ? "#CBD5E1" : "#475569" }}>{t("Emergency SOS Readiness")}</span>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#10B981" }}>8 {t("Rapid Squads Standby")}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: "8px", background: isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC" }}>
              <span style={{ fontSize: "12px", color: isDark ? "#CBD5E1" : "#475569" }}>{t("Social Security & Welfare Enrollment")}</span>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#3B82F6" }}>88.5% {t("Workforces Linked")}</span>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", borderRadius: "8px", background: isDark ? "rgba(255,255,255,0.02)" : "#F8FAFC" }}>
              <span style={{ fontSize: "12px", color: isDark ? "#CBD5E1" : "#475569" }}>{t("Weekly Payout Settlement Cycle")}</span>
              <span style={{ fontSize: "12px", fontWeight: "700", color: "#FF7900" }}>{t("Next Clearance: Monday")}</span>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}
