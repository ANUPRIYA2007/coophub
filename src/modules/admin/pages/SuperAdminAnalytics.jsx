import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { useTheme } from "../../../context/ThemeContext";
import { useTranslation } from "../../../hooks/useTranslation";
import { 
  TrendingUp, DollarSign, Users, Activity, BarChart3, 
  Download, RefreshCw, Globe, Calendar, CheckCircle2, XCircle, Star, Zap
} from "lucide-react";
import { exportToCSV, exportToExcel, exportToPDF, copyToClipboard } from "../../../utils/analyticsExport";

export default function SuperAdminAnalytics() {
  const { t } = useTranslation();
  const { isDark } = useTheme();
  const [timeRange, setTimeRange] = useState("30D");
  const [geoFilter, setGeoFilter] = useState("national");
  const [loading, setLoading] = useState(true);
  const [exportOpen, setExportOpen] = useState(false);

  // Real KPI State
  const [kpis, setKpis] = useState({
    gmv: 0, pillarShare: 0, coopShare: 0,
    completedBookings: 0, cancelledBookings: 0, totalBookings: 0,
    activePillars: 0, totalPillars: 0, onlinePillars: 0,
    totalCustomers: 0,
    avgRating: 0, totalReviews: 0,
    pendingRequests: 0
  });

  // Trend data for charts (computed from real records)
  const [bookingsByDay, setBookingsByDay] = useState([]);
  const [tradeDistribution, setTradeDistribution] = useState([]);
  const [tableData, setTableData] = useState([]);

  const getDateCutoff = useCallback(() => {
    const now = new Date();
    switch (timeRange) {
      case "7D": return new Date(now - 7 * 86400000).toISOString();
      case "30D": return new Date(now - 30 * 86400000).toISOString();
      case "90D": return new Date(now - 90 * 86400000).toISOString();
      case "1Y": return new Date(now - 365 * 86400000).toISOString();
      default: return new Date(now - 30 * 86400000).toISOString();
    }
  }, [timeRange]);

  const fetchAnalyticsData = useCallback(async () => {
    setLoading(true);
    const cutoff = getDateCutoff();

    try {
      const [invoicesRes, paymentsRes, bookingsRes, requestsRes, pillarsRes, customersRes, reviewsRes] = await Promise.allSettled([
        supabase.from("invoices").select("id, total_amount, created_at, status").gte("created_at", cutoff),
        supabase.from("payments").select("id, amount, payment_status, status, created_at").gte("created_at", cutoff),
        supabase.from("bookings").select("id, status, service_name, created_at").gte("created_at", cutoff),
        supabase.from("service_requests").select("id, status, service_type, is_emergency, created_at").gte("created_at", cutoff),
        supabase.from("pillar_profiles").select("id, status, is_available, main_services"),
        supabase.from("customer_profiles").select("id, created_at"),
        supabase.from("reviews").select("id, rating, created_at").gte("created_at", cutoff)
      ]);

      const invoices = invoicesRes.status === 'fulfilled' ? (invoicesRes.value.data || []) : [];
      const payments = paymentsRes.status === 'fulfilled' ? (paymentsRes.value.data || []) : [];
      const bookings = bookingsRes.status === 'fulfilled' ? (bookingsRes.value.data || []) : [];
      const requests = requestsRes.status === 'fulfilled' ? (requestsRes.value.data || []) : [];
      const allPillars = pillarsRes.status === 'fulfilled' ? (pillarsRes.value.data || []) : [];
      const customers = customersRes.status === 'fulfilled' ? (customersRes.value.data || []) : [];
      const reviews = reviewsRes.status === 'fulfilled' ? (reviewsRes.value.data || []) : [];

      // GMV from invoices
      const gmv = invoices.reduce((s, i) => s + Number(i.total_amount || 0), 0);
      const settledRevenue = payments
        .filter(p => p.payment_status === 'completed' || p.status === 'completed')
        .reduce((s, p) => s + Number(p.amount || 0), 0);
      const effectiveGmv = gmv > 0 ? gmv : settledRevenue;

      // Bookings
      const completed = bookings.filter(b => b.status === 'completed').length;
      const cancelled = bookings.filter(b => b.status === 'cancelled').length;
      const total = bookings.length;

      // Pillars
      const verified = allPillars.filter(p => p.status === 'verified');
      const online = verified.filter(p => p.is_available);

      // Reviews
      const avgRating = reviews.length > 0 
        ? (reviews.reduce((s, r) => s + Number(r.rating || 0), 0) / reviews.length).toFixed(2) 
        : 0;

      setKpis({
        gmv: effectiveGmv,
        pillarShare: Math.round(effectiveGmv * 0.915 * 100) / 100,
        coopShare: Math.round(effectiveGmv * 0.085 * 100) / 100,
        completedBookings: completed,
        cancelledBookings: cancelled,
        totalBookings: total,
        activePillars: verified.length,
        totalPillars: allPillars.length,
        onlinePillars: online.length,
        totalCustomers: customers.length,
        avgRating: Number(avgRating),
        totalReviews: reviews.length,
        pendingRequests: requests.filter(r => r.status === 'pending' || r.status === 'open').length
      });

      // Bookings by day for chart
      const dayMap = {};
      bookings.forEach(b => {
        const day = new Date(b.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
        dayMap[day] = (dayMap[day] || 0) + 1;
      });
      setBookingsByDay(Object.entries(dayMap).map(([day, count]) => ({ day, count })).slice(-15));

      // Trade distribution
      const tradeMap = {};
      requests.forEach(r => {
        const trade = r.service_type || "Other";
        tradeMap[trade] = (tradeMap[trade] || 0) + 1;
      });
      setTradeDistribution(Object.entries(tradeMap).map(([trade, count]) => ({ trade, count })).sort((a, b) => b.count - a.count).slice(0, 8));

      // Table data for regional breakdown (from pillars grouped by trade)
      const pillarTradeMap = {};
      allPillars.forEach(p => {
        const trades = Array.isArray(p.main_services) ? p.main_services : [p.main_services || "Unknown"];
        trades.forEach(t => {
          if (!pillarTradeMap[t]) pillarTradeMap[t] = { trade: t, pillars: 0, verified: 0 };
          pillarTradeMap[t].pillars++;
          if (p.status === 'verified') pillarTradeMap[t].verified++;
        });
      });
      setTableData(Object.values(pillarTradeMap).sort((a, b) => b.pillars - a.pillars));

    } catch (err) {
      console.error("Analytics fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, [getDateCutoff]);

  useEffect(() => {
    fetchAnalyticsData();
  }, [fetchAnalyticsData]);

  const fmt = (val) => val > 0 ? `₹${Number(val).toLocaleString('en-IN')}` : "₹0";
  const cancelRate = kpis.totalBookings > 0 ? ((kpis.cancelledBookings / kpis.totalBookings) * 100).toFixed(1) + "%" : "N/A";
  const utilizationRate = kpis.activePillars > 0 ? ((kpis.onlinePillars / kpis.activePillars) * 100).toFixed(1) + "%" : "N/A";

  const handleExport = (type) => {
    const rows = tableData.map(r => ({ Trade: r.trade, TotalPillars: r.pillars, Verified: r.verified }));
    if (type === 'csv') exportToCSV("COOP_HUB_Analytics_National", rows);
    if (type === 'xlsx') exportToExcel("COOP_HUB_Analytics_National", rows);
    if (type === 'pdf') exportToPDF("National BI Analytics", "analytics-data-container");
    if (type === 'clipboard') copyToClipboard(rows).then(() => alert("Copied!"));
    setExportOpen(false);
  };

  // SVG chart max
  const maxBookings = Math.max(...bookingsByDay.map(d => d.count), 1);
  const maxTrade = Math.max(...tradeDistribution.map(d => d.count), 1);

  return (
    <div className="fade-in" id="analytics-data-container" style={{ paddingBottom: "30px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "20px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ background: "rgba(59,130,246,0.15)", color: "#3B82F6", fontSize: "0.75rem", fontWeight: "800", padding: "2px 8px", borderRadius: "10px", textTransform: "uppercase" }}>
              {t("REAL-TIME BI COMMAND CENTER")}
            </span>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>• {t("Last Updated")}: {new Date().toLocaleTimeString()}</span>
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)", margin: 0 }}>
            {t("National Analytics & Business Intelligence")}
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Time Range Toggle */}
          <div style={{ display: "flex", background: "var(--bg-color)", padding: "3px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
            {["7D", "30D", "90D", "1Y"].map(tr => (
              <button key={tr} onClick={() => setTimeRange(tr)} style={{
                background: timeRange === tr ? "var(--color-secondary)" : "transparent",
                color: timeRange === tr ? "#050A12" : "var(--color-text-secondary)",
                border: "none", padding: "4px 10px", borderRadius: "6px", fontWeight: "700", fontSize: "11px", cursor: "pointer"
              }}>
                {tr}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-color)", border: "1px solid var(--color-border)", padding: "0 10px", borderRadius: "8px" }}>
            <Globe size={14} color="var(--color-text-muted)" />
            <select value={geoFilter} onChange={(e) => setGeoFilter(e.target.value)} style={{ border: "none", background: "transparent", color: "var(--color-text)", fontWeight: "600", outline: "none", padding: "6px 0", fontSize: "0.8rem" }}>
              <option value="national">{t("National")}</option>
              <option value="zone_south">{t("South Zone")}</option>
              <option value="zone_north">{t("North Zone")}</option>
            </select>
          </div>

          <button onClick={fetchAnalyticsData} style={{ background: "var(--bg-color)", border: "1px solid var(--color-border)", color: "var(--color-text)", padding: "6px 12px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> {t("Refresh")}
          </button>

          {/* Export Dropdown */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setExportOpen(!exportOpen)} style={{ background: "var(--color-success)", color: "#fff", border: "none", padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "700", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px" }}>
              <Download size={14} /> {t("Export BI Report")}
            </button>
            {exportOpen && (
              <div style={{ position: "absolute", right: 0, top: "40px", background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "8px", boxShadow: "var(--shadow-lg)", padding: "6px", zIndex: 50, minWidth: "160px" }}>
                <button onClick={() => handleExport('csv')} style={expBtn}>{t("CSV Dataset")}</button>
                <button onClick={() => handleExport('xlsx')} style={expBtn}>{t("Excel (.xlsx)")}</button>
                <button onClick={() => handleExport('pdf')} style={expBtn}>{t("Printable PDF")}</button>
                <button onClick={() => handleExport('clipboard')} style={expBtn}>{t("Copy to Clipboard")}</button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 10 Executive KPI Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginBottom: "20px" }}>
        <KpiCard icon={<DollarSign size={16} />} title={t("GMV Volume")} value={kpis.gmv > 0 ? fmt(kpis.gmv) : "N/A"} sub={kpis.gmv > 0 ? `${timeRange} ${t("period")}` : t("No invoice data")} color="var(--color-secondary)" />
        <KpiCard icon={<TrendingUp size={16} />} title={t("Pillar Share (91.5%)")} value={kpis.pillarShare > 0 ? fmt(kpis.pillarShare) : "N/A"} sub={t("Direct payouts")} color="var(--color-success)" />
        <KpiCard icon={<BarChart3 size={16} />} title={t("Coop Share (8.5%)")} value={kpis.coopShare > 0 ? fmt(kpis.coopShare) : "N/A"} sub={t("Reserve fund")} color="var(--color-primary)" />
        <KpiCard icon={<CheckCircle2 size={16} />} title={t("Completed Bookings")} value={kpis.completedBookings > 0 ? kpis.completedBookings.toLocaleString() : "0"} sub={kpis.totalBookings > 0 ? `${((kpis.completedBookings/kpis.totalBookings)*100).toFixed(1)}% ${t("fulfillment")}` : t("No bookings")} color="#8B5CF6" />
        <KpiCard icon={<XCircle size={16} />} title={t("Cancellation Rate")} value={cancelRate} sub={`${kpis.cancelledBookings} ${t("cancelled")}`} color="var(--color-error)" />
        <KpiCard icon={<Activity size={16} />} title={t("Workforce Utilization")} value={utilizationRate} sub={`${kpis.onlinePillars} ${t("online now")}`} color="#F59E0B" />
        <KpiCard icon={<Users size={16} />} title={t("Active Pillars")} value={kpis.activePillars} sub={`${kpis.totalPillars} ${t("total registered")}`} color="var(--color-success)" />
        <KpiCard icon={<Users size={16} />} title={t("Customers")} value={kpis.totalCustomers > 0 ? kpis.totalCustomers.toLocaleString() : "N/A"} sub={t("Total registered")} color="var(--color-primary)" />
        <KpiCard icon={<Star size={16} />} title={t("NPS / Rating")} value={kpis.avgRating > 0 ? `${kpis.avgRating} ★` : "N/A"} sub={kpis.totalReviews > 0 ? `${kpis.totalReviews} ${t("reviews")}` : t("No reviews")} color="#F59E0B" />
        <KpiCard icon={<Zap size={16} />} title={t("Pending Requests")} value={kpis.pendingRequests} sub={t("Awaiting assignment")} color="#D97706" />
      </div>

      {/* Charts Row */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
        {/* Bookings Trend */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: "700" }}>Booking Volume ({timeRange})</h3>
          {bookingsByDay.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>No booking data for this period</div>
          ) : (
            <svg viewBox={`0 0 ${bookingsByDay.length * 50} 200`} style={{ width: "100%", height: "200px" }}>
              {bookingsByDay.map((d, i) => {
                const barH = (d.count / maxBookings) * 160;
                return (
                  <g key={i}>
                    <rect x={i * 50 + 10} y={180 - barH} width={30} height={barH} fill="var(--color-primary)" rx={4} opacity={0.85} />
                    <text x={i * 50 + 25} y={195} textAnchor="middle" fontSize="8" fill="var(--color-text-muted)">{d.day}</text>
                    <text x={i * 50 + 25} y={175 - barH} textAnchor="middle" fontSize="9" fill="var(--color-text)" fontWeight="700">{d.count}</text>
                  </g>
                );
              })}
            </svg>
          )}
        </div>

        {/* Trade Distribution */}
        <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "20px" }}>
          <h3 style={{ margin: "0 0 16px", fontSize: "1rem", fontWeight: "700" }}>Service Trade Demand ({timeRange})</h3>
          {tradeDistribution.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>No service request data for this period</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {tradeDistribution.map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                  <span style={{ minWidth: "100px", fontSize: "0.8rem", fontWeight: "600", color: "var(--color-text)" }}>{t.trade}</span>
                  <div style={{ flex: 1, height: "20px", background: "var(--bg-color)", borderRadius: "10px", overflow: "hidden" }}>
                    <div style={{ width: `${(t.count / maxTrade) * 100}%`, height: "100%", background: `hsl(${i * 40}, 70%, 55%)`, borderRadius: "10px", transition: "width 0.5s" }} />
                  </div>
                  <span style={{ minWidth: "30px", fontSize: "0.8rem", fontWeight: "800", color: "var(--color-text)", textAlign: "right" }}>{t.count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Workforce Registry Table */}
      <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", borderRadius: "var(--radius-lg)", padding: "18px" }}>
        <h3 style={{ margin: "0 0 12px", fontSize: "1rem", fontWeight: "700" }}>
          Workforce Distribution by Trade
        </h3>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
              <th style={thSt}>Service Trade</th>
              <th style={thSt}>Total Pillars</th>
              <th style={thSt}>Verified Active</th>
              <th style={thSt}>Verification Rate</th>
            </tr>
          </thead>
          <tbody>
            {tableData.length === 0 ? (
              <tr><td colSpan={4} style={{ padding: "40px", textAlign: "center", color: "var(--color-text-muted)" }}>No workforce data available</td></tr>
            ) : (
              tableData.map((row, idx) => (
                <tr key={idx} style={{ borderBottom: "1px solid var(--color-border)" }}>
                  <td style={tdSt}><span style={{ fontWeight: "700", color: "var(--color-secondary)" }}>{row.trade}</span></td>
                  <td style={tdSt}>{row.pillars}</td>
                  <td style={tdSt}>{row.verified}</td>
                  <td style={tdSt}>
                    <span style={{ fontWeight: "700", color: "var(--color-success)" }}>
                      {row.pillars > 0 ? ((row.verified / row.pillars) * 100).toFixed(1) + "%" : "N/A"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function KpiCard({ icon, title, value, sub, color }) {
  return (
    <div style={{ background: "var(--color-surface)", border: "1px solid var(--color-border)", padding: "14px", borderRadius: "var(--radius-lg)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "4px", color }}>{icon}<span style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>{title}</span></div>
      <div style={{ fontSize: "1.3rem", fontWeight: "800", color: "var(--color-text)", margin: "2px 0" }}>{value}</div>
      <div style={{ fontSize: "0.68rem", color, fontWeight: "700" }}>{sub}</div>
    </div>
  );
}

const thSt = { padding: "10px 14px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "700", fontSize: "0.75rem", textTransform: "uppercase" };
const tdSt = { padding: "10px 14px", color: "var(--color-text)" };
const expBtn = { width: "100%", textAlign: "left", padding: "8px 10px", background: "transparent", border: "none", color: "var(--color-text)", fontSize: "0.85rem", fontWeight: "600", cursor: "pointer" };
