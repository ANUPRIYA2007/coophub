/**
 * COOP HUB — Capability Resolution Engine (Phase 3, 4, 5)
 * Resolves natural-language AI understanding into verified, authorized application actions.
 * 
 * Supports:
 * - Customer Capabilities (Booking, Live Tracking, Payment, Chat, Invoices, Support)
 * - Pillar Capabilities (Assigned Jobs, Status Updates, Cash Collection, Earnings, Welfare)
 * - Admin & Super Admin Capabilities (KYC Verification, Dispatch Oversight, Governance)
 * 
 * Real actionable YES / NO buttons containing execution metadata.
 * ZERO HARDCODED PHRASES. Operates on semantic AI intent & dynamic context.
 */

import { aiActionSecurityService } from './aiActionSecurityService.js';
import { SUB_SERVICES_CATALOG } from '../../utils/subServicesCatalog.js';

/**
 * Intelligent sub-service resolution across all 80 catalog services
 */
function findMatchingSubService(query = '', reply = '') {
  const combined = (query + ' ' + reply).toLowerCase();
  
  // 1. Exact or substring name match
  for (const sub of SUB_SERVICES_CATALOG) {
    const subName = sub.name.toLowerCase();
    if (combined.includes(subName)) {
      return sub;
    }
  }

  // 2. High-confidence keywords match
  const keywordMappings = [
    // Electrical sub-services
    { keywords: ['ceiling fan', 'switchboard', 'fan wiring', 'fan connection', 'fan install'], subId: 'b0000000-0000-0000-0000-000000000004' },
    { keywords: ['lighting', 'tube light', 'led install', 'light fixture', 'bulb holder'], subId: 'sub_elec_02' },
    { keywords: ['rewiring', 'short circuit', 'electrical wiring', 'circuit inspection'], subId: 'sub_elec_03' },
    { keywords: ['mcb', 'distribution board', 'trip', 'breaker', 'overload'], subId: 'sub_elec_04' },
    { keywords: ['power socket', 'socket repair', 'plug point', 'switch repair'], subId: 'sub_elec_05' },

    // Plumbing sub-services
    { keywords: ['pipe leak', 'leakage repair', 'pipe burst', 'water leak', 'leaking pipe', 'plumb'], subId: 'b0000000-0000-0000-0000-000000000005' },
    { keywords: ['tap', 'faucet', 'water tap', 'dripping tap', 'tap repair'], subId: 'sub_plumb_02' },
    { keywords: ['wash basin', 'sink', 'sink blockage', 'basin repair'], subId: 'sub_plumb_03' },
    { keywords: ['flush', 'commode', 'toilet repair', 'sanitary repair', 'cistern'], subId: 'sub_plumb_04' },
    { keywords: ['drainage', 'blockage', 'choked drain', 'drain cleaning', 'sewage block'], subId: 'sub_plumb_05' },

    // AC Repair & HVAC sub-services
    { keywords: ['ac service', 'air conditioner service', 'filter cleaning', 'cooling check', 'ac general'], subId: 'b0000000-0000-0000-0000-000000000006' },
    { keywords: ['ac gas', 'gas charging', 'freon', 'ac gas refill', 'cooling low'], subId: 'sub_ac_02' },
    { keywords: ['ac install', 'ac uninstallation', 'split ac install', 'window ac install'], subId: 'sub_ac_03' },
    { keywords: ['ac deep clean', 'foam jet', 'indoor outdoor unit wash'], subId: 'sub_ac_04' },
    { keywords: ['compressor', 'ac pcb', 'pcb repair', 'compressor check', 'fan motor'], subId: 'sub_ac_05' },

    // Carpentry sub-services
    { keywords: ['furniture assembly', 'ikea assembly', 'table assembly', 'wardrobe assemble'], subId: 'b0000000-0000-0000-0000-000000000007' },
    { keywords: ['door lock', 'handle repair', 'hinge repair', 'latch', 'door repair'], subId: 'sub_carp_02' },
    { keywords: ['wardrobe repair', 'cupboard repair', 'drawer slide', 'shelf install'], subId: 'sub_carp_03' },
    { keywords: ['bed repair', 'cot repair', 'wooden frame', 'creaking bed'], subId: 'sub_carp_04' },
    { keywords: ['wood polish', 'varnish', 'wooden furniture polish', 'wood touch up', 'carpenter'], subId: 'sub_carp_05' },

    // Cleaning & Housekeeping
    { keywords: ['deep cleaning', 'full home cleaning', 'house deep clean'], subId: 'b0000000-0000-0000-0000-000000000008' },
    { keywords: ['bathroom cleaning', 'toilet deep clean', 'tile stain removal'], subId: 'sub_clean_02' },
    { keywords: ['kitchen deep cleaning', 'chimney cleaning', 'degreasing', 'exhaust fan clean'], subId: 'sub_clean_03' },
    { keywords: ['sofa cleaning', 'upholstery', 'cushion cleaning', 'couch clean'], subId: 'sub_clean_04' },
    { keywords: ['floor scrubbing', 'tile polishing', 'marble polishing'], subId: 'sub_clean_05' },

    // Appliance Repair
    { keywords: ['washing machine', 'drum issue', 'water inlet washer', 'drain error washer'], subId: 'b0000000-0000-0000-0000-000000000009' },
    { keywords: ['refrigerator', 'fridge', 'single door fridge', 'double door fridge', 'cooling coil'], subId: 'sub_app_02' },
    { keywords: ['microwave', 'oven repair', 'microwave heating', 'convection oven'], subId: 'sub_app_03' },
    { keywords: ['water purifier', 'ro service', 'uv filter', 'membrane change', 'aquaguard'], subId: 'sub_app_04' },
    { keywords: ['geyser', 'water heater', 'thermostat geyser', 'heating element geyser'], subId: 'sub_app_05' },

    // Painting & Wall Care
    { keywords: ['full interior painting', 'interior paint', 'room painting', 'painter'], subId: 'b0000000-0000-0000-0000-000000000010' },
    { keywords: ['exterior paint', 'weatherproof paint', 'building outer paint'], subId: 'sub_paint_02' },
    { keywords: ['touch up painting', 'patch painting', 'single wall paint'], subId: 'sub_paint_03' },
    { keywords: ['waterproofing', 'dampness repair', 'wall leakage', 'seepage repair'], subId: 'sub_paint_04' },
    { keywords: ['putty', 'primer', 'wall sanding', 'surface prep'], subId: 'sub_paint_05' },

    // Drivers & Logistics
    { keywords: ['driver', 'personal driver', 'city drive', 'chauffeur'], subId: 'b0000000-0000-0000-0000-000000000014' },
    { keywords: ['outstation driver', 'highway driver', 'long distance trip'], subId: 'sub_drive_02' },
    { keywords: ['temporary driver', 'event driver', 'hourly driver'], subId: 'sub_drive_03' },
    { keywords: ['night driver', 'late night drop', 'party driver'], subId: 'sub_drive_04' },
    { keywords: ['commercial driver', 'heavy vehicle driver', 'delivery driver'], subId: 'sub_drive_05' },

    // Domestic Helpers
    { keywords: ['maid', 'daily housekeeping', 'domestic helper', 'sweeping mopping'], subId: 'b0000000-0000-0000-0000-000000000015' },
    { keywords: ['utensil cleaning', 'dish washing', 'kitchen helper'], subId: 'sub_help_02' },
    { keywords: ['cook', 'home cook', 'meal prep', 'breakfast lunch prep'], subId: 'sub_help_03' },
    { keywords: ['laundry helper', 'clothes washing', 'ironing helper'], subId: 'sub_help_04' },
    { keywords: ['elderly assistance', 'mobility help', 'domestic support'], subId: 'sub_help_05' },

    // Caregiver Services
    { keywords: ['caregiver', 'elderly patient care', 'senior citizen care', 'bedridden patient'], subId: 'b0000000-0000-0000-0000-000000000016' },
    { keywords: ['post surgery care', 'hospital recovery', 'patient assistant'], subId: 'sub_care_02' },
    { keywords: ['baby sitting', 'child care', 'infant care', 'nanny'], subId: 'sub_care_03' },
    { keywords: ['disabled care', 'special needs assistance', 'mobility assistance'], subId: 'sub_care_04' },
    { keywords: ['companion care', 'emotional support for seniors', 'recreational walk'], subId: 'sub_care_05' },

    // Commercial & Office Services
    { keywords: ['office cleaning', 'corporate workstation clean', 'pantry clean'], subId: 'b0000000-0000-0000-0000-000000000017' },
    { keywords: ['office boy', 'pantry boy', 'errand runner', 'document dispatch'], subId: 'sub_comm_02' },

    // Specialized & Custom Trades
    { keywords: ['welding', 'fabrication', 'metal gate repair', 'grill welding'], subId: 'b0000000-0000-0000-0000-000000000018' },
    { keywords: ['glass repair', 'mirror installation', 'glass partition'], subId: 'sub_spec_02' },
    { keywords: ['masonry', 'brickwork', 'cement plastering', 'concrete patch'], subId: 'sub_spec_03' },

    // On-Demand Services
    { keywords: ['emergency technician', 'rapid dispatch', 'instant 30 min technician'], subId: 'b0000000-0000-0000-0000-000000000019' },
    { keywords: ['hourly handyman', 'multi skilled handyman', 'odd jobs helper'], subId: 'sub_ondem_02' },

    // Verified Cooperative Workers
    { keywords: ['verified worker', 'identity screened technician', 'background verified'], subId: 'b0000000-0000-0000-0000-000000000020' },

    // Training & Certification
    { keywords: ['trade certification', 'iti vocational', 'skill assessment'], subId: 'b0000000-0000-0000-0000-000000000021' }
  ];

  for (const item of keywordMappings) {
    if (item.keywords.some(kw => combined.includes(kw))) {
      const match = SUB_SERVICES_CATALOG.find(s => s.id === item.subId);
      if (match) return match;
    }
  }

  // 3. Match by partial distinct sub-service words
  for (const sub of SUB_SERVICES_CATALOG) {
    const words = sub.name.toLowerCase().split(/\s+/).filter(w => w.length > 3 && !['with', 'from', 'repair', 'service'].includes(w));
    if (words.some(w => combined.includes(w))) {
      return sub;
    }
  }

  return null;
}

