import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ShieldCheck, Lock, Mail, KeyRound, AlertCircle, ArrowLeft, Shield } from 'lucide-react';
import coopHubLogo from '../../../assets/branding/coop-hub-logo.png';
import { supabase } from '../../../lib/supabase';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [authMode, setAuthMode] = useState('password'); // 'password' | 'otp'
  const [adminId, setAdminId] = useState('');
  const [password, setPassword] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleDemoFill = () => {
    setAdminId('admin@coophub.in');
    setPassword('password123');
    setError(null);
  };

  const handleSendOtp = async (e) => {
    e.preventDefault();
    if (!adminId.trim()) {
      setError('Please enter your Administrator ID or Email');
      return;
    }
    setLoading(true);
    setError(null);
    try {
      // If demo admin
      if (adminId === 'admin@coophub.in' || adminId === 'ADM-CHE-001') {
        setOtpSent(true);
        setLoading(false);
        return;
      }

      const { error: otpErr } = await supabase.auth.signInWithOtp({ email: adminId });
      if (otpErr) throw otpErr;
      setOtpSent(true);
    } catch (err) {
      setError(err.message || 'Failed to send OTP to registered Admin contact.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      // 🧪 DEMO ADMIN BYPASS
      if (
        (adminId === 'admin@coophub.in' || adminId === 'ADM-CHE-001') &&
        (password === 'password123' || otp === '123456' || otp === '489201' || otpSent)
      ) {
        localStorage.setItem('coophub_demo_admin', 'true');
        localStorage.removeItem('coophub_demo_user');
        localStorage.removeItem('coophub_demo_customer');
        navigate('/admin');
        return;
      }

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

      localStorage.removeItem('coophub_demo_admin');
      localStorage.removeItem('coophub_demo_user');
      localStorage.removeItem('coophub_demo_customer');
      navigate('/admin');
    } catch (err) {
      setError(err.message || 'Invalid administrator credentials. Access restricted.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen flex items-center justify-center px-4 py-8 text-white relative overflow-hidden"
      style={{ background: "linear-gradient(135deg, #050A12 0%, #162238 50%, #050A12 100%)" }}
    >
      {/* Background ambient lighting */}
      <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full bg-navy-900/80 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10">
        
        {/* Top return link */}
        <div className="flex items-center justify-between mb-6">
          <Link to="/" className="inline-flex items-center gap-2 text-xs text-navy-300 hover:text-white transition-colors">
            <ArrowLeft size={14} /> Back to Portal Selection
          </Link>
          <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-1 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20">
            <Shield size={12} /> Cooperative Admin
          </span>
        </div>

        {/* Logo & Header */}
        <div className="text-center mb-6">
          <img src={coopHubLogo} alt="COOP HUB" className="w-20 h-auto mx-auto mb-4 brightness-110 drop-shadow-md" />
          <h1 className="text-2xl font-bold tracking-tight text-white">Admin Management Portal</h1>
          <p className="text-navy-300 text-xs mt-1">Authorized Cooperative Administrative Officers Only</p>
        </div>

        {/* Notice: No Public Registration */}
        <div className="mb-5 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs flex items-center gap-2.5">
          <ShieldCheck size={16} className="text-blue-400 shrink-0" />
          <span>Internal administrative accounts are strictly pre-provisioned. No public registration.</span>
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
            Password Login
          </button>
          <button
            type="button"
            onClick={() => { setAuthMode('otp'); setError(null); }}
            className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
              authMode === 'otp' ? 'bg-orange-500 text-navy-950 shadow-md font-bold' : 'text-navy-300 hover:text-white'
            }`}
          >
            Admin ID / OTP
          </button>
        </div>

        {/* Form */}
        <form onSubmit={authMode === 'otp' && !otpSent ? handleSendOtp : handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-navy-200 mb-1.5">
              {authMode === 'otp' ? 'Administrator ID or Email' : 'Admin Email / ID'}
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-navy-400">
                <Mail size={16} />
              </div>
              <input
                type="text"
                value={adminId}
                onChange={(e) => setAdminId(e.target.value)}
                placeholder="e.g. admin@coophub.in or ADM-001"
                className="w-full pl-10 pr-4 py-3 bg-black/30 border border-white/10 rounded-xl text-white text-sm focus:outline-none focus:border-orange-400 focus:ring-1 focus:ring-orange-400 placeholder:text-navy-500 transition-all"
                required
              />
            </div>
          </div>

          {authMode === 'password' && (
            <div>
              <label className="block text-xs font-semibold text-navy-200 mb-1.5">Password</label>
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
              <label className="block text-xs font-semibold text-navy-200 mb-1.5">6-Digit Admin Verification PIN</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-navy-400">
                  <KeyRound size={16} />
                </div>
                <input
                  type="text"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="Enter 6-digit PIN"
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
              ? 'Verifying Security Clearance...'
              : authMode === 'otp' && !otpSent
              ? 'Send Admin OTP'
              : 'Authenticate & Access Admin Portal'}
          </button>
        </form>

        {/* Quick Demo Fill Button */}
        <div className="mt-5 pt-5 border-t border-white/10 text-center">
          <button
            type="button"
            onClick={handleDemoFill}
            className="text-xs text-orange-400 hover:text-orange-300 font-medium transition-colors"
          >
            ⚡ Quick-fill Demo Admin Credentials
          </button>
        </div>

      </div>
    </div>
  );
}
