import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useTranslation } from '../hooks/useTranslation';

export default function ProtectedRoute({ children }) {
    const { session, loading } = useAuth();
    const location = useLocation();
    const { t } = useTranslation();

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-surface">
                <div className="text-center">
                    <div className="w-12 h-12 border-4 border-navy-200 border-t-orange-500 rounded-full animate-spin mx-auto mb-4"></div>
                    <p className="text-navy-500 font-medium">{t('common.loading')}</p>
                </div>
            </div>
        );
    }

    const isCustomerDemo = localStorage.getItem('coophub_demo_customer') === 'true';
    if (!session && !isCustomerDemo) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    return children;
}
