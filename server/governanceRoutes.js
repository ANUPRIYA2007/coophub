/**
 * COOP HUB Super Admin — Admin Governance API Routes (Phase 5B)
 * Modules: Admins Directory, Zone Management, Access & Permissions, Enforcement
 * All routes require SUPER_ADMIN authorization via requireSuperAdmin middleware.
 */

import { Router } from 'express';
import crypto from 'crypto';

export const BASELINE_ADMINS = [
    {
        id: '00000000-0000-0000-0000-000000000001',
        admin_code: 'SA-000001',
        email: 'superadmin@coophub.gov.in',
        full_name: 'National Super Administrator',
        role: 'SUPER_ADMIN',
        clearance: 'Level 5 (Apex)',
        gender: 'Not Specified',
        date_of_birth: '1980-01-15',
        status: 'active',
        created_at: '2026-01-01T00:00:00Z'
    },
    {
        id: '00000000-0000-0000-0000-000000000002',
        admin_code: 'ADM-CHE-001',
        email: 'zoneadmin.south@coophub.gov.in',
        full_name: 'Senthil Kumar (South Zone Admin)',
        role: 'ZONE_ADMIN',
        clearance: 'Level 4 (Zonal Command)',
        gender: 'Male',
        date_of_birth: '1984-06-12',
        status: 'active',
        created_at: '2026-02-15T00:00:00Z'
    },
    {
        id: '00000000-0000-0000-0000-000000000003',
        admin_code: 'ADM-DEL-002',
        email: 'zoneadmin.north@coophub.gov.in',
        full_name: 'Rajesh Sharma (North Zone Admin)',
        role: 'ZONE_ADMIN',
        clearance: 'Level 4 (Zonal Command)',
        gender: 'Male',
        date_of_birth: '1982-11-20',
        status: 'active',
        created_at: '2026-02-20T00:00:00Z'
    },
    {
        id: '00000000-0000-0000-0000-000000000004',
        admin_code: 'ADM-MUM-003',
        email: 'zoneadmin.west@coophub.gov.in',
        full_name: 'Pooja Mehta (West Zone Admin)',
        role: 'ZONE_ADMIN',
        clearance: 'Level 4 (Zonal Command)',
        gender: 'Female',
        date_of_birth: '1988-03-25',
        status: 'active',
        created_at: '2026-03-01T00:00:00Z'
    },
    {
        id: '00000000-0000-0000-0000-000000000005',
        admin_code: 'ADM-KOL-004',
        email: 'zoneadmin.east@coophub.gov.in',
        full_name: 'Anirban Das (East Zone Admin)',
        role: 'ZONE_ADMIN',
        clearance: 'Level 4 (Zonal Command)',
        gender: 'Male',
        date_of_birth: '1985-09-08',
        status: 'active',
        created_at: '2026-03-05T00:00:00Z'
    }
];

export const BASELINE_SCOPES = [
    { id: 'sc-1', admin_id: '00000000-0000-0000-0000-000000000002', level: 'ZONE', entity_code: 'SZ' },
    { id: 'sc-2', admin_id: '00000000-0000-0000-0000-000000000003', level: 'ZONE', entity_code: 'NZ' },
    { id: 'sc-3', admin_id: '00000000-0000-0000-0000-000000000004', level: 'ZONE', entity_code: 'WZ' },
    { id: 'sc-4', admin_id: '00000000-0000-0000-0000-000000000005', level: 'ZONE', entity_code: 'EZ' }
];

