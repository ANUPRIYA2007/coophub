import React, { useState, useEffect } from "react";
import { useTheme } from "../../../context/ThemeContext";
import { 
  TrendingUp, DollarSign, Users, Activity, BarChart3, 
  Download, RefreshCw, Calendar, ArrowUpRight, ArrowDownRight, 
  Building2, Globe2, MapPin, CheckCircle2, ChevronRight, X
} from "lucide-react";
import { exportToCSV, exportToExcel, exportToPDF, exportChartAsPNG, copyToClipboard } from "../../../utils/analyticsExport";

export default function AnalyticsDashboard() {
  const { isDark } = useTheme();
  const [timeRange, setTimeRange] = useState("30D");
  const [loading, setLoading] = useState(false);
  const [exportOpen, setExportOpen] = useState(false);
  const [selectedDossier, setSelectedDossier] = useState(null);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  const sampleTableData = [
    { zone: "South Zone", state: "Tamil Nadu", district: "Chennai", coop: "TUCS Triplicane", pillars: 64, gmv: "₹18,40,000", share: "₹1,56,400", status: "Active" },
    { zone: "South Zone", state: "Tamil Nadu", district: "Coimbatore", coop: "Coimbatore Labour Coop", pillars: 48, gmv: "₹12,20,000", share: "₹1,03,700", status: "Active" },
    { zone: "South Zone", state: "Kerala", district: "Ernakulam", coop: "Ernakulam District Labour", pillars: 32, gmv: "₹8,60,000", share: "₹73,100", status: "Active" },
    { zone: "West Zone", state: "Maharashtra", district: "Mumbai City", coop: "Mumbai Artisans Coop", pillars: 22, gmv: "₹4,80,000", share: "₹40,800", status: "Active" },
    { zone: "North Zone", state: "Delhi NCR", district: "New Delhi", coop: "Delhi NCR Labour Coop", pillars: 14, gmv: "₹1,60,000", share: "₹13,600", status: "Active" }
  ];

  const handleExportCSV = () => {
    exportToCSV("COOP_HUB_BI_Analytics", sampleTableData);
    setExportOpen(false);
  };

  const handleExportExcel = () => {
    exportToExcel("COOP_HUB_BI_Analytics", sampleTableData);
    setExportOpen(false);
  };

  const handleExportPDF = () => {
    exportToPDF("National BI Analytics Dossier", "bi-table-container");
    setExportOpen(false);
  };

  return (
    <div className="fade-in" style={{ paddingBottom: "30px" }}>
      {/* Top BI Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ 
              background: "rgba(59, 130, 246, 0.15)", color: "#3B82F6", 
              fontSize: "0.75rem", fontWeight: "800", padding: "2px 8px", borderRadius: "10px", textTransform: "uppercase" 
            }}>
              REAL-TIME BI COMMAND CENTER
            </span>
            <span style={{ fontSize: "0.8rem", color: isDark ? "#94A3B8" : "#64748B" }}>• Last Updated: {new Date().toLocaleTimeString()}</span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A", margin: 0 }}>
            National Platform Analytics & Business Intelligence
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Time Range Toggle */}
          <div style={{ display: "flex", background: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9", padding: "3px", borderRadius: "8px", border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #CBD5E1" }}>
            {["7D", "30D", "90D", "1Y"].map(t => (
              <button
                key={t}
                onClick={() => setTimeRange(t)}
                style={{
                  background: timeRange === t ? "#FF7900" : "transparent",
                  color: timeRange === t ? "#050A12" : (isDark ? "#94A3B8" : "#64748B"),
                  border: "none",
                  padding: "4px 10px",
                  borderRadius: "6px",
                  fontWeight: "700",
                  fontSize: "11px",
                  cursor: "pointer"
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <button
            onClick={handleRefresh}
            style={{
              background: isDark ? "rgba(255,255,255,0.05)" : "#F1F5F9",
              border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid #CBD5E1",
              color: isDark ? "#E2E8F0" : "#334155",
              padding: "7px 12px",
              borderRadius: "8px",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px"
            }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>

          {/* Export Dropdown */}
          <div style={{ position: "relative" }}>
            <button
              onClick={() => setExportOpen(!exportOpen)}
              style={{
                background: "#10B981",
                color: "#FFFFFF",
                border: "none",
                padding: "7px 14px",
                borderRadius: "8px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px"
              }}
            >
              <Download size={14} /> Export BI Report
            </button>

            {exportOpen && (
              <div style={{
                position: "absolute",
                right: 0,
                top: "40px",
                background: isDark ? "#0F172A" : "#FFFFFF",
                border: isDark ? "1px solid rgba(255,255,255,0.15)" : "1px solid #CBD5E1",
                borderRadius: "8px",
                boxShadow: "0 10px 25px rgba(0,0,0,0.3)",
                padding: "6px",
                zIndex: 50,
                minWidth: "160px"
              }}>
                <button onClick={handleExportCSV} style={exportItemStyle(isDark)}>CSV Dataset</button>
                <button onClick={handleExportExcel} style={exportItemStyle(isDark)}>Excel (.xlsx)</button>
                <button onClick={handleExportPDF} style={exportItemStyle(isDark)}>Printable PDF Report</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 10 Executive KPI Metric Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        <KpiCard title="GMV Volume" value="₹42,80,000" sub="+22.4% MoM" color="#FF7900" isDark={isDark} />
        <KpiCard title="Pillar Share (91.5%)" value="₹39,16,200" sub="Direct Payouts" color="#10B981" isDark={isDark} />
        <KpiCard title="Coop Share (8.5%)" value="₹3,63,800" sub="Reserve Fund" color="#3B82F6" isDark={isDark} />
        <KpiCard title="Completed Bookings" value="1,248" sub="98.2% Fulfillment" color="#8B5CF6" isDark={isDark} />
        <KpiCard title="Cancellation Rate" value="1.8%" sub="-0.4% Improvement" color="#EF4444" isDark={isDark} />
        <KpiCard title="Workforce Utilization" value="84.2%" sub="Active On-Duty" color="#F59E0B" isDark={isDark} />
        <KpiCard title="Active Pillars" value="148" sub="124 Online Now" color="#10B981" isDark={isDark} />
        <KpiCard title="Active Customers" value="342" sub="74% Repeat Users" color="#3B82F6" isDark={isDark} />
        <KpiCard title="NPS Rating" value="4.88 ★" sub="1,248 Reviews" color="#F59E0B" isDark={isDark} />
        <KpiCard title="Period Growth" value="+22.4%" sub="vs Prev 30 Days" color="#10B981" isDark={isDark} />
      </div>

      {/* Telemetry Data Table */}
      <div id="bi-table-container" style={{ background: isDark ? "#0A1220" : "#FFFFFF", border: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0", borderRadius: "14px", padding: "18px" }}>
        <h3 style={{ margin: "0 0 12px 0", fontSize: "1rem", fontWeight: "700", color: isDark ? "#FFFFFF" : "#0F172A" }}>
          Regional Telemetry & Payout Breakdowns
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "12.5px" }}>
          <thead>
            <tr style={{ background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", borderBottom: isDark ? "1px solid rgba(255,255,255,0.08)" : "1px solid #E2E8F0" }}>
              <th style={thStyle(isDark)}>Zone</th>
              <th style={thStyle(isDark)}>State</th>
              <th style={thStyle(isDark)}>District</th>
              <th style={thStyle(isDark)}>Cooperative Society</th>
              <th style={thStyle(isDark)}>Active Pillars</th>
              <th style={thStyle(isDark)}>Total GMV</th>
              <th style={thStyle(isDark)}>Society 8.5% Share</th>
              <th style={thStyle(isDark)}>Status</th>
            </tr>
          </thead>
          <tbody>
            {sampleTableData.map((row, idx) => (
              <tr key={idx} style={{ borderBottom: isDark ? "1px solid rgba(255,255,255,0.05)" : "1px solid #E2E8F0" }}>
                <td style={tdStyle(isDark)}>{row.zone}</td>
                <td style={tdStyle(isDark)}>{row.state}</td>
                <td style={tdStyle(isDark)}>{row.district}</td>
                <td style={{ ...tdStyle(isDark), fontWeight: "700", color: "#FF7900" }}>{row.coop}</td>
                <td style={tdStyle(isDark)}>{row.pillars}</td>
                <td style={{ ...tdStyle(isDark), fontWeight: "700" }}>{row.gmv}</td>
                <td style={{ ...tdStyle(isDark), fontWeight: "700", color: "#10B981" }}>{row.share}</td>
                <td style={tdStyle(isDark)}>
                  <span style={{ background: "rgba(16, 185, 129, 0.15)", color: "#10B981", fontSize: "10px", fontWeight: "700", padding: "2px 6px", borderRadius: "4px" }}>
                    {row.status}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KpiCard({ title, value, sub, color, isDark }) {
  return (
    <div style={{ background: isDark ? "#0A1220" : "#FFFFFF", border: isDark ? `1px solid ${color}30` : "1px solid #E2E8F0", padding: "14px", borderRadius: "10px" }}>
      <div style={{ fontSize: "11px", color: isDark ? "#94A3B8" : "#64748B", fontWeight: "600" }}>{title}</div>
      <div style={{ fontSize: "1.3rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A", margin: "2px 0" }}>{value}</div>
      <div style={{ fontSize: "10px", color: color, fontWeight: "700" }}>{sub}</div>
    </div>
  );
}

function thStyle(isDark) {
  return { padding: "10px 12px", textAlign: "left", color: isDark ? "#94A3B8" : "#64748B", fontWeight: "700" };
}

function tdStyle(isDark) {
  return { padding: "10px 12px", color: isDark ? "#E2E8F0" : "#334155" };
}

function exportItemStyle(isDark) {
  return {
    width: "100%",
    textAlign: "left",
    padding: "8px 10px",
    background: "transparent",
    border: "none",
    color: isDark ? "#E2E8F0" : "#334155",
    fontSize: "12px",
    fontWeight: "600",
    cursor: "pointer"
  };
}
