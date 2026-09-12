import React, { useState, useEffect, useRef } from "react";
import { jobCommunicationService, subscribeToMessages, registerOrderUuid } from "../../services/communication/jobCommunicationService";
import { useAuth } from "../../context/AuthContext";
import { 
  Send, X, Phone, AlertTriangle, ShieldCheck, Check, CheckCheck, 
  Clock, Wrench, Package, Radio, ChevronRight, HelpCircle
} from "lucide-react";

export default function CustomerChatDrawer({ 
  isOpen, 
  onClose, 
  requestId, 
  order = null,
  pillar = {},
  orderStatus = "assigned",
  onChargeApproved = () => {}
}) {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [inputContent, setInputContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [showIssueModal, setShowIssueModal] = useState(false);
  const [issueCategory, setIssueCategory] = useState("Pillar late / delay");
  const [issueDescription, setIssueDescription] = useState("");
  const [isSubmittingIssue, setIsSubmittingIssue] = useState(false);
  const messagesEndRef = useRef(null);

  const effectiveId = order?.id || requestId;

  // Pre-seed the code-to-UUID cache as soon as order is known
  useEffect(() => {
    if (order?.id) {
      if (requestId) registerOrderUuid(requestId, order.id);
      if (order.order_id) registerOrderUuid(order.order_id, order.id);
      if (order.receipt_number) registerOrderUuid(order.receipt_number, order.id);
      if (order.booking_code) registerOrderUuid(order.booking_code, order.id);
    }
  }, [order, requestId]);

  const fetchChatMessages = async () => {
    if (!effectiveId) return;
    setLoading(true);
    const { data } = await jobCommunicationService.getMessages(effectiveId, { order });
    setMessages(data || []);
    setLoading(false);
    // Mark messages as read by customer
    jobCommunicationService.markAsRead(effectiveId, 'customer');
  };

  useEffect(() => {
    if (!isOpen || !effectiveId) return;
    fetchChatMessages();

    // Background silent polling (every 2s) to guarantee real-time updates across different browsers
    const pollInterval = setInterval(async () => {
      try {
        const { data } = await jobCommunicationService.getMessages(effectiveId, { order });
        if (data && Array.isArray(data)) {
          setMessages(prev => {
            if (data.length !== prev.length || (data.length > 0 && prev.length > 0 && data[data.length - 1].id !== prev[prev.length - 1].id)) {
              return data;
            }
            return prev;
          });
        }
      } catch (pe) {}
    }, 2000);

    // Subscribe to realtime messages (INSERT & UPDATE)
    const unsubscribe = subscribeToMessages(effectiveId, {
      onInsert: (newMsg) => {
        setMessages(prev => {
          if (prev.some(m => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        // Mark incoming messages from pillar as read
        if (newMsg.sender_type !== 'customer') {
          jobCommunicationService.markAsRead(effectiveId, 'customer');
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
    }, { order });

    return () => {
      clearInterval(pollInterval);
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [isOpen, effectiveId, order]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async (e, textOverride = null) => {
    e?.preventDefault();
    const text = (textOverride || inputContent).trim();
    if (!text || submitting) return;

    setSubmitting(true);
    setInputContent("");

    const optimisticId = 'temp-' + Date.now();
    const optimisticMsg = {
      id: optimisticId,
      request_id: effectiveId,
      sender_type: 'customer',
      content: text,
      message: text,
      message_type: 'TEXT',
      is_read: false,
      created_at: new Date().toISOString()
    };

    setMessages(prev => [...prev, optimisticMsg]);

    const res = await jobCommunicationService.sendMessage({
      requestId: effectiveId,
      order,
      senderId: user?.id,
      senderType: 'customer',
      content: text,
      messageType: 'TEXT',
      metadata: {
        original_request_id: requestId,
        order_code: order?.order_id || order?.booking_code || requestId
      }
    });

    if (res?.data) {
      setMessages(prev => prev.map(m => m.id === optimisticId ? res.data : m));
    }

    setSubmitting(false);
  };

  const handleRespondToExtraCharge = async (action) => {
    try {
      const res = await jobCommunicationService.respondToExtraCharge({
        requestId: effectiveId,
        customerId: user?.id,
        action
      });
      if (res.success) {
        onChargeApproved(res.finalAmount);
        fetchChatMessages();
      }
    } catch (err) {
      alert("Error responding to charge: " + err.message);
    }
  };

  const handleSubmitIssue = async (e) => {
    e.preventDefault();
    if (!issueDescription.trim()) return;
    setIsSubmittingIssue(true);
    try {
      await jobCommunicationService.reportCustomerIssue({
        requestId: effectiveId,
        customerId: user?.id,
        category: issueCategory,
        description: issueDescription.trim()
      });
      setShowIssueModal(false);
      setIssueDescription("");
      fetchChatMessages();
      alert("Your issue has been logged with Customer Support and the cooperative dispatch team.");
    } catch (err) {
      alert("Failed to submit issue: " + err.message);
    } finally {
      setIsSubmittingIssue(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", top: 0, right: 0, bottom: 0,
      width: "100%", maxWidth: "440px",
      background: "var(--color-surface)",
      borderLeft: "1px solid var(--color-border)",
      boxShadow: "-8px 0 30px rgba(0, 0, 0, 0.25)",
      zIndex: 9999,
      display: "flex",
      flexDirection: "column"
    }}>
      {/* Chat Header */}
      <div style={{
        padding: "16px 20px",
        borderBottom: "1px solid var(--color-border)",
        background: "var(--color-surface-hover)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{
            width: "42px", height: "42px", borderRadius: "50%",
            background: "linear-gradient(135deg, #FF7900, #E05300)",
            color: "white", display: "flex", alignItems: "center", justifyContent: "center",
            fontWeight: "800", fontSize: "1rem"
          }}>
            {pillar.full_name ? pillar.full_name.charAt(0) : "P"}
          </div>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontWeight: "800", fontSize: "0.95rem", color: "var(--color-text)" }}>
                {pillar.full_name || "Assigned Pillar"}
              </span>
              <ShieldCheck size={14} color="#10B981" />
            </div>
            <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>
              {Array.isArray(pillar.main_services) ? pillar.main_services[0] : (pillar.main_services || "Certified Technician")} • Order #{requestId.slice(0, 8)}
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          {pillar.mobile && (
            <a
              href={`tel:${pillar.mobile}`}
              className="btn btn-sm btn-outline"
              style={{ padding: "6px 10px", borderColor: "#10B981", color: "#10B981", textDecoration: "none" }}
              title="Call Technician"
            >
              <Phone size={14} />
            </a>
          )}
          <button onClick={onClose} className="btn btn-sm btn-outline" style={{ padding: "6px 8px" }}>
            <X size={16} />
          </button>
        </div>
      </div>

      {/* Realtime Status Sub-Banner */}
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
          onClick={() => setShowIssueModal(true)}
          style={{ background: "none", border: "none", color: "#EF4444", fontSize: "0.72rem", fontWeight: "800", cursor: "pointer", textDecoration: "underline" }}
        >
          Report Issue
        </button>
      </div>

      {/* Message List */}
      <div style={{ flex: 1, padding: "16px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px" }}>
        {loading ? (
          <div style={{ textAlign: "center", padding: "40px", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
            Connecting to real-time chat...
          </div>
        ) : messages.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
            👋 No messages yet. Say hello to your technician or coordinate exact location landmarks!
          </div>
        ) : (
          messages.map((m) => {
            const isMe = m.sender_type === "customer";
            const isSystem = m.sender_type === "system" || m.message_type === "SYSTEM";
            const isPartsRequest = m.message_type === "PARTS_REQUEST";

            if (isSystem) {
              return (
                <div key={m.id} style={{ textAlign: "center", margin: "6px 0" }}>
                  <span style={{
                    background: "var(--color-surface-hover)",
                    border: "1px solid var(--color-border)",
                    color: "var(--color-text-secondary)",
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
              return (
                <div key={m.id} style={{
                  background: "rgba(255, 121, 0, 0.08)",
                  border: "1.5px solid #FF7900",
                  borderRadius: "12px",
                  padding: "14px",
                  margin: "8px 0"
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
                    <Package size={16} color="#FF7900" />
                    <strong style={{ fontSize: "0.85rem", color: "#FF7900" }}>Additional Parts Request</strong>
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--color-text)", marginBottom: "4px" }}>
                    <strong>Item:</strong> {meta.description || "Required Component"}
                  </div>
                  <div style={{ fontSize: "0.82rem", color: "var(--color-text)", marginBottom: "8px" }}>
                    <strong>Amount:</strong> ₹{meta.amount || 0} • <strong>Reason:</strong> {meta.reason || "Necessary for repair"}
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => handleRespondToExtraCharge("REJECT")}
                      className="btn btn-xs btn-outline"
                      style={{ flex: 1, borderColor: "#EF4444", color: "#EF4444", fontSize: "0.75rem" }}
                    >
                      Decline
                    </button>
                    <button
                      onClick={() => handleRespondToExtraCharge("APPROVE")}
                      className="btn btn-xs btn-primary"
                      style={{ flex: 1, background: "#10B981", color: "white", fontSize: "0.75rem", fontWeight: "800" }}
                    >
                      ✓ Approve ₹{meta.amount}
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div
                key={m.id}
                style={{
                  alignSelf: isMe ? "flex-end" : "flex-start",
                  maxWidth: "80%",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: isMe ? "flex-end" : "flex-start"
                }}
              >
                <div style={{
                  background: isMe ? "linear-gradient(135deg, #FF7900, #E05300)" : "var(--color-surface-hover)",
                  color: isMe ? "white" : "var(--color-text)",
                  border: isMe ? "none" : "1px solid var(--color-border)",
                  borderRadius: isMe ? "14px 14px 2px 14px" : "14px 14px 14px 2px",
                  padding: "10px 14px",
                  fontSize: "0.88rem",
                  lineHeight: "1.4",
                  wordBreak: "break-word"
                }}>
                  {m.content}
                </div>

                <div style={{
                  fontSize: "0.68rem",
                  color: "var(--color-text-muted)",
                  marginTop: "3px",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}>
                  {m.created_at ? new Date(m.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : "Just now"}
                  {isMe && (
                    m.is_read ? <CheckCheck size={12} color="#3B82F6" /> : <Check size={12} />
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Action Chips */}
      <div style={{
        padding: "8px 16px",
        borderTop: "1px solid var(--color-border)",
        background: "var(--color-surface-hover)",
        display: "flex",
        gap: "6px",
        overflowX: "auto"
      }}>
        <button
          onClick={() => handleSendMessage(null, "I am at the main apartment gate / building entrance.")}
          className="btn btn-xs btn-outline"
          style={{ fontSize: "0.72rem", whiteSpace: "nowrap", borderRadius: "12px", cursor: "pointer" }}
        >
          📍 Waiting at Gate
        </button>
        <button
          onClick={() => handleSendMessage(null, "Please call me when you reach the street corner.")}
          className="btn btn-xs btn-outline"
          style={{ fontSize: "0.72rem", whiteSpace: "nowrap", borderRadius: "12px", cursor: "pointer" }}
        >
          📞 Call on Arrival
        </button>
      </div>

      {/* Input Box */}
      <form
        onSubmit={handleSendMessage}
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--color-border)",
          display: "flex",
          gap: "8px",
          alignItems: "center"
        }}
      >
        <input
          type="text"
          placeholder="Type message to technician..."
          value={inputContent}
          onChange={(e) => setInputContent(e.target.value)}
          disabled={submitting}
          style={{
            flex: 1,
            padding: "10px 14px",
            borderRadius: "20px",
            border: "1px solid var(--color-border)",
            background: "var(--color-surface-hover)",
            fontSize: "0.85rem",
            color: "var(--color-text)",
            outline: "none"
          }}
        />
        <button
          type="submit"
          disabled={submitting || !inputContent.trim()}
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
            color: "white"
          }}
        >
          <Send size={16} />
        </button>
      </form>

      {/* Customer Report Issue Modal */}
      {showIssueModal && (
        <div style={{
          position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(5, 10, 18, 0.85)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center",
          zIndex: 10000, padding: "16px"
        }}>
          <div style={{
            background: "var(--color-surface)",
            borderRadius: "16px",
            border: "1px solid var(--color-border)",
            maxWidth: "460px",
            width: "100%",
            padding: "20px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#EF4444" }}>
                <AlertTriangle size={20} />
                <h3 style={{ fontSize: "1.05rem", fontWeight: "800", margin: 0, color: "var(--color-text)" }}>
                  Report Service Dispute / Issue
                </h3>
              </div>
              <button onClick={() => setShowIssueModal(false)} className="btn btn-xs btn-outline">
                <X size={14} />
              </button>
            </div>

            <form onSubmit={handleSubmitIssue}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                  Issue Category:
                </label>
                <select
                  value={issueCategory}
                  onChange={(e) => setIssueCategory(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface-hover)",
                    fontSize: "0.85rem"
                  }}
                >
                  <option value="Pillar late / delay">Pillar late / delay</option>
                  <option value="Wrong service / skill issue">Wrong service / skill issue</option>
                  <option value="Pricing / billing dispute">Pricing / billing dispute</option>
                  <option value="Safety / behavior concern">Safety / behavior concern</option>
                  <option value="Technical or appliance problem">Technical or appliance problem</option>
                </select>
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={{ fontSize: "0.78rem", fontWeight: "700", display: "block", marginBottom: "4px" }}>
                  Describe what happened:
                </label>
                <textarea
                  required
                  rows={3}
                  placeholder="Explain the issue clearly. This creates an auditable support ticket."
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  style={{
                    width: "100%", padding: "8px 12px", borderRadius: "8px",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface-hover)",
                    fontSize: "0.85rem", resize: "none"
                  }}
                />
              </div>

              <div style={{ display: "flex", gap: "8px" }}>
                <button type="button" onClick={() => setShowIssueModal(false)} className="btn btn-outline" style={{ flex: 1 }}>
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingIssue}
                  className="btn btn-primary"
                  style={{ flex: 2, background: "#EF4444", color: "white", fontWeight: "800" }}
                >
                  {isSubmittingIssue ? "Logging..." : "Submit to Support"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
