import { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import authService from '../../services/auth/authService';
import coopHubLogo from '../../assets/branding/coop-hub-logo.png';
import PasswordInput from '../../components/ui/PasswordInput';
import LanguageSelector from '../../components/ui/LanguageSelector';

export default function Login() {
    const { session } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // If already authenticated, redirect
    if (session) {
        const from = location.state?.from?.pathname || '/home';
        return <Navigate to={from} replace />;
        // Need Navigate from import, let's just use effect for redirect if they land here
    }

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (!email) throw new Error(t('validation.required_email'));
            if (!password) throw new Error(t('validation.required_password'));

            if (email === "customer@coophub.in" && password === "password123") {
                localStorage.setItem("coophub_demo_customer", "true");
                localStorage.removeItem("coophub_demo_user");
                localStorage.removeItem("coophub_demo_admin");
                window.location.reload();
                return;
            }

            localStorage.removeItem("coophub_demo_customer");
            localStorage.removeItem("coophub_demo_user");
            localStorage.removeItem("coophub_demo_admin");

            await authService.signInWithPassword(email, password);
            navigate('/home');
        } catch (err) {
            if (err.message.includes('Invalid login credentials')) {
                setError(t('errors.invalid_credentials'));
            } else {
                setError(err.message || t('errors.generic_error'));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-navy-50 via-white to-orange-50/30 px-4 py-8">

            {/* Top right language switch */}
            <div className="absolute top-4 right-4 w-40">
                <LanguageSelector />
            </div>

            <div className="card max-w-md w-full p-8 shadow-xl shadow-navy-900/5">
                <div className="text-center mb-8">
                    <img src={coopHubLogo} alt="COOP HUB" className="w-24 h-auto mx-auto mb-6" />
                    <h1 className="heading-2 mb-2">{t('auth.login_title')}</h1>
                    <p className="text-muted text-sm">{t('auth.login_subtitle')}</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-danger-50 text-danger-600 text-sm font-medium border border-danger-100 flex items-start">
                        <svg className="w-5 h-5 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    <div>
                        <label className="block text-sm font-semibold text-navy-800 mb-1.5" htmlFor="email">
                            {t('auth.email')}
                        </label>
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all hover:border-navy-300"
                            placeholder={t('auth.email_placeholder')}
                            required
                        />
                    </div>

                    <div>
                        <div className="flex justify-between items-center mb-1.5">
                            <label className="block text-sm font-semibold text-navy-800" htmlFor="password">
                                {t('auth.password')}
                            </label>
                            <Link to="/forgot-password" className="text-sm font-semibold text-orange-500 hover:text-orange-600 transition-colors">
                                {t('auth.forgot_password_link')}
                            </Link>
                        </div>
                        <PasswordInput
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder={t('auth.password_placeholder')}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-3.5 text-base mt-2 shadow-lg shadow-orange-500/20"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {t('auth.logging_in')}
                            </span>
                        ) : (
                            t('auth.login_btn')
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-navy-600">
                    {t('auth.create_account_link')}{' '}
                    <Link to="/register" className="font-bold text-navy-800 hover:text-orange-500 transition-colors">
                        {t('auth.create_account_action')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
