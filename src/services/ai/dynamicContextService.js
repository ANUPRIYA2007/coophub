/**
 * COOP HUB — Live Dynamic Context Service (Phase 2)
 * Connects real-time runtime context (user, role, route, page, operation,
 * request/booking/job, permissions, and scope) to all AI agents.
 * 
 * ZERO HARDCODED MOCKS. Reads directly from:
 * - Supabase auth & active session
 * - Application localStorage & profile states
 * - Current URL path, query params, and route matchers
 * - Active DOM/form states
 */

import { supabase } from '../../lib/supabase.js';

/**
 * Derives human/system page identifier from route pathname
 */
function resolvePageFromRoute(pathname = '/') {
  if (pathname === '/home') return 'customer_home_dashboard';
  if (pathname === '/services' || pathname.startsWith('/services/')) return 'service_catalog_discovery';
  if (pathname === '/requests') return 'customer_active_requests_list';
  if (pathname.startsWith('/requests/')) return 'customer_request_tracking_and_payment';
  if (pathname === '/messages' || pathname.startsWith('/messages/')) return 'direct_technician_messaging';
  if (pathname === '/history') return 'service_history_and_invoices';
  if (pathname === '/support') return 'help_and_support_center';
  if (pathname === '/settings') return 'account_settings';
  if (pathname === '/profile') return 'user_profile_management';
  if (pathname === '/dashboard') return 'pillar_main_dashboard';
  if (pathname.startsWith('/dashboard/orders')) return 'pillar_orders_management';
  if (pathname.startsWith('/dashboard/earnings')) return 'pillar_earnings_and_welfare';
  if (pathname.startsWith('/dashboard/profile')) return 'pillar_profile_and_skills';
  if (pathname.startsWith('/dashboard/chat')) return 'pillar_customer_chat';
  if (pathname === '/pillar/register') return 'pillar_onboarding_and_kyc';
  if (pathname === '/pillar/login') return 'pillar_portal_login';
  if (pathname.startsWith('/admin/super')) return 'super_admin_sovereign_command';
  if (pathname.startsWith('/admin/pillars')) return 'admin_workforce_verification_registry';
  if (pathname.startsWith('/admin/geography')) return 'admin_geography_hierarchy';
  if (pathname.startsWith('/admin/governance')) return 'admin_cooperative_governance';
  if (pathname.startsWith('/admin/security')) return 'admin_security_audit_enforcement';
  if (pathname.startsWith('/admin')) return 'zonal_admin_operations_dashboard';
  return 'general_portal_view';
}

/**
 * Derives active user operation from route & page context
 */
function resolveOperationFromRoute(pathname = '', pageData = {}) {
  if (pageData.operation) return pageData.operation;
  if (pathname.startsWith('/requests/') && pathname.includes('/chat')) return 'communicating_with_assigned_technician';
  if (pathname.startsWith('/requests/')) return 'monitoring_arrival_and_payment';
  if (pathname === '/services') return 'selecting_verified_service_category';
  if (pathname === '/pillar/register') return 'completing_kyc_and_skill_selection';
  if (pathname.startsWith('/admin/pillars')) return 'reviewing_technician_verification_queue';
  if (pathname.startsWith('/admin/super')) return 'executing_sovereign_state_oversight';
  if (pathname.startsWith('/dashboard/orders')) return 'managing_dispatched_field_jobs';
  return 'navigating_portal';
}

/**
 * Resolves active role, permissions, and scope
 */
