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

// Layout & Global Hero AI Mascot for Pillar
import PillarLayout from './components/pillar/layout/PillarLayout';
import MascotFloating from './components/pillar/ai/MascotFloating';

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

// --- CUSTOMER PORTAL PAGES & AGENTS ---
import AppRoutes from './routes/AppRoutes';
import SplashScreen from './components/common/SplashScreen';
import GlobalHeroAgent from './components/ai/GlobalHeroAgent';
import ChatAgent from './components/ai/ChatAgent';

// Direct Access Route Component (Allows direct exploration of Pillar Dashboard without login barrier)
const ProtectedRoute = ({ children }) => {
  return children;
};

// Admin Protected Route with Role Verification
const AdminProtectedRoute = ({ children }) => {
  const { user, profile, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-white font-bold">
        Verifying Administrator Authorization...
      </div>
    );
  }

  const isDemoAdmin = localStorage.getItem('coophub_demo_admin') === 'true';
  const isAdminUser = profile?.role === 'admin' || user?.app_metadata?.role === 'admin' || user?.user_metadata?.role === 'admin';

  if (!isDemoAdmin && !isAdminUser) {
    return <Navigate to="/admin/login" replace />;
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
                    <Route path="*" element={<Dashboard />} />
                  </Routes>
                </PillarLayout>
              </ProtectedRoute>
            }
          />

          {/* 🏛️ Cooperative Admin Authentication & Dashboard Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route
            path="/admin/*"
            element={
              <AdminProtectedRoute>
                <AdminLayout>
                  <Routes>
                    <Route path="/" element={<AdminOverview />} />
                    <Route path="/chatai" element={<AdminChatAI />} />
                    <Route path="/chat" element={<AdminChatAI />} />
                    <Route path="/forecast" element={<AdminForecast />} />
                    <Route path="/allocation" element={<AdminAllocation />} />
                    <Route path="/certifications" element={<AdminCertifications />} />
                    <Route path="/pillars" element={<PillarsList />} />
                    <Route path="/pillars/:pillarId" element={<PillarDetails />} />
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
