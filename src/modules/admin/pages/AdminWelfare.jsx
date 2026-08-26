import React from "react";
import { Heart, Shield } from "lucide-react";

export default function AdminWelfare() {
  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-5)" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
            Welfare & Insurance
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Manage cooperative PF balances, insurance policies, and welfare programs for Pillars.
          </p>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "var(--space-4)" }}>
        {/* Cooperative PF */}
        <div style={{ background: "var(--color-surface)", padding: "var(--space-5)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "var(--space-4)" }}>
            <div style={{ background: "rgba(59, 130, 246, 0.15)", padding: "10px", borderRadius: "12px" }}>
              <Heart color="#3B82F6" size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Cooperative PF Fund</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>Total contributions across all pillars</p>
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--color-text)", marginBottom: "8px" }}>
            ₹ 14,50,000
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>Managed by Cooperative Board</p>
          <button className="btn btn-outline" style={{ marginTop: "var(--space-4)", width: "100%" }}>View PF Statements</button>
        </div>

        {/* Group Insurance */}
        <div style={{ background: "var(--color-surface)", padding: "var(--space-5)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "var(--space-4)" }}>
            <div style={{ background: "rgba(16, 185, 129, 0.15)", padding: "10px", borderRadius: "12px" }}>
              <Shield color="#10B981" size={24} />
            </div>
            <div>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "700" }}>Group Insurance Policy</h3>
              <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>Accident & Health cover</p>
            </div>
          </div>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--color-text)", marginBottom: "8px" }}>
            126 Active Policies
          </div>
          <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>Premium: ₹500/month per Pillar</p>
          <button className="btn btn-outline" style={{ marginTop: "var(--space-4)", width: "100%" }}>Manage Claims</button>
        </div>
      </div>
    </div>
  );
}
