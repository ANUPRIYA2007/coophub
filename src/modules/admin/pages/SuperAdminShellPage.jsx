import React from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import { Sparkles, ShieldCheck, ChevronRight } from "lucide-react";

export default function SuperAdminShellPage({ title, description }) {
  const { isDark } = useTheme();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <div className="fade-in" style={{ paddingBottom: "30px" }}>
      {/* Header Banner */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "11px", fontWeight: "800", color: "#FF7900", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "4px" }}>
            <span>🇮🇳 SUPER ADMIN APEX</span>
            <ChevronRight size={12} />
            <span>{title}</span>
          </div>
          <h1 style={{ fontSize: "1.75rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A", margin: 0 }}>
            {title}
          </h1>
          <p style={{ margin: "4px 0 0", color: isDark ? "#94A3B8" : "#64748B", fontSize: "0.88rem" }}>
            {description || `National apex management for ${title}`}
          </p>
        </div>

        <button
          onClick={() => navigate("/admin/super-admin")}
          style={{
            background: isDark ? "rgba(255,121,0,0.12)" : "rgba(255,121,0,0.08)",
            color: "#FF7900",
            border: "1px solid rgba(255,121,0,0.3)",
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
          ← Return to Command Center
        </button>
      </div>

      {/* Module Workspace Shell Container */}
      <div
        style={{
          background: isDark ? "#0A1220" : "#FFFFFF",
          border: isDark ? "1px solid rgba(255, 255, 255, 0.08)" : "1px solid #E2E8F0",
          borderRadius: "16px",
          padding: "32px",
          textAlign: "center"
        }}
      >
        <div
          style={{
            width: "56px",
            height: "56px",
            borderRadius: "16px",
            background: "rgba(255, 121, 0, 0.12)",
            border: "1px solid rgba(255, 121, 0, 0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            margin: "0 auto 16px",
            color: "#FF7900"
          }}
        >
          <ShieldCheck size={28} />
        </div>
        <h2 style={{ fontSize: "1.25rem", fontWeight: "800", color: isDark ? "#FFFFFF" : "#0F172A", margin: "0 0 8px" }}>
          {title} Workspace Shell Active
        </h2>
        <p style={{ color: isDark ? "#94A3B8" : "#64748B", fontSize: "0.9rem", maxWidth: "540px", margin: "0 auto 20px", lineHeight: "1.5" }}>
          This apex module shell is rendered in the responsive desktop-first Super Admin layout with route-aware CoopBot AI moment tracking enabled.
        </p>

        <div style={{ display: "inline-flex", alignItems: "center", gap: "8px", background: isDark ? "rgba(255,255,255,0.03)" : "#F8FAFC", border: isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid #E2E8F0", padding: "8px 16px", borderRadius: "20px", fontSize: "12px", color: isDark ? "#CBD5E1" : "#475569" }}>
          <Sparkles size={14} color="#FF7900" />
          <span>Active Route: <code style={{ color: "#FF7900", fontWeight: "700" }}>{location.pathname}</code></span>
        </div>
      </div>
    </div>
  );
}
