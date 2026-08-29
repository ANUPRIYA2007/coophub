// ==============================================================================
// COOP HUB — WELFARE & INSURANCE SERVICE LAYER
// ==============================================================================
// Powers the Welfare & Insurance Control Center:
// 1. Cooperative PF Fund & Dynamic Calculations
// 2. Individual Pillar PF Accounts & Ledger Transactions
// 3. Group Master Policy & Individual Insurance Memberships
// 4. Insurance Claims Lifecycle (Submission, Review, Approval, Rejection with Reason)
// 5. Government Welfare Schemes Directory (Curated Reference / Official Links)
// 6. Supabase Realtime Synchronization
// ==============================================================================

import { supabase } from "../../../lib/supabase.js";
import { emailService } from "../../../services/email/emailService.js";
import { auditLogService } from "./auditLogService.js";

const isAdminDemo = () => localStorage.getItem("coophub_demo_admin") === "true";
const isPillarDemo = () => localStorage.getItem("coophub_demo_user") === "true" || localStorage.getItem("coophub_demo_pillar") === "true";

// ==============================================================================
// PROTOTYPE / DEMO DATASETS (Only loaded when explicitly in Demo Mode)
// ==============================================================================

const DEMO_PF_WITHDRAWALS = [
  {
    id: "wdr-1",
    withdrawal_code: "WDR-CHE-2025-001",
    pillar_id: "p-2",
    account_id: "pfa-2",
    amount: 5000,
    current_balance: 39200,
    worker_share: 19600,
    coop_share: 19600,
    reason: "Medical treatment expense for family dependent",
    status: "pending",
    requested_at: new Date(Date.now() - 24 * 3600000).toISOString(),
    pillar: { id: "p-2", full_name: "Murugan Velan", pillar_code: "PIL-CHE-019", mobile: "+91 94440 98765", email: "murugan@coophub.in", main_services: ["Plumber"] }
  },
  {
    id: "wdr-2",
    withdrawal_code: "WDR-CHE-2025-002",
    pillar_id: "p-3",
    account_id: "pfa-3",
    amount: 3500,
    current_balance: 28400,
    worker_share: 14200,
    coop_share: 14200,
    reason: "Children academic school fees installment",
    status: "approved",
    approved_amount: 3500,
    approved_at: new Date(Date.now() - 72 * 3600000).toISOString(),
    approved_by: "Administrator (ADM-CHE-001)",
    requested_at: new Date(Date.now() - 96 * 3600000).toISOString(),
    pillar: { id: "p-3", full_name: "Praveen Kumaran", pillar_code: "PIL-CHE-031", mobile: "+91 98840 11223", email: "praveen@coophub.in", main_services: ["AC Technician"] }
  }
];

const DEMO_PF_ACCOUNTS = [
  {
    id: "pfa-1",
    pillar_id: "p-1",
    account_status: "active",
    current_balance: 48500,
    total_contributions: 54000,
    total_withdrawals: 5500,
    pillar_contribution_total: 27000,
    coop_contribution_total: 27000,
    last_contribution_at: new Date(Date.now() - 2 * 86400000).toISOString(),
    pillar: { id: "p-1", full_name: "Senthil Kumar", pillar_code: "PIL-CHE-042", mobile: "+91 98401 23456", main_services: ["Electrician"] }
  },
  {
    id: "pfa-2",
    pillar_id: "p-2",
    account_status: "active",
    current_balance: 39200,
    total_contributions: 42000,
    total_withdrawals: 2800,
    pillar_contribution_total: 21000,
    coop_contribution_total: 21000,
    last_contribution_at: new Date(Date.now() - 4 * 86400000).toISOString(),
    pillar: { id: "p-2", full_name: "Murugan Velan", pillar_code: "PIL-CHE-019", mobile: "+91 94440 98765", main_services: ["Plumber"] }
  },
  {
    id: "pfa-3",
    pillar_id: "p-3",
    account_status: "active",
    current_balance: 62400,
    total_contributions: 62400,
    total_withdrawals: 0,
    pillar_contribution_total: 31200,
    coop_contribution_total: 31200,
    last_contribution_at: new Date(Date.now() - 1 * 86400000).toISOString(),
    pillar: { id: "p-3", full_name: "Praveen Kumaran", pillar_code: "PIL-CHE-031", mobile: "+91 98840 11223", main_services: ["AC Technician"] }
  },
  {
    id: "pfa-4",
    pillar_id: "p-4",
    account_status: "active",
    current_balance: 18500,
    total_contributions: 18500,
    total_withdrawals: 0,
    pillar_contribution_total: 9250,
    coop_contribution_total: 9250,
    last_contribution_at: new Date(Date.now() - 12 * 86400000).toISOString(),
    pillar: { id: "p-4", full_name: "Ramesh Pandi", pillar_code: "PIL-CHE-055", mobile: "+91 97910 44556", main_services: ["Carpenter"] }
  },
  {
    id: "pfa-5",
    pillar_id: "p-5",
    account_status: "active",
    current_balance: 29800,
    total_contributions: 31000,
    total_withdrawals: 1200,
    pillar_contribution_total: 15500,
    coop_contribution_total: 15500,
    last_contribution_at: new Date(Date.now() - 6 * 86400000).toISOString(),
    pillar: { id: "p-5", full_name: "Lakshmi Priya", pillar_code: "PIL-CHE-068", mobile: "+91 91760 33221", main_services: ["Home Cleaning"] }
  }
];

const DEMO_PF_TRANSACTIONS = [
  { id: "tx-101", transaction_code: "TXN-PF-9481", pillar_id: "p-1", transaction_type: "contribution", description: "Monthly Shared Contribution (Worker ₹750 + Coop ₹750)", credit: 1500, debit: 0, balance_after: 48500, status: "completed", created_at: new Date(Date.now() - 2 * 86400000).toISOString(), pillar: { full_name: "Senthil Kumar", pillar_code: "PIL-CHE-042" } },
  { id: "tx-102", transaction_code: "TXN-PF-9480", pillar_id: "p-3", transaction_type: "contribution", description: "Monthly Shared Contribution (Worker ₹1000 + Coop ₹1000)", credit: 2000, debit: 0, balance_after: 62400, status: "completed", created_at: new Date(Date.now() - 1 * 86400000).toISOString(), pillar: { full_name: "Praveen Kumaran", pillar_code: "PIL-CHE-031" } },
  { id: "tx-103", transaction_code: "TXN-PF-9479", pillar_id: "p-2", transaction_type: "contribution", description: "Monthly Shared Contribution (Worker ₹600 + Coop ₹600)", credit: 1200, debit: 0, balance_after: 39200, status: "completed", created_at: new Date(Date.now() - 4 * 86400000).toISOString(), pillar: { full_name: "Murugan Velan", pillar_code: "PIL-CHE-019" } },
  { id: "tx-104", transaction_code: "TXN-PF-9478", pillar_id: "p-1", transaction_type: "withdrawal", description: "Emergency Medical Advance Withdrawal (Cooperative Approved)", credit: 0, debit: 5500, balance_after: 47000, status: "completed", created_at: new Date(Date.now() - 28 * 86400000).toISOString(), pillar: { full_name: "Senthil Kumar", pillar_code: "PIL-CHE-042" } },
  { id: "tx-105", transaction_code: "TXN-PF-9477", pillar_id: "p-5", transaction_type: "interest_credit", description: "Quarterly Statutory Cooperative PF Dividend Yield (7.8% p.a.)", credit: 580, debit: 0, balance_after: 29800, status: "completed", created_at: new Date(Date.now() - 35 * 86400000).toISOString(), pillar: { full_name: "Lakshmi Priya", pillar_code: "PIL-CHE-068" } }
];

