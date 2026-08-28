import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import authService from '../../services/auth/authService';
import coopHubLogo from '../../assets/branding/coop-hub-logo.png';

export default function ForgotPassword() {
    const { t } = useTranslation();
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
            setError(t('validation.invalid_email'));
            return;
        }

        setLoading(true);
        try {
            await authService.requestPasswordReset(email);
            setSuccess(true);
        } catch (err) {
            setError(err.message || t('errors.generic_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            className="min-h-screen flex items-center justify-center px-4 py-8"
            style={{ background: "linear-gradient(135deg, #050A12 0%, #162238 50%, #050A12 100%)" }}
        >
            <div className="card max-w-md w-full p-8 shadow-xl shadow-navy-900/5 text-center">

                <img src={coopHubLogo} alt="COOP HUB" className="w-20 h-auto mx-auto mb-6" />

                <h1 className="heading-3 mb-2">{t('auth.forgot_password_title')}</h1>
                <p className="text-muted text-sm mb-8">{t('auth.forgot_password_subtitle')}</p>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-danger-50 text-danger-600 text-sm font-medium border border-danger-100 flex items-start text-left">
                        <svg className="w-5 h-5 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                        </svg>
                        <span>{error}</span>
                    </div>
                )}

                {success ? (
                    <div className="text-center">
                        <div className="w-16 h-16 bg-success-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <svg className="w-8 h-8 text-success-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-navy-800 font-medium mb-8">{t('auth.reset_link_sent')}</p>
                        <Link to="/login" className="btn-secondary w-full">
                            {t('auth.back_to_login')}
                        </Link>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-6 text-left">
                        <div>
                            <label className="sr-only" htmlFor="email">{t('auth.email')}</label>
                            <input
                                type="email"
                                id="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent transition-all"
                                placeholder={t('auth.email_placeholder')}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3.5 shadow-lg shadow-orange-500/20"
                        >
                            {loading ? t('auth.sending_reset_link') : t('auth.send_reset_link')}
                        </button>
                    </form>
                )}

                {!success && (
                    <div className="mt-8 pt-6 border-t border-navy-100">
                        <Link to="/login" className="text-sm font-semibold text-navy-500 hover:text-navy-800 transition-colors flex items-center justify-center">
                            <svg className="w-4 h-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                            </svg>
                            {t('auth.back_to_login')}
                        </Link>
                    </div>
                )}
            </div>
        </div>
    );
}
