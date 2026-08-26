import React, { useState, useEffect } from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { pillarNotificationService } from "../../../services/pillar/notificationService";
import { Bell, Check, CheckCheck } from "lucide-react";

export default function NotificationsPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    async function load() {
      const res = await pillarNotificationService.getNotifications(user?.id);
      setNotifications(res.data || []);
    }
    load();
  }, [user]);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  return (
    <div className="container" style={{ paddingTop: "var(--space-6)" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("notifications.title")}</h1>
          <p className="page-subtitle">Stay up to date with new bookings, alerts, and system updates</p>
        </div>
        <button className="btn btn-outline" onClick={markAllRead}>
          <CheckCheck size={16} /> {t("notifications.markAllRead")}
        </button>
      </div>

      <div className="card">
        <div className="card-body" style={{ padding: 0 }}>
          {notifications.map((item) => (
            <div
              key={item.id}
              style={{
                padding: "var(--space-4) var(--space-6)",
                borderBottom: "1px solid var(--color-border-light)",
                background: item.read ? "transparent" : "rgba(245, 124, 32, 0.04)",
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
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
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