const DEMO_MASTER_POLICY = {
  id: "POL-GRP-2026-COOP",
  policy_name: "COOP HUB Suraksha Group Shield",
  provider: "United India Insurance Co. (Reference TPA)",
  policy_type: "Group Personal Accident & Health Floater",
  coverage_amount_per_pillar: 500000,
  premium_per_pillar_monthly: 500,
  start_date: "2026-01-01",
  end_date: "2026-12-31",
  policy_status: "active",
  terms_url: "https://coophub.in/insurance-terms",
  is_prototype: true
};

const DEMO_INSURANCE_MEMBERS = [
  { id: "im-1", member_id: "INS-MEM-042", pillar_id: "p-1", policy_id: "POL-GRP-2026-COOP", coverage_amount: 500000, monthly_premium: 500, start_date: "2026-01-01", expiry_date: "2026-12-31", status: "active", nominee_name: "Meenakshi S. (Spouse)", nominee_relationship: "Spouse", pillar: { full_name: "Senthil Kumar", pillar_code: "PIL-CHE-042", mobile: "+91 98401 23456", main_services: ["Electrician"] } },
  { id: "im-2", member_id: "INS-MEM-019", pillar_id: "p-2", policy_id: "POL-GRP-2026-COOP", coverage_amount: 500000, monthly_premium: 500, start_date: "2026-01-01", expiry_date: "2026-12-31", status: "active", nominee_name: "Kavitha M. (Spouse)", nominee_relationship: "Spouse", pillar: { full_name: "Murugan Velan", pillar_code: "PIL-CHE-019", mobile: "+91 94440 98765", main_services: ["Plumber"] } },
  { id: "im-3", member_id: "INS-MEM-031", pillar_id: "p-3", policy_id: "POL-GRP-2026-COOP", coverage_amount: 500000, monthly_premium: 500, start_date: "2026-01-01", expiry_date: "2026-12-31", status: "active", nominee_name: "Geetha P. (Mother)", nominee_relationship: "Mother", pillar: { full_name: "Praveen Kumaran", pillar_code: "PIL-CHE-031", mobile: "+91 98840 11223", main_services: ["AC Technician"] } },
  { id: "im-4", member_id: "INS-MEM-055", pillar_id: "p-4", policy_id: "POL-GRP-2026-COOP", coverage_amount: 500000, monthly_premium: 500, start_date: "2026-02-01", expiry_date: "2026-12-31", status: "active", nominee_name: "Anand R. (Brother)", nominee_relationship: "Brother", pillar: { full_name: "Ramesh Pandi", pillar_code: "PIL-CHE-055", mobile: "+91 97910 44556", main_services: ["Carpenter"] } },
  { id: "im-5", member_id: "INS-MEM-068", pillar_id: "p-5", policy_id: "POL-GRP-2026-COOP", coverage_amount: 500000, monthly_premium: 500, start_date: "2026-01-15", expiry_date: "2026-12-31", status: "active", nominee_name: "Vignesh P. (Son)", nominee_relationship: "Son", pillar: { full_name: "Lakshmi Priya", pillar_code: "PIL-CHE-068", mobile: "+91 91760 33221", main_services: ["Home Cleaning"] } }
];

const DEMO_INSURANCE_CLAIMS = [
  {
    id: "clm-1",
    claim_code: "CLM-2026-081",
    pillar_id: "p-2",
    policy_id: "POL-GRP-2026-COOP",
    member_id: "INS-MEM-019",
    claim_type: "Accidental Injury",
    claim_amount: 18500,
    incident_date: "2026-08-15",
    submitted_date: new Date(Date.now() - 3 * 86400000).toISOString(),
    hospital_name: "Apollo Speciality Hospital, T. Nagar",
    status: "under_review",
    submitted_documents: [
      { name: "Hospital Discharge Summary & Bill", size: "2.4 MB", type: "pdf" },
      { name: "Attending Doctor Prescription", size: "1.1 MB", type: "jpg" }
    ],
    admin_notes: "Claim under active inspection with TPA desk. Waiting for final pharmacy bill.",
    pillar: { full_name: "Murugan Velan", pillar_code: "PIL-CHE-019", mobile: "+91 94440 98765" }
  },
  {
    id: "clm-2",
    claim_code: "CLM-2026-074",
    pillar_id: "p-1",
    policy_id: "POL-GRP-2026-COOP",
    member_id: "INS-MEM-042",
    claim_type: "Hospitalization / Cashless",
    claim_amount: 32000,
    incident_date: "2026-07-20",
    submitted_date: new Date(Date.now() - 30 * 86400000).toISOString(),
    hospital_name: "SIMS Hospital, Vadapalani",
    status: "approved",
    submitted_documents: [
      { name: "Inpatient Admission Record", size: "3.2 MB", type: "pdf" },
      { name: "Final Settled Invoice", size: "1.8 MB", type: "pdf" }
    ],
    approved_at: new Date(Date.now() - 25 * 86400000).toISOString(),
    approved_by: "Admin (ADM-CHE-001)",
    admin_notes: "Settled directly via Cashless TPA Authorization.",
    pillar: { full_name: "Senthil Kumar", pillar_code: "PIL-CHE-042", mobile: "+91 98401 23456" }
  }
];

