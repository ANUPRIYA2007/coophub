import React, { useState, useEffect, useRef } from "react";
import { jobCommunicationService, subscribeToMessages } from "../../../services/communication/jobCommunicationService";
import { pillarChatService } from "../../../services/pillar/chatService";
import { useAuth } from "../../../context/AuthContext";
import { 
  Send, X, Phone, ShieldCheck, Check, CheckCheck, 
  Clock, Wrench, Package, Radio, ChevronDown, PlusCircle, AlertCircle
} from "lucide-react";

/**
 * Global helper to trigger the Pillar Communication Drawer from anywhere
 */
export function openPillarChat(orderData) {
  window.dispatchEvent(new CustomEvent('open_pillar_chat', { 
    detail: { order: orderData } 
  }));
}

export default function PillarChatDrawer({ 
  isOpen, 
  onClose, 
  order: initialOrder = null,
  onOrderUpdated = () => {}
}) {
  const { user, profile } = useAuth();
  const [activeOrder, setActiveOrder] = useState(initialOrder);
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputContent, setInputContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showPartsModal, setShowPartsModal] = useState(false);
  const [partsDesc, setPartsDesc] = useState("");
  const [partsAmount, setPartsAmount] = useState("");
  const [partsReason, setPartsReason] = useState("");
  const [submittingParts, setSubmittingParts] = useState(false);
  const [showOrderPicker, setShowOrderPicker] = useState(false);

  const messagesEndRef = useRef(null);

  // Sync initialOrder prop into activeOrder
  useEffect(() => {
    if (initialOrder) {
      setActiveOrder(initialOrder);
    }
  }, [initialOrder]);

  // If no activeOrder provided or to populate conversation switcher, fetch recent orders
  useEffect(() => {
    if (!isOpen) return;

    const fetchOrders = async () => {
      const pillarId = profile?.id || profile?.user_id;
      if (!pillarId) return;

      try {
        const { data } = await pillarChatService.getActiveConversations(pillarId);
        if (data && data.length > 0) {
          setConversations(data);
          // If activeOrder not set or missing ID, default to first active order
          setActiveOrder(prev => {
            if (prev?.id) return prev;
            return data[0];
          });
        }
      } catch (err) {
        console.warn("Could not fetch active conversations:", err);
      }
    };

    fetchOrders();
  }, [isOpen, profile?.id, profile?.user_id]);

  const requestId = activeOrder?.id || activeOrder?.request_id || activeOrder?.order_id;

  // Fetch messages when active order changes
  const fetchMessages = async () => {
    if (!requestId) {
      setMessages([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const { data } = await jobCommunicationService.getMessages(requestId);
    setMessages(data || []);
    setLoading(false);

    // Mark messages as read by pillar
    jobCommunicationService.markAsRead(requestId, 'pillar');
  };

  useEffect(() => {
    if (!isOpen || !requestId) return;

    fetchMessages();

    // Subscribe to realtime messages (INSERT & UPDATE)
    const unsubscribe = subscribeToMessages(requestId, {
      onInsert: (newMsg) => {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        if (newMsg.sender_type !== 'pillar') {
          jobCommunicationService.markAsRead(requestId, 'pillar');
        }
      },
      onUpdate: (updatedMsg) => {
        setMessages(prev => {
          const idx = prev.findIndex(m => m.id === updatedMsg.id);
          if (idx === -1) return prev;
          const clone = [...prev];
          clone[idx] = updatedMsg;
          return clone;
        });
      }
    });

    return () => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [isOpen, requestId]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e, textOverride = null) => {
    e?.preventDefault();
    const text = (textOverride || inputContent).trim();
    if (!text || submitting || !requestId) return;

    setSubmitting(true);
    setInputContent("");

    const optimisticId = 'temp-' + Date.now();
    const optimisticMsg = {
      id: optimisticId,
      request_id: requestId,
      sender_type: 'pillar',
      content: text,
      message: text,
      message_type: 'TEXT',
      is_read: false,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticMsg]);

    const res = await jobCommunicationService.sendMessage({
      requestId,
      senderId: user?.id,
      senderType: 'pillar',
      content: text,
      messageType: 'TEXT'
    });

    if (res?.data) {
      setMessages(prev => prev.map(m => m.id === optimisticId ? res.data : m));
    }

    setSubmitting(false);
  };

  // Submit additional parts / charges request
  const handleSubmitParts = async (e) => {
    e?.preventDefault();
    const amt = parseFloat(partsAmount);
    if (!partsDesc.trim() || isNaN(amt) || amt <= 0 || submittingParts || !requestId) return;

    setSubmittingParts(true);
    try {
      const res = await jobCommunicationService.requestExtraCharges({
        requestId,
        pillarId: user?.id,
        description: partsDesc.trim(),
        amount: amt,
        reason: partsReason.trim() || "Additional parts and service needed"
      });

      if (res?.data) {
        setShowPartsModal(false);
        setPartsDesc("");
        setPartsAmount("");
        setPartsReason("");
        fetchMessages();
      }
    } catch (err) {
      console.error("Error submitting extra charge:", err);
    } finally {
      setSubmittingParts(false);
    }
  };

  if (!isOpen) return null;

  const customerName = activeOrder?.customer_name || activeOrder?.user?.full_name || activeOrder?.customer?.full_name || "Customer";
  const customerMobile = activeOrder?.customer_mobile || activeOrder?.user?.mobile || activeOrder?.customer?.mobile;
  const serviceTitle = activeOrder?.service_name || activeOrder?.service?.title || "Service Request";
  const bookingCode = activeOrder?.booking_code || (requestId ? String(requestId).slice(0, 8) : "REQ");

  return (
    <>
      {/* Mobile Backdrop */}
      <div 
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(5, 10, 20, 0.5)",
          backdropFilter: "blur(2px)",
          zIndex: 9998,
        }}
        onClick={onClose}
      />

      {/* Slide-over Drawer (Image 3 Style) */}
      <div 
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: "100%",
          maxWidth: "440px",
          background: "var(--color-surface, #ffffff)",
          borderLeft: "1px solid var(--color-border, #e2e8f0)",
          boxShadow: "-10px 0 35px rgba(0, 0, 0, 0.25)",
          zIndex: 9999,
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 0.25s cubic-bezier(0.16, 1, 0.3, 1)"
        }}
      >
        {/* Drawer Header (Like CustomerChatDrawer in Image 3) */}
        <div style={{
          padding: "16px 20px",
          borderBottom: "1px solid var(--color-border, #e2e8f0)",
          background: "var(--color-surface-hover, #f8fafc)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", minWidth: 0 }}>
            {/* Customer Avatar */}
            <div style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, #FF7900, #E05300)",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontWeight: "800",
              fontSize: "1.1rem",
              flexShrink: 0
            }}>
              {customerName ? customerName.charAt(0).toUpperCase() : "C"}
            </div>

            <div style={{ minWidth: 0 }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontWeight: "800", fontSize: "0.95rem", color: "var(--color-text, #0f172a)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {customerName}
                </span>
                <span style={{ fontSize: "10px", padding: "1px 6px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.15)", color: "#059669", fontWeight: "700" }}>
                  Customer
                </span>
              </div>
              <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary, #64748b)", display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                  {serviceTitle} • Order #{bookingCode}
                </span>
              </div>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
            {/* Call Customer */}
            {customerMobile && (
              <a
                href={`tel:${customerMobile}`}
                className="btn btn-sm btn-outline"
                style={{ padding: "6px 10px", borderColor: "#10B981", color: "#10B981", textDecoration: "none", borderRadius: "8px" }}
                title={`Call ${customerName}: ${customerMobile}`}
              >
                <Phone size={14} />
              </a>
            )}

            {/* Conversation Switcher if multiple active */}
            {conversations.length > 1 && (
              <button
                onClick={() => setShowOrderPicker(!showOrderPicker)}
                className="btn btn-sm btn-outline"
                style={{ padding: "6px 8px", borderRadius: "8px" }}
                title="Switch Active Order"
              >
                <ChevronDown size={14} />
              </button>
            )}

            {/* Close Button */}
            <button 
              onClick={onClose} 
              className="btn btn-sm btn-outline" 
              style={{ padding: "6px 8px", borderRadius: "8px", cursor: "pointer" }}
              title="Close Chat"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Conversation Switcher Dropdown */}
        {showOrderPicker && conversations.length > 1 && (
          <div style={{
            background: "var(--color-surface, #ffffff)",
            borderBottom: "1px solid var(--color-border, #e2e8f0)",
            padding: "8px 12px",
            maxHeight: "180px",
            overflowY: "auto"
          }}>
            <div style={{ fontSize: "11px", fontWeight: "700", color: "var(--color-text-muted, #94a3b8)", marginBottom: "4px" }}>
              SWITCH ACTIVE CUSTOMER CHAT:
            </div>
            {conversations.map(c => (
              <div
                key={c.id}
                onClick={() => {
                  setActiveOrder(c);
                  setShowOrderPicker(false);
                }}
                style={{
                  padding: "8px 10px",
                  borderRadius: "8px",
                  cursor: "pointer",
                  background: c.id === requestId ? "rgba(249, 115, 22, 0.12)" : "transparent",
                  fontSize: "12px",
                  fontWeight: c.id === requestId ? "700" : "500",
                  display: "flex",
                  justifyContent: "space-between"
                }}
              >
                <span>{c.customer_name || "Customer"} ({c.service_name || "Service"})</span>
                <span style={{ color: "var(--color-secondary, #f97316)" }}>#{c.id.slice(0, 6)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Realtime Status Sub-Banner (Matching Image 3) */}
        <div style={{
          background: "rgba(16, 185, 129, 0.08)",
          padding: "6px 16px",
          fontSize: "0.72rem",
          color: "#059669",
          fontWeight: "700",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(16, 185, 129, 0.2)"
        }}>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <Radio size={12} className="spin" /> Supabase Realtime Active
          </span>
          <button
            onClick={() => setShowPartsModal(true)}
            style={{ 
              background: "none", 
              border: "none", 
              color: "var(--color-secondary, #f97316)", 
              fontSize: "0.72rem", 
              fontWeight: "800", 
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              gap: "4px"
            }}
          >
            <PlusCircle size={12} /> Extra Parts Request
          </button>
        </div>

        {/* Message Feed */}
        <div style={{ 
          flex: 1, 
          padding: "16px", 
          overflowY: "auto", 
          display: "flex", 
          flexDirection: "column", 
          gap: "12px",
          background: "var(--color-background, #f8fafc)"
        }}>
          {loading ? (
            <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted, #94a3b8)", fontSize: "0.85rem" }}>
              Connecting to live real-time chat...
            </div>
          ) : !requestId ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--color-text-muted, #94a3b8)", fontSize: "0.85rem" }}>
              No active service order selected. Select an order from your Bookings list to begin communication.
            </div>
          ) : messages.length === 0 ? (
            <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--color-text-muted, #94a3b8)", fontSize: "0.85rem" }}>
              👋 No messages yet. Say hello to your customer or coordinate exact arrival time!
            </div>
          ) : (
            messages.map((m) => {
              const isPillar = m.sender_type === "pillar";
              const isSystem = m.sender_type === "system" || m.message_type === "SYSTEM";
              const isPartsRequest = m.message_type === "PARTS_REQUEST";

              if (isSystem) {
                return (
                  <div key={m.id} style={{ textAlign: "center", margin: "6px 0" }}>
                    <span style={{
                      background: "var(--color-surface, #ffffff)",
                      border: "1px solid var(--color-border, #e2e8f0)",
                      color: "var(--color-text-secondary, #64748b)",
                      fontSize: "0.74rem",
                      fontWeight: "600",
                      padding: "4px 12px",
                      borderRadius: "16px",
                      display: "inline-block"
                    }}>
                      {m.content}
                    </span>
                  </div>
                );
              }

              if (isPartsRequest) {
                const meta = m.metadata || {};
                const status = meta.status || "PENDING";
                return (
                  <div key={m.id} style={{
                    background: "rgba(255, 121, 0, 0.08)",
                    border: "1.5px solid #FF7900",
                    borderRadius: "12px",
                    padding: "14px",
                    margin: "8px 0"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "6px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <Package size={16} color="#FF7900" />
                        <strong style={{ fontSize: "0.85rem", color: "#FF7900" }}>Extra Parts Requested</strong>
                      </div>
                      <span style={{
                        fontSize: "10px",
                        fontWeight: "800",
                        padding: "2px 8px",
                        borderRadius: "10px",
                        background: status === "ACCEPTED" ? "#10B981" : status === "REJECTED" ? "#EF4444" : "#F59E0B",
                        color: "white"
                      }}>
                        {status}
                      </span>
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--color-text, #0f172a)", marginBottom: "4px" }}>
                      <strong>Item:</strong> {meta.description || "Required Component"}
                    </div>
                    <div style={{ fontSize: "0.82rem", color: "var(--color-text, #0f172a)" }}>
                      <strong>Amount:</strong> ₹{meta.amount || 0} • <strong>Reason:</strong> {meta.reason || "Necessary for service"}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={m.id}
                  style={{
                    alignSelf: isPillar ? "flex-end" : "flex-start",
                    maxWidth: "80%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: isPillar ? "flex-end" : "flex-start"
                  }}
                >
                  <div style={{
                    background: isPillar ? "linear-gradient(135deg, #FF7900, #E05300)" : "var(--color-surface, #ffffff)",
                    color: isPillar ? "white" : "var(--color-text, #0f172a)",
                    border: isPillar ? "none" : "1px solid var(--color-border, #e2e8f0)",
                    borderRadius: isPillar ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                    padding: "10px 14px",
                    fontSize: "0.88rem",
                    lineHeight: "1.4",
                    wordBreak: "break-word",
                    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.06)"
                  }}>
                    {m.content}
                  </div>

                  <div style={{
                    fontSize: "0.68rem",
                    color: "var(--color-text-muted, #94a3b8)",
                    marginTop: "3px",
                    display: "flex",
                    alignItems: "center",
                    gap: "4px"
                  }}>
                    {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
                    {isPillar && (
                      m.is_read ? <CheckCheck size={12} color="#3B82F6" /> : <Check size={12} />
                    )}
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Technician Quick Action Chips (Image 3 Style) */}
        <div style={{
          padding: "8px 16px",
          borderTop: "1px solid var(--color-border, #e2e8f0)",
          background: "var(--color-surface-hover, #f8fafc)",
          display: "flex",
          gap: "6px",
          overflowX: "auto"
        }}>
          <button
            onClick={() => setInputContent("🚗 I'm on the way to your location. Estimated arrival in 15 mins.")}
            className="btn btn-xs btn-outline"
            style={{ fontSize: "0.72rem", whiteSpace: "nowrap", borderRadius: "12px" }}
          >
            🚗 On My Way
          </button>
          <button
            onClick={() => setInputContent("📍 I have arrived at your premises / gate. Ready to verify arrival PIN.")}
            className="btn btn-xs btn-outline"
            style={{ fontSize: "0.72rem", whiteSpace: "nowrap", borderRadius: "12px" }}
          >
            📍 Arrived at Gate
          </button>
          <button
            onClick={() => setInputContent("⏳ Slight traffic delay of about 5-10 mins. Moving as fast as possible!")}
            className="btn btn-xs btn-outline"
            style={{ fontSize: "0.72rem", whiteSpace: "nowrap", borderRadius: "12px" }}
          >
            ⏳ Traffic Delay
          </button>
          <button
            onClick={() => setInputContent("🔧 Currently inspecting the unit and preparing the repair plan.")}
            className="btn btn-xs btn-outline"
            style={{ fontSize: "0.72rem", whiteSpace: "nowrap", borderRadius: "12px" }}
          >
            🔧 Starting Diagnosis
          </button>
        </div>

        {/* Input Box */}
        <form
          onSubmit={handleSendMessage}
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--color-border, #e2e8f0)",
            background: "var(--color-surface, #ffffff)",
            display: "flex",
            gap: "8px",
            alignItems: "center"
          }}
        >
          <input
            type="text"
            placeholder={requestId ? "Type message to customer..." : "Select an order to chat..."}
            value={inputContent}
            onChange={(e) => setInputContent(e.target.value)}
            disabled={submitting || !requestId}
            style={{
              flex: 1,
              padding: "10px 14px",
              borderRadius: "20px",
              border: "1px solid var(--color-border, #e2e8f0)",
              background: "var(--color-surface-hover, #f8fafc)",
              fontSize: "0.85rem",
              color: "var(--color-text, #0f172a)",
              outline: "none"
            }}
          />
          <button
            type="submit"
            disabled={submitting || !inputContent.trim() || !requestId}
            className="btn btn-primary"
            style={{
              borderRadius: "50%",
              width: "38px",
              height: "38px",
              padding: 0,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background: "linear-gradient(135deg, #FF7900, #E05300)",
              color: "white",
              border: "none",
              cursor: submitting || !inputContent.trim() ? "not-allowed" : "pointer",
              opacity: submitting || !inputContent.trim() ? 0.6 : 1
            }}
          >
            <Send size={16} />
          </button>
        </form>

        {/* Extra Parts Request Modal */}
        {showPartsModal && (
          <div style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(5, 10, 18, 0.75)",
            backdropFilter: "blur(4px)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 10000,
            padding: "16px"
          }}>
            <div style={{
              background: "var(--color-surface, #ffffff)",
              borderRadius: "16px",
              border: "1px solid var(--color-border, #e2e8f0)",
              maxWidth: "420px",
              width: "100%",
              padding: "20px",
              boxShadow: "0 25px 60px rgba(0,0,0,0.3)"
            }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "14px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-secondary, #f97316)" }}>
                  <Package size={20} />
                  <h3 style={{ fontSize: "1.05rem", fontWeight: "800", margin: 0, color: "var(--color-text, #0f172a)" }}>
                    Request Extra Parts / Service
                  </h3>
                </div>
                <button onClick={() => setShowPartsModal(false)} className="btn btn-sm btn-ghost">
                  <X size={16} />
                </button>
              </div>

              <form onSubmit={handleSubmitParts} style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Part / Service Description *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., Replacement Copper Capacitor 45uF"
                    value={partsDesc}
                    onChange={(e) => setPartsDesc(e.target.value)}
                    className="form-input"
                    style={{ width: "100%", padding: "8px 12px", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Extra Amount (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    placeholder="e.g., 450"
                    value={partsAmount}
                    onChange={(e) => setPartsAmount(e.target.value)}
                    className="form-input"
                    style={{ width: "100%", padding: "8px 12px", fontSize: "13px" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "12px", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                    Reason for Extra Charge
                  </label>
                  <textarea
                    rows={2}
                    placeholder="Why is this additional component necessary for the customer's repair?"
                    value={partsReason}
                    onChange={(e) => setPartsReason(e.target.value)}
                    className="form-input"
                    style={{ width: "100%", padding: "8px 12px", fontSize: "13px" }}
                  />
                </div>

                <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                  <button
                    type="button"
                    onClick={() => setShowPartsModal(false)}
                    className="btn btn-outline"
                    style={{ flex: 1, padding: "8px" }}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingParts}
                    className="btn btn-primary"
                    style={{ flex: 1, padding: "8px", background: "linear-gradient(135deg, #FF7900, #E05300)", color: "white" }}
                  >
                    {submittingParts ? "Sending..." : "Send Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>

      {/* Slide-in CSS Animation */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
      `}} />
    </>
  );
}
