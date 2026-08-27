import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import { useLanguage } from '../../context/LanguageContext';
import authService from '../../services/auth/authService';
import PasswordInput from '../../components/ui/PasswordInput';
import coopHubLogo from '../../assets/branding/coop-hub-logo.png';

export default function Register() {
    const { t } = useTranslation();
    const { language, setLanguage, languages } = useLanguage();
    const navigate = useNavigate();

    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        mobile: '',
        password: '',
        confirmPassword: '',
    });

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const validate = () => {
        if (!formData.fullName.trim()) return t('validation.required_full_name');
        if (!formData.email.trim() || !/^\S+@\S+\.\S+$/.test(formData.email)) return t('validation.invalid_email');
        if (!formData.mobile.trim() || !/^\+?[0-9]{10,15}$/.test(formData.mobile)) return t('validation.invalid_mobile');

        if (formData.password.length < 8) return t('validation.password_min_length');
        if (!/[A-Z]/.test(formData.password)) return t('validation.password_uppercase');
        if (!/[a-z]/.test(formData.password)) return t('validation.password_lowercase');
        if (!/[0-9]/.test(formData.password)) return t('validation.password_number');

        if (formData.password !== formData.confirmPassword) return t('validation.passwords_mismatch');

        return null;
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError(null);

        const validationError = validate();
        if (validationError) {
            setError(validationError);
            window.dispatchEvent(new CustomEvent('coophub-hero-event', {
                detail: { type: 'error', message: validationError }
            }));
            return;
        }

        setLoading(true);
        try {
            await authService.signUp(formData.email, formData.password, {
                full_name: formData.fullName,
                mobile_number: formData.mobile,
                preferred_language: language,
                role: 'customer' // Automatically registered as a customer
            });

            window.dispatchEvent(new CustomEvent('coophub-hero-event', {
                detail: { type: 'success', message: 'Awesome! Account created. Let us verify your email OTP!' }
            }));

            // On success, route to OTP verify page
            navigate(`/verify-otp?email=${encodeURIComponent(formData.email)}`);
        } catch (err) {
            let msg = err.message || t('errors.generic_error');
            if (err.message.includes('already registered') || err.message.includes('already exists')) {
                msg = t('errors.email_exists');
            } else if (err.message.toLowerCase().includes('rate limit')) {
                msg = "Email rate limit exceeded. Please wait a short while before requesting another confirmation email.";
            }
            setError(msg);
            window.dispatchEvent(new CustomEvent('coophub-hero-event', {
                detail: { type: 'error', message: msg }
            }));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-bl from-navy-50 via-white to-orange-50/20 px-4 py-8">
            <div className="card max-w-lg w-full p-8 shadow-xl shadow-navy-900/5">

                <div className="text-center mb-6">
                    <img src={coopHubLogo} alt="COOP HUB" className="w-20 h-auto mx-auto mb-4" />
                    <h1 className="heading-2 mb-1">{t('auth.register_title')}</h1>
                    <p className="text-muted text-sm">{t('auth.register_subtitle')}</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-danger-50 text-danger-600 text-sm font-medium border border-danger-100 flex flex-col">
                        <div className="flex items-start">
                            <svg className="w-5 h-5 mr-3 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                            </svg>
                            <span>{error}</span>
                        </div>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-semibold text-navy-800 mb-1.5">{t('auth.full_name')}</label>
                        <input
                            type="text"
                            name="fullName"
                            value={formData.fullName}
                            onChange={handleChange}
                            className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                            placeholder={t('auth.full_name_placeholder')}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-navy-800 mb-1.5">{t('auth.email')}</label>
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                                placeholder={t('auth.email_placeholder')}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-navy-800 mb-1.5">{t('auth.mobile_number')}</label>
                            <input
                                type="tel"
                                name="mobile"
                                value={formData.mobile}
                                onChange={handleChange}
                                className="w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                                placeholder={t('auth.mobile_placeholder')}
                                required
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-semibold text-navy-800 mb-1.5">{t('auth.password')}</label>
                            <PasswordInput
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                placeholder={t('auth.password_placeholder')}
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-semibold text-navy-800 mb-1.5">{t('auth.confirm_password')}</label>
                            <PasswordInput
                                name="confirmPassword"
                                value={formData.confirmPassword}
                                onChange={handleChange}
                                placeholder={t('auth.confirm_password_placeholder')}
                                required
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-semibold text-navy-800 mb-1.5">{t('auth.preferred_language')}</label>
                        <div className="relative">
                            <select
                                value={language}
                                onChange={(e) => setLanguage(e.target.value)}
                                className="appearance-none w-full px-4 py-3 rounded-xl border border-navy-200 focus:ring-2 focus:ring-orange-400 pr-10 cursor-pointer"
                                required
                            >
                                {Object.entries(languages).map(([code, name]) => (
                                    <option key={code} value={code}>{name}</option>
                                ))}
                            </select>
                            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-navy-400">
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>
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
                                {t('auth.creating_account')}
                            </span>
                        ) : (
                            t('auth.register_btn')
                        )}
                    </button>
                </form>

                <div className="mt-6 text-center text-sm text-navy-600 border-t border-navy-100 pt-6">
                    {t('auth.have_account_link')}{' '}
                    <Link to="/login" className="font-bold text-navy-800 hover:text-orange-500 transition-colors">
                        {t('auth.have_account_action')}
                    </Link>
                </div>
            </div>
        </div>
    );
}
