import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { getLanguageMetadata } from "../../../i18n/languages.js";
import { translateDynamic } from "../../../i18n/centralEngine.js";
import { useAuth } from "../../../context/AuthContext";
import { aiService } from "../../../services/pillar/aiService";
import { heroNotificationHub } from "../../../services/ai/heroNotificationHub";
import { Send, Mic, MicOff, X, Sparkles, MessageSquare, Bot, Volume2, VolumeX, Bell, Paperclip, Check, User, FileText } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import Hero3D from "../../hero3d/Hero3D";

export default function MascotFloating() {
  const { t, language } = useTranslation();
  const { isAuthenticated, session, profile, user } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);
  const [activeNotifBubble, setActiveNotifBubble] = useState(null);
  const [isVoiceMuted, setIsVoiceMuted] = useState(heroNotificationHub.isMuted);
  const [attachment, setAttachment] = useState(null);
  const [isInputFocused, setIsInputFocused] = useState(false);

  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const fileInputRef = useRef(null);

  // Dynamic user profile from real authentication state (zero fake data)
  const userAvatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || null;
  const userDisplayName = profile?.full_name || profile?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || '';
  const userInitial = userDisplayName ? userDisplayName.charAt(0).toUpperCase() : null;

  // Listen for global custom event to open Chat Assistant
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener("open-chat-assistant", handleOpenChat);
    return () => {
      window.removeEventListener("open-chat-assistant", handleOpenChat);
    };
  }, []);

  const isAdminRoute = location.pathname.startsWith("/admin");

  // Initial greeting (dynamically translated for any supported language)
  useEffect(() => {
    let isMounted = true;
    const baseGreeting = isAdminRoute
      ? "Welcome Administrator! I am CoopBot, your 24/7 AI Operations Assistant. Ask about workforce telemetry, service requests, pillar verification, or revenue analytics."
      : "Welcome! I am CoopBot, your 24/7 AI Assistant. Ask about your bookings, earnings, arrival OTPs, or customer chats.";

    const loadGreeting = async () => {
      let greeting = baseGreeting;
      if (language !== "en") {
        greeting = await translateDynamic(baseGreeting, language, "en");
      }
      if (isMounted) {
        setMessages([
          {
            id: "msg-welcome",
            sender: "mascot",
            text: greeting,
            timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        ]);
      }
    };

    loadGreeting();
    return () => { isMounted = false; };
  }, [language, isAdminRoute]);

  // Unified Hero AI Realtime Notification Subscription & Voice Announcements
  useEffect(() => {
    const unsubscribe = heroNotificationHub.subscribe(({ latest, unreadCount, isMuted: muted }) => {
      setUnreadNotifCount(unreadCount);
      setIsVoiceMuted(muted);

      if (latest) {
        // Show floating notification bubble for 9 seconds
        setActiveNotifBubble(latest);
        setTimeout(() => {
          setActiveNotifBubble((curr) => (curr?.id === latest.id ? null : curr));
        }, 9000);

        // Inject notification into messages
        setMessages((prev) => [
          ...prev,
          {
            id: `notif-${latest.id}`,
            sender: "mascot",
            isNotification: true,
            title: latest.title,
            text: `🔔 **${latest.title}**\n${latest.message}`,
            timestamp: latest.timestamp,
            actionUrl: latest.actionUrl
          }
        ]);
      }
    });

    return () => unsubscribe();
  }, [language]);

  const scrollToBottomIfNeeded = () => {
    const el = scrollContainerRef.current;
    if (!el) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
    if (distanceFromBottom <= 140) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottomIfNeeded();
      // Mark notifications as read when chat is opened
      heroNotificationHub.markAllRead();
      setUnreadNotifCount(0);
    }
  }, [messages, isOpen]);

  // File Attachment Handlers
  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setAttachment({
        name: file.name,
        size: `${(file.size / 1024).toFixed(1)} KB`,
        file,
      });
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = () => {
    setAttachment(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Text-To-Speech (Agent Speaks aloud)
  const speakText = (text, msgId) => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      return;
    }

    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    const meta = getLanguageMetadata(language);
    utterance.lang = meta?.bcp47 || "en-IN";
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    utterance.onstart = () => setSpeakingMsgId(msgId);
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if ((!input.trim() && !attachment) || isTyping) return;

    const userText = input.trim();
    const sentAttachment = attachment;
    setInput("");
    setAttachment(null);
    setIsInputFocused(false);

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: userText,
      attachment: sentAttachment,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const combinedText = sentAttachment
        ? `[Attachment: ${sentAttachment.name}] ${userText}`.trim()
        : userText;

      // Direct live AI pipeline with Chronos-2 & Intent Router
      const res = await aiService.chatWithMascot(combinedText, {
        language,
        role: isAdminRoute ? "admin" : "pillar",
        currentPath: location.pathname
      });

      const mascotMsg = {
        id: `mascot-${Date.now()}`,
        sender: "mascot",
        text: res.text || res.message || "I am processing your request with COOP HUB intelligence.",
        route: res.route,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, mascotMsg]);

      // Speak aloud automatically if not muted
      if (!isVoiceMuted) {
        speakText(mascotMsg.text, mascotMsg.id);
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `mascot-err-${Date.now()}`,
          sender: "mascot",
          text: "I am ready to help. You can ask about your orders, customer messages, arrival OTP, or platform tariffs.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleVoice = () => {
    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in your browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    const recognition = new SpeechRecognition();
    const meta = getLanguageMetadata(language);
    recognition.lang = meta?.bcp47 || "en-IN";
    recognition.interimResults = false;

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onerror = () => setIsListening(false);

    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setInput(transcript);
    };

    recognition.start();
  };

  return (
    <>
      {/* ============================================================ */}
      {/* FLOATING 3D HERO MASCOT BUTTON (PORTAL-WIDE)                  */}
      {/* ============================================================ */}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: "var(--z-mascot, 500)",
          display: "flex",
          alignItems: "center",
          gap: "12px",
        }}
      >
        {/* Floating Notification Alert Bubble above Mascot */}
        {!isOpen && activeNotifBubble && (
          <div
            onClick={() => {
              setIsOpen(true);
              setActiveNotifBubble(null);
            }}
            style={{
              position: "absolute",
              bottom: "78px",
              right: "0",
              width: "290px",
              background: "#162238",
              color: "#FFFFFF",
              borderRadius: "16px",
              padding: "12px 14px",
              boxShadow: "0 10px 25px rgba(0,0,0,0.4), 0 0 0 2px #FF7900",
              border: "1px solid #FF7900",
              cursor: "pointer",
              animation: "slideUp 0.3s ease",
              zIndex: 1000
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981" }}></span>
                <span style={{ fontSize: "11px", fontWeight: "800", color: "#FF7900", textTransform: "uppercase" }}>
                  🔔 Hero AI Alert
                </span>
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setActiveNotifBubble(null);
                }}
                style={{ background: "transparent", border: "none", color: "#94A3B8", cursor: "pointer", fontSize: "13px", padding: "0 4px" }}
              >
                ✕
              </button>
            </div>
            <div style={{ fontSize: "12.5px", fontWeight: "700", color: "#FFFFFF", marginBottom: "2px" }}>
              {activeNotifBubble.title}
            </div>
            <div style={{ fontSize: "11.5px", color: "#CBD5E1", lineHeight: "1.4" }}>
              {activeNotifBubble.message}
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "8px", paddingTop: "6px", borderTop: "1px solid rgba(255,255,255,0.1)", fontSize: "10.5px" }}>
              <span style={{ color: "#94A3B8" }}>{activeNotifBubble.timestamp}</span>
              <span style={{ color: "#FF7900", fontWeight: "700" }}>Tap to open chat →</span>
            </div>
          </div>
        )}

        {!isOpen && !activeNotifBubble && (
          <div
            onClick={() => setIsOpen(true)}
            style={{
              background: "var(--color-surface)",
              padding: "8px 16px",
              borderRadius: "9999px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
              cursor: "pointer",
              fontSize: "13px",
              fontWeight: "600",
              color: "var(--color-text)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              border: "1px solid var(--color-border)",
              animation: "slideInRight 0.3s ease",
            }}
          >
            <Sparkles size={16} color="var(--color-secondary)" />
            <span>CoopBot Assistant</span>
          </div>
        )}

        <div style={{ position: "relative" }}>
          {/* Pulsating unread badge on 3D Mascot button */}
          {unreadNotifCount > 0 && !isOpen && (
            <div
              style={{
                position: "absolute",
                top: "-4px",
                right: "-4px",
                background: "#EF4444",
                color: "#FFFFFF",
                fontSize: "11px",
                fontWeight: "900",
                minWidth: "22px",
                height: "22px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "2px solid #FFFFFF",
                boxShadow: "0 0 10px rgba(239, 68, 68, 0.7)",
                zIndex: 10
              }}
            >
              {unreadNotifCount}
            </div>
          )}

          <button
            onClick={() => setIsOpen(!isOpen)}
            style={{
              width: "66px",
              height: "66px",
              borderRadius: "50%",
              background: "linear-gradient(135deg, var(--color-secondary), #D46510)",
              boxShadow: "0 0 24px rgba(245, 124, 32, 0.4), 0 8px 16px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "white",
              cursor: "pointer",
              transition: "all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)",
              border: "3px solid white",
              overflow: "hidden",
              padding: 0,
            }}
            title="CoopBot AI Assistant"
          >
            {isOpen ? (
              <X size={30} />
            ) : (
              <Hero3D mode="bubble" state={isListening ? 'listening' : isTyping ? 'thinking' : speakingMsgId ? 'speaking' : 'idle'} style={{ width: "100%", height: "100%" }} />
            )}
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* CHATAGENT CONVERSATIONAL DRAWER (HIGH CONTRAST DARK/LIGHT)   */}
      {/* ============================================================ */}
      {isOpen && (
        <div
          className="coopbot-window-enter"
          style={{
            position: "fixed",
            bottom: "102px",
            right: "24px",
            width: "410px",
            maxWidth: "calc(100vw - 32px)",
            height: "580px",
            maxHeight: "calc(100vh - 120px)",
            background: "var(--color-surface)",
            color: "var(--color-text)",
            borderRadius: "22px",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.4), 0 0 0 1px var(--color-border)",
            display: "flex",
            flexDirection: "column",
            zIndex: "var(--z-mascot, 500)",
            overflow: "hidden",
            border: "1px solid var(--color-border)",
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "16px 20px",
              background: "linear-gradient(135deg, var(--color-primary), var(--color-primary-light))",
              color: "white",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div
                style={{
                  width: "42px",
                  height: "42px",
                  borderRadius: "50%",
                  background: "#1B2A4A",
                  overflow: "hidden",
                  border: "2px solid var(--color-secondary)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Hero3D mode="avatar" state={isListening ? 'listening' : isTyping ? 'thinking' : speakingMsgId ? 'speaking' : 'idle'} style={{ width: "100%", height: "100%" }} />
              </div>
              <div>
                <h4 style={{ fontWeight: "800", fontSize: "15px", margin: 0, letterSpacing: "0.3px", color: "white" }}>CoopBot AI</h4>
                <span style={{ fontSize: "11px", opacity: 0.9, display: "flex", alignItems: "center", gap: "5px" }}>
                  <span className="status-dot available" style={{ width: "6px", height: "6px" }}></span>
                  {isAdminRoute ? "Cooperative Admin Intelligence" : "Authenticated Pillar Assistant"}
                </span>
              </div>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <button
                onClick={() => {
                  const muted = heroNotificationHub.toggleVoiceMute();
                  setIsVoiceMuted(muted);
                }}
                className="btn-icon"
                style={{
                  color: isVoiceMuted ? "#94A3B8" : "#FFFFFF",
                  background: isVoiceMuted ? "rgba(255,255,255,0.1)" : "rgba(255, 121, 0, 0.3)",
                  borderRadius: "8px",
                  padding: "6px",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}
                aria-label={isVoiceMuted ? "Unmute voice announcements" : "Mute voice announcements"}
                title={isVoiceMuted ? "Unmute Hero Voice Announcements" : "Mute Hero Voice Announcements"}
              >
                {isVoiceMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
              </button>
              <button
                className="btn-icon"
                onClick={() => setIsOpen(false)}
                aria-label="Close chat"
                title="Close chat"
                style={{ color: "white", background: "transparent", border: "none", cursor: "pointer", padding: "6px", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={20} />
              </button>
            </div>
          </div>

          {/* Quick Action Chips (Dynamic for Admin vs Pillar) */}
          <div
            style={{
              padding: "8px 12px",
              background: "var(--color-surface-hover)",
              borderBottom: "1px solid var(--color-border)",
              display: "flex",
              gap: "6px",
              overflowX: "auto",
              whiteSpace: "nowrap",
            }}
          >
            {isAdminRoute ? (
              <>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "12px", background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
                  onClick={() => setInput("How many pending pillar verifications exist?")}
                >
                  👥 Pillar KYC
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "12px", background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
                  onClick={() => setInput("Show live technician tracking status")}
                >
                  📍 Live Tracking
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "12px", background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
                  onClick={() => setInput("What is our total revenue and commission?")}
                >
                  💰 Total GMV
                </button>
              </>
            ) : (
              <>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "12px", background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
                  onClick={() => setInput("Show my current orders")}
                >
                  📦 My Orders
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "12px", background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
                  onClick={() => setInput("Check my earnings summary")}
                >
                  💰 Earnings
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "12px", background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
                  onClick={() => setInput("How do I verify customer arrival OTP?")}
                >
                  📍 Arrival OTP
                </button>
              </>
            )}
          </div>

          {/* Messages Feed with Intelligent Scroll */}
          <div
            ref={scrollContainerRef}
            style={{
              flex: 1,
              padding: "16px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "14px",
              background: "var(--color-background)",
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                className="coopbot-msg-in"
                style={{
                  display: "flex",
                  alignItems: "flex-end",
                  gap: "8px",
                  justifyContent: m.sender === "user" ? "flex-end" : "flex-start",
                }}
              >
                {/* Assistant profile avatar on left */}
                {m.sender === "mascot" && (
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "#1B2A4A",
                      overflow: "hidden",
                      border: "1.5px solid var(--color-secondary)",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                    title="CoopBot"
                  >
                    <Hero3D mode="avatar" state={speakingMsgId === m.id ? 'speaking' : 'idle'} style={{ width: "100%", height: "100%" }} />
                  </div>
                )}

                <div
                  style={{
                    maxWidth: "80%",
                    padding: "12px 16px",
                    borderRadius: "16px",
                    borderBottomLeftRadius: m.sender === "mascot" ? "4px" : "16px",
                    borderBottomRightRadius: m.sender === "user" ? "4px" : "16px",
                    background: m.sender === "user" ? "var(--color-secondary)" : m.isNotification ? "rgba(255, 121, 0, 0.08)" : "var(--color-surface)",
                    color: m.sender === "user" ? "#FFFFFF" : "var(--color-text)",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.08)",
                    border: m.sender === "user" ? "none" : m.isNotification ? "1px solid #FF7900" : "1px solid var(--color-border)",
                    fontSize: "13.5px",
                    lineHeight: "1.5",
                    whiteSpace: "pre-line",
                    position: "relative",
                  }}
                >
                  {/* Attachment metadata preview inside user message */}
                  {m.attachment && (
                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "6px",
                        padding: "6px 10px",
                        marginBottom: "6px",
                        borderRadius: "8px",
                        background: "rgba(0,0,0,0.15)",
                        fontSize: "11.5px",
                      }}
                    >
                      <Paperclip size={13} />
                      <span style={{ fontWeight: "600" }}>{m.attachment.name}</span>
                      <span style={{ opacity: 0.8, fontSize: "10px" }}>({m.attachment.size})</span>
                    </div>
                  )}

                  <p style={{ margin: 0, color: m.sender === "user" ? "#FFFFFF" : "var(--color-text)" }}>{m.text}</p>

                  {/* Speaker Button on Assistant Messages */}
                  {m.sender === "mascot" && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "8px", paddingTop: "6px", borderTop: "1px solid var(--color-border)" }}>
                      <button
                        onClick={() => speakText(m.text, m.id)}
                        className="btn-icon"
                        style={{
                          padding: "4px 8px",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          fontSize: "11px",
                          fontWeight: "600",
                          color: speakingMsgId === m.id ? "var(--color-secondary)" : "var(--color-text-secondary)",
                          background: speakingMsgId === m.id ? "rgba(245, 124, 32, 0.15)" : "transparent",
                          borderRadius: "6px",
                          border: "none",
                          cursor: "pointer",
                        }}
                        aria-label="Text-to-speech"
                        title="Listen to response (Text-to-Speech)"
                      >
                        {speakingMsgId === m.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        <span>{speakingMsgId === m.id ? "Stop" : "Speak"}</span>
                      </button>

                      <span style={{ fontSize: "9.5px", color: "var(--color-text-muted)" }}>{m.timestamp}</span>
                    </div>
                  )}

                  {/* User message timestamp + real sent tick */}
                  {m.sender === "user" && (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "4px", marginTop: "4px" }}>
                      <span style={{ fontSize: "9.5px", opacity: 0.85, color: "rgba(255,255,255,0.9)" }}>
                        {m.timestamp}
                      </span>
                      <Check size={11} className="text-white/80 stroke-[2.5]" aria-label="Sent" />
                    </div>
                  )}

                  {m.route && (
                    <button
                      className="btn btn-outline btn-sm"
                      style={{
                        marginTop: "8px",
                        fontSize: "11px",
                        padding: "5px 10px",
                        width: "100%",
                        borderColor: "var(--color-secondary)",
                        color: "var(--color-secondary)",
                      }}
                      onClick={() => {
                        navigate(m.route);
                        setIsOpen(false);
                      }}
                    >
                      Open {m.route.replace("/dashboard/", "")} →
                    </button>
                  )}
                </div>

                {/* Real user avatar on right (no fake identities) */}
                {m.sender === "user" && (
                  <div
                    style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: "linear-gradient(135deg, #FF7900, #EA580C)",
                      overflow: "hidden",
                      border: "1.5px solid rgba(255,255,255,0.3)",
                      boxShadow: "0 2px 6px rgba(0,0,0,0.15)",
                      flexShrink: 0,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "white",
                      fontSize: "11px",
                      fontWeight: "700",
                    }}
                    title={userDisplayName || "User"}
                  >
                    {userAvatarUrl ? (
                      <img src={userAvatarUrl} alt={userDisplayName || "User"} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : userInitial ? (
                      <span>{userInitial}</span>
                    ) : (
                      <User size={14} />
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* AI thinking indicator with pulsing dots beside CoopBot avatar */}
            {isTyping && (
              <div className="coopbot-msg-in" style={{ display: "flex", alignItems: "flex-end", gap: "8px" }}>
                <div
                  style={{
                    width: "28px",
                    height: "28px",
                    borderRadius: "50%",
                    background: "#1B2A4A",
                    overflow: "hidden",
                    border: "1.5px solid var(--color-secondary)",
                    flexShrink: 0,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Hero3D mode="avatar" state="thinking" style={{ width: "100%", height: "100%" }} />
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "5px",
                    background: "var(--color-surface)",
                    border: "1px solid var(--color-border)",
                    padding: "8px 14px",
                    borderRadius: "16px",
                    borderBottomLeftRadius: "4px",
                    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
                  }}
                >
                  <span className="coopbot-dot-1" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-secondary)", display: "inline-block" }} />
                  <span className="coopbot-dot-2" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-secondary)", display: "inline-block" }} />
                  <span className="coopbot-dot-3" style={{ width: "6px", height: "6px", borderRadius: "50%", background: "var(--color-secondary)", display: "inline-block" }} />
                  <span style={{ fontSize: "11px", color: "var(--color-text-muted)", marginLeft: "4px", fontWeight: "500" }}>Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Restored Attachment Preview Chip */}
          {attachment && (
            <div
              style={{
                padding: "6px 12px",
                background: "var(--color-surface-hover)",
                borderTop: "1px solid var(--color-border)",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                fontSize: "11.5px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                <FileText size={13} color="var(--color-secondary)" />
                <span style={{ fontWeight: "600", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>{attachment.name}</span>
                <span style={{ color: "var(--color-text-muted)" }}>({attachment.size})</span>
              </div>
              <button
                type="button"
                onClick={handleRemoveAttachment}
                style={{ background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", padding: "2px" }}
                aria-label="Remove attachment"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Hidden File Input for Restored Attachment Upload */}
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            style={{ display: "none" }}
            aria-hidden="true"
          />

          {/* Composer Structure: [ ATTACHMENT ] [ ASK ME ANYTHING... ] [ MICROPHONE ] [ SEND ] */}
          <form
            onSubmit={handleSend}
            style={{
              padding: isInputFocused ? "14px 12px" : "10px 12px",
              background: "var(--color-surface)",
              borderTop: "1px solid var(--color-border)",
              display: "flex",
              gap: "8px",
              alignItems: "center",
              transition: "all 0.2s ease",
            }}
          >
            {/* 1. ATTACHMENT BUTTON (LEFT) */}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="btn-icon"
              aria-label="Attach file"
              title="Attach file"
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--color-text-muted)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                flexShrink: 0,
              }}
            >
              <Paperclip size={18} />
            </button>

            {/* 2. CHAT INPUT (MIDDLE) WITH FOCUS EXPANSION */}
            <input
              type="text"
              className="form-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              placeholder="Ask me anything..."
              aria-label="Ask me anything"
              style={{
                flex: 1,
                padding: "8px 14px",
                height: isInputFocused ? "44px" : "40px",
                borderRadius: "12px",
                background: "var(--color-background)",
                color: "var(--color-text)",
                border: isInputFocused ? "1px solid var(--color-secondary)" : "1px solid var(--color-border)",
                boxShadow: isInputFocused ? "0 0 0 2px rgba(245, 124, 32, 0.15)" : "none",
                transition: "all 0.2s ease",
                fontSize: "13px",
              }}
            />

            {/* 3. MICROPHONE WITH EQUALIZER & PULSE RING ANIMATION */}
            <button
              type="button"
              className="btn-icon"
              onClick={toggleVoice}
              aria-label={isListening ? "Stop voice listening" : "Start voice input"}
              title={isListening ? "Listening... click to stop" : "Voice Input (Speech-to-Text)"}
              style={{
                position: "relative",
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: isListening ? "white" : "var(--color-text-muted)",
                background: isListening ? "#EF4444" : "transparent",
                border: "none",
                cursor: "pointer",
                transition: "all 0.2s ease",
                flexShrink: 0,
              }}
            >
              {isListening && (
                <span
                  className="coopbot-mic-ring"
                  style={{
                    position: "absolute",
                    inset: "-4px",
                    borderRadius: "14px",
                    border: "2px solid #EF4444",
                    pointerEvents: "none",
                  }}
                />
              )}
              {isListening ? (
                <div style={{ display: "flex", alignItems: "center", gap: "2px", height: "14px" }}>
                  <span className="coopbot-wave-1" style={{ width: "2px", background: "white", borderRadius: "2px", height: "100%" }} />
                  <span className="coopbot-wave-2" style={{ width: "2px", background: "white", borderRadius: "2px", height: "100%" }} />
                  <span className="coopbot-wave-3" style={{ width: "2px", background: "white", borderRadius: "2px", height: "100%" }} />
                  <span className="coopbot-wave-4" style={{ width: "2px", background: "white", borderRadius: "2px", height: "100%" }} />
                </div>
              ) : (
                <Mic size={18} />
              )}
            </button>

            {/* 4. SEND BUTTON (RIGHT) */}
            <button
              type="submit"
              className="btn btn-primary btn-icon"
              disabled={!input.trim() && !attachment}
              aria-label="Send message"
              title="Send message"
              style={{
                width: "38px",
                height: "38px",
                borderRadius: "10px",
                opacity: !input.trim() && !attachment ? 0.5 : 1,
                cursor: !input.trim() && !attachment ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
