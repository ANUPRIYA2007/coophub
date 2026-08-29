import { useState } from 'react';
import { Link, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTranslation } from '../../hooks/useTranslation';
import authService from '../../services/auth/authService';
import coopHubLogo from '../../assets/branding/coop-hub-logo.png';
import PasswordInput from '../../components/ui/PasswordInput';
import LanguageSelector from '../../components/ui/LanguageSelector';
import { Mail, Lock, KeyRound, ArrowLeft, Shield, Wrench, ShoppingBag } from 'lucide-react';

export default function Login() {
    const { session, loginCustomerDemo } = useAuth();
    const { t } = useTranslation();
    const navigate = useNavigate();
    const location = useLocation();

    const [loginMode, setLoginMode] = useState('password'); // 'password' | 'otp'
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [otp, setOtp] = useState('');
    const [otpSent, setOtpSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [successMsg, setSuccessMsg] = useState(null);

    // If already authenticated, redirect
    if (session) {
        const from = location.state?.from?.pathname || '/home';
        return <Navigate to={from} replace />;
    }

    const handleDemoFill = () => {
        setEmail('customer@coophub.in');
        setPassword('password123');
        setError(null);
        if (loginCustomerDemo) {
            loginCustomerDemo();
            navigate('/home');
        }
    };

    const handleSendOtp = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccessMsg(null);

        if (!email.trim() || !/^\S+@\S+\.\S+$/.test(email)) {
            setError(t('validation.invalid_email') || 'Please enter a valid email address.');
            return;
        }

        setLoading(true);
        try {
            // Demo Customer shortcut
            if (email === 'customer@coophub.in') {
                setOtpSent(true);
                setSuccessMsg('Demo OTP sent: Use 489201 or 123456');
                setLoading(false);
                return;
            }

            await authService.sendOtp(email);
            setOtpSent(true);
            setSuccessMsg(t('auth.otp_sent') || '6-digit OTP code sent to your email.');
        } catch (err) {
            setError(err.message || 'Failed to send OTP to email.');
        } finally {
            setLoading(false);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setLoading(true);

        try {
            if (!email) throw new Error(t('validation.required_email'));

            // 🧪 CUSTOMER DEMO BYPASS
            if (
                email === "customer@coophub.in" || email.toLowerCase().includes("demo")
            ) {
                if (loginCustomerDemo) {
                    loginCustomerDemo();
                } else {
                    localStorage.setItem("coophub_demo_customer", "true");
                }
                navigate('/home');
                return;
            }

            localStorage.removeItem("coophub_demo_customer");
            localStorage.removeItem("coophub_demo_user");
            localStorage.removeItem("coophub_demo_admin");

            if (loginMode === 'password') {
                if (!password) throw new Error(t('validation.required_password'));
                await authService.signInWithPassword(email, password);
            } else {
                if (!otp || otp.length < 6) throw new Error('Please enter the OTP code received in your email.');
                await authService.verifyOtp(email, otp);
            }

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
        <div 
            className="min-h-screen flex items-center justify-center px-4 py-8 relative"
            style={{ background: "linear-gradient(135deg, #050A12 0%, #162238 50%, #050A12 100%)" }}
        >

            {/* Top Navigation & Language Selector */}
            <div className="absolute top-4 left-4 z-10">
                <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-navy-600 hover:text-orange-600 transition-colors bg-white/80 backdrop-blur-sm px-3 py-1.5 rounded-full border border-navy-100 shadow-xs">
                    <ArrowLeft size={14} /> Back to Portals
                </Link>
            </div>

            <div className="absolute top-4 right-4 w-40 z-10">
                <LanguageSelector />
            </div>

            <div className="card max-w-md w-full p-8 shadow-xl shadow-navy-900/5 mt-8 sm:mt-0 relative overflow-hidden">
                <div className="text-center mb-6">
                    <img src={coopHubLogo} alt="COOP HUB" className="w-24 h-auto mx-auto mb-4" />
                    <div className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-orange-100 text-orange-700 mb-2">
                        <ShoppingBag size={12} /> Customer Portal
                    </div>
                    <h1 className="heading-2 mb-1">{t('auth.login_title')}</h1>
                    <p className="text-muted text-xs sm:text-sm">{t('auth.login_subtitle')}</p>
                </div>

                {/* Status alerts */}
                {error && (
                    <div className="mb-5 p-3 rounded-xl bg-danger-50 text-danger-600 text-xs font-medium border border-danger-100 flex items-start">
                        <svg className="w-4 h-4 mr-2 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {successMsg && (
                    <div className="mb-5 p-3 rounded-xl bg-green-50 text-green-700 text-xs font-medium border border-green-200">
                        {successMsg}
                    </div>
                )}

                {/* Login Mode Toggle Tabs */}
                <div className="flex bg-navy-50 rounded-xl p-1 mb-5 border border-navy-100">
                    <button
                        type="button"
                        onClick={() => { setLoginMode('password'); setError(null); }}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                            loginMode === 'password'
                                ? 'bg-white text-navy-900 shadow-sm'
                                : 'text-navy-500 hover:text-navy-800'
                        }`}
                    >
                        Email & Password
                    </button>
                    <button
                        type="button"
                        onClick={() => { setLoginMode('otp'); setError(null); }}
                        className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                            loginMode === 'otp'
                                ? 'bg-white text-navy-900 shadow-sm'
                                : 'text-navy-500 hover:text-navy-800'
                        }`}
                    >
                        Email OTP Code
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={loginMode === 'otp' && !otpSent ? handleSendOtp : handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-xs font-semibold text-navy-800 mb-1.5" htmlFor="email">
                            {t('auth.email')}
                        </label>
                        <div className="relative">
                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-navy-400">
                                <Mail size={16} />
                            </div>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full pl-10 pr-4 py-3 rounded-xl border border-navy-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all hover:border-navy-300 text-sm"
                                placeholder={t('auth.email_placeholder')}
                                required
                            />
                        </div>
                    </div>

                    {loginMode === 'password' && (
                        <div>
                            <div className="flex justify-between items-center mb-1.5">
                                <label className="block text-xs font-semibold text-navy-800" htmlFor="password">
                                    {t('auth.password')}
                                </label>
                                <Link to="/forgot-password" className="text-xs font-semibold text-orange-500 hover:text-orange-600 transition-colors">
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
                    )}

                    {loginMode === 'otp' && (
                        <div>
                            {otpSent ? (
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between items-center mb-1.5">
                                            <label className="block text-xs font-semibold text-navy-800">
                                                Enter Email OTP Code
                                            </label>
                                            <button
                                                type="button"
                                                onClick={handleSendOtp}
                                                disabled={loading}
                                                className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                                            >
                                                Resend OTP
                                            </button>
                                        </div>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-navy-400">
                                                <KeyRound size={16} />
                                            </div>
                                            <input
                                                type="text"
                                                maxLength={8}
                                                value={otp}
                                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                                                placeholder="Enter OTP Code"
                                                className="w-full pl-10 pr-4 py-3 rounded-xl border-2 border-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500 font-mono tracking-[0.3em] text-center text-lg font-bold"
                                                required
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <p className="text-[11px] text-navy-500 text-center">
                                        Check your email inbox or spam folder for the code.
                                    </p>
                                </div>
                            ) : (
                                <div className="text-right mt-1">
                                    <button
                                        type="button"
                                        onClick={() => setOtpSent(true)}
                                        className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors underline"
                                    >
                                        Already have an OTP code? Enter Code
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        className="btn-primary w-full py-3.5 text-sm mt-2 shadow-lg shadow-orange-500/20"
                    >
                        {loading ? (
                            <span className="flex items-center justify-center">
                                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {loginMode === 'otp' && !otpSent ? 'Sending OTP Code...' : 'Verifying & Logging In...'}
                            </span>
                        ) : loginMode === 'otp' && !otpSent ? (
                            'Send 6-Digit OTP to Email'
                        ) : (
                            t('auth.login_btn') || 'Log In'
                        )}
                    </button>
                </form>

                {/* Demo Quick Fill */}
                <div className="mt-4 text-center">
                    <button
                        type="button"
                        onClick={handleDemoFill}
                        className="text-xs font-semibold text-orange-600 hover:text-orange-700 transition-colors"
                    >
                        ⚡ Fill Demo Customer Credentials
                    </button>
                </div>

                {/* Register Account Link */}
                <div className="mt-6 pt-5 border-t border-navy-100 text-center text-xs text-navy-600 space-y-3">
                    <div>
                        {t('auth.create_account_link')}{' '}
                        <Link to="/register" className="font-bold text-orange-600 hover:underline">
                            {t('auth.create_account_action')}
                        </Link>
                    </div>

                    {/* Switch to Pillar or Admin Portal */}
                    <div className="pt-2 border-t border-navy-50 flex items-center justify-center gap-3 text-[11px] text-navy-500">
                        <Link to="/pillar/login" className="hover:text-blue-600 flex items-center gap-1 font-medium">
                            <Wrench size={12} /> Pillar Login
                        </Link>
                        <span>•</span>
                        <Link to="/admin/login" className="hover:text-amber-600 flex items-center gap-1 font-medium">
                            <Shield size={12} /> Admin Login
                        </Link>
                    </div>
                </div>

            </div>
        </div>
    );
}
