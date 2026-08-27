import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import CustomerPortalLayout from '../components/layout/CustomerPortalLayout';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import VerifyOtp from '../pages/auth/VerifyOtp';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

// Portal Pages (rendered inside CustomerPortalLayout)
import Home from '../pages/home/Home';
import ServicesBrowse from '../pages/services/ServicesBrowse';
import ServiceDetails from '../pages/services/ServiceDetails';
import ServiceRequest from '../pages/booking/ServiceRequest';
import RequestsList from '../pages/requests/RequestsList';
import RequestDetails from '../pages/requests/RequestDetails';
import RequestChat from '../pages/requests/RequestChat';
import HistoryList from '../pages/history/HistoryList';
import SupportCenter from '../pages/support/SupportCenter';
import CreateTicket from '../pages/support/CreateTicket';
import SupportTickets from '../pages/support/SupportTickets';
import SettingsHub from '../pages/settings/SettingsHub';
import ProfileIndex from '../pages/profile/ProfileIndex';
import NotificationsList from '../pages/notifications/NotificationsList';

// Landing
import Landing from '../pages/Landing';

export default function AppRoutes() {
    return (
        <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-otp" element={<VerifyOtp />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* Customer Portal — nested inside shared layout shell */}
            <Route element={<ProtectedRoute><CustomerPortalLayout /></ProtectedRoute>}>
                <Route path="/home" element={<Home />} />
                <Route path="/services" element={<ServicesBrowse />} />
                <Route path="/services/:id" element={<ServiceDetails />} />
                <Route path="/services/:id/request" element={<ServiceRequest />} />
                <Route path="/requests" element={<RequestsList />} />
                <Route path="/requests/:id" element={<RequestDetails />} />
                <Route path="/requests/:id/chat" element={<RequestChat />} />
                <Route path="/messages" element={<RequestsList />} />
                <Route path="/history" element={<HistoryList />} />
                <Route path="/support" element={<SupportCenter />} />
                <Route path="/support/new" element={<CreateTicket />} />
                <Route path="/support/tickets" element={<SupportTickets />} />
                <Route path="/settings" element={<SettingsHub />} />
                <Route path="/profile" element={<ProfileIndex />} />
                <Route path="/notifications" element={<NotificationsList />} />
            </Route>
        </Routes>
    );
}
