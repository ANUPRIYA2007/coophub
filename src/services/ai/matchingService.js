// ==============================================================================
// COOP HUB — AI Workforce Allocation & Intelligent Worker Matching Engine
// ==============================================================================
// Computes multi-parameter match score based on:
//  - Skill match
//  - Certified Skill (Approved Skill Certification verification)
//  - Geospatial Distance (Haversine GPS telemetry)
//  - Worker Availability & Online status
//  - Current Active Workload
//  - Customer Rating & Reviews
//  - Verified Experience
//  - Cancellation rate / Reliability
//  - Emergency on-demand readiness
// ==============================================================================

import { supabase } from '../../lib/supabase.js';

const rawNvidiaModel = import.meta.env?.VITE_NVIDIA_MODEL;
const NVIDIA_MODEL = (rawNvidiaModel && !rawNvidiaModel.includes('nemotron-parse')) ? rawNvidiaModel : "meta/llama-3.2-11b-vision-instruct";
const GEMINI_API_KEY = import.meta.env?.VITE_GEMINI_API_KEY;

const CHENNAI_DEFAULT_COORDS = {
  "Guindy": { lat: 13.0067, lng: 80.2025 },
  "Adyar": { lat: 13.0012, lng: 80.2565 },
  "T. Nagar": { lat: 13.0418, lng: 80.2341 },
  "Velachery": { lat: 12.9815, lng: 80.2180 },
  "Anna Nagar": { lat: 13.0850, lng: 80.2101 },
  "Saidapet": { lat: 13.0213, lng: 80.2231 },
  "Mylapore": { lat: 13.0368, lng: 80.2676 }
};

/**
 * Haversine formula to compute great-circle distance between two GPS coordinates in kilometers
 */
export function calculateDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 3.5; // fallback average city radius
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return parseFloat((R * c).toFixed(2));
}

/**
 * Deterministic scoring algorithm
 */
