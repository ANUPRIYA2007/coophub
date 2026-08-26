import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import authService from '../../services/auth/authService';
import PasswordInput from '../../components/ui/PasswordInput';
import coopHubLogo from '../../assets/branding/coop-hub-logo.png';

export default function ResetPassword() {
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);

    // Note: Supabase handles extracting the session from the URL hash internally
    // when a user lands on this page via a password reset email link.

    const validate = () => {
        if (password.length < 8) return t('validation.password_min_length');
        if (!/[A-Z]/.test(password)) return t('validation.password_uppercase');
        if (!/[a-z]/.test(password)) return t('validation.password_lowercase');
        if (!/[0-9]/.test(password)) return t('validation.password_number');

        if (password !== confirmPassword) return t('validation.passwords_mismatch');

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);
        setSuccess(false);

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            return;
        }

        setLoading(true);
        try {
            await authService.updatePassword(password);
            setSuccess(true);
            // Wait a bit, then redirect to login
            setTimeout(() => {
                authService.signOut().finally(() => navigate('/login'));
            }, 3000);
        } catch (err) {
            setError(err.message || t('errors.generic_error'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-8">
            <div className="card max-w-sm w-full p-8 shadow-xl shadow-navy-900/5">

                <div className="text-center mb-6">
                    <img src={coopHubLogo} alt="COOP HUB" className="w-16 h-auto mx-auto mb-6" />
                    <h1 className="heading-3 mb-2">{t('auth.reset_password_title')}</h1>
                    <p className="text-muted text-sm">{t('auth.reset_password_subtitle')}</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-danger-50 text-danger-600 text-sm font-medium border border-danger-100 flex items-start">
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
                        <p className="text-navy-800 font-medium mb-8">{t('auth.password_updated')}</p>
                        <p className="text-sm text-muted">Redirecting to login...</p>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-4">
                        <div>
                            <label className="block text-sm font-semibold text-navy-800 mb-1.5">{t('auth.new_password')}</label>
                            <PasswordInput
                                id="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder={t('auth.new_password_placeholder')}
                                required
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-semibold text-navy-800 mb-1.5">{t('auth.confirm_new_password')}</label>
                            <PasswordInput
                                id="confirmPassword"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                placeholder={t('auth.confirm_new_password_placeholder')}
                                required
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="btn-primary w-full py-3.5 mt-4 shadow-lg shadow-orange-500/20"
                        >
                            {loading ? t('auth.updating_password') : t('auth.update_password')}
                        </button>
                    </form>
                )}

            </div>
        </div>
    );
}
