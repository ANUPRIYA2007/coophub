import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
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

// Layout & Global Hero AI Mascot
import PillarLayout from './components/pillar/layout/PillarLayout';
import MascotFloating from './components/pillar/ai/MascotFloating';

// Admin Module
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

// Direct Access Route Component (Allows direct exploration of Pillar Dashboard without login barrier)
const ProtectedRoute = ({ children }) => {
  return children;
};

// Admin Protected Route
const AdminProtectedRoute = ({ children }) => {
  return children;
};

function App() {
  const { loading } = useAuth();

  if (loading) {
    return (
      <div className="loading-container" style={{ height: '100vh' }}>
        <div className="spinner spinner-lg"></div>
      </div>
    );
  }

  return (
    <>
      <Routes>
        {/* Landing Page with Hero Exact UI format */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />

        {/* Pillar Dashboard Routes (Direct Access) */}
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
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route path="/settings" element={<SettingsPage />} />
                  <Route path="/support" element={<SupportPage />} />
                  <Route path="*" element={<Dashboard />} />
                </Routes>
              </PillarLayout>
            </ProtectedRoute>
          }
        />

        {/* Cooperative Admin Dashboard Routes (Fully Functional) */}
        <Route
          path="/admin/*"
          element={
            <AdminProtectedRoute>
              <AdminLayout>
                <Routes>
                  <Route path="/" element={<AdminOverview />} />
                  <Route path="/pillars" element={<PillarsList />} />
                  <Route path="/pillars/:pillarId" element={<PillarDetails />} />
                  <Route path="/services" element={<AdminServices />} />
                  <Route path="/requests" element={<AdminRequests />} />
                  <Route path="/tracking" element={<AdminTracking />} />
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

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {/* Hero AI & Chat Assistant — Present across entire Pillar journey */}
      <MascotFloating />
    </>
  );
}

export default App;
