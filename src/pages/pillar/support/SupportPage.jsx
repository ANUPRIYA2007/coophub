import React, { useState, useEffect } from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { pillarSupportService } from "../../../services/pillar/supportService";
import CreateTicketModal from "../../../components/pillar/support/CreateTicketModal";
import { LifeBuoy, Plus, MessageCircle, Clock, CheckCircle2 } from "lucide-react";

export default function SupportPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [tickets, setTickets] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    async function load() {
      const res = await pillarSupportService.getTickets(user?.id);
      setTickets(res.data || []);
    }
    load();
  }, [user]);

  const handleTicketCreated = (newTicket) => {
    setTickets([newTicket, ...tickets]);
  };

  return (
    <div className="container" style={{ paddingTop: "var(--space-6)" }}>
      <div className="page-header">
        <div>
          <h1 className="page-title">{t("support.title")}</h1>
          <p className="page-subtitle">Get fast help from our administrative and technical support team</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={16} /> {t("support.createTicket")}
        </button>
      </div>

      <div className="card">
        <div className="card-header">
          <h3 style={{ fontSize: "var(--font-size-lg)" }}>{t("support.myTickets")}</h3>
        </div>
        <div className="card-body">
          {tickets.length === 0 ? (
            <div className="empty-state">
              <LifeBuoy size={40} color="var(--color-text-muted)" />
              <p>{t("support.noTickets")}</p>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
              {tickets.map((tkt) => (
                <div
                  key={tkt.id}
                  style={{
                    padding: "var(--space-4)",
                    border: "1px solid var(--color-border-light)",
                    borderRadius: "var(--radius-lg)",
                    background: "var(--color-surface)",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "var(--space-2)" }}>
                    <span style={{ fontWeight: "700", color: "var(--color-primary)" }}>{tkt.id} • {tkt.subject}</span>
                    <span className={`badge ${tkt.status === "resolved" ? "badge-success" : tkt.status === "inProgress" ? "badge-info" : "badge-warning"}`}>
                      {tkt.status}
                    </span>
                  </div>
                  <div style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                    Category: <strong>{tkt.category}</strong> | Priority: <strong>{tkt.priority}</strong>
                  </div>
                  {tkt.response && (
                    <div style={{ marginTop: "var(--space-3)", padding: "var(--space-3)", background: "var(--color-surface-hover)", borderRadius: "var(--radius-md)", fontSize: "var(--font-size-sm)" }}>
                      <strong>{t("support.adminResponse")}:</strong> {tkt.response}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {isModalOpen && (
        <CreateTicketModal
          onClose={() => setIsModalOpen(false)}
          onSuccess={handleTicketCreated}
        />
      )}
    </div>
  );
}