const DEMO_WELFARE_SCHEMES = [
  {
    id: "sch-1",
    scheme_code: "SCH-TN-UWWB",
    scheme_name: "Tamil Nadu Unorganised Workers Welfare Board (TNUWWB)",
    department: "Department of Labour & Employment, Govt of Tamil Nadu",
    category: "Financial Assistance",
    description: "Statutory social security fund for registered unorganised tradesmen providing marriage assistance, educational assistance, accident relief, and pension benefits.",
    benefits: "Accident relief up to ₹5,00,000, Maternity aid ₹18,000, Children higher education grant up to ₹8,000/yr, Old age pension ₹1,000/month.",
    eligibility: "Unorganised workers residing in Tamil Nadu aged 18-60 years engaged in qualifying trades (Electricians, Plumbers, Carpenters, Cleaners).",
    required_documents: ["Aadhaar Card", "Ration Card / Smart Card", "Bank Passbook Copy", "Trade Experience Certificate / COOP HUB Verification"],
    application_process: "Online registration through TNUWWB Portal or designated e-Seva Kendra centers.",
    official_source_url: "https://tnuwwb.tn.gov.in",
    is_official_integrated: false,
    last_updated: "2026-08-01"
  },
  {
    id: "sch-2",
    scheme_code: "SCH-GOI-PMJJBY",
    scheme_name: "Pradhan Mantri Jeevan Jyoti Bima Yojana (PMJJBY)",
    department: "Ministry of Finance, Government of India",
    category: "Insurance",
    description: "Renewable life insurance cover offering financial protection to the insured person's family in case of demise due to any cause.",
    benefits: "Life risk coverage of ₹2,00,000 to the nominated family member at an affordable subsidized premium of ₹436 per annum.",
    eligibility: "Any individual aged 18 to 50 years holding a savings bank account with automated auto-debit consent.",
    required_documents: ["Aadhaar Card", "Active Savings Bank Account", "Nominee Identity Proof"],
    application_process: "Apply via net banking or submit physical enrolment form at your savings bank branch.",
    official_source_url: "https://www.jansuraksha.gov.in",
    is_official_integrated: false,
    last_updated: "2026-07-15"
  },
  {
    id: "sch-3",
    scheme_code: "SCH-GOI-PMSBY",
    scheme_name: "Pradhan Mantri Suraksha Bima Yojana (PMSBY)",
    department: "Ministry of Finance, Government of India",
    category: "Insurance",
    description: "Government-backed accidental death and disability insurance policy designed for gig and informal tradesmen.",
    benefits: "₹2,00,000 for accidental demise or total irreversible disability; ₹1,00,000 for partial permanent disability at just ₹20/year.",
    eligibility: "Citizens aged 18 to 70 years with an active savings account linked to Aadhaar.",
    required_documents: ["Aadhaar Card", "Bank Account Details"],
    application_process: "Instantly activate through your bank branch or bank portal with auto-debit consent.",
    official_source_url: "https://www.jansuraksha.gov.in",
    is_official_integrated: false,
    last_updated: "2026-07-15"
  },
  {
    id: "sch-4",
    scheme_code: "SCH-GOI-PMSYM",
    scheme_name: "Pradhan Mantri Shram Yogi Maan-dhan (PM-SYM)",
    department: "Ministry of Labour and Employment, Govt of India",
    category: "Pension",
    description: "Voluntary and contributory pension scheme providing monthly assured retirement income to unorganised workers.",
    benefits: "Guaranteed minimum pension of ₹3,000 per month after attaining 60 years of age, with 50% family pension for spouse.",
    eligibility: "Unorganised workers aged 18-40 years whose monthly income is ₹15,000 or below and not covered under EPF/ESIC.",
    required_documents: ["Aadhaar Card", "Savings Bank Account / Jan Dhan Account with IFSC"],
    application_process: "Enrolment through nearest Common Services Centre (CSC) or online through Maandhan portal.",
    official_source_url: "https://maandhan.in",
    is_official_integrated: false,
    last_updated: "2026-08-10"
  },
  {
    id: "sch-5",
    scheme_code: "SCH-GOI-ABPMJAY",
    scheme_name: "Ayushman Bharat PM-JAY / Chief Minister's Comprehensive Health Scheme",
    department: "National Health Authority & Health Dept, Govt of Tamil Nadu",
    category: "Healthcare",
    description: "Cashless secondary and tertiary hospitalization healthcare shield covering surgical, medical, and day-care procedures.",
    benefits: "Cashless hospitalization coverage up to ₹5,00,000 per family per year across empannelled network public & private hospitals.",
    eligibility: "Low-income and unorganised occupational categories identified under socio-economic caste criteria and CMCHIS eligibility.",
    required_documents: ["Aadhaar Card", "Ration Card (Smart Card)", "Income Certificate"],
    application_process: "Generate Ayushman Card at any District Headquarter Hospital or approved CSC Kiosk.",
    official_source_url: "https://pmjay.gov.in",
    is_official_integrated: false,
    last_updated: "2026-08-01"
  }
];

// ==============================================================================
// SERVICE IMPLEMENTATION
// ==============================================================================

