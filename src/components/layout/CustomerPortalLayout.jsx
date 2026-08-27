import { useState, useEffect } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useTranslation } from '../../hooks/useTranslation';
import LanguageSelector from '../ui/LanguageSelector';
import coopHubLogo from '../../assets/branding/coop-hub-logo.png';
import { supabase } from '../../lib/supabase';
import { Sun, Moon } from 'lucide-react';
import GlobalHeroAgent from '../ai/GlobalHeroAgent';

export default function CustomerPortalLayout() {
    const { profile, signOut } = useAuth();
    const { theme, toggleTheme, isDark } = useTheme();
    const { t } = useTranslation();
    const navigate = useNavigate();

    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [unreadCount, setUnreadCount] = useState(0);

    // Fetch unread notification count for header badge
    useEffect(() => {
        const fetchUnread = async () => {
            try {
                const { count } = await supabase
                    .from('notifications')
                    .select('id', { count: 'exact', head: true })
                    .eq('is_read', false);
                setUnreadCount(count || 0);
            } catch (e) { /* silent */ }
        };
        fetchUnread();
    }, []);

    const customerName = profile?.full_name?.trim()?.split(' ')[0] || '';

    // Sidebar navigation items — Notifications is NOT here (header-only)
    const navItems = [
        { to: '/home', label: t('navigation.dashboard') || 'Dashboard', icon: <HomeIcon /> },
        { to: '/services', label: t('navigation.find_services') || 'Find Services', icon: <ServicesIcon /> },
        { to: '/requests', label: t('navigation.my_requests') || 'My Requests', icon: <RequestsIcon /> },
        { to: '/messages', label: t('navigation.messages') || 'Messages', icon: <MessagesIcon /> },
        { to: '/history', label: t('navigation.history') || 'History', icon: <HistoryIcon /> },
        { to: '/support', label: t('navigation.support') || 'Support', icon: <SupportIcon /> },
        { to: '/settings', label: t('navigation.settings') || 'Settings', icon: <SettingsIcon /> },
        { to: '/profile', label: t('navigation.profile') || 'Profile', icon: <ProfileIcon /> },
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
                <div className="flex items-center space-x-3 px-5 py-5 border-b border-navy-800">
                    <img src={coopHubLogo} alt="COOP HUB" className="w-9 h-auto" />
                    <span className="font-bold text-white text-lg tracking-tight">COOP HUB</span>
                </div>

                {/* Profile Summary */}
                <div className="px-5 py-4 border-b border-navy-800">
                    <div className="flex items-center space-x-3">
                        <div className="w-10 h-10 bg-navy-800 text-orange-500 border border-orange-500/30 rounded-full flex items-center justify-center font-bold text-sm shrink-0">
                            {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                        </div>
                        <div className="overflow-hidden">
                            <p className="font-semibold text-white text-sm truncate">{profile?.full_name || 'Customer'}</p>
                            <p className="text-xs text-navy-400 truncate">{profile?.email || ''}</p>
                        </div>
                    </div>
                </div>

                {/* Navigation */}
                <nav className="flex-1 overflow-y-auto py-3 px-3">
                    {navItems.map(item => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            onClick={() => setSidebarOpen(false)}
                            className={({ isActive }) =>
                                `flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors mb-0.5 ${isActive
                                    ? 'bg-orange-500 text-white shadow-sm'
                                    : 'text-navy-300 hover:bg-navy-800 hover:text-white border border-transparent'
                                }`
                            }
                        >
                            <span className="w-5 h-5 shrink-0">{item.icon}</span>
                            <span>{item.label}</span>
                        </NavLink>
                    ))}
                </nav>

                <GlobalHeroAgent inline={true} />

                {/* Logout */}
                <div className="px-3 py-4 border-t border-navy-800">
                    <button
                        onClick={async () => { await signOut(); navigate('/'); }}
                        className="flex items-center space-x-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-400 hover:bg-red-500/10 hover:text-red-300 transition-colors w-full border border-transparent"
                    >
                        <LogoutIcon />
                        <span>{t('auth.logout') || 'Log Out'}</span>
                    </button>
                </div>
            </aside >

            {/* ─── Main Area ─── */}
            < div className="flex-1 flex flex-col min-w-0 overflow-hidden" >
                {/* ─── Top Header ─── */}
                < header className="bg-white border-b border-navy-100/50 shadow-sm z-30 shrink-0" >
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
                            <h2 className="font-semibold text-navy-800 text-base hidden sm:block">
                                {customerName ? `Welcome, ${customerName}` : (t('navigation.dashboard') || 'Customer Portal')}
                            </h2>
                        </div>

                        {/* Right: controls */}
                        <div className="flex items-center space-x-3">
                            <LanguageSelector />

                            {/* Dark Mode Switcher */}
                            <button
                                onClick={toggleTheme}
                                className="p-2 rounded-full hover:bg-navy-50 dark:hover:bg-slate-800 transition-colors text-navy-500 dark:text-slate-300"
                                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
                            >
                                {isDark ? <Sun size={19} className="text-amber-400" /> : <Moon size={19} className="text-navy-600" />}
                            </button>

                            {/* Notification bell — ONLY location for notifications */}
                            <button
                                onClick={() => navigate('/notifications')}
                                className="relative p-2 rounded-full hover:bg-navy-50 dark:hover:bg-slate-800 transition-colors text-navy-500 dark:text-slate-300"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                                </svg>
                                {unreadCount > 0 && (
                                    <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-orange-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                                        {unreadCount > 9 ? '9+' : unreadCount}
                                    </span>
                                )}
                            </button>

                            {/* Profile avatar */}
                            <button
                                onClick={() => navigate('/profile')}
                                className="w-9 h-9 bg-orange-100 dark:bg-orange-950 text-orange-600 dark:text-orange-400 rounded-full flex items-center justify-center font-bold text-sm border-2 border-white dark:border-slate-700 shadow-sm hover:shadow-md transition-shadow"
                            >
                                {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                            </button>
                        </div>
                    </div>
                </header >

                {/* ─── Page Content (Outlet) ─── */}
                < main className="flex-1 overflow-y-auto" >
                    <Outlet />
                </main >
            </div >
        </div >
    );
}

/* ─── Inline SVG Icon Components ─── */
function HomeIcon() {
    return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>;
}
function ServicesIcon() {
    return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" /></svg>;
}
function RequestsIcon() {
    return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15a2.25 2.25 0 012.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25z" /></svg>;
}
function MessagesIcon() {
    return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" /></svg>;
}
function HistoryIcon() {
    return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>;
}
function SupportIcon() {
    return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M16.712 4.33a9.027 9.027 0 011.652 1.306c.51.51.944 1.064 1.306 1.652M16.712 4.33l-3.448 4.138m3.448-4.138a9.014 9.014 0 00-9.424 0M19.67 7.288l-4.138 3.448m4.138-3.448a9.014 9.014 0 010 9.424m-1.306 1.652a9.027 9.027 0 01-1.652 1.306m0 0l-3.448-4.138m3.448 4.138a9.014 9.014 0 01-9.424 0m-1.652-1.306a9.027 9.027 0 01-1.306-1.652m0 0l4.138-3.448M4.33 16.712a9.014 9.014 0 010-9.424m4.138 3.448a3.012 3.012 0 114.243 4.243m-4.243-4.243L4.33 7.288" /></svg>;
}
function SettingsIcon() {
    return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>;
}
function ProfileIcon() {
    return <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" /></svg>;
}
function LogoutIcon() {
    return <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15m3 0l3-3m0 0l-3-3m3 3H9" /></svg>;
}
