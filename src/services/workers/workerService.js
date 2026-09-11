// ==============================================================================
// COOP HUB — Worker / Pillar Discovery Service
// Real Database-driven queries against public.pillar_profiles
// Backed by Authoritative 80-Pillar Certified Catalog (src/data/pillarsRoster.js)
// ==============================================================================

import { supabase } from '../../lib/supabase.js';
import { PILLARS_ROSTER } from '../../data/pillarsRoster.js';

/**
 * Calculates Haversine distance in km between two GPS coordinates
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
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
  async getAvailablePillars({ category = '', serviceName = '', subServiceName = '', lat = null, lng = null, maxDistanceKm = 50 } = {}) {
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
        trade: (dbMatch?.main_services?.length ? (Array.isArray(dbMatch.main_services) ? dbMatch.main_services.join(', ') : dbMatch.main_services) : (Array.isArray(seed.main_services) ? seed.main_services.join(', ') : seed.main_services)),
        main_services: dbMatch?.main_services || seed.main_services,
        sub_services: seed.sub_services || dbMatch?.sub_services || [],
        sub_service: (seed.sub_services && seed.sub_services[0]) || (dbMatch?.sub_services && dbMatch.sub_services[0]) || '',
        area: dbMatch?.area || seed.area || 'Chennai Metro',
        pincode: dbMatch?.pincode || seed.pincode || '600001',
        address: seed.address || `${seed.area}, Chennai - ${seed.pincode}`,
        service_area: dbMatch?.service_area?.length ? (Array.isArray(dbMatch.service_area) ? dbMatch.service_area.join(', ') : dbMatch.service_area) : (Array.isArray(seed.service_area) ? seed.service_area.join(', ') : `${seed.area}, Chennai Metro`),
        rating: Number(dbMatch?.rating || seed.rating || 4.9),
        total_reviews: Number(dbMatch?.total_reviews || seed.total_reviews || 48),
        completed_jobs: Number(dbMatch?.total_completed_jobs || seed.completed_jobs || 42),
        experience_years: String(dbMatch?.experience_years || seed.experience_years || '5'),
        is_available: dbMatch?.is_available !== false && seed.is_available !== false,
        verification_status: dbMatch?.status || seed.status || 'verified',
        starting_price: Number(seed.starting_price || 350),
        avatar_url: seed.avatar_url || dbMatch?.avatar_url || null,
        latitude: dbMatch?.current_lat ? Number(dbMatch.current_lat) : (dbMatch?.lat ? Number(dbMatch.lat) : (seed.lat ? Number(seed.lat) : null)),
        longitude: dbMatch?.current_lng ? Number(dbMatch.current_lng) : (dbMatch?.lng ? Number(dbMatch.lng) : (seed.lng ? Number(seed.lng) : null))
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
          latitude: dbP.current_lat ? Number(dbP.current_lat) : (dbP.lat ? Number(dbP.lat) : null),
          longitude: dbP.current_lng ? Number(dbP.current_lng) : (dbP.lng ? Number(dbP.lng) : null)
        });
      }
    }

    const safeJoin = (arr) => Array.isArray(arr) ? arr.join(' ').toLowerCase() : '';

    // Filter by trade, category, or sub-service name
    const searchTrade = (category || serviceName || '').trim().toLowerCase();
    const searchSub = (subServiceName || '').trim().toLowerCase();
    
    let baseFiltered = mergedList;

    if (searchTrade) {
      baseFiltered = mergedList.filter(p => {
        const mainStr = safeJoin(p.main_services);
        const subStr = safeJoin(p.sub_services);
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

    // Compute distance
    const formatted = baseFiltered.map(p => {
      const distance = calculateDistanceKm(lat, lng, p.latitude, p.longitude);
      return { ...p, distance };
    });

    // Sub-service / Distance Filtering Logic
    let finalFiltered = formatted;
    
    if (searchSub) {
      // 1. Try to find pillars matching the exact sub-service in short distance
      const subServiceMatches = formatted.filter(p => 
        safeJoin(p.sub_services).includes(searchSub) && (p.distance === null || p.distance <= maxDistanceKm)
      );
      
      if (subServiceMatches.length > 0) {
        finalFiltered = subServiceMatches;
      } else {
        // Fallback: show any pillar for the main service within distance
        finalFiltered = formatted.filter(p => p.distance === null || p.distance <= maxDistanceKm);
      }
    } else {
      finalFiltered = formatted.filter(p => p.distance === null || p.distance <= maxDistanceKm);
    }
    
    // If still 0, just return the closest ones of the main service regardless of strict max distance
    if (finalFiltered.length === 0) {
       finalFiltered = formatted;
    }

    finalFiltered.sort((a, b) => {
      if (a.distance === null && b.distance === null) return b.rating - a.rating;
      if (a.distance === null) return 1; // missing distance goes to bottom
      if (b.distance === null) return -1;
      return a.distance - b.distance || b.rating - a.rating;
    });

    // Enrich top 10 candidates with live route distances instead of Haversine
    try {
      const topCandidates = finalFiltered.slice(0, 10);
      if (topCandidates.length > 0) {
        const { googleMapsService } = await import('../maps/googleMapsService.js');
        const origins = topCandidates.map(p => ({ lat: p.latitude, lng: p.longitude }));
        const destinations = [{ lat: Number(lat), lng: Number(lng) }];
        const matrix = await googleMapsService.calculateDistanceMatrix(origins, destinations);
        
        if (matrix && matrix.length > 0) {
          topCandidates.forEach((p, idx) => {
            const el = matrix[idx]?.[0];
            if (el && (el.status === "OK" || el.status === "FALLBACK_OK")) {
              p.distance = el.distanceKm || p.distance;
              p.etaMins = el.durationMins;
              p.isLiveDistance = !el.status.includes('FALLBACK');
            }
          });
          // Re-sort based on real route distances
          topCandidates.sort((a, b) => {
            if (a.distance === null && b.distance === null) return b.rating - a.rating;
            if (a.distance === null) return 1;
            if (b.distance === null) return -1;
            return a.distance - b.distance || b.rating - a.rating;
          });
          finalFiltered.splice(0, topCandidates.length, ...topCandidates);
        }
      }
    } catch (routeErr) {
      console.warn("Live route distance enrichment failed:", routeErr);
    }

    return finalFiltered;
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
      current_lat: dbData?.current_lat ? Number(dbData.current_lat) : (dbData?.lat ? Number(dbData.lat) : (seed?.lat ? Number(seed.lat) : null)),
      current_lng: dbData?.current_lng ? Number(dbData.current_lng) : (dbData?.lng ? Number(dbData.lng) : (seed?.lng ? Number(seed.lng) : null))
    };
  }
};

export default workerService;
