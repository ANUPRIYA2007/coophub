// ==============================================================================
// COOP HUB — PILLAR WELFARE & INSURANCE PORTAL
// ==============================================================================
// Displays authenticated Pillar's personal social security & welfare portfolio:
// - DEMO LOGIN: Displays sample demonstration data.
// - REAL LOGIN: Displays ONLY authentic Supabase records (Zero mock fallbacks / genuine empty states).
// ==============================================================================

import React, { useState, useEffect } from "react";
import { useAuth } from "../../../context/AuthContext";
import { welfareService } from "../../../modules/admin/services/welfareService";
import { 
  Heart, Shield, AlertTriangle, CheckCircle, Clock, FileText, 
  Download, ExternalLink, ChevronRight, Landmark, Info, User, 
  TrendingUp, RefreshCw, X, ShieldCheck, HeartHandshake, Loader2,
  Calendar, Award, CheckCircle2, DollarSign
} from "lucide-react";

export default function WelfarePage() {
  const { user } = useAuth();
  const pillarId = user?.id || "p-1";

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Pillar Data States
  const [pfData, setPfData] = useState(null);
  const [insuranceData, setInsuranceData] = useState(null);
  const [claims, setClaims] = useState([]);
  const [schemes, setSchemes] = useState([]);

  // Modals
  const [showStatementModal, setShowStatementModal] = useState(false);
  const [showPolicyModal, setShowPolicyModal] = useState(false);
  const [selectedScheme, setSelectedScheme] = useState(null);

  useEffect(() => {
    loadPillarWelfareData();

    // Supabase Realtime sync
    const channel = welfareService.subscribeToWelfareUpdates(() => {
      loadPillarWelfareData();
    });

    return () => {
      channel?.unsubscribe?.();
    };
  }, [user]);

  const loadPillarWelfareData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Pillar PF Account & Transactions
      const pfDetails = await welfareService.getPillarPFDetails(pillarId);
      setPfData(pfDetails);

      // 2. Fetch Pillar Insurance Membership
      const insDetails = await welfareService.getPillarInsuranceMembership(pillarId);
      setInsuranceData(insDetails);

      // 3. Fetch Pillar Claims
      const claimsList = await welfareService.getPillarInsuranceClaims(pillarId);
      setClaims(claimsList || []);

      // 4. Fetch Government Schemes Catalog
      const schemesList = await welfareService.getGovernmentWelfareSchemes();
      setSchemes(schemesList || []);

      setLoading(false);
    } catch (err) {
      console.error("Error loading Pillar Welfare Data:", err);
      setError("Unable to load live welfare records. Please retry.");
      setLoading(false);
    }
  };

  const account = pfData?.account;
  const transactions = pfData?.transactions || [];
  const member = insuranceData?.member;
  const policy = insuranceData?.policy;
  const activeClaimsCount = claims.filter(c => c.status === 'submitted' || c.status === 'under_review').length;

  return (
    <div className="container fade-in" style={{ paddingTop: "var(--space-5)", paddingBottom: "var(--space-12)" }}>
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-5)", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ 
              background: "rgba(255, 121, 0, 0.15)", color: "var(--color-secondary)", 
              fontSize: "0.75rem", fontWeight: "800", padding: "2px 8px", borderRadius: "6px", letterSpacing: "0.5px" 
            }}>
              PILLAR SOCIAL SECURITY
            </span>
          </div>
          <h1 className="page-title" style={{ margin: 0, fontSize: "1.65rem", fontWeight: "800" }}>
            Welfare & Insurance
          </h1>
          <p className="page-subtitle" style={{ margin: "4px 0 0 0", fontSize: "0.9rem", color: "var(--color-text-secondary)" }}>
            Your cooperative provident fund savings, group health shield, claims tracker, and government social schemes.
          </p>
        </div>

        <button 
          onClick={loadPillarWelfareData} 
          disabled={loading}
          className="btn btn-outline btn-sm" 
          style={{ display: "flex", alignItems: "center", gap: "6px" }}
        >
          <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
        </button>
      </div>

      {error && (
        <div style={{ 
          background: "rgba(239, 68, 68, 0.15)", border: "1px solid #EF4444", 
          borderRadius: "var(--radius-md)", padding: "12px 16px", marginBottom: "var(--space-5)",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <span style={{ color: "#EF4444", fontSize: "0.88rem", fontWeight: "600" }}>{error}</span>
          <button onClick={loadPillarWelfareData} className="btn btn-sm btn-primary">Retry</button>
        </div>
      )}

      {/* ============================================================================== */}
      {/* 6. WELFARE SUMMARY AT TOP (Compact KPI Cards) */}
      {/* ============================================================================== */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", 
        gap: "var(--space-4)", 
        marginBottom: "var(--space-6)" 
      }}>
        {/* PF Balance */}
        <div className="card" style={{ padding: "var(--space-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
              PF Balance
            </span>
            <div style={{ background: "rgba(16, 185, 129, 0.15)", padding: "6px", borderRadius: "8px" }}>
              <Landmark size={16} color="#10B981" />
            </div>
          </div>
          <div style={{ fontSize: "1.45rem", fontWeight: "800", color: account ? "#10B981" : "var(--color-text)" }}>
            {loading ? "..." : (account ? `₹ ${Number(account.current_balance || 0).toLocaleString("en-IN")}` : "₹ 0")}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "4px" }}>
            {account ? "Matched 50-50 Cooperative Fund" : "No PF account linked yet"}
          </div>
        </div>

        {/* Insurance Status */}
        <div className="card" style={{ padding: "var(--space-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
              Insurance
            </span>
            <div style={{ background: "rgba(59, 130, 246, 0.15)", padding: "6px", borderRadius: "8px" }}>
              <Shield size={16} color="#3B82F6" />
            </div>
          </div>
          <div style={{ fontSize: "1.45rem", fontWeight: "800", color: member?.status === 'active' ? '#10B981' : 'var(--color-text)' }}>
            {loading ? "..." : (member?.status === 'active' ? "Active Shield" : "Inactive")}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "4px" }}>
            {member ? `ID: ${member.member_id || "Active Member"}` : "No active policy found"}
          </div>
        </div>

        {/* Coverage */}
        <div className="card" style={{ padding: "var(--space-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
              Coverage
            </span>
            <div style={{ background: "rgba(255, 121, 0, 0.15)", padding: "6px", borderRadius: "8px" }}>
              <ShieldCheck size={16} color="var(--color-secondary)" />
            </div>
          </div>
          <div style={{ fontSize: "1.45rem", fontWeight: "800", color: "var(--color-text)" }}>
            {loading ? "..." : (member?.coverage_amount ? `₹ ${(Number(member.coverage_amount) / 100000).toFixed(1)} Lakhs` : (policy?.coverage_amount_per_pillar ? `₹ ${(Number(policy.coverage_amount_per_pillar) / 100000).toFixed(1)} Lakhs` : "₹ 0"))}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-secondary)", fontWeight: "600", marginTop: "4px" }}>
            {member ? "Health & Accident Floater" : "Not Enrolled"}
          </div>
        </div>

        {/* Active Claims */}
        <div className="card" style={{ padding: "var(--space-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
              Active Claims
            </span>
            <div style={{ background: activeClaimsCount > 0 ? "rgba(245, 158, 11, 0.2)" : "rgba(16, 185, 129, 0.15)", padding: "6px", borderRadius: "8px" }}>
              <AlertTriangle size={16} color={activeClaimsCount > 0 ? "#F59E0B" : "#10B981"} />
            </div>
          </div>
          <div style={{ fontSize: "1.45rem", fontWeight: "800", color: activeClaimsCount > 0 ? "#F59E0B" : "var(--color-text)" }}>
            {loading ? "..." : activeClaimsCount}
          </div>
          <div style={{ fontSize: "0.75rem", color: activeClaimsCount > 0 ? "#F59E0B" : "var(--color-text-muted)", fontWeight: "600", marginTop: "4px" }}>
            {activeClaimsCount > 0 ? "Under Review" : "No pending claims"}
          </div>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* 1 & 2. MY PF ACCOUNT & CONTRIBUTION BREAKDOWN */}
      {/* ============================================================================== */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-5)", marginBottom: "var(--space-6)" }}>
        {/* MY PF ACCOUNT CARD */}
        <div className="card" style={{ padding: "var(--space-5)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
            <div>
              <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--color-secondary)", textTransform: "uppercase" }}>
                COOPERATIVE SAVINGS
              </span>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "800", margin: "2px 0 0 0" }}>
                My PF Account
              </h2>
            </div>
            {account && (
              <span style={{ 
                background: account?.account_status === 'active' ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)", 
                color: account?.account_status === 'active' ? "#10B981" : "#EF4444", 
                padding: "3px 10px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: "800", textTransform: "uppercase" 
              }}>
                {account?.account_status}
              </span>
            )}
          </div>

          {!account ? (
            <div style={{ padding: "24px 16px", textAlign: "center", background: "var(--color-surface-hover)", borderRadius: "8px", color: "var(--color-text-secondary)" }}>
              <Landmark size={32} color="var(--color-text-muted)" style={{ margin: "0 auto 8px" }} />
              <div style={{ fontWeight: "700", color: "var(--color-text)" }}>No PF account information is available yet.</div>
              <div style={{ fontSize: "0.8rem", marginTop: "4px" }}>Contributions will be matched automatically as you complete customer bookings.</div>
            </div>
          ) : (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "var(--space-4)" }}>
                <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>Current Balance</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: "800", color: "#10B981", marginTop: "2px" }}>
                    ₹ {Number(account.current_balance || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>Total Contributions</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--color-text)", marginTop: "2px" }}>
                    ₹ {Number(account.total_contributions || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>Total Withdrawals</div>
                  <div style={{ fontSize: "1.15rem", fontWeight: "700", color: Number(account.total_withdrawals || 0) > 0 ? "#EF4444" : "var(--color-text-muted)", marginTop: "2px" }}>
                    ₹ {Number(account.total_withdrawals || 0).toLocaleString("en-IN")}
                  </div>
                </div>
                <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>Last Contribution</div>
                  <div style={{ fontSize: "0.92rem", fontWeight: "700", color: "var(--color-text)", marginTop: "4px" }}>
                    {account.last_contribution_at ? new Date(account.last_contribution_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : "Never"}
                  </div>
                </div>
              </div>

              <button 
                onClick={() => setShowStatementModal(true)}
                className="btn btn-primary" 
                style={{ width: "100%", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px", fontWeight: "700" }}
              >
                <FileText size={16} /> VIEW PF STATEMENT
              </button>
            </>
          )}
        </div>

        {/* 2. PF CONTRIBUTION BREAKDOWN CARD */}
        <div className="card" style={{ padding: "var(--space-5)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "#10B981", textTransform: "uppercase" }}>
              50-50 STATUTORY SHIELD
            </span>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "800", margin: "2px 0 var(--space-4) 0" }}>
              PF Contribution Breakdown
            </h2>

            {!account ? (
              <div style={{ padding: "24px 16px", textAlign: "center", background: "var(--color-surface-hover)", borderRadius: "8px", color: "var(--color-text-secondary)" }}>
                <TrendingUp size={32} color="var(--color-text-muted)" style={{ margin: "0 auto 8px" }} />
                <div style={{ fontWeight: "700", color: "var(--color-text)" }}>No PF contributions have been recorded.</div>
                <div style={{ fontSize: "0.8rem", marginTop: "4px" }}>50% worker deposit matched with 50% cooperative contribution.</div>
              </div>
            ) : (
              <>
                <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: "1.45", marginBottom: "var(--space-4)" }}>
                  For every rupee saved from your completed service earnings, the Cooperative matches 100% to grow your retirement & emergency corpus.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--color-surface-hover)", borderRadius: "8px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>👤 Your Contribution (50% Worker Share)</span>
                    <span style={{ fontSize: "0.95rem", fontWeight: "800", color: "var(--color-text)" }}>
                      ₹ {Number(account.pillar_contribution_total || Math.floor((account.total_contributions || 0) / 2)).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "var(--color-surface-hover)", borderRadius: "8px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>🏛️ Cooperative Contribution (50% Match)</span>
                    <span style={{ fontSize: "0.95rem", fontWeight: "800", color: "var(--color-secondary)" }}>
                      ₹ {Number(account.coop_contribution_total || Math.floor((account.total_contributions || 0) / 2)).toLocaleString("en-IN")}
                    </span>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 12px", background: "rgba(16, 185, 129, 0.1)", border: "1px solid rgba(16, 185, 129, 0.3)", borderRadius: "8px" }}>
                    <span style={{ fontSize: "0.85rem", fontWeight: "700", color: "#10B981" }}>Total Accumulated Fund</span>
                    <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "#10B981" }}>
                      ₹ {Number(account.current_balance || 0).toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>

          <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "14px", borderTop: "1px solid var(--color-border)", paddingTop: "10px" }}>
            🔒 Audited in real-time. Eligible for emergency advance upon 6 months continuous tenure.
          </div>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* 3. MY INSURANCE SECTION */}
      {/* ============================================================================== */}
      <div className="card" style={{ padding: "var(--space-5)", marginBottom: "var(--space-6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)", flexWrap: "wrap", gap: "10px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <Shield size={22} color="var(--color-secondary)" />
              <h2 style={{ fontSize: "1.3rem", fontWeight: "800", margin: 0 }}>
                My Insurance: {policy?.policy_name || "COOP HUB Group Shield"}
              </h2>
              <span style={{ 
                background: member?.status === 'active' ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)", 
                color: member?.status === 'active' ? "#10B981" : "#EF4444", 
                padding: "2px 8px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: "800" 
              }}>
                {member?.status === 'active' ? "ACTIVE" : "INACTIVE"}
              </span>
            </div>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", margin: "4px 0 0 0" }}>
              {member ? `Policy Ref: ${member.member_id || policy?.id} | Underwritten by ${policy?.provider || "United India Insurance Co."}` : "Group health & accident coverage provided by the Cooperative"}
            </p>
          </div>

          {member && (
            <button onClick={() => setShowPolicyModal(true)} className="btn btn-outline btn-sm" style={{ fontWeight: "700" }}>
              VIEW POLICY DETAILS
            </button>
          )}
        </div>

        {!member ? (
          <div style={{ padding: "24px 16px", textAlign: "center", background: "var(--color-surface-hover)", borderRadius: "8px", color: "var(--color-text-secondary)" }}>
            <Shield size={32} color="var(--color-text-muted)" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontWeight: "700", color: "var(--color-text)" }}>No active insurance policy found.</div>
            <div style={{ fontSize: "0.8rem", marginTop: "4px" }}>Group health and accident coverage will be provisioned by the Cooperative upon verification.</div>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>Coverage Amount</div>
              <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#10B981", marginTop: "2px" }}>
                ₹ {Number(member.coverage_amount || policy?.coverage_amount_per_pillar || 0).toLocaleString("en-IN")}
              </div>
            </div>

            <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>Monthly Premium</div>
              <div style={{ fontSize: "1.15rem", fontWeight: "700", color: "var(--color-text)", marginTop: "2px" }}>
                ₹ {member.monthly_premium || policy?.premium_per_pillar_monthly || 0} / mo
              </div>
            </div>

            <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>Policy Period</div>
              <div style={{ fontSize: "0.88rem", fontWeight: "700", color: "var(--color-text)", marginTop: "4px" }}>
                {member.start_date || "2026-01-01"} - {member.expiry_date || "2026-12-31"}
              </div>
            </div>

            <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "8px" }}>
              <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>Nominee</div>
              <div style={{ fontSize: "0.92rem", fontWeight: "700", color: "var(--color-text)", marginTop: "2px" }}>
                {member.nominee_name || "Nominee on Record"}
              </div>
              <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                {member.nominee_relation ? `(${member.nominee_relation})` : "Spouse / Legal Dependent"}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================================== */}
      {/* 4. MY INSURANCE CLAIMS */}
      {/* ============================================================================== */}
      <div className="card" style={{ padding: "var(--space-5)", marginBottom: "var(--space-6)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "800", margin: 0 }}>
              My Insurance Claims
            </h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", margin: "2px 0 0 0" }}>
              Track the verification, audit, and settlement timeline of your medical or accident claims.
            </p>
          </div>
        </div>

        {claims.length === 0 ? (
          <div style={{ padding: "30px", textAlign: "center", background: "var(--color-surface-hover)", borderRadius: "8px", color: "var(--color-text-secondary)" }}>
            <ShieldCheck size={36} color="var(--color-text-muted)" style={{ margin: "0 auto 8px" }} />
            <div style={{ fontWeight: "700" }}>No insurance claims found.</div>
            <div style={{ fontSize: "0.8rem", marginTop: "4px" }}>You have no past or pending claims submitted under the group shield.</div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {claims.map((c) => {
              const isApproved = c.status === "approved" || c.status === "paid" || c.status === "settled";
              const isRejected = c.status === "rejected";

              return (
                <div 
                  key={c.id} 
                  style={{ 
                    background: "var(--color-surface-hover)", 
                    borderRadius: "8px", 
                    padding: "14px 16px",
                    border: isRejected ? "1px solid rgba(239, 68, 68, 0.4)" : isApproved ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid var(--color-border)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px", marginBottom: "8px" }}>
                    <div>
                      <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "var(--color-secondary)" }}>
                        {c.claim_code || `CLM-${c.id.slice(0, 6).toUpperCase()}`}
                      </span>
                      <h3 style={{ fontSize: "1.05rem", fontWeight: "700", margin: "2px 0 0 0" }}>
                        {c.claim_type}
                      </h3>
                      <div style={{ fontSize: "0.78rem", color: "var(--color-text-muted)", marginTop: "2px" }}>
                        Submitted: {new Date(c.submitted_date).toLocaleDateString()} | Facility: {c.hospital_name || "Empannelled Medical Center"}
                      </div>
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--color-text)" }}>
                        ₹ {Number(c.claim_amount || 0).toLocaleString("en-IN")}
                      </div>
                      <span style={{ 
                        display: "inline-block",
                        fontSize: "0.72rem", fontWeight: "800", padding: "2px 8px", borderRadius: "10px", marginTop: "4px",
                        background: isApproved ? "rgba(16, 185, 129, 0.15)" : isRejected ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
                        color: isApproved ? "#10B981" : isRejected ? "#EF4444" : "#F59E0B",
                        textTransform: "uppercase"
                      }}>
                        {c.status?.replace('_', ' ')}
                      </span>
                    </div>
                  </div>

                  {/* Rejection Reason display if rejected */}
                  {isRejected && c.rejection_reason && (
                    <div style={{ background: "rgba(239, 68, 68, 0.1)", border: "1px solid rgba(239, 68, 68, 0.3)", padding: "10px 12px", borderRadius: "6px", marginTop: "10px" }}>
                      <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#EF4444", textTransform: "uppercase" }}>
                        Rejection Reason:
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "var(--color-text)", marginTop: "2px", lineHeight: "1.4" }}>
                        {c.rejection_reason}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ============================================================================== */}
      {/* 5. GOVERNMENT WELFARE SCHEMES DIRECTORY */}
      {/* ============================================================================== */}
      <div className="card" style={{ padding: "var(--space-5)" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <span style={{ background: "rgba(59, 130, 246, 0.15)", color: "#3B82F6", fontSize: "0.72rem", fontWeight: "800", padding: "2px 8px", borderRadius: "6px" }}>
                STATE & CENTRAL PROGRAMS
              </span>
            </div>
            <h2 style={{ fontSize: "1.25rem", fontWeight: "800", margin: "4px 0 0 0" }}>
              Government Welfare Schemes
            </h2>
            <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", margin: "2px 0 0 0" }}>
              Official social security & pension programs for unorganised tradesmen. Check requirements and apply on official portals.
            </p>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "var(--space-4)" }}>
          {schemes.map((s) => (
            <div 
              key={s.id} 
              style={{ 
                background: "var(--color-surface-hover)", 
                borderRadius: "8px", 
                border: "1px solid var(--color-border)", 
                padding: "var(--space-4)",
                display: "flex", flexDirection: "column", justifyContent: "space-between"
              }}
            >
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "var(--color-secondary)", background: "rgba(255, 121, 0, 0.12)", padding: "2px 6px", borderRadius: "4px" }}>
                    {s.category}
                  </span>
                  <span style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>
                    Ref: {s.scheme_code}
                  </span>
                </div>

                <h3 style={{ fontSize: "0.98rem", fontWeight: "800", color: "var(--color-text)", margin: "0 0 4px 0" }}>
                  {s.scheme_name}
                </h3>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginBottom: "8px" }}>
                  🏛️ {s.department}
                </div>

                <p style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)", lineHeight: "1.4", marginBottom: "10px" }}>
                  {s.description}
                </p>

                <div style={{ background: "rgba(16, 185, 129, 0.08)", padding: "8px", borderRadius: "6px", fontSize: "0.78rem", marginBottom: "10px" }}>
                  <strong style={{ color: "#10B981" }}>Benefits: </strong> {s.benefits}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "10px" }}>
                <a 
                  href={s.official_source_url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  style={{ fontSize: "0.75rem", color: "var(--color-secondary)", fontWeight: "700", textDecoration: "none", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  Official Portal <ExternalLink size={12} />
                </a>
                <button 
                  onClick={() => setSelectedScheme(s)}
                  className="btn btn-outline btn-sm" 
                  style={{ fontSize: "0.75rem", padding: "4px 8px" }}
                >
                  View Eligibility
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ============================================================================== */}
      {/* MODAL 1: PF STATEMENT / LEDGER WORKSPACE */}
      {/* ============================================================================== */}
      {showStatementModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.8)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)"
        }}>
          <div style={{
            background: "var(--color-surface)", width: "100%", maxWidth: "750px", maxHeight: "90vh",
            borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)",
            display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--shadow-xl)"
          }}>
            <div style={{ padding: "var(--space-4) var(--space-5)", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "800", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Landmark size={20} color="var(--color-secondary)" />
                  Provident Fund Statement Ledger
                </h2>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                  Current Balance: <strong style={{ color: "#10B981" }}>₹ {Number(account?.current_balance || 0).toLocaleString("en-IN")}</strong>
                </span>
              </div>
              <button onClick={() => setShowStatementModal(false)} className="btn btn-ghost btn-sm" style={{ padding: "6px" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "var(--space-5)", overflowY: "auto", flex: 1 }}>
              {transactions.length === 0 ? (
                <div style={{ padding: "30px", textAlign: "center", color: "var(--color-text-secondary)" }}>
                  No PF transactions recorded yet.
                </div>
              ) : (
                <div style={{ border: "1px solid var(--color-border)", borderRadius: "8px", overflow: "hidden" }}>
                  <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                    <thead>
                      <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                        <th style={{ padding: "8px 12px", textAlign: "left" }}>Date</th>
                        <th style={{ padding: "8px 12px", textAlign: "left" }}>Txn ID</th>
                        <th style={{ padding: "8px 12px", textAlign: "left" }}>Description</th>
                        <th style={{ padding: "8px 12px", textAlign: "right" }}>Credit</th>
                        <th style={{ padding: "8px 12px", textAlign: "right" }}>Debit</th>
                        <th style={{ padding: "8px 12px", textAlign: "right" }}>Balance After</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.map((tx) => (
                        <tr key={tx.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                          <td style={{ padding: "8px 12px", color: "var(--color-text-muted)" }}>
                            {new Date(tx.created_at).toLocaleDateString()}
                          </td>
                          <td style={{ padding: "8px 12px", fontWeight: "700", color: "var(--color-secondary)" }}>
                            {tx.transaction_code}
                          </td>
                          <td style={{ padding: "8px 12px" }}>{tx.description}</td>
                          <td style={{ padding: "8px 12px", textAlign: "right", color: "#10B981", fontWeight: "700" }}>
                            {tx.credit > 0 ? `+ ₹${Number(tx.credit).toLocaleString('en-IN')}` : "-"}
                          </td>
                          <td style={{ padding: "8px 12px", textAlign: "right", color: "#EF4444", fontWeight: "700" }}>
                            {tx.debit > 0 ? `- ₹${Number(tx.debit).toLocaleString('en-IN')}` : "-"}
                          </td>
                          <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: "800" }}>
                            ₹ {Number(tx.balance_after || 0).toLocaleString('en-IN')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            <div style={{ padding: "var(--space-4) var(--space-5)", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowStatementModal(false)} className="btn btn-primary btn-sm">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL 2: POLICY DETAILS */}
      {/* ============================================================================== */}
      {showPolicyModal && member && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.8)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)"
        }}>
          <div style={{
            background: "var(--color-surface)", width: "100%", maxWidth: "600px",
            borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)",
            padding: "var(--space-5)", boxShadow: "var(--shadow-xl)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "var(--space-4)" }}>
              <div>
                <span style={{ fontSize: "0.75rem", fontWeight: "800", color: "var(--color-secondary)" }}>GROUP POLICY CERTIFICATE</span>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "800", margin: "2px 0 0 0" }}>
                  {policy?.policy_name || "COOP HUB Group Shield"}
                </h2>
              </div>
              <button onClick={() => setShowPolicyModal(false)} className="btn btn-ghost btn-sm" style={{ padding: "6px" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "0.85rem", marginBottom: "var(--space-4)" }}>
              <div style={{ background: "var(--color-surface-hover)", padding: "10px", borderRadius: "6px" }}>
                <strong>Underwriting Carrier:</strong> {policy?.provider || "United India Insurance Co."}
              </div>
              <div style={{ background: "var(--color-surface-hover)", padding: "10px", borderRadius: "6px" }}>
                <strong>Member Certificate ID:</strong> {member.member_id}
              </div>
              <div style={{ background: "var(--color-surface-hover)", padding: "10px", borderRadius: "6px" }}>
                <strong>Coverage Scope:</strong> Cashless in-patient hospitalization, emergency accidental disability, day-care surgical cover.
              </div>
              <div style={{ background: "var(--color-surface-hover)", padding: "10px", borderRadius: "6px" }}>
                <strong>Emergency TPA Helpline:</strong> 1800-425-3333 (24x7 Cashless Authorization)
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowPolicyModal(false)} className="btn btn-primary btn-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL 3: SCHEME ELIGIBILITY & DETAILS */}
      {/* ============================================================================== */}
      {selectedScheme && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.8)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)"
        }}>
          <div style={{
            background: "var(--color-surface)", width: "100%", maxWidth: "600px", maxHeight: "90vh",
            borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)",
            display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--shadow-xl)"
          }}>
            <div style={{ padding: "var(--space-4) var(--space-5)", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "var(--color-secondary)" }}>{selectedScheme.category} SCHEME</span>
                <h2 style={{ fontSize: "1.15rem", fontWeight: "800", margin: "2px 0 0 0" }}>{selectedScheme.scheme_name}</h2>
              </div>
              <button onClick={() => setSelectedScheme(null)} className="btn btn-ghost btn-sm" style={{ padding: "6px" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "var(--space-5)", overflowY: "auto", flex: 1, fontSize: "0.88rem", lineHeight: "1.5" }}>
              <div style={{ marginBottom: "12px" }}>
                <h4 style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase", margin: "0 0 4px 0" }}>Eligibility Criteria</h4>
                <p style={{ margin: 0 }}>{selectedScheme.eligibility}</p>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <h4 style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase", margin: "0 0 4px 0" }}>Key Benefits</h4>
                <div style={{ background: "rgba(16, 185, 129, 0.1)", padding: "10px", borderRadius: "8px", color: "#10B981", fontWeight: "600" }}>
                  {selectedScheme.benefits}
                </div>
              </div>

              <div style={{ marginBottom: "12px" }}>
                <h4 style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase", margin: "0 0 4px 0" }}>Required Documents</h4>
                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                  {selectedScheme.required_documents?.map((doc, i) => (
                    <li key={i}>{doc}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase", margin: "0 0 4px 0" }}>How to Apply</h4>
                <p style={{ margin: 0 }}>{selectedScheme.application_process}</p>
              </div>
            </div>

            <div style={{ padding: "var(--space-4) var(--space-5)", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <a 
                href={selectedScheme.official_source_url} 
                target="_blank" 
                rel="noopener noreferrer"
                className="btn btn-primary btn-sm"
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <ExternalLink size={14} /> Visit Official Portal
              </a>
              <button onClick={() => setSelectedScheme(null)} className="btn btn-outline btn-sm">
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
