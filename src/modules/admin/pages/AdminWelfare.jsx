// ==============================================================================
// COOP HUB — WELFARE & INSURANCE CONTROL CENTER
// ==============================================================================
// Fully functional database-driven welfare management interface:
// 1. Cooperative PF Fund & Dynamic Calculations
// 2. Individual Pillar PF Accounts & Ledger Transactions
// 3. Group Master Policy & Individual Insurance Memberships
// 4. Insurance Claims Lifecycle & Claim Verification Workspace (Approval/Rejection Audit)
// 5. Government Welfare Schemes Directory with Authentic Source References
// ==============================================================================

import React, { useState, useEffect } from "react";
import { welfareService } from "../services/welfareService";
import { 
  Heart, Shield, AlertTriangle, CheckCircle, Clock, Search, 
  Filter, FileText, Plus, RefreshCw, X, Download, ExternalLink, 
  ChevronRight, ArrowUpRight, ArrowDownLeft, Award, UserCheck, 
  HelpCircle, Info, Landmark, Layers, Calendar, User, Phone, MapPin, 
  DollarSign, Check, XCircle, TrendingUp
} from "lucide-react";

export default function AdminWelfare() {
  // Active Tab State
  const [activeTab, setActiveTab] = useState("pf_fund"); // 'pf_fund' | 'pillar_pf' | 'insurance' | 'claims' | 'schemes'
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Dynamic Top 5 KPI Stats
  const [kpiStats, setKpiStats] = useState({
    totalPFFund: 0,
    activePFAccounts: 0,
    monthlyContributions: 0,
    activeInsuranceMembers: 0,
    totalInsuranceCoverage: 0,
    pendingClaims: 0
  });

  // Tab 1: PF Fund State
  const [pfFundData, setPfFundData] = useState({
    totalFund: 0,
    totalContributions: 0,
    totalWithdrawals: 0,
    activeAccounts: 0,
    monthlyContributionsTrend: [],
    recentTransactions: []
  });
  const [showAllTransactionsModal, setShowAllTransactionsModal] = useState(false);

  // Tab 2: Pillar PF Accounts State
  const [pfAccounts, setPfAccounts] = useState([]);
  const [pfSearchQuery, setPfSearchQuery] = useState("");
  const [pfStatusFilter, setPfStatusFilter] = useState("all");
  const [selectedPillarPF, setSelectedPillarPF] = useState(null);
  const [pfModalLoading, setPfModalLoading] = useState(false);

  // Tab 3: Group Insurance State
  const [insuranceData, setInsuranceData] = useState({
    policy: null,
    activeMembers: 0,
    totalCoverage: 0,
    monthlyPremium: 0,
    pendingClaims: 0
  });
  const [insuranceMembers, setInsuranceMembers] = useState([]);
  const [insSearchQuery, setInsSearchQuery] = useState("");
  const [insStatusFilter, setInsStatusFilter] = useState("all");
  const [selectedMemberPolicy, setSelectedMemberPolicy] = useState(null);

  // Tab 4: Insurance Claims State
  const [claims, setClaims] = useState([]);
  const [claimsFilter, setClaimsFilter] = useState("all");
  const [selectedClaim, setSelectedClaim] = useState(null);
  const [claimActionLoading, setClaimActionLoading] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [adminNotes, setAdminNotes] = useState("");

  // Tab 5: Government Welfare Schemes State
  const [schemes, setSchemes] = useState([]);
  const [schemeSearchQuery, setSchemeSearchQuery] = useState("");
  const [schemeCategoryFilter, setSchemeCategoryFilter] = useState("all");
  const [selectedScheme, setSelectedScheme] = useState(null);

  // Tab 6: PF Withdrawal Requests State
  const [pfWithdrawals, setPfWithdrawals] = useState([]);
  const [withdrawalFilter, setWithdrawalFilter] = useState("all");
  const [withdrawalSearchQuery, setWithdrawalSearchQuery] = useState("");
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [withdrawalActionLoading, setWithdrawalActionLoading] = useState(false);
  const [showRejectWithdrawalModal, setShowRejectWithdrawalModal] = useState(false);
  const [withdrawalRejectReason, setWithdrawalRejectReason] = useState("");
  const [withdrawalAdminNotes, setWithdrawalAdminNotes] = useState("");

  // Tab 7: Welfare Assistance Requests State
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [assistFilter, setAssistFilter] = useState("all");
  const [assistActionLoading, setAssistActionLoading] = useState(false);

  // Load all data on mount
  useEffect(() => {
    loadAllWelfareData();

    // Supabase Realtime live sync
    const channel = welfareService.subscribeToWelfareUpdates((payload) => {
      console.log("Realtime Welfare sync event:", payload);
      loadAllWelfareData();
    });

    return () => {
      channel?.unsubscribe?.();
    };
  }, []);

  const loadAllWelfareData = async () => {
    setLoading(true);
    setError(null);
    try {
      // 1. Fetch Dynamic KPI Summary
      const kpis = await welfareService.getWelfareKPISummary();
      setKpiStats(kpis);

      // 2. Fetch PF Fund Overview
      const pfOverview = await welfareService.getPFFundOverview();
      setPfFundData(pfOverview);

      // 3. Fetch Pillar PF Accounts
      const accounts = await welfareService.getPillarPFAccounts(pfSearchQuery, pfStatusFilter);
      setPfAccounts(accounts);

      // 4. Fetch Group Insurance Data & Members
      const insPolicy = await welfareService.getGroupInsuranceMasterPolicy();
      setInsuranceData(insPolicy);
      const members = await welfareService.getInsuranceMembers(insSearchQuery, insStatusFilter);
      setInsuranceMembers(members);

      // 5. Fetch Insurance Claims
      const claimsList = await welfareService.getInsuranceClaims(claimsFilter);
      setClaims(claimsList);

      // 6. Fetch Government Schemes
      const schemesList = await welfareService.getGovernmentWelfareSchemes(schemeSearchQuery, schemeCategoryFilter);
      setSchemes(schemesList);

      // 7. Fetch PF Withdrawal Requests
      const withdrawalsList = await welfareService.getPFWithdrawalRequests(withdrawalFilter);
      setPfWithdrawals(withdrawalsList);

      // 8. Fetch Welfare Assistance Requests
      const assistList = await welfareService.getWelfareAssistanceRequests(assistFilter);
      setAssistanceRequests(assistList.data || []);

      setLoading(false);
    } catch (err) {
      console.error("Error loading Welfare Control Center data:", err);
      setError("Unable to load live welfare records. Please retry.");
      setLoading(false);
    }
  };

  // Handle Tab-specific filters
  const handlePFFilterChange = async (status) => {
    setPfStatusFilter(status);
    const data = await welfareService.getPillarPFAccounts(pfSearchQuery, status);
    setPfAccounts(data);
  };

  const handlePFSearch = async (e) => {
    const val = e.target.value;
    setPfSearchQuery(val);
    const data = await welfareService.getPillarPFAccounts(val, pfStatusFilter);
    setPfAccounts(data);
  };

  const handleWithdrawalFilterChange = async (status) => {
    setWithdrawalFilter(status);
    const data = await welfareService.getPFWithdrawalRequests(status);
    setPfWithdrawals(data);
  };

  const handleApproveWithdrawal = async (withdrawalId) => {
    if (!window.confirm("Authorize and approve this PF withdrawal request? Available balance will be debited.")) return;
    setWithdrawalActionLoading(true);
    const res = await welfareService.approvePFWithdrawal(withdrawalId, "ADM-CHE-001", withdrawalAdminNotes);
    if (res.success) {
      alert("✅ PF Withdrawal authorized successfully. Ledger updated.");
      setSelectedWithdrawal(null);
      setWithdrawalAdminNotes("");
      loadAllWelfareData();
    } else {
      alert("Failed to approve withdrawal: " + res.error);
    }
    setWithdrawalActionLoading(false);
  };

  const handleRejectWithdrawalSubmit = async (e) => {
    e.preventDefault();
    if (!withdrawalRejectReason.trim()) {
      alert("A mandatory rejection reason is required before declining a withdrawal.");
      return;
    }
    setWithdrawalActionLoading(true);
    const res = await welfareService.rejectPFWithdrawal(selectedWithdrawal.id, withdrawalRejectReason, "ADM-CHE-001", withdrawalAdminNotes);
    if (res.success) {
      alert("❌ Withdrawal request declined. Rejection notification dispatched to Pillar.");
      setShowRejectWithdrawalModal(false);
      setSelectedWithdrawal(null);
      setWithdrawalRejectReason("");
      setWithdrawalAdminNotes("");
      loadAllWelfareData();
    } else {
      alert("Failed to reject withdrawal: " + res.error);
    }
    setWithdrawalActionLoading(false);
  };

  const handleUpdateAssist = async (id, status) => {
    const notes = prompt(`Enter notes for marking assistance request as "${status}":`, `Cooperative paperwork assistance updated to ${status}`);
    if (notes === null) return;
    setAssistActionLoading(true);
    const res = await welfareService.updateWelfareAssistanceStatus(id, {
      status,
      adminNotes: notes,
      rejectionReason: status === 'rejected' ? notes : ''
    });
    setAssistActionLoading(false);
    if (res.success) {
      loadAllWelfareData();
    } else {
      alert("Failed to update assistance request: " + res.error);
    }
  };

  const handleOpenPillarPFDetails = async (pillarId) => {
    setPfModalLoading(true);
    const details = await welfareService.getPillarPFDetails(pillarId);
    setSelectedPillarPF(details);
    setPfModalLoading(false);
  };

  const handleClaimFilterChange = async (status) => {
    setClaimsFilter(status);
    const data = await welfareService.getInsuranceClaims(status);
    setClaims(data);
  };

  const handleApproveClaim = async (claimId) => {
    if (!window.confirm("Authorize and approve this insurance claim for disbursement?")) return;
    setClaimActionLoading(true);
    const res = await welfareService.approveInsuranceClaim(claimId, adminNotes);
    if (res.success) {
      alert("✅ Insurance claim authorized successfully.");
      setSelectedClaim(null);
      loadAllWelfareData();
    } else {
      alert("Failed to approve claim: " + res.error);
    }
    setClaimActionLoading(false);
  };

  const handleRejectClaimSubmit = async (e) => {
    e.preventDefault();
    if (!rejectionReason.trim()) {
      alert("A clear rejection reason is mandatory before declining a claim.");
      return;
    }
    setClaimActionLoading(true);
    const res = await welfareService.rejectInsuranceClaim(selectedClaim.id, rejectionReason, adminNotes);
    if (res.success) {
      alert("❌ Claim marked as Rejected. Rejection notice dispatched to Pillar.");
      setShowRejectModal(false);
      setSelectedClaim(null);
      setRejectionReason("");
      setAdminNotes("");
      loadAllWelfareData();
    } else {
      alert("Failed to reject claim: " + res.error);
    }
    setClaimActionLoading(false);
  };

  const handleSchemeFilterChange = async (category) => {
    setSchemeCategoryFilter(category);
    const data = await welfareService.getGovernmentWelfareSchemes(schemeSearchQuery, category);
    setSchemes(data);
  };

  const handleSchemeSearch = async (e) => {
    const val = e.target.value;
    setSchemeSearchQuery(val);
    const data = await welfareService.getGovernmentWelfareSchemes(val, schemeCategoryFilter);
    setSchemes(data);
  };

  return (
    <div className="fade-in" style={{ paddingBottom: "var(--space-8)" }}>
      {/* ============================================================================== */}
      {/* 3. PAGE HEADER */}
      {/* ============================================================================== */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-5)", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <span style={{ 
              background: "rgba(255, 121, 0, 0.15)", color: "var(--color-primary)", 
              fontSize: "0.72rem", fontWeight: "800", padding: "3px 8px", borderRadius: "6px", letterSpacing: "0.5px" 
            }}>
              COOPERATIVE SOCIAL SECURITY
            </span>
          </div>
          <h1 style={{ fontSize: "1.65rem", fontWeight: "800", color: "var(--color-text)", margin: 0 }}>
            Welfare & Insurance
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", marginTop: "4px", margin: 0 }}>
            Manage cooperative PF, individual Pillar welfare, group insurance, claims and welfare schemes.
          </p>
        </div>

        <button 
          onClick={loadAllWelfareData} 
          disabled={loading}
          className="btn btn-outline" 
          style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem" }}
        >
          <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh Telemetry
        </button>
      </div>

      {/* Error Banner */}
      {error && (
        <div style={{ 
          background: "rgba(239, 68, 68, 0.15)", border: "1px solid #EF4444", 
          borderRadius: "var(--radius-md)", padding: "12px 16px", marginBottom: "var(--space-4)",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <span style={{ color: "#EF4444", fontSize: "0.88rem", fontWeight: "600" }}>{error}</span>
          <button onClick={loadAllWelfareData} className="btn btn-sm btn-primary">Retry</button>
        </div>
      )}

      {/* ============================================================================== */}
      {/* 5. TOP 5 DYNAMIC KPI CARDS */}
      {/* ============================================================================== */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", 
        gap: "var(--space-4)", 
        marginBottom: "var(--space-6)" 
      }}>
        {/* CARD 1: TOTAL PF FUND */}
        <div style={{ 
          background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", 
          border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
              Total PF Fund
            </span>
            <div style={{ background: "rgba(59, 130, 246, 0.15)", padding: "6px", borderRadius: "8px" }}>
              <Heart size={16} color="#3B82F6" />
            </div>
          </div>
          <div style={{ fontSize: "1.45rem", fontWeight: "800", color: "var(--color-text)" }}>
            {loading ? "..." : `₹ ${kpiStats.totalPFFund.toLocaleString("en-IN")}`}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#3B82F6", fontWeight: "600", marginTop: "4px" }}>
            Active PF Accounts: <strong>{kpiStats.activePFAccounts}</strong>
          </div>
        </div>

        {/* CARD 2: MONTHLY PF CONTRIBUTIONS */}
        <div style={{ 
          background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", 
          border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
              Monthly PF Contributions
            </span>
            <div style={{ background: "rgba(16, 185, 129, 0.15)", padding: "6px", borderRadius: "8px" }}>
              <TrendingUp size={16} color="#10B981" />
            </div>
          </div>
          <div style={{ fontSize: "1.45rem", fontWeight: "800", color: "var(--color-text)" }}>
            {loading ? "..." : `₹ ${kpiStats.monthlyContributions.toLocaleString("en-IN")}`}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: "500", marginTop: "4px" }}>
            Current Month Run-rate
          </div>
        </div>

        {/* CARD 3: ACTIVE INSURANCE MEMBERS */}
        <div style={{ 
          background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", 
          border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
              Active Insurance Members
            </span>
            <div style={{ background: "rgba(255, 121, 0, 0.15)", padding: "6px", borderRadius: "8px" }}>
              <UserCheck size={16} color="var(--color-primary)" />
            </div>
          </div>
          <div style={{ fontSize: "1.45rem", fontWeight: "800", color: "var(--color-text)" }}>
            {loading ? "..." : kpiStats.activeInsuranceMembers}
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-primary)", fontWeight: "600", marginTop: "4px" }}>
            Covered Pillars
          </div>
        </div>

        {/* CARD 4: TOTAL INSURANCE COVERAGE */}
        <div style={{ 
          background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", 
          border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
              Total Insurance Coverage
            </span>
            <div style={{ background: "rgba(139, 92, 246, 0.15)", padding: "6px", borderRadius: "8px" }}>
              <Shield size={16} color="#8B5CF6" />
            </div>
          </div>
          <div style={{ fontSize: "1.45rem", fontWeight: "800", color: "var(--color-text)" }}>
            {loading ? "..." : `₹ ${(kpiStats.totalInsuranceCoverage / 100000).toFixed(1)} Lakhs`}
          </div>
          <div style={{ fontSize: "0.75rem", color: "#8B5CF6", fontWeight: "600", marginTop: "4px" }}>
            Active Group Shield
          </div>
        </div>

        {/* CARD 5: PENDING CLAIMS */}
        <div style={{ 
          background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", 
          border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>
              Pending Claims
            </span>
            <div style={{ background: kpiStats.pendingClaims > 0 ? "rgba(245, 158, 11, 0.2)" : "rgba(16, 185, 129, 0.15)", padding: "6px", borderRadius: "8px" }}>
              <AlertTriangle size={16} color={kpiStats.pendingClaims > 0 ? "#F59E0B" : "#10B981"} />
            </div>
          </div>
          <div style={{ fontSize: "1.45rem", fontWeight: "800", color: kpiStats.pendingClaims > 0 ? "#F59E0B" : "var(--color-text)" }}>
            {loading ? "..." : kpiStats.pendingClaims}
          </div>
          <div style={{ fontSize: "0.75rem", color: kpiStats.pendingClaims > 0 ? "#F59E0B" : "var(--color-text-muted)", fontWeight: "600", marginTop: "4px" }}>
            {kpiStats.pendingClaims > 0 ? "Requires Immediate Review" : "All Claims Processed"}
          </div>
        </div>
      </div>

      {/* ============================================================================== */}
      {/* 6. TAB NAVIGATION */}
      {/* ============================================================================== */}
      <div style={{ 
        display: "flex", 
        borderBottom: "1px solid var(--color-border)", 
        marginBottom: "var(--space-5)",
        overflowX: "auto",
        gap: "8px"
      }}>
        {[
          { id: "pf_fund", label: "💰 PF Fund Overview" },
          { id: "pillar_pf", label: "👥 Pillar PF Accounts" },
          { id: "withdrawals", label: `💸 PF Withdrawal Requests ${pfWithdrawals.filter(w => w.status === 'pending').length > 0 ? `(${pfWithdrawals.filter(w => w.status === 'pending').length})` : ""}` },
          { id: "assistance", label: `🤝 Welfare Assistance ${assistanceRequests.filter(a => a.status === 'requested').length > 0 ? `(${assistanceRequests.filter(a => a.status === 'requested').length})` : ""}` },
          { id: "insurance", label: "🛡️ Group Insurance" },
          { id: "claims", label: `📋 Insurance Claims ${kpiStats.pendingClaims > 0 ? `(${kpiStats.pendingClaims})` : ""}` },
          { id: "schemes", label: "🏛️ Government Welfare Schemes" }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            style={{
              padding: "10px 18px",
              background: "none",
              border: "none",
              borderBottom: activeTab === tab.id ? "3px solid var(--color-primary)" : "3px solid transparent",
              color: activeTab === tab.id ? "var(--color-primary)" : "var(--color-text-secondary)",
              fontWeight: activeTab === tab.id ? "800" : "600",
              fontSize: "0.92rem",
              cursor: "pointer",
              whiteSpace: "nowrap",
              transition: "all 0.2s"
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ============================================================================== */}
      {/* TAB 1: PF FUND OVERVIEW */}
      {/* ============================================================================== */}
      {activeTab === "pf_fund" && (
        <div className="fade-in">
          {/* Fund Details & Trend Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
            {/* Financial Summary */}
            <div style={{ background: "var(--color-surface)", padding: "var(--space-5)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "8px" }}>
                <Landmark size={20} color="var(--color-primary)" /> Cooperative Provident Fund Ledger
              </h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)", marginBottom: "var(--space-4)" }}>
                <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Total Accumulated Balance</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "#10B981", marginTop: "2px" }}>
                    ₹ {pfFundData.totalFund.toLocaleString("en-IN")}
                  </div>
                </div>
                <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Total Lifetime Contributions</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "var(--color-text)", marginTop: "2px" }}>
                    ₹ {pfFundData.totalContributions.toLocaleString("en-IN")}
                  </div>
                </div>
                <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Total Approved Withdrawals</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "#EF4444", marginTop: "2px" }}>
                    ₹ {pfFundData.totalWithdrawals.toLocaleString("en-IN")}
                  </div>
                </div>
                <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Active Worker Accounts</div>
                  <div style={{ fontSize: "1.25rem", fontWeight: "800", color: "#3B82F6", marginTop: "2px" }}>
                    {pfFundData.activeAccounts} Accounts
                  </div>
                </div>
              </div>

              <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", lineHeight: "1.5", borderTop: "1px solid var(--color-border)", paddingTop: "10px" }}>
                🔒 <strong>Statutory Formula:</strong> 50% Worker Deposit + 50% Cooperative Matched Contribution per completed order ledger.
              </div>
            </div>

            {/* Monthly Trend Chart */}
            <div style={{ background: "var(--color-surface)", padding: "var(--space-5)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)" }}>
              <h3 style={{ fontSize: "1.1rem", fontWeight: "800", marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "8px" }}>
                <TrendingUp size={20} color="#10B981" /> Monthly Contribution Run-Rate
              </h3>

              <div style={{ display: "flex", alignItems: "flex-end", gap: "14px", height: "170px", padding: "10px 0 20px 0", borderBottom: "1px solid var(--color-border)" }}>
                {pfFundData.monthlyContributionsTrend.map((m, i) => {
                  const maxAmt = 60000;
                  const heightPct = Math.min(100, Math.round((m.amount / maxAmt) * 100));
                  return (
                    <div key={i} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", height: "100%", justifyContent: "flex-end" }}>
                      <span style={{ fontSize: "0.68rem", fontWeight: "700", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                        ₹{(m.amount / 1000).toFixed(0)}k
                      </span>
                      <div style={{
                        width: "100%",
                        height: `${heightPct}%`,
                        background: "linear-gradient(180deg, var(--color-primary) 0%, rgba(255, 121, 0, 0.4) 100%)",
                        borderRadius: "4px 4px 0 0",
                        minHeight: "12px"
                      }} />
                      <span style={{ fontSize: "0.75rem", fontWeight: "600", color: "var(--color-text-muted)", marginTop: "6px" }}>
                        {m.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Recent PF Transactions Table */}
          <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
            <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h3 style={{ fontSize: "1.05rem", fontWeight: "800", margin: 0 }}>Recent PF Ledger Transactions</h3>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>Audited financial credits, matching cooperative deposits and withdrawals</span>
              </div>
              <button onClick={() => setShowAllTransactionsModal(true)} className="btn btn-outline btn-sm">
                View Full Audit Ledger
              </button>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>Date</th>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>Txn ID</th>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>Pillar</th>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>Type</th>
                    <th style={{ padding: "10px 14px", textAlign: "right" }}>Credit (₹)</th>
                    <th style={{ padding: "10px 14px", textAlign: "right" }}>Debit (₹)</th>
                    <th style={{ padding: "10px 14px", textAlign: "right" }}>Balance After</th>
                    <th style={{ padding: "10px 14px", textAlign: "center" }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pfFundData.recentTransactions.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "30px", textAlign: "center", color: "var(--color-text-secondary)" }}>
                        No PF transactions recorded yet.
                      </td>
                    </tr>
                  ) : (
                    pfFundData.recentTransactions.map((tx) => (
                      <tr key={tx.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "10px 14px", color: "var(--color-text-muted)", fontSize: "0.8rem" }}>
                          {new Date(tx.created_at).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-primary)" }}>
                          {tx.transaction_code}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ fontWeight: "700" }}>{tx.pillar?.full_name || "Pillar"}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{tx.pillar?.pillar_code || tx.pillar_id}</div>
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <span style={{ 
                            fontSize: "0.75rem", fontWeight: "700", textTransform: "capitalize",
                            padding: "2px 8px", borderRadius: "6px",
                            background: tx.transaction_type === 'withdrawal' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(16, 185, 129, 0.15)',
                            color: tx.transaction_type === 'withdrawal' ? '#EF4444' : '#10B981'
                          }}>
                            {tx.transaction_type?.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "700", color: "#10B981" }}>
                          {tx.credit > 0 ? `+ ₹${tx.credit.toLocaleString('en-IN')}` : "-"}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "700", color: "#EF4444" }}>
                          {tx.debit > 0 ? `- ₹${tx.debit.toLocaleString('en-IN')}` : "-"}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "800" }}>
                          ₹ {tx.balance_after.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <span style={{ fontSize: "0.72rem", fontWeight: "700", padding: "2px 6px", borderRadius: "4px", background: "rgba(16, 185, 129, 0.15)", color: "#10B981" }}>
                            COMPLETED
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* TAB 2: PILLAR PF ACCOUNTS */}
      {/* ============================================================================== */}
      {activeTab === "pillar_pf" && (
        <div className="fade-in">
          {/* Controls */}
          <div style={{ background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", marginBottom: "var(--space-4)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", gap: "8px" }}>
              {["all", "active", "suspended", "closed"].map((st) => (
                <button
                  key={st}
                  onClick={() => handlePFFilterChange(st)}
                  style={{
                    padding: "6px 14px", borderRadius: "20px", fontSize: "0.82rem",
                    fontWeight: pfStatusFilter === st ? "700" : "500",
                    background: pfStatusFilter === st ? "var(--color-primary)" : "var(--color-surface-hover)",
                    color: pfStatusFilter === st ? "white" : "var(--color-text-secondary)",
                    border: "none", cursor: "pointer", textTransform: "capitalize"
                  }}
                >
                  {st}
                </button>
              ))}
            </div>

            <div style={{ position: "relative", width: "260px" }}>
              <Search size={15} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--color-text-muted)" }} />
              <input
                type="text"
                value={pfSearchQuery}
                onChange={handlePFSearch}
                placeholder="Search Pillar / Pillar ID..."
                className="input"
                style={{ paddingLeft: "32px", fontSize: "0.85rem", height: "36px" }}
              />
            </div>
          </div>

          {/* Accounts Table */}
          <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>Pillar</th>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>Pillar ID</th>
                    <th style={{ padding: "10px 14px", textAlign: "right" }}>Current Balance</th>
                    <th style={{ padding: "10px 14px", textAlign: "right" }}>Total Contributions</th>
                    <th style={{ padding: "10px 14px", textAlign: "right" }}>Withdrawals</th>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>Last Contribution</th>
                    <th style={{ padding: "10px 14px", textAlign: "center" }}>Status</th>
                    <th style={{ padding: "10px 14px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {pfAccounts.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "30px", textAlign: "center", color: "var(--color-text-secondary)" }}>
                        No PF accounts found.
                      </td>
                    </tr>
                  ) : (
                    pfAccounts.map((acc) => (
                      <tr key={acc.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "10px 14px" }}>
                          <div style={{ fontWeight: "700" }}>{acc.pillar?.full_name}</div>
                          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{Array.isArray(acc.pillar?.main_services) ? acc.pillar?.main_services.join(', ') : acc.pillar?.main_services}</div>
                        </td>
                        <td style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-primary)" }}>
                          {acc.pillar?.pillar_code || "PIL-CHE-000"}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "800", color: "#10B981", fontSize: "0.95rem" }}>
                          ₹ {acc.current_balance.toLocaleString("en-IN")}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "600" }}>
                          ₹ {acc.total_contributions.toLocaleString("en-IN")}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right", color: acc.total_withdrawals > 0 ? "#EF4444" : "var(--color-text-muted)", fontWeight: "600" }}>
                          ₹ {acc.total_withdrawals.toLocaleString("en-IN")}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                          {acc.last_contribution_at ? new Date(acc.last_contribution_at).toLocaleDateString() : "Never"}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <span style={{ 
                            fontSize: "0.72rem", fontWeight: "800", padding: "3px 8px", borderRadius: "10px",
                            background: acc.account_status === 'active' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                            color: acc.account_status === 'active' ? '#10B981' : '#EF4444',
                            textTransform: "uppercase"
                          }}>
                            {acc.account_status}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right" }}>
                          <button 
                            onClick={() => handleOpenPillarPFDetails(acc.pillar_id)}
                            className="btn btn-outline btn-sm"
                            style={{ fontSize: "0.78rem" }}
                          >
                            View Statement
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* TAB 3: GROUP INSURANCE */}
      {/* ============================================================================== */}
      {activeTab === "insurance" && (
        <div className="fade-in">
          {/* Master Policy Banner */}
          <div style={{ 
            background: "linear-gradient(135deg, rgba(255, 121, 0, 0.1) 0%, rgba(5, 10, 18, 0.9) 100%)", 
            padding: "var(--space-5)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-primary)",
            marginBottom: "var(--space-5)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <Shield size={22} color="var(--color-primary)" />
                  <h2 style={{ fontSize: "1.3rem", fontWeight: "800", margin: 0, color: "var(--color-text)" }}>
                    {insuranceData.policy?.policy_name || "COOP HUB Group Master Policy"}
                  </h2>
                  <span style={{ background: "rgba(16, 185, 129, 0.2)", color: "#10B981", padding: "2px 8px", borderRadius: "10px", fontSize: "0.72rem", fontWeight: "800" }}>
                    ACTIVE MASTER POLICY
                  </span>
                </div>
                <p style={{ color: "var(--color-text-secondary)", fontSize: "0.88rem", marginTop: "6px", marginBottom: "12px" }}>
                  Underwritten by <strong>{insuranceData.policy?.provider}</strong> | Policy Ref: <code>{insuranceData.policy?.id}</code>
                </p>
              </div>

              <div style={{ background: "rgba(255, 255, 255, 0.05)", padding: "4px 10px", borderRadius: "8px", fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                PROTOTYPE / REFERENCE INTEGRATION
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "var(--space-3)", marginTop: "10px" }}>
              <div style={{ background: "var(--color-surface)", padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>Coverage Per Pillar</div>
                <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "#10B981" }}>
                  ₹ {insuranceData.policy?.coverage_amount_per_pillar?.toLocaleString('en-IN') || "5,00,000"}
                </div>
              </div>
              <div style={{ background: "var(--color-surface)", padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>Active Insured Members</div>
                <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--color-primary)" }}>
                  {insuranceData.activeMembers} Pillars
                </div>
              </div>
              <div style={{ background: "var(--color-surface)", padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>Total Active Coverage</div>
                <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "var(--color-text)" }}>
                  ₹ {(insuranceData.totalCoverage / 100000).toFixed(1)} Lakhs
                </div>
              </div>
              <div style={{ background: "var(--color-surface)", padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>Monthly Premium Share</div>
                <div style={{ fontSize: "1.15rem", fontWeight: "800", color: "#3B82F6" }}>
                  ₹ {insuranceData.policy?.premium_per_pillar_monthly || "500"} / Month
                </div>
              </div>
            </div>
          </div>

          {/* Members Table */}
          <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
            <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h3 style={{ fontSize: "1.05rem", fontWeight: "800", margin: 0 }}>Insured Pillar Members</h3>
              <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>Individual policy certificates issued under Group Master Shield</span>
            </div>

            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>Pillar</th>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>Pillar ID</th>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>Member ID</th>
                    <th style={{ padding: "10px 14px", textAlign: "right" }}>Coverage</th>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>Nominee Details</th>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>Validity</th>
                    <th style={{ padding: "10px 14px", textAlign: "center" }}>Status</th>
                    <th style={{ padding: "10px 14px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {insuranceMembers.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "30px", textAlign: "center", color: "var(--color-text-secondary)" }}>
                        No insured members registered yet.
                      </td>
                    </tr>
                  ) : (
                    insuranceMembers.map((m) => (
                      <tr key={m.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "10px 14px", fontWeight: "700" }}>{m.pillar?.full_name}</td>
                        <td style={{ padding: "10px 14px", color: "var(--color-primary)", fontWeight: "700" }}>{m.pillar?.pillar_code || "PIL-CHE-000"}</td>
                        <td style={{ padding: "10px 14px", fontWeight: "700" }}>{m.member_id}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "700", color: "#10B981" }}>₹ {m.coverage_amount.toLocaleString('en-IN')}</td>
                        <td style={{ padding: "10px 14px", fontSize: "0.82rem" }}>{m.nominee_name || "Nominee Recorded"}</td>
                        <td style={{ padding: "10px 14px", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{m.start_date} to {m.expiry_date}</td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <span style={{ fontSize: "0.72rem", fontWeight: "800", padding: "2px 8px", borderRadius: "10px", background: "rgba(16, 185, 129, 0.15)", color: "#10B981" }}>
                            ACTIVE
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right" }}>
                          <button onClick={() => setSelectedMemberPolicy(m)} className="btn btn-outline btn-sm" style={{ fontSize: "0.78rem" }}>
                            View Policy
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* TAB 4: INSURANCE CLAIMS */}
      {/* ============================================================================== */}
      {activeTab === "claims" && (
        <div className="fade-in">
          {/* Status Tabs */}
          <div style={{ background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", marginBottom: "var(--space-4)", display: "flex", gap: "8px" }}>
            {["all", "submitted", "under_review", "approved", "rejected"].map((st) => (
              <button
                key={st}
                onClick={() => handleClaimFilterChange(st)}
                style={{
                  padding: "6px 14px", borderRadius: "20px", fontSize: "0.82rem",
                  fontWeight: claimsFilter === st ? "700" : "500",
                  background: claimsFilter === st ? "var(--color-primary)" : "var(--color-surface-hover)",
                  color: claimsFilter === st ? "white" : "var(--color-text-secondary)",
                  border: "none", cursor: "pointer", textTransform: "capitalize"
                }}
              >
                {st?.replace('_', ' ')}
              </button>
            ))}
          </div>

          {/* Claims Table */}
          <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", overflow: "hidden" }}>
            <div style={{ overflowX: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
                <thead>
                  <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>Claim ID</th>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>Pillar</th>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>Pillar ID</th>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>Claim Type</th>
                    <th style={{ padding: "10px 14px", textAlign: "right" }}>Claim Amount</th>
                    <th style={{ padding: "10px 14px", textAlign: "left" }}>Submitted Date</th>
                    <th style={{ padding: "10px 14px", textAlign: "center" }}>Status</th>
                    <th style={{ padding: "10px 14px", textAlign: "right" }}>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {claims.length === 0 ? (
                    <tr>
                      <td colSpan={8} style={{ padding: "30px", textAlign: "center", color: "var(--color-text-secondary)" }}>
                        No insurance claims found in this filter category.
                      </td>
                    </tr>
                  ) : (
                    claims.map((c) => (
                      <tr key={c.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "10px 14px", fontWeight: "700", color: "var(--color-primary)" }}>{c.claim_code}</td>
                        <td style={{ padding: "10px 14px", fontWeight: "700" }}>{c.pillar?.full_name}</td>
                        <td style={{ padding: "10px 14px", fontWeight: "600", color: "var(--color-secondary)" }}>{c.pillar?.pillar_code || c.member_id}</td>
                        <td style={{ padding: "10px 14px" }}>{c.claim_type}</td>
                        <td style={{ padding: "10px 14px", textAlign: "right", fontWeight: "800", color: "var(--color-text)" }}>
                          ₹ {c.claim_amount.toLocaleString('en-IN')}
                        </td>
                        <td style={{ padding: "10px 14px", fontSize: "0.8rem", color: "var(--color-text-muted)" }}>
                          {new Date(c.submitted_date).toLocaleDateString()}
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "center" }}>
                          <span style={{ 
                            fontSize: "0.72rem", fontWeight: "800", padding: "3px 8px", borderRadius: "10px",
                            background: c.status === 'approved' ? 'rgba(16, 185, 129, 0.15)' : c.status === 'rejected' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(245, 158, 11, 0.15)',
                            color: c.status === 'approved' ? '#10B981' : c.status === 'rejected' ? '#EF4444' : '#F59E0B',
                            textTransform: "uppercase"
                          }}>
                            {c.status?.replace('_', ' ')}
                          </span>
                        </td>
                        <td style={{ padding: "10px 14px", textAlign: "right" }}>
                          <button onClick={() => setSelectedClaim(c)} className="btn btn-primary btn-sm" style={{ fontSize: "0.78rem" }}>
                            Review Claim
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* TAB 5: GOVERNMENT WELFARE SCHEMES */}
      {/* ============================================================================== */}
      {activeTab === "schemes" && (
        <div className="fade-in">
          {/* Informational Header */}
          <div style={{ background: "rgba(59, 130, 246, 0.1)", border: "1px solid rgba(59, 130, 246, 0.3)", padding: "14px 18px", borderRadius: "var(--radius-lg)", marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "12px" }}>
            <Info size={22} color="#3B82F6" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: "0.85rem", color: "var(--color-text)", lineHeight: "1.4" }}>
              <strong>Government Welfare Schemes Directory:</strong> Verified Central & State Social Security Programs applicable to gig and unorganised tradesmen. This informational database assists administrators in guiding eligible Pillars to claim government benefits.
            </div>
          </div>

          {/* Controls */}
          <div style={{ background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", marginBottom: "var(--space-4)", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {["all", "Financial Assistance", "Insurance", "Pension", "Healthcare"].map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleSchemeFilterChange(cat)}
                  style={{
                    padding: "6px 12px", borderRadius: "20px", fontSize: "0.8rem",
                    fontWeight: schemeCategoryFilter === cat ? "700" : "500",
                    background: schemeCategoryFilter === cat ? "var(--color-primary)" : "var(--color-surface-hover)",
                    color: schemeCategoryFilter === cat ? "white" : "var(--color-text-secondary)",
                    border: "none", cursor: "pointer"
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div style={{ position: "relative", width: "260px" }}>
              <Search size={15} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--color-text-muted)" }} />
              <input
                type="text"
                value={schemeSearchQuery}
                onChange={handleSchemeSearch}
                placeholder="Search Schemes..."
                className="input"
                style={{ paddingLeft: "32px", fontSize: "0.85rem", height: "36px" }}
              />
            </div>
          </div>

          {/* Schemes Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-4)" }}>
            {schemes.map((s) => (
              <div 
                key={s.id} 
                style={{ 
                  background: "var(--color-surface)", borderRadius: "var(--radius-lg)", 
                  border: "1px solid var(--color-border)", padding: "var(--space-5)",
                  display: "flex", flexDirection: "column", justifyContent: "space-between"
                }}
              >
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                    <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "var(--color-primary)", background: "rgba(255, 121, 0, 0.15)", padding: "2px 8px", borderRadius: "6px" }}>
                      {s.category}
                    </span>
                    <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                      Ref: {s.scheme_code}
                    </span>
                  </div>

                  <h3 style={{ fontSize: "1.05rem", fontWeight: "800", color: "var(--color-text)", marginBottom: "4px" }}>
                    {s.scheme_name}
                  </h3>
                  <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", marginBottom: "10px", fontWeight: "600" }}>
                    🏛️ {s.department}
                  </div>

                  <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: "1.45", marginBottom: "12px" }}>
                    {s.description}
                  </p>

                  <div style={{ background: "var(--color-surface-hover)", padding: "10px", borderRadius: "8px", fontSize: "0.8rem", marginBottom: "12px" }}>
                    <strong style={{ color: "#10B981" }}>Key Benefits: </strong> {s.benefits}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--color-border)", paddingTop: "12px", marginTop: "8px" }}>
                  <span style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                    Updated {s.last_updated}
                  </span>
                  <button onClick={() => setSelectedScheme(s)} className="btn btn-outline btn-sm" style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.8rem" }}>
                    View Eligibility & Details <ChevronRight size={14} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* TAB 6: PF WITHDRAWAL REQUESTS WORKFLOW */}
      {/* ============================================================================== */}
      {activeTab === "withdrawals" && (
        <div className="fade-in">
          {/* Header Description */}
          <div style={{ background: "rgba(255, 121, 0, 0.08)", border: "1px solid rgba(255, 121, 0, 0.25)", padding: "14px 18px", borderRadius: "var(--radius-lg)", marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "12px" }}>
            <Landmark size={22} color="var(--color-primary)" style={{ flexShrink: 0 }} />
            <div style={{ fontSize: "0.85rem", color: "var(--color-text)", lineHeight: "1.4" }}>
              <strong>PF Withdrawal Authorizations:</strong> Review, verify, and approve technician provident fund withdrawals. Approvals perform automatic balance validation, update the immutable ledger in <code>pf_transactions</code>, adjust live balances, and dispatch in-app notifications.
            </div>
          </div>

          {/* Filters Bar */}
          <div style={{ 
            background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", 
            border: "1px solid var(--color-border)", marginBottom: "var(--space-4)", 
            display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" 
          }}>
            <div style={{ display: "flex", gap: "6px" }}>
              {[
                { id: "all", label: "All Requests" },
                { id: "pending", label: `Pending (${pfWithdrawals.filter(w => w.status === 'pending').length})` },
                { id: "approved", label: "Approved" },
                { id: "rejected", label: "Declined" }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => handleWithdrawalFilterChange(f.id)}
                  style={{
                    padding: "6px 14px", borderRadius: "20px", fontSize: "0.82rem",
                    fontWeight: withdrawalFilter === f.id ? "700" : "500",
                    background: withdrawalFilter === f.id ? "var(--color-primary)" : "var(--color-surface-hover)",
                    color: withdrawalFilter === f.id ? "white" : "var(--color-text-secondary)",
                    border: "none", cursor: "pointer"
                  }}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div style={{ position: "relative", width: "260px" }}>
              <Search size={15} style={{ position: "absolute", left: "10px", top: "10px", color: "var(--color-text-muted)" }} />
              <input
                type="text"
                value={withdrawalSearchQuery}
                onChange={(e) => setWithdrawalSearchQuery(e.target.value)}
                placeholder="Search Pillar, Ref Code..."
                className="input"
                style={{ paddingLeft: "32px", fontSize: "0.85rem", height: "36px" }}
              />
            </div>
          </div>

          {/* Withdrawals Table */}
          <div style={{ 
            background: "var(--color-surface)", borderRadius: "var(--radius-lg)", 
            border: "1px solid var(--color-border)", overflow: "hidden", boxShadow: "var(--shadow-sm)" 
          }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Pillar</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Reference</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Reason / Purpose</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Requested Amount</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Date</th>
                  <th style={{ padding: "12px 16px", textAlign: "center" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {pfWithdrawals
                  .filter(w => {
                    const q = withdrawalSearchQuery.toLowerCase();
                    const matchQ = (w.pillar?.full_name || "").toLowerCase().includes(q) ||
                      (w.withdrawal_code || "").toLowerCase().includes(q) ||
                      (w.reason || "").toLowerCase().includes(q);
                    return matchQ;
                  })
                  .map((wdr) => (
                    <tr key={wdr.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: "700", color: "var(--color-text)" }}>{wdr.pillar?.full_name || "Technician"}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{wdr.pillar?.pillar_code || "PIL-000"} • {wdr.pillar?.mobile || "N/A"}</div>
                      </td>
                      <td style={{ padding: "12px 16px", fontWeight: "700", color: "var(--color-primary)" }}>
                        {wdr.withdrawal_code || "WDR-0000"}
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--color-text)", maxWidth: "240px" }}>
                        {wdr.reason || "PF Balance Withdrawal"}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right", fontWeight: "800", color: "#10B981", fontSize: "0.95rem" }}>
                        ₹ {Number(wdr.amount).toLocaleString('en-IN')}
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--color-text-muted)" }}>
                        {new Date(wdr.requested_at || Date.now()).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "800",
                          background: wdr.status === "approved" ? "rgba(16, 185, 129, 0.15)" : wdr.status === "rejected" ? "rgba(239, 68, 68, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          color: wdr.status === "approved" ? "#10B981" : wdr.status === "rejected" ? "#EF4444" : "#F59E0B"
                        }}>
                          {wdr.status?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedWithdrawal(wdr)}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: "0.8rem", fontWeight: "700" }}
                        >
                          Verify & Review
                        </button>
                      </td>
                    </tr>
                  ))}
                {pfWithdrawals.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "var(--color-text-muted)" }}>
                      No PF withdrawal requests found matching the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* TAB 7: WELFARE ASSISTANCE REQUESTS */}
      {/* ============================================================================== */}
      {activeTab === "assistance" && (
        <div>
          {/* Header & Truthful Notice */}
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-4)", flexWrap: "wrap", gap: "12px" }}>
            <div>
              <h2 style={{ fontSize: "1.25rem", fontWeight: "800", margin: 0 }}>
                Pillar Scheme Assistance Control
              </h2>
              <p style={{ color: "var(--color-text-secondary)", fontSize: "0.85rem", margin: "4px 0 0 0" }}>
                Review and support Pillar applications for state & central unorganised worker welfare schemes.
              </p>
            </div>
            {/* Filter Tabs */}
            <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
              {["all", "requested", "under_review", "documents_required", "submitted", "completed", "rejected"].map((st) => (
                <button
                  key={st}
                  onClick={() => setAssistFilter(st)}
                  className={`btn btn-xs ${assistFilter === st ? "btn-primary" : "btn-outline"}`}
                  style={{ textTransform: "capitalize", fontSize: "0.75rem" }}
                >
                  {st.replace('_', ' ')}
                </button>
              ))}
            </div>
          </div>

          <div style={{
            background: "rgba(59, 130, 246, 0.08)", border: "1px solid rgba(59, 130, 246, 0.25)",
            padding: "10px 14px", borderRadius: "8px", fontSize: "0.8rem", color: "var(--color-text-secondary)",
            marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "8px"
          }}>
            <Info size={16} color="#3B82F6" />
            <span>
              <strong>Truthful Operational Status:</strong> External government portal APIs remain <strong>NOT CONFIGURED</strong>. Marking an assistance request as "submitted" or "completed" indicates manual cooperative facilitation, documentation assistance, or offline e-Seva submission.
            </span>
          </div>

          <div className="card" style={{ padding: 0, overflow: "hidden" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Request Ref</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Pillar</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Scheme Name</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Submitted</th>
                  <th style={{ padding: "12px 16px", textAlign: "center" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "left" }}>Cooperative Notes</th>
                  <th style={{ padding: "12px 16px", textAlign: "right" }}>Workflow Actions</th>
                </tr>
              </thead>
              <tbody>
                {assistanceRequests
                  .filter(r => assistFilter === 'all' || r.status === assistFilter)
                  .map((req) => (
                    <tr key={req.id} style={{ borderBottom: "1px solid var(--color-border-light)" }}>
                      <td style={{ padding: "12px 16px", fontWeight: "700" }}>{req.id.slice(0, 8)}</td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: "700" }}>{req.pillar?.full_name || "Pillar " + req.pillar_id.slice(0, 6)}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{req.pillar?.mobile || "ID: " + req.pillar_id.slice(0, 8)}</div>
                      </td>
                      <td style={{ padding: "12px 16px" }}>
                        <div style={{ fontWeight: "700", color: "var(--color-secondary)" }}>{req.scheme?.scheme_name || req.scheme_code}</div>
                        <div style={{ fontSize: "0.72rem", color: "var(--color-text-muted)" }}>{req.scheme?.department || "Statutory Board"}</div>
                      </td>
                      <td style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>
                        {new Date(req.created_at).toLocaleDateString()}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <span style={{
                          padding: "3px 10px", borderRadius: "12px", fontSize: "0.72rem", fontWeight: "800", textTransform: "uppercase",
                          background: req.status === "completed" ? "rgba(16, 185, 129, 0.15)" : req.status === "rejected" ? "rgba(239, 68, 68, 0.15)" : req.status === "submitted" ? "rgba(139, 92, 246, 0.15)" : "rgba(245, 158, 11, 0.15)",
                          color: req.status === "completed" ? "#10B981" : req.status === "rejected" ? "#EF4444" : req.status === "submitted" ? "#8B5CF6" : "#F59E0B"
                        }}>
                          {req.status?.replace('_', ' ')}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", fontSize: "0.8rem", color: "var(--color-text-secondary)", maxWidth: "220px" }}>
                        {req.admin_notes || req.rejection_reason || "No notes"}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "right" }}>
                        <div style={{ display: "flex", gap: "6px", justifyContent: "flex-end" }}>
                          {req.status === "requested" && (
                            <button
                              onClick={() => handleUpdateAssist(req.id, "under_review")}
                              disabled={assistActionLoading}
                              className="btn btn-primary btn-xs"
                            >
                              Review
                            </button>
                          )}
                          {req.status === "under_review" && (
                            <>
                              <button
                                onClick={() => handleUpdateAssist(req.id, "documents_required")}
                                disabled={assistActionLoading}
                                className="btn btn-outline btn-xs"
                              >
                                Need Docs
                              </button>
                              <button
                                onClick={() => handleUpdateAssist(req.id, "submitted")}
                                disabled={assistActionLoading}
                                className="btn btn-primary btn-xs"
                              >
                                Mark Submitted
                              </button>
                            </>
                          )}
                          {req.status === "submitted" && (
                            <button
                              onClick={() => handleUpdateAssist(req.id, "completed")}
                              disabled={assistActionLoading}
                              className="btn btn-primary btn-xs"
                              style={{ background: "#10B981", borderColor: "#10B981" }}
                            >
                              Complete
                            </button>
                          )}
                          {req.status !== "completed" && req.status !== "rejected" && (
                            <button
                              onClick={() => handleUpdateAssist(req.id, "rejected")}
                              disabled={assistActionLoading}
                              className="btn btn-outline btn-xs"
                              style={{ color: "#EF4444", borderColor: "rgba(239, 68, 68, 0.4)" }}
                            >
                              Decline
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                {assistanceRequests.filter(r => assistFilter === 'all' || r.status === assistFilter).length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: "30px", textAlign: "center", color: "var(--color-text-muted)" }}>
                      No welfare assistance requests found matching the current filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL 1: INDIVIDUAL PILLAR PF WORKSPACE */}
      {/* ============================================================================== */}
      {selectedPillarPF && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.8)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)"
        }}>
          <div style={{
            background: "var(--color-surface)", width: "100%", maxWidth: "750px", maxHeight: "90vh",
            borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)",
            display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--shadow-xl)"
          }}>
            {/* Modal Header */}
            <div style={{ padding: "var(--space-4) var(--space-5)", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "800", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Landmark size={20} color="var(--color-primary)" />
                  Pillar PF Statement: {selectedPillarPF.account?.pillar?.full_name}
                </h2>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                  Pillar Code: <strong>{selectedPillarPF.account?.pillar?.pillar_code || "PIL-CHE-042"}</strong> | Mobile: {selectedPillarPF.account?.pillar?.mobile}
                </span>
              </div>
              <button onClick={() => setSelectedPillarPF(null)} className="btn btn-ghost btn-sm" style={{ padding: "6px" }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "var(--space-5)", overflowY: "auto", flex: 1 }}>
              {/* Financial Snapshot */}
              <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "10px", marginBottom: "var(--space-5)" }}>
                <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>Current PF Balance</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: "800", color: "#10B981" }}>
                    ₹ {selectedPillarPF.account?.current_balance?.toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>Pillar Share (50%)</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--color-text)" }}>
                    ₹ {selectedPillarPF.account?.pillar_contribution_total?.toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>Coop Matched Share (50%)</div>
                  <div style={{ fontSize: "1.1rem", fontWeight: "700", color: "var(--color-primary)" }}>
                    ₹ {selectedPillarPF.account?.coop_contribution_total?.toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Transactions History */}
              <h4 style={{ fontSize: "0.95rem", fontWeight: "800", marginBottom: "10px" }}>PF Ledger History</h4>
              <div style={{ border: "1px solid var(--color-border)", borderRadius: "8px", overflow: "hidden" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.82rem" }}>
                  <thead>
                    <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                      <th style={{ padding: "8px 12px", textAlign: "left" }}>Date</th>
                      <th style={{ padding: "8px 12px", textAlign: "left" }}>Txn ID</th>
                      <th style={{ padding: "8px 12px", textAlign: "left" }}>Description</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Credit</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Debit</th>
                      <th style={{ padding: "8px 12px", textAlign: "right" }}>Balance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedPillarPF.transactions?.map((tx) => (
                      <tr key={tx.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                        <td style={{ padding: "8px 12px", color: "var(--color-text-muted)" }}>{new Date(tx.created_at).toLocaleDateString()}</td>
                        <td style={{ padding: "8px 12px", fontWeight: "700", color: "var(--color-primary)" }}>{tx.transaction_code}</td>
                        <td style={{ padding: "8px 12px" }}>{tx.description}</td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: "#10B981", fontWeight: "700" }}>
                          {tx.credit > 0 ? `+ ₹${tx.credit}` : "-"}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right", color: "#EF4444", fontWeight: "700" }}>
                          {tx.debit > 0 ? `- ₹${tx.debit}` : "-"}
                        </td>
                        <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: "800" }}>₹ {tx.balance_after?.toLocaleString('en-IN')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "var(--space-4) var(--space-5)", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button 
                onClick={() => alert("Statement summary prepared for export.")} 
                className="btn btn-outline btn-sm" 
                style={{ display: "flex", alignItems: "center", gap: "6px" }}
              >
                <Download size={15} /> Download Statement Summary
              </button>
              <button onClick={() => setSelectedPillarPF(null)} className="btn btn-primary btn-sm">
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL 2: CLAIM VERIFICATION WORKSPACE */}
      {/* ============================================================================== */}
      {selectedClaim && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.8)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)"
        }}>
          <div style={{
            background: "var(--color-surface)", width: "100%", maxWidth: "700px", maxHeight: "90vh",
            borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)",
            display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--shadow-xl)"
          }}>
            {/* Modal Header */}
            <div style={{ padding: "var(--space-4) var(--space-5)", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "800", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Shield size={20} color="var(--color-primary)" />
                  Insurance Claim Review: {selectedClaim.claim_code}
                </h2>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                  Applicant: <strong>{selectedClaim.pillar?.full_name} ({selectedClaim.pillar?.pillar_code || selectedClaim.member_id})</strong>
                </span>
              </div>
              <button onClick={() => setSelectedClaim(null)} className="btn btn-ghost btn-sm" style={{ padding: "6px" }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "var(--space-5)", overflowY: "auto", flex: 1 }}>
              {/* Claim Overview Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "var(--space-4)" }}>
                <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>Claim Amount</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: "800", color: "#10B981" }}>
                    ₹ {selectedClaim.claim_amount?.toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>Claim Type & Category</div>
                  <div style={{ fontSize: "1.05rem", fontWeight: "700", color: "var(--color-text)" }}>
                    {selectedClaim.claim_type}
                  </div>
                </div>
                <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>Hospital / Healthcare Facility</div>
                  <div style={{ fontSize: "0.88rem", fontWeight: "600", color: "var(--color-text)" }}>
                    {selectedClaim.hospital_name || "Apollo Hospital, Chennai"}
                  </div>
                </div>
                <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>Incident Date</div>
                  <div style={{ fontSize: "0.88rem", fontWeight: "600", color: "var(--color-text)" }}>
                    {selectedClaim.incident_date}
                  </div>
                </div>
              </div>

              {/* Rejection notice if already rejected */}
              {selectedClaim.status === 'rejected' && (
                <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #EF4444", padding: "12px", borderRadius: "8px", marginBottom: "var(--space-4)" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#EF4444", textTransform: "uppercase" }}>Claim Rejected</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-text)", marginTop: "4px" }}>
                    Reason: <strong>{selectedClaim.rejection_reason || "Non-qualifying incident claim documentation."}</strong>
                  </div>
                </div>
              )}

              {/* Submitted Documentation */}
              <h4 style={{ fontSize: "0.95rem", fontWeight: "800", marginBottom: "8px" }}>Attached Verification Documents</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "var(--space-4)" }}>
                {(selectedClaim.submitted_documents || [
                  { name: "Hospital Discharge Summary & Inpatient Bill", size: "2.4 MB" },
                  { name: "Attending Doctor Medical Certificate", size: "1.1 MB" }
                ]).map((doc, i) => (
                  <div key={i} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "var(--color-surface-hover)", padding: "10px 14px", borderRadius: "8px", border: "1px solid var(--color-border)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <FileText size={18} color="var(--color-primary)" />
                      <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>{doc.name}</span>
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{doc.size || "1.5 MB"}</span>
                  </div>
                ))}
              </div>

              {/* Admin Inspection Notes */}
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                  Administrative Review Notes
                </label>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  placeholder="Enter internal inspection notes regarding policy coverage eligibility..."
                  className="input"
                  style={{ width: "100%", height: "60px", fontSize: "0.85rem" }}
                />
              </div>
            </div>

            {/* Modal Footer Actions */}
            <div style={{ padding: "var(--space-4) var(--space-5)", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => setSelectedClaim(null)} className="btn btn-outline btn-sm">
                Close Workspace
              </button>

              {selectedClaim.status !== 'approved' && selectedClaim.status !== 'rejected' && (
                <div style={{ display: "flex", gap: "10px" }}>
                  <button 
                    onClick={() => setShowRejectModal(true)} 
                    className="btn btn-sm" 
                    style={{ background: "rgba(239, 68, 68, 0.15)", color: "#EF4444", border: "1px solid #EF4444", fontWeight: "700" }}
                  >
                    Decline / Reject Claim
                  </button>
                  <button 
                    onClick={() => handleApproveClaim(selectedClaim.id)} 
                    disabled={claimActionLoading}
                    className="btn btn-primary btn-sm" 
                    style={{ fontWeight: "700" }}
                  >
                    Authorize & Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL 3: MANDATORY REJECTION REASON PROMPT */}
      {/* ============================================================================== */}
      {showRejectModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.85)", zIndex: 10000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)"
        }}>
          <div style={{
            background: "var(--color-surface)", width: "100%", maxWidth: "480px",
            borderRadius: "var(--radius-lg)", border: "1px solid #EF4444", padding: "var(--space-5)",
            boxShadow: "var(--shadow-xl)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <AlertTriangle size={24} color="#EF4444" />
              <h3 style={{ fontSize: "1.15rem", fontWeight: "800", margin: 0, color: "#EF4444" }}>
                Mandatory Rejection Reason
              </h3>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: "1.4", marginBottom: "14px" }}>
              Please state the specific reason for rejecting claim <strong>{selectedClaim?.claim_code}</strong>. This explanation will be logged and dispatched directly to the Pillar.
            </p>

            <form onSubmit={handleRejectClaimSubmit}>
              <textarea
                required
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="e.g. Claim documents do not match incident dates or treatment is outside eligible policy coverage scope..."
                className="input"
                style={{ width: "100%", height: "90px", fontSize: "0.85rem", marginBottom: "var(--space-4)" }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowRejectModal(false)} className="btn btn-outline btn-sm">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={claimActionLoading || !rejectionReason.trim()}
                  className="btn btn-sm"
                  style={{ background: "#EF4444", color: "white", fontWeight: "700", border: "none" }}
                >
                  Confirm Rejection & Dispatch Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL 4: GOVERNMENT SCHEME DETAILS */}
      {/* ============================================================================== */}
      {selectedScheme && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.8)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)"
        }}>
          <div style={{
            background: "var(--color-surface)", width: "100%", maxWidth: "650px", maxHeight: "90vh",
            borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)",
            display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--shadow-xl)"
          }}>
            {/* Modal Header */}
            <div style={{ padding: "var(--space-4) var(--space-5)", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <span style={{ fontSize: "0.72rem", fontWeight: "800", color: "var(--color-primary)", textTransform: "uppercase" }}>
                  {selectedScheme.category} Scheme
                </span>
                <h2 style={{ fontSize: "1.15rem", fontWeight: "800", margin: 0, marginTop: "2px" }}>
                  {selectedScheme.scheme_name}
                </h2>
              </div>
              <button onClick={() => setSelectedScheme(null)} className="btn btn-ghost btn-sm" style={{ padding: "6px" }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "var(--space-5)", overflowY: "auto", flex: 1, fontSize: "0.88rem", lineHeight: "1.5" }}>
              <div style={{ marginBottom: "14px" }}>
                <h4 style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Governing Department</h4>
                <p style={{ margin: 0, fontWeight: "600" }}>{selectedScheme.department}</p>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <h4 style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Key Benefits</h4>
                <div style={{ background: "var(--color-surface-hover)", padding: "10px", borderRadius: "8px", color: "#10B981", fontWeight: "600" }}>
                  {selectedScheme.benefits}
                </div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <h4 style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Eligibility Criteria</h4>
                <p style={{ margin: 0 }}>{selectedScheme.eligibility}</p>
              </div>

              <div style={{ marginBottom: "14px" }}>
                <h4 style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>Required Documents</h4>
                <ul style={{ margin: 0, paddingLeft: "20px" }}>
                  {selectedScheme.required_documents?.map((doc, i) => (
                    <li key={i}>{doc}</li>
                  ))}
                </ul>
              </div>

              <div>
                <h4 style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase" }}>How to Apply</h4>
                <p style={{ margin: 0 }}>{selectedScheme.application_process}</p>
              </div>
            </div>

            {/* Modal Footer */}
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

      {/* ============================================================================== */}
      {/* MODAL 5: ALL TRANSACTIONS AUDIT LEDGER */}
      {/* ============================================================================== */}
      {showAllTransactionsModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.8)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)"
        }}>
          <div style={{
            background: "var(--color-surface)", width: "100%", maxWidth: "850px", maxHeight: "90vh",
            borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)",
            display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--shadow-xl)"
          }}>
            <div style={{ padding: "var(--space-4) var(--space-5)", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "800", margin: 0 }}>Complete Cooperative PF Audit Ledger</h2>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>Detailed chronological financial transaction journal</span>
              </div>
              <button onClick={() => setShowAllTransactionsModal(false)} className="btn btn-ghost btn-sm" style={{ padding: "6px" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ padding: "var(--space-5)", overflowY: "auto", flex: 1 }}>
              <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
                <thead>
                  <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>Date</th>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>Txn ID</th>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>Pillar</th>
                    <th style={{ padding: "8px 12px", textAlign: "left" }}>Description</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Credit</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Debit</th>
                    <th style={{ padding: "8px 12px", textAlign: "right" }}>Balance</th>
                  </tr>
                </thead>
                <tbody>
                  {pfFundData.recentTransactions.map((tx) => (
                    <tr key={tx.id} style={{ borderBottom: "1px solid var(--color-border)" }}>
                      <td style={{ padding: "8px 12px", color: "var(--color-text-muted)" }}>{new Date(tx.created_at).toLocaleDateString()}</td>
                      <td style={{ padding: "8px 12px", fontWeight: "700", color: "var(--color-primary)" }}>{tx.transaction_code}</td>
                      <td style={{ padding: "8px 12px", fontWeight: "700" }}>{tx.pillar?.full_name}</td>
                      <td style={{ padding: "8px 12px" }}>{tx.description}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", color: "#10B981", fontWeight: "700" }}>{tx.credit > 0 ? `+ ₹${tx.credit}` : "-"}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", color: "#EF4444", fontWeight: "700" }}>{tx.debit > 0 ? `- ₹${tx.debit}` : "-"}</td>
                      <td style={{ padding: "8px 12px", textAlign: "right", fontWeight: "800" }}>₹ {tx.balance_after?.toLocaleString('en-IN')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div style={{ padding: "var(--space-4) var(--space-5)", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "flex-end" }}>
              <button onClick={() => setShowAllTransactionsModal(false)} className="btn btn-primary btn-sm">
                Close Ledger
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL 6: WITHDRAWAL VERIFICATION MODAL */}
      {/* ============================================================================== */}
      {selectedWithdrawal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.8)", zIndex: 9999,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)"
        }}>
          <div style={{
            background: "var(--color-surface)", width: "100%", maxWidth: "680px", maxHeight: "90vh",
            borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)",
            display: "flex", flexDirection: "column", overflow: "hidden", boxShadow: "var(--shadow-xl)"
          }}>
            {/* Modal Header */}
            <div style={{ padding: "var(--space-4) var(--space-5)", borderBottom: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <h2 style={{ fontSize: "1.2rem", fontWeight: "800", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Landmark size={20} color="var(--color-primary)" />
                  PF Withdrawal Review: {selectedWithdrawal.withdrawal_code}
                </h2>
                <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)" }}>
                  Applicant: <strong>{selectedWithdrawal.pillar?.full_name} ({selectedWithdrawal.pillar?.pillar_code || "PIL-000"})</strong>
                </span>
              </div>
              <button onClick={() => setSelectedWithdrawal(null)} className="btn btn-ghost btn-sm" style={{ padding: "6px" }}>
                <X size={20} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "var(--space-5)", overflowY: "auto", flex: 1 }}>
              {/* Financial Snapshot */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "10px", marginBottom: "var(--space-4)" }}>
                <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>Requested Amount</div>
                  <div style={{ fontSize: "1.3rem", fontWeight: "800", color: "#10B981" }}>
                    ₹ {Number(selectedWithdrawal.amount).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>Current Available Balance</div>
                  <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "var(--color-text)" }}>
                    ₹ {Number(selectedWithdrawal.current_balance || 39200).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>Worker Contribution Share (50%)</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--color-text)" }}>
                    ₹ {Number((selectedWithdrawal.current_balance || 39200) / 2).toLocaleString('en-IN')}
                  </div>
                </div>
                <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "8px" }}>
                  <div style={{ fontSize: "0.72rem", color: "var(--color-text-secondary)" }}>Coop Matched Share (50%)</div>
                  <div style={{ fontSize: "0.95rem", fontWeight: "700", color: "var(--color-primary)" }}>
                    ₹ {Number((selectedWithdrawal.current_balance || 39200) / 2).toLocaleString('en-IN')}
                  </div>
                </div>
              </div>

              {/* Purpose & Application Notes */}
              <div style={{ background: "var(--color-surface-hover)", padding: "14px", borderRadius: "8px", border: "1px solid var(--color-border)", marginBottom: "var(--space-4)" }}>
                <div style={{ fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase", marginBottom: "4px" }}>
                  Reason for Withdrawal
                </div>
                <div style={{ fontSize: "0.92rem", fontWeight: "600", color: "var(--color-text)" }}>
                  {selectedWithdrawal.reason || "PF Balance Advance / Medical Treatment"}
                </div>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "6px" }}>
                  Submitted on: {new Date(selectedWithdrawal.requested_at || Date.now()).toLocaleString()}
                </div>
              </div>

              {/* Rejection Notice if already rejected */}
              {selectedWithdrawal.status === 'rejected' && (
                <div style={{ background: "rgba(239, 68, 68, 0.15)", border: "1px solid #EF4444", padding: "12px", borderRadius: "8px", marginBottom: "var(--space-4)" }}>
                  <div style={{ fontSize: "0.75rem", fontWeight: "800", color: "#EF4444", textTransform: "uppercase" }}>Withdrawal Declined</div>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-text)", marginTop: "4px" }}>
                    Reason: <strong>{selectedWithdrawal.rejection_reason || "Insufficient documentation or invalid withdrawal criteria."}</strong>
                  </div>
                </div>
              )}

              {/* Administrative Inspection Notes */}
              {selectedWithdrawal.status === 'pending' && (
                <div>
                  <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                    Administrative Processing Notes
                  </label>
                  <textarea
                    value={withdrawalAdminNotes}
                    onChange={(e) => setWithdrawalAdminNotes(e.target.value)}
                    placeholder="Enter internal inspection notes regarding eligibility and disbursement authorization..."
                    className="input"
                    style={{ width: "100%", height: "60px", fontSize: "0.85rem" }}
                  />
                </div>
              )}
            </div>

            {/* Modal Footer Actions */}
            <div style={{ padding: "var(--space-4) var(--space-5)", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button onClick={() => setSelectedWithdrawal(null)} className="btn btn-outline btn-sm">
                Close Workspace
              </button>

              {selectedWithdrawal.status === 'pending' && (
                <div style={{ display: "flex", gap: "10px" }}>
                  <button 
                    onClick={() => setShowRejectWithdrawalModal(true)} 
                    className="btn btn-sm" 
                    style={{ background: "rgba(239, 68, 68, 0.15)", color: "#EF4444", border: "1px solid #EF4444", fontWeight: "700" }}
                  >
                    Decline / Reject
                  </button>
                  <button 
                    onClick={() => handleApproveWithdrawal(selectedWithdrawal.id)} 
                    disabled={withdrawalActionLoading}
                    className="btn btn-primary btn-sm" 
                    style={{ fontWeight: "700" }}
                  >
                    Authorize & Approve
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================================== */}
      {/* MODAL 7: MANDATORY WITHDRAWAL REJECTION REASON PROMPT */}
      {/* ============================================================================== */}
      {showRejectWithdrawalModal && (
        <div style={{
          position: "fixed", inset: 0, background: "rgba(0, 0, 0, 0.85)", zIndex: 10000,
          display: "flex", alignItems: "center", justifyContent: "center", padding: "var(--space-4)"
        }}>
          <div style={{
            background: "var(--color-surface)", width: "100%", maxWidth: "480px",
            borderRadius: "var(--radius-lg)", border: "1px solid #EF4444", padding: "var(--space-5)",
            boxShadow: "var(--shadow-xl)"
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
              <AlertTriangle size={24} color="#EF4444" />
              <h3 style={{ fontSize: "1.15rem", fontWeight: "800", margin: 0, color: "#EF4444" }}>
                Mandatory Rejection Reason
              </h3>
            </div>

            <p style={{ fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: "1.4", marginBottom: "14px" }}>
              Please state the specific reason for declining PF withdrawal request <strong>{selectedWithdrawal?.withdrawal_code}</strong>. This explanation will be logged in the immutable audit trail and dispatched to the Pillar.
            </p>

            <form onSubmit={handleRejectWithdrawalSubmit}>
              <textarea
                required
                value={withdrawalRejectReason}
                onChange={(e) => setWithdrawalRejectReason(e.target.value)}
                placeholder="e.g. Requested amount exceeds maximum 50% eligible limit or withdrawal reason is not eligible under cooperative rules..."
                className="input"
                style={{ width: "100%", height: "90px", fontSize: "0.85rem", marginBottom: "var(--space-4)" }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" onClick={() => setShowRejectWithdrawalModal(false)} className="btn btn-outline btn-sm">
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={withdrawalActionLoading || !withdrawalRejectReason.trim()}
                  className="btn btn-sm"
                  style={{ background: "#EF4444", color: "white", fontWeight: "700", border: "none" }}
                >
                  Confirm Rejection & Dispatch Notice
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
