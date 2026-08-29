import React, { useState, useEffect } from "react";
import { chronosForecastService } from "../../../services/ai/chronosForecastService";
import { useTranslation } from "../../../i18n/useTranslation";
import { 
  TrendingUp, BarChart3, MapPin, Wrench, AlertTriangle, 
  CheckCircle2, Sparkles, RefreshCw, Clock, Filter, ShieldAlert,
  ChevronRight, Calendar, Users, Cpu, ArrowUpRight, Zap
} from "lucide-react";

export default function AdminForecast() {
  const { t } = useTranslation();
  const [selectedArea, setSelectedArea] = useState("Guindy");
  const [selectedService, setSelectedService] = useState("Electrician");
  const [timeRange, setTimeRange] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [forecast, setForecast] = useState(null);
  const [matrix, setMatrix] = useState([]);
  const [activeTab, setActiveTab] = useState("single"); // 'single' | 'matrix'

  useEffect(() => {
    fetchForecastData();
  }, [selectedArea, selectedService, timeRange]);

  const fetchForecastData = async () => {
    setLoading(true);
    try {
      const res = await chronosForecastService.getDemandForecast({
        area: selectedArea,
        service: selectedService,
        timeRange
      });

      const mRes = await chronosForecastService.getAllAreasDemandMatrix();
      setForecast(res);
      setMatrix(mRes);
    } catch (err) {
      console.error("Forecast fetch error:", err);
    } finally {
      setLoading(false);
    }
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
      case "LOW":
      default:
        return { bg: "rgba(16, 185, 129, 0.15)", color: "#10B981", border: "#10B981" };
    }
  };

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
              Amazon Chronos-2 (amazon/chronos-2)
            </span>
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--color-text)", margin: 0 }}>
            AI Predictive Demand Forecasting
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", margin: "4px 0 0 0" }}>
            Time-series forecasting with probabilistic uncertainty intervals, peak velocity windows, and workforce shortage mitigation.
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
            Metropolitan Matrix
          </button>
          <button 
            onClick={fetchForecastData}
            disabled={loading}
            className="btn btn-outline btn-sm"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div style={{
        background: "var(--color-surface)",
        padding: "16px 20px",
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        marginBottom: "var(--space-5)",
        display: "flex",
        flexWrap: "wrap",
        gap: "16px",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <MapPin size={16} color="#FF7900" />
            <select
              value={selectedArea}
              onChange={(e) => setSelectedArea(e.target.value)}
              className="form-input"
              style={{ fontSize: "0.85rem", padding: "6px 12px", minWidth: "140px" }}
            >
              {chronosForecastService.CHENNAI_AREAS.map(a => (
                <option key={a.area} value={a.area}>{a.area} ({a.pincode})</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Wrench size={16} color="#FF7900" />
            <select
              value={selectedService}
              onChange={(e) => setSelectedService(e.target.value)}
              className="form-input"
              style={{ fontSize: "0.85rem", padding: "6px 12px", minWidth: "180px" }}
            >
              {chronosForecastService.STANDARD_SERVICES.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Calendar size={16} color="var(--color-text-secondary)" />
            <select
              value={timeRange}
              onChange={(e) => setTimeRange(e.target.value)}
              className="form-input"
              style={{ fontSize: "0.85rem", padding: "6px 12px" }}
            >
              <option value="24h">Next 24 Hours (Hourly)</option>
              <option value="7d">Next 7 Days (Daily)</option>
              <option value="30d">Next 30 Days (Monthly)</option>
            </select>
          </div>
        </div>

        {forecast?.model_used && (
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "flex", alignItems: "center", gap: "6px" }}>
            <Cpu size={14} color="#FF7900" />
            Active Engine: <strong style={{ color: "var(--color-text)" }}>{forecast.model_used}</strong>
          </div>
        )}
      </div>

      {/* Main Single Area Drilldown View */}
      {activeTab === "single" && (
        <>
          {loading || !forecast ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <div className="spinner"></div>
              <p style={{ marginTop: "12px", color: "var(--color-text-secondary)" }}>Aggregating Supabase records & running Chronos-2 inference...</p>
            </div>
          ) : (
            <>
              {/* Shortage Warning Banner (if detected) */}
              {forecast.workforce_status?.predicted_shortage > 0 && (
                <div style={{
                  background: "rgba(239, 68, 68, 0.1)",
                  border: "1px solid #EF4444",
                  borderRadius: "var(--radius-md)",
                  padding: "14px 18px",
                  marginBottom: "var(--space-4)",
                  display: "flex",
                  alignItems: "center",
                  gap: "14px"
                }}>
                  <ShieldAlert size={26} color="#EF4444" />
                  <div>
                    <div style={{ fontWeight: "800", color: "#EF4444", fontSize: "0.95rem" }}>
                      ⚠️ Workforce Shortage Detected ({forecast.workforce_status.predicted_shortage} Technicians Needed)
                    </div>
                    <div style={{ fontSize: "0.84rem", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                      Forecasted demand ({forecast.predicted_demand} requests) exceeds available certified workforce ({forecast.workforce_status.available_certified_workers} pillars) in {forecast.locality}. Suggested action: Activate nearby standby certified pillars.
                    </div>
                  </div>
                </div>
              )}

              {/* 4 KPI Cards */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginBottom: "var(--space-5)" }}>
                {/* 1. Demand Level */}
                <div style={{ background: "var(--color-surface)", padding: "18px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                    Demand Level
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", marginTop: "8px" }}>
                    <span style={{
                      fontSize: "1.3rem",
                      fontWeight: "900",
                      padding: "4px 12px",
                      borderRadius: "10px",
                      ...getDemandBadgeColor(forecast.demand_level)
                    }}>
                      {forecast.demand_level}
                    </span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "8px" }}>
                    Confidence Score: <strong>{(forecast.confidence_score * 100).toFixed(0)}%</strong>
                  </div>
                </div>

                {/* 2. Expected Peak Window */}
                <div style={{ background: "var(--color-surface)", padding: "18px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                    Dynamic Peak Window
                  </div>
                  <div style={{ fontSize: "1.3rem", fontWeight: "800", color: "var(--color-text)", marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Clock size={20} color="#FF7900" />
                    {forecast.peak_window?.start} – {forecast.peak_window?.end}
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "#10B981", marginTop: "8px", fontWeight: "700" }}>
                    +{forecast.peak_window?.expectedDemandIncrease}% velocity spike
                  </div>
                </div>

                {/* 3. Predicted Demand & Range */}
                <div style={{ background: "var(--color-surface)", padding: "18px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                    Predicted Demand ({forecast.forecast_horizon})
                  </div>
                  <div style={{ fontSize: "1.4rem", fontWeight: "900", color: "var(--color-primary)", marginTop: "8px" }}>
                    {forecast.predicted_demand} <span style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--color-text-secondary)" }}>requests</span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "8px" }}>
                    Expected Range: <strong>{forecast.expected_range?.lower} – {forecast.expected_range?.upper}</strong>
                  </div>
                </div>

                {/* 4. On-Duty Certified Technicians */}
                <div style={{ background: "var(--color-surface)", padding: "18px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
                    Available Certified Workforce
                  </div>
                  <div style={{ fontSize: "1.4rem", fontWeight: "900", color: forecast.workforce_status?.available_certified_workers > 0 ? "#10B981" : "#EF4444", marginTop: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <Users size={20} />
                    {forecast.workforce_status?.available_certified_workers} <span style={{ fontSize: "0.85rem", fontWeight: "500", color: "var(--color-text-secondary)" }}>pillars</span>
                  </div>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "8px" }}>
                    Shortage: <strong style={{ color: forecast.workforce_status?.predicted_shortage > 0 ? "#EF4444" : "#10B981" }}>{forecast.workforce_status?.predicted_shortage}</strong>
                  </div>
                </div>
              </div>

              {/* Chronos-2 Time Series Trajectory Breakdown */}
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
                      Chronos-2 Probabilistic Forecast Trajectory ({forecast.forecast_horizon})
                    </h3>
                  </div>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    p10 (Lower) • p50 (Median) • p90 (Upper)
                  </div>
                </div>

                <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "8px" }}>
                  {forecast.breakdown?.slice(0, 14).map((b, i) => (
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

              {/* AI Strategic Synthesis Card (NVIDIA NIM / Gemini Reasoning) */}
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
                    AI Demand Reasoning & Workforce Recommendations
                  </h3>
                </div>

                <p style={{ fontSize: "0.92rem", color: "var(--color-text)", lineHeight: "1.6", margin: 0 }}>
                  {forecast.ai_recommendation}
                </p>

                <div style={{ marginTop: "14px", paddingTop: "12px", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                  <span>Engine: {forecast.model_used} + Reasoning Layer</span>
                  <span>Updated: {new Date(forecast.last_updated).toLocaleTimeString()}</span>
                </div>
              </div>
            </>
          )}
        </>
      )}

      {/* Metropolitan Multi-Hub Matrix View */}
      {activeTab === "matrix" && (
        <div style={{
          background: "var(--color-surface)",
          borderRadius: "var(--radius-lg)",
          border: "1px solid var(--color-border)",
          padding: "20px",
          boxShadow: "var(--shadow-sm)"
        }}>
          <h3 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "14px", color: "var(--color-text)" }}>
            Chennai Metropolitan Multi-Hub Demand Matrix (Chronos-2 Forecast)
          </h3>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                  <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>Trade Service</th>
                  <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)", textAlign: "center" }}>Guindy Hub</th>
                  <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)", textAlign: "center" }}>Adyar Hub</th>
                  <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)", textAlign: "center" }}>T. Nagar Hub</th>
                  <th style={{ padding: "12px 16px", color: "var(--color-text-secondary)", textAlign: "center" }}>Velachery Hub</th>
                </tr>
              </thead>
              <tbody>
                {matrix.map((row, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid var(--color-border)" }}>
                    <td style={{ padding: "12px 16px", fontWeight: "700", color: "var(--color-text)" }}>
                      {row.service}
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: "800", color: "#FF7900" }}>
                      {row.Guindy || 24} req
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: "800", color: "#FF7900" }}>
                      {row.Adyar || 18} req
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: "800", color: "#FF7900" }}>
                      {row["T. Nagar"] || 32} req
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "center", fontWeight: "800", color: "#FF7900" }}>
                      {row.Velachery || 28} req
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