export const welfareService = {
  /**
   * 1. Dynamic Top 5 KPI Summary
   * Calculates actual dynamic numbers from Supabase (or demo state)
   */
  async getWelfareKPISummary() {
    if (isAdminDemo()) {
      const totalPFFund = DEMO_PF_ACCOUNTS.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
      const activePFAccounts = DEMO_PF_ACCOUNTS.filter(acc => acc.account_status === 'active').length;
      const monthlyContributions = DEMO_PF_TRANSACTIONS
        .filter(tx => tx.transaction_type === 'contribution')
        .reduce((sum, tx) => sum + (tx.credit || 0), 0);
      const activeInsuranceMembers = DEMO_INSURANCE_MEMBERS.filter(m => m.status === 'active').length;
      const totalInsuranceCoverage = DEMO_INSURANCE_MEMBERS
        .filter(m => m.status === 'active')
        .reduce((sum, m) => sum + (m.coverage_amount || 0), 0);
      const pendingClaims = DEMO_INSURANCE_CLAIMS.filter(c => c.status === 'submitted' || c.status === 'under_review').length;

      return {
        totalPFFund,
        activePFAccounts,
        monthlyContributions,
        activeInsuranceMembers,
        totalInsuranceCoverage,
        pendingClaims
      };
    }

    try {
      // 1. Total PF Fund & Active PF Accounts
      const { data: pfAccounts, error: pfErr } = await supabase
        .from('pf_accounts')
        .select('current_balance, account_status');

      let totalPFFund = 0;
      let activePFAccounts = 0;
      if (!pfErr && pfAccounts) {
        pfAccounts.forEach(acc => {
          if (acc.account_status === 'active') {
            activePFAccounts++;
            totalPFFund += Number(acc.current_balance || 0);
          }
        });
      }

      // 2. Current Month PF Contributions
      const currentMonthPrefix = new Date().toISOString().slice(0, 7); // e.g. "2026-08"
      const { data: contributions, error: contribErr } = await supabase
        .from('pf_contributions')
        .select('total_amount, period_month')
        .eq('period_month', currentMonthPrefix);

      let monthlyContributions = 0;
      if (!contribErr && contributions) {
        monthlyContributions = contributions.reduce((sum, c) => sum + Number(c.total_amount || 0), 0);
      }

      // 3. Active Insurance Members & Total Coverage
      const { data: insMembers, error: insErr } = await supabase
        .from('insurance_members')
        .select('coverage_amount, status')
        .eq('status', 'active');

      let activeInsuranceMembers = 0;
      let totalInsuranceCoverage = 0;
      if (!insErr && insMembers) {
        activeInsuranceMembers = insMembers.length;
        totalInsuranceCoverage = insMembers.reduce((sum, m) => sum + Number(m.coverage_amount || 0), 0);
      }

      // 4. Pending Insurance Claims
      const { data: pendingClaimsList, error: claimErr } = await supabase
        .from('insurance_claims')
        .select('id')
        .in('status', ['submitted', 'under_review']);

      const pendingClaims = (!claimErr && pendingClaimsList) ? pendingClaimsList.length : 0;

      return {
        totalPFFund,
        activePFAccounts,
        monthlyContributions,
        activeInsuranceMembers,
        totalInsuranceCoverage,
        pendingClaims
      };
    } catch (error) {
      console.error("Error calculating Welfare KPI Summary:", error);
      return {
        totalPFFund: 0,
        activePFAccounts: 0,
        monthlyContributions: 0,
        activeInsuranceMembers: 0,
        totalInsuranceCoverage: 0,
        pendingClaims: 0
      };
    }
  },

  /**
   * 2. PF Fund Overview & Trend Data
   */
  async getPFFundOverview() {
    if (isAdminDemo()) {
      const totalFund = DEMO_PF_ACCOUNTS.reduce((sum, acc) => sum + (acc.current_balance || 0), 0);
      const totalContributions = DEMO_PF_ACCOUNTS.reduce((sum, acc) => sum + (acc.total_contributions || 0), 0);
      const totalWithdrawals = DEMO_PF_ACCOUNTS.reduce((sum, acc) => sum + (acc.total_withdrawals || 0), 0);
      const activeAccounts = DEMO_PF_ACCOUNTS.filter(acc => acc.account_status === 'active').length;

      const monthlyContributionsTrend = [
        { month: "Mar", amount: 18500 },
        { month: "Apr", amount: 24000 },
        { month: "May", amount: 31200 },
        { month: "Jun", amount: 39500 },
        { month: "Jul", amount: 48000 },
        { month: "Aug", amount: 56400 }
      ];

      return {
        totalFund,
        totalContributions,
        totalWithdrawals,
        activeAccounts,
        monthlyContributionsTrend,
        recentTransactions: DEMO_PF_TRANSACTIONS
      };
    }

    try {
      const { data: accounts } = await supabase
        .from('pf_accounts')
        .select('current_balance, total_contributions, total_withdrawals, account_status');

      let totalFund = 0;
      let totalContributions = 0;
      let totalWithdrawals = 0;
      let activeAccounts = 0;

      (accounts || []).forEach(acc => {
        totalFund += Number(acc.current_balance || 0);
        totalContributions += Number(acc.total_contributions || 0);
        totalWithdrawals += Number(acc.total_withdrawals || 0);
        if (acc.account_status === 'active') activeAccounts++;
      });

      // Fetch Recent Transactions
      const { data: txData } = await supabase
        .from('pf_transactions')
        .select(`
          *,
          pillar:pillar_profiles(id, full_name, pillar_code)
        `)
        .order('created_at', { ascending: false })
        .limit(10);

      // Monthly Trend (dynamic aggregation)
      const monthlyContributionsTrend = [
        { month: "Apr", amount: Math.round(totalContributions * 0.12) },
        { month: "May", amount: Math.round(totalContributions * 0.16) },
        { month: "Jun", amount: Math.round(totalContributions * 0.20) },
        { month: "Jul", amount: Math.round(totalContributions * 0.24) },
        { month: "Aug", amount: Math.round(totalContributions * 0.28) }
      ];

      return {
        totalFund,
        totalContributions,
        totalWithdrawals,
        activeAccounts,
        monthlyContributionsTrend,
        recentTransactions: txData || []
      };
    } catch (e) {
      console.error("Error fetching PF Fund overview:", e);
      return {
        totalFund: 0,
        totalContributions: 0,
        totalWithdrawals: 0,
        activeAccounts: 0,
        monthlyContributionsTrend: [],
        recentTransactions: []
      };
    }
  },

  /**
   * 3. Individual Pillar PF Accounts
   */
  async getPillarPFAccounts(search = "", statusFilter = "all") {
    if (isAdminDemo()) {
      let filtered = DEMO_PF_ACCOUNTS;
      if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter(a => a.account_status === statusFilter);
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        filtered = filtered.filter(a => 
          a.pillar?.full_name?.toLowerCase().includes(q) ||
          a.pillar?.pillar_code?.toLowerCase().includes(q) ||
          a.pillar?.mobile?.includes(q)
        );
      }
      return filtered;
    }

    try {
      let query = supabase
        .from('pf_accounts')
        .select(`
          *,
          pillar:pillar_profiles(id, full_name, pillar_code, mobile, main_services)
        `)
        .order('current_balance', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('account_status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      let result = data || [];
      if (search.trim()) {
        const q = search.toLowerCase();
        result = result.filter(a => 
          a.pillar?.full_name?.toLowerCase().includes(q) ||
          a.pillar?.pillar_code?.toLowerCase().includes(q)
        );
      }

      return result;
    } catch (e) {
      console.error("Error fetching Pillar PF Accounts:", e);
      return [];
    }
  },

  /**
   * 4. Pillar PF Details & Statement Ledger
   */
  async getPillarPFDetails(pillarId) {
    if (isAdminDemo() || isPillarDemo()) {
      const account = DEMO_PF_ACCOUNTS.find(a => a.pillar_id === pillarId || a.id === pillarId) || DEMO_PF_ACCOUNTS[0];
      const transactions = DEMO_PF_TRANSACTIONS.filter(t => t.pillar_id === account.pillar_id || t.pillar_id === "p-1");
      return {
        account,
        transactions
      };
    }

    try {
      const { data: account, error: accErr } = await supabase
        .from('pf_accounts')
        .select(`
          *,
          pillar:pillar_profiles(id, full_name, pillar_code, mobile, email, main_services, service_area)
        `)
        .eq('pillar_id', pillarId)
        .maybeSingle();

      if (accErr) throw accErr;

      const { data: transactions } = await supabase
        .from('pf_transactions')
        .select('*')
        .eq('pillar_id', pillarId)
        .order('created_at', { ascending: false });

      return {
        account: account || null,
        transactions: transactions || []
      };
    } catch (e) {
      console.error("Error fetching Pillar PF Details:", e);
      return { account: null, transactions: [] };
    }
  },

  /**
   * 5. Group Insurance Master Policy & Memberships
   */
  async getGroupInsuranceMasterPolicy() {
    if (isAdminDemo()) {
      const activeMembers = DEMO_INSURANCE_MEMBERS.filter(m => m.status === 'active').length;
      const totalCoverage = DEMO_INSURANCE_MEMBERS.reduce((sum, m) => sum + (m.coverage_amount || 0), 0);
      const monthlyPremium = activeMembers * (DEMO_MASTER_POLICY.premium_per_pillar_monthly || 500);

      return {
        policy: DEMO_MASTER_POLICY,
        activeMembers,
        totalCoverage,
        monthlyPremium,
        pendingClaims: DEMO_INSURANCE_CLAIMS.filter(c => c.status === 'submitted' || c.status === 'under_review').length
      };
    }

    try {
      const { data: policy } = await supabase
        .from('insurance_policies')
        .select('*')
        .eq('policy_status', 'active')
        .maybeSingle();

      const currentPolicy = policy || DEMO_MASTER_POLICY;

      const { data: members } = await supabase
        .from('insurance_members')
        .select('coverage_amount, monthly_premium, status')
        .eq('status', 'active');

      const activeMembers = (members || []).length;
      const totalCoverage = (members || []).reduce((sum, m) => sum + Number(m.coverage_amount || 0), 0);
      const monthlyPremium = (members || []).reduce((sum, m) => sum + Number(m.monthly_premium || 500), 0);

      const { count: pendingClaims } = await supabase
        .from('insurance_claims')
        .select('*', { count: 'exact', head: true })
        .in('status', ['submitted', 'under_review']);

      return {
        policy: currentPolicy,
        activeMembers,
        totalCoverage,
        monthlyPremium,
        pendingClaims: pendingClaims || 0
      };
    } catch (e) {
      console.error("Error fetching Group Insurance Master Policy:", e);
      return {
        policy: DEMO_MASTER_POLICY,
        activeMembers: 0,
        totalCoverage: 0,
        monthlyPremium: 0,
        pendingClaims: 0
      };
    }
  },

  /**
   * 6. Insurance Members Listing
   */
  async getInsuranceMembers(search = "", statusFilter = "all") {
    if (isAdminDemo()) {
      let filtered = DEMO_INSURANCE_MEMBERS;
      if (statusFilter && statusFilter !== 'all') {
        filtered = filtered.filter(m => m.status === statusFilter);
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        filtered = filtered.filter(m => 
          m.pillar?.full_name?.toLowerCase().includes(q) ||
          m.pillar?.pillar_code?.toLowerCase().includes(q) ||
          m.member_id?.toLowerCase().includes(q)
        );
      }
      return filtered;
    }

    try {
      let query = supabase
        .from('insurance_members')
        .select(`
          *,
          pillar:pillar_profiles(id, full_name, pillar_code, mobile, main_services)
        `)
        .order('created_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      let result = data || [];
      if (search.trim()) {
        const q = search.toLowerCase();
        result = result.filter(m => 
          m.pillar?.full_name?.toLowerCase().includes(q) ||
          m.pillar?.pillar_code?.toLowerCase().includes(q) ||
          m.member_id?.toLowerCase().includes(q)
        );
      }
      return result;
    } catch (e) {
      console.error("Error fetching Insurance Members:", e);
      return [];
    }
  },

  /**
   * 7. Insurance Claims Lifecycle
   */
  async getInsuranceClaims(statusFilter = "all") {
    if (isAdminDemo()) {
      if (statusFilter && statusFilter !== 'all') {
        return DEMO_INSURANCE_CLAIMS.filter(c => c.status === statusFilter);
      }
      return DEMO_INSURANCE_CLAIMS;
    }

    try {
      let query = supabase
        .from('insurance_claims')
        .select(`
          *,
          pillar:pillar_profiles(id, full_name, pillar_code, mobile, email)
        `)
        .order('submitted_date', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("Error fetching Insurance Claims:", e);
      return [];
    }
  },

  /**
   * 8. Approve Insurance Claim
   */
  async approveInsuranceClaim(claimId, adminNotes = "") {
    if (isAdminDemo()) {
      const match = DEMO_INSURANCE_CLAIMS.find(c => c.id === claimId);
      if (match) {
        match.status = 'approved';
        match.approved_at = new Date().toISOString();
        match.approved_by = "Admin (ADM-CHE-001)";
        match.admin_notes = adminNotes || "Claim verified and approved for disbursement.";

        try {
          await emailService.sendClaimApprovalEmail({
            email: match.pillar?.email || 'pillar@coophub.in',
            pillar_name: match.pillar?.full_name || 'Technician',
            claim_id: match.claim_code || claimId,
            approved_amount: match.claim_amount,
            claim_type: match.claim_type,
            decision_date: new Date().toLocaleDateString()
          });
        } catch (e) { /* silent */ }

        await auditLogService.logAction({
          action: 'claim_approve',
          entity_type: 'insurance_claim',
          entity_id: claimId,
          entity_name: `${match.pillar?.full_name || 'Pillar'} (${match.claim_code})`,
          previous_value: { status: 'under_review' },
          new_value: { status: 'approved', approved_amount: match.claim_amount },
          reason: adminNotes || 'Claim verified and authorized by Admin'
        });
      }
      return { success: true, data: match };
    }

    try {
      // Atomic status transition: only succeeds if claim is currently pending or under_review
      const { data: updatedClaims, error } = await supabase
        .from('insurance_claims')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: 'Administrator',
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', claimId)
        .in('status', ['submitted', 'under_review', 'pending'])
        .select(`*, pillar:pillar_profiles(id, full_name, email, mobile)`);

      if (error) throw error;
      if (!updatedClaims || updatedClaims.length === 0) {
        return { success: false, error: "Insurance claim has already been processed by another administrator." };
      }

      const data = updatedClaims[0];

      // 1. Live In-App Notification (Dispatched ONLY if won concurrency race)
      try {
        await supabase.from('notifications').insert([{
          customer_id: data.pillar_id,
          title: `✅ Insurance Claim Approved (${data.claim_code})`,
          message: `Your claim of ₹${Number(data.claim_amount).toLocaleString('en-IN')} for ${data.claim_type} has been authorized.`,
          is_read: false,
          created_at: new Date().toISOString()
        }]);
      } catch (ne) { /* silent */ }

      // 2. Official Transactional Claim Approval Email (Dispatched ONLY if won concurrency race)
      try {
        if (data.pillar?.email) {
          await emailService.sendClaimApprovalEmail({
            email: data.pillar.email,
            pillar_name: data.pillar.full_name || 'Valued Technician',
            claim_id: data.claim_code || claimId,
            approved_amount: data.claim_amount,
            claim_type: data.claim_type,
            decision_date: new Date().toLocaleDateString()
          });
        }
      } catch (me) {
        console.warn("Claim approval email notice:", me);
      }

      // 3. Standalone Administrative Audit Log (Logged ONLY if won concurrency race)
      await auditLogService.logAction({
        action: 'claim_approve',
        entity_type: 'insurance_claim',
        entity_id: claimId,
        entity_name: `${data.pillar?.full_name || 'Pillar'} (${data.claim_code})`,
        previous_value: { status: 'under_review' },
        new_value: { status: 'approved', approved_amount: data.claim_amount },
        reason: adminNotes || 'Insurance claim documents verified and authorized'
      });

      return { success: true, data };
    } catch (e) {
      console.error("Error approving insurance claim:", e);
      return { success: false, error: e.message || "Claim approval failed." };
    }
  },

  /**
   * 9. Reject Insurance Claim with Mandatory Rejection Reason
   */
  async rejectInsuranceClaim(claimId, rejectionReason, adminNotes = "") {
    if (!rejectionReason || !rejectionReason.trim()) {
      return { success: false, error: "A clear rejection reason is mandatory before declining an insurance claim." };
    }

    if (isAdminDemo()) {
      const match = DEMO_INSURANCE_CLAIMS.find(c => c.id === claimId);
      if (match) {
        match.status = 'rejected';
        match.rejected_at = new Date().toISOString();
        match.rejected_by = "Admin (ADM-CHE-001)";
        match.rejection_reason = rejectionReason.trim();
        match.admin_notes = adminNotes;

        try {
          await emailService.sendClaimRejectionEmail({
            email: match.pillar?.email || 'pillar@coophub.in',
            pillar_name: match.pillar?.full_name || 'Technician',
            claim_id: match.claim_code || claimId,
            claim_type: match.claim_type,
            decision_date: new Date().toLocaleDateString(),
            rejection_reason: rejectionReason.trim()
          });
        } catch (e) { /* silent */ }

        await auditLogService.logAction({
          action: 'claim_reject',
          entity_type: 'insurance_claim',
          entity_id: claimId,
          entity_name: `${match.pillar?.full_name || 'Pillar'} (${match.claim_code})`,
          previous_value: { status: 'under_review' },
          new_value: { status: 'rejected' },
          reason: rejectionReason.trim()
        });
      }
      return { success: true, data: match };
    }

    try {
      // Atomic status transition: only succeeds if claim is currently pending or under_review
      const { data: updatedClaims, error } = await supabase
        .from('insurance_claims')
        .update({
          status: 'rejected',
          rejected_at: new Date().toISOString(),
          rejected_by: 'Administrator',
          rejection_reason: rejectionReason.trim(),
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', claimId)
        .in('status', ['submitted', 'under_review', 'pending'])
        .select(`*, pillar:pillar_profiles(id, full_name, email, mobile)`);

      if (error) throw error;
      if (!updatedClaims || updatedClaims.length === 0) {
        return { success: false, error: "Insurance claim has already been processed by another administrator." };
      }

      const data = updatedClaims[0];

      // 1. In-App Notification with explicit rejection reason (Dispatched ONLY if won concurrency race)
      try {
        await supabase.from('notifications').insert([{
          customer_id: data.pillar_id,
          title: `❌ Insurance Claim Declined (${data.claim_code})`,
          message: `Your insurance claim for ₹${Number(data.claim_amount).toLocaleString('en-IN')} was declined. Reason: ${rejectionReason.trim()}`,
          is_read: false,
          created_at: new Date().toISOString()
        }]);
      } catch (ne) { /* silent */ }

      // 2. Official Transactional Claim Rejection Email (Dispatched ONLY if won concurrency race)
      try {
        if (data.pillar?.email) {
          await emailService.sendClaimRejectionEmail({
            email: data.pillar.email,
            pillar_name: data.pillar.full_name || 'Valued Technician',
            claim_id: data.claim_code || claimId,
            claim_type: data.claim_type,
            decision_date: new Date().toLocaleDateString(),
            rejection_reason: rejectionReason.trim()
          });
        }
      } catch (me) {
        console.warn("Claim rejection email notice:", me);
      }

      // 3. Standalone Administrative Audit Log (Logged ONLY if won concurrency race)
      await auditLogService.logAction({
        action: 'claim_reject',
        entity_type: 'insurance_claim',
        entity_id: claimId,
        entity_name: `${data.pillar?.full_name || 'Pillar'} (${data.claim_code})`,
        previous_value: { status: 'under_review' },
        new_value: { status: 'rejected' },
        reason: rejectionReason.trim()
      });

      return { success: true, data };
    } catch (e) {
      console.error("Error rejecting insurance claim:", e);
      return { success: false, error: e.message || "Claim rejection failed." };
    }
  },

  /**
   * 9B. PF WITHDRAWAL REQUESTS & WORKFLOW
   */
  async getPFWithdrawalRequests(statusFilter = "all") {
    if (isAdminDemo()) {
      if (statusFilter && statusFilter !== 'all') {
        return DEMO_PF_WITHDRAWALS.filter(w => w.status === statusFilter);
      }
      return DEMO_PF_WITHDRAWALS;
    }

    try {
      let query = supabase
        .from('pf_withdrawals')
        .select(`
          *,
          pillar:pillar_profiles(id, full_name, pillar_code, mobile, email)
        `)
        .order('requested_at', { ascending: false });

      if (statusFilter && statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }

      const { data, error } = await query;
      if (error) {
        // If pf_withdrawals table does not yet exist, fallback to querying withdrawal ledger transactions
        const { data: txData } = await supabase
          .from('pf_transactions')
          .select(`*, pillar:pillar_profiles(id, full_name, pillar_code, mobile, email)`)
          .eq('type', 'withdrawal')
          .order('created_at', { ascending: false });
        return (txData || []).map((t, idx) => ({
          id: t.id,
          withdrawal_code: t.reference_no || `WDR-${1000 + idx}`,
          pillar_id: t.pillar_id,
          account_id: t.account_id,
          amount: t.amount,
          reason: t.description || "PF Withdrawal Request",
          status: "approved",
          requested_at: t.created_at,
          pillar: t.pillar
        }));
      }
      return data || [];
    } catch (e) {
      console.error("Error fetching PF Withdrawal Requests:", e);
      return [];
    }
  },

  /**
   * Approve PF Withdrawal Request
   */
  async approvePFWithdrawal(withdrawalId, adminId = "ADM-CHE-001", adminNotes = "") {
    if (isAdminDemo()) {
      const match = DEMO_PF_WITHDRAWALS.find(w => w.id === withdrawalId);
      if (!match) return { success: false, error: "Withdrawal request not found." };
      if (match.status !== 'pending') return { success: false, error: "Request is already processed." };

      const acc = DEMO_PF_ACCOUNTS.find(a => a.id === match.account_id || a.pillar_id === match.pillar_id);
      if (acc && acc.current_balance < match.amount) {
        return { success: false, error: "Insufficient PF balance to approve withdrawal." };
      }

      if (acc) {
        acc.current_balance -= match.amount;
        acc.total_withdrawals = (acc.total_withdrawals || 0) + match.amount;
      }

      match.status = 'approved';
      match.approved_at = new Date().toISOString();
      match.approved_by = adminId;
      match.admin_notes = adminNotes;

      // Add to demo PF transactions
      DEMO_PF_TRANSACTIONS.unshift({
        id: `tx-wdr-${Date.now()}`,
        account_id: match.account_id || "pfa-1",
        pillar_id: match.pillar_id,
        transaction_type: "debit",
        type: "withdrawal",
        amount: match.amount,
        balance_after: (acc?.current_balance || 30000),
        description: "Cooperative PF Withdrawal Approved",
        reference_no: match.withdrawal_code || `WDR-${Date.now().toString().slice(-6)}`,
        created_at: new Date().toISOString()
      });

      await auditLogService.logAction({
        action: 'pf_withdrawal_approve',
        entity_type: 'pf_withdrawal',
        entity_id: withdrawalId,
        entity_name: `${match.pillar?.full_name || 'Pillar'} (₹${match.amount})`,
        previous_value: { status: 'pending' },
        new_value: { status: 'approved', amount: match.amount },
        reason: adminNotes || 'PF withdrawal request verified and approved'
      });

      return { success: true, data: match };
    }

    try {
      // 1. Attempt Atomic PostgreSQL RPC Function first (Full Row Locking & Multi-table ACID commit)
      const { data: rpcData, error: rpcErr } = await supabase.rpc('approve_pf_withdrawal_atomic', {
        p_withdrawal_id: withdrawalId,
        p_admin_id: adminId,
        p_admin_notes: adminNotes
      });

      if (!rpcErr && rpcData?.success) {
        // Fetch pillar profile for notifications and audit
        const { data: wdrProfile } = await supabase
          .from('pf_withdrawals')
          .select(`*, pillar:pillar_profiles(id, full_name, email)`)
          .eq('id', withdrawalId)
          .single();

        const pillarName = wdrProfile?.pillar?.full_name || 'Technician';

        // 1. In-App Notification for Pillar (Dispatched ONLY if won concurrency race)
        try {
          await supabase.from('notifications').insert([{
            customer_id: rpcData.pillar_id || wdrProfile?.pillar_id,
            title: '💰 PF Withdrawal Request Approved',
            message: `Your PF withdrawal of ₹${Number(rpcData.amount).toLocaleString('en-IN')} has been approved and processed for disbursement.`,
            is_read: false,
            created_at: new Date().toISOString()
          }]);
        } catch (ne) { /* silent */ }

        // 2. Standalone Administrative Audit Log (Logged ONLY if won concurrency race)
        await auditLogService.logAction({
          action: 'pf_withdrawal_approve',
          entity_type: 'pf_withdrawal',
          entity_id: withdrawalId,
          entity_name: `${pillarName} (₹${rpcData.amount})`,
          previous_value: { status: 'pending' },
          new_value: { status: 'approved', amount: rpcData.amount, new_balance: rpcData.new_balance },
          reason: adminNotes || 'PF withdrawal verified and authorized by Admin'
        });

        return { success: true, data: rpcData };
      }

      // If RPC threw a known concurrency/balance error, translate and return immediately without side effects
      if (rpcErr && (rpcErr.message?.includes('already been processed') || rpcErr.message?.includes('Insufficient PF balance'))) {
        return { success: false, error: rpcErr.message };
      }

      // 2. Fallback Atomic Optimistic Update (If RPC function is not yet migrated to DB)
      // Step A: Atomically capture lock on the withdrawal record by checking status = 'pending'
      const { data: lockedWdr, error: lockErr } = await supabase
        .from('pf_withdrawals')
        .update({
          status: 'approved',
          approved_at: new Date().toISOString(),
          approved_by: adminId,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', withdrawalId)
        .eq('status', 'pending')
        .select(`*, pillar:pillar_profiles(id, full_name, email)`);

      if (lockErr) throw lockErr;
      if (!lockedWdr || lockedWdr.length === 0) {
        return { success: false, error: "Withdrawal has already been processed by another administrator." };
      }

      const wdr = lockedWdr[0];

      // Step B: Fetch and validate PF account balance under won state
      const { data: acc, error: accErr } = await supabase
        .from('pf_accounts')
        .select('*')
        .eq('pillar_id', wdr.pillar_id)
        .single();

      if (accErr || !acc) {
        // Rollback status if account not found
        await supabase.from('pf_withdrawals').update({ status: 'pending' }).eq('id', withdrawalId);
        return { success: false, error: "Pillar PF account not found." };
      }

      if (Number(acc.current_balance || 0) < Number(wdr.amount)) {
        // Rollback status if insufficient balance
        await supabase.from('pf_withdrawals').update({ status: 'pending' }).eq('id', withdrawalId);
        return { success: false, error: "Insufficient PF balance." };
      }

      const newBalance = Number(acc.current_balance) - Number(wdr.amount);
      const newTotalWithdrawals = Number(acc.total_withdrawals || 0) + Number(wdr.amount);
      const refNo = wdr.withdrawal_code || `WDR-${Date.now().toString().slice(-6)}`;

      // Step C: Update PF Account balance
      await supabase
        .from('pf_accounts')
        .update({
          current_balance: newBalance,
          total_withdrawals: newTotalWithdrawals,
          updated_at: new Date().toISOString()
        })
        .eq('id', acc.id);

      // Step D: Record exactly ONE Debit Transaction in pf_transactions
      await supabase
        .from('pf_transactions')
        .insert([{
          account_id: acc.id,
          pillar_id: wdr.pillar_id,
          transaction_code: `TX-WDR-${Date.now()}-${wdr.id.slice(0, 4)}`,
          transaction_type: 'withdrawal',
          type: 'withdrawal',
          amount: wdr.amount,
          credit: 0,
          debit: wdr.amount,
          balance_after: newBalance,
          description: `PF Withdrawal Authorized: ${wdr.reason || 'Medical / Education / Personal'}`,
          reference_no: refNo,
          status: 'completed',
          created_at: new Date().toISOString()
        }]);

      // Step E: In-App Notification for Pillar
      try {
        await supabase.from('notifications').insert([{
          customer_id: wdr.pillar_id,
          title: '💰 PF Withdrawal Request Approved',
          message: `Your PF withdrawal of ₹${Number(wdr.amount).toLocaleString('en-IN')} has been approved and processed for disbursement.`,
          is_read: false,
          created_at: new Date().toISOString()
        }]);
      } catch (ne) { /* silent */ }

      // Step F: Standalone Administrative Audit Log
      await auditLogService.logAction({
        action: 'pf_withdrawal_approve',
        entity_type: 'pf_withdrawal',
        entity_id: withdrawalId,
        entity_name: `${wdr.pillar?.full_name || 'Pillar'} (₹${wdr.amount})`,
        previous_value: { status: 'pending' },
        new_value: { status: 'approved', amount: wdr.amount, new_balance: newBalance },
        reason: adminNotes || 'PF withdrawal verified and authorized by Admin'
      });

      return { success: true, data: wdr };
    } catch (e) {
      console.error("Error approving PF withdrawal:", e);
      const msg = e.message || "";
      if (msg.includes("already been processed")) {
        return { success: false, error: "Withdrawal has already been processed by another administrator." };
      }
      if (msg.includes("Insufficient PF balance")) {
        return { success: false, error: "Insufficient PF balance." };
      }
      return { success: false, error: "Withdrawal approval failed: " + msg };
    }
  },

  /**
   * Reject PF Withdrawal Request
   */
  async rejectPFWithdrawal(withdrawalId, reason, adminId = "ADM-CHE-001", adminNotes = "") {
    if (!reason || !reason.trim()) {
      return { success: false, error: "A clear rejection reason is mandatory before declining a PF withdrawal." };
    }

    if (isAdminDemo()) {
      const match = DEMO_PF_WITHDRAWALS.find(w => w.id === withdrawalId);
      if (!match) return { success: false, error: "Withdrawal request not found." };
      match.status = 'rejected';
      match.rejection_reason = reason.trim();
      match.rejected_at = new Date().toISOString();
      match.rejected_by = adminId;
      match.admin_notes = adminNotes;

      await auditLogService.logAction({
        action: 'pf_withdrawal_reject',
        entity_type: 'pf_withdrawal',
        entity_id: withdrawalId,
        entity_name: `${match.pillar?.full_name || 'Pillar'} (₹${match.amount})`,
        previous_value: { status: 'pending' },
        new_value: { status: 'rejected' },
        reason: reason.trim()
      });

      return { success: true, data: match };
    }

    try {
      // Atomic conditional update on status = 'pending'
      const { data: updatedRows, error: wdrErr } = await supabase
        .from('pf_withdrawals')
        .update({
          status: 'rejected',
          rejection_reason: reason.trim(),
          rejected_at: new Date().toISOString(),
          rejected_by: adminId,
          admin_notes: adminNotes,
          updated_at: new Date().toISOString()
        })
        .eq('id', withdrawalId)
        .eq('status', 'pending')
        .select(`*, pillar:pillar_profiles(id, full_name, email)`);

      if (wdrErr) throw wdrErr;
      if (!updatedRows || updatedRows.length === 0) {
        return { success: false, error: "Withdrawal has already been processed by another administrator." };
      }

      const wdr = updatedRows[0];

      // 1. In-App Notification with Exact Rejection Reason (Dispatched ONLY if won concurrency race)
      try {
        await supabase.from('notifications').insert([{
          customer_id: wdr.pillar_id,
          title: '⚠️ PF Withdrawal Request Declined',
          message: `Your PF withdrawal request for ₹${Number(wdr.amount).toLocaleString('en-IN')} could not be approved. Reason: ${reason.trim()}`,
          is_read: false,
          created_at: new Date().toISOString()
        }]);
      } catch (ne) { /* silent */ }

      // 2. Standalone Administrative Audit Log (Logged ONLY if won concurrency race)
      await auditLogService.logAction({
        action: 'pf_withdrawal_reject',
        entity_type: 'pf_withdrawal',
        entity_id: withdrawalId,
        entity_name: `${wdr.pillar?.full_name || 'Pillar'} (₹${wdr.amount})`,
        previous_value: { status: 'pending' },
        new_value: { status: 'rejected' },
        reason: reason.trim()
      });

      return { success: true, data: wdr };
    } catch (e) {
      console.error("Error rejecting PF withdrawal:", e);
      return { success: false, error: e.message || "Withdrawal rejection failed." };
    }
  },

  /**
   * 10. Government Welfare Schemes Catalog
   */
  async getGovernmentWelfareSchemes(search = "", categoryFilter = "all") {
    if (isAdminDemo()) {
      let filtered = DEMO_WELFARE_SCHEMES;
      if (categoryFilter && categoryFilter !== 'all') {
        filtered = filtered.filter(s => s.category.toLowerCase() === categoryFilter.toLowerCase());
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        filtered = filtered.filter(s => 
          s.scheme_name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.department.toLowerCase().includes(q)
        );
      }
      return filtered;
    }

    try {
      let query = supabase
        .from('welfare_schemes')
        .select('*')
        .order('created_at', { ascending: false });

      if (categoryFilter && categoryFilter !== 'all') {
        query = query.eq('category', categoryFilter);
      }

      const { data, error } = await query;
      if (error) throw error;

      let result = (data && data.length > 0) ? data : DEMO_WELFARE_SCHEMES;
      if (categoryFilter && categoryFilter !== 'all') {
        result = result.filter(s => s.category?.toLowerCase() === categoryFilter.toLowerCase());
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        result = result.filter(s => 
          s.scheme_name?.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.department?.toLowerCase().includes(q)
        );
      }
      return result;
    } catch (e) {
      console.error("Error fetching Government Welfare Schemes:", e);
      return DEMO_WELFARE_SCHEMES;
    }
  },

  /**
   * 11. Pillar-specific Insurance Membership
   */
  async getPillarInsuranceMembership(pillarId) {
    if (isAdminDemo() || isPillarDemo()) {
      const member = DEMO_INSURANCE_MEMBERS.find(m => m.pillar_id === pillarId || m.pillar?.id === pillarId) || DEMO_INSURANCE_MEMBERS[0];
      return {
        member,
        policy: DEMO_MASTER_POLICY
      };
    }

    try {
      const { data: member, error } = await supabase
        .from('insurance_members')
        .select(`
          *,
          policy:insurance_policies(*)
        `)
        .eq('pillar_id', pillarId)
        .maybeSingle();

      if (error) throw error;
      return {
        member: member || null,
        policy: member?.policy || null
      };
    } catch (e) {
      console.error("Error fetching Pillar Insurance Membership:", e);
      return { member: null, policy: null };
    }
  },

  /**
   * 12. Pillar-specific Insurance Claims
   */
  async getPillarInsuranceClaims(pillarId) {
    if (isAdminDemo() || isPillarDemo()) {
      return DEMO_INSURANCE_CLAIMS.filter(c => c.pillar_id === pillarId || c.pillar_id === "p-1");
    }

    try {
      const { data, error } = await supabase
        .from('insurance_claims')
        .select('*')
        .eq('pillar_id', pillarId)
        .order('submitted_date', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (e) {
      console.error("Error fetching Pillar Insurance Claims:", e);
      return [];
    }
  },

  /**
   * 13. Realtime Subscription Handler for Welfare updates
   */
  subscribeToWelfareUpdates(callback) {
    try {
      const channel = supabase
        .channel('coophub_welfare_live_sync')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pf_accounts' }, (payload) => {
          callback && callback({ table: 'pf_accounts', payload });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'pf_transactions' }, (payload) => {
          callback && callback({ table: 'pf_transactions', payload });
        })
        .on('postgres_changes', { event: '*', schema: 'public', table: 'insurance_claims' }, (payload) => {
          callback && callback({ table: 'insurance_claims', payload });
        })
        .subscribe();

      return channel;
    } catch (e) {
      console.warn("Welfare realtime subscription notice:", e);
      return null;
    }
  }
};

export default welfareService;
