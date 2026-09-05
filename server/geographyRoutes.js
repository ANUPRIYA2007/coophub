/**
 * COOP HUB Super Admin — Geography API Routes (Phase 5A)
 * All routes require SUPER_ADMIN authorization via requireSuperAdmin middleware.
 * Uses Supabase service role for direct DB queries.
 *
 * Routes:
 *   GET  /api/admin/geography/summary
 *   GET  /api/admin/geography/zones
 *   GET  /api/admin/geography/zones/:code/states
 *   GET  /api/admin/geography/states/:code
 *   GET  /api/admin/geography/states/:code/districts
 *   GET  /api/admin/geography/districts/:code
 *   GET  /api/admin/geography/search
 */

import { Router } from 'express';

export function createGeographyRouter(supabaseAdmin, requireSuperAdmin) {
    const router = Router();

    // ─────────────────────────────────────────────────────────────────
    // GET /api/admin/geography/summary
    // National overview: zone count, state count, UT count, totals
    // ─────────────────────────────────────────────────────────────────
    router.get('/summary', requireSuperAdmin, async (req, res) => {
        try {
            const [zonesRes, statesRes, districtsRes, coopsRes] = await Promise.all([
                supabaseAdmin.from('geo_zones').select('code, name, status', { count: 'exact', head: false }),
                supabaseAdmin.from('geo_states').select('code, type, zone_code', { count: 'exact', head: false }),
                supabaseAdmin.from('geo_districts').select('code', { count: 'exact', head: false }),
                supabaseAdmin.from('geo_cooperatives').select('code', { count: 'exact', head: false }),
            ]);

            const states = statesRes.data || [];
            const stateCount = states.filter(s => s.type === 'STATE').length;
            const utCount = states.filter(s => s.type === 'UNION_TERRITORY').length;

            return res.json({
                total_zones: zonesRes.data?.length ?? 0,
                total_states: stateCount,
                total_union_territories: utCount,
                total_units: states.length,
                total_districts: districtsRes.data?.length ?? 0,
                total_cooperatives: coopsRes.data?.length ?? 0,
                data_source: 'database',
                generated_at: new Date().toISOString()
            });
        } catch (err) {
            console.error('[Geography/summary] Error:', err);
            return res.status(500).json({ error: 'Failed to fetch geography summary', details: err.message });
        }
    });

    // ─────────────────────────────────────────────────────────────────
    // GET /api/admin/geography/zones
    // All zones with per-zone state/UT counts
    // ─────────────────────────────────────────────────────────────────
    router.get('/zones', requireSuperAdmin, async (req, res) => {
        try {
            const [zonesRes, statesRes, districtsRes, coopsRes] = await Promise.all([
                supabaseAdmin.from('geo_zones').select('*').order('code'),
                supabaseAdmin.from('geo_states').select('code, zone_code, type, status'),
                supabaseAdmin.from('geo_districts').select('code, state_code'),
                supabaseAdmin.from('geo_cooperatives').select('code, district_code'),
            ]);

            const zones = zonesRes.data || [];
            const states = statesRes.data || [];
            const districts = districtsRes.data || [];
            const coops = coopsRes.data || [];

            // Build state_code → zone_code map for district/coop aggregation
            const stateZoneMap = {};
            states.forEach(s => { stateZoneMap[s.code] = s.zone_code; });

            // Build district_code → state_code map
            const districtStateMap = {};
            districts.forEach(d => { districtStateMap[d.code] = d.state_code; });

            const result = zones.map(zone => {
                const zoneStates = states.filter(s => s.zone_code === zone.code);
                const stateCodesInZone = new Set(zoneStates.map(s => s.code));

                const zoneDistrictCodes = districts
                    .filter(d => stateCodesInZone.has(d.state_code))
                    .map(d => d.code);
                const zoneDistrictCodeSet = new Set(zoneDistrictCodes);

                const zoneCoopCount = coops.filter(c => zoneDistrictCodeSet.has(c.district_code)).length;

                return {
                    code: zone.code,
                    name: zone.name,
                    description: zone.description,
                    status: zone.status || 'active',
                    state_count: zoneStates.filter(s => s.type === 'STATE').length,
                    ut_count: zoneStates.filter(s => s.type === 'UNION_TERRITORY').length,
                    total_units: zoneStates.length,
                    district_count: zoneDistrictCodes.length,
                    cooperative_count: zoneCoopCount,
                };
            });

            return res.json({ zones: result, total: result.length });
        } catch (err) {
            console.error('[Geography/zones] Error:', err);
            return res.status(500).json({ error: 'Failed to fetch zones', details: err.message });
        }
    });

    // ─────────────────────────────────────────────────────────────────
    // GET /api/admin/geography/zones/:code/states
    // States and UTs within a specific zone
    // ─────────────────────────────────────────────────────────────────
    router.get('/zones/:code/states', requireSuperAdmin, async (req, res) => {
        const { code } = req.params;
        const zoneCode = code.toUpperCase();

        try {
            const [zoneRes, statesRes] = await Promise.all([
                supabaseAdmin.from('geo_zones').select('*').eq('code', zoneCode).single(),
                supabaseAdmin.from('geo_states').select('*').eq('zone_code', zoneCode).order('name'),
            ]);

            if (zoneRes.error || !zoneRes.data) {
                return res.status(404).json({ error: `Zone '${zoneCode}' not found` });
            }

            const states = statesRes.data || [];

            // Get district counts per state
            const stateCodes = states.map(s => s.code);
            const districtsRes = await supabaseAdmin
                .from('geo_districts')
                .select('code, state_code')
                .in('state_code', stateCodes.length > 0 ? stateCodes : ['__none__']);

            const districts = districtsRes.data || [];

            // Get coop counts per district
            const districtCodes = districts.map(d => d.code);
            const coopsRes = await supabaseAdmin
                .from('geo_cooperatives')
                .select('code, district_code')
                .in('district_code', districtCodes.length > 0 ? districtCodes : ['__none__']);

            const coops = coopsRes.data || [];

            // Build district and coop counts per state
            const districtCountPerState = {};
            const coopCountPerState = {};
            districts.forEach(d => {
                districtCountPerState[d.state_code] = (districtCountPerState[d.state_code] || 0) + 1;
            });
            const districtCoopMap = {};
            coops.forEach(c => {
                districtCoopMap[c.district_code] = (districtCoopMap[c.district_code] || 0) + 1;
            });
            districts.forEach(d => {
                const coopCount = districtCoopMap[d.code] || 0;
                coopCountPerState[d.state_code] = (coopCountPerState[d.state_code] || 0) + coopCount;
            });

            const enrichedStates = states.map(s => ({
                ...s,
                district_count: districtCountPerState[s.code] || 0,
                cooperative_count: coopCountPerState[s.code] || 0,
            }));

            return res.json({
                zone: zoneRes.data,
                states: enrichedStates.filter(s => s.type === 'STATE'),
                union_territories: enrichedStates.filter(s => s.type === 'UNION_TERRITORY'),
                total_units: enrichedStates.length,
                state_count: enrichedStates.filter(s => s.type === 'STATE').length,
                ut_count: enrichedStates.filter(s => s.type === 'UNION_TERRITORY').length,
            });
        } catch (err) {
            console.error('[Geography/zones/:code/states] Error:', err);
            return res.status(500).json({ error: 'Failed to fetch zone states', details: err.message });
        }
    });

    // ─────────────────────────────────────────────────────────────────
    // GET /api/admin/geography/states/:code
    // Single State/UT detail with zone, district count, coop count
    // ─────────────────────────────────────────────────────────────────
    router.get('/states/:code', requireSuperAdmin, async (req, res) => {
        const { code } = req.params;
        const stateCode = code.toUpperCase();

        try {
            const [stateRes, zoneRes, districtsRes] = await Promise.all([
                supabaseAdmin.from('geo_states').select('*').eq('code', stateCode).single(),
                supabaseAdmin.from('geo_zones').select('*'),
                supabaseAdmin.from('geo_districts').select('code').eq('state_code', stateCode),
            ]);

            if (stateRes.error || !stateRes.data) {
                return res.status(404).json({ error: `State/UT '${stateCode}' not found` });
            }

            const state = stateRes.data;
            const zone = (zoneRes.data || []).find(z => z.code === state.zone_code);
            const districtCodes = (districtsRes.data || []).map(d => d.code);

            let coopCount = 0;
            if (districtCodes.length > 0) {
                const coopsRes = await supabaseAdmin
                    .from('geo_cooperatives')
                    .select('code', { count: 'exact', head: false })
                    .in('district_code', districtCodes);
                coopCount = coopsRes.data?.length ?? 0;
            }

            return res.json({
                ...state,
                zone: zone || null,
                district_count: districtCodes.length,
                cooperative_count: coopCount,
            });
        } catch (err) {
            console.error('[Geography/states/:code] Error:', err);
            return res.status(500).json({ error: 'Failed to fetch state detail', details: err.message });
        }
    });

    // ─────────────────────────────────────────────────────────────────
    // GET /api/admin/geography/states/:code/districts
    // Districts for a State/UT (paginated, page=1&limit=50 default)
    // ─────────────────────────────────────────────────────────────────
    router.get('/states/:code/districts', requireSuperAdmin, async (req, res) => {
        const { code } = req.params;
        const stateCode = code.toUpperCase();
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50));
        const offset = (page - 1) * limit;

        try {
            const [stateRes, districtsRes] = await Promise.all([
                supabaseAdmin.from('geo_states').select('code, name, type, zone_code').eq('code', stateCode).single(),
                supabaseAdmin.from('geo_districts')
                    .select('*')
                    .eq('state_code', stateCode)
                    .order('name')
                    .range(offset, offset + limit - 1),
            ]);

            if (stateRes.error || !stateRes.data) {
                return res.status(404).json({ error: `State/UT '${stateCode}' not found` });
            }

            const districts = districtsRes.data || [];

            // Get coop counts per district
            const districtCodes = districts.map(d => d.code);
            const coopsRes = districtCodes.length > 0
                ? await supabaseAdmin.from('geo_cooperatives').select('district_code').in('district_code', districtCodes)
                : { data: [] };

            const coopCountPerDistrict = {};
            (coopsRes.data || []).forEach(c => {
                coopCountPerDistrict[c.district_code] = (coopCountPerDistrict[c.district_code] || 0) + 1;
            });

            const enriched = districts.map(d => ({
                ...d,
                cooperative_count: coopCountPerDistrict[d.code] || 0,
            }));

            return res.json({
                state: stateRes.data,
                districts: enriched,
                total: enriched.length,
                page,
                limit,
            });
        } catch (err) {
            console.error('[Geography/states/:code/districts] Error:', err);
            return res.status(500).json({ error: 'Failed to fetch districts', details: err.message });
        }
    });

    // ─────────────────────────────────────────────────────────────────
    // GET /api/admin/geography/districts/:code
    // Single district detail with parent state, cooperative count
    // ─────────────────────────────────────────────────────────────────
    router.get('/districts/:code', requireSuperAdmin, async (req, res) => {
        const { code } = req.params;
        const districtCode = code.toUpperCase();

        try {
            const [districtRes, coopsRes] = await Promise.all([
                supabaseAdmin.from('geo_districts').select('*').eq('code', districtCode).single(),
                supabaseAdmin.from('geo_cooperatives').select('*').eq('district_code', districtCode),
            ]);

            if (districtRes.error || !districtRes.data) {
                return res.status(404).json({ error: `District '${districtCode}' not found` });
            }

            // Fetch parent state
            const stateRes = await supabaseAdmin
                .from('geo_states')
                .select('code, name, type, zone_code')
                .eq('code', districtRes.data.state_code)
                .single();

            return res.json({
                ...districtRes.data,
                state: stateRes.data || null,
                cooperatives: coopsRes.data || [],
                cooperative_count: coopsRes.data?.length ?? 0,
            });
        } catch (err) {
            console.error('[Geography/districts/:code] Error:', err);
            return res.status(500).json({ error: 'Failed to fetch district detail', details: err.message });
        }
    });

    // ─────────────────────────────────────────────────────────────────
    // GET /api/admin/geography/search?q=&zone=&type=&limit=
    // Full-text search across zones, states, districts, cooperatives
    // ─────────────────────────────────────────────────────────────────
    router.get('/search', requireSuperAdmin, async (req, res) => {
        const q = (req.query.q || '').trim();
        const zoneFilter = req.query.zone ? req.query.zone.toUpperCase() : null;
        const typeFilter = req.query.type ? req.query.type.toUpperCase() : null;
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));

        if (!q && !zoneFilter && !typeFilter) {
            return res.json({ results: [], total: 0 });
        }

        try {
            const results = [];

            // Search geo_zones
            if (!typeFilter || typeFilter === 'ZONE') {
                let zonesQuery = supabaseAdmin.from('geo_zones').select('code, name, status');
                if (q) zonesQuery = zonesQuery.ilike('name', `%${q}%`);
                const { data: zones } = await zonesQuery.limit(10);
                (zones || []).forEach(z => results.push({ level: 'ZONE', code: z.code, name: z.name, status: z.status }));
            }

            // Search geo_states
            if (!typeFilter || typeFilter === 'STATE' || typeFilter === 'UNION_TERRITORY') {
                let statesQuery = supabaseAdmin.from('geo_states').select('code, name, type, zone_code, capital, status');
                if (q) statesQuery = statesQuery.ilike('name', `%${q}%`);
                if (zoneFilter) statesQuery = statesQuery.eq('zone_code', zoneFilter);
                if (typeFilter && (typeFilter === 'STATE' || typeFilter === 'UNION_TERRITORY')) {
                    statesQuery = statesQuery.eq('type', typeFilter);
                }
                const { data: states } = await statesQuery.limit(limit);
                (states || []).forEach(s => results.push({
                    level: s.type === 'UNION_TERRITORY' ? 'UNION_TERRITORY' : 'STATE',
                    code: s.code,
                    name: s.name,
                    zone_code: s.zone_code,
                    capital: s.capital,
                    status: s.status
                }));
            }

            // Search geo_districts
            if (!typeFilter || typeFilter === 'DISTRICT') {
                let distQuery = supabaseAdmin.from('geo_districts').select('code, name, state_code');
                if (q) distQuery = distQuery.ilike('name', `%${q}%`);
                const { data: districts } = await distQuery.limit(limit);
                (districts || []).forEach(d => results.push({
                    level: 'DISTRICT',
                    code: d.code,
                    name: d.name,
                    state_code: d.state_code
                }));
            }

            // Search geo_cooperatives
            if (!typeFilter || typeFilter === 'COOPERATIVE') {
                let coopQuery = supabaseAdmin.from('geo_cooperatives').select('code, name, district_code, verified');
                if (q) coopQuery = coopQuery.ilike('name', `%${q}%`);
                const { data: coops } = await coopQuery.limit(limit);
                (coops || []).forEach(c => results.push({
                    level: 'COOPERATIVE',
                    code: c.code,
                    name: c.name,
                    district_code: c.district_code,
                    verified: c.verified
                }));
            }

            return res.json({
                results,
                total: results.length,
                query: q,
                filters: { zone: zoneFilter, type: typeFilter }
            });
        } catch (err) {
            console.error('[Geography/search] Error:', err);
            return res.status(500).json({ error: 'Search failed', details: err.message });
        }
    });

    return router;
}