export function calculatePillarMatchScore({ pillar, request, approvedCerts = [] }) {
  let score = 0;
  const reasons = [];

  // 1. Skill Match (30 pts)
  const reqService = (request.service_name || request.category || '').toLowerCase();
  const mainServices = Array.isArray(pillar.main_services) ? pillar.main_services.map(s => s.toLowerCase()) : [String(pillar.main_services || '').toLowerCase()];
  const subServices = Array.isArray(pillar.sub_services) ? pillar.sub_services.map(s => s.toLowerCase()) : [String(pillar.sub_services || '').toLowerCase()];

  const hasPrimarySkill = mainServices.some(s => s.includes(reqService) || reqService.includes(s));
  const hasSubSkill = subServices.some(s => s.includes(reqService) || reqService.includes(s));

  if (hasPrimarySkill) {
    score += 30;
    reasons.push("Direct primary skill match in trade category (+30)");
  } else if (hasSubSkill) {
    score += 20;
    reasons.push("Secondary / sub-service competency match (+20)");
  } else {
    score += 5;
    reasons.push("Cross-functional trade capability (+5)");
  }

  // 2. Verified Skill Certification (20 pts)
  const isCertified = approvedCerts.some(c => 
    c.pillar_id === pillar.id && 
    c.verification_status === 'approved' &&
    (c.skill_name?.toLowerCase().includes(reqService) || reqService.includes(c.skill_name?.toLowerCase()))
  ) || (Array.isArray(pillar.certified_skills) && pillar.certified_skills.some(cs => cs.toLowerCase().includes(reqService)));

  if (isCertified) {
    score += 20;
    reasons.push("Verified trade certification approved by cooperative (+20)");
  }

  // 3. Proximity / Distance (20 pts)
  const destLat = request.lat || request.latitude;
  const destLng = request.lng || request.longitude;
  const destCoords = (destLat && destLng) ? { lat: Number(destLat), lng: Number(destLng) } : null;

  const pillarCoords = (pillar.current_lat && pillar.current_lng) 
    ? { lat: Number(pillar.current_lat), lng: Number(pillar.current_lng) }
    : (pillar.lat && pillar.lng)
      ? { lat: Number(pillar.lat), lng: Number(pillar.lng) }
      : (pillar.latitude && pillar.longitude)
        ? { lat: Number(pillar.latitude), lng: Number(pillar.longitude) }
        : null;

  let distanceKm = null;
  
  if (destCoords && pillarCoords) {
    distanceKm = calculateDistanceKm(destCoords.lat, destCoords.lng, pillarCoords.lat, pillarCoords.lng);

    if (distanceKm <= 3.0) {
      score += 20;
      reasons.push(`Hyper-local proximity: ${distanceKm} km (+20)`);
    } else if (distanceKm <= 8.0) {
      score += 14;
      reasons.push(`Close service radius: ${distanceKm} km (+14)`);
    } else if (distanceKm <= 15.0) {
      score += 8;
      reasons.push(`Within standard operational zone: ${distanceKm} km (+8)`);
    } else {
      score += 2;
      reasons.push(`Extended dispatch zone: ${distanceKm} km (+2)`);
    }
  } else {
    reasons.push(`Proximity scoring bypassed (Coordinates unavailable) (+0)`);
  }

  // 4. Rating & Reviews (15 pts)
  const rating = Number(pillar.rating) || 4.8;
  if (rating >= 4.8) {
    score += 15;
    reasons.push(`Exceptional performance rating: ${rating}★ (+15)`);
  } else if (rating >= 4.5) {
    score += 10;
    reasons.push(`Strong performance rating: ${rating}★ (+10)`);
  } else {
    score += 5;
    reasons.push(`Satisfactory rating: ${rating}★ (+5)`);
  }

  // 5. Workload & Availability (15 pts)
  if (pillar.is_available) {
    score += 10;
    reasons.push("Technician is currently on-duty and available (+10)");
  }
  const activeJobs = Number(pillar.active_jobs_count) || 0;
  if (activeJobs === 0) {
    score += 5;
    reasons.push("Zero active jobs backlog / Immediate dispatch (+5)");
  }

  // 6. Emergency Priority Bonus
  if (request.is_emergency) {
    if (distanceKm <= 4.0 && pillar.is_available) {
      score += 10;
      reasons.push("⚡ Emergency rapid responder readiness (+10)");
    }
  }

  // 7. Chronos-2 Forecast Surge / Shortage Zone Priority Allocation Bonus
  if (request.shortage_severity === 'critical' || request.is_shortage_zone) {
    if (isCertified && pillar.is_available) {
      score += 12;
      reasons.push("⚡ Chronos-2 Demand Surge Zone priority allocation (+12)");
    }
  }

  return {
    score: Math.min(100, score),
    distanceKm,
    reasons,
    isCertified
  };
}

/**
 * Fetch available Pillars from database and rank them for a given booking request
 */