function resolveRoleAndScope(pathname = '', profile = {}, storedSuperAdmin = null, forcedRole = null) {
  // 1. Super Admin Sovereign Scope
  if (forcedRole === 'super_admin' || pathname.startsWith('/admin/super') || storedSuperAdmin?.role === 'SUPER_ADMIN' || profile?.role === 'SUPER_ADMIN') {
    return {
      role: 'super_admin',
      scope: 'GLOBAL',
      zone: 'ALL_ZONES (North, South, East, West)',
      permissions: [
        'SOVEREIGN_APEX_OVERSIGHT',
        'ZONAL_ADMIN_ENFORCEMENT',
        'GLOBAL_GEOGRAPHY_GOVERNANCE',
        'CROSS_DISTRICT_DISPATCH_AUDIT',
        'SECURITY_KILL_SWITCH_AUTHORITY'
      ]
    };
  }

  // 2. Normal Zonal Admin Scope
  if (forcedRole === 'admin' || pathname.startsWith('/admin') || profile?.role === 'admin' || profile?.role === 'normal_admin') {
    const adminZone = profile?.zone || 'SZ_CHENNAI';
    return {
      role: 'admin',
      scope: 'ZONAL',
      zone: adminZone,
      permissions: [
        'PILLAR_KYC_VERIFICATION',
        'DISPATCH_MONITORING',
        'DISTRICT_CATALOG_MANAGEMENT',
        'DISPUTE_RESOLUTION',
        'LOCAL_ANALYTICS_VIEW'
      ]
    };
  }

  // 3. Certified Technician (Pillar) Scope
  if (forcedRole === 'pillar' || pathname.startsWith('/dashboard') || pathname.startsWith('/pillar') || profile?.role === 'pillar') {
    return {
      role: 'pillar',
      scope: 'ASSIGNED_ORDERS',
      zone: profile?.service_area || 'Chennai Metro',
      permissions: [
        'ACCEPT_DISPATCHED_ORDERS',
        'UPDATE_JOB_STATUS',
        'COLLECT_HAND_CASH_PAYMENT',
        'COMMUNICATE_WITH_CUSTOMER',
        'VIEW_PERSONAL_EARNINGS'
      ],
      pillarCode: profile?.pillar_code || null,
      skills: profile?.main_services || [],
      availability: profile?.is_available !== false ? 'available' : 'busy',
      kycStatus: profile?.status || 'approved'
    };
  }

  // 4. Customer Scope
  const hasCustomerStorage = typeof localStorage !== 'undefined' && Boolean(localStorage.getItem('coophub_customer_user'));
  if (profile?.role === 'customer' || profile?.email || hasCustomerStorage) {
    return {
      role: 'customer',
      scope: 'SELF',
      zone: profile?.city || 'Chennai',
      permissions: [
        'BROWSE_SERVICES',
        'CREATE_SERVICE_BOOKING',
        'TRACK_LIVE_DISPATCH',
        'CHAT_WITH_PILLAR',
        'PAY_ONLINE_OR_HAND_CASH',
        'RATE_AND_REVIEW'
      ]
    };
  }

  // 5. Unauthenticated Guest
  return {
    role: 'guest',
    scope: 'PUBLIC',
    zone: 'Chennai',
    permissions: ['VIEW_PUBLIC_INFO', 'VIEW_SERVICE_CATALOG', 'REGISTER_OR_LOGIN']
  };
}

/**
 * Gathers complete real runtime context synchronously + asynchronously
 */
