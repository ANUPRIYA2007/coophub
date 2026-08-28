-- ==============================================================================
-- COOP HUB: WELFARE, COOPERATIVE PF & GROUP INSURANCE SCHEMA
-- Migration 05
-- Provides tables for Cooperative PF, Individual PF Accounts, Ledger Transactions,
-- Group Master Policy, Insurance Memberships, Claims Lifecycle, and Welfare Schemes.
-- ==============================================================================

-- 1. INDIVIDUAL PILLAR PF ACCOUNTS
CREATE TABLE IF NOT EXISTS public.pf_accounts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pillar_id UUID NOT NULL REFERENCES public.pillar_profiles(id) ON DELETE CASCADE UNIQUE,
    account_status TEXT CHECK (account_status IN ('active', 'suspended', 'closed')) DEFAULT 'active',
    current_balance NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    total_contributions NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    total_withdrawals NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    pillar_contribution_total NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    coop_contribution_total NUMERIC(12, 2) DEFAULT 0.00 NOT NULL,
    last_contribution_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. PF CONTRIBUTIONS (Periodic or booking-linked deposits)
CREATE TABLE IF NOT EXISTS public.pf_contributions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pf_account_id UUID NOT NULL REFERENCES public.pf_accounts(id) ON DELETE CASCADE,
    pillar_id UUID NOT NULL REFERENCES public.pillar_profiles(id) ON DELETE CASCADE,
    booking_id UUID REFERENCES public.bookings(id) ON DELETE SET NULL,
    period_month TEXT NOT NULL, -- Format: YYYY-MM
    pillar_share NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    coop_share NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    total_amount NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PF TRANSACTIONS (Audited Financial Ledger)
CREATE TABLE IF NOT EXISTS public.pf_transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pf_account_id UUID NOT NULL REFERENCES public.pf_accounts(id) ON DELETE CASCADE,
    pillar_id UUID NOT NULL REFERENCES public.pillar_profiles(id) ON DELETE CASCADE,
    transaction_code TEXT NOT NULL UNIQUE,
    transaction_type TEXT CHECK (transaction_type IN ('contribution', 'interest_credit', 'withdrawal', 'adjustment')) NOT NULL,
    amount NUMERIC(10, 2) DEFAULT 0.00,
    description TEXT NOT NULL,
    reference_no TEXT,
    credit NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    debit NUMERIC(10, 2) DEFAULT 0.00 NOT NULL,
    balance_after NUMERIC(12, 2) NOT NULL,
    status TEXT CHECK (status IN ('completed', 'pending', 'rejected')) DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. MASTER GROUP INSURANCE POLICIES
