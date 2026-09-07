import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import { useTranslation } from "../../../i18n/useTranslation";
import { 
  Users, UserCheck, Clock, Activity, DollarSign, TrendingUp, 
  ArrowUpRight, CheckCircle2, ShieldCheck, MapPin, Wrench, Star,
  BarChart3, RefreshCw, Bot, Sparkles
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import gsap from "gsap";
import { gsap3dEngine } from "../../../services/animation/gsap3dEngine";
import TypewriterEffect from "../../../components/ui/TypewriterEffect";

export default function AdminOverview() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const isDemo = localStorage.getItem("coophub_demo_admin") === "true" || localStorage.getItem("coophub_demo_user") === "true";
  const [isAdminOnline, setIsAdminOnline] = useState(() => localStorage.getItem("coophub_admin_online") !== "false");
  const [stats, setStats] = useState({
    totalPillars: 0,
    activePillars: 0,
    pendingPillars: 0,
    activeRequests: 0,
    totalRevenue: 0,
    openTickets: 0,
    totalCustomers: 0
  });
  const [analytics, setAnalytics] = useState(() => {
    if (isDemo) {
      return {
        monthlyData: [
          { month: "Apr", bookings: 120, revenue: 48000 },
          { month: "May", bookings: 180, revenue: 72000 },
          { month: "Jun", bookings: 240, revenue: 96000 },
          { month: "Jul", bookings: 310, revenue: 135000 },
          { month: "Aug", bookings: 420, revenue: 184000 },
          { month: "Sep", bookings: 530, revenue: 238500 },
        ],
        categoryDistribution: [
          { name: "Electrician Services", count: 48, percentage: 38, color: "var(--color-primary)" },
          { name: "Plumbing & Motors", count: 35, percentage: 28, color: "var(--color-secondary)" },
          { name: "Appliance & AC Repair", count: 28, percentage: 22, color: "#10B981" },
          { name: "Deep Home Cleaning", count: 15, percentage: 12, color: "#8B5CF6" },
        ],
        recentTransactions: [
          { id: "TX-9081", customer: "Meenakshi S.", service: "Fan Wiring & Switchboard", pillar: "Raj Kumar (PIL-CHE-042)", amount: "₹450", status: "Completed", time: "10 mins ago" },
          { id: "TX-9080", customer: "Karthik R.", service: "Main Pipe Leak Repair", pillar: "Murugan V (PIL-019)", amount: "₹350", status: "Completed", time: "42 mins ago" },
          { id: "TX-9079", customer: "Deepak S.", service: "AC Deep Gas Top-up", pillar: "Praveen K (PIL-031)", amount: "₹1,200", status: "In Progress", time: "1h ago" },
          { id: "TX-9078", customer: "Lakshmi M.", service: "Kitchen Sink Drain Unclog", pillar: "Ramesh P (PIL-055)", amount: "₹300", status: "Completed", time: "2h ago" },
        ]
      };
    }
    return {
      monthlyData: [],
      categoryDistribution: [],
      recentTransactions: []
    };
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();

    // Supabase Realtime Live Subscription (Syncs dashboard stats with live transactions)
    const channel = adminService.subscribeToLiveRequests(() => {
      fetchStats();
    });

    const handleStatusSync = () => {
      setIsAdminOnline(localStorage.getItem("coophub_admin_online") !== "false");
    };
    window.addEventListener("coophub_admin_status_change", handleStatusSync);

    return () => {
      channel?.unsubscribe();
      window.removeEventListener("coophub_admin_status_change", handleStatusSync);
    };
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const data = await adminService.getDashboardStats();
    setStats(data);

    const analyticsData = await adminService.getOverviewAnalytics();
    if (analyticsData) {
      setAnalytics(analyticsData);
    }
    setLoading(false);

    // Smooth GSAP Stagger Entrance
    setTimeout(() => {
      gsap3dEngine.animate3DStaggerEntrance(".admin-kpi-card, .card, .admin-stat-card", {
        y: 12,
        stagger: 0.04,
        duration: 0.4,
      });

      gsap.fromTo(
        ".admin-bar-col",
        { scaleY: 0, transformOrigin: "bottom" },
        { scaleY: 1, duration: 0.4, stagger: 0.04, ease: "power2.out" }
      );

      gsap3dEngine.refresh();
    }, 50);
  };

  const { monthlyData, categoryDistribution, recentTransactions } = analytics;
  const maxRevenue = monthlyData.length > 0 ? Math.max(...monthlyData.map(d => d.revenue)) : 1000;

  return (
    <div className="fade-in">
      {/* Top Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-5)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ 
              background: "rgba(245, 124, 32, 0.15)", color: "var(--color-secondary)", 
              fontSize: "0.75rem", fontWeight: "800", padding: "2px 8px", borderRadius: "10px", textTransform: "uppercase" 
            }}>
              {t("Cooperative Central Console")}
            </span>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>• {t("Chennai Metro Hub")}</span>
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--color-text)", margin: 0 }}>
            {t("Executive Operations Dashboard")}
          </h1>
          <div style={{ minHeight: "20px", marginTop: "6px", fontSize: "14px", color: "var(--color-text-muted)" }}>
            <TypewriterEffect
              words={[{ word: t("Manage and monitor the COOP HUB platform.") }]}
              typingSpeed={50}
              deletingSpeed={30}
              pauseDuration={999999}
              loop={false}
              cursorColor="#FF7A00"
              cursorWidth={2}
              cursorHeight={85}
              font={{ fontSize: "inherit", fontWeight: "normal" }}
              textColor="var(--color-text-muted)"
            />
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          {/* Status Badge — reflects sidebar toggle (single source of truth) */}
          <div
            onClick={() => {
              const next = !isAdminOnline;
              setIsAdminOnline(next);
              localStorage.setItem("coophub_admin_online", next ? "true" : "false");
              window.dispatchEvent(new Event("coophub_admin_status_change"));
            }}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "7px",
              padding: "5px 12px",
              borderRadius: "20px",
              border: isAdminOnline ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(239, 68, 68, 0.4)",
              background: isAdminOnline ? "rgba(16, 185, 129, 0.1)" : "rgba(239, 68, 68, 0.1)",
              color: isAdminOnline ? "#10B981" : "#EF4444",
              fontSize: "12px",
              fontWeight: "700",
              cursor: "pointer",
              transition: "all 0.2s ease",
              userSelect: "none",
            }}
            title="Click to toggle Admin Online / Offline status"
          >
            <span className={`status-dot ${isAdminOnline ? "available" : "offline"}`} style={{ width: "8px", height: "8px" }}></span>
            {isAdminOnline ? t("Operations Online") : t("Operations Paused")}
          </div>

          <button
            onClick={fetchStats}
            className="btn btn-outline"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} /> {t("Refresh Telemetry")}
          </button>
        </div>
      </div>

      {/* AI Operations Command Banner */}
      <div
        style={{
          background: "linear-gradient(135deg, rgba(27, 42, 74, 0.95), rgba(15, 23, 42, 0.98))",
          border: "1px solid rgba(245, 124, 32, 0.35)",
          borderRadius: "var(--radius-lg)",
          padding: "16px 20px",
          marginBottom: "var(--space-5)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "16px",
          boxShadow: "0 4px 16px rgba(0, 0, 0, 0.2)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div
            style={{
              width: "48px",
              height: "48px",
              borderRadius: "50%",
              background: "rgba(245, 124, 32, 0.2)",
              border: "1.5px solid var(--color-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <Bot size={26} color="var(--color-secondary)" />
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h3 style={{ margin: 0, color: "#FFFFFF", fontSize: "1.05rem", fontWeight: "700" }}>
                {t("CoopBot AI Operations Assistant")}
              </h3>
              <span style={{ background: "rgba(16, 185, 129, 0.2)", color: "#10B981", fontSize: "10px", fontWeight: "700", padding: "2px 8px", borderRadius: "10px", border: "1px solid rgba(16, 185, 129, 0.4)" }}>
                {t("Active Live")}
              </span>
            </div>
            <p style={{ margin: "4px 0 0 0", color: "#94A3B8", fontSize: "12.5px" }}>
              {t("Query Chronos-2 demand forecasts, execute instant candidate allocation, and inspect cooperative telemetry via natural language.")}
            </p>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
          <button
            onClick={() => navigate("/admin/verification")}
            style={{
              background: "rgba(245, 124, 32, 0.15)",
              color: "var(--color-secondary)",
              border: "1px solid rgba(245, 124, 32, 0.4)",
              padding: "8px 18px",
              borderRadius: "20px",
              fontWeight: "700",
              fontSize: "12.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              transition: "transform 0.15s ease",
            }}
          >
            <ShieldCheck size={15} /> {t("Verification Workspace →")}
          </button>
          <button
            onClick={() => navigate("/admin/chatai")}
            style={{
              background: "var(--color-secondary)",
              color: "#FFFFFF",
              border: "none",
              padding: "8px 18px",
              borderRadius: "20px",
              fontWeight: "700",
              fontSize: "12.5px",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "6px",
              boxShadow: "0 2px 8px rgba(245, 124, 32, 0.35)",
              transition: "transform 0.15s ease",
            }}
          >
            <Bot size={15} /> {t("Launch Chat AI Workspace →")}
          </button>
        </div>
      </div>

      {/* KPI Cards — Single Source of Truth from Real Supabase Operations */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", 
        gap: "var(--space-4)", 
        marginBottom: "var(--space-5)" 
      }}>
        <MetricCard 
          icon={<DollarSign size={22} />} 
          title={t("Total GMV (Volume)")} 
          value={`₹${(stats.totalRevenue || 0).toLocaleString()}`} 
          sub={`₹${(stats.dailyGmv || 0).toLocaleString()} ${t("Today")} • ₹${(stats.platformCommission || 0).toLocaleString()} ${t("Platform Fee (8.5%)")}`}
          color="var(--color-primary)" 
          onClick={() => navigate("/admin/finance")}
        />
        <MetricCard 
          icon={<Users size={22} />} 
          title={t("Registered Pillars")} 
          value={stats.totalPillars || 0} 
          sub={`${stats.activePillars || 0} ${t("Active")} • ${stats.availablePillars || 0} ${t("Available Now")}`}
          color="var(--color-secondary)" 
          onClick={() => navigate("/admin/pillars")}
        />
        <MetricCard 
          icon={<Activity size={22} />} 
          title={t("Live Service Orders")} 
          value={stats.totalBookings || 0} 
          sub={`${stats.activeJobs || 0} ${t("Active In-Field")} • ${stats.pendingBookings || 0} ${t("Pending Dispatch")}`}
          color="#10B981" 
          onClick={() => navigate("/admin/requests")}
        />
        <MetricCard 
          icon={<UserCheck size={22} />} 
          title={t("Registered Customers")} 
          value={stats.totalCustomers || 0} 
          sub={t("Verified accounts directory →")}
          color="#8B5CF6" 
          onClick={() => navigate("/admin/customers")}
        />
        <MetricCard 
          icon={<Star size={22} />} 
          title={t("Customer Satisfaction")} 
          value={`${stats.customerSatisfaction || 4.9} ★`} 
          sub={`${stats.reviewCount || 0} ${t("Verified Reviews")} • ${stats.emergencyRequests || 0} ${t("Emergency")}`}
          color="#F59E0B" 
          onClick={() => navigate("/admin/feedback")}
        />
      </div>

      {/* Charts & Visual Analytics Section */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(360px, 1fr))", gap: "var(--space-5)", marginBottom: "var(--space-5)" }}>
        
        {/* Monthly Revenue & Growth Visual Bar Chart */}
        <div style={{ 
          background: "var(--color-surface)", 
          padding: "var(--space-5)", 
          borderRadius: "var(--radius-lg)", 
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
            <div>
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>{t("Revenue & Booking Velocity")}</h2>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>{t("Monthly cooperative transaction volume")}</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--color-success)", fontWeight: "700", fontSize: "0.85rem" }}>
              <TrendingUp size={16} /> +24% {t("MoM")}
            </div>
          </div>

          {/* CSS Bar Chart */}
          <div style={{ height: "200px", display: "flex", alignItems: "flex-end", gap: "16px", paddingTop: "20px" }}>
            {monthlyData.map((d) => {
              const heightPercent = (d.revenue / maxRevenue) * 100;
              return (
                <div key={d.month} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                  <span style={{ fontSize: "0.7rem", color: "var(--color-text-secondary)", fontWeight: "700", marginBottom: "6px" }}>
                    ₹{(d.revenue / 1000).toFixed(0)}k
                  </span>
                  <div 
                    className="admin-bar-col"
                    style={{
                      width: "100%",
                      maxWidth: "42px",
                      height: `${heightPercent}%`,
                      borderRadius: "6px 6px 2px 2px",
                      background: "linear-gradient(180deg, var(--color-secondary) 0%, var(--color-primary) 100%)",
                      boxShadow: "0 4px 12px rgba(245, 124, 32, 0.25)",
                      transition: "height 0.4s ease"
                    }} 
                  />
                  <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--color-text)", marginTop: "8px" }}>
                    {t(d.month)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Trade Category Breakdown Visualizer */}
        <div style={{ 
          background: "var(--color-surface)", 
          padding: "var(--space-5)", 
          borderRadius: "var(--radius-lg)", 
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ marginBottom: "var(--space-4)" }}>
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>{t("Category Service Share")}</h2>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>{t("Distribution of booked service trades")}</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {categoryDistribution.map((cat) => (
              <div key={cat.name}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                  <span style={{ color: "var(--color-text)" }}>{t(cat.name)}</span>
                  <span style={{ color: "var(--color-text-secondary)" }}>{cat.count} {t("Jobs")} ({cat.percentage}%)</span>
                </div>
                <div style={{ width: "100%", height: "8px", background: "var(--color-surface-hover)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${cat.percentage}%`, height: "100%", background: cat.color, borderRadius: "4px" }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "flex-end" }}>
            <Link to="/admin/services" className="btn btn-outline btn-sm" style={{ fontSize: "0.8rem" }}>
              {t("Configure Services Catalog →")}
            </Link>
          </div>
        </div>

      </div>

      {/* Live Transaction & Operations Feed */}
      <div style={{ 
        background: "var(--color-surface)", 
        borderRadius: "var(--radius-lg)", 
        padding: "var(--space-5)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <div>
            <h2 style={{ fontSize: "1.15rem", fontWeight: "700", margin: 0 }}>{t("Live Settlement & Dispatch Feed")}</h2>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>{t("Real-time completed orders and technician payouts")}</span>
          </div>
          <Link to="/admin/requests" className="btn btn-primary btn-sm">
            {t("View All Requests")}
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "10px 14px", textAlign: "left", color: "var(--color-text-secondary)" }}>{t("Ref ID")}</th>
                <th style={{ padding: "10px 14px", textAlign: "left", color: "var(--color-text-secondary)" }}>{t("Customer")}</th>
                <th style={{ padding: "10px 14px", textAlign: "left", color: "var(--color-text-secondary)" }}>{t("Service")}</th>
                <th style={{ padding: "10px 14px", textAlign: "left", color: "var(--color-text-secondary)" }}>{t("Assigned Pillar")}</th>
                <th style={{ padding: "10px 14px", textAlign: "left", color: "var(--color-text-secondary)" }}>{t("Amount")}</th>
                <th style={{ padding: "10px 14px", textAlign: "left", color: "var(--color-text-secondary)" }}>{t("Status")}</th>
                <th style={{ padding: "10px 14px", textAlign: "right", color: "var(--color-text-secondary)" }}>{t("Timestamp")}</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: "32px", textAlign: "center", color: "var(--color-text-secondary)" }}>
                    {t("No service transactions recorded yet in the live database. Live orders will populate automatically.")}
                  </td>
                </tr>
              ) : (
                recentTransactions.map((tx) => (
                  <tr key={tx.id} style={{ borderBottom: "1px solid var(--color-border)" }} className="hover-row">
                    <td style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-primary)" }}>{tx.id}</td>
                    <td style={{ padding: "10px 14px", fontWeight: "600" }}>{tx.customer}</td>
                    <td style={{ padding: "10px 14px" }}>{t(tx.service)}</td>
                    <td style={{ padding: "10px 14px", color: "var(--color-secondary)", fontWeight: "600" }}>{tx.pillar}</td>
                    <td style={{ padding: "10px 14px", fontWeight: "700" }}>{tx.amount}</td>
                    <td style={{ padding: "10px 14px" }}>
                      <span style={{
                        padding: "2px 8px",
                        borderRadius: "10px",
                        fontSize: "0.75rem",
                        fontWeight: "700",
                        background: (tx.status?.toLowerCase() === "completed" || tx.status === "Completed") ? "var(--color-success-light)" : "rgba(59,130,246,0.15)",
                        color: (tx.status?.toLowerCase() === "completed" || tx.status === "Completed") ? "var(--color-success)" : "#3B82F6"
                      }}>
                        {t(tx.status?.replace('_', ' ')?.replace(/\b\w/g, c => c.toUpperCase()))}
                      </span>
                    </td>
                    <td style={{ padding: "10px 14px", textAlign: "right", color: "var(--color-text-muted)", fontSize: "0.8rem" }}>{t(tx.time)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, title, value, sub, color, onClick }) {
  return (
    <div 
      className="admin-kpi-card"
      onClick={onClick}
      style={{ 
        background: "var(--color-surface)", 
        padding: "var(--space-4)", 
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        boxShadow: "var(--shadow-sm)",
        cursor: onClick ? "pointer" : "default",
        transition: "transform 0.2s ease, box-shadow 0.2s ease"
      }}
    >
      <div style={{ 
        width: "46px", 
        height: "46px", 
        borderRadius: "var(--radius-md)", 
        background: `${color}15`, 
        color: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>
          {title}
        </div>
        <div style={{ fontSize: "1.45rem", fontWeight: "800", color: "var(--color-text)", margin: "2px 0" }}>
          {value}
        </div>
        <div style={{ fontSize: "0.72rem", color: "var(--color-success)", fontWeight: "600" }}>
          {sub}
        </div>
      </div>
    </div>
  );
}
