import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import authService from '../../services/auth/authService';

export default function VerifyOtp() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email') || '';
    const navigate = useNavigate();

    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);

    const [cooldown, setCooldown] = useState(60); // 60 seconds cooldown for resend

    // Timer effect
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        if (otp.length !== 6 || !/^\d+$/.test(otp)) {
            setError(t('validation.invalid_otp'));
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await authService.verifyOtp(email, otp);
            navigate('/home');
        } catch (err) {
            if (err.message.includes('expired')) {
                setError(t('errors.expired_otp'));
            } else {
                setError(t('errors.invalid_otp'));
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        if (cooldown > 0 || !email) return;

        setLoading(true);
        setError(null);
        try {
            await authService.sendOtp(email);
            setSuccess(t('auth.otp_sent'));
            setCooldown(60); // Reset timer
        } catch (err) {
            setError(t('errors.otp_resend_failed'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-surface px-4 py-8">
            <div className="card max-w-sm w-full p-8 shadow-xl shadow-navy-900/5 text-center">

                <div className="w-16 h-16 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6 text-brand-500">
                    <svg className="w-8 h-8 text-orange-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                </div>

                <h1 className="heading-3 mb-2">{t('auth.verify_otp_title')}</h1>
                <p className="text-muted text-sm mb-1">{t('auth.verify_otp_subtitle')}</p>
                <p className="font-semibold text-navy-800 mb-6">{email}</p>

                {error && (
                    <div className="mb-6 p-3 rounded-xl bg-danger-50 text-danger-600 text-sm font-medium border border-danger-100">
                        {error}
                    </div>
                )}

                {success && (
                    <div className="mb-6 p-3 rounded-xl bg-success-50 text-success-600 text-sm font-medium border border-success-100">
                        {success}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="sr-only" htmlFor="otp">OTP</label>
                        <input
                            type="text"
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full text-center tracking-[0.5em] text-2xl font-display font-medium px-4 py-3 rounded-xl border border-navy-200 focus:outline-none focus:ring-2 focus:ring-orange-400 transition-all hover:border-navy-300"
                            placeholder="••••••"
                            maxLength={6}
                            required
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading || otp.length !== 6}
                        className="btn-primary w-full py-3.5 text-base shadow-lg shadow-orange-500/20"
                    >
                        {loading ? t('auth.verifying_otp') : t('auth.verify_otp_btn')}
                    </button>
                </form>

                <div className="mt-8 pt-6 border-t border-navy-100 flex flex-col gap-3">
                    <p className="text-sm text-navy-600">
                        {cooldown > 0 ? (
                            <span className="text-navy-400">
                                {t('auth.resend_otp_countdown')({ seconds: cooldown })}
                            </span>
                        ) : (
                            <button
                                onClick={handleResend}
                                disabled={loading}
                                className="font-semibold text-orange-500 hover:text-orange-600 transition-colors"
                                type="button"
                            >
                                {t('auth.resend_otp')}
                            </button>
                        )}
                    </p>
                    <Link to="/login" className="text-sm font-medium text-navy-500 hover:text-navy-800 transition-colors">
                        {t('auth.change_email')}
                    </Link>
                </div>

            </div>
        </div>
    );
}
