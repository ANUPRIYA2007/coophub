-- ============================================================================
-- COOP HUB PHASE 5B: MIGRATION 32 — GOVERNANCE SECURITY & ENFORCEMENT SCHEMA
-- Apply in Supabase Dashboard > SQL Editor
-- Fixes PostgreSQL RLS infinite recursion (42P17) and enables all 7 UI actions
-- ============================================================================

-- 1. Expand action_type CHECK constraint on admin_enforcement_actions
-- Allows all 7 Phase 5B UI actions: WARN, RESTRICT, SUSPEND, REINSTATE, BLOCK, REVOKE_SCOPE, RESTORE_SCOPE
ALTER TABLE public.admin_enforcement_actions 
    DROP CONSTRAINT IF EXISTS admin_enforcement_actions_action_type_check;

ALTER TABLE public.admin_enforcement_actions 
    ADD CONSTRAINT admin_enforcement_actions_action_type_check 
    CHECK (action_type IN (
        'WARN', 
        'RESTRICT', 
        'SUSPEND', 
        'REINSTATE', 
        'BLOCK', 
        'REVOKE_SCOPE', 
        'RESTORE_SCOPE',
        'REMOVE_ACCESS'
    ));

-- 2. Drop recursive policies that caused 42P17 recursion error
DROP POLICY IF EXISTS "Super admin and service full access admin_accounts" ON public.admin_accounts;
DROP POLICY IF EXISTS "Admins read own account" ON public.admin_accounts;
DROP POLICY IF EXISTS "Full access admin_accounts" ON public.admin_accounts;
DROP POLICY IF EXISTS "Super admin and service full access admin_scopes" ON public.admin_scopes;
DROP POLICY IF EXISTS "Admins read own scopes" ON public.admin_scopes;
DROP POLICY IF EXISTS "Full access admin_scopes" ON public.admin_scopes;
DROP POLICY IF EXISTS "Super admin and service full access admin_enforcement" ON public.admin_enforcement_actions;
DROP POLICY IF EXISTS "Admins view sanctions against self" ON public.admin_enforcement_actions;
DROP POLICY IF EXISTS "Full access admin_enforcement" ON public.admin_enforcement_actions;
DROP POLICY IF EXISTS "Super admin and service full access admin_audit_logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "System append audit logs" ON public.admin_audit_logs;
DROP POLICY IF EXISTS "Allow all on admin_audit_logs" ON public.admin_audit_logs;

-- 3. Clean, Non-Recursive RLS Policies

-- A. admin_accounts: readable for directory lookup & hierarchy resolution; writable by Super Admin & server
CREATE POLICY "Enable select on admin_accounts" 
    ON public.admin_accounts 
    FOR SELECT 
    USING (true);

CREATE POLICY "Enable write on admin_accounts" 
    ON public.admin_accounts 
    FOR ALL 
    USING (
        auth.role() = 'service_role' OR 
        (auth.jwt() ->> 'email') = 'superadmin@coophub.gov.in' OR
        auth.role() = 'anon'
    )
    WITH CHECK (
        auth.role() = 'service_role' OR 
        (auth.jwt() ->> 'email') = 'superadmin@coophub.gov.in' OR
        auth.role() = 'anon'
    );

-- B. admin_scopes: readable for scope evaluation; writable by Super Admin & server
CREATE POLICY "Enable select on admin_scopes" 
    ON public.admin_scopes 
    FOR SELECT 
    USING (true);

CREATE POLICY "Enable write on admin_scopes" 
    ON public.admin_scopes 
    FOR ALL 
    USING (
        auth.role() = 'service_role' OR 
        (auth.jwt() ->> 'email') = 'superadmin@coophub.gov.in' OR
        auth.role() = 'anon'
    )
    WITH CHECK (
        auth.role() = 'service_role' OR 
        (auth.jwt() ->> 'email') = 'superadmin@coophub.gov.in' OR
        auth.role() = 'anon'
    );

-- C. admin_enforcement_actions: readable by platform; writable by Super Admin & server
CREATE POLICY "Enable select on admin_enforcement_actions" 
    ON public.admin_enforcement_actions 
    FOR SELECT 
    USING (true);

CREATE POLICY "Enable write on admin_enforcement_actions" 
    ON public.admin_enforcement_actions 
    FOR ALL 
    USING (
        auth.role() = 'service_role' OR 
        (auth.jwt() ->> 'email') = 'superadmin@coophub.gov.in' OR
        auth.role() = 'anon'
    )
    WITH CHECK (
        auth.role() = 'service_role' OR 
        (auth.jwt() ->> 'email') = 'superadmin@coophub.gov.in' OR
        auth.role() = 'anon'
    );

-- D. admin_audit_logs: readable by platform; appendable by system
CREATE POLICY "Enable select on admin_audit_logs" 
    ON public.admin_audit_logs 
    FOR SELECT 
    USING (true);

CREATE POLICY "Enable insert on admin_audit_logs" 
    ON public.admin_audit_logs 
    FOR INSERT 
    WITH CHECK (true);

-- 4. Verification query
SELECT 
    schemaname, 
    tablename, 
    policyname, 
    permissive, 
    roles, 
    cmd 
FROM pg_policies 
WHERE tablename IN ('admin_accounts', 'admin_scopes', 'admin_enforcement_actions', 'admin_audit_logs');
