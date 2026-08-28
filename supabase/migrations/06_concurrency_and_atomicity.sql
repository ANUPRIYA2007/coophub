-- ==============================================================================
-- COOP HUB: DATABASE-LEVEL CONCURRENCY, ATOMICITY & IDEMPOTENCY MIGRATION
-- Migration 06 (Unified & Concurrency Safe)
-- Run this in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/aqzkzaswckfoazpqeeti/sql
-- ==============================================================================

-- 1. ENSURE PF WITHDRAWALS TABLE EXISTS
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

-- Enable RLS for pf_withdrawals
ALTER TABLE public.pf_withdrawals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on pf_withdrawals" ON public.pf_withdrawals;
CREATE POLICY "Allow all on pf_withdrawals" ON public.pf_withdrawals FOR ALL USING (true);

-- 2. ENSURE ADMIN AUDIT LOGS TABLE EXISTS
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

-- Enable RLS for admin_audit_logs
ALTER TABLE public.admin_audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all on admin_audit_logs" ON public.admin_audit_logs;
CREATE POLICY "Allow all on admin_audit_logs" ON public.admin_audit_logs FOR ALL USING (true);

-- 3. ENSURE REFERENCE_NO, AMOUNT & TRANSACTION_TYPE EXIST ON PF_TRANSACTIONS
ALTER TABLE public.pf_transactions ADD COLUMN IF NOT EXISTS reference_no TEXT;
ALTER TABLE public.pf_transactions ADD COLUMN IF NOT EXISTS transaction_type TEXT DEFAULT 'contribution';
ALTER TABLE public.pf_transactions ADD COLUMN IF NOT EXISTS amount NUMERIC(10, 2) DEFAULT 0.00;

-- 4. DUPLICATE LEDGER TRANSACTION PROTECTION
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint WHERE conname = 'uq_pf_transactions_transaction_code'
    ) THEN
        ALTER TABLE public.pf_transactions 
        ADD CONSTRAINT uq_pf_transactions_transaction_code UNIQUE (transaction_code);
    END IF;
END $$;

-- Drop old partial index if exists and recreate with exact column 'transaction_type'
DROP INDEX IF EXISTS public.idx_pf_transactions_unique_withdrawal_ref;
CREATE UNIQUE INDEX idx_pf_transactions_unique_withdrawal_ref
ON public.pf_transactions (reference_no)
WHERE transaction_type = 'withdrawal' AND reference_no IS NOT NULL;

-- 5. ATOMIC PF WITHDRAWAL APPROVAL RPC FUNCTION (POSTGRESQL ACID)
CREATE OR REPLACE FUNCTION public.approve_pf_withdrawal_atomic(
    p_withdrawal_id UUID,
    p_admin_id TEXT DEFAULT 'ADM-CHE-001',
    p_admin_notes TEXT DEFAULT ''
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_wdr RECORD;
    v_acc RECORD;
    v_new_balance NUMERIC;
    v_new_total_wdr NUMERIC;
    v_ref_no TEXT;
    v_result JSONB;
BEGIN
    -- STEP 1: Acquire exclusive row lock on pf_withdrawals and verify 'pending' state
    SELECT * INTO v_wdr
    FROM public.pf_withdrawals
    WHERE id = p_withdrawal_id AND status = 'pending'
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Withdrawal has already been processed by another administrator.';
    END IF;

    -- STEP 2: Acquire exclusive row lock on associated pf_accounts record
    SELECT * INTO v_acc
    FROM public.pf_accounts
    WHERE (id = v_wdr.account_id OR pillar_id = v_wdr.pillar_id)
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Pillar PF account not found.';
    END IF;

    -- STEP 3: Verify balance sufficiency under lock
    IF v_acc.current_balance < v_wdr.amount THEN
        RAISE EXCEPTION 'Insufficient PF balance.';
    END IF;

    v_new_balance := v_acc.current_balance - v_wdr.amount;
    v_new_total_wdr := COALESCE(v_acc.total_withdrawals, 0) + v_wdr.amount;
    v_ref_no := COALESCE(v_wdr.withdrawal_code, 'WDR-' || LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0'));

    -- STEP 4: Atomically update PF account balance
    UPDATE public.pf_accounts
    SET current_balance = v_new_balance,
        total_withdrawals = v_new_total_wdr,
        updated_at = NOW()
    WHERE id = v_acc.id;

    -- STEP 5: Atomically insert exactly ONE debit transaction into ledger
    INSERT INTO public.pf_transactions (
        pf_account_id,
        pillar_id,
        transaction_code,
        transaction_type,
        amount,
        credit,
        debit,
        balance_after,
        description,
        reference_no,
        status,
        created_at
    ) VALUES (
        v_acc.id,
        v_wdr.pillar_id,
        'TX-WDR-' || EXTRACT(EPOCH FROM NOW())::BIGINT || '-' || SUBSTRING(p_withdrawal_id::TEXT FROM 1 FOR 4),
        'withdrawal',
        v_wdr.amount,
        0.00,
        v_wdr.amount,
        v_new_balance,
        'PF Withdrawal Authorized: ' || COALESCE(v_wdr.reason, 'Disbursement Approved'),
        v_ref_no,
        'completed',
        NOW()
    );

    -- STEP 6: Atomically update withdrawal record status to 'approved'
    UPDATE public.pf_withdrawals
    SET status = 'approved',
        approved_at = NOW(),
        approved_by = p_admin_id,
        admin_notes = p_admin_notes,
        updated_at = NOW()
    WHERE id = p_withdrawal_id;

    -- STEP 7: Assemble return payload
    v_result := jsonb_build_object(
        'success', true,
        'id', v_wdr.id,
        'withdrawal_code', v_ref_no,
        'pillar_id', v_wdr.pillar_id,
        'amount', v_wdr.amount,
        'new_balance', v_new_balance,
        'status', 'approved',
        'approved_by', p_admin_id,
        'approved_at', NOW()
    );

    RETURN v_result;
END;
$$;

-- Grant execution to authenticated users / service roles
GRANT EXECUTE ON FUNCTION public.approve_pf_withdrawal_atomic(UUID, TEXT, TEXT) TO authenticated, service_role;
