import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import { Users, UserCheck, Clock, Activity } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminOverview() {
  const [stats, setStats] = useState({
    totalPillars: 0,
    activePillars: 0,
    pendingPillars: 0,
    activeRequests: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true);
      const data = await adminService.getDashboardStats();
      setStats(data);
      setLoading(false);
    };
    fetchStats();
  }, []);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "60vh" }}>
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <div className="fade-in">
      <div style={{ marginBottom: "var(--space-5)" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
          Cooperative Administration
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Welcome, Administrator. Here is your platform overview.
        </p>
      </div>

      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", 
        gap: "var(--space-4)", 
        marginBottom: "var(--space-6)" 
      }}>
        <StatCard icon={<Users size={24} />} title="Total Pillars" value={stats.totalPillars} color="var(--color-primary)" />
        <StatCard icon={<UserCheck size={24} />} title="Active Pillars" value={stats.activePillars} color="var(--color-success)" />
        <StatCard icon={<Clock size={24} />} title="Pending Review" value={stats.pendingPillars} color="var(--color-secondary)" />
        <StatCard icon={<Activity size={24} />} title="Active Requests" value={stats.activeRequests} color="#8B5CF6" />
      </div>

      <div style={{ 
        background: "var(--color-surface)", 
        borderRadius: "var(--radius-lg)", 
        padding: "var(--space-5)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <h2 style={{ fontSize: "1.2rem", fontWeight: "700", color: "var(--color-text)" }}>Pillar Management</h2>
          <Link to="/admin/pillars" className="btn btn-primary btn-sm">
            Manage Pillars
          </Link>
        </div>
        
        <p style={{ color: "var(--color-text-secondary)", marginBottom: "var(--space-4)" }}>
          Access the full directory to search, filter, and review cooperative members.
        </p>
        
        <div className="input-wrapper" style={{ maxWidth: "400px" }}>
          <input type="text" className="form-input" placeholder="Quick search Pillar ID..." disabled />
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, color }) {
  return (
    <div style={{ 
      background: "var(--color-surface)", 
      padding: "var(--space-4)", 
      borderRadius: "var(--radius-lg)",
      border: "1px solid var(--color-border)",
      display: "flex",
      alignItems: "center",
      gap: "var(--space-4)",
      boxShadow: "var(--shadow-sm)"
    }}>
      <div style={{ 
        width: "48px", 
        height: "48px", 
        borderRadius: "var(--radius-md)", 
        background: `${color}15`, 
        color: color,
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", fontWeight: "600", marginBottom: "4px" }}>
          {title}
        </div>
        <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)" }}>
          {value}
        </div>
      </div>
    </div>
  );
}
