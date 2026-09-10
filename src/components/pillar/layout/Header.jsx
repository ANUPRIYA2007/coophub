import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { notificationSyncService } from "../../../services/notifications/notificationSyncService";
import { supabase } from "../../../lib/supabase";
import { Menu, Bell, Search, CheckCheck, Sun, Moon, Bot, Sparkles } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { heroNotificationHub } from "../../../services/ai/heroNotificationHub";

export default function Header({ toggleSidebar }) {
  const { t, language, changeLanguage, supportedLanguages } = useTranslation();
  const { user, profile, isAvailable } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith('/superadmin');
  const isAdmin = location.pathname.startsWith('/admin') || isSuperAdmin;
  const portalRole = isAdmin ? 'admin' : 'pillar';

  const [theme, setTheme] = useState(() => localStorage.getItem("coophub_theme") || "light");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Fetch Live Dynamic Notifications
  useEffect(() => {
    let isMounted = true;

    const fetchLiveNotifications = async () => {
      try {
        const res = await notificationSyncService.getPortalNotifications(portalRole, user?.id);
        if (isMounted) {
          setNotifications(res.notifications || []);
          setUnreadCount(res.unreadCount || 0);
        }
      } catch (err) {
        console.warn('Notifications fetch note:', err);
      }
    };

    fetchLiveNotifications();

    const handleSync = () => {
      fetchLiveNotifications();
    };

    window.addEventListener('coophub_notifications_updated', handleSync);

    const channel = supabase
      .channel(`header_notifs_sync_${portalRole}_${Date.now()}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        fetchLiveNotifications();
        
        const derivedTitle = payload.new.title || (payload.new.type ? payload.new.type.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ') : 'System Alert');
        const derivedMessage = payload.new.message || (payload.new.message_translations && payload.new.message_translations.en) || 'Notification update';

        // Announce through Hero AI
        heroNotificationHub.notify({
          id: payload.new.id,
          title: derivedTitle,
          message: derivedMessage,
          type: payload.new.type || 'system'
        });
      })
      .subscribe();

    // Fallback polling every 15 seconds in case table is not in supabase_realtime publication
    const pollInterval = setInterval(fetchLiveNotifications, 15000);

    return () => {
      isMounted = false;
      window.removeEventListener('coophub_notifications_updated', handleSync);
      supabase.removeChannel(channel);
      clearInterval(pollInterval);
    };
  }, [portalRole, user?.id]);

  // Sync theme with document
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("coophub_theme", theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === "dark" ? "light" : "dark"));
  };

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleToggleNotifications = () => {
    setShowNotifications(!showNotifications);
  };

  const markAllAsRead = async () => {
    const ids = notifications.map((n) => n.id);
    await notificationSyncService.markAllAsRead(ids);
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
  };

  const clearAllNotifications = async () => {
    const ids = notifications.map((n) => n.id);
    await notificationSyncService.clearAll(ids);
    setNotifications([]);
    setUnreadCount(0);
  };

  const handleNotificationClick = async (n) => {
    await notificationSyncService.markAsRead(n.id);
    setNotifications((prev) => prev.map((item) => item.id === n.id ? { ...item, is_read: true } : item));
    setUnreadCount((prev) => Math.max(0, prev - 1));
    setShowNotifications(false);
    if (isSuperAdmin) {
      navigate("/superadmin");
    } else if (isAdmin) {
      navigate("/admin/orders");
    } else {
      navigate("/dashboard/orders");
    }
  };

  const handleViewAll = () => {
    setShowNotifications(false);
    if (isSuperAdmin) {
      navigate("/superadmin");
    } else if (isAdmin) {
      navigate("/admin/orders");
    } else {
      navigate("/dashboard/notifications");
    }
  };

  return (
    <header 
      style={{
        height: "var(--header-height)",
        background: "var(--color-surface)",
        borderBottom: "1px solid var(--color-border)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 var(--space-4)",
        position: "sticky",
        top: 0,
        zIndex: 100,
        transition: "background 0.3s ease, border-color 0.3s ease",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-4)" }}>
        <button 
          className="btn-icon hide-on-desktop" 
          onClick={toggleSidebar}
          style={{ color: "var(--color-text)" }}
        >
          <Menu size={24} />
        </button>
        
        {/* Pillar Code Pill */}
        <div className="hide-on-mobile" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <span style={{ fontSize: "11px", padding: "2px 8px", borderRadius: "10px", background: "rgba(249, 115, 22, 0.12)", color: "var(--color-secondary, #f97316)", fontWeight: "700" }}>
            {profile?.pillar_code || "PIL-CHE-042"}
          </span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", position: "relative" }} ref={dropdownRef}>

        {/* Language Selector */}
        <select 
          className="form-input" 
          value={language} 
          onChange={(e) => changeLanguage(e.target.value)}
          style={{ height: "36px", padding: "0 24px 0 12px", fontSize: "0.875rem", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border-light)", background: "var(--color-surface)", color: "var(--color-text)" }}
        >
          {supportedLanguages.map(lang => (
            <option key={lang.code} value={lang.code} style={{ background: "var(--color-surface)", color: "var(--color-text)" }}>
              {lang.nativeName}
            </option>
          ))}
        </select>

        {/* Dark Mode / Light Mode Toggle Button */}
        <button
          className="btn-icon"
          onClick={toggleTheme}
          style={{
            borderRadius: "50%",
            padding: "8px",
            color: "var(--color-text)",
            background: "transparent",
            cursor: "pointer",
            transition: "transform 0.2s ease",
          }}
          title={theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
        >
          {theme === "dark" ? <Sun size={20} color="#F59E0B" /> : <Moon size={20} color="var(--color-text-secondary)" />}
        </button>

        {/* Interactive Notifications Bell Button */}
        <button 
          className="btn-icon" 
          onClick={handleToggleNotifications}
          style={{ 
            position: "relative", 
            cursor: "pointer", 
            background: showNotifications ? "var(--color-surface-hover)" : "transparent", 
            borderRadius: "50%", 
            padding: "8px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          title="Job & System Notifications"
          id="header-notification-bell-btn"
        >
          <Bell size={20} color={unreadCount > 0 ? "var(--color-secondary, #f97316)" : "var(--color-text-secondary)"} />
          {unreadCount > 0 && (
            <span 
              style={{ 
                position: "absolute", 
                top: "-2px", 
                right: "-2px", 
                minWidth: "18px", 
                height: "18px", 
                padding: "0 4px",
                background: "#f97316",
                color: "#ffffff",
                fontSize: "10px",
                fontWeight: "700",
                borderRadius: "9999px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 1px 3px rgba(0, 0, 0, 0.25)",
                lineHeight: 1,
                pointerEvents: "none"
              }}
            >
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </button>

        {/* Profile Avatar Button (Customer Portal Styled) */}
        <button
          onClick={() => navigate('/dashboard/profile')}
          title={`Profile: ${profile?.full_name || 'Technician'} (${isAvailable ? 'Online' : 'Offline'})`}
          style={{
            width: "36px",
            height: "36px",
            borderRadius: "50%",
            background: "rgba(249, 115, 22, 0.15)",
            color: "var(--color-secondary, #f97316)",
            border: "2px solid var(--color-border, #e2e8f0)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontWeight: "800",
            fontSize: "14px",
            cursor: "pointer",
            position: "relative",
            transition: "transform 0.15s ease, box-shadow 0.15s ease",
            boxShadow: "0 1px 3px rgba(0,0,0,0.1)"
          }}
        >
          {profile?.full_name?.charAt(0)?.toUpperCase() || "P"}
          {/* Online / Offline status badge on avatar */}
          <span
            style={{
              position: "absolute",
              bottom: "-1px",
              right: "-1px",
              width: "10px",
              height: "10px",
              borderRadius: "50%",
              backgroundColor: isAvailable ? "#10B981" : "#EF4444",
              border: "2px solid var(--color-surface, #ffffff)",
              boxShadow: isAvailable ? "0 0 6px #10B981" : "none"
            }}
          />
        </button>

        {/* Interactive Notifications Dropdown */}
        {showNotifications && (
          <div
            style={{
              position: "absolute",
              top: "48px",
              right: 0,
              width: "360px",
              maxWidth: "calc(100vw - 32px)",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              borderRadius: "16px",
              boxShadow: "0 25px 60px rgba(0, 0, 0, 0.35), 0 0 0 1px var(--color-border)",
              border: "1px solid var(--color-border)",
              zIndex: 1050,
              overflow: "hidden",
              animation: "slideUp 0.2s ease",
            }}
          >
            <div style={{ padding: "14px 16px", background: "var(--color-primary)", color: "white", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Bell size={18} color="var(--color-secondary)" />
                <span style={{ fontWeight: "700", fontSize: "14px" }}>Notifications</span>
                {unreadCount > 0 && (
                  <span style={{ background: "var(--color-secondary)", color: "white", fontSize: "10.5px", fontWeight: "800", padding: "2px 7px", borderRadius: "9999px" }}>
                    {unreadCount} new
                  </span>
                )}
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button 
                  onClick={markAllAsRead} 
                  style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.8)", fontSize: "11.5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  <CheckCheck size={14} /> Mark Read
                </button>
                <button 
                  onClick={clearAllNotifications} 
                  style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.8)", fontSize: "11.5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
                >
                  Clear All
                </button>
              </div>
            </div>

            <div style={{ maxHeight: "280px", overflowY: "auto", padding: "8px 0" }}>
              {notifications.length === 0 ? (
                <div style={{ padding: "24px 16px", textAlign: "center", color: "var(--color-text-secondary)" }}>
                  <Bell size={24} style={{ opacity: 0.3, marginBottom: "8px" }} />
                  <p style={{ margin: 0, fontSize: "13px" }}>No new notifications</p>
                </div>
              ) : (
                notifications.map((n) => (
                  <div
                    key={n.id}
                    style={{
                      padding: "12px 16px",
                      borderBottom: "1px solid var(--color-border)",
                      background: n.is_read ? "transparent" : "rgba(245, 124, 32, 0.08)",
                      cursor: "pointer",
                      transition: "background 0.2s ease",
                    }}
                    onClick={() => handleNotificationClick(n)}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                      <span style={{ fontWeight: "700", fontSize: "13px", color: "var(--color-text)" }}>{n.title}</span>
                      <span style={{ fontSize: "10.5px", color: "var(--color-text-muted)" }}>{n.created_at}</span>
                    </div>
                    <p style={{ margin: 0, fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: "1.4" }}>
                      {n.message}
                    </p>
                  </div>
                ))
              )}
            </div>

            <div style={{ padding: "10px", background: "var(--color-surface-hover)", textAlign: "center", borderTop: "1px solid var(--color-border)" }}>
              <button
                onClick={handleViewAll}
                className="btn btn-ghost btn-sm"
                style={{ width: "100%", fontSize: "12px", color: "var(--color-secondary)", fontWeight: "700" }}
              >
                {isSuperAdmin ? "View SuperAdmin Hub →" : isAdmin ? "View Admin Orders & Logs →" : "View All Notifications →"}
              </button>
            </div>
          </div>
        )}
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 1025px) {
          .hide-on-desktop { display: none !important; }
        }
        @media (max-width: 768px) {
          .hide-on-mobile { display: none !important; }
        }
      `}} />
    </header>
  );
}
