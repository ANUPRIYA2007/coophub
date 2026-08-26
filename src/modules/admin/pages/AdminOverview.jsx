import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import { 
  Users, UserCheck, Clock, Activity, DollarSign, TrendingUp, 
  ArrowUpRight, CheckCircle2, ShieldCheck, MapPin, Wrench, Star,
  BarChart3, RefreshCw
} from "lucide-react";
import { Link } from "react-router-dom";
import gsap from "gsap";

export default function AdminOverview() {
  const isDemo = localStorage.getItem("coophub_demo_admin") === "true" || localStorage.getItem("coophub_demo_user") === "true";
  const [isAdminOnline, setIsAdminOnline] = useState(() => localStorage.getItem("coophub_admin_online") !== "false");
  const [stats, setStats] = useState({
    totalPillars: 0,
    activePillars: 0,
    pendingPillars: 0,
    activeRequests: 0,
    totalRevenue: 0,
    openTickets: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();

    // Supabase Realtime Live Subscription (Syncs dashboard stats with live transactions)
    const channel = adminService.subscribeToLiveRequests(() => {
      fetchStats();
    });

    return () => {
      channel?.unsubscribe();
    };
  }, []);

  const fetchStats = async () => {
    setLoading(true);
    const data = await adminService.getDashboardStats();
    setStats(data);
    setLoading(false);

    // GSAP Stagger Entrance
    setTimeout(() => {
      gsap.fromTo(
        ".admin-kpi-card",
        { opacity: 0, y: 22, scale: 0.96 },
        { opacity: 1, y: 0, scale: 1, duration: 0.45, stagger: 0.08, ease: "power2.out" }
      );
      gsap.fromTo(
        ".admin-bar-col",
        { scaleY: 0, transformOrigin: "bottom" },
        { scaleY: 1, duration: 0.65, stagger: 0.08, ease: "back.out(1.4)" }
      );
    }, 50);
  };

  const monthlyData = [
    { month: "Apr", bookings: 120, revenue: 48000 },
    { month: "May", bookings: 180, revenue: 72000 },
    { month: "Jun", bookings: 240, revenue: 96000 },
    { month: "Jul", bookings: 310, revenue: 135000 },
    { month: "Aug", bookings: 420, revenue: 184000 },
    { month: "Sep", bookings: 530, revenue: 238500 },
  ];

  const maxRevenue = Math.max(...monthlyData.map(d => d.revenue));

  const categoryDistribution = [
    { name: "Electrician Services", count: 48, percentage: 38, color: "var(--color-primary)" },
    { name: "Plumbing & Motors", count: 35, percentage: 28, color: "var(--color-secondary)" },
    { name: "Appliance & AC Repair", count: 28, percentage: 22, color: "#10B981" },
    { name: "Deep Home Cleaning", count: 15, percentage: 12, color: "#8B5CF6" },
  ];

  const recentTransactions = [
    { id: "TX-9081", customer: "Meenakshi S.", service: "Fan Wiring & Switchboard", pillar: "Senthil Kumar (PIL-042)", amount: "₹450", status: "Completed", time: "10 mins ago" },
    { id: "TX-9080", customer: "Karthik R.", service: "Main Pipe Leak Repair", pillar: "Murugan V (PIL-019)", amount: "₹350", status: "Completed", time: "42 mins ago" },
    { id: "TX-9079", customer: "Deepak S.", service: "AC Deep Gas Top-up", pillar: "Praveen K (PIL-031)", amount: "₹1,200", status: "In Progress", time: "1h ago" },
    { id: "TX-9078", customer: "Lakshmi M.", service: "Kitchen Sink Drain Unclog", pillar: "Ramesh P (PIL-055)", amount: "₹300", status: "Completed", time: "2h ago" },
  ];

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
              Cooperative Central Console
            </span>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>• Chennai Metro Hub</span>
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--color-text)", margin: 0 }}>
            Executive Operations Dashboard
          </h1>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={() => {
              const next = !isAdminOnline;
              setIsAdminOnline(next);
              localStorage.setItem("coophub_admin_online", next ? "true" : "false");
            }}
            className="btn btn-outline"
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              borderColor: isAdminOnline ? "var(--color-success)" : "#EF4444",
              color: isAdminOnline ? "var(--color-success)" : "#EF4444",
              background: isAdminOnline ? "rgba(16, 185, 129, 0.08)" : "rgba(239, 68, 68, 0.08)"
            }}
          >
            <span className={`status-dot ${isAdminOnline ? "available" : "offline"}`} style={{ width: "8px", height: "8px" }}></span>
            {isAdminOnline ? "Operations Online" : "Operations Paused"}
          </button>

          <button 
            onClick={fetchStats}
            className="btn btn-outline"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh Telemetry
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", 
        gap: "var(--space-4)", 
        marginBottom: "var(--space-5)" 
      }}>
        <MetricCard 
          icon={<DollarSign size={22} />} 
          title="Monthly GMV (Revenue)" 
          value={stats.totalRevenue > 0 ? `₹${stats.totalRevenue.toLocaleString()}` : (isDemo ? "₹2,38,500" : "₹0")} 
          sub="+18.4% vs last month"
          color="var(--color-primary)" 
        />
        <MetricCard 
          icon={<Users size={22} />} 
          title="Total Registered Pillars" 
          value={stats.totalPillars > 0 ? stats.totalPillars : (isDemo ? "126" : "0")} 
          sub={`${stats.activePillars > 0 ? stats.activePillars : (isDemo ? "84" : "0")} Active On Duty`}
          color="var(--color-secondary)" 
        />
        <MetricCard 
          icon={<Activity size={22} />} 
          title="Active Service Bookings" 
          value={stats.activeRequests > 0 ? stats.activeRequests : (isDemo ? "18" : "0")} 
          sub="94.8% Dispatch SLA"
          color="#10B981" 
        />
        <MetricCard 
          icon={<Star size={22} />} 
          title="Customer Satisfaction" 
          value="4.92 ★" 
          sub="1,248 Verified Reviews"
          color="#F59E0B" 
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
              <h2 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>Revenue & Booking Velocity</h2>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>Monthly cooperative transaction volume</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "var(--color-success)", fontWeight: "700", fontSize: "0.85rem" }}>
              <TrendingUp size={16} /> +24% MoM
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
                    {d.month}
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
            <h2 style={{ fontSize: "1.1rem", fontWeight: "700", margin: 0 }}>Category Service Share</h2>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>Distribution of booked service trades</span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            {categoryDistribution.map((cat) => (
              <div key={cat.name}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: "600", marginBottom: "4px" }}>
                  <span style={{ color: "var(--color-text)" }}>{cat.name}</span>
                  <span style={{ color: "var(--color-text-secondary)" }}>{cat.count} Jobs ({cat.percentage}%)</span>
                </div>
                <div style={{ width: "100%", height: "8px", background: "var(--color-surface-hover)", borderRadius: "4px", overflow: "hidden" }}>
                  <div style={{ width: `${cat.percentage}%`, height: "100%", background: cat.color, borderRadius: "4px" }} />
                </div>
              </div>
            ))}
          </div>

          <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "flex-end" }}>
            <Link to="/admin/services" className="btn btn-outline btn-sm" style={{ fontSize: "0.8rem" }}>
              Configure Services Catalog →
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
            <h2 style={{ fontSize: "1.15rem", fontWeight: "700", margin: 0 }}>Live Settlement & Dispatch Feed</h2>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>Real-time completed orders and technician payouts</span>
          </div>
          <Link to="/admin/requests" className="btn btn-primary btn-sm">
            View All Requests
          </Link>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "10px 14px", textAlign: "left", color: "var(--color-text-secondary)" }}>Ref ID</th>
                <th style={{ padding: "10px 14px", textAlign: "left", color: "var(--color-text-secondary)" }}>Customer</th>
                <th style={{ padding: "10px 14px", textAlign: "left", color: "var(--color-text-secondary)" }}>Service</th>
                <th style={{ padding: "10px 14px", textAlign: "left", color: "var(--color-text-secondary)" }}>Assigned Pillar</th>
                <th style={{ padding: "10px 14px", textAlign: "left", color: "var(--color-text-secondary)" }}>Amount</th>
                <th style={{ padding: "10px 14px", textAlign: "left", color: "var(--color-text-secondary)" }}>Status</th>
                <th style={{ padding: "10px 14px", textAlign: "right", color: "var(--color-text-secondary)" }}>Timestamp</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((tx) => (
                <tr key={tx.id} style={{ borderBottom: "1px solid var(--color-border)" }} className="hover-row">
                  <td style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-primary)" }}>{tx.id}</td>
                  <td style={{ padding: "10px 14px", fontWeight: "600" }}>{tx.customer}</td>
                  <td style={{ padding: "10px 14px" }}>{tx.service}</td>
                  <td style={{ padding: "10px 14px", color: "var(--color-secondary)", fontWeight: "600" }}>{tx.pillar}</td>
                  <td style={{ padding: "10px 14px", fontWeight: "700" }}>{tx.amount}</td>
                  <td style={{ padding: "10px 14px" }}>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: "10px",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      background: tx.status === "Completed" ? "var(--color-success-light)" : "rgba(59,130,246,0.15)",
                      color: tx.status === "Completed" ? "var(--color-success)" : "#3B82F6"
                    }}>
                      {tx.status}
                    </span>
                  </td>
                  <td style={{ padding: "10px 14px", textAlign: "right", color: "var(--color-text-muted)", fontSize: "0.8rem" }}>{tx.time}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ icon, title, value, sub, color }) {
  return (
    <div 
      className="admin-kpi-card"
      style={{ 
        background: "var(--color-surface)", 
        padding: "var(--space-4)", 
        borderRadius: "var(--radius-lg)",
        border: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        gap: "var(--space-4)",
        boxShadow: "var(--shadow-sm)"
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