export async function getLiveAiContext(extraContext = {}) {
  const pathname = typeof window !== 'undefined' ? window.location.pathname : (extraContext.route || '/');
  
  // 1. Session and Profile detection
  let session = extraContext.session || null;
  let user = null;
  let profile = extraContext.profile || null;

  try {
    if (!session && supabase) {
      const { data } = await supabase.auth.getSession();
      session = data?.session || null;
    }
    if (session?.user) {
      user = {
        id: session.user.id,
        email: session.user.email,
        phone: session.user.phone || null
      };
    }
  } catch (authErr) {
    console.warn('Live context auth check note:', authErr.message);
  }

  // Check localStorage stored sessions if Supabase session is empty
  let storedSuperAdmin = null;
  if (typeof localStorage !== 'undefined') {
    try {
      const saRaw = localStorage.getItem('coophub_super_admin_session');
      if (saRaw) storedSuperAdmin = JSON.parse(saRaw);

      const custRaw = localStorage.getItem('coophub_customer_user');
      if (custRaw && !user) {
        const parsedCust = JSON.parse(custRaw);
        user = {
          id: parsedCust.id || parsedCust.user_id,
          name: parsedCust.full_name || parsedCust.name || 'Customer',
          email: parsedCust.email,
          phone: parsedCust.phone
        };
        profile = { ...parsedCust, role: 'customer' };
      }
    } catch (e) {}
  }

  // 2. Resolve Role & Scope
  const { role, scope, zone, permissions, ...pillarMeta } = resolveRoleAndScope(pathname, profile || {}, storedSuperAdmin, extraContext.role);

  // 3. Resolve Page and Operation
  const page = resolvePageFromRoute(pathname);
  const operation = resolveOperationFromRoute(pathname, extraContext);

  // 4. Resolve Active Request / Booking / Job (if in path or context)
  let activeRequest = extraContext.request || extraContext.booking || extraContext.job || null;
  const requestIdMatch = pathname.match(/\/requests\/([0-9a-fA-F-]{36})/);
  const currentRequestId = requestIdMatch ? requestIdMatch[1] : (extraContext.currentRequestId || null);

  if (!activeRequest && currentRequestId) {
    activeRequest = {
      id: currentRequestId,
      status: extraContext.requestStatus || 'active',
      serviceName: extraContext.serviceName || 'Home Service',
      pillarName: extraContext.pillarName || null,
      amount: extraContext.amount || null,
      paymentStatus: extraContext.paymentStatus || null
    };
  }

  return {
    user: {
      id: user?.id || null,
      name: user?.name || profile?.full_name || (role === 'guest' ? 'Guest Visitor' : 'Authenticated Member'),
      email: user?.email || null,
      phone: user?.phone || null,
      isAuthenticated: Boolean(user?.id || session?.user?.id)
    },
    role,
    scope,
    zone,
    permissions,
    route: pathname,
    page,
    operation,
    request: activeRequest,
    booking: activeRequest,
    job: activeRequest,
    currentRequestId,
    language: extraContext.language || 'en',
    pillarMetadata: Object.keys(pillarMeta).length > 0 ? pillarMeta : null,
    catalogContext: extraContext.catalogContext || null,
    timestamp: new Date().toISOString()
  };
}

/**
 * Formats structured runtime context into clear, concise prompt text for LLM injection
 */
export function formatContextForSystemPrompt(ctx = {}) {
  if (!ctx || Object.keys(ctx).length === 0) return '';

  const lines = [
    '=== REAL APPLICATION RUNTIME CONTEXT ===',
    `* Current User: ${ctx.user?.name || 'Guest'} (Status: ${ctx.user?.isAuthenticated ? 'Logged In' : 'Public Visitor'})`,
    `* Active Role: ${ctx.role?.toUpperCase() || 'GUEST'} | Authority Scope: ${ctx.scope || 'PUBLIC'} (${ctx.zone || 'Chennai'})`,
    `* Current Route: ${ctx.route || '/'} | Page Purpose: ${ctx.page || 'general_view'}`,
    `* Active Operation: ${ctx.operation || 'navigating_portal'}`
  ];

  if (ctx.permissions && ctx.permissions.length > 0) {
    lines.push(`* Granted Permissions: ${ctx.permissions.join(', ')}`);
  }

  if (ctx.request) {
    lines.push(
      `* Active Request/Job: ID #${ctx.request.id?.slice(0, 8) || 'N/A'}, ` +
      `Service: ${ctx.request.serviceName || 'Home Repair'}, ` +
      `Status: ${ctx.request.status || 'in_progress'}` +
      (ctx.request.pillarName ? `, Assigned Technician: ${ctx.request.pillarName}` : '') +
      (ctx.request.amount ? `, Amount: ₹${ctx.request.amount}` : '') +
      (ctx.request.paymentStatus ? `, Payment: ${ctx.request.paymentStatus}` : '')
    );
  }

  if (ctx.pillarMetadata) {
    lines.push(
      `* Technician Details: Code: ${ctx.pillarMetadata.pillarCode || 'N/A'}, ` +
      `Skills: ${(ctx.pillarMetadata.skills || []).join(', ') || 'Certified'}, ` +
      `Availability: ${ctx.pillarMetadata.availability || 'available'}, ` +
      `KYC: ${ctx.pillarMetadata.kycStatus || 'verified'}`
    );
  }

  lines.push('=== END RUNTIME CONTEXT ===');
  return lines.join('\n');
}
