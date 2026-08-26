import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';

// Auth Pages
import Login from '../pages/auth/Login';
import Register from '../pages/auth/Register';
import VerifyOtp from '../pages/auth/VerifyOtp';
import ForgotPassword from '../pages/auth/ForgotPassword';
import ResetPassword from '../pages/auth/ResetPassword';

// Main Pages
import Home from '../pages/home/Home';
import ServiceDetails from '../pages/services/ServiceDetails';
import ServiceRequest from '../pages/booking/ServiceRequest';
import RequestDetails from '../pages/requests/RequestDetails';
import Services from '../pages/services/Services';
import ServiceDetail from '../pages/services/ServiceDetail';
import Workers from '../pages/workers/Workers';
import WorkerDetail from '../pages/workers/WorkerDetail';
import Book from '../pages/booking/Book';
import BookingDetail from '../pages/booking/BookingDetail';
import Tracking from '../pages/tracking/Tracking';
import Chat from '../pages/chat/Chat';
import Notifications from '../pages/notifications/Notifications';
import History from '../pages/history/History';
import Profile from '../pages/profile/Profile';
import Complaints from '../pages/complaints/Complaints';

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

            {/* Authenticated / Protected */}
            <Route path="/home" element={<ProtectedRoute><Home /></ProtectedRoute>} />
            <Route path="/services/:id" element={<ProtectedRoute><ServiceDetails /></ProtectedRoute>} />
            <Route path="/services/:id/request" element={<ProtectedRoute><ServiceRequest /></ProtectedRoute>} />
            <Route path="/requests/:id" element={<ProtectedRoute><RequestDetails /></ProtectedRoute>} />
            <Route path="/workers" element={<ProtectedRoute><Workers /></ProtectedRoute>} />
            <Route path="/workers/:id" element={<ProtectedRoute><WorkerDetail /></ProtectedRoute>} />
            <Route path="/book" element={<ProtectedRoute><Book /></ProtectedRoute>} />
            <Route path="/booking/:id" element={<ProtectedRoute><BookingDetail /></ProtectedRoute>} />
            <Route path="/tracking/:id" element={<ProtectedRoute><Tracking /></ProtectedRoute>} />
            <Route path="/chat/:id" element={<ProtectedRoute><Chat /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/history" element={<ProtectedRoute><History /></ProtectedRoute>} />
            <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
            <Route path="/complaints" element={<ProtectedRoute><Complaints /></ProtectedRoute>} />
        </Routes>
    );
}
