import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { useTranslation } from '../../hooks/useTranslation';
import authService from '../../services/auth/authService';
import coopHubLogo from '../../assets/branding/coop-hub-logo.png';
import {
  CheckCircle2, Mail, ExternalLink, ArrowRight, ShieldCheck,
  RefreshCw, Sparkles, HeartHandshake, AlertCircle
} from 'lucide-react';

export default function VerifyOtp() {
    const { t } = useTranslation();
    const [searchParams] = useSearchParams();
    const email = searchParams.get('email') || '';
    const navigate = useNavigate();

    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const [resendLoading, setResendLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [cooldown, setCooldown] = useState(60);

    // Countdown Timer
    useEffect(() => {
        if (cooldown <= 0) return;
        const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
        return () => clearInterval(timer);
    }, [cooldown]);

    // Direct OTP Code Verification
    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!email) return;

        if (otp.length < 6 || otp.length > 8 || !/^\d+$/.test(otp)) {
            setError(t('validation.invalid_otp') || 'Please enter a valid OTP code');
            return;
        }

        setLoading(true);
        setError(null);
        setSuccess(null);

        try {
            await authService.verifyOtp(email, otp);
            setSuccess('Email successfully verified! Welcome to COOP HUB.');
            setTimeout(() => {
                navigate('/home');
            }, 1200);
        } catch (err) {
            if (err.message && err.message.includes('expired')) {
                setError(t('errors.expired_otp') || 'OTP has expired. Please request a new code.');
            } else {
                setError(err.message || t('errors.invalid_otp') || 'Invalid OTP code. Please check your email.');
            }
        } finally {
            setLoading(false);
        }
    };

    // Resend Email / OTP
    const handleResend = async () => {
        if (cooldown > 0 || !email) return;

        setResendLoading(true);
        setError(null);
        try {
            await authService.sendOtp(email);
            setSuccess('Verification email / OTP resent successfully! Please check your inbox or Spam folder.');
            setCooldown(60);
        } catch (err) {
            setError(err.message || 'Unable to resend email. Please try again shortly.');
        } finally {
            setResendLoading(false);
        }
    };

    // Dynamically detect email provider for any user email
    const getMailboxInfo = (userEmail) => {
        if (!userEmail) return { url: 'https://mail.google.com', label: 'Open Mailbox' };
        
        const lower = userEmail.toLowerCase();
        if (lower.includes('@yahoo.')) {
            return { url: 'https://mail.yahoo.com', label: 'Open Yahoo Mail' };
        }
        if (lower.includes('@outlook.') || lower.includes('@hotmail.') || lower.includes('@live.')) {
            return { url: 'https://outlook.live.com/mail/', label: 'Open Outlook Mail' };
        }
        if (lower.includes('@zoho.')) {
            return { url: 'https://mail.zoho.com', label: 'Open Zoho Mail' };
        }
        if (lower.includes('@proton.')) {
            return { url: 'https://mail.proton.me', label: 'Open Proton Mail' };
        }
        
        // Gmail and all Google Workspace domains (e.g. .edu, .ac.in, custom domains)
        return {
            url: `https://accounts.google.com/AccountChooser?Email=${encodeURIComponent(userEmail)}&continue=${encodeURIComponent(`https://mail.google.com/mail/?authuser=${encodeURIComponent(userEmail)}`)}`,
            label: lower.includes('@gmail.com') ? 'Open Gmail Inbox' : 'Open Email Inbox'
        };
    };

    const { url: emailProviderUrl, label: mailboxButtonLabel } = getMailboxInfo(email);

    return (
        <div 
            className="min-h-screen flex items-center justify-center px-4 py-10"
            style={{ background: "linear-gradient(135deg, #050A12 0%, #162238 50%, #050A12 100%)" }}
        >
            <div className="max-w-xl w-full bg-white/95 backdrop-blur-xl rounded-3xl p-8 sm:p-10 shadow-2xl border border-white/20 text-center relative overflow-hidden">
                
                {/* Background ambient glow */}
                <div className="absolute -top-20 -right-20 w-48 h-48 bg-orange-500/10 rounded-full blur-3xl pointer-events-none"></div>
                <div className="absolute -bottom-20 -left-20 w-48 h-48 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

                {/* Brand Header */}
                <div className="flex flex-col items-center mb-6">
                    <img src={coopHubLogo} alt="COOP HUB" className="w-20 h-auto mb-3" />
                    
                    {/* Success Icon Badge */}
                    <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mb-3 shadow-inner border border-emerald-100 relative">
                        <CheckCircle2 size={36} className="text-emerald-500 animate-bounce" />
                        <span className="absolute -top-1 -right-1 flex h-4 w-4">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                        </span>
                    </div>

                    <div className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-orange-50 border border-orange-200 text-orange-700 text-xs font-bold mb-2">
                        <HeartHandshake size={14} className="text-orange-500" />
                        <span>Welcome to the COOP HUB Family!</span>
                    </div>

                    <h1 className="text-2xl sm:text-3xl font-extrabold text-navy-900 leading-tight">
                        Account Registered Successfully!
                    </h1>
                    <p className="text-navy-500 text-sm mt-1 max-w-md">
                        Your account has been created. Please confirm your email address to activate all cooperative services.
                    </p>
                </div>

                {/* Email Highlight Box */}
                <div className="bg-navy-50/80 border border-navy-100 rounded-2xl p-4 mb-6 text-left space-y-2.5">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-bold uppercase tracking-wider text-navy-400">Confirmation Sent To:</span>
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-full">
                            <ShieldCheck size={12} /> Pending Verification
                        </span>
                    </div>
                    <div className="flex items-center gap-2 bg-white px-3.5 py-2.5 rounded-xl border border-navy-200/80 shadow-xs">
                        <Mail size={18} className="text-orange-500 shrink-0" />
                        <span className="font-mono text-sm sm:text-base font-bold text-navy-900 truncate">
                            {email || 'your-email@example.com'}
                        </span>
                    </div>
                    <p className="text-[12px] text-navy-500 leading-relaxed">
                        💡 Check your inbox (and <strong className="text-orange-600">Spam / Junk folder</strong>) for an email from <strong className="text-navy-700">COOP_HUB</strong> and click <strong className="text-navy-800">"Confirm your email address"</strong>.
                    </p>
                </div>

                {/* Error & Success Toasts */}
                {error && (
                    <div className="mb-5 p-3.5 rounded-2xl bg-red-50 text-red-700 text-xs sm:text-sm font-semibold border border-red-200 flex items-center gap-2 text-left">
                        <AlertCircle size={16} className="shrink-0 text-red-500" />
                        <span>{error}</span>
                    </div>
                )}

                {success && (
                    <div className="mb-5 p-3.5 rounded-2xl bg-emerald-50 text-emerald-700 text-xs sm:text-sm font-semibold border border-emerald-200 flex items-center gap-2 text-left">
                        <CheckCircle2 size={16} className="shrink-0 text-emerald-500" />
                        <span>{success}</span>
                    </div>
                )}

                {/* Direct Action Hub */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    <a
                        href={emailProviderUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn-primary py-3.5 px-4 rounded-2xl flex items-center justify-center gap-2 text-sm font-bold shadow-lg shadow-orange-500/20 transition-all hover:scale-[1.02]"
                    >
                        <Mail size={17} />
                        <span>{mailboxButtonLabel}</span>
                        <ExternalLink size={14} className="opacity-80" />
                    </a>

                    <button
                        type="button"
                        onClick={() => navigate('/login')}
                        className="py-3.5 px-4 rounded-2xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-sm transition-all flex items-center justify-center gap-2 shadow-md hover:scale-[1.02]"
                    >
                        <span>Proceed to Login</span>
                        <ArrowRight size={16} />
                    </button>
                </div>

                {/* Alternate Code Entry */}
                <div className="border-t border-navy-100 pt-5 mt-4">
                    <div className="flex items-center justify-center gap-2 mb-3">
                        <span className="h-px bg-navy-200 w-12"></span>
                        <span className="text-xs font-bold text-navy-400 uppercase tracking-wider">Or Enter OTP Code</span>
                        <span className="h-px bg-navy-200 w-12"></span>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <input
                            type="text"
                            id="otp"
                            value={otp}
                            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 8))}
                            className="w-full max-w-xs mx-auto text-center tracking-[0.4em] text-2xl font-bold font-mono px-4 py-3 rounded-2xl border-2 border-navy-200 focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-orange-500 transition-all bg-white"
                            placeholder="••••••"
                            maxLength={8}
                        />

                        <div>
                            <button
                                type="submit"
                                disabled={loading || otp.length < 6}
                                className="w-full max-w-xs mx-auto py-3 px-6 rounded-xl bg-orange-600 hover:bg-orange-700 disabled:opacity-50 text-white font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2"
                            >
                                {loading ? (
                                    <>
                                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>Verifying Code...</span>
                                    </>
                                ) : (
                                    <>
                                        <Sparkles size={16} />
                                        <span>Verify Code & Enter</span>
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>

                {/* Resend & Change Email Footer */}
                <div className="mt-6 pt-4 border-t border-navy-100 flex flex-col sm:flex-row items-center justify-between text-xs text-navy-500 gap-2">
                    <div>
                        {cooldown > 0 ? (
                            <span className="text-navy-400 font-medium">
                                Resend email in <strong>{cooldown}s</strong>
                            </span>
                        ) : (
                            <button
                                onClick={handleResend}
                                disabled={resendLoading}
                                className="font-bold text-orange-600 hover:text-orange-700 transition-colors flex items-center gap-1"
                                type="button"
                            >
                                <RefreshCw size={13} className={resendLoading ? 'animate-spin' : ''} />
                                <span>{resendLoading ? 'Sending...' : 'Resend Confirmation Email'}</span>
                            </button>
                        )}
                    </div>

                    <Link to="/register" className="font-semibold text-navy-600 hover:text-navy-900 transition-colors underline">
                        Change email or re-register
                    </Link>
                </div>

            </div>
        </div>
    );
}
