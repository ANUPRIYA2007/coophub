import React, { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, UserPlus, LogIn, Lock } from 'lucide-react';
import { CustomerPortalIcon, PillarPortalIcon, AdminPortalIcon } from '../components/common/PortalCardIcons';
import coopHubLogo from '../assets/branding/coop-hub-logo.png';
import LanguageSelector from '../components/ui/LanguageSelector';
import { useTranslation } from '../hooks/useTranslation';
import { gsap3dEngine } from '../services/animation/gsap3dEngine';
import gsap from 'gsap';
import WorkerEcosystemBackground from '../components/landing/WorkerEcosystemBackground';

export default function Landing() {
    const { t } = useTranslation();
    const navigate = useNavigate();
    const heroBadgeRef = useRef(null);
    const titleRef = useRef(null);
    const cardsContainerRef = useRef(null);

    useEffect(() => {
        const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

        if (heroBadgeRef.current) {
            tl.fromTo(
                heroBadgeRef.current,
                { opacity: 0, y: -10 },
                { opacity: 1, y: 0, duration: 0.5 }
            );
        }

        if (titleRef.current) {
            tl.fromTo(
                titleRef.current,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.5 },
                '-=0.2'
            );
        }

        if (cardsContainerRef.current) {
            const cards = cardsContainerRef.current.children;
            gsap3dEngine.animate3DStaggerEntrance(cards, {
                y: 15,
                stagger: 0.06,
                duration: 0.45,
            });
        }
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-navy-950 to-slate-900 text-white relative overflow-hidden flex flex-col justify-between perspective-container">
            {/* Ambient decorative 3D glow */}
            <div className="absolute top-0 right-1/4 w-96 h-96 bg-orange-500/10 rounded-full blur-3xl pointer-events-none anim-float-3d" />
            <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none anim-float-3d" style={{ animationDelay: '-1.8s' }} />

            {/* GSAP-Animated Skilled-Worker Ecosystem Background Layer */}
            <WorkerEcosystemBackground />

            {/* Top Navigation */}
            <header className="max-w-7xl mx-auto w-full px-6 py-6 flex items-center justify-between relative z-10">
                <div className="flex items-center space-x-3 gsap-3d-nav">
                    <img src={coopHubLogo} alt="COOP HUB" className="w-28 sm:w-36 h-auto drop-shadow-md brightness-110" />
                </div>
                <div className="w-40 gsap-3d-nav">
                    <LanguageSelector />
                </div>
            </header>

            {/* Main Role Selection Hero */}
            <main className="max-w-6xl mx-auto px-6 py-8 flex-1 flex flex-col justify-center relative z-10 w-full">
                <div className="text-center mb-10 max-w-3xl mx-auto">
                    <div
                        ref={heroBadgeRef}
                        className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-orange-500/10 border border-orange-500/30 text-orange-400 text-xs font-semibold uppercase tracking-wider mb-4 shadow-inner"
                        style={{ transformStyle: 'preserve-3d' }}
                    >
                        <Sparkles size={14} /> {t("Unified Cooperative Service Ecosystem")}
                    </div>
                    <div ref={titleRef}>
                        <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
                            {t("Select Your Portal to Get Started")}
                        </h1>
                        <p className="text-navy-300 text-sm sm:text-base mt-3 max-w-xl mx-auto leading-relaxed">
                            {t("Dedicated authenticated portals designed for Customers, Certified Pillar Technicians, and Cooperative Administrators.")}
                        </p>
                    </div>
                </div>

                {/* 3 Portal Selection Cards with 3D Physics */}
                <div
                    ref={cardsContainerRef}
                    className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto w-full"
                    style={{ transformStyle: 'preserve-3d' }}
                >
                    {/* 1. Customer Portal */}
                    <div
                        data-3d-card
                        className="gsap-3d-card bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-orange-500/50 rounded-3xl p-7 transition-all duration-300 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-orange-500/20 group cursor-pointer"
                    >
                        <div>
                            <div 
                                style={{
                                    background: 'linear-gradient(135deg, rgba(234, 88, 12, 0.4) 0%, rgba(124, 45, 18, 0.45) 100%)',
                                    border: '1.5px solid rgba(249, 115, 22, 0.75)',
                                    boxShadow: '0 0 22px rgba(249, 115, 22, 0.42), inset 0 0 12px rgba(249, 115, 22, 0.25)'
                                }}
                                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-all shadow-md"
                            >
                                <CustomerPortalIcon size={34} />
                            </div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-orange-400">{t("Consumers")}</span>
                            <h2 className="text-xl font-bold text-white mt-1 mb-2">{t("Customer Portal")}</h2>
                            <p className="text-navy-300 text-xs leading-relaxed mb-6">
                                {t("Book verified home services with real-time GPS tracking, OTP arrival verification, extra charge approval, and AI assistance.")}
                            </p>
                        </div>

                        <div className="space-y-2.5 pt-4 border-t border-white/10">
                            <button
                                data-3d-btn
                                onClick={() => navigate('/login')}
                                className="gsap-3d-btn w-full py-3 px-4 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20 transition-all"
                            >
                                <LogIn size={15} />
                                <span>{t("Customer Login (Email / OTP)")}</span>
                            </button>
                            <button
                                data-3d-btn
                                onClick={() => navigate('/register')}
                                className="gsap-3d-btn w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-navy-200 hover:text-white border border-white/10 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                            >
                                <UserPlus size={14} />
                                <span>{t("New Customer? Register")}</span>
                            </button>
                        </div>
                    </div>

                    {/* 2. Pillar Partner Portal */}
                    <div
                        data-3d-card
                        className="gsap-3d-card bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-blue-500/50 rounded-3xl p-7 transition-all duration-300 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-blue-500/20 group cursor-pointer"
                    >
                        <div>
                            <div 
                                style={{
                                    background: 'linear-gradient(135deg, rgba(37, 99, 235, 0.4) 0%, rgba(30, 58, 138, 0.45) 100%)',
                                    border: '1.5px solid rgba(59, 130, 246, 0.75)',
                                    boxShadow: '0 0 22px rgba(59, 130, 246, 0.42), inset 0 0 12px rgba(59, 130, 246, 0.25)'
                                }}
                                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-all shadow-md"
                            >
                                <PillarPortalIcon size={34} />
                            </div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-blue-400">{t("Service Partners")}</span>
                            <h2 className="text-xl font-bold text-white mt-1 mb-2">{t("Pillar Portal")}</h2>
                            <p className="text-navy-300 text-xs leading-relaxed mb-6">
                                {t("Manage incoming bookings, verify doorstep OTP, chat with customers, request extra charges, and track cooperative earnings.")}
                            </p>
                        </div>

                        <div className="space-y-2.5 pt-4 border-t border-white/10">
                            <button
                                data-3d-btn
                                onClick={() => navigate('/pillar/login')}
                                className="gsap-3d-btn w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20 transition-all"
                            >
                                <LogIn size={15} />
                                <span>{t("Pillar Login (ID + OTP)")}</span>
                            </button>
                            <button
                                data-3d-btn
                                onClick={() => navigate('/pillar/register')}
                                className="gsap-3d-btn w-full py-2.5 px-4 rounded-xl bg-white/5 hover:bg-white/10 text-navy-200 hover:text-white border border-white/10 font-semibold text-xs flex items-center justify-center gap-2 transition-all"
                            >
                                <UserPlus size={14} />
                                <span>{t("Register as a Pillar Partner")}</span>
                            </button>
                        </div>
                    </div>

                    {/* 3. Cooperative Admin Portal */}
                    <div
                        data-3d-card
                        className="gsap-3d-card bg-white/5 hover:bg-white/10 backdrop-blur-xl border border-white/10 hover:border-emerald-500/50 rounded-3xl p-7 transition-all duration-300 flex flex-col justify-between shadow-xl hover:shadow-2xl hover:shadow-emerald-500/20 group cursor-pointer"
                    >
                        <div>
                            <div 
                                style={{
                                    background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.4) 0%, rgba(6, 78, 59, 0.45) 100%)',
                                    border: '1.5px solid rgba(34, 197, 94, 0.75)',
                                    boxShadow: '0 0 22px rgba(34, 197, 94, 0.42), inset 0 0 12px rgba(34, 197, 94, 0.25)'
                                }}
                                className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-all shadow-md"
                            >
                                <AdminPortalIcon size={34} />
                            </div>
                            <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">{t("Cooperative Authority")}</span>
                            <h2 className="text-xl font-bold text-white mt-1 mb-2">{t("Admin Portal")}</h2>
                            <p className="text-navy-300 text-xs leading-relaxed mb-6">
                                {t("Platform administration, verify and approve pillars, manage service catalogue, audit live orders, and inspect welfare finance.")}
                            </p>
                        </div>

                        <div className="space-y-2.5 pt-4 border-t border-white/10">
                            <button
                                data-3d-btn
                                onClick={() => navigate('/admin/login')}
                                className="gsap-3d-btn w-full py-3 px-4 rounded-xl bg-amber-500 hover:bg-amber-400 text-navy-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 transition-all"
                            >
                                <Lock size={15} />
                                <span>{t("Admin Login (ID + OTP)")}</span>
                            </button>
                            <div className="py-2.5 px-4 rounded-xl bg-black/30 border border-white/5 text-[11px] text-navy-400 text-center font-medium">
                                🔒 {t("Internal access only (No registration)")}
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="max-w-7xl mx-auto w-full px-6 py-6 text-center text-xs text-navy-400 relative z-10 border-t border-white/5">
                © {new Date().getFullYear()} COOP HUB. {t("Connect | Serve | Empower. All rights reserved.")}
            </footer>
        </div>
    );
}
