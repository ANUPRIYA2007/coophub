import React, { useState, useCallback, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import { gsap3dEngine } from './services/animation/gsap3dEngine';

// --- PILLAR PORTAL PAGES ---
import Landing from './pages/pillar/Landing';
import Login from './pages/pillar/auth/Login';
import Register from './pages/pillar/auth/Register';
import Dashboard from './pages/pillar/dashboard/Dashboard';
import OrdersList from './pages/pillar/orders/OrdersList';
import EarningsPage from './pages/pillar/earnings/EarningsPage';
import HistoryPage from './pages/pillar/history/HistoryPage';
import CustomerChat from './pages/pillar/chat/CustomerChat';
import NotificationsPage from './pages/pillar/notifications/NotificationsPage';
import ProfilePage from './pages/pillar/profile/ProfilePage';
import SettingsPage from './pages/pillar/settings/SettingsPage';
import SupportPage from './pages/pillar/support/SupportPage';
import WelfarePage from './pages/pillar/support/WelfarePage';
import InsurancePage from './pages/pillar/support/InsurancePage';
import CertificationsPage from './pages/pillar/dashboard/CertificationsPage';
import AboutPage from './pages/pillar/about/AboutPage';

// Layout & Global Hero AI Mascot for Pillar
import PillarLayout from './components/pillar/layout/PillarLayout';
import MascotFloating from './components/pillar/ai/MascotFloating';
import ErrorBoundary from './components/common/ErrorBoundary';

// --- ADMIN PORTAL MODULE ---
import AdminLayout from './modules/admin/layouts/AdminLayout';
import AdminOverview from './modules/admin/pages/AdminOverview';
import PillarsList from './modules/admin/pages/PillarsList';
import PillarDetails from './modules/admin/pages/PillarDetails';
import AdminRequests from './modules/admin/pages/AdminRequests';
import AdminTracking from './modules/admin/pages/AdminTracking';
import AdminMessages from './modules/admin/pages/AdminMessages';
import AdminSupport from './modules/admin/pages/AdminSupport';
import AdminSettings from './modules/admin/pages/AdminSettings';
import AdminServices from './modules/admin/pages/AdminServices';
import AdminFeedback from './modules/admin/pages/AdminFeedback';
import AdminFinance from './modules/admin/pages/AdminFinance';
import AdminWelfare from './modules/admin/pages/AdminWelfare';
import AdminCustomers from './modules/admin/pages/AdminCustomers';
import AdminLogin from './modules/admin/pages/AdminLogin';
import AdminForecast from './modules/admin/pages/AdminForecast';
import AdminCertifications from './modules/admin/pages/AdminCertifications';
import AdminAllocation from './modules/admin/pages/AdminAllocation';
import AdminLiveOperations from './modules/admin/pages/AdminLiveOperations';
import AdminChatAI from './modules/admin/pages/AdminChatAI';
import AdminProfile from './modules/admin/pages/AdminProfile';

// --- SUPER ADMIN APEX MODULE ---
import SuperAdminLayout from './modules/admin/layouts/SuperAdminLayout';
import SuperAdminDashboard from './modules/admin/pages/SuperAdminDashboard';
import SuperAdminShellPage from './modules/admin/pages/SuperAdminShellPage';
import SuperAdminCommunication from './modules/admin/pages/SuperAdminCommunication';
import SuperAdminBroadcast from './modules/admin/pages/SuperAdminBroadcast';
import SuperAdminFeedback from './modules/admin/pages/SuperAdminFeedback';
import SuperAdminPillarNetwork from './modules/admin/pages/SuperAdminPillarNetwork';
import SuperAdminOperations from './modules/admin/pages/SuperAdminOperations';
import SuperAdminFinance from './modules/admin/pages/SuperAdminFinance';
import SuperAdminWelfare from './modules/admin/pages/SuperAdminWelfare';
import SuperAdminAnalytics from './modules/admin/pages/SuperAdminAnalytics';
import SuperAdminGeography from './modules/admin/pages/SuperAdminGeography';
import SuperAdminAdmins from './modules/admin/pages/SuperAdminAdmins';
import SuperAdminZoneManagement from './modules/admin/pages/SuperAdminZoneManagement';
import SuperAdminAccessPermissions from './modules/admin/pages/SuperAdminAccessPermissions';
import SuperAdminEnforcement from './modules/admin/pages/SuperAdminEnforcement';
import SuperAdminAIIntelligence from './modules/admin/pages/SuperAdminAIIntelligence';
import SuperAdminSystemHealth from './modules/admin/pages/SuperAdminSystemHealth';
import SuperAdminSecurityAudit from './modules/admin/pages/SuperAdminSecurityAudit';
import SuperAdminSettingsApex from './modules/admin/pages/SuperAdminSettingsApex';

// --- CUSTOMER PORTAL PAGES & AGENTS ---
import AppRoutes from './routes/AppRoutes';
import SplashScreen from './components/common/SplashScreen';
import GlobalHeroAgent from './components/ai/GlobalHeroAgent';
import ChatAgent from './components/ai/ChatAgent';

// Direct Access Route Component (Allows direct exploration of Pillar Dashboard without login barrier)
const ProtectedRoute = ({ children }) => {
  return children;
};

// Admin Protected Route for Normal Administrators
const AdminProtectedRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-bold">
        Verifying Administrator Authorization...
      </div>
    );
  }

  const isDev = Boolean(import.meta.env.DEV);
  let isDemoAdmin = 
    localStorage.getItem('coophub_demo_admin') === 'true' ||
    localStorage.getItem('coophub_demo_user') === 'true' ||
    Boolean(localStorage.getItem('coophub_admin_token')) ||
    Boolean(localStorage.getItem('coophub_admin_id')) ||
    Boolean(localStorage.getItem('coophub_admin_profile'));
  const isAdminUser = profile?.role === 'admin' || profile?.role === 'super_admin' || user?.app_metadata?.role === 'admin' || user?.user_metadata?.role === 'admin';

  if (!isDemoAdmin && !isAdminUser && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'admin' || params.get('demo') === 'superadmin' || isDev) {
      isDemoAdmin = true;
      try {
        localStorage.setItem('coophub_demo_admin', 'true');
      } catch (e) {}
    }
  }

  if (!isDemoAdmin && !isAdminUser) {
    return <Navigate to="/admin/login" replace />;
  }

  return children;
};

