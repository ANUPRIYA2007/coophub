import { useState, useEffect } from 'react';
import { Outlet, NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';
import LanguageSelector from '../ui/LanguageSelector';
import coopHubLogo from '../../assets/branding/coop-hub-logo.png';
import { supabase } from '../../lib/supabase';
import { notificationSyncService } from '../../services/notifications/notificationSyncService';
import {
    Sun,
    Moon,
    LayoutDashboard,
    Compass,
    CalendarCheck,
    History,
    HelpCircle,
    Settings,
    LogOut,
    Bell
} from 'lucide-react';
import GlobalHeroAgent from '../ai/GlobalHeroAgent';
import GradientText from '../ui/GradientText';

export default function CustomerPortalLayout() {
    const { profile, user, signOut } = useAuth();
    const { theme, toggleTheme, isDark } = useTheme();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Enforce the standard signature light color theme for Customer Portal
    useEffect(() => {
        if (theme === 'dark') {
            toggleTheme();
        }
    }, []);

    // Fetch dynamic unread notification count for header badge
    useEffect(() => {
        let isMounted = true;

        const fetchUnread = async () => {
            const count = await notificationSyncService.getCustomerUnreadCount(profile, user);
            if (isMounted) {
                setUnreadCount(count);
            }
        };

        fetchUnread();

        const handleNotifUpdate = () => {
            fetchUnread();
        };

        window.addEventListener('coophub_notifications_updated', handleNotifUpdate);

        // Realtime subscription for incoming alerts
        const channel = supabase
            .channel(`customer_notifs_sync_${Date.now()}`)
            .on('postgres_changes', { event: '*', schema: 'public', table: 'notifications' }, () => {
                fetchUnread();
            })
            .on('postgres_changes', { event: '*', schema: 'public', table: 'service_requests' }, () => {
                fetchUnread();
            })
            .subscribe();

        return () => {
            isMounted = false;
            window.removeEventListener('coophub_notifications_updated', handleNotifUpdate);
            supabase.removeChannel(channel);
        };
    }, [profile, user]);

    const customerName = profile?.full_name?.trim()?.split(' ')[0] || '';

    // Sidebar navigation items — Notifications & Profile are in the top header
    const navItems = [
        { to: '/home', label: t('Dashboard'), icon: LayoutDashboard },
        { to: '/services', label: t('Services'), icon: Compass },
        { to: '/requests', label: t('Bookings'), icon: CalendarCheck },
        { to: '/history', label: t('History'), icon: History },
        { to: '/support', label: t('Help & Support'), icon: HelpCircle },
        { to: '/settings', label: t('Settings'), icon: Settings },
    ];

    return (
        <div className="flex h-screen overflow-hidden bg-surface">
            {/* ─── Mobile Overlay ─── */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 bg-black/40 z-40 lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* ─── Sidebar ─── */}
            <aside
                className={`
                    fixed inset-y-0 left-0 z-50 w-64 bg-navy-900 border-r border-navy-800
                    flex flex-col transform transition-transform duration-200 ease-in-out
                    lg:relative lg:translate-x-0
                    ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
                `}
            >
                {/* Logo */}
                <Link to="/home" title="CoopHub Customer Dashboard Home" className="flex items-center space-x-3 px-5 py-5 border-b border-navy-800 hover:bg-navy-800/40 transition-colors">
                    <img src={coopHubLogo} alt="COOP HUB" className="w-9 h-auto" />
                    <GradientText
                        colors={["#FF7900","#FFFFFF","#FF7900"]}
                        animationSpeed={8}
                        showBorder={false}
                        className="font-bold text-lg tracking-tight"
                    >
                        COOP HUB
                    </GradientText>
                </Link>

                {/* Portal Label */}
                <div className="px-5 py-3.5 border-b border-navy-800 flex items-center justify-between">
                    <div className="flex items-center gap-2 px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-orange-500 shadow-[0_0_8px_#FF7900]" />
                        <span className="font-semibold text-orange-400 text-xs tracking-wider uppercase font-sans">
                            {t('COOP Customer')}
                        </span>
                    </div>
                </div>

                {/* Navigation */}
                <div className="flex-1 overflow-y-auto py-3 px-3 space-y-1.5 hide-scrollbar">
                    {navItems.map(item => {
                        const IconComponent = item.icon;
                        return (
                            <NavLink
                                key={item.to}
                                to={item.to}
                                onClick={() => setSidebarOpen(false)}
                                className={({ isActive }) =>
                                    `group flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                                        isActive
                                            ? 'bg-gradient-to-r from-orange-500/20 to-orange-500/5 text-orange-400 font-semibold border-l-4 border-orange-500 shadow-sm shadow-orange-500/10'
                                            : 'text-slate-400 hover:text-white hover:bg-white/[0.06]'
                                    }`
                                }
                            >
                                {({ isActive }) => (
                                    <>
                                        <IconComponent
                                            size={19}
                                            className={`transition-colors duration-200 flex-shrink-0 ${
                                                isActive ? 'text-orange-400' : 'text-slate-400 group-hover:text-white'
                                            }`}
                                        />
                                        <span className="tracking-normal font-sans text-[13.5px]">
                                            {item.label}
                                        </span>
                                    </>
                                )}
                            </NavLink>
                        );
                    })}
                </div>

                {/* Hero AI Interactive Assistant */}
                <div className="border-t border-navy-800 bg-navy-950/60 shrink-0">
                    <GlobalHeroAgent inline={true} />
                </div>

                {/* Logout */}
                <div className="px-3 py-3 border-t border-navy-800">
                    <button
                        onClick={async () => { await signOut(); navigate('/'); }}
                        className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors w-full border border-transparent font-sans"
                    >
                        <LogOut size={18} />
                        <span>{t('Log Out')}</span>
                    </button>
                </div>
            </aside>

            {/* ─── Main Area ─── */}
            < div className="flex-1 flex flex-col min-w-0 overflow-hidden" >
                {/* ─── Top Header ─── */}
                <header className="bg-white border-b border-navy-100/60 shadow-xs z-30 shrink-0">
                    <div className="flex items-center justify-between px-4 py-3">
                        {/* Left: Mobile hamburger */}
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden p-2 rounded-lg hover:bg-navy-50 text-navy-500 transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                                </svg>
                            </button>
                            {/* Title removed as per user request to avoid redundancy with sidebar */}
                        </div>

                        {/* Right: controls */}
                        <div className="flex items-center space-x-3">
                            <LanguageSelector />

                            {/* Dark Mode Switcher */}
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-full hover:bg-navy-50 transition-colors text-navy-500"
                                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            >
                                {isDark ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} className="text-navy-600" />}
                            </button>

                            {/* Notification bell — ONLY location for notifications */}
                            <button
                                onClick={() => navigate('/notifications')}
                                className="relative p-2 rounded-full hover:bg-navy-50 transition-colors text-navy-500"
                                id="customer-header-bell-btn"
                                title="Notifications"
                            >
                                <Bell size={20} className={unreadCount > 0 ? "text-orange-500" : "text-navy-500"} />
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center shadow-xs leading-none pointer-events-none">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Profile avatar */}
                            <button
                                onClick={() => navigate('/profile')}
                                className="w-9 h-9 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white shadow-sm hover:shadow-md transition-shadow"
                            >
                                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </button>
                        </div>
                    </div>
                </header >

                {/* ─── Page Content (Outlet) ─── */}
                <main className="flex-1 overflow-y-auto bg-surface">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
