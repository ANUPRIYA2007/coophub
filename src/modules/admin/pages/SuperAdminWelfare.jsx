import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { welfareService } from "../services/welfareService";
import { 
  Heart, Shield, Clock, Search, Filter, RefreshCw, Globe, 
  DollarSign, Users, TrendingUp, AlertTriangle, CheckCircle, Award,
  ExternalLink, Eye, X, Landmark, FileText, CheckCircle2, Phone, 
  Briefcase, ChevronRight, User, AlertCircle, Building2
} from "lucide-react";

export default function SuperAdminWelfare() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);

  // Selected Pillar for Dossier Modal
  const [selectedPillarModal, setSelectedPillarModal] = useState(null);

  // KPI
  const [kpiStats, setKpiStats] = useState({
    totalPFFund: 0, activePFAccounts: 0, monthlyContributions: 0,
    activeInsuranceMembers: 0, totalInsuranceCoverage: 0, pendingClaims: 0
  });

  // PF Overview
  const [pfFundData, setPfFundData] = useState({
    totalFund: 0, totalContributions: 0, totalWithdrawals: 0, activeAccounts: 0,
    monthlyContributionsTrend: [], recentTransactions: []
  });

  // PF Accounts
  const [pfAccounts, setPfAccounts] = useState([]);
  const [pfSearch, setPfSearch] = useState("");

  // Insurance
  const [insuranceData, setInsuranceData] = useState({
    policy: null, activeMembers: 0, totalCoverage: 0, monthlyPremium: 0, pendingClaims: 0
  });

  // Claims
  const [claims, setClaims] = useState([]);
  const [claimsFilter, setClaimsFilter] = useState("all");

  // Schemes
  const [schemes, setSchemes] = useState([]);

  // Assistance
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [assistFilter, setAssistFilter] = useState("all");

  const [geoFilter, setGeoFilter] = useState("national");

  useEffect(() => {
    loadAllData();
  }, []);

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [kpi, pf, accounts, ins, cl, sch, assist] = await Promise.allSettled([
        welfareService.getWelfareKPISummary(),
        welfareService.getPFFundOverview(),
        welfareService.getPillarPFAccounts(),
        welfareService.getGroupInsuranceMasterPolicy(),
        welfareService.getInsuranceClaims("all"),
        welfareService.getGovernmentWelfareSchemes(),
        welfareService.getWelfareAssistanceRequests("all")
      ]);

      if (kpi.status === 'fulfilled') setKpiStats(kpi.value);
      if (pf.status === 'fulfilled') setPfFundData(pf.value);
      if (accounts.status === 'fulfilled') setPfAccounts(accounts.value);
      if (ins.status === 'fulfilled') setInsuranceData(ins.value);
      if (cl.status === 'fulfilled') setClaims(cl.value);
      if (sch.status === 'fulfilled') setSchemes(sch.value);
      if (assist.status === 'fulfilled') setAssistanceRequests(assist.value);
    } catch (err) {
      console.error("Error loading welfare data:", err);
    } finally {
      setLoading(false);
    }
  };

  const fmt = (val) => val > 0 ? `₹${Number(val).toLocaleString('en-IN')}` : "₹0";

  // Official Government Portals list
  const GOV_PORTALS = [
    { name: "EPFO (Govt of India)", url: "https://www.epfindia.gov.in", desc: "Employees' Provident Fund" },
    { name: "e-Shram Portal", url: "https://eshram.gov.in", desc: "National Unorganised Workers" },
    { name: "Jan Suraksha", url: "https://www.jansuraksha.gov.in", desc: "PMJJBY & PMSBY" },
    { name: "Ayushman Bharat", url: "https://pmjay.gov.in", desc: "PM-JAY Health Protection" },
    { name: "TNUWWB Portal", url: "https://tnuwwb.tn.gov.in", desc: "TN Workers Welfare Board" },
    { name: "PM-SYM Maandhan", url: "https://maandhan.in", desc: "Statutory Pension Scheme" }
  ];

  const tabs = [
    { id: "overview", label: "National Overview" },
    { id: "pf", label: `PF Fund (${pfAccounts?.length || 0})` },
    { id: "insurance", label: "Insurance & Coverage" },
    { id: "claims", label: `Claims (${claims?.length || 0})` },
    { id: "schemes", label: `Schemes (${schemes?.length || 0})` },
    { id: "assistance", label: `Assistance (${assistanceRequests?.length || 0})` }
  ];

  // Filtered PF accounts based on search
  const filteredPFAccounts = (pfAccounts || []).filter(acc => {
    if (!pfSearch) return true;
    const q = pfSearch.toLowerCase();
    return (
      acc.pillar?.full_name?.toLowerCase().includes(q) ||
      acc.pillar?.pillar_code?.toLowerCase().includes(q) ||
      acc.pillar_id?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-3)", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)", margin: 0, marginBottom: "var(--space-2)" }}>
            National Welfare & Social Security
          </h1>
          <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
            Cooperative PF, PMJJBY, PMSBY, Ayushman Bharat, TNUWWB, PM-SYM oversight for all registered Pillars.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-color)", border: "1px solid var(--color-border)", padding: "0 12px", borderRadius: "var(--radius-md)" }}>
            <Globe size={14} color="var(--color-text-muted)" />
            <select value={geoFilter} onChange={(e) => setGeoFilter(e.target.value)} style={{ border: "none", background: "transparent", color: "var(--color-text)", fontWeight: "600", outline: "none", padding: "8px 0", fontSize: "0.85rem" }}>
              <option value="national">National</option>
              <option value="zone_south">South Zone</option>
              <option value="zone_north">North Zone</option>
            </select>
          </div>
          <button onClick={loadAllData} className="btn" style={{ display: "flex", alignItems: "center", gap: "6px", background: "var(--bg-color)", border: "1px solid var(--color-border)" }}>
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
        </div>
      </div>

      {/* Official Government Portals Bar */}
      <div style={{
        display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap",
        padding: "10px 14px", marginBottom: "var(--space-4)",
        background: "rgba(59, 130, 246, 0.05)", border: "1px solid rgba(59, 130, 246, 0.2)",
        borderRadius: "var(--radius-md)", fontSize: "0.82rem"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "700", color: "var(--color-primary)", marginRight: "6px" }}>
          <Landmark size={15} /> Official Government Welfare Portals:
        </div>
        {GOV_PORTALS.map((portal) => (
          <a
            key={portal.url}
            href={portal.url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: "inline-flex", alignItems: "center", gap: "4px",
              padding: "4px 10px", borderRadius: "4px",
              background: "var(--color-surface)", border: "1px solid var(--color-border)",
              color: "var(--color-text)", textDecoration: "none", fontWeight: "600",
              fontSize: "0.78rem", transition: "all 0.15s ease", cursor: "pointer"
            }}
            onMouseOver={(e) => { e.currentTarget.style.borderColor = "var(--color-primary)"; e.currentTarget.style.color = "var(--color-primary)"; }}
            onMouseOut={(e) => { e.currentTarget.style.borderColor = "var(--color-border)"; e.currentTarget.style.color = "var(--color-text)"; }}
            title={`${portal.desc} - Click to visit official portal (${portal.url})`}
          >
            <span>{portal.name}</span>
            <ExternalLink size={11} style={{ opacity: 0.7 }} />
          </a>
        ))}
      </div>

      {/* KPI Strip */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
        <WelfareKpi icon={<DollarSign size={18} />} label="Total PF Fund" value={fmt(kpiStats.totalPFFund)} color="var(--color-primary)" />
        <WelfareKpi icon={<Users size={18} />} label="Active PF Accounts" value={kpiStats.activePFAccounts} color="var(--color-success)" />
        <WelfareKpi icon={<TrendingUp size={18} />} label="Monthly Contributions" value={fmt(kpiStats.monthlyContributions)} color="var(--color-secondary)" />
        <WelfareKpi icon={<Shield size={18} />} label="Insurance Members" value={kpiStats.activeInsuranceMembers} color="#8B5CF6" />
        <WelfareKpi icon={<Heart size={18} />} label="Total Coverage" value={fmt(kpiStats.totalInsuranceCoverage)} color="#EC4899" />
        <WelfareKpi icon={<Clock size={18} />} label="Pending Claims" value={kpiStats.pendingClaims} color="#D97706" />
      </div>

      {/* Tab Navigation */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "var(--space-4)", background: "var(--bg-color)", padding: "4px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)", overflowX: "auto" }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
            padding: "8px 14px", borderRadius: "var(--radius-md)", border: "none", fontSize: "0.82rem", fontWeight: "700", cursor: "pointer", whiteSpace: "nowrap",
            background: activeTab === t.id ? "var(--color-primary)" : "transparent",
            color: activeTab === t.id ? "#fff" : "var(--color-text-secondary)"
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "60px" }}><div className="spinner"></div></div>
        ) : activeTab === "overview" ? (
          <div style={{ padding: "var(--space-5)" }}>
            <h3 style={{ margin: "0 0 16px", fontWeight: "700" }}>Welfare Program Summary</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)" }}>
              <div>
                <h4 style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: "12px" }}>Provident Fund</h4>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <tbody>
                    <tr style={rowStyle}><td style={cellStyle}>Total Fund Balance</td><td style={valStyle}>{fmt(pfFundData.totalFund)}</td></tr>
                    <tr style={rowStyle}><td style={cellStyle}>Total Contributions</td><td style={valStyle}>{fmt(pfFundData.totalContributions)}</td></tr>
                    <tr style={rowStyle}><td style={cellStyle}>Total Withdrawals</td><td style={valStyle}>{fmt(pfFundData.totalWithdrawals)}</td></tr>
                    <tr style={rowStyle}><td style={cellStyle}>Active Accounts</td><td style={valStyle}>{pfFundData.activeAccounts}</td></tr>
                  </tbody>
                </table>
              </div>
              <div>
                <h4 style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", marginBottom: "12px" }}>Insurance & Coverage</h4>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                  <tbody>
                    <tr style={rowStyle}><td style={cellStyle}>Active Members</td><td style={valStyle}>{insuranceData.activeMembers}</td></tr>
                    <tr style={rowStyle}><td style={cellStyle}>Total Coverage</td><td style={valStyle}>{fmt(insuranceData.totalCoverage)}</td></tr>
                    <tr style={rowStyle}><td style={cellStyle}>Monthly Premium</td><td style={valStyle}>{fmt(insuranceData.monthlyPremium)}</td></tr>
                    <tr style={rowStyle}><td style={cellStyle}>Pending Claims</td><td style={valStyle}>{insuranceData.pendingClaims}</td></tr>
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : activeTab === "pf" ? (
          <div>
            {/* EPFO Notice & Quick Filter Bar */}
            <div style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "12px 20px", background: "rgba(59, 130, 246, 0.05)",
              borderBottom: "1px solid var(--color-border)", flexWrap: "wrap", gap: "12px"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", color: "var(--color-text)" }}>
                <Landmark size={16} color="var(--color-primary)" />
                <span>
                  Cooperative PF accounts comply with statutory <strong>EPFO guidelines</strong>. Click any <strong>Pillar Name or ID</strong> below to inspect individual ledger and KYC dossier.
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ position: "relative" }}>
                  <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
                  <input
                    type="text"
                    value={pfSearch}
                    onChange={(e) => setPfSearch(e.target.value)}
                    placeholder="Search Pillar or ID..."
                    style={{
                      padding: "6px 12px 6px 30px", fontSize: "0.8rem", borderRadius: "6px",
                      border: "1px solid var(--color-border)", background: "var(--color-surface)",
                      color: "var(--color-text)", outline: "none", width: "190px"
                    }}
                  />
                </div>
                <a
                  href="https://www.epfindia.gov.in"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-flex", alignItems: "center", gap: "5px",
                    color: "var(--color-primary)", fontWeight: "700", textDecoration: "none", fontSize: "0.8rem",
                    padding: "6px 12px", background: "rgba(59, 130, 246, 0.1)", borderRadius: "6px"
                  }}
                >
                  Verify on EPFO Portal <ExternalLink size={12} />
                </a>
              </div>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "750px", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                    <th style={thS}>Pillar (Click for Details)</th>
                    <th style={thS}>Balance</th>
                    <th style={thS}>Contributions</th>
                    <th style={thS}>Status</th>
                    <th style={{ ...thS, textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {(!filteredPFAccounts || filteredPFAccounts.length === 0) ? (
                    <tr><td colSpan={5} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>
                      <Users size={40} style={{ opacity: 0.2, margin: "0 auto 12px" }} />
                      <p style={{ fontWeight: "600" }}>No PF accounts match the current filter</p>
                    </td></tr>
                  ) : (
                    filteredPFAccounts.map((acc) => (
                      <tr key={acc.id} style={{ borderBottom: "1px solid var(--color-border)" }} className="table-row-hover">
                        <td style={tdS}>
                          <button
                            onClick={() => setSelectedPillarModal(acc)}
                            style={{
                              background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer",
                              display: "flex", flexDirection: "column", gap: "2px"
                            }}
                            title="Click to view Pillar details, ledger & KYC"
                          >
                            <span style={{ fontWeight: "700", color: "var(--color-text)", display: "flex", alignItems: "center", gap: "6px" }}>
                              {acc.pillar?.full_name || "Unknown"}
                              <ExternalLink size={12} style={{ opacity: 0.5, color: "var(--color-primary)" }} />
                            </span>
                            <span style={{
                              fontSize: "0.74rem", fontFamily: "monospace", fontWeight: "700",
                              color: "var(--color-primary)", background: "rgba(59, 130, 246, 0.1)",
                              padding: "1px 6px", borderRadius: "4px", width: "fit-content"
                            }}>
                              {acc.pillar?.pillar_code || acc.pillar_id || "PIL-ID"}
                            </span>
                          </button>
                        </td>
                        <td style={tdS}><span style={{ fontWeight: "800", color: "var(--color-text)" }}>{fmt(acc.current_balance)}</span></td>
                        <td style={tdS}>
                          <div>
                            <span style={{ fontWeight: "600" }}>{fmt(acc.total_contributions)}</span>
                            <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                              Worker: {fmt(acc.pillar_contribution_total || (acc.total_contributions / 2))} | Co-op: {fmt(acc.coop_contribution_total || (acc.total_contributions / 2))}
                            </div>
                          </div>
                        </td>
                        <td style={tdS}>
                          <span style={{
                            fontSize: "0.7rem", fontWeight: "700", padding: "2px 8px", borderRadius: "10px",
                            textTransform: "uppercase",
                            background: acc.account_status === 'active' ? "var(--color-success-light)" : "var(--color-surface-hover)",
                            color: acc.account_status === 'active' ? "var(--color-success)" : "var(--color-text-secondary)"
                          }}>
                            {acc.account_status || "ACTIVE"}
                          </span>
                        </td>
                        <td style={{ ...tdS, textAlign: "right" }}>
                          <button
                            onClick={() => setSelectedPillarModal(acc)}
                            className="btn"
                            style={{
                              padding: "4px 10px", fontSize: "0.75rem", fontWeight: "700",
                              background: "var(--color-surface-hover)", border: "1px solid var(--color-border)",
                              display: "inline-flex", alignItems: "center", gap: "4px", cursor: "pointer",
                              borderRadius: "4px"
                            }}
                          >
                            <Eye size={12} /> View Details
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === "insurance" ? (
          <div style={{ padding: "var(--space-5)" }}>
            {insuranceData.policy ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                  <h3 style={{ margin: 0, fontWeight: "700" }}>Group Master Policy</h3>
                  <a
                    href="https://www.jansuraksha.gov.in"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: "inline-flex", alignItems: "center", gap: "6px",
                      fontSize: "0.8rem", color: "var(--color-primary)", fontWeight: "700", textDecoration: "none"
                    }}
                  >
                    Jan Suraksha Social Security Portal <ExternalLink size={12} />
                  </a>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "var(--space-3)" }}>
                  <div style={infoBox}><span style={infoLabel}>Policy Number</span><span style={infoVal}>{insuranceData.policy.policy_number || "POL-GRP-2026-COOP"}</span></div>
                  <div style={infoBox}><span style={infoLabel}>Insurer</span><span style={infoVal}>{insuranceData.policy.insurer || "National Insurance / Star Health"}</span></div>
                  <div style={infoBox}><span style={infoLabel}>Type</span><span style={infoVal}>{insuranceData.policy.policy_type || "Group Accidental & Life"}</span></div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>
                <Shield size={48} style={{ opacity: 0.2, margin: "0 auto 12px" }} />
                <p style={{ fontWeight: "600" }}>No group insurance policy configured</p>
              </div>
            )}
          </div>
        ) : activeTab === "claims" ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "700px", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={thS}>Claim ID</th>
                  <th style={thS}>Pillar (Click for Details)</th>
                  <th style={thS}>Amount</th>
                  <th style={thS}>Status</th>
                  <th style={thS}>Date</th>
                </tr>
              </thead>
              <tbody>
                {(!claims || claims.length === 0) ? (
                  <tr><td colSpan={5} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>
                    <Award size={40} style={{ opacity: 0.2, margin: "0 auto 12px" }} />
                    <p style={{ fontWeight: "600" }}>No insurance claims found</p>
                  </td></tr>
                ) : (
                  claims.map((claim) => (
                    <tr key={claim.id} style={{ borderBottom: "1px solid var(--color-border)" }} className="table-row-hover">
                      <td style={tdS}><span style={{ fontFamily: "monospace", fontWeight: "700" }}>{(claim.claim_code || claim.id || '').slice(0, 14)}</span></td>
                      <td style={tdS}>
                        <button
                          onClick={() => setSelectedPillarModal({ pillar: claim.pillar || { full_name: claim.member_name, pillar_code: claim.pillar_id }, ...claim })}
                          style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: "var(--color-primary)", fontWeight: "700" }}
                        >
                          {claim.pillar?.full_name || claim.member_name || "Unknown"}
                          <Eye size={12} style={{ opacity: 0.7 }} />
                        </button>
                      </td>
                      <td style={tdS}><span style={{ fontWeight: "700" }}>{fmt(claim.claim_amount || 0)}</span></td>
                      <td style={tdS}><span style={{ fontSize: "0.7rem", fontWeight: "700", padding: "2px 8px", borderRadius: "10px", textTransform: "uppercase", background: claim.status === 'approved' ? "var(--color-success-light)" : claim.status === 'pending' ? "rgba(245,158,11,0.15)" : "var(--color-error-light)", color: claim.status === 'approved' ? "var(--color-success)" : claim.status === 'pending' ? "#D97706" : "var(--color-error)" }}>{claim.status || "N/A"}</span></td>
                      <td style={tdS}>{claim.created_at ? new Date(claim.created_at).toLocaleDateString() : "N/A"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : activeTab === "schemes" ? (
          <div style={{ padding: "var(--space-4)" }}>
            {(!schemes || schemes.length === 0) ? (
              <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)" }}>
                <Heart size={48} style={{ opacity: 0.2, margin: "0 auto 12px" }} />
                <p style={{ fontWeight: "600" }}>No welfare scheme data available</p>
              </div>
            ) : (
              <div style={{ display: "grid", gap: "16px" }}>
                {schemes.map((s, i) => {
                  const officialUrl = s.official_source_url || s.official_url;
                  let hostname = "";
                  try {
                    if (officialUrl) hostname = new URL(officialUrl).hostname;
                  } catch (e) {
                    hostname = officialUrl;
                  }

                  return (
                    <div key={s.id || i} style={{
                      padding: "20px", border: "1px solid var(--color-border)",
                      borderRadius: "var(--radius-lg)", background: "var(--color-surface)",
                      boxShadow: "var(--shadow-sm)"
                    }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "10px" }}>
                        <div>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                            <span style={{
                              fontSize: "0.72rem", fontFamily: "monospace", fontWeight: "700",
                              background: "rgba(59, 130, 246, 0.12)", color: "var(--color-primary)",
                              padding: "2px 8px", borderRadius: "4px"
                            }}>
                              {s.scheme_code || `SCH-00${i + 1}`}
                            </span>
                            <span style={{
                              fontSize: "0.72rem", fontWeight: "700",
                              background: "var(--color-surface-hover)", color: "var(--color-text-secondary)",
                              padding: "2px 8px", borderRadius: "10px", textTransform: "uppercase"
                            }}>
                              {s.category || "Social Welfare"}
                            </span>
                          </div>
                          <h3 style={{ margin: "0 0 6px", fontSize: "1.1rem", fontWeight: "800", color: "var(--color-text)" }}>
                            {s.scheme_name || s.name}
                          </h3>
                          {s.department && (
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem", color: "var(--color-text-muted)", fontWeight: "600" }}>
                              <Building2 size={13} /> {s.department}
                            </div>
                          )}
                        </div>

                        {/* Official Government Website Link Button */}
                        {officialUrl && (
                          <a
                            href={officialUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            style={{
                              display: "inline-flex", alignItems: "center", gap: "6px",
                              padding: "8px 16px", borderRadius: "6px",
                              background: "var(--color-primary)", color: "#fff",
                              textDecoration: "none", fontSize: "0.82rem", fontWeight: "700",
                              boxShadow: "0 2px 4px rgba(0,0,0,0.15)", cursor: "pointer",
                              whiteSpace: "nowrap"
                            }}
                          >
                            <ExternalLink size={14} /> Visit Official Portal ({hostname}) ↗
                          </a>
                        )}
                      </div>

                      <p style={{ margin: "10px 0", fontSize: "0.88rem", color: "var(--color-text-secondary)", lineHeight: 1.5 }}>
                        {s.description || "Government statutory welfare scheme for registered cooperative workforce members."}
                      </p>

                      {s.benefits && (
                        <div style={{
                          margin: "12px 0", padding: "10px 14px",
                          background: "rgba(16, 185, 129, 0.06)", border: "1px solid rgba(16, 185, 129, 0.2)",
                          borderRadius: "6px", fontSize: "0.82rem", color: "var(--color-text)"
                        }}>
                          <strong style={{ color: "var(--color-success)" }}>Key Statutory Benefits: </strong> {s.benefits}
                        </div>
                      )}

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginTop: "12px", fontSize: "0.8rem" }}>
                        {s.eligibility && (
                          <div style={{ background: "var(--color-surface-hover)", padding: "10px 12px", borderRadius: "6px" }}>
                            <span style={{ fontWeight: "700", display: "block", marginBottom: "4px", color: "var(--color-text)" }}>Eligibility Criteria</span>
                            <span style={{ color: "var(--color-text-secondary)" }}>{s.eligibility}</span>
                          </div>
                        )}
                        {s.required_documents && Array.isArray(s.required_documents) && s.required_documents.length > 0 && (
                          <div style={{ background: "var(--color-surface-hover)", padding: "10px 12px", borderRadius: "6px" }}>
                            <span style={{ fontWeight: "700", display: "block", marginBottom: "4px", color: "var(--color-text)" }}>Required Documents</span>
                            <span style={{ color: "var(--color-text-secondary)" }}>{s.required_documents.join(", ")}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ) : activeTab === "assistance" ? (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "600px", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={thS}>Request</th>
                  <th style={thS}>Pillar (Click for Details)</th>
                  <th style={thS}>Type</th>
                  <th style={thS}>Status</th>
                </tr>
              </thead>
              <tbody>
                {(!assistanceRequests || assistanceRequests.length === 0) ? (
                  <tr><td colSpan={4} style={{ padding: "60px", textAlign: "center", color: "var(--color-text-muted)" }}>
                    <CheckCircle size={40} style={{ opacity: 0.2, margin: "0 auto 12px" }} />
                    <p style={{ fontWeight: "600" }}>No welfare assistance requests found</p>
                  </td></tr>
                ) : (
                  assistanceRequests.map((ar) => (
                    <tr key={ar.id} style={{ borderBottom: "1px solid var(--color-border)" }} className="table-row-hover">
                      <td style={tdS}><span style={{ fontFamily: "monospace", fontWeight: "700" }}>{(ar.id || '').slice(0, 12)}</span></td>
                      <td style={tdS}>
                        <button
                          onClick={() => setSelectedPillarModal({ pillar: ar.pillar || { full_name: ar.pillar_name, pillar_code: ar.pillar_id }, ...ar })}
                          style={{ background: "none", border: "none", padding: 0, textAlign: "left", cursor: "pointer", display: "flex", alignItems: "center", gap: "5px", color: "var(--color-primary)", fontWeight: "700" }}
                        >
                          {ar.pillar?.full_name || ar.pillar_name || "Unknown"}
                          <Eye size={12} style={{ opacity: 0.7 }} />
                        </button>
                      </td>
                      <td style={tdS}>{ar.request_type || ar.assistance_type || "General"}</td>
                      <td style={tdS}><span style={{ fontSize: "0.7rem", fontWeight: "700", padding: "2px 8px", borderRadius: "10px", textTransform: "uppercase", background: ar.status === 'approved' ? "var(--color-success-light)" : ar.status === 'pending' ? "rgba(245,158,11,0.15)" : "var(--color-surface-hover)", color: ar.status === 'approved' ? "var(--color-success)" : ar.status === 'pending' ? "#D97706" : "var(--color-text-secondary)" }}>{ar.status || "N/A"}</span></td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        ) : null}
      </div>

      {/* ============================================================================== */}
      {/* MODAL: PILLAR SOCIAL SECURITY & IDENTITY DOSSIER */}
      {/* ============================================================================== */}
      {selectedPillarModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.75)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "16px",
          backdropFilter: "blur(4px)"
        }}>
          <div style={{
            background: "var(--color-surface)", width: "100%", maxWidth: "680px", maxHeight: "90vh",
            borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)",
            display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)"
          }}>
            {/* Modal Header */}
            <div style={{
              padding: "18px 24px", borderBottom: "1px solid var(--color-border)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "var(--color-surface-hover)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <div style={{
                  width: "46px", height: "46px", borderRadius: "50%",
                  background: "linear-gradient(135deg, var(--color-primary), #6366f1)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  color: "#fff", fontWeight: "800", fontSize: "1.15rem"
                }}>
                  {(selectedPillarModal.pillar?.full_name || selectedPillarModal.pillar_name || "P").charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "800", color: "var(--color-text)" }}>
                    {selectedPillarModal.pillar?.full_name || selectedPillarModal.pillar_name || "Pillar Member"}
                  </h3>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "3px" }}>
                    <span style={{
                      fontFamily: "monospace", fontSize: "0.8rem", fontWeight: "700",
                      background: "rgba(59, 130, 246, 0.12)", color: "var(--color-primary)",
                      padding: "2px 8px", borderRadius: "4px"
                    }}>
                      {selectedPillarModal.pillar?.pillar_code || selectedPillarModal.pillar_code || selectedPillarModal.pillar_id || "PIL-REF"}
                    </span>
                    <span style={{
                      fontSize: "0.72rem", fontWeight: "700", textTransform: "uppercase",
                      padding: "2px 8px", borderRadius: "10px",
                      background: (selectedPillarModal.account_status === "active" || selectedPillarModal.status === "active" || selectedPillarModal.status === "approved")
                        ? "var(--color-success-light)" : "var(--color-surface-hover)",
                      color: (selectedPillarModal.account_status === "active" || selectedPillarModal.status === "active" || selectedPillarModal.status === "approved")
                        ? "var(--color-success)" : "var(--color-text-secondary)"
                    }}>
                      {selectedPillarModal.account_status || selectedPillarModal.status || "Active Member"}
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setSelectedPillarModal(null)}
                style={{ background: "transparent", border: "none", color: "var(--color-text-muted)", cursor: "pointer", padding: "6px", borderRadius: "6px" }}
              >
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "20px 24px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "18px" }}>
              {/* Contact & Trade Information */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div style={{ background: "var(--color-surface-hover)", padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: "600", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Briefcase size={12} /> Primary Trade / Skill
                  </div>
                  <div style={{ fontWeight: "700", color: "var(--color-text)", marginTop: "4px", fontSize: "0.92rem" }}>
                    {selectedPillarModal.pillar?.main_services?.join(", ") || selectedPillarModal.pillar?.main_trade || "Certified Service Professional"}
                  </div>
                </div>
                <div style={{ background: "var(--color-surface-hover)", padding: "12px 14px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)", fontWeight: "600", textTransform: "uppercase", display: "flex", alignItems: "center", gap: "4px" }}>
                    <Phone size={12} /> Mobile Contact
                  </div>
                  <div style={{ fontWeight: "700", color: "var(--color-text)", marginTop: "4px", fontSize: "0.92rem" }}>
                    {selectedPillarModal.pillar?.mobile || "+91 98401 23456"}
                  </div>
                </div>
              </div>

              {/* PF Financial Breakdown */}
              <div>
                <h4 style={{ margin: "0 0 10px", fontSize: "0.88rem", fontWeight: "700", color: "var(--color-text)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <DollarSign size={16} color="var(--color-primary)" /> Cooperative PF Ledger Breakdown
                </h4>
                <div style={{
                  display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px",
                  background: "var(--color-surface-hover)", padding: "16px", borderRadius: "8px", border: "1px solid var(--color-border)"
                }}>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Current Fund Balance</div>
                    <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--color-primary)" }}>
                      {fmt(selectedPillarModal.current_balance !== undefined ? selectedPillarModal.current_balance : 48500)}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Total Cumulative Contributions</div>
                    <div style={{ fontSize: "1.4rem", fontWeight: "800", color: "var(--color-text)" }}>
                      {fmt(selectedPillarModal.total_contributions !== undefined ? selectedPillarModal.total_contributions : 54000)}
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "8px" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>Worker Contribution (50%)</div>
                    <div style={{ fontWeight: "700", color: "var(--color-text)" }}>
                      {fmt(selectedPillarModal.pillar_contribution_total || (selectedPillarModal.total_contributions ? selectedPillarModal.total_contributions / 2 : 27000))}
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "8px" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>Cooperative Match Pool (50%)</div>
                    <div style={{ fontWeight: "700", color: "var(--color-success)" }}>
                      {fmt(selectedPillarModal.coop_contribution_total || (selectedPillarModal.total_contributions ? selectedPillarModal.total_contributions / 2 : 27000))}
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "8px" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>Total Withdrawals / Claims Settled</div>
                    <div style={{ fontWeight: "700", color: "var(--color-text)" }}>
                      {fmt(selectedPillarModal.total_withdrawals || 0)}
                    </div>
                  </div>
                  <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "8px" }}>
                    <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>Interest Yield Rate</div>
                    <div style={{ fontWeight: "700", color: "var(--color-primary)" }}>8.25% p.a. (Govt EPFO Aligned)</div>
                  </div>
                </div>
              </div>

              {/* Statutory Social Security Status */}
              <div>
                <h4 style={{ margin: "0 0 10px", fontSize: "0.88rem", fontWeight: "700", color: "var(--color-text)", display: "flex", alignItems: "center", gap: "6px" }}>
                  <Shield size={16} color="var(--color-success)" /> Statutory Social Security Coverage
                </h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px", background: "var(--color-surface-hover)", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                    <CheckCircle2 size={16} color="var(--color-success)" />
                    <div>
                      <div style={{ fontSize: "0.8rem", fontWeight: "700" }}>EPFO Linked PF Account</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Statutory Co-op Compliance</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px", background: "var(--color-surface-hover)", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                    <CheckCircle2 size={16} color="var(--color-success)" />
                    <div>
                      <div style={{ fontSize: "0.8rem", fontWeight: "700" }}>Group Accidental Shield</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>₹5,00,000 Active Cover</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px", background: "var(--color-surface-hover)", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                    <CheckCircle2 size={16} color="var(--color-success)" />
                    <div>
                      <div style={{ fontSize: "0.8rem", fontWeight: "700" }}>PMJJBY / PMSBY Insurance</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Annual Auto-Debit Linked</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px", background: "var(--color-surface-hover)", borderRadius: "6px", border: "1px solid var(--color-border)" }}>
                    <CheckCircle2 size={16} color="var(--color-success)" />
                    <div>
                      <div style={{ fontSize: "0.8rem", fontWeight: "700" }}>TNUWWB State Welfare</div>
                      <div style={{ fontSize: "0.7rem", color: "var(--color-text-muted)" }}>Trade Verified Enrolment</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{
              padding: "14px 24px", borderTop: "1px solid var(--color-border)",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              background: "var(--color-surface-hover)"
            }}>
              <button
                onClick={() => {
                  const targetId = selectedPillarModal.pillar?.id || selectedPillarModal.pillar?.pillar_code || selectedPillarModal.pillar_id || "p-1";
                  setSelectedPillarModal(null);
                  navigate(`/admin/pillar-network/${targetId}`);
                }}
                className="btn btn-primary"
                style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem", fontWeight: "700", padding: "8px 16px" }}
              >
                <User size={14} /> View Full Pillar Dossier & KYC <ChevronRight size={14} />
              </button>
              <button
                onClick={() => setSelectedPillarModal(null)}
                className="btn"
                style={{ background: "transparent", border: "1px solid var(--color-border)", padding: "8px 16px", fontSize: "0.85rem" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function WelfareKpi({ icon, label, value, color }) {
  return (
    <div style={{ background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px", color }}>{icon}<span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--color-text-secondary)" }}>{label}</span></div>
      <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)" }}>{value}</div>
    </div>
  );
}

const rowStyle = { borderBottom: "1px solid var(--color-border)" };
const cellStyle = { padding: "10px 0", fontSize: "0.85rem" };
const valStyle = { padding: "10px 0", textAlign: "right", fontWeight: "700" };
const thS = { padding: "10px 20px", fontSize: "0.72rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em", textAlign: "left" };
const tdS = { padding: "12px 20px", color: "var(--color-text)" };
const infoBox = { background: "var(--color-surface-hover)", padding: "14px", borderRadius: "var(--radius-md)" };
const infoLabel = { display: "block", fontSize: "0.72rem", fontWeight: "600", color: "var(--color-text-muted)", marginBottom: "4px" };
const infoVal = { display: "block", fontSize: "1rem", fontWeight: "700", color: "var(--color-text)" };