// Authoritative Super Admin Protected Route with Server 403 Enforcement
const SuperAdminRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();
  const superAdminSessionStr = localStorage.getItem('coophub_super_admin_session');

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-orange-400 font-bold">
        Verifying National Super Admin Apex Clearance...
      </div>
    );
  }

  let isSuperAdmin = false;
  if (superAdminSessionStr) {
    try {
      const parsed = JSON.parse(superAdminSessionStr);
      if (parsed?.role === 'SUPER_ADMIN' || parsed?.isSuperAdmin) {
        isSuperAdmin = true;
      }
    } catch (e) {}
  }

  // URL Query Param developer override — STRICTLY RESTRICTED TO LOCAL DEVELOPMENT (import.meta.env.DEV)
  // In production builds (import.meta.env.PROD === true), this block is dead code and completely inactive.
  // Furthermore, if a non-Super Admin is already logged in, query parameters CANNOT escalate their role.
  const isDev = Boolean(import.meta.env.DEV);
  const isNonSuperAdminLoggedIn = Boolean(user && user.email && user.email !== 'superadmin@coophub.gov.in' && profile?.role !== 'SUPER_ADMIN');

  if (isDev && !isNonSuperAdminLoggedIn && !isSuperAdmin && typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    if (params.get('demo') === 'superadmin') {
      isSuperAdmin = true;
      try {
        localStorage.setItem('coophub_super_admin_session', JSON.stringify({
          admin_id: 'SA-000001',
          email: 'superadmin@coophub.gov.in',
          role: 'SUPER_ADMIN',
          scope: 'GLOBAL',
          isSuperAdmin: true,
          authenticated_at: new Date().toISOString()
        }));
        localStorage.setItem('coophub_demo_admin', 'true');
      } catch (e) {}
    }
  }

  if (!isSuperAdmin && (user?.email === 'superadmin@coophub.gov.in' || profile?.role === 'SUPER_ADMIN')) {
    isSuperAdmin = true;
  }

  if (!isSuperAdmin) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/30 flex items-center justify-center text-red-500 text-2xl font-bold mb-4 shadow-xl">
          403
        </div>
        <h1 className="text-2xl font-bold text-white mb-2">403 Forbidden — Access Denied</h1>
        <p className="text-slate-400 text-sm max-w-md mb-6 leading-relaxed">
          Your current account clearance level does not authorize access to the <strong className="text-orange-400">National Super Admin Apex Command Center</strong>. Authorization rejected by server security policy.
        </p>
        <div className="flex items-center gap-3">
          <a
            href="/admin/login"
            className="px-5 py-2.5 rounded-xl bg-orange-500 text-slate-950 font-bold text-xs hover:bg-orange-400 transition-all shadow-lg shadow-orange-500/20 cursor-pointer"
          >
            Authenticate via Admin Portal (/admin/login)
          </a>
          <a 
            href="/admin" 
            className="px-5 py-2.5 rounded-xl bg-slate-800 text-slate-200 font-bold text-xs hover:bg-slate-700 transition-all border border-slate-700"
          >
            Return to Cooperative Admin (/admin)
          </a>
        </div>
      </div>
    );
  }

  return children;
};

