import React, { useState, useEffect, useRef } from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { aiService } from "../../../services/pillar/aiService";
import { useNavigate } from "react-router-dom";
import Hero3D from "../../../components/hero3d/Hero3D";
import {
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Sparkles,
  Bot,
  RefreshCw,
  TrendingUp,
  Zap,
  Users,
  ClipboardList,
  Wallet,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info
} from "lucide-react";

export default function AdminChatAI() {
  const { t, language, changeLanguage } = useTranslation();
  const { user, profile, session } = useAuth();
  const navigate = useNavigate();

  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState(null);
  const [heroState, setHeroState] = useState("idle");
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  // Initial welcome message
  useEffect(() => {
    const welcomeGreeting = language === "ta"
      ? "வணக்கம் கூட்டுறவு நிர்வாகி! 🙏 நான் CoopBot, உங்கள் 24/7 AI செயல்பாட்டு மற்றும் பணி ஒதுக்கீட்டு ஆலோசகர்.\n\nChronos-2 தேவை முன்கணிப்பு, பில்லர் திறன் சரிபார்ப்பு, தானியங்கி பணி ஒதுக்கீடு, மற்றும் நேரலை வருவாய் பகுப்பாய்வு பற்றி என்னிடம் கேட்கலாம்."
      : "Welcome Cooperative Administrator! 👋 I am CoopBot, your 24/7 AI Operations Intelligence & Dispatch Assistant.\n\nYou can query Chronos-2 demand forecasts, workforce allocation candidates, technician KYC verification status, or platform revenue audits.";

    setMessages([
      {
        id: "admin-welcome-1",
        sender: "hero",
        text: welcomeGreeting,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  }, [language]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Text-To-Speech
  const speakText = (text, msgId) => {
    if (!("speechSynthesis" in window)) {
      alert("Text-to-speech is not supported in this browser.");
      return;
    }

    if (speakingMsgId === msgId) {
      window.speechSynthesis.cancel();
      setSpeakingMsgId(null);
      setHeroState("idle");
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, "").trim();
    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.lang = language === "ta" ? "ta-IN" : language === "hi" ? "hi-IN" : "en-US";
    utterance.rate = 1.0;
    utterance.pitch = 1.05;

    utterance.onstart = () => {
      setSpeakingMsgId(msgId);
      setHeroState("speaking");
    };
    utterance.onend = () => {
      setSpeakingMsgId(null);
      setHeroState("idle");
    };
    utterance.onerror = () => {
      setSpeakingMsgId(null);
      setHeroState("idle");
    };

    window.speechSynthesis.speak(utterance);
  };

  // Voice recognition (Speech to text)
  const toggleListening = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) {
      alert("Voice speech recognition is not supported in this browser.");
      return;
    }

    if (isListening) {
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SR();
      recognition.lang = language === "ta" ? "ta-IN" : language === "hi" ? "hi-IN" : "en-US";
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setHeroState("listening");
      };
      recognition.onend = () => {
        setIsListening(false);
        setHeroState("idle");
      };
      recognition.onerror = () => {
        setIsListening(false);
        setHeroState("idle");
      };
      recognition.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        if (transcript) {
          setInput(transcript);
          inputRef.current?.focus();
        }
      };
      recognition.start();
    } catch {
      setIsListening(false);
      setHeroState("idle");
    }
  };

  // Send message to real AI
  const handleSend = async (e, directText = null) => {
    e?.preventDefault();
    const textToSend = (directText || input).trim();
    if (!textToSend || loading) return;

    setInput("");
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: textToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);
    setHeroState("thinking");

    try {
      const response = await aiService.chatWithMascot({
        message: textToSend,
        context: {
          isAuthenticated: true,
          user,
          profile,
          session,
          route: "/admin",
          language,
        },
      });

      const replyText = response?.reply || "I have analyzed your operational request.";

      const aiMsg = {
        id: `hero-${Date.now()}`,
        sender: "hero",
        text: replyText,
        route: response?.route,
        provider: response?.provider || "CoopBot Operations AI",
        intent: response?.intent,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };

      setMessages((prev) => [...prev, aiMsg]);
      setHeroState("idle");

      // Auto-speak short responses if audio is preferred
      if (replyText.length < 180) {
        speakText(replyText, aiMsg.id);
      }
    } catch (err) {
      console.error("Admin AI error:", err);
      setMessages((prev) => [
        ...prev,
        {
          id: `err-${Date.now()}`,
          sender: "hero",
          text: "⚠️ I encountered a temporary synchronization error. You can also explore direct metrics across the Admin sections.",
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      setHeroState("idle");
    } finally {
      setLoading(false);
    }
  };

  // Quick Prompt Chips
  const quickPrompts = [
    {
      label: "📈 Forecast 24h Demand",
      query: "Show Chronos-2 demand forecast and peak shortage for tomorrow",
      icon: TrendingUp,
      color: "#F57C20",
    },
    {
      label: "⚡ Workforce Allocation",
      query: "Recommend worker allocation for unassigned pending requests",
      icon: Zap,
      color: "#10B981",
    },
    {
      label: "👥 Pillars Overview",
      query: "Give me an overview of all registered Pillars and pending KYC verification",
      icon: Users,
      color: "#3B82F6",
    },
    {
      label: "📦 Pending Requests",
      query: "What is the status of active customer service requests?",
      icon: ClipboardList,
      color: "#8B5CF6",
    },
    {
      label: "💰 Financial Revenue",
      query: "Show platform GMV revenue, payout summary, and cooperative commissions",
      icon: Wallet,
      color: "#EC4899",
    },
  ];

  const clearChat = () => {
    setMessages([
      {
        id: `welcome-${Date.now()}`,
        sender: "hero",
        text: language === "ta"
          ? "அரட்டை மீட்டமைக்கப்பட்டது. புதிய செயல்பாட்டுக் கேள்விகளைக் கேட்கலாம்."
          : "Chat history cleared. CoopBot Operations AI is ready for your instructions.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);
  };

  return (
    <div className="fade-in" style={{ height: "calc(100vh - var(--header-height) - 40px)", display: "flex", flexDirection: "column", gap: "16px" }}>
      
      {/* ─── Top Operational Header ─── */}
      <div style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "16px 20px",
        background: "var(--color-surface)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        flexWrap: "wrap",
        gap: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          {/* Standing Character Mini Box */}
          <div style={{
            width: "56px",
            height: "56px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, var(--color-primary), #1B2A4A)",
            border: "2px solid var(--color-secondary)",
            boxShadow: "0 4px 12px rgba(245, 124, 32, 0.25)",
            overflow: "hidden",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}>
            <Hero3D mode="avatar" state={isListening ? 'listening' : loading ? 'thinking' : heroState} style={{ width: "100%", height: "100%" }} />
          </div>

          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              <h1 style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--color-text)", margin: 0 }}>
                CoopBot AI Operations Console
              </h1>
              <span style={{
                background: "rgba(16, 185, 129, 0.15)",
                color: "#10B981",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                fontSize: "11px",
                fontWeight: "700",
                padding: "2px 8px",
                borderRadius: "12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "4px"
              }}>
                <span className="status-dot available" style={{ width: "6px", height: "6px", background: "#10B981" }}></span>
                Chronos-2 & NeMo Live
              </span>
            </div>
            <p style={{ margin: "3px 0 0 0", fontSize: "12px", color: "var(--color-text-secondary)" }}>
              Autonomous dispatch intelligence, workforce allocation, predictive demand telemetry & cooperative governance.
            </p>
          </div>
        </div>

        {/* Toolbar */}
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button
            onClick={clearChat}
            className="btn btn-outline btn-sm"
            style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px" }}
            title="Clear Chat History"
          >
            <RefreshCw size={13} /> Clear
          </button>

          <button
            onClick={() => navigate("/admin/forecast")}
            className="btn btn-outline btn-sm"
            style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", color: "var(--color-secondary)" }}
          >
            <TrendingUp size={13} /> Forecast Hub
          </button>

          <button
            onClick={() => navigate("/admin/allocation")}
            className="btn btn-outline btn-sm"
            style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", color: "#10B981" }}
          >
            <Zap size={13} /> Allocation
          </button>
        </div>
      </div>

      {/* ─── Main Chat Workspace ─── */}
      <div style={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        background: "var(--color-surface)",
        borderRadius: "var(--radius-xl)",
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden",
        position: "relative",
      }}>
        
        {/* Message Stream */}
        <div style={{
          flex: 1,
          overflowY: "auto",
          padding: "24px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}>
          {messages.map((m) => {
            const isUser = m.sender === "user";
            return (
              <div
                key={m.id}
                style={{
                  display: "flex",
                  justifyContent: isUser ? "flex-end" : "flex-start",
                  alignItems: "flex-start",
                  gap: "12px",
                }}
              >
                {!isUser && (
                  <div style={{
                    width: "38px",
                    height: "38px",
                    borderRadius: "50%",
                    background: "#1B2A4A",
                    border: "2px solid var(--color-secondary)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    overflow: "hidden",
                    flexShrink: 0,
                    marginTop: "2px",
                  }}>
                    <Hero3D mode="avatar" state="idle" style={{ width: "100%", height: "100%" }} />
                  </div>
                )}

                <div
                  style={{
                    maxWidth: "75%",
                    padding: "14px 18px",
                    borderRadius: isUser ? "18px 18px 4px 18px" : "18px 18px 18px 4px",
                    background: isUser
                      ? "linear-gradient(135deg, var(--color-primary), var(--color-primary-light, #1E3A8A))"
                      : "var(--color-background)",
                    color: isUser ? "#FFFFFF" : "var(--color-text)",
                    border: isUser ? "none" : "1px solid var(--color-border)",
                    boxShadow: "0 2px 8px rgba(0, 0, 0, 0.06)",
                    fontSize: "13.5px",
                    lineHeight: "1.6",
                    whiteSpace: "pre-wrap",
                  }}
                >
                  {/* Sender title & TTS */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: "6px",
                    borderBottom: isUser ? "1px solid rgba(255,255,255,0.15)" : "1px solid var(--color-border)",
                    paddingBottom: "4px",
                  }}>
                    <span style={{
                      fontWeight: "700",
                      fontSize: "11px",
                      textTransform: "uppercase",
                      letterSpacing: "0.8px",
                      color: isUser ? "rgba(255,255,255,0.85)" : "var(--color-secondary)",
                    }}>
                      {isUser ? (profile?.full_name || "Cooperative Admin") : "CoopBot Intelligence"}
                    </span>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ fontSize: "10.5px", opacity: 0.6 }}>
                        {m.timestamp}
                      </span>
                      {!isUser && (
                        <button
                          onClick={() => speakText(m.text, m.id)}
                          style={{
                            background: "transparent",
                            border: "none",
                            cursor: "pointer",
                            color: speakingMsgId === m.id ? "#10B981" : "var(--color-text-secondary)",
                            padding: "2px",
                            display: "flex",
                            alignItems: "center",
                          }}
                          title={speakingMsgId === m.id ? "Stop voice" : "Read aloud"}
                        >
                          {speakingMsgId === m.id ? <VolumeX size={14} className="spin" /> : <Volume2 size={14} />}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Message Body */}
                  <div>{m.text}</div>

                  {/* Contextual Action Link */}
                  {m.route && (
                    <div style={{ marginTop: "12px", paddingTop: "8px", borderTop: "1px solid var(--color-border)" }}>
                      <button
                        onClick={() => navigate(m.route)}
                        className="btn btn-secondary btn-sm"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          fontSize: "11.5px",
                          fontWeight: "700",
                          borderRadius: "8px",
                          padding: "6px 12px",
                        }}
                      >
                        Inspect in Console: {m.route.replace("/admin/", "").toUpperCase()} <ArrowRight size={13} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {loading && (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <div style={{
                width: "38px",
                height: "38px",
                borderRadius: "50%",
                background: "#1B2A4A",
                border: "2px solid var(--color-secondary)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                overflow: "hidden",
                flexShrink: 0,
              }}>
                <Hero3D mode="avatar" state="thinking" style={{ width: "100%", height: "100%" }} />
              </div>
              <div style={{
                padding: "12px 18px",
                borderRadius: "18px 18px 18px 4px",
                background: "var(--color-background)",
                color: "var(--color-text-secondary)",
                border: "1px solid var(--color-border)",
                fontSize: "13px",
                display: "flex",
                alignItems: "center",
                gap: "8px",
              }}>
                <Sparkles size={16} color="var(--color-secondary)" className="spin" />
                <span>CoopBot is processing operations telemetry & neural forecasts...</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Action Prompts Bar */}
        <div style={{
          padding: "8px 20px",
          borderTop: "1px solid var(--color-border)",
          background: "var(--color-background)",
          display: "flex",
          gap: "8px",
          overflowX: "auto",
        }} className="hide-scrollbar">
          {quickPrompts.map((p) => {
            const IconComponent = p.icon;
            return (
              <button
                key={p.label}
                onClick={() => handleSend(null, p.query)}
                disabled={loading}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "6px 12px",
                  borderRadius: "20px",
                  background: "var(--color-surface)",
                  border: "1px solid var(--color-border)",
                  color: "var(--color-text)",
                  fontSize: "11.5px",
                  fontWeight: "600",
                  cursor: loading ? "default" : "pointer",
                  whiteSpace: "nowrap",
                  transition: "all 0.2s ease",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = p.color;
                  e.currentTarget.style.color = p.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "var(--color-border)";
                  e.currentTarget.style.color = "var(--color-text)";
                }}
              >
                <IconComponent size={13} color={p.color} />
                <span>{p.label}</span>
              </button>
            );
          })}
        </div>

        {/* Input Bar */}
        <form
          onSubmit={handleSend}
          style={{
            padding: "14px 20px",
            borderTop: "1px solid var(--color-border)",
            background: "var(--color-surface)",
            display: "flex",
            alignItems: "center",
            gap: "12px",
          }}
        >
          <button
            type="button"
            onClick={toggleListening}
            style={{
              width: "42px",
              height: "42px",
              borderRadius: "50%",
              border: isListening ? "2px solid #EF4444" : "1px solid var(--color-border)",
              background: isListening ? "rgba(239, 68, 68, 0.15)" : "var(--color-background)",
              color: isListening ? "#EF4444" : "var(--color-text)",
              cursor: "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
              transition: "all 0.2s ease",
            }}
            title={isListening ? "Stop listening" : "Voice input (Tamil / English)"}
          >
            {isListening ? <MicOff size={18} /> : <Mic size={18} />}
          </button>

          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={
              language === "ta"
                ? "Chronos-2 முன்னறிவிப்பு, பில்லர் ஒதுக்கீடு அல்லது வருவாய் பற்றி கேளுங்கள்..."
                : "Ask about workforce telemetry, Chronos-2 forecast, Pillar verification, or dispatch..."
            }
            style={{
              flex: 1,
              height: "44px",
              padding: "0 16px",
              borderRadius: "22px",
              border: "1px solid var(--color-border)",
              background: "var(--color-background)",
              color: "var(--color-text)",
              fontSize: "13.5px",
              outline: "none",
            }}
          />

          <button
            type="submit"
            disabled={loading || !input.trim()}
            style={{
              height: "44px",
              padding: "0 20px",
              borderRadius: "22px",
              border: "none",
              background: input.trim() ? "var(--color-secondary)" : "var(--color-border)",
              color: "white",
              fontWeight: "700",
              fontSize: "13px",
              cursor: input.trim() ? "pointer" : "default",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              transition: "all 0.2s ease",
              flexShrink: 0,
            }}
          >
            <span>Send</span>
            <Send size={15} />
          </button>
        </form>
      </div>

    </div>
  );
}
