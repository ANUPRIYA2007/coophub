import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { pillarChatService } from "../../../services/pillar/chatService";
import { jobCommunicationService, subscribeToMessages } from "../../../services/communication/jobCommunicationService";
import { Send, Phone, User, CheckCircle2, ArrowLeft, MapPin, Package, Radio } from "lucide-react";

export default function CustomerChat() {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const { profile } = useAuth();
  const [activeChat, setActiveChat] = useState(null);
  const [inputText, setInputText] = useState("");
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  const isDemo = localStorage.getItem("coophub_demo_user") === "true";

  // Check URL query parameters or location state for a target order/request ID
  const queryParams = new URLSearchParams(location.search);
  const targetRequestId = queryParams.get("requestId") || queryParams.get("orderId") || location.state?.orderId || location.state?.requestId;

  // Load conversations on mount
  useEffect(() => {
    async function loadConversations() {
      setLoading(true);
      const pillarId = profile?.id || profile?.user_id;
      
      const { data } = await pillarChatService.getActiveConversations(pillarId);
      if (data && data.length > 0) {
        const mapped = data.map((b) => ({
          id: b.id,
          customerName: b.customer_name || "Customer",
          service: b.service_name || "Service Order",
          bookingId: b.booking_code || b.id.substring(0, 8),
          lastMessage: `Status: ${b.status}`,
          time: new Date(b.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          unread: 0,
        }));
        setConversations(mapped);
        
        if (targetRequestId && mapped.some(c => c.id === targetRequestId)) {
          setActiveChat(targetRequestId);
        } else {
          setActiveChat(mapped[0].id);
        }
      } else {
        setConversations([]);
        setActiveChat(null);
      }
      setLoading(false);
    }

    loadConversations();
  }, [profile?.id, profile?.user_id, targetRequestId]);

  // Load and subscribe to messages for activeChat in Real Mode
  useEffect(() => {
    if (!activeChat) return;

    let isMounted = true;
    async function loadActiveMessages() {
      const { data } = await pillarChatService.getMessages(activeChat);
      if (isMounted && data) {
        const formatted = data.map((m) => ({
          id: m.id,
          sender: m.sender_type,
          text: m.content || m.message,
          message_type: m.message_type || 'TEXT',
          is_read: m.is_read || m.read || false,
          time: new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }));
        setMessages((prev) => ({ ...prev, [activeChat]: formatted }));

        // Mark incoming messages as read by pillar
        jobCommunicationService.markAsRead(activeChat, 'pillar');
      }
    }

    loadActiveMessages();

    // Subscribe to live messages via Supabase Realtime WebSockets
    const unsubscribe = subscribeToMessages(activeChat, {
      onInsert: (newMsg) => {
        const formattedMsg = {
          id: newMsg.id,
          sender: newMsg.sender_type,
          text: newMsg.content || newMsg.message,
          message_type: newMsg.message_type || 'TEXT',
          is_read: newMsg.is_read || false,
          time: new Date(newMsg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        };
        setMessages((prev) => {
          const currentList = prev[activeChat] || [];
          if (currentList.some(m => m.id === newMsg.id)) return prev;
          return {
            ...prev,
            [activeChat]: [...currentList, formattedMsg],
          };
        });

        // Update conversation preview snippet
        setConversations(prev => prev.map(c => {
          if (c.id === activeChat) {
            return {
              ...c,
              lastMessage: formattedMsg.text,
              time: formattedMsg.time
            };
          }
          return c;
        }));

        // If from customer, mark as read
        if (newMsg.sender_type === 'customer') {
          jobCommunicationService.markAsRead(activeChat, 'pillar');
        }
      },
      onUpdate: (updatedMsg) => {
        setMessages((prev) => {
          const currentList = prev[activeChat] || [];
          const idx = currentList.findIndex(m => m.id === updatedMsg.id);
          if (idx === -1) return prev;
          const clone = [...currentList];
          clone[idx] = {
            ...clone[idx],
            text: updatedMsg.content || updatedMsg.message || clone[idx].text,
            is_read: updatedMsg.is_read || false
          };
          return {
            ...prev,
            [activeChat]: clone,
          };
        });
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [activeChat]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, activeChat]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputText.trim() || !activeChat) return;
    const textToSend = inputText.trim();
    setInputText("");

    const localId = `local-${Date.now()}`;
    const newMsgLocal = {
      id: localId,
      sender: "pillar",
      text: textToSend,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => ({
      ...prev,
      [activeChat]: [...(prev[activeChat] || []), newMsgLocal],
    }));

    // Authoritative Supabase Insert
    const senderId = profile?.id || profile?.user_id;
    const { data: sentData } = await pillarChatService.sendMessage(activeChat, senderId, "pillar", textToSend);
    if (sentData?.id) {
      setMessages((prev) => {
        const list = prev[activeChat] || [];
        return {
          ...prev,
          [activeChat]: list.map(m => m.id === localId ? {
            ...m,
            id: sentData.id
          } : m)
        };
      });
    }
  };

  const currentCustomer = conversations.find((c) => c.id === activeChat);

  return (
    <div className="container" style={{ paddingTop: "var(--space-6)", height: "calc(100vh - 100px)", display: "flex", flexDirection: "column" }}>
      <div className="page-header" style={{ marginBottom: "var(--space-4)" }}>
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
            {conversations.length === 0 && !loading && (
              <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-text-muted)", fontSize: "var(--font-size-sm)" }}>
                No active customer conversations yet.
              </div>
            )}
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
                  {c.customerName ? c.customerName[0] : "C"}
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
              <h3 style={{ margin: 0, fontSize: "var(--font-size-base)" }}>{currentCustomer?.customerName || "Select a conversation"}</h3>
              {currentCustomer && (
                <span style={{ fontSize: "12px", color: "var(--color-text-muted)" }}>Booking #{currentCustomer?.bookingId} • {currentCustomer?.service}</span>
              )}
            </div>
            {currentCustomer && (
              <button className="btn btn-outline btn-sm" onClick={() => alert("Connecting masked bridge call to customer...")}>
                <Phone size={16} /> Call
              </button>
            )}
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
            <div ref={messagesEndRef} />
          </div>

          {/* Quick Actions for Pillar */}
          {activeChat && (
            <div style={{
              padding: "6px 16px",
              background: "var(--color-surface-hover)",
              borderTop: "1px solid var(--color-border-light)",
              display: "flex",
              gap: "8px",
              overflowX: "auto"
            }}>
              <button
                type="button"
                onClick={async () => {
                  await jobCommunicationService.sendMessage({
                    requestId: activeChat,
                    senderId: profile?.id || profile?.user_id,
                    senderType: 'pillar',
                    content: '📍 [Arrival Notification] I have arrived at the customer doorstep.',
                    messageType: 'ARRIVAL'
                  });
                }}
                className="btn btn-xs btn-outline"
                style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "4px", whiteSpace: "nowrap" }}
              >
                <MapPin size={12} /> Announce Arrival
              </button>

              <button
                type="button"
                onClick={async () => {
                  const amtStr = prompt("Enter additional parts / charge amount (₹):", "250");
                  if (!amtStr) return;
                  const amt = parseInt(amtStr, 10);
                  if (isNaN(amt) || amt <= 0) return alert("Please enter a valid positive number.");
                  const desc = prompt("Enter parts / service description:", "Replacement Capacitor & Heavy Wiring");
                  if (!desc) return;
                  await jobCommunicationService.requestPartsOrExtraCharge({
                    requestId: activeChat,
                    pillarId: profile?.id || profile?.user_id,
                    description: desc,
                    amount: amt,
                    reason: "Required for complete and safe repair"
                  });
                }}
                className="btn btn-xs btn-outline"
                style={{ fontSize: "11px", display: "flex", alignItems: "center", gap: "4px", borderColor: "#FF7900", color: "#FF7900", whiteSpace: "nowrap" }}
              >
                <Package size={12} /> Request Parts / Extra Charge
              </button>
            </div>
          )}

          {/* Input */}
          <form onSubmit={handleSend} style={{ padding: "var(--space-4)", borderTop: "1px solid var(--color-border-light)", display: "flex", gap: "var(--space-2)" }}>
            <input
              type="text"
              className="form-input"
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="Type your message..."
              disabled={!activeChat}
            />
            <button type="submit" className="btn btn-primary btn-icon" style={{ width: "42px", height: "42px" }} disabled={!activeChat}>
              <Send size={18} />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
