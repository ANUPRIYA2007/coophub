import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { pillarNotificationService } from "../../../services/pillar/notificationService";
import { supabase } from "../../../lib/supabase";
import { Menu, Bell, Search, CheckCheck, Sun, Moon } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Header({ toggleSidebar }) {
  const { language, changeLanguage, supportedLanguages } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [theme, setTheme] = useState(() => localStorage.getItem("coophub_theme") || "light");
  const [showNotifications, setShowNotifications] = useState(false);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef(null);

  // Fetch Live Notifications from Supabase Realtime
  useEffect(() => {
    const fetchLiveNotifications = async () => {
      try {
        const { data, error } = await supabase
          .from('notifications')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);
        if (data && data.length > 0) {
          const formatted = data.map(n => ({
            id: n.id,
            title: n.title,
            message: n.message,
            created_at: new Date(n.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            is_read: n.is_read ?? n.read ?? false,
            type: n.type || 'system'
          }));
          setNotifications(formatted);
          setUnreadCount(formatted.filter(n => !n.is_read).length);
        } else {
          setNotifications([
            {
              id: "n-1",
              title: "System Ready",
              message: "COOP HUB cooperative administration and live notifications active.",
              created_at: "Just now",
              is_read: false,
              type: "system",
            }
          ]);
          setUnreadCount(1);
        }
      } catch (err) {
        console.warn('Notifications fetch note:', err);
      }
    };

    fetchLiveNotifications();

    const channel = supabase
      .channel('header_notifications_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications' }, (payload) => {
        const newNotif = {
          id: payload.new.id,
          title: payload.new.title,
          message: payload.new.message,
          created_at: 'Just now',
          is_read: false,
          type: payload.new.type || 'system'
        };
        setNotifications(prev => [newNotif, ...prev.slice(0, 9)]);
        setUnreadCount(prev => prev + 1);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

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

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    setUnreadCount(0);
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
        zIndex: "var(--z-header)",
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
        
        {/* Global Search */}
        <div className="input-wrapper hide-on-mobile" style={{ width: "300px" }}>
          <input type="text" className="form-input" placeholder="Search orders, customers, services..." style={{ height: "36px", padding: "0 12px" }} />
          <Search size={16} className="input-icon" />
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
          style={{ position: "relative", cursor: "pointer", background: showNotifications ? "var(--color-surface-hover)" : "transparent", borderRadius: "50%", padding: "8px" }}
          title="Job & System Notifications"
        >
          <Bell size={20} color={unreadCount > 0 ? "var(--color-primary)" : "var(--color-text-secondary)"} />
          {unreadCount > 0 && (
            <span style={{ 
              position: "absolute", top: "4px", right: "4px", 
              width: "9px", height: "9px", borderRadius: "50%", 
              background: "var(--color-error)",
              boxShadow: "0 0 0 2px var(--color-surface)"
            }}></span>
          )}
        </button>

        {/* Interactive Notifications Dropdown */}
        {showNotifications && (
          <div
            style={{
              position: "absolute",
              top: "48px",
              right: 0,
              width: "340px",
              background: "var(--color-surface)",
              color: "var(--color-text)",
              borderRadius: "16px",
              boxShadow: "0 20px 40px rgba(0, 0, 0, 0.2), 0 0 0 1px var(--color-border)",
              border: "1px solid var(--color-border)",
              zIndex: 1000,
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
              <button 
                onClick={markAllAsRead} 
                style={{ background: "transparent", border: "none", color: "rgba(255,255,255,0.8)", fontSize: "11.5px", cursor: "pointer", display: "flex", alignItems: "center", gap: "4px" }}
              >
                <CheckCheck size={14} /> Mark Read
              </button>
            </div>

            <div style={{ maxHeight: "280px", overflowY: "auto", padding: "8px 0" }}>
              {notifications.map((n) => (
                <div
                  key={n.id}
                  style={{
                    padding: "12px 16px",
                    borderBottom: "1px solid var(--color-border)",
                    background: n.is_read ? "transparent" : "rgba(245, 124, 32, 0.08)",
                    cursor: "pointer",
                    transition: "background 0.2s ease",
                  }}
                  onClick={() => {
                    navigate("/dashboard/orders");
                    setShowNotifications(false);
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2px" }}>
                    <span style={{ fontWeight: "700", fontSize: "13px", color: "var(--color-text)" }}>{n.title}</span>
                    <span style={{ fontSize: "10.5px", color: "var(--color-text-muted)" }}>{n.created_at}</span>
                  </div>
                  <p style={{ margin: 0, fontSize: "12px", color: "var(--color-text-secondary)", lineHeight: "1.4" }}>
                    {n.message}
                  </p>
                </div>
              ))}
            </div>

            <div style={{ padding: "10px", background: "var(--color-surface-hover)", textAlign: "center", borderTop: "1px solid var(--color-border)" }}>
              <button
                onClick={() => {
                  navigate("/dashboard/orders");
                  setShowNotifications(false);
                }}
                className="btn btn-ghost btn-sm"
                style={{ width: "100%", fontSize: "12px", color: "var(--color-secondary)", fontWeight: "700" }}
              >
                View Live Orders & Alerts →
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
