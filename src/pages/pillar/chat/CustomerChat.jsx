import React, { useState } from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { Send, Phone, User, CheckCircle2 } from "lucide-react";

export default function CustomerChat() {
  const { t } = useTranslation();
  const [activeChat, setActiveChat] = useState("CUST-1");
  const [inputText, setInputText] = useState("");

  const [conversations] = useState([
    {
      id: "CUST-1",
      customerName: "Rakesh Kumar",
      service: "Fan Repair & Installation",
      bookingId: "ORD-9824",
      lastMessage: "I will be waiting near the gate.",
      time: "10:14 AM",
      unread: 1,
    },
    {
      id: "CUST-2",
      customerName: "Sneha Reddy",
      service: "Pipe Leakage",
      bookingId: "ORD-9812",
      lastMessage: "Please bring the wrench set.",
      time: "Yesterday",
      unread: 0,
    },
  ]);

  const [messages, setMessages] = useState({
    "CUST-1": [
      { id: 1, sender: "customer", text: "Hello! Are you on your way?", time: "10:10 AM" },
      { id: 2, sender: "pillar", text: "Yes sir, I have started. Reaching in 15 minutes.", time: "10:12 AM" },
      { id: 3, sender: "customer", text: "I will be waiting near the gate.", time: "10:14 AM" },
    ],
    "CUST-2": [
      { id: 1, sender: "customer", text: "Please bring the wrench set.", time: "Yesterday 4:00 PM" },
      { id: 2, sender: "pillar", text: "Sure ma'am, all tools are ready.", time: "Yesterday 4:05 PM" },
    ],
  });

  const handleSend = (e) => {
    e.preventDefault();
    if (!inputText.trim()) return;

    const newMsg = {
      id: Date.now(),
      sender: "pillar",
      text: inputText.trim(),
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), newMsg],
    }));
    setInputText("");
  };

  const currentCustomer = conversations.find((c) => c.id === activeChat);

  return (
    <div className="container" style={{ paddingTop: "var(--space-6)", height: "calc(100vh - 100px)", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ marginBottom: "var(--space-4)" }}>
        <div>
          <h1 className="page-title">{t("nav.chat")}</h1>
          <p className="page-subtitle">Real-time messaging with your customers</p>
        </div>
      </div>

      <div className="card" style={{ flex: 1, display: "flex", overflow: "hidden", minHeight: "450px" }}>
        {/* Sidebar list */}
        <div style={{ width: "320px", borderRight: "1px solid var(--color-border-light)", display: "flex", flexDirection: "column" }}>
          <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--color-border-light)", fontWeight: "600" }}>
            Active Customer Chats
          </div>
          <div style={{ flex: 1, overflowY: "auto" }}>
            {conversations.map((c) => (
              <div
                key={c.id}
                onClick={() => setActiveChat(c.id)}
                style={{
                  padding: "var(--space-4)",
                  borderBottom: "1px solid var(--color-border-light)",
                  cursor: "pointer",
                  background: activeChat === c.id ? "var(--color-surface-hover)" : "transparent",
                  display: "flex",
                  gap: "var(--space-3)",
                  alignItems: "center",
                }}
              >
                <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "var(--color-primary-light)", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold" }}>
                  {c.customerName[0]}
                </div>
                <div style={{ flex: 1, overflow: "hidden" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2px" }}>
                    <span style={{ fontWeight: "600", fontSize: "var(--font-size-sm)" }}>{c.customerName}</span>
                    <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>{c.time}</span>
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-text-secondary)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                    {c.lastMessage}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Chat area */}
        <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--color-border-light)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h3 style={{ margin: 0, fontSize: "var(--font-size-base)" }}>{currentCustomer?.customerName}</h3>
              <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Booking #{currentCustomer?.bookingId} • {currentCustomer?.service}</span>
            </div>
            <button className="btn btn-outline btn-sm" onClick={() => alert("Connecting masked bridge call to customer...")}>
              <Phone size={16} /> Call
            </button>
          </div>

          {/* Messages */}
          <div style={{ flex: 1, padding: "var(--space-4)", overflowY: "auto", display: "flex", flexDirection: "column", gap: "var(--space-3)", background: "var(--color-background)" }}>
            {(messages[activeChat] || []).map((m) => (
              <div key={m.id} style={{ display: "flex", justifyContent: m.sender === "pillar" ? "flex-end" : "flex-start" }}>
                <div style={{ maxWidth: "70%", padding: "var(--space-3) var(--space-4)", borderRadius: "var(--radius-lg)", background: m.sender === "pillar" ? "var(--color-secondary)" : "white", color: m.sender === "pillar" ? "white" : "var(--color-text)", boxShadow: "var(--shadow-sm)" }}>
                  <p style={{ margin: 0, fontSize: "var(--font-size-sm)" }}>{m.text}</p>
                  <span style={{ fontSize: "10px", opacity: 0.7, display: "block", textAlign: "right", marginTop: "4px" }}>{m.time}</span>
                </div>
              </div>
            ))}
          </div>

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: "var(--space-4)", borderTop: "1px solid var(--color-border-light)", display: "flex", gap: "var(--space-2)" }}>
            <input
              type="text"
              className="form-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
            />
            <button type="submit" className="btn btn-primary btn-icon" style={{ width: "42px", height: "42px" }}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