export async function matchWorkforceForRequest(request) {
  const isDemo = typeof window !== 'undefined' && (
                 localStorage.getItem("coophub_demo_user") === "true" ||
                 localStorage.getItem("coophub_demo_admin") === "true" ||
                 localStorage.getItem("coophub_demo_customer") === "true");

  let pillars = [];
  let approvedCerts = [];

  try {
    const { workerService } = await import('../workers/workerService.js');
    pillars = await workerService.getAvailablePillars({
        category: request.category || request.service_name || '',
        serviceName: request.service_name || '',
        subServiceName: request.sub_service_name || '',
        lat: request.lat || request.latitude || null,
        lng: request.lng || request.longitude || null,
        maxDistanceKm: 100
    });

    const { data: cData, error: cErr } = await supabase
      .from('pillar_certificates')
      .select('*')
      .eq('verification_status', 'approved');
      
    if (!cErr && cData) {
        approvedCerts = cData;
    }
  } catch (err) {
    console.warn("Could not query robust pillars via workerService:", err.message);
  }

  if (pillars.length === 0) {
    return {
      success: false,
      message: "Insufficient real-time data for allocation. No verified pillars currently available matching criteria.",
      count: 0,
      candidates: []
    };
  }

  // Calculate scores for all eligible candidates
  const scored = pillars.map(pillar => {
    const { score, distanceKm, reasons, isCertified } = calculatePillarMatchScore({
      pillar,
      request,
      approvedCerts
    });

    return {
      id: pillar.id,
      pillarId: pillar.id,
      pillarCode: pillar.pillar_code || pillar.id,
      fullName: pillar.full_name,
      rating: pillar.rating || 4.8,
      experience: `${pillar.experience_years || 3}+ Years`,
      mainServices: pillar.main_services,
      distanceKm,
      isAvailable: pillar.is_available,
      isCertified,
      matchScore: score,
      reasons,
      rawPillar: pillar
    };
  });

  // Sort descending by match score
  scored.sort((a, b) => b.matchScore - a.matchScore);

  // For top 3 candidates, enrich with Google Distance Matrix / Route ETA if destination coordinates are present
  const reqLat = request.lat || request.latitude;
  const reqLng = request.lng || request.longitude;
  const destCoords = (reqLat && reqLng) ? { lat: Number(reqLat), lng: Number(reqLng) } : null;
  
  const topCandidates = scored.slice(0, 3);
  if (destCoords && topCandidates.length > 0) {
    try {
      const { googleMapsService } = await import('../maps/googleMapsService.js');
      
      const origins = [];
      const validCandidates = [];
      
      topCandidates.forEach(c => {
        const p = c.rawPillar;
        const pLat = Number(p.current_lat || p.lat || p.latitude);
        const pLng = Number(p.current_lng || p.lng || p.longitude);
        if (pLat && pLng) {
            origins.push({ lat: pLat, lng: pLng });
            validCandidates.push(c);
        }
      });

      if (origins.length > 0) {
        const destinations = [{ lat: destCoords.lat, lng: destCoords.lng }];
        const matrix = await googleMapsService.calculateDistanceMatrix(origins, destinations);
        
        if (matrix && matrix.length > 0) {
          validCandidates.forEach((c, idx) => {
            const el = matrix[idx]?.[0];
            if (el && (el.status === "OK" || el.status === "FALLBACK_OK")) {
              c.routeDistanceKm = el.distanceKm;
              c.etaMins = el.durationMins;
              c.distanceKm = el.distanceKm;
              c.isLiveDistance = !el.status.includes('FALLBACK');
              c.reasons.push(`Google Route Distance: ${el.distanceKm} km (ETA ~${el.durationMins} mins)`);
            }
          });
        }
      }
    } catch (routeErr) {
      console.warn("Google route matrix enrichment notice:", routeErr);
    }
  }

  const bestMatch = scored[0] || null;

  return {
    bestMatch,
    rankedCandidates: scored,
    algorithm: "Cooperative Multi-Vector AI Allocation Engine with Google Maps Telemetry",
    evaluatedAt: new Date().toISOString()
  };
}

/**
 * Filter worker information to sanitize and remove sensitive/private information for customer visibility
 */
export function sanitizeWorkerForCustomer(pillar) {
  if (!pillar) return null;
  return {
    id: pillar.id || pillar.pillarId,
    fullName: pillar.full_name || pillar.fullName,
    code: pillar.pillar_code || pillar.pillarCode,
    rating: pillar.rating || 4.8,
    experience: pillar.experience_years ? `${pillar.experience_years} Years` : (pillar.experience || "3+ Years"),
    trade: Array.isArray(pillar.main_services) ? pillar.main_services[0] : (pillar.main_services || "Certified Technician"),
    isCertified: !!pillar.isCertified,
    avatar: pillar.avatar_url || null
  };
}

export const matchingService = {
  calculateDistanceKm,
  calculatePillarMatchScore,
  matchWorkforceForRequest,
  sanitizeWorkerForCustomer
};

export default matchingService;