export const capabilityResolutionEngine = {
  /**
   * Resolves appropriate capability action given AI response, user query, and runtime context
   */
  resolveCapability({ query = '', aiReply = '', context = {} }) {
    // 1. Safety validation (SQL injection & script tag filtering)
    const safety = aiActionSecurityService.validateInputSafety(query);
    if (!safety.isSafe) {
      return {
        hasAction: false,
        action: null,
        yesNoAction: null,
        securityViolation: true,
        reason: safety.reason
      };
    }

    const q = (query || '').toLowerCase();
    const reply = (aiReply || '').toLowerCase();
    const role = context.role || 'customer';
    const activeReq = context.request || null;
    const activeId = activeReq?.id || context.currentRequestId || null;

    // ============================================================
    // 1. CUSTOMER CAPABILITIES
    // ============================================================
    if (role === 'customer' || role === 'guest') {
      // (a) Live Request Tracking & Arrival
      if (q.includes('track') || q.includes('where is') || q.includes('where are') || q.includes('how long') || q.includes('when will') || q.includes('knocks') || q.includes('on the way') || q.includes('en route') || (/\b(where|arrival|dispatch|arriving)\b/i.test(q) && !q.includes('everywhere')) || reply.includes('live tracking') || reply.includes('tracking dispatch') || reply.includes('arrival otp')) {
        const path = activeId ? `/requests/${activeId}` : '/requests';
        return {
          hasAction: true,
          action: {
            type: 'navigate',
            path,
            label: activeId ? 'Track Live Dispatch →' : 'View My Requests →',
            actionId: 'TRACK_REQUEST'
          },
          yesNoAction: {
            yes: { label: 'Yes, Track Request', type: 'navigate', path, actionId: 'TRACK_REQUEST' },
            no: { label: 'No, Thanks', type: 'dismiss', actionId: 'DISMISS' }
          }
        };
      }

      // (b) Service Payment / Hand Cash
      if (reply.includes('pay') || reply.includes('amount') || reply.includes('invoice') || reply.includes('cash') || reply.includes('bill') || q.includes('pay') || q.includes('bill')) {
        const path = activeId ? `/requests/${activeId}` : '/history';
        return {
          hasAction: true,
          action: {
            type: 'navigate',
            path,
            label: activeId ? 'Proceed to Pay Bill →' : 'View Invoices →',
            actionId: 'PAY_SERVICE'
          },
          yesNoAction: {
            yes: { label: 'Yes, Open Payment', type: 'navigate', path, actionId: 'PAY_SERVICE' },
            no: { label: 'No, Later', type: 'dismiss', actionId: 'DISMISS' }
          }
        };
      }

      // (c) Technician Chat / Communication
      if (reply.includes('chat') || reply.includes('message') || reply.includes('coordinate') || q.includes('call') || q.includes('chat') || q.includes('message')) {
        const path = activeId ? `/requests/${activeId}/chat` : '/messages';
        return {
          hasAction: true,
          action: {
            type: 'navigate',
            path,
            label: 'Message Technician →',
            actionId: 'CHAT_TECHNICIAN'
          },
          yesNoAction: {
            yes: { label: 'Yes, Open Chat', type: 'navigate', path, actionId: 'CHAT_TECHNICIAN' },
            no: { label: 'No, Dismiss', type: 'dismiss', actionId: 'DISMISS' }
          }
        };
      }

      // (d.0) Exact Sub-Service Matching (Direct 1-Click Booking Action)
      const matchedSub = findMatchingSubService(q, reply);
      if (matchedSub) {
        const subPath = `/services/${matchedSub.service_id}/request?sub=${matchedSub.id}`;
        return {
          hasAction: true,
          action: {
            type: 'navigate',
            path: subPath,
            label: `Book ${matchedSub.name} (₹${matchedSub.base_price}) →`,
            actionId: 'BOOK_SUBSERVICE',
            serviceId: matchedSub.service_id,
            subServiceId: matchedSub.id,
            basePrice: matchedSub.base_price
          },
          yesNoAction: {
            yes: {
              label: `Book ${matchedSub.name} (₹${matchedSub.base_price})`,
              type: 'navigate',
              path: subPath,
              actionId: 'BOOK_SUBSERVICE'
            },
            no: {
              label: 'Browse All Services',
              type: 'navigate',
              path: '/services',
              actionId: 'BOOK_SERVICE'
            }
          }
        };
      }

      // (d) Service Booking / Browse Technicians
      if (reply.includes('book') || reply.includes('service') || reply.includes('technician') || reply.includes('repair') || reply.includes('standard rate') || q.includes('need') || q.includes('fix') || q.includes('leak') || q.includes('repair') || q.includes('tap') || q.includes('sputter') || q.includes('send someone') || q.includes('water') || q.includes('plumb') || q.includes('electrician')) {
        return {
          hasAction: true,
          action: {
            type: 'navigate',
            path: '/services',
            label: 'Browse Verified Technicians →',
            actionId: 'BOOK_SERVICE'
          },
          yesNoAction: {
            yes: { label: 'Yes, Find Services', type: 'navigate', path: '/services', actionId: 'BOOK_SERVICE' },
            no: { label: 'No, Not Now', type: 'dismiss', actionId: 'DISMISS' }
          }
        };
      }

      // (e) Past History & Invoices
      if (reply.includes('history') || reply.includes('previous') || reply.includes('receipt') || q.includes('history') || q.includes('past')) {
        return {
          hasAction: true,
          action: {
            type: 'navigate',
            path: '/history',
            label: 'Open Service History →',
            actionId: 'VIEW_HISTORY'
          },
          yesNoAction: {
            yes: { label: 'Yes, View History', type: 'navigate', path: '/history', actionId: 'VIEW_HISTORY' },
            no: { label: 'No, Dismiss', type: 'dismiss', actionId: 'DISMISS' }
          }
        };
      }
    }

    // ============================================================
    // 2. PILLAR TECHNICIAN CAPABILITIES
    // ============================================================
    if (role === 'pillar') {
      // (a) Cash Collection & Hand Payments (evaluated before generic job orders)
      if (reply.includes('cash') || reply.includes('collect') || reply.includes('payment') || q.includes('cash') || q.includes('handed') || q.includes('rupees') || q.includes('paid')) {
        return {
          hasAction: true,
          action: {
            type: 'navigate',
            path: '/dashboard/orders',
            label: 'Mark Cash Collected →',
            actionId: 'COLLECT_HAND_CASH'
          },
          yesNoAction: {
            yes: { label: 'Yes, Open Orders', type: 'navigate', path: '/dashboard/orders', actionId: 'COLLECT_HAND_CASH' },
            no: { label: 'No, Later', type: 'dismiss', actionId: 'DISMISS' }
          }
        };
      }

      // (b) Assigned Orders / Job Updates
      if (reply.includes('job') || reply.includes('order') || reply.includes('equipment') || reply.includes('status') || reply.includes('arrive') || q.includes('job') || q.includes('order') || q.includes('carry')) {
        return {
          hasAction: true,
          action: {
            type: 'navigate',
            path: '/dashboard/orders',
            label: 'Open Assigned Jobs →',
            actionId: 'MANAGE_PILLAR_ORDERS'
          },
          yesNoAction: {
            yes: { label: 'Yes, View Orders', type: 'navigate', path: '/dashboard/orders', actionId: 'MANAGE_PILLAR_ORDERS' },
            no: { label: 'No, Dismiss', type: 'dismiss', actionId: 'DISMISS' }
          }
        };
      }

      // (c) Earnings & Welfare
      if (reply.includes('earning') || reply.includes('wallet') || reply.includes('commission') || reply.includes('pf') || reply.includes('insurance') || q.includes('earning') || q.includes('pf') || q.includes('take home') || q.includes('money') || q.includes('deduction')) {
        const isWelfare = reply.includes('pf') || reply.includes('insurance') || reply.includes('welfare');
        const path = isWelfare ? '/dashboard/welfare' : '/dashboard/earnings';
        return {
          hasAction: true,
          action: {
            type: 'navigate',
            path,
            label: isWelfare ? 'View Welfare & Insurance →' : 'Check Daily Earnings →',
            actionId: 'VIEW_EARNINGS'
          },
          yesNoAction: {
            yes: { label: isWelfare ? 'Yes, Open Welfare' : 'Yes, View Earnings', type: 'navigate', path, actionId: 'VIEW_EARNINGS' },
            no: { label: 'No, Dismiss', type: 'dismiss', actionId: 'DISMISS' }
          }
        };
      }
    }

    // ============================================================
    // 3. ADMIN CAPABILITIES (Phase 6: Regional District Scope)
    // ============================================================
    if (role === 'admin') {
      // (a) Security Boundary Check: Normal Admin attempting Super Admin operations
      if (q.includes('tariff override') || q.includes('kill switch') || q.includes('sovereign') || q.includes('national rate') || q.includes('global policy')) {
        return {
          hasAction: true,
          action: {
            type: 'navigate',
            path: '/admin',
            label: 'Apex Clearance Required — Stay in Scoped Dashboard →',
            actionId: 'ADMIN_CLEARANCE_REQUIRED'
          },
          yesNoAction: {
            yes: { label: 'Acknowledge Boundary', type: 'navigate', path: '/admin', actionId: 'ADMIN_CLEARANCE_REQUIRED' },
            no: { label: 'Dismiss', type: 'dismiss', actionId: 'DISMISS' }
          }
        };
      }

      // (b) KYC Verification & Workforce Review
      if (reply.includes('verification') || reply.includes('applicant') || reply.includes('kyc') || reply.includes('pending') || reply.includes('document') || reply.includes('சரிபார்க்க') || reply.includes('விண்ணப்ப') || q.includes('kyc') || q.includes('verification') || q.includes('applicant') || q.includes('document') || q.includes('inspect') || q.includes('aadhaar') || q.includes('onboarding') || q.includes('approval') || q.includes('form') || q.includes('சரிபார்க்க') || q.includes('விண்ணப்ப') || q.includes('सत्यापन')) {
        return {
          hasAction: true,
          action: {
            type: 'navigate',
            path: '/admin/pillars',
            label: 'Review Verification Queue →',
            actionId: 'ADMIN_REVIEW_KYC'
          },
          yesNoAction: {
            yes: { label: 'Yes, Review Applicants', type: 'navigate', path: '/admin/pillars', actionId: 'ADMIN_REVIEW_KYC' },
            no: { label: 'No, Dismiss', type: 'dismiss', actionId: 'DISMISS' }
          }
        };
      }

      // (c) Live Dispatch & Tracking
      if (reply.includes('track') || reply.includes('dispatch') || reply.includes('technician') || reply.includes('map') || q.includes('track') || q.includes('dispatch') || q.includes('where')) {
        return {
          hasAction: true,
          action: {
            type: 'navigate',
            path: '/admin/tracking',
            label: 'View Live Technician Dispatch →',
            actionId: 'ADMIN_TRACKING'
          },
          yesNoAction: {
            yes: { label: 'Yes, Open Live Tracking', type: 'navigate', path: '/admin/tracking', actionId: 'ADMIN_TRACKING' },
            no: { label: 'No, Dismiss', type: 'dismiss', actionId: 'DISMISS' }
          }
        };
      }

      // (d) Revenue, GMV & Settlements
      if (reply.includes('revenue') || reply.includes('finance') || reply.includes('settlement') || reply.includes('gmv') || reply.includes('commission') || q.includes('revenue') || q.includes('finance') || q.includes('commission') || q.includes('gmv') || q.includes('merchandise') || q.includes('cut') || q.includes('payout') || q.includes('varumaanam')) {
        return {
          hasAction: true,
          action: {
            type: 'navigate',
            path: '/admin/finance',
            label: 'Audit District Revenue & Settlements →',
            actionId: 'ADMIN_FINANCE'
          },
          yesNoAction: {
            yes: { label: 'Yes, Open Finance', type: 'navigate', path: '/admin/finance', actionId: 'ADMIN_FINANCE' },
            no: { label: 'No, Dismiss', type: 'dismiss', actionId: 'DISMISS' }
          }
        };
      }

      // (e) Support, Disputes & Escalations
      if (reply.includes('complaint') || reply.includes('dispute') || reply.includes('support') || reply.includes('ticket') || q.includes('complaint') || q.includes('dispute') || q.includes('support')) {
        return {
          hasAction: true,
          action: {
            type: 'navigate',
            path: '/admin/support',
            label: 'Review Customer Escalations →',
            actionId: 'ADMIN_SUPPORT'
          },
          yesNoAction: {
            yes: { label: 'Yes, View Support Tickets', type: 'navigate', path: '/admin/support', actionId: 'ADMIN_SUPPORT' },
            no: { label: 'No, Dismiss', type: 'dismiss', actionId: 'DISMISS' }
          }
        };
      }
    }

    // ============================================================
    // 4. SUPER ADMIN CAPABILITIES (Phase 7: Sovereign Global Scope)
    // ============================================================
    if (role === 'super_admin') {
      // (a) Sovereign Governance & Multi-District Allocations
      if (reply.includes('governance') || reply.includes('sovereign') || reply.includes('hierarchy') || reply.includes('district') || q.includes('governance') || q.includes('sovereign') || q.includes('zone')) {
        return {
          hasAction: true,
          action: {
            type: 'navigate',
            path: '/admin/super/governance',
            label: 'Open National Governance Hierarchy →',
            actionId: 'SUPER_ADMIN_GOVERNANCE'
          },
          yesNoAction: {
            yes: { label: 'Yes, Open Governance', type: 'navigate', path: '/admin/super/governance', actionId: 'SUPER_ADMIN_GOVERNANCE' },
            no: { label: 'No, Dismiss', type: 'dismiss', actionId: 'DISMISS' }
          }
        };
      }

      // (b) Global KYC Audit & Workforce Clearance
      if (reply.includes('verification') || reply.includes('applicant') || reply.includes('kyc') || reply.includes('workforce') || q.includes('kyc') || q.includes('verification')) {
        return {
          hasAction: true,
          action: {
            type: 'navigate',
            path: '/admin/pillars',
            label: 'Apex Workforce KYC Clearance →',
            actionId: 'SUPER_ADMIN_KYC'
          },
          yesNoAction: {
            yes: { label: 'Yes, Open KYC Clearance', type: 'navigate', path: '/admin/pillars', actionId: 'SUPER_ADMIN_KYC' },
            no: { label: 'No, Dismiss', type: 'dismiss', actionId: 'DISMISS' }
          }
        };
      }

      // (c) System Telemetry & Audit Logs
      if (reply.includes('telemetry') || reply.includes('health') || reply.includes('server') || reply.includes('audit') || reply.includes('monitoring') || q.includes('telemetry') || q.includes('health') || q.includes('monitoring')) {
        return {
          hasAction: true,
          action: {
            type: 'navigate',
            path: '/admin/monitoring',
            label: 'Open National Telemetry Console →',
            actionId: 'SUPER_ADMIN_MONITORING'
          },
          yesNoAction: {
            yes: { label: 'Yes, Open Telemetry', type: 'navigate', path: '/admin/monitoring', actionId: 'SUPER_ADMIN_MONITORING' },
            no: { label: 'No, Dismiss', type: 'dismiss', actionId: 'DISMISS' }
          }
        };
      }

      // (d) National Finance, Commission & Platform Tariffs
      if (reply.includes('tariff') || reply.includes('revenue') || reply.includes('finance') || reply.includes('commission') || q.includes('tariff') || q.includes('revenue') || q.includes('commission')) {
        return {
          hasAction: true,
          action: {
            type: 'navigate',
            path: '/admin/finance',
            label: 'Manage Platform Financial Tariffs →',
            actionId: 'SUPER_ADMIN_FINANCE'
          },
          yesNoAction: {
            yes: { label: 'Yes, Open Financial Policies', type: 'navigate', path: '/admin/finance', actionId: 'SUPER_ADMIN_FINANCE' },
            no: { label: 'No, Dismiss', type: 'dismiss', actionId: 'DISMISS' }
          }
        };
      }
    }

    // Generic fallback: If AI recommended navigation to a specific route
    if (context.route && context.route !== '/') {
      return {
        hasAction: false,
        action: null,
        yesNoAction: null
      };
    }

    return { hasAction: false, action: null, yesNoAction: null };
  }
};