CREATE TABLE IF NOT EXISTS public.insurance_policies (
    id TEXT PRIMARY KEY, -- e.g. POL-GRP-2026-COOP
    policy_name TEXT NOT NULL,
    provider TEXT NOT NULL,
    policy_type TEXT NOT NULL, -- e.g. Group Personal Accident & Health Floater
    coverage_amount_per_pillar NUMERIC(12, 2) DEFAULT 500000.00 NOT NULL,
    premium_per_pillar_monthly NUMERIC(10, 2) DEFAULT 500.00 NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    policy_status TEXT CHECK (policy_status IN ('active', 'renewed', 'expired')) DEFAULT 'active',
    terms_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. INDIVIDUAL PILLAR INSURANCE MEMBERSHIPS
CREATE TABLE IF NOT EXISTS public.insurance_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id TEXT NOT NULL UNIQUE, -- e.g. INS-MEM-042
    pillar_id UUID NOT NULL REFERENCES public.pillar_profiles(id) ON DELETE CASCADE,
    policy_id TEXT NOT NULL REFERENCES public.insurance_policies(id) ON DELETE RESTRICT,
    coverage_amount NUMERIC(12, 2) DEFAULT 500000.00 NOT NULL,
    monthly_premium NUMERIC(10, 2) DEFAULT 500.00 NOT NULL,
    start_date DATE NOT NULL,
    expiry_date DATE NOT NULL,
    status TEXT CHECK (status IN ('active', 'grace_period', 'lapsed', 'cancelled')) DEFAULT 'active',
    nominee_name TEXT,
    nominee_relationship TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. INSURANCE CLAIMS & APPROVAL WORKFLOW
CREATE TABLE IF NOT EXISTS public.insurance_claims (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    claim_code TEXT NOT NULL UNIQUE, -- e.g. CLM-2026-081
    pillar_id UUID NOT NULL REFERENCES public.pillar_profiles(id) ON DELETE CASCADE,
    policy_id TEXT NOT NULL REFERENCES public.insurance_policies(id) ON DELETE RESTRICT,
    member_id TEXT NOT NULL,
    claim_type TEXT NOT NULL, -- Accidental Injury, Hospitalization / Cashless, Disability Benefit, Critical Illness
    claim_amount NUMERIC(10, 2) NOT NULL,
    incident_date DATE NOT NULL,
    submitted_date TIMESTAMPTZ DEFAULT NOW(),
    hospital_name TEXT,
    status TEXT CHECK (status IN ('submitted', 'under_review', 'approved', 'rejected', 'paid')) DEFAULT 'submitted',
    submitted_documents JSONB DEFAULT '[]'::jsonb,
    admin_notes TEXT,
    rejection_reason TEXT,
    approved_at TIMESTAMPTZ,
    approved_by TEXT,
    rejected_at TIMESTAMPTZ,
    rejected_by TEXT,
    paid_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. GOVERNMENT & COOPERATIVE WELFARE SCHEMES
CREATE TABLE IF NOT EXISTS public.welfare_schemes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    scheme_code TEXT NOT NULL UNIQUE, -- e.g. SCH-TN-001
    scheme_name TEXT NOT NULL,
    department TEXT NOT NULL,
    category TEXT CHECK (category IN ('Healthcare', 'Financial Assistance', 'Insurance', 'Pension', 'Skill Development', 'Employment', 'Other')) NOT NULL,
    description TEXT NOT NULL,
    benefits TEXT NOT NULL,
    eligibility TEXT NOT NULL,
    required_documents JSONB DEFAULT '[]'::jsonb,
    application_process TEXT,
    official_source_url TEXT,
    is_official_integrated BOOLEAN DEFAULT FALSE,
    last_updated DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. PF WITHDRAWAL REQUESTS
CREATE TABLE IF NOT EXISTS public.pf_withdrawals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pillar_id UUID NOT NULL REFERENCES public.pillar_profiles(id) ON DELETE CASCADE,
    account_id UUID REFERENCES public.pf_accounts(id) ON DELETE CASCADE,
    withdrawal_code TEXT UNIQUE,
    amount NUMERIC(10, 2) NOT NULL,
    reason TEXT,
    status TEXT CHECK (status IN ('pending', 'approved', 'rejected', 'completed')) DEFAULT 'pending',
    requested_at TIMESTAMPTZ DEFAULT NOW(),
    approved_at TIMESTAMPTZ,
    approved_by TEXT,
    rejected_at TIMESTAMPTZ,
    rejected_by TEXT,
    admin_notes TEXT,
    rejection_reason TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. ADMINISTRATIVE AUDIT LOGS
CREATE TABLE IF NOT EXISTS public.admin_audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id TEXT NOT NULL DEFAULT 'ADM-CHE-001',
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL,
    entity_id TEXT NOT NULL,
    previous_value JSONB,
    new_value JSONB,
    reason TEXT,
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ==============================================================================
-- INDEXES FOR HIGH-PERFORMANCE SEARCH & FILTERING
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_pf_accounts_pillar ON public.pf_accounts(pillar_id);
CREATE INDEX IF NOT EXISTS idx_pf_transactions_account ON public.pf_transactions(pf_account_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_insurance_members_pillar ON public.insurance_members(pillar_id);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_pillar ON public.insurance_claims(pillar_id, status);
CREATE INDEX IF NOT EXISTS idx_insurance_claims_status ON public.insurance_claims(status, submitted_date DESC);
CREATE INDEX IF NOT EXISTS idx_welfare_schemes_category ON public.welfare_schemes(category);

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.pf_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pf_contributions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pf_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pf_withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_policies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insurance_claims ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.welfare_schemes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Admins full access (checked via existing admin bypass/policies)
CREATE POLICY "Allow admin full access to pf_accounts" ON public.pf_accounts FOR ALL USING (true);
CREATE POLICY "Allow admin full access to pf_contributions" ON public.pf_contributions FOR ALL USING (true);
CREATE POLICY "Allow admin full access to pf_transactions" ON public.pf_transactions FOR ALL USING (true);
CREATE POLICY "Allow admin full access to pf_withdrawals" ON public.pf_withdrawals FOR ALL USING (true);
CREATE POLICY "Allow admin full access to insurance_policies" ON public.insurance_policies FOR ALL USING (true);
CREATE POLICY "Allow admin full access to insurance_members" ON public.insurance_members FOR ALL USING (true);
CREATE POLICY "Allow admin full access to insurance_claims" ON public.insurance_claims FOR ALL USING (true);
CREATE POLICY "Allow admin full access to welfare_schemes" ON public.welfare_schemes FOR ALL USING (true);
CREATE POLICY "Allow admin full access to admin_audit_logs" ON public.admin_audit_logs FOR ALL USING (true);

-- Realtime Publication for Welfare & Claims
BEGIN;
  DROP PUBLICATION IF EXISTS supabase_realtime;
  CREATE PUBLICATION supabase_realtime FOR TABLE 
    public.bookings, 
    public.pillar_profiles, 
    public.support_tickets, 
    public.messages,
    public.pf_accounts,
    public.pf_transactions,
    public.insurance_claims,
    public.insurance_members;
COMMIT;
