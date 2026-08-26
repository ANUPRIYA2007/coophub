import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { aiService } from "../../../services/pillar/aiService";
import {
  LayoutDashboard,
  ClipboardList,
  Wallet,
  Clock,
  User,
  Settings,
  HelpCircle,
  MessageSquare,
  LogOut,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  Mic,
  MicOff,
  ChevronUp,
  ChevronDown
} from "lucide-react";

export default function Sidebar({ isOpen, toggleSidebar }) {
  const { t, language } = useTranslation();
  const { profile, logout, user, session } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  // Hero AI Interactive Agent State
  const [heroState, setHeroState] = useState("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [heroExpanded, setHeroExpanded] = useState(false);
  const [heroMessages, setHeroMessages] = useState([]);
  const [heroInput, setHeroInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [currentMood, setCurrentMood] = useState("happy"); // happy | thinking | excited | helpful
  const heroMsgEndRef = useRef(null);
  const heroInputRef = useRef(null);

  const userName = profile?.full_name?.split(" ")[0] || "Senthil";

  // Friendly greeting emojis and moods per route
  const routePersonality = {
    "/admin": { emoji: "👋", mood: "happy", greeting: `Welcome back, Admin! System looks stable.` },
    "/admin/pillars": { emoji: "👥", mood: "helpful", greeting: `Let's review the Pillar network.` },
    "/admin/requests": { emoji: "📦", mood: "excited", greeting: `Active service requests overview.` },
    "/admin/tracking": { emoji: "📍", mood: "happy", greeting: `Live tracking enabled.` },
    "/admin/messages": { emoji: "💬", mood: "helpful", greeting: `System messages and broadcast.` },
    "/admin/support": { emoji: "🆘", mood: "helpful", greeting: `Support tickets needing attention.` },
    "/admin/notifications": { emoji: "🔔", mood: "excited", greeting: `Let me check system alerts...` },
    "/admin/settings": { emoji: "⚙️", mood: "helpful", greeting: `Admin configuration settings.` },
  };

  // Get personality for current route
  const getRoutePersonality = (path) => {
    for (const [route, p] of Object.entries(routePersonality)) {
      if (path === route || (route !== "/admin" && path.includes(route))) {
        return p;
      }
    }
    return routePersonality["/admin"];
  };

  // Live AI navigation tracking — queries real AI on every route change
  useEffect(() => {
    let isMounted = true;
    const path = location.pathname;
    const personality = getRoutePersonality(path);
    
    setCurrentMood(personality.mood);
    setHeroState("thinking");
    setIsLoadingAi(true);

    // Show friendly instant greeting while AI loads
    const thinkingMsg = {
      id: `thinking-${Date.now()}`,
      sender: "hero",
      text: personality.greeting,
      emoji: personality.emoji,
      isThinking: true,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setHeroMessages([thinkingMsg]);

    // Build contextual query for the live AI
    const section = path.replace("/admin/", "").replace("/admin", "overview") || "overview";
    const aiQuery = `The Cooperative Admin just navigated to the ${section} section. Give a friendly, concise 1-2 sentence guide for this page. Be professional and supportive.`;

    aiService.chatWithMascot({
      message: aiQuery,
      context: {
        isAuthenticated: true,
        user,
        profile,
        session,
        route: path,
        language,
      },
    }).then((res) => {
      if (isMounted && res?.reply) {
        const clean = res.reply.split("\n")[0].replace(/[*#_]/g, "").slice(0, 180);
        setHeroMessages([{
          id: `guide-${Date.now()}`,
          sender: "hero",
          text: clean,
          emoji: personality.emoji,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }]);
        setHeroState("idle");
        setCurrentMood(personality.mood);
      }
    }).catch(() => {
      if (isMounted) {
        setHeroMessages([{
          id: `fallback-${Date.now()}`,
          sender: "hero",
          text: personality.greeting,
          emoji: personality.emoji,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        }]);
        setHeroState("idle");
      }
    }).finally(() => {
      if (isMounted) setIsLoadingAi(false);
    });

    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
    }

    return () => { isMounted = false; };
  }, [location.pathname, language]);

  // Scroll hero messages to bottom
  useEffect(() => {
    heroMsgEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [heroMessages]);

  // Listen for global notifications to alert the user
  useEffect(() => {
    const handleNewNotification = (event) => {
      const { title, message } = event.detail || {};
      if (!message) return;
      
      const alertMsg = `🔔 Alert: ${title ? title + ' - ' : ''}${message}`;
      
      setHeroMessages(prev => [...prev, {
        id: `notif-${Date.now()}`,
        sender: "hero",
        text: alertMsg,
        emoji: "🔔",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
      setCurrentMood("excited");
      
      // Auto-open chat to show the alert
      setHeroExpanded(true);
      
      // Speak the notification (if TTS is available and enabled)
      if (window.speechSynthesis) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(alertMsg);
        utterance.lang = language === "ta" ? "ta-IN" : language === "hi" ? "hi-IN" : "en-US";
        utterance.rate = 1.0;
        utterance.pitch = 1.1;
        utterance.onstart = () => { setIsSpeaking(true); setHeroState("speaking"); };
        utterance.onend = () => { setIsSpeaking(false); setHeroState("idle"); };
        utterance.onerror = () => { setIsSpeaking(false); setHeroState("idle"); };
        window.speechSynthesis.speak(utterance);
      }
    };

    window.addEventListener("hero-notification", handleNewNotification);
    return () => window.removeEventListener("hero-notification", handleNewNotification);
  }, [language]);

  // Handle Hero Avatar Click — Activate interactive mode
  const handleHeroClick = () => {
    if (isSpeaking) {
      window.speechSynthesis?.cancel();
      setIsSpeaking(false);
      setHeroState("idle");
      return;
    }
    setHeroExpanded(!heroExpanded);
    if (!heroExpanded && heroInputRef.current) {
      setTimeout(() => heroInputRef.current?.focus(), 300);
    }
  };

  // Send message to Live AI from hero input
  const handleHeroSend = async (e) => {
    e?.preventDefault();
    const text = heroInput.trim();
    if (!text || isLoadingAi) return;

    setHeroInput("");
    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setHeroMessages(prev => [...prev, userMsg]);
    setHeroState("thinking");
    setIsLoadingAi(true);
    setCurrentMood("thinking");

    try {
      const response = await aiService.chatWithMascot({
        message: text,
        context: {
          isAuthenticated: true,
          user,
          profile,
          session,
          route: location.pathname,
          language,
        },
      });

      const reply = response?.reply || "I'm here to help! Could you rephrase that?";
      const clean = reply.split("\n")[0].replace(/[*#_]/g, "").slice(0, 200);

      setHeroMessages(prev => [...prev, {
        id: `hero-${Date.now()}`,
        sender: "hero",
        text: clean,
        emoji: "💡",
        route: response?.route,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
      setCurrentMood("happy");
      setHeroState("idle");

      // Auto-speak the response
      speakResponse(clean);
    } catch (err) {
      setHeroMessages(prev => [...prev, {
        id: `err-${Date.now()}`,
        sender: "hero",
        text: "Oops! Let me try again. Ask me anything about your dashboard!",
        emoji: "😅",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
      setCurrentMood("happy");
      setHeroState("idle");
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Quick Action helper
  const sendQuickAction = (query) => {
    setHeroInput(query);
    setHeroExpanded(true);
    setTimeout(() => {
      handleHeroSendDirect(query);
    }, 100);
  };

  const handleHeroSendDirect = async (text) => {
    if (!text || isLoadingAi) return;

    const userMsg = {
      id: `user-${Date.now()}`,
      sender: "user",
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setHeroMessages(prev => [...prev, userMsg]);
    setHeroState("thinking");
    setIsLoadingAi(true);
    setHeroInput("");

    try {
      const response = await aiService.chatWithMascot({
        message: text,
        context: { isAuthenticated: true, user, profile, session, route: location.pathname, language },
      });
      const clean = (response?.reply || "").split("\n")[0].replace(/[*#_]/g, "").slice(0, 200);
      setHeroMessages(prev => [...prev, {
        id: `hero-${Date.now()}`,
        sender: "hero",
        text: clean || "I'm ready to help!",
        emoji: "💡",
        route: response?.route,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
      setHeroState("idle");
      speakResponse(clean);
    } catch {
      setHeroState("idle");
    } finally {
      setIsLoadingAi(false);
    }
  };

  // Text-To-Speech
  const speakResponse = (text) => {
    if (!text || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === "ta" ? "ta-IN" : language === "hi" ? "hi-IN" : "en-US";
    utterance.rate = 1.0;
    utterance.pitch = 1.1;
    utterance.onstart = () => { setIsSpeaking(true); setHeroState("speaking"); };
    utterance.onend = () => { setIsSpeaking(false); setHeroState("idle"); };
    utterance.onerror = () => { setIsSpeaking(false); setHeroState("idle"); };
    window.speechSynthesis.speak(utterance);
  };

  // Voice Input
  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (isListening) { setIsListening(false); return; }
    try {
      const recognition = new SR();
      recognition.lang = language === "ta" ? "ta-IN" : language === "hi" ? "hi-IN" : "en-US";
      recognition.interimResults = false;
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (e) => {
        setHeroInput(e.results[0][0].transcript);
        setHeroExpanded(true);
      };
      recognition.start();
    } catch { setIsListening(false); }
  };

  // Mood-based avatar border color
  const moodColors = {
    happy: "#F57C20",
    thinking: "#3B82F6",
    excited: "#10B981",
    helpful: "#8B5CF6",
  };

  const navItems = [
    { name: "Overview", path: "/admin", icon: LayoutDashboard },
    { name: "Pillars", path: "/admin/pillars", icon: User },
    { name: "Service Requests", path: "/admin/requests", icon: ClipboardList },
    { name: "Tracking", path: "/admin/tracking", icon: Clock },
    { name: "Messages", path: "/admin/messages", icon: MessageSquare },
  ];

  const bottomNavItems = [
    { name: "Notifications", path: "/admin/notifications", icon: Bell },
    { name: "Support", path: "/admin/support", icon: HelpCircle },
    { name: "Settings", path: "/admin/settings", icon: Settings },
  ];

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const latestHeroMsg = heroMessages[heroMessages.length - 1];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          style={{
            position: "fixed", inset: 0, backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: "var(--z-sidebar)", display: "block"
          }}
          className="hide-on-desktop"
          onClick={toggleSidebar}
        ></div>
      )}

      {/* Sidebar Content */}
      <aside 
        style={{
          width: "var(--sidebar-width)",
          backgroundColor: "var(--color-primary)",
          color: "white",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: isOpen ? 0 : "calc(-1 * var(--sidebar-width))",
          height: "100vh",
          zIndex: "calc(var(--z-sidebar) + 1)",
          transition: "left 0.3s ease",
          boxShadow: isOpen ? "var(--shadow-xl)" : "none"
        }}
        className="sidebar"
      >
        {/* Header Branding */}
        <div style={{ 
          height: "var(--header-height)", 
          display: "flex", 
          alignItems: "center", 
          padding: "0 var(--space-4)",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255,255,255,0.1)"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <img src="/assets/images/coophub-logo.jpg" alt="Logo" style={{ height: "32px", borderRadius: "4px" }} />
            <span style={{ fontWeight: "bold", fontSize: "1.1rem" }}>Admin Portal</span>
          </div>
          <button className="btn-icon hide-on-desktop" onClick={toggleSidebar} style={{ color: "white" }}>
            <X size={24} />
          </button>
        </div>

        {/* Profile Summary with Pillar ID */}
        <div style={{ padding: "var(--space-5) var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-3)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ 
            width: "46px", height: "46px", borderRadius: "50%", 
            background: "var(--color-secondary)", display: "flex", 
            alignItems: "center", justifyContent: "center",
            fontWeight: "bold", fontSize: "1.2rem", flexShrink: 0
          }}>
            {profile?.full_name?.charAt(0) || "S"}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "14.5px" }}>
              Cooperative Admin
            </div>
            <div style={{ fontSize: "11px", color: "var(--color-secondary)", fontWeight: "600", letterSpacing: "0.5px", marginTop: "1px" }}>
              ID: ADMIN-001
            </div>
            <div style={{ fontSize: "var(--font-size-xs)", opacity: 0.8, display: "flex", alignItems: "center", gap: "5px", marginTop: "3px" }}>
              <span className={`status-dot ${profile?.is_available !== false ? 'available' : 'offline'}`} style={{ width: "6px", height: "6px" }}></span>
              <span>{profile?.is_available !== false ? t("dashboard.available") : t("dashboard.offline")}</span>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-3) 0" }} className="hide-scrollbar">
          <ul style={{ display: "flex", flexDirection: "column", gap: "3px", padding: "0 var(--space-3)" }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link 
                    to={item.path}
                    onClick={() => { if (window.innerWidth <= 1024) toggleSidebar(); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "var(--space-3)",
                      padding: "10px var(--space-4)", borderRadius: "var(--radius-md)",
                      color: isActive ? "white" : "rgba(255,255,255,0.75)",
                      background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                      transition: "all var(--transition-fast)",
                      fontWeight: isActive ? "700" : "400",
                      fontSize: "14px"
                    }}
                  >
                    <item.icon size={19} color={isActive ? "var(--color-secondary)" : "inherit"} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>

          <div style={{ margin: "var(--space-4) var(--space-4) var(--space-2)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.5, fontWeight: "bold" }}>
            Settings & Help
          </div>

          <ul style={{ display: "flex", flexDirection: "column", gap: "3px", padding: "0 var(--space-3)" }}>
            {bottomNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <Link 
                    to={item.path}
                    onClick={() => { if (window.innerWidth <= 1024) toggleSidebar(); }}
                    style={{
                      display: "flex", alignItems: "center", gap: "var(--space-3)",
                      padding: "9px var(--space-4)", borderRadius: "var(--radius-md)",
                      color: isActive ? "white" : "rgba(255,255,255,0.75)",
                      background: isActive ? "rgba(255,255,255,0.12)" : "transparent",
                      transition: "all var(--transition-fast)",
                      fontSize: "13.5px",
                      fontWeight: isActive ? "700" : "400"
                    }}
                  >
                    <item.icon size={17} color={isActive ? "var(--color-secondary)" : "inherit"} />
                    {item.name}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ============================================================ */}
        {/* HERO AI INTERACTIVE GUIDE ASSISTANT                          */}
        {/* ============================================================ */}
        <div 
          style={{ 
            borderTop: "1px solid rgba(255,255,255,0.08)",
            background: heroExpanded ? "rgba(255,255,255,0.04)" : "transparent",
            transition: "all 0.3s ease",
          }}
        >
          {/* Expanded Interactive Chat Panel */}
          {heroExpanded && (
            <div style={{
              maxHeight: "280px",
              display: "flex",
              flexDirection: "column",
              animation: "slideUp 0.3s ease",
            }}>
              {/* Mini Chat Messages */}
              <div style={{
                flex: 1,
                overflowY: "auto",
                padding: "10px 12px",
                display: "flex",
                flexDirection: "column",
                gap: "8px",
                maxHeight: "180px",
              }} className="hide-scrollbar">
                {heroMessages.map((m) => (
                  <div key={m.id} style={{
                    display: "flex",
                    justifyContent: m.sender === "user" ? "flex-end" : "flex-start",
                    animation: "fadeIn 0.25s ease",
                  }}>
                    <div style={{
                      maxWidth: "88%",
                      padding: m.sender === "user" ? "7px 12px" : "8px 12px",
                      borderRadius: m.sender === "user" ? "12px 12px 4px 12px" : "12px 12px 12px 4px",
                      background: m.sender === "user" 
                        ? "var(--color-secondary)" 
                        : "rgba(255,255,255,0.12)",
                      color: "white",
                      fontSize: "12px",
                      lineHeight: "1.45",
                    }}>
                      {m.sender === "hero" && m.emoji && (
                        <span style={{ marginRight: "4px" }}>{m.emoji}</span>
                      )}
                      <span>{m.text}</span>
                      {m.isThinking && isLoadingAi && (
                        <span style={{ display: "inline-block", marginLeft: "4px", animation: "heroDots 1.4s infinite" }}>...</span>
                      )}
                      {m.route && m.route !== location.pathname && (
                        <button
                          onClick={() => navigate(m.route)}
                          style={{
                            display: "block",
                            marginTop: "6px",
                            padding: "4px 8px",
                            fontSize: "10px",
                            fontWeight: "700",
                            color: "var(--color-secondary)",
                            background: "rgba(245, 124, 32, 0.15)",
                            border: "1px solid rgba(245, 124, 32, 0.3)",
                            borderRadius: "6px",
                            cursor: "pointer",
                            width: "100%",
                            textAlign: "center",
                          }}
                        >
                          Go to {m.route.replace("/dashboard/", "")} →
                        </button>
                      )}
                    </div>
                  </div>
                ))}

                {isLoadingAi && heroMessages[heroMessages.length - 1]?.sender === "user" && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "6px 10px", borderRadius: "10px",
                    background: "rgba(255,255,255,0.08)", width: "fit-content",
                    fontSize: "11px", color: "rgba(255,255,255,0.7)",
                  }}>
                    <Sparkles size={12} color={moodColors[currentMood]} style={{ animation: "spin 2s linear infinite" }} />
                    <span>Thinking...</span>
                  </div>
                )}

                <div ref={heroMsgEndRef} />
              </div>

              {/* Quick Action Chips */}
              <div style={{
                padding: "6px 10px",
                display: "flex",
                gap: "5px",
                overflowX: "auto",
                borderTop: "1px solid rgba(255,255,255,0.06)",
              }} className="hide-scrollbar">
                {[
                  { label: "👥 Pillars", query: "Show me all pillars" },
                  { label: "📦 Requests", query: "What are the active service requests?" },
                  { label: "🆘 Help", query: "I need system help" },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => sendQuickAction(chip.query)}
                    style={{
                      padding: "4px 10px",
                      fontSize: "10px",
                      fontWeight: "700",
                      borderRadius: "8px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.85)",
                      cursor: "pointer",
                      whiteSpace: "nowrap",
                      transition: "all 0.15s ease",
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Mini Chat Input */}
              <form onSubmit={handleHeroSend} style={{
                display: "flex",
                gap: "6px",
                padding: "8px 10px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                alignItems: "center",
              }}>
                <button
                  type="button"
                  onClick={toggleVoice}
                  style={{
                    background: isListening ? "rgba(239,68,68,0.2)" : "transparent",
                    border: "none",
                    color: isListening ? "#EF4444" : "rgba(255,255,255,0.5)",
                    cursor: "pointer",
                    padding: "4px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center",
                  }}
                  title="Voice input"
                >
                  {isListening ? <MicOff size={14} /> : <Mic size={14} />}
                </button>
                <input
                  ref={heroInputRef}
                  type="text"
                  value={heroInput}
                  onChange={(e) => setHeroInput(e.target.value)}
                  placeholder="Ask me anything..."
                  style={{
                    flex: 1,
                    padding: "6px 10px",
                    fontSize: "12px",
                    borderRadius: "8px",
                    border: "1px solid rgba(255,255,255,0.15)",
                    background: "rgba(255,255,255,0.08)",
                    color: "white",
                    outline: "none",
                  }}
                />
                <button
                  type="submit"
                  disabled={isLoadingAi || !heroInput.trim()}
                  style={{
                    background: heroInput.trim() ? "var(--color-secondary)" : "rgba(255,255,255,0.1)",
                    border: "none",
                    color: "white",
                    cursor: heroInput.trim() ? "pointer" : "default",
                    padding: "6px",
                    borderRadius: "8px",
                    display: "flex",
                    alignItems: "center",
                    transition: "all 0.15s ease",
                  }}
                >
                  <Send size={14} />
                </button>
              </form>
            </div>
          )}

          {/* Hero Avatar Row — Always Visible */}
          <div 
            style={{ 
              display: "flex", 
              alignItems: "center", 
              padding: "10px 12px",
              gap: "10px",
            }}
          >
            {/* Interactive 3D Mascot Avatar */}
            <button
              onClick={handleHeroClick}
              className={`hero-mascot-container hero-state-${heroState}`}
              style={{
                width: "72px",
                height: "72px",
                borderRadius: "50%",
                background: "#FFFFFF",
                border: `3.5px solid ${isSpeaking ? "#10B981" : moodColors[currentMood]}`,
                boxShadow: `0 0 ${isSpeaking ? "28px" : "22px"} ${isSpeaking ? "rgba(16,185,129,0.5)" : `${moodColors[currentMood]}55`}, 0 6px 16px rgba(0,0,0,0.35)`,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                padding: 0,
                overflow: "hidden",
                position: "relative",
                outline: "none",
                flexShrink: 0,
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
              title={heroExpanded ? "Close Guide Assistant" : "Open Guide Assistant"}
            >
              <img 
                src="/assets/images/mascot-hero.png" 
                alt="CoopBot Guide" 
                style={{ 
                  width: "100%", 
                  height: "100%", 
                  objectFit: "cover", 
                  objectPosition: "center 10%", 
                  transform: "scale(1.35)",
                  transformOrigin: "center 22%"
                }}
              />
              <div className="hero-blink-overlay" style={{ top: "24%", left: "30%", width: "40%", height: "14%" }} />

              {/* Mood indicator dot */}
              <div style={{
                position: "absolute",
                bottom: "2px",
                right: "2px",
                width: "14px",
                height: "14px",
                borderRadius: "50%",
                background: isSpeaking ? "#10B981" : isLoadingAi ? "#3B82F6" : moodColors[currentMood],
                border: "2px solid white",
                boxShadow: "0 0 6px rgba(0,0,0,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "7px",
              }}>
                {isLoadingAi ? "⏳" : isSpeaking ? "🔊" : currentMood === "happy" ? "😊" : currentMood === "excited" ? "🤩" : currentMood === "helpful" ? "🤝" : "🤔"}
              </div>
            </button>

            {/* Speech Bubble / Status */}
            <div
              onClick={() => !heroExpanded && setHeroExpanded(true)}
              style={{
                flex: 1,
                background: "rgba(255,255,255,0.1)",
                backdropFilter: "blur(8px)",
                color: "white",
                padding: "10px 14px",
                borderRadius: "16px",
                boxShadow: "0 4px 14px rgba(0, 0, 0, 0.15)",
                fontSize: "12px",
                fontWeight: "500",
                lineHeight: "1.45",
                position: "relative",
                minHeight: "48px",
                display: "flex",
                alignItems: "center",
                cursor: heroExpanded ? "default" : "pointer",
                transition: "all 0.2s ease",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
            >
              {/* Arrow */}
              <div style={{
                position: "absolute",
                left: "-6px",
                top: "50%",
                transform: "translateY(-50%)",
                width: 0, height: 0,
                borderTop: "6px solid transparent",
                borderBottom: "6px solid transparent",
                borderRight: "6px solid rgba(255,255,255,0.1)",
              }} />

              <div style={{ flex: 1 }}>
                {latestHeroMsg?.emoji && (
                  <span style={{ marginRight: "4px" }}>{latestHeroMsg.emoji}</span>
                )}
                <span style={{
                  display: "-webkit-box",
                  WebkitLineClamp: heroExpanded ? 1 : 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>
                  {latestHeroMsg?.text || "I'm ready to help!"}
                </span>
              </div>

              {/* Expand/Collapse Toggle */}
              <div style={{
                marginLeft: "6px",
                flexShrink: 0,
                display: "flex",
                alignItems: "center",
                color: "rgba(255,255,255,0.5)",
              }}>
                {heroExpanded ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
              </div>
            </div>

            {/* Speaker Toggle */}
            <button
              onClick={() => {
                if (isSpeaking) {
                  window.speechSynthesis?.cancel();
                  setIsSpeaking(false);
                  setHeroState("idle");
                } else if (latestHeroMsg?.text) {
                  speakResponse(latestHeroMsg.text);
                }
              }}
              style={{
                background: isSpeaking ? "rgba(16,185,129,0.2)" : "rgba(255,255,255,0.08)",
                border: "none",
                color: isSpeaking ? "#10B981" : "rgba(255,255,255,0.6)",
                cursor: "pointer",
                padding: "8px",
                borderRadius: "10px",
                display: "flex",
                alignItems: "center",
                flexShrink: 0,
                transition: "all 0.15s ease",
              }}
              title={isSpeaking ? "Stop speaking" : "Read aloud"}
            >
              {isSpeaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
            </button>
          </div>
        </div>

        {/* Logout Button */}
        <div style={{ padding: "8px var(--space-4)", borderTop: "1px solid rgba(255,255,255,0.1)" }}>
          <button 
            onClick={handleLogout}
            style={{
              display: "flex", alignItems: "center", gap: "var(--space-3)",
              padding: "8px var(--space-3)", width: "100%",
              color: "#F87171", background: "transparent",
              transition: "all var(--transition-fast)", borderRadius: "var(--radius-md)",
              border: "none", cursor: "pointer", fontSize: "13.5px", fontWeight: "600"
            }}
          >
            <LogOut size={17} />
            {t("common.logout")}
          </button>
        </div>
      </aside>
      
      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 1025px) {
          .sidebar { left: 0 !important; }
          .hide-on-desktop { display: none !important; }
        }
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        @keyframes heroDots { 0%,20% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}} />
    </>
  );
}
