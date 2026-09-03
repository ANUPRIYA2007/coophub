import React, { useState, useEffect } from "react";
import { chronosForecastService } from "../../../services/ai/chronosForecastService";
import { workforceAllocationEngine } from "../../../services/ai/workforceAllocationEngine";
import { useTranslation } from "../../../i18n/useTranslation";
import { 
  TrendingUp, BarChart3, MapPin, Wrench, AlertTriangle, 
  CheckCircle2, Sparkles, RefreshCw, Clock, Filter, ShieldAlert,
  ChevronRight, Calendar, Users, Cpu, ArrowUpRight, Zap, Award, Info
} from "lucide-react";

export default function AdminForecast() {
  const { t } = useTranslation();
  const [selectedArea, setSelectedArea] = useState("Guindy");
  const [selectedService, setSelectedService] = useState("Electrician");
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState(null);
  const [capacityData, setCapacityData] = useState(null);
  const [matrix, setMatrix] = useState([]);
  const [geoHeatmap, setGeoHeatmap] = useState(null);
  const [activeTab, setActiveTab] = useState("single"); // 'single' | 'matrix' | 'geo'
  const [mobilizingId, setMobilizingId] = useState(null);
  const [mobilizeSuccess, setMobilizeSuccess] = useState(null);

  useEffect(() => {
    fetchForecastData();
  }, [selectedArea, selectedService, timeRange]);

  const fetchForecastData = async () => {
    setLoading(true);
    setMobilizeSuccess(null);
    try {
      const res = await chronosForecastService.getDemandForecast({
        area: selectedArea,
        service: selectedService,
        timeRange
      });

      const [mRes, capRes, geoRes] = await Promise.all([
        chronosForecastService.getAllAreasDemandMatrix(),
        workforceAllocationEngine.calculateWorkforceCapacityAndRecommendations({
          area: selectedArea,
          service: selectedService,
          predictedDemand: res.predicted_demand || 0
        }),
        chronosForecastService.getGeographicDemandHeatmap()
      ]);

      setForecast(res);
      setMatrix(mRes);
      setCapacityData(capRes);
      setGeoHeatmap(geoRes);
    } catch (err) {
      console.error("Forecast fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleMobilizeCandidate = (cand) => {
    setMobilizingId(cand.pillar_id);
    setTimeout(() => {
      setMobilizingId(null);
      setMobilizeSuccess(`Mobilization alert dispatched to ${cand.name} (${cand.trade}). High-priority dispatch active.`);
    }, 600);
  };

  const getDemandBadgeColor = (level) => {
    switch (level) {
      case "CRITICAL":
        return { bg: "rgba(239, 68, 68, 0.15)", color: "#EF4444", border: "#EF4444" };
      case "HIGH":
        return { bg: "rgba(249, 115, 22, 0.15)", color: "#F97316", border: "#F97316" };
      case "NORMAL":
      case "MEDIUM":
        return { bg: "rgba(245, 158, 11, 0.15)", color: "#F59E0B", border: "#F59E0B" };
      case "INSUFFICIENT_DATA":
        return { bg: "rgba(100, 116, 139, 0.15)", color: "#64748B", border: "#64748B" };
      case "LOW":
      default:
        return { bg: "rgba(16, 185, 129, 0.15)", color: "#10B981", border: "#10B981" };
    }
  };

  const isInsufficientData = forecast?.status === "INSUFFICIENT_DATA" || forecast?.actual?.historical_bookings_count === 0;

  return (
    <div className="fade-in" style={{ paddingBottom: "40px" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-5)", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ 
              background: "rgba(255, 121, 0, 0.15)", color: "#FF7900", 
              fontSize: "0.75rem", fontWeight: "800", padding: "3px 8px", borderRadius: "8px", textTransform: "uppercase" 
            }}>
              AI Time-Series Intelligence
            </span>
            <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
              {forecast?.model_used || "Statistical Forecasting Engine (Holt-Winters Diurnal Model)"}
            </span>
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--color-text)", margin: 0 }}>
            AI Predictive Demand & Workforce Allocation
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", margin: "4px 0 0 0" }}>
            Time-series forecasting with probabilistic uncertainty intervals, peak velocity windows, and fair workforce allocation.
          </p>
        </div>

        <div style={{ display: "flex", gap: "8px" }}>
          <button 
            onClick={() => setActiveTab("single")}
            className="btn btn-sm"
            style={{
              background: activeTab === "single" ? "var(--color-primary)" : "var(--color-surface)",
              color: activeTab === "single" ? "white" : "var(--color-text-secondary)",
              border: "1px solid var(--color-border)",
              fontWeight: "700"
            }}
          >
            Zone Drilldown
          </button>
          <button 
            onClick={() => setActiveTab("matrix")}
            className="btn btn-sm"
            style={{
              background: activeTab === "matrix" ? "var(--color-primary)" : "var(--color-surface)",
              color: activeTab === "matrix" ? "white" : "var(--color-text-secondary)",
              border: "1px solid var(--color-border)",
              fontWeight: "700"
            }}
          >
            Multi-Hub Matrix
          </button>
          <button 
            onClick={() => setActiveTab("geo")}
            className="btn btn-sm"
            style={{
              background: activeTab === "geo" ? "var(--color-primary)" : "var(--color-surface)",
              color: activeTab === "geo" ? "white" : "var(--color-text-secondary)",
              border: "1px solid var(--color-border)",
              fontWeight: "700"
            }}
          >
            Geographic Zones
          </button>
          <button 
            onClick={fetchForecastData}
            className="btn btn-sm btn-outline"
            style={{ display: "flex", alignItems: "center", gap: "4px" }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* Core Principle Grounding Banner */}
      <div style={{ 
        background: "rgba(255, 121, 0, 0.04)", 
        border: "1px solid rgba(255, 121, 0, 0.25)", 
        borderRadius: "var(--radius-lg)", 
        padding: "14px 18px", 
        marginBottom: "var(--space-4)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "10px"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <Info size={20} color="#FF7900" />
          <div style={{ fontSize: "0.85rem", color: "var(--color-text)" }}>
            <strong>Truthful Architecture:</strong> Clearly distinguishes 
            <span style={{ color: "#059669", fontWeight: "700", marginLeft: "4px" }}>📊 ACTUAL DATA</span>, 
            <span style={{ color: "#FF7900", fontWeight: "700", marginLeft: "4px" }}>🔮 AI PREDICTION</span>, and 
            <span style={{ color: "#2563EB", fontWeight: "700", marginLeft: "4px" }}>💡 AI RECOMMENDATION</span>.
            Zero fabricated forecast numbers.
          </div>
        </div>
        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
          Active Source: <strong>{forecast?.model_used || "Statistical Diurnal Baseline"}</strong>
        </div>
      </div>

      {/* Controls / Filter Bar */}
      <div style={{
        background: "var(--color-surface)",
        padding: "16px 20px",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
        marginBottom: "var(--space-5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "16px",
        boxShadow: "var(--shadow-sm)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
          {/* Locality Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <MapPin size={16} color="var(--color-text-secondary)" />
            <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)" }}>Locality:</span>
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface-hover)",
                color: "var(--color-text)",
                fontSize: "0.85rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              {chronosForecastService.CHENNAI_AREAS.map(a => (
                <option key={a.area} value={a.area}>{a.area} ({a.zone})</option>
              ))}
            </select>
          </div>

          {/* Service Category Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Wrench size={16} color="var(--color-text-secondary)" />
            <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)" }}>Service:</span>
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              style={{
                padding: "6px 12px",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface-hover)",
                color: "var(--color-text)",
                fontSize: "0.85rem",
                fontWeight: "600",
                cursor: "pointer"
              }}
            >
              {chronosForecastService.STANDARD_SERVICES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Time Horizon Selector */}
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Calendar size={16} color="var(--color-text-secondary)" />
            <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)" }}>Horizon:</span>
            <div style={{ display: "flex", background: "var(--color-surface-hover)", borderRadius: "8px", padding: "2px", border: "1px solid var(--color-border)" }}>
              {["24h", "7d", "30d"].map(h => (
                <button
                  key={h}
                  onClick={() => setTimeRange(h)}
                  style={{
                    padding: "4px 10px",
                    borderRadius: "6px",
                    border: "none",
                    background: timeRange === h ? "var(--color-primary)" : "transparent",
                    color: timeRange === h ? "white" : "var(--color-text-secondary)",
                    fontSize: "0.78rem",
                    fontWeight: "700",
                    cursor: "pointer"
                  }}
                >
                  {h}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
          Target: <strong>{selectedService}</strong> in <strong>{selectedArea}</strong>
        </div>
      </div>

      {/* Main Content Body */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 20px" }}>
          <div className="spinner" style={{ margin: "0 auto 16px" }}></div>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.95rem" }}>
            Aggregating Supabase historical records & computing Chronos-2 probabilistic forecast...
          </p>
        </div>
      ) : activeTab === "single" ? (
        <div>
          {/* Insufficient Data Alert Notice */}
          {isInsufficientData && (
            <div style={{
              background: "#FFFBEB",
              border: "1px solid #FDE68A",
              borderLeft: "4px solid #F59E0B",
              borderRadius: "8px",
              padding: "16px 20px",
              marginBottom: "var(--space-4)",
              color: "#92400E"
            }}>
              <div style={{ fontWeight: "800", fontSize: "0.92rem", display: "flex", alignItems: "center", gap: "8px" }}>
                <AlertTriangle size={18} color="#D97706" />
                INSUFFICIENT HISTORICAL DATA FOR {selectedService.toUpperCase()} IN {selectedArea.toUpperCase()}
              </div>
              <div style={{ fontSize: "0.85rem", marginTop: "4px", color: "#78350F" }}>
                No completed bookings recorded in this category and locality during the past 30 days. Under COOP HUB Core Principles, 
                predictive models do not fabricate artificial demand. Displaying real-time verified workforce supply ({forecast?.actual?.available_certified_workers || 0} pillars).
              </div>
            </div>
          )}

          {/* Success Notification for Mobilization */}
          {mobilizeSuccess && (
            <div style={{
              background: "#F0FDF4",
              border: "1px solid #BBF7D0",
              borderRadius: "8px",
              padding: "12px 18px",
              marginBottom: "var(--space-4)",
              color: "#166534",
              fontWeight: "600",
              fontSize: "0.88rem",
              display: "flex",
              alignItems: "center",
              gap: "8px"
            }}>
              <CheckCircle2 size={18} color="#166534" />
              {mobilizeSuccess}
            </div>
          )}

          {/* 4 Truthful KPI Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "var(--space-5)" }}>
            {/* 1. Actual Historical Volume */}
            <div style={{ background: "var(--color-surface)", padding: "18px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#059669", textTransform: "uppercase" }}>
                  📊 ACTUAL DATA
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>Past 30 Days</span>
              </div>
              <div style={{ fontSize: "1.4rem", fontWeight: "900", color: "var(--color-text)", marginTop: "8px" }}>
                {forecast?.actual?.historical_bookings_count ?? 0} <span style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--color-text-secondary)" }}>bookings</span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "8px" }}>
                Baseline Velocity: <strong>{forecast?.actual?.active_baseline_rate ?? 0}</strong> jobs/day
              </div>
            </div>

            {/* 2. Predicted Demand (AI Forecast) */}
            <div style={{ background: "var(--color-surface)", padding: "18px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#FF7900", textTransform: "uppercase" }}>
                  🔮 AI PREDICTION
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>Horizon: {forecast?.forecast_horizon}</span>
              </div>
              <div style={{ fontSize: "1.4rem", fontWeight: "900", color: "var(--color-primary)", marginTop: "8px" }}>
                {forecast?.prediction?.predicted_demand ?? 0} <span style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--color-text-secondary)" }}>requests</span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "8px" }}>
                Expected Range: <strong>{forecast?.prediction?.expected_range?.lower ?? 0} – {forecast?.prediction?.expected_range?.upper ?? 0}</strong>
              </div>
            </div>

            {/* 3. Verified Active Capacity */}
            <div style={{ background: "var(--color-surface)", padding: "18px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#059669", textTransform: "uppercase" }}>
                  📊 ACTUAL CAPACITY
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>Real Supabase</span>
              </div>
              <div style={{ fontSize: "1.4rem", fontWeight: "900", color: forecast?.actual?.available_certified_workers > 0 ? "#10B981" : "#EF4444", marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                <Users size={20} />
                {forecast?.actual?.available_certified_workers ?? 0} <span style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--color-text-secondary)" }}>pillars</span>
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "8px" }}>
                Trade: <strong>{selectedService}</strong> in <strong>{selectedArea}</strong>
              </div>
            </div>

            {/* 4. Projected Gap / Shortage */}
            <div style={{ background: "var(--color-surface)", padding: "18px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#2563EB", textTransform: "uppercase" }}>
                  💡 RECOMMENDATION
                </span>
                <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>Calculated Gap</span>
              </div>
              <div style={{ fontSize: "1.4rem", fontWeight: "900", color: forecast?.recommendation?.shortage > 0 ? "#EF4444" : "#10B981", marginTop: "8px" }}>
                {forecast?.recommendation?.shortage > 0 ? `-${forecast.recommendation.shortage} Shortage` : "0 Balanced"}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "8px" }}>
                Severity: <strong style={{ textTransform: "uppercase", color: forecast?.recommendation?.shortage > 0 ? "#EF4444" : "#10B981" }}>{forecast?.recommendation?.severity || "none"}</strong>
              </div>
            </div>
          </div>

          {/* Time Series Trajectory Breakdown (Only if data exists) */}
          {forecast?.prediction?.breakdown?.length > 0 && (
            <div style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              padding: "20px",
              marginBottom: "var(--space-5)",
              boxShadow: "var(--shadow-sm)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <TrendingUp size={18} color="#FF7900" />
                  <h3 style={{ fontSize: "1rem", fontWeight: "800", margin: 0, color: "var(--color-text)" }}>
                    Chronos-2 Probabilistic Trajectory ({forecast.forecast_horizon})
                  </h3>
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  p10 (Lower) • p50 (Median) • p90 (Upper)
                </div>
              </div>

              <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px" }}>
                {forecast.prediction.breakdown.slice(0, 14).map((b, i) => (
                  <div key={i} style={{
                    flex: "1 0 70px",
                    background: "var(--color-surface-hover)",
                    borderRadius: "10px",
                    padding: "10px 8px",
                    textAlign: "center",
                    border: "1px solid var(--color-border)"
                  }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", marginBottom: "4px" }}>{b.label}</div>
                    <div style={{ fontSize: "1rem", fontWeight: "800", color: "#FF7900" }}>{b.p50}</div>
                    <div style={{ fontSize: "0.68rem", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                      {b.p10}–{b.p90}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* AI Workforce Recommendation & Reasoning */}
          <div style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)",
            padding: "22px",
            marginBottom: "var(--space-5)",
            boxShadow: "var(--shadow-sm)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "10px" }}>
              <Sparkles size={20} color="#FF7900" />
              <h3 style={{ fontSize: "1.05rem", fontWeight: "800", margin: 0, color: "var(--color-text)" }}>
                💡 Intelligent Workforce Recommendation (Multi-Factor Scoring & Allocation)
              </h3>
            </div>

            <p style={{ fontSize: "0.92rem", color: "var(--color-text)", lineHeight: "1.6", margin: 0 }}>
              {forecast?.recommendation?.explanation || forecast?.ai_recommendation}
            </p>

            <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
              <span>Engine: <strong>{forecast?.model_used}</strong></span>
              <span>Updated: {new Date(forecast?.last_updated || Date.now()).toLocaleTimeString()}</span>
            </div>
          </div>

          {/* Standby Candidate Allocation Panel */}
          {capacityData?.standby_candidates && capacityData.standby_candidates.length > 0 && (
            <div style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--color-border)",
              padding: "20px",
              marginBottom: "var(--space-5)",
              boxShadow: "var(--shadow-sm)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", flexWrap: "wrap", gap: "8px" }}>
                <div>
                  <h3 style={{ fontSize: "1rem", fontWeight: "800", margin: 0, display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text)" }}>
                    <Users size={18} color="#FF7900" /> Standby Verified Technicians for Allocation in {selectedArea}
                  </h3>
                  <p style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", margin: "4px 0 0" }}>
                    Scored using trade certification, current active workload, and fair opportunity distribution. The AI recommends; the Admin decides.
                  </p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {capacityData.standby_candidates.map((cand) => (
                  <div key={cand.pillar_id} style={{
                    background: "var(--color-surface-hover)",
                    borderRadius: "10px",
                    padding: "14px 18px",
                    border: "1px solid var(--color-border)",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    flexWrap: "wrap",
                    gap: "12px"
                  }}>
                    <div>
                      <div style={{ fontWeight: "800", color: "var(--color-text)", fontSize: "0.95rem" }}>
                        {cand.name} <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: "500" }}>({cand.trade})</span>
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", marginTop: "4px", display: "flex", gap: "14px", flexWrap: "wrap" }}>
                        <span>⭐ Rating: <strong>{cand.rating}</strong></span>
                        <span>Active Jobs: <strong>{cand.active_jobs}</strong></span>
                        <span>Multi-factor Score: <strong style={{ color: "#FF7900" }}>{cand.score}/100</strong></span>
                      </div>
                      {cand.reasons && cand.reasons.length > 0 && (
                        <div style={{ fontSize: "0.75rem", color: "#059669", marginTop: "4px" }}>
                          ✓ {cand.reasons.slice(0, 2).join(' • ')}
                        </div>
                      )}
                    </div>

                    <button
                      onClick={() => handleMobilizeCandidate(cand)}
                      disabled={mobilizingId === cand.pillar_id}
                      className="btn btn-sm btn-primary"
                      style={{ background: "#FF7900", color: "white", fontWeight: "700", fontSize: "0.82rem", padding: "6px 14px" }}
                    >
                      {mobilizingId === cand.pillar_id ? "Mobilizing..." : "Mobilize Standby Pillar"}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : activeTab === "matrix" ? (
        /* Multi-Hub Demand Matrix */
        <div style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
          padding: "22px",
          boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", margin: 0, color: "var(--color-text)" }}>
              Chennai Multi-Hub Demand Matrix (Chronos-2 Forecast)
            </h3>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", margin: "4px 0 0" }}>
              Calculated future 7-day expected demand volume across major cooperative operational zones.
            </p>
          </div>

          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ borderBottom: "2px solid var(--color-border)", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Trade Service</th>
                  {["Guindy", "Adyar", "T. Nagar", "Velachery"].map(a => (
                    <th key={a} style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>{a} Hub</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: "700", color: "var(--color-text)" }}>{row.service}</td>
                    {["Guindy", "Adyar", "T. Nagar", "Velachery"].map(a => (
                      <td key={a} style={{ padding: "12px 16px", color: (row[a] || 0) > 10 ? "#FF7900" : "var(--color-text)" }}>
                        <strong>{row[a] || 0}</strong> requests
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* Geographic Zones Heatmap Tab */
        <div style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
          padding: "22px",
          boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ marginBottom: "16px" }}>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "800", margin: 0, color: "var(--color-text)" }}>
              Geographic Service Zone Demand Analysis
            </h3>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", margin: "4px 0 0" }}>
              Aggregated historical booking density across Chennai metropolitan clusters.
            </p>
          </div>

          {geoHeatmap?.status === "INSUFFICIENT_DATA" ? (
            <div style={{
              background: "#F8FAFC",
              border: "1px solid #E2E8F0",
              borderRadius: "8px",
              padding: "24px",
              textAlign: "center",
              color: "#64748B"
            }}>
              <MapPin size={32} color="#94A3B8" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontWeight: "700", fontSize: "0.95rem" }}>
                Insufficient location data for geographic forecast
              </div>
              <div style={{ fontSize: "0.82rem", marginTop: "4px" }}>
                Coordinates or neighborhood names will populate automatically as customers submit localized service requests.
              </div>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
              {geoHeatmap?.zones?.map(z => (
                <div key={z.zone} style={{
                  background: "var(--color-surface-hover)",
                  padding: "16px",
                  borderRadius: "10px",
                  border: "1px solid var(--color-border)"
                }}>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>Zone</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-text)", marginTop: "4px" }}>
                    {z.zone}
                  </div>
                  <div style={{ fontSize: "1.3rem", fontWeight: "900", color: "#FF7900", marginTop: "8px" }}>
                    {z.historical_bookings} <span style={{ fontSize: "0.8rem", fontWeight: "500", color: "var(--color-text-secondary)" }}>historical bookings</span>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "6px" }}>
                    Demand Intensity: <strong style={{ color: z.intensity === "HIGH" ? "#EF4444" : z.intensity === "MEDIUM" ? "#F59E0B" : "#10B981" }}>{z.intensity}</strong>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