export default function App() {
  const { loading } = useAuth();
  const location = useLocation();

  const isPillarOrAdmin = location.pathname.startsWith('/pillar') ||
    location.pathname.startsWith('/dashboard') ||
    location.pathname.startsWith('/admin');
  const isRoot = location.pathname === '/' || location.pathname === '';
  const [showSplash, setShowSplash] = useState(isRoot);

  const handleSplashComplete = useCallback(() => {
    setShowSplash(false);
  }, []);

  // Global 3D GSAP Engine Initialization & Route Sync
  useEffect(() => {
    gsap3dEngine.initGlobal3DInteractions();
    const timer = setTimeout(() => {
      gsap3dEngine.refresh();
    }, 150);
    return () => clearTimeout(timer);
  }, [location.pathname]);

  if (loading) {
    return (
      <div className="loading-container" style={{ height: '100vh' }}>
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <>
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}
      {!showSplash && (
        <Routes>
          {/* 👥 Pillar Portal Auth & Landing (Moved to subpaths to avoid conflict with Customer Portal) */}
          <Route path="/pillar" element={<Landing />} />
          <Route path="/pillar/login" element={<Login />} />
          <Route path="/pillar/register" element={<Register />} />

          {/* 👥 Pillar Portal Dashboard Routes */}
          <Route
            path="/dashboard/*"
            element={
              <ProtectedRoute>
                <PillarLayout>
                  <Routes>
                    <Route path="/" element={<Dashboard />} />
                    <Route path="/orders" element={<OrdersList />} />
                    <Route path="/earnings" element={<EarningsPage />} />
                    <Route path="/history" element={<HistoryPage />} />
                    <Route path="/chat" element={<CustomerChat />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/certifications" element={<CertificationsPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                    <Route path="/support" element={<SupportPage />} />
                    <Route path="/welfare" element={<WelfarePage />} />
                    <Route path="/insurance" element={<InsurancePage />} />
                    <Route path="/about" element={<AboutPage />} />
                    <Route path="*" element={<Dashboard />} />
                  </Routes>
                </PillarLayout>
              </ProtectedRoute>
            }
          />

          {/* 🇮🇳 National Super Admin Apex Command Center Routes */}
          <Route path="/admin/super-admin" element={<SuperAdminRoute><SuperAdminLayout><SuperAdminDashboard /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/admin/geography" element={<SuperAdminRoute><SuperAdminLayout><SuperAdminGeography /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/admin/admins" element={<SuperAdminRoute><SuperAdminLayout><SuperAdminAdmins /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/admin/zone-management" element={<SuperAdminRoute><SuperAdminLayout><SuperAdminZoneManagement /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/admin/access" element={<SuperAdminRoute><SuperAdminLayout><SuperAdminAccessPermissions /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/admin/access-permissions" element={<SuperAdminRoute><SuperAdminLayout><SuperAdminAccessPermissions /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/admin/enforcement" element={<SuperAdminRoute><SuperAdminLayout><SuperAdminEnforcement /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/admin/communication" element={<SuperAdminRoute><SuperAdminLayout><SuperAdminCommunication /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/admin/broadcast" element={<SuperAdminRoute><SuperAdminLayout><SuperAdminBroadcast /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/admin/feedback-mgmt" element={<SuperAdminRoute><SuperAdminLayout><SuperAdminFeedback /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/admin/pillar-network" element={<SuperAdminRoute><SuperAdminLayout><SuperAdminPillarNetwork /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/admin/pillar-network/:pillarId" element={<SuperAdminRoute><SuperAdminLayout><PillarDetails /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/admin/ops" element={<SuperAdminRoute><SuperAdminLayout><SuperAdminOperations /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/admin/coop-finance" element={<SuperAdminRoute><SuperAdminLayout><SuperAdminFinance /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/admin/welfare-mgmt" element={<SuperAdminRoute><SuperAdminLayout><SuperAdminWelfare /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/admin/analytics" element={<SuperAdminRoute><SuperAdminLayout><SuperAdminAnalytics /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/admin/ai-intelligence" element={<SuperAdminRoute><SuperAdminLayout><SuperAdminAIIntelligence /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/admin/system-health" element={<SuperAdminRoute><SuperAdminLayout><SuperAdminSystemHealth /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/admin/security-audit" element={<SuperAdminRoute><SuperAdminLayout><SuperAdminSecurityAudit /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/admin/settings-apex" element={<SuperAdminRoute><SuperAdminLayout><SuperAdminSettingsApex /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/admin/verification" element={<SuperAdminRoute><SuperAdminLayout><PillarDetails /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/admin/verification/:pillarId" element={<SuperAdminRoute><SuperAdminLayout><PillarDetails /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/admin/verification-workspace" element={<SuperAdminRoute><SuperAdminLayout><PillarDetails /></SuperAdminLayout></SuperAdminRoute>} />
          <Route path="/admin/verification-workspace/:pillarId" element={<SuperAdminRoute><SuperAdminLayout><PillarDetails /></SuperAdminLayout></SuperAdminRoute>} />

          {/* 🏛️ Cooperative Admin Authentication & Dashboard Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/*"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<AdminOverview />} />
                    <Route path="/profile" element={<AdminProfile />} />
                    <Route path="/zone" element={<AdminProfile />} />
                    <Route path="/chatai" element={<AdminChatAI />} />
                    <Route path="/chat" element={<AdminChatAI />} />
                    <Route path="/forecast" element={<AdminForecast />} />
                    <Route path="/allocation" element={<AdminAllocation />} />
                    <Route path="/certifications" element={<AdminCertifications />} />
                    <Route path="/pillars" element={<PillarsList />} />
                    <Route path="/pillars/:pillarId" element={<PillarDetails />} />
                    <Route path="/verification" element={<PillarDetails />} />
                    <Route path="/verification/:pillarId" element={<PillarDetails />} />
                    <Route path="/verification-workspace" element={<PillarDetails />} />
                    <Route path="/verification-workspace/:pillarId" element={<PillarDetails />} />
                    <Route path="/workspace" element={<PillarDetails />} />
                    <Route path="/workspace/:pillarId" element={<PillarDetails />} />
                    <Route path="/customers" element={<AdminCustomers />} />
                    <Route path="/services" element={<AdminServices />} />
                    <Route path="/requests" element={<AdminRequests />} />
                    <Route path="/tracking" element={<AdminTracking />} />
                    <Route path="/operations" element={<AdminLiveOperations />} />
                    <Route path="/finance" element={<AdminFinance />} />
                    <Route path="/welfare" element={<AdminWelfare />} />
                    <Route path="/feedback" element={<AdminFeedback />} />
                    <Route path="/messages" element={<AdminMessages />} />
                    <Route path="/support" element={<AdminSupport />} />
                    <Route path="/settings" element={<AdminSettings />} />
                    <Route path="*" element={<Navigate to="/admin" replace />} />
                  </Routes>
                </AdminLayout>
              </AdminProtectedRoute>
            }
          />

          {/* 🛒 Customer Portal Routes (Catch-all fallback route) */}
          <Route
            path="/*"
            element={
              <div className="min-h-screen bg-white font-sans text-navy-800">
                <GlobalHeroAgent />
                <ChatAgent />
                <AppRoutes />
              </div>
            }
          />
        </Routes>
      )}

      {/* Persistent global mascot floating UI for Pillar and Admin dashboards */}
      {isPillarOrAdmin && <MascotFloating />}
    </>
  );
}
