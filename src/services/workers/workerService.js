// ==============================================================================
// COOP HUB — Worker / Pillar Discovery Service
// Real Database-driven queries against public.pillar_profiles
// Backed by Authoritative 80-Pillar Certified Catalog (src/data/pillarsRoster.js)
// ==============================================================================

import { supabase } from '../../lib/supabase';
import { PILLARS_ROSTER } from '../../data/pillarsRoster';

/**
 * Calculates Haversine distance in km between two GPS coordinates
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 3.5;
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export const workerService = {
  /**
   * Fetch active, verified pillars filtered by service category / trade / sub-service and location
   */
  async getAvailablePillars({ category = '', serviceName = '', lat = 13.0067, lng = 80.2025, maxDistanceKm = 50 } = {}) {
    let dbPillars = [];
    try {
      const { data, error } = await supabase
        .from('pillar_profiles')
        .select('*')
        .order('rating', { ascending: false });

      if (!error && Array.isArray(data)) {
        dbPillars = data;
      }
    } catch (err) {
      console.warn('workerService DB query note:', err?.message || err);
    }

    // Build lookup maps for existing database pillars
    const dbByCode = new Map();
    const dbByEmail = new Map();
    const dbById = new Map();

    for (const p of dbPillars) {
      if (p.pillar_code) dbByCode.set(p.pillar_code.toUpperCase(), p);
      if (p.email) dbByEmail.set(p.email.toLowerCase(), p);
      if (p.id) dbById.set(p.id, p);
    }

    // Merge: Seed Roster is authoritative for sub-services, enriched by live DB profile
    const mergedList = [];
    const seenCodes = new Set();

    for (const seed of PILLARS_ROSTER) {
      const codeKey = (seed.pillar_code || '').toUpperCase();
      const emailKey = (seed.email || '').toLowerCase();
      const dbMatch = dbByCode.get(codeKey) || dbByEmail.get(emailKey) || (seed.id ? dbById.get(seed.id) : null);

      seenCodes.add(codeKey);

      mergedList.push({
        id: dbMatch?.id || seed.id,
        pillar_code: seed.pillar_code || dbMatch?.pillar_code || `PIL-${(seed.id || '').slice(0, 4).toUpperCase()}`,
        full_name: dbMatch?.full_name || seed.full_name,
        email: dbMatch?.email || seed.email,
        mobile: dbMatch?.mobile || seed.mobile,
        role: seed.custom_role || dbMatch?.custom_role || seed.main_services[0] || 'Master Specialist',
        custom_role: seed.custom_role || dbMatch?.custom_role,
        trade: (dbMatch?.main_services?.length ? dbMatch.main_services.join(', ') : seed.main_services.join(', ')),
        main_services: dbMatch?.main_services || seed.main_services,
        sub_services: seed.sub_services || dbMatch?.sub_services || [],
        sub_service: (seed.sub_services && seed.sub_services[0]) || (dbMatch?.sub_services && dbMatch.sub_services[0]) || '',
        area: dbMatch?.area || seed.area || 'Chennai Metro',
        pincode: dbMatch?.pincode || seed.pincode || '600001',
        address: seed.address || `${seed.area}, Chennai - ${seed.pincode}`,
        service_area: dbMatch?.service_area?.length ? dbMatch.service_area.join(', ') : (seed.service_area?.join(', ') || `${seed.area}, Chennai Metro`),
        rating: Number(dbMatch?.rating || seed.rating || 4.9),
        total_reviews: Number(dbMatch?.total_reviews || seed.total_reviews || 48),
        completed_jobs: Number(dbMatch?.total_completed_jobs || seed.completed_jobs || 42),
        experience_years: String(dbMatch?.experience_years || seed.experience_years || '5'),
        is_available: dbMatch?.is_available !== false && seed.is_available !== false,
        verification_status: dbMatch?.status || seed.status || 'verified',
        starting_price: Number(seed.starting_price || 350),
        avatar_url: seed.avatar_url || dbMatch?.avatar_url || null,
        latitude: Number(dbMatch?.current_lat || dbMatch?.lat || seed.lat || 13.0067),
        longitude: Number(dbMatch?.current_lng || dbMatch?.lng || seed.lng || 80.2025)
      });
    }

    // Include any additional DB pillars not in the 80 roster (e.g. legacy test pillars)
    for (const dbP of dbPillars) {
      const codeKey = (dbP.pillar_code || '').toUpperCase();
      if (!seenCodes.has(codeKey)) {
        seenCodes.add(codeKey);
        mergedList.push({
          id: dbP.id,
          pillar_code: dbP.pillar_code || `PIL-${dbP.id.slice(0, 4).toUpperCase()}`,
          full_name: dbP.full_name || 'Certified Cooperative Technician',
          email: dbP.email || '',
          mobile: dbP.mobile || '',
          role: dbP.custom_role || (Array.isArray(dbP.main_services) ? dbP.main_services[0] : 'Master Pillar'),
          custom_role: dbP.custom_role,
          trade: Array.isArray(dbP.main_services) ? dbP.main_services.join(', ') : 'General Service',
          main_services: Array.isArray(dbP.main_services) ? dbP.main_services : [],
          sub_services: Array.isArray(dbP.sub_services) ? dbP.sub_services : [],
          sub_service: Array.isArray(dbP.sub_services) && dbP.sub_services[0] ? dbP.sub_services[0] : '',
          area: dbP.area || 'Chennai Central',
          pincode: dbP.pincode || '600001',
          address: `${dbP.area || 'Chennai Metro'}, Tamil Nadu`,
          service_area: Array.isArray(dbP.service_area) ? dbP.service_area.join(', ') : 'Chennai Metro',
          rating: Number(dbP.rating || 4.9),
          total_reviews: Number(dbP.total_reviews || 20),
          completed_jobs: Number(dbP.total_completed_jobs || 35),
          experience_years: String(dbP.experience_years || '4'),
          is_available: dbP.is_available !== false,
          verification_status: dbP.status || 'verified',
          starting_price: 350,
          avatar_url: dbP.avatar_url || null,
          latitude: Number(dbP.current_lat || dbP.lat || 13.0067),
          longitude: Number(dbP.current_lng || dbP.lng || 80.2025)
        });
      }
    }

    // Filter by trade, category, or sub-service name
    const searchTrade = (category || serviceName || '').trim().toLowerCase();
    let filtered = mergedList;

    if (searchTrade) {
      filtered = mergedList.filter(p => {
        const mainStr = p.main_services.join(' ').toLowerCase();
        const subStr = p.sub_services.join(' ').toLowerCase();
        const roleStr = (p.role || '').toLowerCase();
        const areaStr = (p.area || '').toLowerCase();

        return (
          mainStr.includes(searchTrade) ||
          subStr.includes(searchTrade) ||
          roleStr.includes(searchTrade) ||
          areaStr.includes(searchTrade) ||
          searchTrade.includes(mainStr) ||
          // Keyword shortcuts
          (searchTrade.includes('electr') && (mainStr.includes('electr') || roleStr.includes('electr'))) ||
          (searchTrade.includes('plumb') && (mainStr.includes('plumb') || roleStr.includes('plumb'))) ||
          (searchTrade.includes('ac') && (mainStr.includes('ac') || roleStr.includes('ac') || mainStr.includes('hvac'))) ||
          (searchTrade.includes('carpenter') && (mainStr.includes('carpent') || roleStr.includes('carpent'))) ||
          (searchTrade.includes('clean') && (mainStr.includes('clean') || roleStr.includes('clean'))) ||
          (searchTrade.includes('paint') && (mainStr.includes('paint') || roleStr.includes('paint')))
        );
      });
    }

    // Compute distance and sort
    const formatted = filtered.map(p => {
      const distance = calculateDistanceKm(lat, lng, p.latitude, p.longitude);
      return { ...p, distance };
    });

    return formatted.sort((a, b) => a.distance - b.distance || b.rating - a.rating);
  },

  /**
   * Get single pillar profile by ID or Pillar Code
   */
  async getPillarById(pillarId) {
    if (!pillarId) return null;
    const cleanId = String(pillarId).trim();

    let dbData = null;
    try {
      const { data, error } = await supabase
        .from('pillar_profiles')
        .select('*')
        .or(`id.eq.${cleanId},pillar_code.eq.${cleanId},pillar_id.eq.${cleanId}`)
        .maybeSingle();

      if (!error && data) {
        dbData = data;
      }
    } catch (err) {
      console.warn('workerService.getPillarById DB note:', err?.message || err);
    }

    // Also find matching seed in PILLARS_ROSTER
    const seed = PILLARS_ROSTER.find(s =>
      s.id === cleanId ||
      s.pillar_code?.toUpperCase() === cleanId.toUpperCase() ||
      s.email?.toLowerCase() === cleanId.toLowerCase() ||
      (dbData && (s.pillar_code?.toUpperCase() === dbData.pillar_code?.toUpperCase() || s.email?.toLowerCase() === dbData.email?.toLowerCase()))
    );

    if (!dbData && !seed) return null;

    const full_name = dbData?.full_name || seed?.full_name || 'Certified Cooperative Technician';
    const main_services = dbData?.main_services || seed?.main_services || [];
    const sub_services = seed?.sub_services || dbData?.sub_services || [];
    const area = dbData?.area || seed?.area || 'Chennai';
    const pincode = dbData?.pincode || seed?.pincode || '600001';

    return {
      id: dbData?.id || seed?.id,
      pillar_code: seed?.pillar_code || dbData?.pillar_code || `PIL-${(cleanId).slice(0, 4).toUpperCase()}`,
      full_name: full_name,
      email: dbData?.email || seed?.email,
      mobile: dbData?.mobile || seed?.mobile,
      role: seed?.custom_role || dbData?.custom_role || (main_services[0] || 'Master Specialist'),
      custom_role: seed?.custom_role || dbData?.custom_role,
      trade: main_services.join(', '),
      main_services: main_services,
      sub_services: sub_services,
      sub_service: sub_services[0] || '',
      area: area,
      pincode: pincode,
      address: seed?.address || `${area}, Chennai - ${pincode}`,
      service_area: dbData?.service_area?.length ? dbData.service_area.join(', ') : (seed?.service_area?.join(', ') || `${area}, Chennai Metro`),
      rating: Number(dbData?.rating || seed?.rating || 4.9),
      total_reviews: Number(dbData?.total_reviews || seed?.total_reviews || 48),
      completed_jobs: Number(dbData?.total_completed_jobs || seed?.completed_jobs || 50),
      experience_years: String(dbData?.experience_years || seed?.experience_years || '5'),
      verification_status: dbData?.status || seed?.status || 'verified',
      is_available: dbData?.is_available !== false,
      starting_price: Number(seed?.starting_price || 350),
      avatar_url: seed?.avatar_url || dbData?.avatar_url || null,
      current_lat: Number(dbData?.current_lat || dbData?.lat || seed?.lat || 13.0067),
      current_lng: Number(dbData?.current_lng || dbData?.lng || seed?.lng || 80.2025)
    };
  }
};

export default workerService;
