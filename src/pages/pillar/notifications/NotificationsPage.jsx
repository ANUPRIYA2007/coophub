import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { notificationSyncService } from "../../../services/notifications/notificationSyncService";
import { Bell, Check, CheckCheck, Trash2, X, ArrowLeft } from "lucide-react";

export default function NotificationsPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await notificationSyncService.getPortalNotifications('pillar', user?.id);
      setNotifications(res.notifications || []);
    }
    load();

    const handleSync = () => load();
    window.addEventListener('coophub_notifications_updated', handleSync);
    return () => window.removeEventListener('coophub_notifications_updated', handleSync);
  }, [user]);

  const markAllRead = async () => {
    const ids = notifications.map((n) => n.id);
    await notificationSyncService.markAllAsRead(ids);
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true, is_read: true })));
  };

  const handleRemove = async (id) => {
    await notificationSyncService.dismissNotification(id);
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to clear all notifications?")) return;
    const ids = notifications.map((n) => n.id);
    await notificationSyncService.clearAll(ids);
    setNotifications([]);
  };

  return (
    <div className="container" style={{ paddingTop: "var(--space-6)" }}>
      <div className="page-header">
        <div>
          <div style={{ marginBottom: "6px" }}>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-outline btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", fontSize: "12px", fontWeight: "700" }}
              title="Back to Pillar Dashboard Home"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
          </div>
          <h1 className="page-title">{t("notifications.title")}</h1>
          <p className="page-subtitle">Stay up to date with new bookings, alerts, and system updates</p>
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          {notifications.length > 0 && (
            <>
              <button className="btn btn-outline" onClick={markAllRead}>
                <CheckCheck size={16} /> {t("notifications.markAllRead")}
              </button>
              <button className="btn btn-outline" style={{ color: "var(--color-error)", borderColor: "var(--color-error)" }} onClick={handleClearAll}>
                <Trash2 size={16} /> Clear All
              </button>
            </>
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {notifications.length === 0 ? (
            <div style={{ padding: "var(--space-10)", textAlign: "center", color: "var(--color-text-muted)" }}>
              <Bell size={32} style={{ margin: "0 auto var(--space-3)", opacity: 0.4 }} />
              <p style={{ margin: 0, fontWeight: "600" }}>No notifications at this time.</p>
            </div>
          ) : (
            notifications.map((item) => (
              <div
                key={item.id}
                style={{
                  padding: "var(--space-4) var(--space-6)",
                  borderBottom: "1px solid var(--color-border-light)",
                  background: item.read ? "transparent" : "rgba(245, 124, 32, 0.04)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  position: "relative",
                }}
              >
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
                    {!item.read && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "var(--color-secondary)" }}></span>}
                    <h4 style={{ fontSize: "var(--font-size-base)", fontWeight: "600", margin: 0 }}>{item.title}</h4>
                  </div>
                  <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginTop: "4px" }}>
                    {item.message}
                  </p>
                  <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
                    {new Date(item.created_at).toLocaleString()}
                  </span>
                </div>

                <button
                  onClick={() => handleRemove(item.id)}
                  title="Remove notification"
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-text-muted)",
                    cursor: "pointer",
                    padding: "6px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "var(--color-error)")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "var(--color-text-muted)")}
                >
                  <X size={16} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
