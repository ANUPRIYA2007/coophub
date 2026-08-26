import React, { useState, useRef, useEffect } from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { aiService } from "../../../services/pillar/aiService";
import { Send, Mic, MicOff, X, Sparkles, MessageSquare, Bot, Volume2, VolumeX } from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";

export default function MascotFloating() {
  const { t, language } = useTranslation();
  const { isAuthenticated, session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const messagesEndRef = useRef(null);

  // Listen for global custom event to open Chat Assistant
  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener("open-chat-assistant", handleOpenChat);
    return () => {
      window.removeEventListener("open-chat-assistant", handleOpenChat);
    };
  }, []);

  const isAdminRoute = location.pathname.startsWith("/admin");

  // Initial greeting
  useEffect(() => {
    let initialGreeting = "";
    if (isAdminRoute) {
      initialGreeting = language === "ta"
        ? "வணக்கம் நிர்வாகி! நான் CoopBot, உங்கள் செயல்பாட்டு AI உதவியாளர். பில்லர்கள், சேவை கோரிக்கைகள், அல்லது வருவாய் பற்றி என்னிடம் கேட்கலாம்."
        : "Welcome Administrator! I am CoopBot, your 24/7 AI Operations Assistant. Ask about workforce telemetry, service requests, pillar verification, or revenue analytics.";
    } else {
      initialGreeting = language === "ta"
        ? "வணக்கம் பில்லர்! உங்கள் ஆர்டர்கள், வருமானம் அல்லது வாடிக்கையாளர் அரட்டை பற்றி என்னிடம் எப்போது வேண்டுமானாலும் கேட்கலாம்."
        : "Welcome! I am CoopBot, your 24/7 AI Assistant. Ask about your bookings, earnings, arrival OTPs, or customer chats.";
    }

    setMessages([
      {
        id: "msg-welcome",
        sender: "mascot",
        text: initialGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [language, isAdminRoute]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen]);

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
    utterance.lang = language === "ta" ? "ta-IN" : language === "hi" ? "hi-IN" : "en-US";
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    utterance.onstart = () => setSpeakingMsgId(msgId);
    utterance.onend = () => setSpeakingMsgId(null);
    utterance.onerror = () => setSpeakingMsgId(null);

    window.speechSynthesis.speak(utterance);
  };

  const handleSend = async (e) => {
    e?.preventDefault();
    if (!input.trim() || isTyping) return;

    const userText = input.trim();
    setInput("");
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: userText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setIsTyping(true);

    try {
      const response = await aiService.chatWithMascot({
        message: userText,
        context: {
          isAuthenticated: true,
          session,
          route: location.pathname,
          language,
        },
      });

      const mascotMsg = {
        id: `mascot-${Date.now()}`,
        sender: "mascot",
        text: response.reply,
        route: response.route,
        provider: response.provider,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, mascotMsg]);
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        {
          id: `mascot-err-${Date.now()}`,
          sender: "mascot",
          text: t("ai.errorResponse") || "I am here to help. Please try asking again!",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  const toggleVoice = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert(t("ai.voiceUnavailable") || "Voice speech recognition not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = language === "ta" ? "ta-IN" : language === "hi" ? "hi-IN" : "en-US";
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
      };

      recognition.start();
    } catch (err) {
      console.error(err);
      setIsListening(false);
    }
  };

  return (
    <>
      {/* ============================================================ */}
      {/* CHATAGENT FLOATING TRIGGER (BOTTOM-RIGHT)                    */}
      {/* ============================================================ */}
      <div
        style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: "var(--z-mascot, 500)",
          display: "flex",
          alignItems: "center",
          gap: "10px",
        }}
      >
        {!isOpen && (
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
            <img
              src="/assets/images/mascot-hero.png"
              alt="CoopBot"
              style={{ width: "100%", height: "100%", objectFit: "cover" }}
            />
          )}
        </button>
      </div>

      {/* ============================================================ */}
      {/* CHATAGENT CONVERSATIONAL DRAWER (HIGH CONTRAST DARK/LIGHT)   */}
      {/* ============================================================ */}
      {isOpen && (
        <div
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
            animation: "slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
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
                  width: "44px",
                  height: "44px",
                  borderRadius: "50%",
                  background: "#1B2A4A",
                  overflow: "hidden",
                  border: "2px solid var(--color-secondary)",
                  boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              >
                <img
                  src="/assets/images/mascot-hero.png"
                  alt="CoopBot"
                  style={{ width: "100%", height: "100%", objectFit: "contain" }}
                />
              </div>
              <div>
                <h4 style={{ fontWeight: "800", fontSize: "16px", margin: 0, letterSpacing: "0.3px", color: "white" }}>CoopBot AI</h4>
                <span style={{ fontSize: "11px", opacity: 0.9, display: "flex", alignItems: "center", gap: "5px" }}>
                  <span className="status-dot available" style={{ width: "6px", height: "6px" }}></span>
                  {isAdminRoute ? "Cooperative Admin Intelligence" : "Authenticated Pillar Assistant"}
                </span>
              </div>
            </div>
            <button className="btn-icon" onClick={() => setIsOpen(false)} style={{ color: "white" }}>
              <X size={20} />
            </button>
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
            className="hide-scrollbar"
          >
            {isAdminRoute ? (
              <>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "12px", background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
                  onClick={() => setInput("Show all registered pillars summary")}
                >
                  👥 All Pillars
                </button>
                <button
                  className="btn btn-outline btn-sm"
                  style={{ fontSize: "11px", padding: "4px 10px", borderRadius: "12px", background: "var(--color-surface)", color: "var(--color-text)", borderColor: "var(--color-border)" }}
                  onClick={() => setInput("What are the active service requests?")}
                >
                  📦 Active Requests
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

          {/* Messages Feed */}
          <div
            style={{
              flex: 1,
              padding: "16px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              background: "var(--color-background)",
            }}
          >
            {messages.map((m) => (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: m.sender === "user" ? "flex-end" : "flex-start",
                }}
              >
                <div
                  style={{
                    maxWidth: "84%",
                    padding: "12px 16px",
                    borderRadius: "16px",
                    background: m.sender === "user" ? "var(--color-secondary)" : "var(--color-surface)",
                    color: m.sender === "user" ? "#FFFFFF" : "var(--color-text)",
                    boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
                    border: m.sender === "user" ? "none" : "1px solid var(--color-border)",
                    fontSize: "13.5px",
                    lineHeight: "1.5",
                    whiteSpace: "pre-line",
                    position: "relative",
                  }}
                >
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
                          cursor: "pointer",
                        }}
                        title="Listen to response (Text-to-Speech)"
                      >
                        {speakingMsgId === m.id ? <VolumeX size={14} /> : <Volume2 size={14} />}
                        <span>{speakingMsgId === m.id ? "Stop" : "Speak"}</span>
                      </button>

                      <span style={{ fontSize: "9.5px", color: "var(--color-text-muted)" }}>{m.timestamp}</span>
                    </div>
                  )}

                  {m.sender === "user" && (
                    <span style={{ fontSize: "9.5px", opacity: 0.8, display: "block", marginTop: "4px", textAlign: "right", color: "rgba(255,255,255,0.9)" }}>
                      {m.timestamp}
                    </span>
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
              </div>
            ))}

            {isTyping && (
              <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "var(--color-text-muted)", fontSize: "12px", background: "var(--color-surface)", border: "1px solid var(--color-border)", padding: "8px 12px", borderRadius: "12px", width: "fit-content" }}>
                <Bot size={16} color="var(--color-secondary)" />
                <span>CoopBot is thinking...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <form
            onSubmit={handleSend}
            style={{
              padding: "12px",
              background: "var(--color-surface)",
              borderTop: "1px solid var(--color-border)",
              display: "flex",
              gap: "8px",
              alignItems: "center",
            }}
          >
            <button
              type="button"
              className="btn-icon"
              onClick={toggleVoice}
              style={{
                color: isListening ? "var(--color-error)" : "var(--color-text-muted)",
                background: isListening ? "var(--color-error-bg)" : "transparent",
              }}
              title="Voice Input (Speech-to-Text)"
            >
              {isListening ? <MicOff size={18} /> : <Mic size={18} />}
            </button>

            <input
              type="text"
              className="form-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask me anything..."
              style={{ flex: 1, padding: "8px 14px", height: "42px", borderRadius: "12px", background: "var(--color-background)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}
            />

            <button type="submit" className="btn btn-primary btn-icon" style={{ width: "42px", height: "42px", borderRadius: "12px" }}>
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
