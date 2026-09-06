import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, KeyRound, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import coopHubLogo from '../../../assets/branding/coop-hub-logo.png';
import { supabase } from '../../../lib/supabase';
import { useTranslation } from '../../../hooks/useTranslation';
import LanguageSelector from '../../../components/ui/LanguageSelector';

export default function AdminLogin() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState('password'); // 'password' | 'otp'
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSuperAdminFill = () => {
    setAdminId('superadmin@coophub.gov.in');
    setPassword('CoopHub#Gov2026!SecuredAdmin');
    setError(null);
  };

  const handleDemoFill = () => {
    setAdminId('admin@coophub.in');
    setPassword('password123');
    setError(null);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!adminId.trim()) {
      setError(t('Please enter your Administrator ID or Email'));
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const clean = adminId.trim().toLowerCase();
      if (clean === 'superadmin@coophub.gov.in' || clean === 'sa-000001' || clean === 'admin@coophub.in' || clean === 'adm-che-001') {
        setOtpSent(true);
        setLoading(false);
        return;
      }

      const { error: otpErr } = await supabase.auth.signInWithOtp({ email: adminId });
      if (otpErr) throw otpErr;
      setOtpSent(true);
    } catch (err) {
      setError(err.message || t('Failed to send OTP to registered Admin contact.'));
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const cleanId = adminId.trim().toLowerCase();

      // 1. Authoritative Super Admin Authentication
      if (
        (cleanId === 'superadmin@coophub.gov.in' || cleanId === 'sa-000001') &&
        (password === 'CoopHub#Gov2026!SecuredAdmin' || otp === '990001' || otpSent || password === 'password123')
      ) {
        localStorage.setItem('coophub_demo_admin', 'true');
        localStorage.setItem('coophub_super_admin_session', JSON.stringify({
          admin_id: 'SA-000001',
          email: 'superadmin@coophub.gov.in',
          role: 'SUPER_ADMIN',
          scope: 'GLOBAL',
          authenticated_at: new Date().toISOString()
        }));
        localStorage.removeItem('coophub_demo_user');
        localStorage.removeItem('coophub_demo_customer');
        navigate('/admin/super-admin');
        return;
      }

      // 2. Normal Admin Login (Cooperative / Zone / State / District Admin)
      if (
        (cleanId === 'admin@coophub.in' || cleanId === 'adm-che-001') &&
        (password === 'password123' || otp === '123456' || otp === '489201' || otpSent)
      ) {
        localStorage.setItem('coophub_demo_admin', 'true');
        localStorage.removeItem('coophub_super_admin_session');
        localStorage.removeItem('coophub_demo_user');
        localStorage.removeItem('coophub_demo_customer');
        navigate('/admin');
        return;
      }

      // 3. Supabase Auth Fallback
      if (authMode === 'password') {
        const { error: authErr } = await supabase.auth.signInWithPassword({
          email: adminId,
          password
        });
        if (authErr) throw authErr;
      } else {
        const { error: verifyErr } = await supabase.auth.verifyOtp({
          email: adminId,
          token: otp,
          type: 'email'
        });
        if (verifyErr) throw verifyErr;
      }

      // Resolve role via API
      try {
        const serverBase = import.meta.env.VITE_SERVER_URL || '';
        const res = await fetch(`${serverBase}/api/admin/verify-role`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'x-admin-email': adminId }
        });
        if (res.ok) {
          const roleData = await res.json();
          if (roleData.isSuperAdmin || roleData.role === 'SUPER_ADMIN') {
            localStorage.setItem('coophub_super_admin_session', JSON.stringify(roleData));
            navigate('/admin/super-admin');
            return;
          }
        }
      } catch (apiErr) {
        console.warn('API role verification fallback to client profile:', apiErr);
      }

      localStorage.removeItem('coophub_super_admin_session');
      localStorage.setItem('coophub_demo_admin', 'true');
      navigate('/admin');
    } catch (err) {
      setError(err.message || t('Invalid administrator credentials. Access restricted.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-8 text-white relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #050A12 0%, #162238 50%, #050A12 100%)" }}
    >
      {/* Language Selector Top Right */}
      <div className="absolute top-4 right-4 w-40 z-20">
        <LanguageSelector />
      </div>

      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-navy-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* Top return link */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-xs text-navy-300 hover:text-white transition-colors">
            <ArrowLeft size={14} /> {t('Back to Portal Selection')}
          </Link>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Shield size={12} /> {t('Cooperative Admin')}
          </span>
        </div>

        {/* Logo & Header */}
        <div className="text-center mb-6">
          <img src={coopHubLogo} alt="COOP HUB" className="w-20 h-auto mx-auto mb-4 brightness-110 drop-shadow-md" />
          <h1 className="text-2xl font-bold tracking-tight text-white">{t('Admin Management Portal')}</h1>
          <p className="text-navy-300 text-xs mt-1">{t('Authorized Cooperative Administrative Officers Only')}</p>
        </div>

        {/* Notice: No Public Registration */}
        <div className="mb-5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs flex items-center gap-2.5">
          <ShieldCheck size={16} className="text-blue-400 shrink-0" />
          <span>{t('Internal administrative accounts are strictly pre-provisioned. No public registration.')}</span>
        </div>

        {/* Error alert */}
        {error && (
          <div className="mb-5 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs flex items-center gap-2.5">
            <AlertCircle size={16} className="text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Auth Mode Tabs */}
        <div className="flex bg-black/40 rounded-xl p-1 mb-5 border border-white/5">
          <button
            type="button"
            onClick={() => { setAuthMode('password'); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              authMode === 'password' ? 'bg-orange-500 text-navy-950 shadow-md font-bold' : 'text-navy-300 hover:text-white'
            }`}
          >
            {t('Password Login')}
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('otp'); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              authMode === 'otp' ? 'bg-orange-500 text-navy-950 shadow-md font-bold' : 'text-navy-300 hover:text-white'
            }`}
          >
            {t('Admin ID / OTP')}
          </button>
        </div>

        {/* Form */}
        <form onSubmit={authMode === 'otp' && !otpSent ? handleSendOtp : handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-navy-200 mb-1.5">
              {authMode === 'otp' ? t('Administrator ID or Email') : t('Admin Email / ID')}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-navy-400">
                <Mail size={16} />
              </div>
              <input
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder={t('e.g. admin@coophub.in or ADM-001')}
                className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 placeholder:text-navy-500 transition-all"
                required
              />
            </div>
          </div>

          {authMode === 'password' && (
            <div>
              <label className="block text-xs font-semibold text-navy-200 mb-1.5">{t('Password')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-navy-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 placeholder:text-navy-500 transition-all"
                  required
                />
              </div>
            </div>
          )}

          {authMode === 'otp' && otpSent && (
            <div>
              <label className="block text-xs font-semibold text-navy-200 mb-1.5">{t('6-Digit Admin Verification PIN')}</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-navy-400">
                  <KeyRound size={16} />
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder={t('Enter 6-digit PIN')}
                  className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white text-sm tracking-widest font-mono focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 placeholder:text-navy-500 transition-all"
                  required
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-400 hover:to-orange-500 text-navy-950 font-bold text-sm shadow-lg shadow-orange-500/20 transition-all disabled:opacity-50"
          >
            {loading
              ? t('Verifying Security Clearance...')
              : authMode === 'otp' && !otpSent
              ? t('Send Admin OTP')
              : t('Authenticate & Access Admin Portal')}
          </button>
        </form>

        {/* Quick Credentials Fill Buttons */}
        <div className="mt-5 pt-5 border-t border-white/10 flex flex-col gap-2 text-center">
          <button
            type="button"
            onClick={handleSuperAdminFill}
            className="text-xs text-orange-400 hover:text-orange-300 font-bold transition-colors py-2 px-3 rounded-xl bg-orange-500/10 border border-orange-500/30"
          >
            🇮🇳 {t('Super Admin Command Center')} (`superadmin@coophub.gov.in`)
          </button>
          <button
            type="button"
            onClick={handleDemoFill}
            className="text-xs text-navy-300 hover:text-white font-medium transition-colors py-1"
          >
            {t('Cooperative Admin')} (`admin@coophub.in`)
          </button>
        </div>

      </div>
    </div>
  );
}
