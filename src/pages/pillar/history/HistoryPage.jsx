import React, { useState, useEffect } from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { pillarOrderService } from "../../../services/pillar/orderService";
import { CheckCircle2, Clock, XCircle, Loader2, ClipboardList } from "lucide-react";

export default function HistoryPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      if (!user) {
        setLoading(false);
        return;
      }
      setLoading(true);
      const { data } = await pillarOrderService.getOrders(user.id);
      const completed = (data || []).filter((o) => ["completed", "cancelled", "rejected"].includes(o.status));
      setHistoryItems(completed);
      setLoading(false);
    }
    load();
  }, [user]);

  return (
    <div className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-12)" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("history.title")}</h1>
          <p className="page-subtitle">Past service assignments, completed jobs, and logs</p>
        </div>
      </div>

      {loading ? (
        <div className="loading-container">
          <Loader2 size={32} className="spinner" />
          <p>Loading history records...</p>
        </div>
      ) : historyItems.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <ClipboardList size={40} color="var(--color-text-muted)" />
            <h3 className="empty-state-title">No completed services yet</h3>
            <p className="empty-state-text">Once you accept and complete customer bookings, your historical job logs and customer reviews will appear here.</p>
          </div>
        </div>
      ) : (
        <div className="grid grid-2">
          {historyItems.map((item) => (
            <div key={item.id} className="card">
              <div className="card-body">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-3)" }}>
                  <div>
                    <span style={{ fontSize: "12px", fontWeight: "bold", color: "var(--color-text-muted)" }}>
                      {item.booking_code || item.id.slice(0, 8)}
                    </span>
                    <h3 style={{ fontSize: "var(--font-size-base)", fontWeight: "600", marginTop: "2px" }}>
                      {item.service_name}
                    </h3>
                  </div>
                  <span className={`badge ${item.status === "completed" ? "badge-success" : "badge-error"}`}>
                    {item.status}
                  </span>
                </div>

                <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)", display: "flex", flexDirection: "column", gap: "4px" }}>
                  <div>Customer: <strong>{item.customer_name}</strong></div>
                  <div>Location: {item.service_address}</div>
                  <div>Scheduled: {item.scheduled_date || "N/A"}</div>
                </div>

                <div style={{ marginTop: "var(--space-4)", paddingTop: "var(--space-3)", borderTop: "1px solid var(--color-border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "var(--font-size-xs)", color: "var(--color-text-muted)" }}>
                    Updated: {new Date(item.updated_at || item.created_at).toLocaleDateString()}
                  </span>
                  <span style={{ fontWeight: "700", fontSize: "var(--font-size-lg)", color: "var(--color-secondary)" }}>
                    ₹{item.total_amount || item.base_amount || 0}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