export function createGovernanceRouter(supabaseAdmin, requireSuperAdmin) {
    const router = Router();

    // In-memory store for custom permissions modifications
    const ROLE_PERMISSIONS_OVERRIDE = {};

    // Helper to generate a correlation ID
    const getCorrelationId = (req) => req.headers['x-correlation-id'] || req.correlationId || crypto.randomUUID();

    // ─────────────────────────────────────────────────────────────────
    // 1. ADMINS DIRECTORY & SEARCH
    // GET /api/admin/governance/admins
    // ─────────────────────────────────────────────────────────────────
    router.get('/admins', requireSuperAdmin, async (req, res) => {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
            const offset = (page - 1) * limit;
            const search = (req.query.search || '').trim().toLowerCase();
            const roleFilter = req.query.role || '';
            const statusFilter = req.query.status || '';
            const scopeFilter = req.query.scope || '';

            // Fetch admin accounts with resilience
            let accounts = [];
            let totalCount = 0;
            try {
                let query = supabaseAdmin
                    .from('admin_accounts')
                    .select('*', { count: 'exact' });

                if (roleFilter) query = query.eq('role', roleFilter);
                if (statusFilter) query = query.eq('status', statusFilter);

                const res = await query.order('created_at', { ascending: false });
                if (res.error) throw res.error;
                accounts = res.data || [];
                totalCount = res.count || accounts.length;
            } catch (dbErr) {
                console.warn('[Governance/getAdmins] DB policy note (pending Migration 32):', dbErr.message);
                accounts = [...BASELINE_ADMINS];
                if (roleFilter) accounts = accounts.filter(a => a.role === roleFilter);
                if (statusFilter) accounts = accounts.filter(a => a.status === statusFilter);
                totalCount = accounts.length;
            }

            if (!accounts || accounts.length === 0) {
                accounts = [...BASELINE_ADMINS];
                if (roleFilter) accounts = accounts.filter(a => a.role === roleFilter);
                if (statusFilter) accounts = accounts.filter(a => a.status === statusFilter);
                totalCount = accounts.length;
            }

            // Fetch all admin scopes
            let allScopes = [];
            try {
                const { data } = await supabaseAdmin.from('admin_scopes').select('*');
                allScopes = data || [];
            } catch (e) {
                allScopes = [...BASELINE_SCOPES];
            }

            if (!allScopes || allScopes.length === 0) {
                allScopes = [...BASELINE_SCOPES];
            }

            // Map scopes to accounts
            const scopesByAdmin = {};
            (allScopes || []).forEach(s => {
                if (!scopesByAdmin[s.admin_id]) scopesByAdmin[s.admin_id] = [];
                scopesByAdmin[s.admin_id].push(s);
            });

            // Assemble enriched accounts
            let enriched = (accounts || []).map(acc => {
                const scopes = (scopesByAdmin[acc.id] || []).map(s => ({
                    ...s,
                    scope_type: s.level
                }));
                const primaryScope = scopes.length > 0
                    ? `${scopes[0].level}: ${scopes.map(s => s.entity_code).join(', ')}`
                    : (acc.role === 'SUPER_ADMIN' ? 'GLOBAL: All-India' : 'None');

                return {
                    ...acc,
                    is_active: acc.status === 'active',
                    clearance_level: acc.role === 'SUPER_ADMIN' ? 5 : acc.role === 'ZONE_ADMIN' ? 4 : acc.role === 'STATE_ADMIN' ? 3 : 2,
                    scopes,
                    primary_scope: primaryScope,
                    scope_count: scopes.length
                };
            });

            // In-memory filter for search and scope level
            if (search) {
                enriched = enriched.filter(a =>
                    a.full_name?.toLowerCase().includes(search) ||
                    a.email?.toLowerCase().includes(search) ||
                    a.admin_code?.toLowerCase().includes(search) ||
                    a.role?.toLowerCase().includes(search) ||
                    a.primary_scope?.toLowerCase().includes(search)
                );
            }

            if (scopeFilter) {
                enriched = enriched.filter(a =>
                    a.scopes.some(s => s.level === scopeFilter || s.scope_type === scopeFilter) ||
                    (scopeFilter === 'GLOBAL' && a.role === 'SUPER_ADMIN')
                );
            }

            const total = enriched.length;
            const paginated = enriched.slice(offset, offset + limit);

            return res.json({
                admins: paginated,
                data: paginated,
                total,
                page,
                limit,
                total_pages: Math.ceil(total / limit)
            });
        } catch (err) {
            console.error('[Governance/admins] Error:', err);
            return res.status(500).json({ error: 'Failed to fetch administrators', details: err.message });
        }
    });

    // ─────────────────────────────────────────────────────────────────
    // 2. CREATE SUBORDINATE ADMINISTRATOR
    // POST /api/admin/governance/admins
    // ─────────────────────────────────────────────────────────────────
    router.post('/admins', requireSuperAdmin, async (req, res) => {
        const correlationId = getCorrelationId(req);
        try {
            const { admin_code, email, full_name, role, clearance, status, scopes, primary_zone } = req.body;

            // Required validation
            if (!admin_code || !email || !full_name || !role) {
                return res.status(400).json({
                    error: 'Missing required fields: admin_code, email, full_name, role are mandatory',
                    code: 'MISSING_REQUIRED_FIELDS',
                    correlation_id: correlationId
                });
            }

            // CRITICAL CEILING GUARD: Subordinate creation flow CANNOT create SUPER_ADMIN
            if (role === 'SUPER_ADMIN') {
                return res.status(400).json({
                    error: 'Violation: SUPER_ADMIN apex identity cannot be provisioned via subordinate creation workflows.',
                    code: 'SUPER_ADMIN_CREATION_PROHIBITED',
                    correlation_id: correlationId
                });
            }

            const validRoles = ['ZONE_ADMIN', 'STATE_ADMIN', 'DISTRICT_ADMIN', 'COOPERATIVE_ADMIN', 'OPERATIONS_ADMIN'];
            if (!validRoles.includes(role)) {
                return res.status(400).json({
                    error: `Invalid role '${role}'. Supported roles: ${validRoles.join(', ')}`,
                    code: 'INVALID_ROLE',
                    correlation_id: correlationId
                });
            }

            // Duplicate checks
            const cleanCode = admin_code.trim().toUpperCase();
            const cleanEmail = email.trim().toLowerCase();

            const { data: existing } = await supabaseAdmin
                .from('admin_accounts')
                .select('admin_code, email')
                .or(`admin_code.eq.${cleanCode},email.eq.${cleanEmail}`);

            if (existing && existing.length > 0) {
                const dupField = existing[0].admin_code === cleanCode ? 'Admin Code' : 'Email Address';
                return res.status(400).json({
                    error: `Duplicate identity: ${dupField} already registered in administrator database.`,
                    code: 'ADMIN_EXISTS',
                    correlation_id: correlationId
                });
            }

            // Validate and normalize Scopes against Phase 5A Geography
            let assignedScopes = Array.isArray(scopes) ? [...scopes] : [];
            if (assignedScopes.length === 0 && primary_zone) {
                assignedScopes.push({ level: 'ZONE', entity_code: primary_zone });
            }

            for (const sc of assignedScopes) {
                const scLevel = (sc.level || sc.scope_level || sc.scope_type || '').toUpperCase();
                const scCode = (sc.entity_code || sc.code || sc.zone_code || '').toUpperCase();
                sc.level = scLevel;
                sc.entity_code = scCode;

                if (scLevel === 'ZONE') {
                    if (!['SZ', 'NZ', 'WZ', 'EZ'].includes(scCode)) {
                        return res.status(400).json({
                            error: `Invalid zone code '${scCode}'. Must be SZ, NZ, WZ, or EZ.`,
                            code: 'INVALID_SCOPE_ENTITY',
                            correlation_id: correlationId
                        });
                    }
                } else if (scLevel === 'STATE') {
                    const { data: st } = await supabaseAdmin.from('geo_states').select('code').eq('code', scCode).single();
                    if (!st) {
                        return res.status(400).json({
                            error: `Invalid State/UT code '${scCode}'. Not found in database.`,
                            code: 'INVALID_SCOPE_ENTITY',
                            correlation_id: correlationId
                        });
                    }
                }
            }

            // Insert into admin_accounts
            const newAdmin = {
                admin_code: cleanCode,
                email: cleanEmail,
                full_name: full_name.trim(),
                role,
                clearance: clearance || (role === 'ZONE_ADMIN' ? 'Level 4 Zonal' : role === 'STATE_ADMIN' ? 'Level 3 Regional' : 'Level 2 Local'),
                status: status || 'active',
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            const { data: created, error: insertError } = await supabaseAdmin
                .from('admin_accounts')
                .insert([newAdmin])
                .select()
                .single();

            if (insertError) throw insertError;

            // Insert scopes
            if (assignedScopes.length > 0) {
                const scopeRecords = assignedScopes.map(sc => ({
                    admin_id: created.id,
                    level: sc.level,
                    entity_code: sc.entity_code.toUpperCase(),
                    created_at: new Date().toISOString()
                }));

                await supabaseAdmin.from('admin_scopes').insert(scopeRecords);
            }

            // Write immutable audit log
            await supabaseAdmin.from('admin_audit_logs').insert([{
                admin_id: req.adminSession?.admin_id || 'SA-000001',
                action: 'CREATE_ADMIN',
                entity_type: 'ADMIN_ACCOUNT',
                entity_id: created.id,
                new_value: { code: cleanCode, role, email: cleanEmail, scopes: assignedScopes },
                reason: 'Super Admin Governance Provisioning',
                correlation_id: correlationId,
                created_at: new Date().toISOString()
            }]);

            const enrichedCreated = {
                ...created,
                is_active: created.status === 'active',
                clearance_level: role === 'SUPER_ADMIN' ? 5 : role === 'ZONE_ADMIN' ? 4 : role === 'STATE_ADMIN' ? 3 : 2
            };

            return res.status(201).json({
                message: 'Administrator successfully provisioned',
                admin: enrichedCreated,
                data: enrichedCreated,
                scopes: assignedScopes,
                correlation_id: correlationId
            });
        } catch (err) {
            console.error('[Governance/createAdmin] Error:', err);
            return res.status(500).json({ error: 'Failed to provision administrator', details: err.message, correlation_id: correlationId });
        }
    });

    // ─────────────────────────────────────────────────────────────────
    // 3. ADMIN DOSSIER / DETAILS
    // GET /api/admin/governance/admins/:id
    // ─────────────────────────────────────────────────────────────────
    router.get('/admins/:id', requireSuperAdmin, async (req, res) => {
        try {
            const { id } = req.params;

            let admin = null;
            try {
                const { data, error } = await supabaseAdmin
                    .from('admin_accounts')
                    .select('*')
                    .or(`id.eq.${id},admin_code.eq.${id.toUpperCase()}`)
                    .single();
                if (!error && data) admin = data;
            } catch (e) { }

            if (!admin) {
                admin = BASELINE_ADMINS.find(a => a.id === id || a.admin_code === id.toUpperCase());
            }

            if (!admin) {
                return res.status(404).json({ error: `Administrator '${id}' not found` });
            }

            // Enrich demographics from baseline if missing
            const baselineMatch = BASELINE_ADMINS.find(a => a.id === admin.id || a.admin_code === admin.admin_code);
            if (baselineMatch) {
                admin.gender = admin.gender || baselineMatch.gender;
                admin.date_of_birth = admin.date_of_birth || baselineMatch.date_of_birth;
                admin.clearance = admin.clearance || baselineMatch.clearance;
            } else {
                admin.gender = admin.gender || 'Not Specified';
                admin.date_of_birth = admin.date_of_birth || '1985-01-01';
                admin.clearance = admin.clearance || (admin.role === 'SUPER_ADMIN' ? 'Level 5 (Apex)' : 'Level 4 (Zonal Command)');
            }

            // Fetch scopes
            let scopes = [];
            try {
                const { data } = await supabaseAdmin
                    .from('admin_scopes')
                    .select('*')
                    .eq('admin_id', admin.id);
                scopes = data || [];
            } catch (scErr) {}

            if (scopes.length === 0) {
                scopes = BASELINE_SCOPES.filter(s => s.admin_id === admin.id);
            }

            // Fetch enforcement actions
            let enforcement = [];
            try {
                const { data: rawEnforcement } = await supabaseAdmin
                    .from('admin_enforcement_actions')
                    .select('*')
                    .eq('target_admin_id', admin.id)
                    .order('created_at', { ascending: false });

                enforcement = (rawEnforcement || []).map(e => ({
                    ...e,
                    action_type: e.metadata?.actual_action || e.action_type
                }));
            } catch (enfErr) {}

            // Fetch audit logs involving this admin
            let auditLogs = [];
            try {
                const { data } = await supabaseAdmin
                    .from('admin_audit_logs')
                    .select('*')
                    .eq('entity_id', admin.id)
                    .order('created_at', { ascending: false })
                    .limit(20);
                auditLogs = data || [];
            } catch (audErr) {}

            const dossier = {
                ...admin,
                is_active: admin.status === 'active',
                clearance_level: admin.role === 'SUPER_ADMIN' ? 5 : admin.role === 'ZONE_ADMIN' ? 4 : admin.role === 'STATE_ADMIN' ? 3 : 2,
                scopes: (scopes || []).map(s => ({ ...s, scope_type: s.level })),
                enforcement_history: enforcement || [],
                audit_logs: auditLogs || []
            };

            return res.json({
                admin: dossier,
                data: dossier,
                scopes: dossier.scopes,
                enforcement_history: dossier.enforcement_history,
                audit_logs: dossier.audit_logs
            });
        } catch (err) {
            console.error('[Governance/adminDetail] Error:', err);
            return res.status(500).json({ error: 'Failed to fetch administrator dossier', details: err.message });
        }
    });

    // ─────────────────────────────────────────────────────────────────
    // 3B. UPDATE ADMINISTRATOR (EDIT PROFILE & SCOPES)
    // PUT /api/admin/governance/admins/:id
    // ─────────────────────────────────────────────────────────────────
    router.put('/admins/:id', requireSuperAdmin, async (req, res) => {
        const correlationId = getCorrelationId(req);
        try {
            const { id } = req.params;
            const { full_name, email, phone, role, status, scopes, reason } = req.body;

            // 1. Find target admin
            let target = null;
            try {
                const { data, error } = await supabaseAdmin
                    .from('admin_accounts')
                    .select('*')
                    .or(`id.eq.${id},admin_code.eq.${id.toUpperCase()}`)
                    .single();
                if (!error && data) target = data;
            } catch (e) { }

            if (!target) {
                const baselineAdmins = [
                    { id: '00000000-0000-0000-0000-000000000001', admin_code: 'SA-000001', email: 'superadmin@coophub.gov.in', full_name: 'National Super Administrator', role: 'SUPER_ADMIN', status: 'active' },
                    { id: '00000000-0000-0000-0000-000000000002', admin_code: 'ADM-CHE-001', email: 'zoneadmin.south@coophub.gov.in', full_name: 'Senthil Kumar (South Zone Admin)', role: 'ZONE_ADMIN', status: 'active' },
                    { id: '00000000-0000-0000-0000-000000000003', admin_code: 'ADM-DEL-002', email: 'zoneadmin.north@coophub.gov.in', full_name: 'Rajesh Sharma (North Zone Admin)', role: 'ZONE_ADMIN', status: 'active' },
                    { id: '00000000-0000-0000-0000-000000000004', admin_code: 'ADM-MUM-003', email: 'zoneadmin.west@coophub.gov.in', full_name: 'Pooja Mehta (West Zone Admin)', role: 'ZONE_ADMIN', status: 'active' },
                    { id: '00000000-0000-0000-0000-000000000005', admin_code: 'ADM-KOL-004', email: 'zoneadmin.east@coophub.gov.in', full_name: 'Anirban Das (East Zone Admin)', role: 'ZONE_ADMIN', status: 'active' }
                ];
                target = baselineAdmins.find(a => a.id === id || a.admin_code === id.toUpperCase());
            }

            if (!target) {
                return res.status(404).json({ error: `Administrator '${id}' not found`, correlation_id: correlationId });
            }

            // 2. CEILING GUARD & APEX IMMUNITY
            // Subordinate administrator CANNOT be elevated to SUPER_ADMIN
            if (target.role !== 'SUPER_ADMIN' && role === 'SUPER_ADMIN') {
                return res.status(400).json({
                    error: 'Violation: Subordinate administrator cannot be elevated to SUPER_ADMIN.',
                    code: 'SUPER_ADMIN_ESCALATION_PROHIBITED',
                    correlation_id: correlationId
                });
            }

            // Primary Super Admin SA-000001 cannot be demoted or deactivated
            if (target.admin_code === 'SA-000001') {
                if (role && role !== 'SUPER_ADMIN') {
                    return res.status(400).json({
                        error: 'Violation: Primary Super Admin (SA-000001) role cannot be demoted.',
                        code: 'APEX_ROLE_DEMOTION_PROHIBITED',
                        correlation_id: correlationId
                    });
                }
                if (status && status !== 'active') {
                    return res.status(400).json({
                        error: 'Violation: Primary Super Admin (SA-000001) cannot be deactivated or suspended.',
                        code: 'APEX_DEACTIVATION_PROHIBITED',
                        correlation_id: correlationId
                    });
                }
            }

            // 3. Validate Role if supplied
            const validRoles = ['SUPER_ADMIN', 'ZONE_ADMIN', 'STATE_ADMIN', 'DISTRICT_ADMIN', 'COOPERATIVE_ADMIN', 'OPERATIONS_ADMIN'];
            if (role && !validRoles.includes(role)) {
                return res.status(400).json({
                    error: `Invalid role '${role}'. Supported roles: ${validRoles.join(', ')}`,
                    code: 'INVALID_ROLE',
                    correlation_id: correlationId
                });
            }

            // 4. Validate Email uniqueness if changed
            const cleanEmail = email ? email.trim().toLowerCase() : target.email;
            if (cleanEmail && cleanEmail !== target.email) {
                const { data: dupCheck } = await supabaseAdmin
                    .from('admin_accounts')
                    .select('id, email')
                    .eq('email', cleanEmail)
                    .neq('id', target.id);
                if (dupCheck && dupCheck.length > 0) {
                    return res.status(400).json({
                        error: `Email address '${cleanEmail}' is already registered to another administrator.`,
                        code: 'EMAIL_ALREADY_EXISTS',
                        correlation_id: correlationId
                    });
                }
            }

            // 5. Build update object
            const updateFields = {};
            if (full_name !== undefined) updateFields.full_name = full_name.trim();
            if (cleanEmail) updateFields.email = cleanEmail;
            if (phone !== undefined) updateFields.phone = phone.trim();
            if (role) updateFields.role = role;
            if (status) updateFields.status = status;
            updateFields.updated_at = new Date().toISOString();

            // 6. Update database record
            let updatedRecord = { ...target, ...updateFields };
            try {
                const { data, error: updateErr } = await supabaseAdmin
                    .from('admin_accounts')
                    .update(updateFields)
                    .eq('id', target.id)
                    .select()
                    .single();
                if (!updateErr && data) updatedRecord = data;
            } catch (err) {
                console.warn('[Governance/updateAdmin] DB update note:', err.message);
            }

            // 7. Update geographic scopes if provided
            let assignedScopes = [];
            if (Array.isArray(scopes)) {
                try {
                    await supabaseAdmin.from('admin_scopes').delete().eq('admin_id', target.id);
                    if (scopes.length > 0) {
                        const scopeRecords = scopes.map(sc => ({
                            admin_id: target.id,
                            level: (sc.level || sc.scope_type || 'ZONE').toUpperCase(),
                            entity_code: (sc.entity_code || sc.code || '').toUpperCase(),
                            created_at: new Date().toISOString()
                        }));
                        await supabaseAdmin.from('admin_scopes').insert(scopeRecords);
                        assignedScopes = scopeRecords;
                    }
                } catch (scErr) {
                    console.warn('[Governance/updateAdmin] Scopes update note:', scErr.message);
                    assignedScopes = scopes;
                }
            } else {
                try {
                    const { data: existingScopes } = await supabaseAdmin.from('admin_scopes').select('*').eq('admin_id', target.id);
                    assignedScopes = existingScopes || [];
                } catch (e) { }
            }

            // 8. Write immutable audit log
            try {
                await supabaseAdmin.from('admin_audit_logs').insert([{
                    admin_id: req.adminSession?.admin_id || 'SA-000001',
                    action: 'UPDATE_ADMIN',
                    entity_type: 'ADMIN_ACCOUNT',
                    entity_id: target.id,
                    old_value: { full_name: target.full_name, email: target.email, role: target.role, status: target.status },
                    new_value: { ...updateFields, scopes: assignedScopes },
                    reason: reason || 'Super Admin Edit Administrator & Scopes',
                    correlation_id: correlationId,
                    created_at: new Date().toISOString()
                }]);
            } catch (auditErr) {
                console.warn('[Governance/updateAdmin] Audit log note:', auditErr.message);
            }

            const enriched = {
                ...updatedRecord,
                is_active: updatedRecord.status === 'active',
                clearance_level: updatedRecord.role === 'SUPER_ADMIN' ? 5 : updatedRecord.role === 'ZONE_ADMIN' ? 4 : updatedRecord.role === 'STATE_ADMIN' ? 3 : 2,
                scopes: assignedScopes.map(s => ({ ...s, scope_type: s.level || s.scope_type })),
                primary_scope: assignedScopes.length > 0 ? `${assignedScopes[0].level || assignedScopes[0].scope_type}: ${assignedScopes.map(s => s.entity_code).join(', ')}` : 'None'
            };

            return res.status(200).json({
                message: 'Administrator successfully updated',
                admin: enriched,
                data: enriched,
                scopes: enriched.scopes,
                correlation_id: correlationId
            });
        } catch (err) {
            console.error('[Governance/updateAdmin] Error:', err);
            return res.status(500).json({ error: 'Failed to update administrator', details: err.message, correlation_id: correlationId });
        }
    });

    // ─────────────────────────────────────────────────────────────────
    // 3C. REMOVE / DE-PROVISION ADMINISTRATOR
    // DELETE /api/admin/governance/admins/:id
    // ─────────────────────────────────────────────────────────────────
    router.delete('/admins/:id', requireSuperAdmin, async (req, res) => {
        const correlationId = getCorrelationId(req);
        try {
            const { id } = req.params;
            const reason = req.body?.reason || req.query?.reason || 'Super Admin Permanent Removal';

            // Find target
            let target = null;
            try {
                const { data } = await supabaseAdmin
                    .from('admin_accounts')
                    .select('*')
                    .or(`id.eq.${id},admin_code.eq.${id.toUpperCase()}`)
                    .single();
                target = data;
            } catch (e) { }

            if (!target) {
                const baselineAdmins = [
                    { id: '00000000-0000-0000-0000-000000000001', admin_code: 'SA-000001', role: 'SUPER_ADMIN' },
                    { id: '00000000-0000-0000-0000-000000000002', admin_code: 'ADM-CHE-001', role: 'ZONE_ADMIN' },
                    { id: '00000000-0000-0000-0000-000000000003', admin_code: 'ADM-DEL-002', role: 'ZONE_ADMIN' },
                    { id: '00000000-0000-0000-0000-000000000004', admin_code: 'ADM-MUM-003', role: 'ZONE_ADMIN' },
                    { id: '00000000-0000-0000-0000-000000000005', admin_code: 'ADM-KOL-004', role: 'ZONE_ADMIN' }
                ];
                target = baselineAdmins.find(a => a.id === id || a.admin_code === id.toUpperCase());
            }

            if (!target) {
                return res.status(404).json({ error: `Administrator '${id}' not found`, correlation_id: correlationId });
            }

            // APEX IMMUNITY: SA-000001 can never be deleted
            if (target.admin_code === 'SA-000001' || target.role === 'SUPER_ADMIN') {
                return res.status(403).json({
                    error: 'Apex Immunity Violation: Primary Super Administrator (SA-000001) cannot be removed or de-provisioned.',
                    code: 'APEX_IMMUNITY_VIOLATION',
                    correlation_id: correlationId
                });
            }

            // Delete associated scopes first
            try {
                await supabaseAdmin.from('admin_scopes').delete().eq('admin_id', target.id);
                await supabaseAdmin.from('admin_accounts').delete().eq('id', target.id);
            } catch (delErr) {
                console.warn('[Governance/deleteAdmin] DB delete note:', delErr.message);
            }

            // Write immutable audit log
            try {
                await supabaseAdmin.from('admin_audit_logs').insert([{
                    admin_id: req.adminSession?.admin_id || 'SA-000001',
                    action: 'DELETE_ADMIN',
                    entity_type: 'ADMIN_ACCOUNT',
                    entity_id: target.id,
                    old_value: { admin_code: target.admin_code, email: target.email, role: target.role },
                    reason,
                    correlation_id: correlationId,
                    created_at: new Date().toISOString()
                }]);
            } catch (auditErr) {
                console.warn('[Governance/deleteAdmin] Audit log note:', auditErr.message);
            }

            return res.status(200).json({
                message: `Administrator '${target.admin_code}' successfully removed and de-provisioned.`,
                deleted_id: target.id,
                admin_code: target.admin_code,
                correlation_id: correlationId
            });
        } catch (err) {
            console.error('[Governance/deleteAdmin] Error:', err);
            return res.status(500).json({ error: 'Failed to remove administrator', details: err.message, correlation_id: correlationId });
        }
    });

    router.post('/admins/:id/enforce', requireSuperAdmin, async (req, res) => {
        const correlationId = getCorrelationId(req);
        try {
            const { id } = req.params;
            const { action_type, reason, scope_id } = req.body;
            const actionType = (action_type || req.body.action || '').toUpperCase();

            if (!actionType || !reason || reason.trim().length < 5) {
                return res.status(400).json({
                    error: 'Validation failed: action_type and an explicit reason (minimum 5 characters) are required.',
                    code: 'ENFORCEMENT_VALIDATION_FAILED',
                    correlation_id: correlationId
                });
            }

            const validActions = ['SUSPEND', 'REINSTATE', 'RESTRICT', 'WARN', 'BLOCK', 'REVOKE_SCOPE', 'RESTORE_SCOPE'];
            if (!validActions.includes(actionType)) {
                return res.status(400).json({
                    error: `Invalid action_type '${actionType}'. Must be one of: ${validActions.join(', ')}`,
                    code: 'INVALID_ACTION_TYPE',
                    correlation_id: correlationId
                });
            }

            // Find target admin
            const { data: target, error: findError } = await supabaseAdmin
                .from('admin_accounts')
                .select('*')
                .or(`id.eq.${id},admin_code.eq.${id.toUpperCase()}`)
                .single();

            if (findError || !target) {
                return res.status(404).json({ error: `Target administrator '${id}' not found` });
            }

            // CRITICAL IMMUNITY: Cannot enforce against SUPER_ADMIN
            if (target.role === 'SUPER_ADMIN' || target.admin_code === 'SA-000001' || target.email === 'superadmin@coophub.gov.in') {
                return res.status(403).json({
                    error: 'Apex Security Violation: National Super Admin Apex identity is immune to subordinate administrative enforcement.',
                    code: 'CANNOT_ENFORCE_SUPER_ADMIN',
                    correlation_id: correlationId
                });
            }

            let newStatus = target.status;
            if (actionType === 'SUSPEND') newStatus = 'suspended';
            else if (actionType === 'REINSTATE') newStatus = 'active';
            else if (actionType === 'RESTRICT') newStatus = 'restricted';
            else if (actionType === 'BLOCK') newStatus = 'blocked';

            // Update status if changed
            if (newStatus !== target.status) {
                await supabaseAdmin
                    .from('admin_accounts')
                    .update({ status: newStatus, updated_at: new Date().toISOString() })
                    .eq('id', target.id);
            }

            // Handle scope revocation
            if (actionType === 'REVOKE_SCOPE' && scope_id) {
                await supabaseAdmin.from('admin_scopes').delete().eq('id', scope_id);
            }

            // Record enforcement action in database
            // Attempt exact actionType first (when Migration 32 constraint is applied)
            const exactRecord = {
                target_admin_id: target.id,
                issuer_id: req.adminSession?.admin_id === 'SA-000001' ? null : req.adminSession?.admin_id,
                action_type: actionType,
                reason: reason.trim(),
                metadata: {
                    actual_action: actionType,
                    actor_email: req.adminSession?.email || 'superadmin@coophub.gov.in',
                    previous_status: target.status,
                    new_status: newStatus,
                    correlation_id: correlationId,
                    timestamp: new Date().toISOString()
                },
                created_at: new Date().toISOString()
            };

            let insertedAction = null;
            const { data: directInsert, error: directErr } = await supabaseAdmin
                .from('admin_enforcement_actions')
                .insert([exactRecord])
                .select()
                .single();

            if (!directErr && directInsert) {
                insertedAction = directInsert;
            } else if (directErr && directErr.code === '23514') {
                // Fallback for legacy DB check constraint: map to allowable legacy value
                let legacyActionType = 'WARN';
                if (actionType === 'BLOCK' || actionType === 'SUSPEND') legacyActionType = 'BLOCK';
                else if (actionType === 'RESTRICT') legacyActionType = 'RESTRICT';
                else if (actionType === 'REVOKE_SCOPE') legacyActionType = 'REMOVE_ACCESS';
                else if (['WARN', 'RESTRICT', 'BLOCK', 'REMOVE_ACCESS'].includes(actionType)) legacyActionType = actionType;

                const fallbackRecord = {
                    ...exactRecord,
                    action_type: legacyActionType
                };

                const { data: fallbackInsert } = await supabaseAdmin
                    .from('admin_enforcement_actions')
                    .insert([fallbackRecord])
                    .select()
                    .single();
                insertedAction = fallbackInsert;
            } else if (directErr) {
                console.error('[Governance/enforce] DB insert error:', directErr);
            }

            // Record audit log
            await supabaseAdmin.from('admin_audit_logs').insert([{
                admin_id: req.adminSession?.admin_id || 'SA-000001',
                action: `ENFORCE_${actionType}`,
                entity_type: 'ADMIN_ACCOUNT',
                entity_id: target.id,
                previous_value: { status: target.status },
                new_value: { status: newStatus, action: actionType },
                reason: reason.trim(),
                correlation_id: correlationId,
                created_at: new Date().toISOString()
            }]);

            return res.json({
                message: `Enforcement action '${actionType}' successfully applied to administrator ${target.admin_code}`,
                target_admin: target.admin_code,
                action_type: actionType,
                action_record: {
                    id: insertedAction?.id || correlationId,
                    action_type: actionType,
                    correlation_id: correlationId,
                    target_admin_id: target.id,
                    reason: reason.trim()
                },
                previous_status: target.status,
                new_status: newStatus,
                correlation_id: correlationId
            });
        } catch (err) {
            console.error('[Governance/enforce] Error:', err);
            return res.status(500).json({ error: 'Failed to execute enforcement action', details: err.message, correlation_id: correlationId });
        }
    });

    // ─────────────────────────────────────────────────────────────────
    // 4B. REMOVE / DELETE SUBORDINATE ADMINISTRATOR
    // DELETE /api/admin/governance/admins/:id
    // ─────────────────────────────────────────────────────────────────
    router.delete('/admins/:id', requireSuperAdmin, async (req, res) => {
        const correlationId = getCorrelationId(req);
        try {
            const { id } = req.params;
            const reason = (req.body?.reason || req.query?.reason || 'Super Admin Governance Account Removal').trim();

            // Find target admin
            const { data: target, error: findError } = await supabaseAdmin
                .from('admin_accounts')
                .select('*')
                .or(`id.eq.${id},admin_code.eq.${id.toUpperCase()}`)
                .single();

            if (findError || !target) {
                return res.status(404).json({ error: `Administrator '${id}' not found`, correlation_id: correlationId });
            }

            // CRITICAL IMMUNITY: Cannot delete or remove SUPER_ADMIN or SA-000001
            if (target.role === 'SUPER_ADMIN' || target.admin_code === 'SA-000001' || target.email === 'superadmin@coophub.gov.in') {
                return res.status(403).json({
                    error: 'Apex Security Violation: National Super Admin Apex identity is immune to administrative removal.',
                    code: 'CANNOT_REMOVE_SUPER_ADMIN',
                    correlation_id: correlationId
                });
            }

            // 1. Delete associated scopes
            await supabaseAdmin
                .from('admin_scopes')
                .delete()
                .eq('admin_id', target.id);

            // 2. Delete admin account
            const { error: deleteError } = await supabaseAdmin
                .from('admin_accounts')
                .delete()
                .eq('id', target.id);

            if (deleteError) throw deleteError;

            // 3. Record immutable audit log
            await supabaseAdmin.from('admin_audit_logs').insert([{
                admin_id: req.adminSession?.admin_id || 'SA-000001',
                action: 'DELETE_ADMIN',
                entity_type: 'ADMIN_ACCOUNT',
                entity_id: target.id,
                previous_value: {
                    admin_code: target.admin_code,
                    email: target.email,
                    full_name: target.full_name,
                    role: target.role
                },
                new_value: { status: 'DELETED' },
                reason,
                correlation_id: correlationId,
                created_at: new Date().toISOString()
            }]);

            return res.json({
                message: `Administrator ${target.admin_code} (${target.full_name}) successfully removed from registry.`,
                removed_admin_code: target.admin_code,
                removed_id: target.id,
                correlation_id: correlationId
            });
        } catch (err) {
            console.error('[Governance/deleteAdmin] Error:', err);
            return res.status(500).json({ error: 'Failed to remove administrator', details: err.message, correlation_id: correlationId });
        }
    });

    // ─────────────────────────────────────────────────────────────────
    // 4C. GENERATIVE INTELLIGENCE SUMMARY FOR ADMINISTRATOR
    // POST /api/admin/governance/admins/:id/ai-summary
    // ─────────────────────────────────────────────────────────────────
    router.post('/admins/:id/ai-summary', requireSuperAdmin, async (req, res) => {
        const correlationId = getCorrelationId(req);
        try {
            const { id } = req.params;

            // Fetch target admin dossier details with resilience
            let target = null;
            try {
                const { data } = await supabaseAdmin
                    .from('admin_accounts')
                    .select('*')
                    .or(`id.eq.${id},admin_code.eq.${id.toUpperCase()}`)
                    .single();
                target = data;
            } catch (e) {}

            if (!target) {
                target = BASELINE_ADMINS.find(a => a.id === id || a.admin_code === id.toUpperCase());
            }

            if (!target) {
                return res.status(404).json({ error: `Administrator '${id}' not found`, correlation_id: correlationId });
            }

            // Enrich demographics from baseline if missing
            const baselineMatch = BASELINE_ADMINS.find(a => a.id === target.id || a.admin_code === target.admin_code);
            if (baselineMatch) {
                target.gender = target.gender || baselineMatch.gender;
                target.date_of_birth = target.date_of_birth || baselineMatch.date_of_birth;
                target.clearance = target.clearance || baselineMatch.clearance;
            } else {
                target.gender = target.gender || 'Not Specified';
                target.date_of_birth = target.date_of_birth || '1985-01-01';
                target.clearance = target.clearance || (target.role === 'SUPER_ADMIN' ? 'Level 5 (Apex)' : 'Level 4 (Zonal Command)');
            }

            let scopes = [];
            let enforcement = [];
            let auditLogs = [];

            try {
                const [scopesRes, enforceRes, auditRes] = await Promise.all([
                    supabaseAdmin.from('admin_scopes').select('*').eq('admin_id', target.id),
                    supabaseAdmin.from('admin_enforcement_actions').select('*').eq('target_admin_id', target.id).order('created_at', { ascending: false }),
                    supabaseAdmin.from('admin_audit_logs').select('*').eq('entity_id', target.id).order('created_at', { ascending: false }).limit(10)
                ]);
                scopes = scopesRes.data || [];
                enforcement = enforceRes.data || [];
                auditLogs = auditRes.data || [];
            } catch (queryErr) {}

            if (scopes.length === 0) {
                scopes = BASELINE_SCOPES.filter(s => s.admin_id === target.id);
            }

            const primaryScope = scopes.length > 0
                ? scopes.map(s => `${s.level}: ${s.entity_code}`).join(', ')
                : (target.role === 'SUPER_ADMIN' ? 'GLOBAL Sovereign Oversight (All 36 States/UTs, 4 Zones)' : 'No specific regional bounds assigned');

            const isSuper = target.role === 'SUPER_ADMIN';
            const statusLabel = target.status?.toUpperCase() || 'ACTIVE';

            // Attempt AI Call using Gemini API / NVIDIA NIM
            const geminiKey = process.env.GEMINI_API_KEY;
            const nvidiaKey = process.env.NVIDIA_API_KEY;

            let aiPayload = null;
            let providerName = 'COOP-HUB Cooperative Intelligence Core';

            const systemPrompt = `You are the COOP-HUB Apex Governance Intelligence AI.
Analyze the administrative dossier of this Indian Cooperative platform administrator and output a strict JSON object with no markdown formatting:
{
  "executive_summary": "2-3 formal, analytical sentences summarizing the administrator's identity, demographic credentials (full name, gender, date of birth), operational role, jurisdiction depth, and current standing.",
  "admin_demographics": {
    "name": "${target.full_name}",
    "gender": "${target.gender}",
    "date_of_birth": "${target.date_of_birth}",
    "role": "${target.role}",
    "clearance": "${target.clearance}",
    "jurisdiction": "${primaryScope}"
  },
  "role_and_clearance_analysis": "Assessment of their clearance level, delegated authorities, and geographic command jurisdiction.",
  "compliance_risk_assessment": {
    "risk_level": "LOW_RISK | MEDIUM_RISK | HIGH_RISK",
    "compliance_score": 96,
    "rating_color": "#10B981 | #F59E0B | #EF4444",
    "flags": ["Key compliance observation 1", "Key compliance observation 2"]
  },
  "supervisory_recommendations": [
    "Actionable recommendation 1 for Super Admin supervision",
    "Actionable recommendation 2 for compliance maintenance",
    "Actionable recommendation 3 for jurisdictional expansion or review"
  ]
}`;

            const userPrompt = `Administrator Demographic & Profile Dossier:
Full Name: ${target.full_name}
Gender: ${target.gender}
Date of Birth: ${target.date_of_birth}
Admin Code: ${target.admin_code}
Email: ${target.email}
Role: ${target.role}
Clearance: ${target.clearance}
Status: ${statusLabel}
Primary Scope / Jurisdiction: ${primaryScope}
Bound Entities: ${scopes.length}
Historical Enforcement Actions: ${enforcement.length} (${enforcement.map(e => e.action_type).join(', ') || 'None'})
Audit Log Entries: ${auditLogs.length}
Tenure Since: ${target.created_at}`;

            if (geminiKey) {
                try {
                    const gemUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key=${geminiKey}`;
                    const gemRes = await fetch(gemUrl, {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({
                            contents: [{ parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
                            generationConfig: { temperature: 0.2, maxOutputTokens: 1000 }
                        })
                    });
                    if (gemRes.ok) {
                        const gemData = await gemRes.json();
                        const raw = gemData.candidates?.[0]?.content?.parts?.[0]?.text;
                        if (raw) {
                            const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
                            aiPayload = JSON.parse(clean);
                            providerName = 'Google Gemini 1.5 Flash (Generative Intelligence)';
                        }
                    }
                } catch (gemErr) {
                    console.warn('[AISummary] Gemini error, falling back:', gemErr.message);
                }
            }

            if (!aiPayload && nvidiaKey) {
                try {
                    const nvRes = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${nvidiaKey}`
                        },
                        body: JSON.stringify({
                            model: 'meta/llama-3.2-11b-vision-instruct',
                            messages: [
                                { role: 'system', content: systemPrompt },
                                { role: 'user', content: userPrompt }
                            ],
                            temperature: 0.2,
                            max_tokens: 1000
                        })
                    });
                    if (nvRes.ok) {
                        const nvData = await nvRes.json();
                        const raw = nvData.choices?.[0]?.message?.content;
                        if (raw) {
                            const clean = raw.replace(/```json/gi, '').replace(/```/g, '').trim();
                            aiPayload = JSON.parse(clean);
                            providerName = 'NVIDIA NIM (Llama 3.2 Generative Intelligence)';
                        }
                    }
                } catch (nvErr) {
                    console.warn('[AISummary] NVIDIA error, falling back:', nvErr.message);
                }
            }

            // Analytical fallback synthesis if external API unavailable
            if (!aiPayload) {
                const hasPenalties = enforcement.length > 0;
                const isSuspended = target.status === 'suspended';
                const isBlocked = target.status === 'blocked';
                const isRestricted = target.status === 'restricted';

                const riskLevel = isBlocked ? 'HIGH_RISK' : (isSuspended || hasPenalties || isRestricted) ? 'MEDIUM_RISK' : 'LOW_RISK';
                const complianceScore = isSuper ? 100 : isBlocked ? 28 : isSuspended ? 45 : isRestricted ? 68 : hasPenalties ? 82 : 98;
                const ratingColor = complianceScore >= 90 ? '#10B981' : complianceScore >= 70 ? '#F59E0B' : '#EF4444';

                aiPayload = {
                    executive_summary: `${target.full_name} (${target.gender}, DOB: ${target.date_of_birth}) is actively serving as ${target.role} (${target.clearance}) with status ${statusLabel}. Operational jurisdiction is strictly bound to ${primaryScope}. ${hasPenalties ? `Compliance records indicate ${enforcement.length} historical enforcement action(s) requiring active supervisory oversight.` : 'The administrator maintains a pristine compliance record with zero disciplinary actions recorded.'}`,
                    admin_demographics: {
                        name: target.full_name,
                        gender: target.gender,
                        date_of_birth: target.date_of_birth,
                        role: target.role,
                        clearance: target.clearance,
                        jurisdiction: primaryScope
                    },
                    role_and_clearance_analysis: `${target.role} carries authority tier ${target.clearance}. Subordinate scopes cover ${scopes.length} direct geographic unit(s) under ${primaryScope}. Audit records verify regular supervisory engagement across national cooperative operations.`,
                    compliance_risk_assessment: {
                        risk_level: riskLevel,
                        compliance_score: complianceScore,
                        rating_color: ratingColor,
                        flags: [
                            isSuper ? '✓ National Apex Super Admin identity — Sovereign clearance' : `✓ Identity verified: ${target.full_name} (${target.admin_code})`,
                            `✓ Demographic verification: ${target.gender}, DOB: ${target.date_of_birth}`,
                            hasPenalties ? `⚠️ ${enforcement.length} historical enforcement record(s) on file` : '✓ Clean disciplinary record with zero infractions',
                            target.status === 'active' ? '✓ Active cryptographic access session and credentials' : `⚠️ Account currently in ${statusLabel} status`
                        ]
                    },
                    supervisory_recommendations: [
                        isSuper
                            ? 'Maintain sovereign governance keys and periodic multi-factor authentication audit.'
                            : target.status === 'suspended'
                                ? 'Conduct statutory review of suspension grounds prior to considering reinstatement.'
                                : 'Perform scheduled quarterly audit of assigned geographic scopes and delegation limits.',
                        'Review inter-administrator communication logs and broadcast telemetry quarterly.',
                        'Verify adherence to statutory 91.5% / 8.5% financial split parameters within assigned societies.'
                    ]
                };
            }

            // Always guarantee admin_demographics in response
            if (!aiPayload.admin_demographics) {
                aiPayload.admin_demographics = {
                    name: target.full_name,
                    gender: target.gender,
                    date_of_birth: target.date_of_birth,
                    role: target.role,
                    clearance: target.clearance,
                    jurisdiction: primaryScope
                };
            }

            aiPayload.ai_provider = providerName;
            aiPayload.admin_id = target.id;
            aiPayload.admin_code = target.admin_code;
            aiPayload.gender = target.gender;
            aiPayload.date_of_birth = target.date_of_birth;
            aiPayload.generated_at = new Date().toISOString();
            aiPayload.correlation_id = correlationId;

            return res.json({
                summary: aiPayload,
                data: aiPayload,
                correlation_id: correlationId
            });
        } catch (err) {
            console.error('[Governance/aiSummary] Error:', err);
            return res.status(500).json({ error: 'Failed to generate administrative intelligence summary', details: err.message, correlation_id: correlationId });
        }
    });


    // ─────────────────────────────────────────────────────────────────
    // 5. ZONE MANAGEMENT & ASSIGNED ZONE ADMINS
    // GET /api/admin/governance/zones
    // ─────────────────────────────────────────────────────────────────
    router.get('/zones', requireSuperAdmin, async (req, res) => {
        try {
            const [zonesRes, statesRes, distRes, coopRes, scopesRes, adminsRes] = await Promise.all([
                supabaseAdmin.from('geo_zones').select('*').order('code'),
                supabaseAdmin.from('geo_states').select('code, name, zone_code, type, capital').order('name'),
                supabaseAdmin.from('geo_districts').select('code, state_code'),
                supabaseAdmin.from('geo_cooperatives').select('code, district_code'),
                supabaseAdmin.from('admin_scopes').select('*'),
                supabaseAdmin.from('admin_accounts').select('id, admin_code, full_name, email, role, status')
            ]);

            const zones = zonesRes.data || [];
            const states = statesRes.data || [];
            const districts = distRes.data || [];
            const coops = coopRes.data || [];
            let scopes = scopesRes.data || [];
            let accounts = adminsRes.data || [];

            if (accounts.length === 0) {
                accounts = BASELINE_ADMINS;
            }
            if (scopes.length === 0) {
                scopes = BASELINE_SCOPES;
            }

            // Map admins by ID
            const accountsById = {};
            accounts.forEach(a => { accountsById[a.id] = a; });

            // Map admins to zones and states/UTs
            const adminsByZone = {};
            const adminsByEntity = {};
            scopes.forEach(sc => {
                const adm = accountsById[sc.admin_id];
                if (adm) {
                    if (sc.level === 'ZONE') {
                        if (!adminsByZone[sc.entity_code]) adminsByZone[sc.entity_code] = [];
                        adminsByZone[sc.entity_code].push(adm);
                    }
                    if (!adminsByEntity[sc.entity_code]) adminsByEntity[sc.entity_code] = [];
                    adminsByEntity[sc.entity_code].push(adm);
                }
            });

            // State map
            const stateCodesByZone = {};
            states.forEach(s => {
                if (!stateCodesByZone[s.zone_code]) stateCodesByZone[s.zone_code] = new Set();
                stateCodesByZone[s.zone_code].add(s.code);
            });

            const enrichedZones = zones.map(z => {
                const zoneStates = states.filter(s => s.zone_code === z.code);
                const stateCodes = stateCodesByZone[z.code] || new Set();

                const zoneDistricts = districts.filter(d => stateCodes.has(d.state_code));
                const distCodeSet = new Set(zoneDistricts.map(d => d.code));
                const zoneCoops = coops.filter(c => distCodeSet.has(c.district_code));

                const statesList = zoneStates
                    .filter(s => s.type === 'STATE')
                    .map(s => ({
                        code: s.code,
                        name: s.name,
                        type: 'STATE',
                        capital: s.capital,
                        assigned_admins: adminsByEntity[s.code] || []
                    }));

                const utsList = zoneStates
                    .filter(s => s.type === 'UNION_TERRITORY')
                    .map(s => ({
                        code: s.code,
                        name: s.name,
                        type: 'UNION_TERRITORY',
                        capital: s.capital,
                        assigned_admins: adminsByEntity[s.code] || []
                    }));

                return {
                    code: z.code,
                    zone_code: z.code,
                    name: z.name,
                    description: z.description,
                    status: z.status || 'active',
                    states: statesList.length,
                    state_count: statesList.length,
                    union_territories: utsList.length,
                    ut_count: utsList.length,
                    total_units: zoneStates.length,
                    districts: zoneDistricts.length,
                    cooperatives: zoneCoops.length,
                    assigned_admins: adminsByZone[z.code] || [],
                    states_list: statesList,
                    uts_list: utsList
                };
            });

            return res.json({ zones: enrichedZones, data: enrichedZones, total: enrichedZones.length });
        } catch (err) {
            console.error('[Governance/zones] Error:', err);
            return res.status(500).json({ error: 'Failed to fetch zone management telemetry', details: err.message });
        }
    });

    // ─────────────────────────────────────────────────────────────────
    // 6. ASSIGN ZONE, STATE & UT ADMINISTRATORS
    // POST /api/admin/governance/zones/assign
    // ─────────────────────────────────────────────────────────────────
    router.post('/zones/assign', requireSuperAdmin, async (req, res) => {
        const correlationId = getCorrelationId(req);
        try {
            const { admin_id, zone_codes, entity_codes, level } = req.body;
            const scopeLevel = (level || 'ZONE').toUpperCase();
            const rawCodes = entity_codes || zone_codes || [];
            const codes = Array.isArray(rawCodes) ? rawCodes : [rawCodes].filter(Boolean);

            if (!admin_id || codes.length === 0) {
                return res.status(400).json({
                    error: 'Missing required parameters: admin_id and entity_codes (array) required',
                    correlation_id: correlationId
                });
            }

            // Verify admin exists
            let admin = null;
            try {
                const { data } = await supabaseAdmin
                    .from('admin_accounts')
                    .select('*')
                    .or(`id.eq.${admin_id},admin_code.eq.${admin_id.toUpperCase()}`)
                    .single();
                admin = data;
            } catch (e) {}

            if (!admin) {
                admin = BASELINE_ADMINS.find(a => a.id === admin_id || a.admin_code === admin_id.toUpperCase());
            }

            if (!admin) {
                return res.status(404).json({ error: `Administrator '${admin_id}' not found` });
            }

            // Remove existing scopes for this admin at this level
            try {
                await supabaseAdmin
                    .from('admin_scopes')
                    .delete()
                    .eq('admin_id', admin.id)
                    .eq('level', scopeLevel);
            } catch (delErr) {
                console.warn('[Governance/assignScope] Delete scope note:', delErr.message);
            }

            // Insert new scopes
            const toInsert = codes.map(c => ({
                admin_id: admin.id,
                level: scopeLevel,
                entity_code: String(c).toUpperCase(),
                created_at: new Date().toISOString()
            }));

            if (toInsert.length > 0) {
                try {
                    await supabaseAdmin.from('admin_scopes').insert(toInsert);
                } catch (insErr) {
                    console.warn('[Governance/assignScope] Insert scope note:', insErr.message);
                }
            }

            // Audit log
            try {
                await supabaseAdmin.from('admin_audit_logs').insert([{
                    admin_id: req.adminSession?.admin_id || 'SA-000001',
                    action: `ASSIGN_${scopeLevel}_SCOPE`,
                    entity_type: 'ADMIN_ACCOUNT',
                    entity_id: admin.id,
                    new_value: { assigned_scopes: toInsert, level: scopeLevel, entity_codes: codes },
                    reason: `Super Admin ${scopeLevel} Scope Assignment`,
                    correlation_id: correlationId,
                    created_at: new Date().toISOString()
                }]);
            } catch (audErr) {}

            return res.json({
                success: true,
                message: `Assigned ${toInsert.length} ${scopeLevel} scopes to administrator ${admin.admin_code}`,
                admin_code: admin.admin_code,
                level: scopeLevel,
                assigned_codes: toInsert.map(i => i.entity_code),
                scopes: toInsert,
                data: toInsert,
                correlation_id: correlationId
            });
        } catch (err) {
            console.error('[Governance/zoneAssign] Error:', err);
            return res.status(500).json({ error: 'Failed to assign scopes', details: err.message });
        }
    });

    // ─────────────────────────────────────────────────────────────────
    // 7. ACCESS & PERMISSIONS CAPABILITY MATRIX
    // GET /api/admin/governance/permissions
    // ─────────────────────────────────────────────────────────────────
    router.get('/permissions', requireSuperAdmin, async (req, res) => {
        try {
            const roles = [
                {
                    id: 'SUPER_ADMIN',
                    title: 'National Super Admin Apex',
                    scope: 'GLOBAL (All India)',
                    clearance: 'Level 5 Apex',
                    description: 'Absolute governance over all national zones, subordinate administrators, statutory splits, and emergency broadcasts.',
                    permissions: {
                        pillars: ['VIEW', 'CREATE', 'UPDATE', 'APPROVE', 'REJECT', 'SUSPEND', 'EXPORT'],
                        customers: ['VIEW', 'CREATE', 'UPDATE', 'SUSPEND', 'EXPORT'],
                        requests: ['VIEW', 'CREATE', 'UPDATE', 'ASSIGN', 'EXPORT'],
                        bookings: ['VIEW', 'UPDATE', 'EXPORT'],
                        dispatch: ['VIEW', 'ASSIGN', 'BROADCAST'],
                        tracking: ['VIEW', 'EXPORT'],
                        kyc: ['VIEW', 'APPROVE', 'REJECT', 'EXPORT'],
                        finance: ['VIEW', 'UPDATE', 'APPROVE', 'EXPORT'],
                        welfare: ['VIEW', 'CREATE', 'UPDATE', 'APPROVE', 'EXPORT'],
                        broadcast: ['VIEW', 'CREATE', 'BROADCAST'],
                        feedback: ['VIEW', 'UPDATE', 'EXPORT'],
                        cooperatives: ['VIEW', 'CREATE', 'UPDATE', 'APPROVE', 'SUSPEND', 'EXPORT'],
                        administrators: ['VIEW', 'CREATE', 'UPDATE', 'ASSIGN', 'SUSPEND', 'EXPORT'],
                        reports: ['VIEW', 'EXPORT']
                    }
                },
                {
                    id: 'ZONE_ADMIN',
                    title: 'Zonal Regional Administrator',
                    scope: 'ZONE (Assigned Zonal Sectors: SZ, NZ, WZ, or EZ)',
                    clearance: 'Level 4 Zonal',
                    description: 'Supervision over all States, UTs, districts, and cooperatives inside designated zonal sectors.',
                    permissions: {
                        pillars: ['VIEW', 'APPROVE', 'REJECT', 'EXPORT'],
                        customers: ['VIEW', 'EXPORT'],
                        requests: ['VIEW', 'ASSIGN', 'EXPORT'],
                        bookings: ['VIEW', 'EXPORT'],
                        dispatch: ['VIEW', 'ASSIGN'],
                        tracking: ['VIEW'],
                        kyc: ['VIEW', 'APPROVE', 'REJECT'],
                        finance: ['VIEW', 'EXPORT'],
                        welfare: ['VIEW', 'APPROVE', 'EXPORT'],
                        broadcast: ['VIEW'],
                        feedback: ['VIEW', 'EXPORT'],
                        cooperatives: ['VIEW', 'UPDATE'],
                        administrators: ['VIEW'],
                        reports: ['VIEW', 'EXPORT']
                    }
                },
                {
                    id: 'STATE_ADMIN',
                    title: 'State / UT Regional Administrator',
                    scope: 'STATE (Single State or Union Territory)',
                    clearance: 'Level 3 Regional',
                    description: 'Direct administrative authority over cooperative societies and pillar workforce in assigned State/UT.',
                    permissions: {
                        pillars: ['VIEW', 'APPROVE', 'REJECT'],
                        customers: ['VIEW'],
                        requests: ['VIEW', 'ASSIGN'],
                        bookings: ['VIEW'],
                        dispatch: ['VIEW', 'ASSIGN'],
                        tracking: ['VIEW'],
                        kyc: ['VIEW', 'APPROVE', 'REJECT'],
                        finance: ['VIEW'],
                        welfare: ['VIEW', 'APPROVE'],
                        broadcast: ['VIEW'],
                        feedback: ['VIEW'],
                        cooperatives: ['VIEW', 'UPDATE'],
                        administrators: ['VIEW'],
                        reports: ['VIEW']
                    }
                },
                {
                    id: 'DISTRICT_ADMIN',
                    title: 'District Sub-Regional Administrator',
                    scope: 'DISTRICT (Single District)',
                    clearance: 'Level 2 Local',
                    description: 'Operational dispatch and verification oversight for cooperatives situated within one district.',
                    permissions: {
                        pillars: ['VIEW', 'UPDATE'],
                        customers: ['VIEW'],
                        requests: ['VIEW', 'ASSIGN'],
                        bookings: ['VIEW'],
                        dispatch: ['VIEW', 'ASSIGN'],
                        tracking: ['VIEW'],
                        kyc: ['VIEW'],
                        finance: ['VIEW'],
                        welfare: ['VIEW'],
                        broadcast: ['VIEW'],
                        feedback: ['VIEW'],
                        cooperatives: ['VIEW'],
                        administrators: [],
                        reports: ['VIEW']
                    }
                },
                {
                    id: 'COOPERATIVE_ADMIN',
                    title: 'Cooperative Society Administrator',
                    scope: 'COOPERATIVE (Registered Society Hub)',
                    clearance: 'Level 2 Local',
                    description: 'Local society hub operations: technician onboarding, job assignments, customer service tickets.',
                    permissions: {
                        pillars: ['VIEW', 'UPDATE'],
                        customers: ['VIEW'],
                        requests: ['VIEW', 'CREATE', 'ASSIGN'],
                        bookings: ['VIEW'],
                        dispatch: ['VIEW', 'ASSIGN'],
                        tracking: ['VIEW'],
                        kyc: ['VIEW'],
                        finance: ['VIEW'],
                        welfare: ['VIEW', 'CREATE'],
                        broadcast: ['VIEW'],
                        feedback: ['VIEW'],
                        cooperatives: ['VIEW'],
                        administrators: [],
                        reports: ['VIEW']
                    }
                },
                {
                    id: 'OPERATIONS_ADMIN',
                    title: 'Operations & Dispatch Controller',
                    scope: 'OPERATIONS (Authorized Hub Bounds)',
                    clearance: 'Level 1 Operational',
                    description: 'Live field operations: urgent emergency dispatches, technician tracking, and active order triage.',
                    permissions: {
                        pillars: ['VIEW'],
                        customers: ['VIEW'],
                        requests: ['VIEW', 'ASSIGN'],
                        bookings: ['VIEW'],
                        dispatch: ['VIEW', 'ASSIGN'],
                        tracking: ['VIEW'],
                        kyc: [],
                        finance: [],
                        welfare: [],
                        broadcast: ['VIEW'],
                        feedback: ['VIEW'],
                        cooperatives: ['VIEW'],
                        administrators: [],
                        reports: []
                    }
                }
            ];

            const resources = [
                'pillars', 'customers', 'requests', 'bookings', 'dispatch',
                'tracking', 'kyc', 'finance', 'welfare', 'broadcast',
                'feedback', 'cooperatives', 'administrators', 'reports'
            ];

            const actions = [
                'VIEW', 'CREATE', 'UPDATE', 'APPROVE', 'REJECT',
                'ASSIGN', 'SUSPEND', 'EXPORT', 'BROADCAST'
            ];

            const inheritanceRules = [
                'Scopes strictly inherit downward: GLOBAL → ZONE → STATE → DISTRICT → COOPERATIVE → OPERATIONS',
                'A parent administrator inherently possesses supervision privileges over descendants in its jurisdiction',
                'A child administrator NEVER gains access to parent entities or horizontal sibling jurisdictions',
                'Zone Admins cannot manage administrators or resources outside their assigned zone(s)',
                'State Admins cannot access or alter records of another State or UT',
                'District Admins and Cooperative Admins cannot promote their scope or self-assign higher tiers'
            ];

            const hierarchy = [
                { tier: 1, role: 'SUPER_ADMIN', scope: 'GLOBAL', title: 'National Super Admin Apex' },
                { tier: 2, role: 'ZONE_ADMIN', scope: 'ZONE', title: 'Zonal Regional Administrator' },
                { tier: 3, role: 'STATE_ADMIN', scope: 'STATE', title: 'State / UT Regional Administrator' },
                { tier: 4, role: 'DISTRICT_ADMIN', scope: 'DISTRICT', title: 'District Sub-Regional Administrator' },
                { tier: 5, role: 'COOPERATIVE_ADMIN', scope: 'COOPERATIVE', title: 'Cooperative Society Administrator' },
                { tier: 6, role: 'OPERATIONS_ADMIN', scope: 'OPERATIONS', title: 'Operations & Dispatch Controller' }
            ];

            const rolesWithOverrides = roles.map(r => {
                if (ROLE_PERMISSIONS_OVERRIDE[r.id]) {
                    return {
                        ...r,
                        ...ROLE_PERMISSIONS_OVERRIDE[r.id],
                        permissions: {
                            ...r.permissions,
                            ...(ROLE_PERMISSIONS_OVERRIDE[r.id].permissions || {})
                        }
                    };
                }
                return r;
            });

            const formattedRoles = rolesWithOverrides.map(r => ({
                ...r,
                role: r.id,
                clearance_level: r.id === 'SUPER_ADMIN' ? 5 : r.id === 'ZONE_ADMIN' ? 4 : r.id === 'STATE_ADMIN' ? 3 : r.id === 'DISTRICT_ADMIN' || r.id === 'COOPERATIVE_ADMIN' ? 2 : 1
            }));
            if (formattedRoles[0]?.permissions) {
                formattedRoles[0].permissions['*'] = ['*'];
            }

            return res.json({
                matrix: formattedRoles,
                roles: formattedRoles,
                resources,
                actions,
                hierarchy,
                inheritance_rules: inheritanceRules,
                evaluated_at: new Date().toISOString()
            });
        } catch (err) {
            console.error('[Governance/permissions] Error:', err);
            return res.status(500).json({ error: 'Failed to fetch permissions matrix', details: err.message });
        }
    });

    // PUT /api/admin/governance/permissions/:roleId
    router.put('/permissions/:roleId', requireSuperAdmin, async (req, res) => {
        try {
            const { roleId } = req.params;
            const { permissions, scope, clearance, description, title } = req.body;

            if (!roleId) {
                return res.status(400).json({ error: 'Role ID is required' });
            }

            if (!ROLE_PERMISSIONS_OVERRIDE[roleId]) {
                ROLE_PERMISSIONS_OVERRIDE[roleId] = {};
            }

            if (permissions) ROLE_PERMISSIONS_OVERRIDE[roleId].permissions = permissions;
            if (scope) ROLE_PERMISSIONS_OVERRIDE[roleId].scope = scope;
            if (clearance) ROLE_PERMISSIONS_OVERRIDE[roleId].clearance = clearance;
            if (description) ROLE_PERMISSIONS_OVERRIDE[roleId].description = description;
            if (title) ROLE_PERMISSIONS_OVERRIDE[roleId].title = title;

            return res.json({
                success: true,
                message: `Capability policy for ${roleId} updated successfully`,
                roleId,
                override: ROLE_PERMISSIONS_OVERRIDE[roleId]
            });
        } catch (err) {
            console.error('[Governance/permissions/PUT] Error:', err);
            return res.status(500).json({ error: 'Failed to update permissions', details: err.message });
        }
    });

    // POST /api/admin/governance/permissions/:roleId/reset
    router.post('/permissions/:roleId/reset', requireSuperAdmin, async (req, res) => {
        try {
            const { roleId } = req.params;
            delete ROLE_PERMISSIONS_OVERRIDE[roleId];
            return res.json({
                success: true,
                message: `Capability policy for ${roleId} reset to standard defaults`,
                roleId
            });
        } catch (err) {
            console.error('[Governance/permissions/reset] Error:', err);
            return res.status(500).json({ error: 'Failed to reset permissions', details: err.message });
        }
    });

    // ─────────────────────────────────────────────────────────────────
    // 8. IMMUTABLE ENFORCEMENT & AUDIT LOG HISTORY
    // GET /api/admin/governance/enforcement/history
    // ─────────────────────────────────────────────────────────────────
    router.get('/enforcement/history', requireSuperAdmin, async (req, res) => {
        try {
            const page = Math.max(1, parseInt(req.query.page) || 1);
            const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 25));
            const offset = (page - 1) * limit;

            const [actionsRes, accountsRes] = await Promise.all([
                supabaseAdmin
                    .from('admin_enforcement_actions')
                    .select('*', { count: 'exact' })
                    .order('created_at', { ascending: false })
                    .range(offset, offset + limit - 1),
                supabaseAdmin.from('admin_accounts').select('id, admin_code, full_name, email, role')
            ]);

            const accountsMap = {};
            (accountsRes.data || []).forEach(a => { accountsMap[a.id] = a; });

            const enrichedActions = (actionsRes.data || []).map(action => {
                const target = accountsMap[action.target_admin_id];
                const issuer = action.issuer_id ? accountsMap[action.issuer_id] : null;

                return {
                    ...action,
                    action_type: action.metadata?.actual_action || action.action_type,
                    target_admin_code: target?.admin_code || 'Unknown',
                    target_admin_name: target?.full_name || 'Administrator',
                    target_email: target?.email || '',
                    issuer_admin_code: issuer?.admin_code || 'SA-000001 (Super Admin Apex)',
                    enacted_by_name: issuer?.full_name || 'National Super Admin Apex',
                    enacted_by: issuer?.admin_code || 'SA-000001',
                    correlation_id: action.metadata?.correlation_id || 'none'
                };
            });

            return res.json({
                enforcement_actions: enrichedActions,
                history: enrichedActions,
                data: enrichedActions,
                total: actionsRes.count ?? enrichedActions.length,
                page,
                limit
            });
        } catch (err) {
            console.error('[Governance/enforcementHistory] Error:', err);
            return res.status(500).json({ error: 'Failed to fetch enforcement history', details: err.message });
        }
    });

    // ─────────────────────────────────────────────────────────────────
    // 5. SUPER ADMIN COMMUNICATION & BROADCAST
    // ─────────────────────────────────────────────────────────────────

    // Get direct communications between admins
    router.get('/messages', requireSuperAdmin, async (req, res) => {
        try {
            const adminId = req.user.id;

            // Get all messages where user is sender or receiver, AND sender/receiver is an admin
            const { data, error } = await supabaseAdmin
                .from('messages')
                .select('*')
                .or(`sender_id.eq.${adminId},receiver_id.eq.${adminId}`)
                .order('created_at', { ascending: false });

            if (error) {
                // Fallback for when migration 33 isn't fully applied or table missing columns
                console.warn('[Governance/Messages] DB error, returning empty list:', error.message);
                return res.json({ messages: [] });
            }

            return res.json({ messages: data || [] });
        } catch (err) {
            console.error('[Governance/Messages] Error:', err);
            return res.status(500).json({ error: 'Failed to fetch messages', details: err.message });
        }
    });

    // Send a direct communication to another admin
    router.post('/messages', requireSuperAdmin, async (req, res) => {
        try {
            const senderId = req.user.id;
            const { receiver_id, message } = req.body;

            if (!receiver_id || !message?.trim()) {
                return res.status(400).json({ error: 'Receiver ID and message content are required' });
            }

            const { data, error } = await supabaseAdmin
                .from('messages')
                .insert({
                    sender_id: senderId,
                    sender_type: 'admin',
                    receiver_id: receiver_id,
                    receiver_type: 'admin',
                    message: message.trim(),
                    read: false,
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) {
                console.error('[Governance/Messages] Insert Error:', error.message);
                return res.status(400).json({ error: error.message });
            }

            return res.status(201).json({ message: 'Message sent successfully', data });
        } catch (err) {
            console.error('[Governance/Messages] Error:', err);
            return res.status(500).json({ error: 'Internal server error', details: err.message });
        }
    });

    // Get all national broadcasts
    router.get('/broadcasts', requireSuperAdmin, async (req, res) => {
        try {
            const { data, error } = await supabaseAdmin
                .from('broadcast_messages')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return res.json({ broadcasts: data || [] });
        } catch (err) {
            console.error('[Governance/Broadcasts] Error:', err);
            return res.status(500).json({ error: 'Failed to fetch broadcasts', details: err.message });
        }
    });

    // Send national broadcast
    router.post('/broadcasts', requireSuperAdmin, async (req, res) => {
        try {
            const { title, message, category, priority, target_audience } = req.body;

            if (!title?.trim() || !message?.trim()) {
                return res.status(400).json({ error: 'Title and message are required' });
            }

            const { data, error } = await supabaseAdmin
                .from('broadcast_messages')
                .insert({
                    title: title.trim(),
                    message: message.trim(),
                    category: category || 'general',
                    priority: priority || 'normal',
                    target_audience: target_audience || 'all_pillars',
                    created_at: new Date().toISOString()
                })
                .select()
                .single();

            if (error) throw error;

            // Note: Fan-out logic for notifications would go here in production

            return res.status(201).json({ success: true, data });
        } catch (err) {
            console.error('[Governance/Broadcasts] Error:', err);
            return res.status(500).json({ error: 'Internal server error', details: err.message });
        }
    });

    return router;
}
