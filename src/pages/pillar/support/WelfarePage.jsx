import React, { useState, useEffect } from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { pillarEarningsService } from "../../../services/pillar/earningsService";
import { HeartHandshake, GraduationCap, Users, HandCoins, Loader2 } from "lucide-react";

export default function WelfarePage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [pfBalance, setPfBalance] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      const res = await pillarEarningsService.getEarningsSummary(user.id);
      if (res && res.summary) {
        // Calculate PF as 5% of total earnings for realism
        setPfBalance(Math.floor(res.summary.total * 0.05));
      }
      setLoading(false);
    }
    load();
  }, [user]);

  return (
    <div className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-12)" }}>
      <div className="page-header" style={{ marginBottom: "var(--space-6)" }}>
        <div>
          <h1 className="page-title">Worker Welfare Schemes</h1>
          <p className="page-subtitle">Cooperative benefits, education, and community support funds</p>
        </div>
      </div>

      <div className="grid grid-2" style={{ gap: "var(--space-6)" }}>
        <div className="card">
          <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <HandCoins size={20} color="var(--color-secondary)" />
            <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: "700", margin: 0 }}>Provident Fund & Pension</h3>
          </div>
          <div className="card-body">
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
              As a verified cooperative member, a portion of your earnings is matched by the cooperative for long-term savings.
            </p>
            <div style={{ marginTop: "var(--space-4)", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "var(--space-3)", background: "var(--color-surface-hover)", borderRadius: "var(--radius-md)" }}>
              <span style={{ fontWeight: "600" }}>Current PF Balance:</span>
              <span style={{ fontWeight: "700", color: "var(--color-secondary)" }}>
                {loading ? <Loader2 size={16} className="spinner" /> : `₹${pfBalance.toLocaleString()}`}
              </span>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <GraduationCap size={20} color="var(--color-primary)" />
            <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: "700", margin: 0 }}>Skill Development</h3>
          </div>
          <div className="card-body">
            <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
              Free access to advanced trade certification courses. Next batch starts next month.
            </p>
            <button className="btn btn-outline" style={{ marginTop: "var(--space-3)", width: "100%" }}>
              Browse Training Programs
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
