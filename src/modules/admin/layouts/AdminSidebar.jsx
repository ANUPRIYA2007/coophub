import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/useTranslation";
import { getLanguageMetadata } from "../../../i18n/languages.js";
import { useAuth } from "../../../context/AuthContext";
import { aiService } from "../../../services/pillar/aiService";
import gsap from "gsap";
import GradientText from "../../../components/ui/GradientText";
import Hero3D from "../../../components/hero3d/Hero3D";
import coopHubLogo from "../../../assets/branding/coop-hub-logo.png";
import {
  LayoutDashboard,
  Globe,
  ShieldCheck,
  ClipboardList,
  Wallet,
  Clock,
  User,
  Users,
  Wrench,
  Star,
  Settings,
  HelpCircle,
  MessageSquare,
  Bell,
  LogOut,
  X,
  Volume2,
  VolumeX,
  Sparkles,
  Send,
  Mic,
  MicOff,
  ChevronUp,
  ChevronDown,
  Shield,
  UserCheck,
  TrendingUp,
  Award,
  Zap,
  Bot,
  Layers,
  Radio
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

  // Admin Online / Offline Status Toggle
  const [isOnline, setIsOnline] = useState(() => localStorage.getItem("coophub_admin_online") !== "false");

  useEffect(() => {
    const handleStatusSync = () => {
      setIsOnline(localStorage.getItem("coophub_admin_online") !== "false");
    };
    window.addEventListener("coophub_admin_status_change", handleStatusSync);
    return () => window.removeEventListener("coophub_admin_status_change", handleStatusSync);
  }, []);

  const handleToggleOnline = () => {
    const next = !isOnline;
    setIsOnline(next);
    localStorage.setItem("coophub_admin_online", next ? "true" : "false");
    window.dispatchEvent(new Event("coophub_admin_status_change"));

    if (next) {
      setCurrentMood("excited");
      setHeroMessages([{
        id: `status-${Date.now()}`,
        sender: "hero",
        text: "🟢 Admin Operations are LIVE! Telemetry radar and automated dispatch are active.",
        emoji: "⚡",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    } else {
      setCurrentMood("thinking");
      setHeroMessages([{
        id: `status-${Date.now()}`,
        sender: "hero",
        text: "🔴 Admin Operations set to OFFLINE. Automated alerts and supervision are paused.",
        emoji: "⏸️",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      }]);
    }
  };

  // GSAP Smooth Navigation Button Entrance
  useEffect(() => {
    gsap.fromTo(
      ".admin-nav-item",
      { opacity: 0, x: -18, scale: 0.96 },
      { opacity: 1, x: 0, scale: 1, duration: 0.45, stagger: 0.04, ease: "power2.out" }
    );
  }, []);

  // Friendly greeting emojis and moods per route
  const routePersonality = {
    "/admin": { emoji: "👋", mood: "happy", greeting: `Welcome back, Admin! System analytics and performance look strong.` },
    "/admin/verification": { emoji: "🛡️", mood: "helpful", greeting: `Pillar Verification Workspace active. Review applicant identity, inspect OCR extracts, and verify official credentials.` },
    "/admin/pillars": { emoji: "👥", mood: "helpful", greeting: `Let's review the registered Pillar workforce.` },
    "/admin/services": { emoji: "🔧", mood: "excited", greeting: `Manage cooperative service catalog and pricing.` },
    "/admin/requests": { emoji: "📦", mood: "excited", greeting: `Active customer service requests overview.` },
    "/admin/tracking": { emoji: "📍", mood: "happy", greeting: `Live geospatial radar & telemetry active.` },
    "/admin/feedback": { emoji: "⭐", mood: "happy", greeting: `Customer reviews and satisfaction ratings.` },
    "/admin/messages": { emoji: "💬", mood: "helpful", greeting: `Cooperative announcements and broadcast center.` },
    "/admin/support": { emoji: "🆘", mood: "helpful", greeting: `Support dispute tickets needing review.` },
    "/admin/settings": { emoji: "⚙️", mood: "helpful", greeting: `Admin platform configuration settings.` },
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
        const meta = getLanguageMetadata(language);
        utterance.lang = meta?.bcp47 || "en-IN";
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
    const meta = getLanguageMetadata(language);
    utterance.lang = meta?.bcp47 || "en-IN";
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
      const meta = getLanguageMetadata(language);
      recognition.lang = meta?.bcp47 || "en-IN";
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
    { name: "AI Demand Forecast", path: "/admin/forecast", icon: TrendingUp },
    { name: "AI Workforce Allocation", path: "/admin/allocation", icon: Zap },
    { name: "Skill Certifications", path: "/admin/certifications", icon: Award },
    { name: "Pillars", path: "/admin/pillars", icon: Users },
    { name: "Customers", path: "/admin/customers", icon: UserCheck },
    { name: "Services", path: "/admin/services", icon: Wrench },
    { name: "Service Requests", path: "/admin/requests", icon: ClipboardList },
    { name: "Operations", path: "/admin/operations", icon: Radio },
    { name: "Live Tracking", path: "/admin/tracking", icon: Clock },
    { name: "Financials & Payouts", path: "/admin/finance", icon: Wallet },
    { name: "Customer Feedback", path: "/admin/feedback", icon: Star },
    { name: "Broadcast Messages", path: "/admin/messages", icon: MessageSquare },
  ];

  const bottomNavItems = [
    { name: "Help & Support", path: "/admin/support", icon: HelpCircle },
    { name: "Welfare & PF", path: "/admin/welfare", icon: Shield },
    { name: "Settings", path: "/admin/settings", icon: Settings },
    { name: "Portal Hub (Home)", path: "/", icon: Layers },
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
          <Link to="/admin" title="COOP HUB Portal Home" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", textDecoration: "none" }}>
            <img src={coopHubLogo} alt="COOP HUB Logo" style={{ height: "32px", width: "auto" }} />
            <GradientText
              colors={["#FF7900","#FFFFFF","#FF7900"]}
              animationSpeed={8}
              showBorder={false}
              className="font-bold text-white"
              style={{ fontSize: "1.1rem" }}
            >
              COOP HUB
            </GradientText>
          </Link>
          <button className="btn-icon hide-on-desktop" onClick={toggleSidebar} style={{ color: "white" }}>
            <X size={24} />
          </button>
        </div>

        {/* Portal Label */}
        <div style={{ padding: "8px var(--space-4)", borderBottom: "1px solid rgba(255,255,255,0.1)", background: "rgba(0,0,0,0.2)" }}>
          <div style={{ fontWeight: "bold", color: "#FF7900", fontSize: "10px", textTransform: "uppercase", letterSpacing: "1.5px", fontFamily: "monospace" }}>
            {t("admin.portal_label") || "ADMIN MANAGEMENT PORTAL"}
          </div>
        </div>

        {/* Profile Summary with Cooperative Admin ID */}
        <div style={{ padding: "12px var(--space-4)", display: "flex", alignItems: "center", gap: "var(--space-3)", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ 
            width: "42px", height: "42px", borderRadius: "50%", 
            background: "var(--color-secondary)", display: "flex", 
            alignItems: "center", justifyContent: "center",
            fontWeight: "800", fontSize: "1.1rem", color: "#050A12", flexShrink: 0
          }}>
            {profile?.full_name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || "A"}
          </div>
          <div style={{ overflow: "hidden" }}>
            <div style={{ fontWeight: "700", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis", fontSize: "13.5px", color: "#FFFFFF" }}>
              {profile?.full_name || (user ? user.email?.split('@')[0] : "Cooperative Admin")}
            </div>
            <div style={{ fontSize: "10.5px", color: "var(--color-secondary)", fontWeight: "700", letterSpacing: "0.5px", marginTop: "1px" }}>
              {profile?.admin_code ? `ID: ${profile.admin_code}` : "ID: ADM-CHE-001"}
            </div>
            <div style={{ marginTop: "3px" }}>
              <button
                onClick={handleToggleOnline}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "2px 7px",
                  borderRadius: "12px",
                  border: isOnline ? "1px solid rgba(16, 185, 129, 0.4)" : "1px solid rgba(239, 68, 68, 0.4)",
                  background: isOnline ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                  color: isOnline ? "#34D399" : "#F87171",
                  fontSize: "10.5px",
                  fontWeight: "700",
                  cursor: "pointer",
                  transition: "all 0.2s ease"
                }}
                title="Click to toggle Admin Online / Offline status"
              >
                <span className={`status-dot ${isOnline ? 'available' : 'offline'}`} style={{ width: "5px", height: "5px" }}></span>
                <span>{isOnline ? "Available (Online)" : "Offline (Paused)"}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Navigation List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "var(--space-3) 0" }} className="hide-scrollbar">
          <ul style={{ display: "flex", flexDirection: "column", gap: "3px", padding: "0 var(--space-4)" }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path} className="admin-nav-item">
                  <Link 
                    to={item.path}
                    onClick={() => { if (window.innerWidth <= 1024) toggleSidebar(); }}
                    className={`framer-side-menu-link ${isActive ? 'active' : ''}`}
                  >
                    <div className="framer-indicator" />
                    <span>{t(item.name)}</span>
                  </Link>
                </li>
              );
            })}
          </ul>

          <div style={{ margin: "var(--space-4) var(--space-4) var(--space-2)", fontSize: "0.72rem", textTransform: "uppercase", letterSpacing: "1px", opacity: 0.5, fontWeight: "bold", fontFamily: "Geist Mono, monospace" }}>
            {t("Settings & Help")}
          </div>

          <ul style={{ display: "flex", flexDirection: "column", gap: "3px", padding: "0 var(--space-4)" }}>
            {bottomNavItems.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path} className="admin-nav-item">
                  <Link 
                    to={item.path}
                    onClick={() => { if (window.innerWidth <= 1024) toggleSidebar(); }}
                    className={`framer-side-menu-link ${isActive ? 'active' : ''}`}
                  >
                    <div className="framer-indicator" />
                    <span>{t(item.name)}</span>
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

              {/* Quick Link to Full Page Chat AI Workspace */}
              <div style={{ padding: "0 10px 8px" }}>
                <Link
                  to="/admin/chatai"
                  onClick={() => { if (window.innerWidth <= 1024) toggleSidebar(); }}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "6px",
                    width: "100%",
                    padding: "6px",
                    background: "rgba(245, 124, 32, 0.15)",
                    border: "1px solid rgba(245, 124, 32, 0.35)",
                    borderRadius: "8px",
                    color: "var(--color-secondary)",
                    fontSize: "11px",
                    fontWeight: "700",
                    textDecoration: "none",
                  }}
                >
                  <Bot size={13} />
                  <span>Open Full Chat AI Console →</span>
                </Link>
              </div>
            </div>
          )}

          {/* Hero Mascot & Live Interactive AI Guide — Full Standing Character */}
          <div 
            style={{ 
              display: "flex", 
              flexDirection: "column",
              alignItems: "center", 
              padding: "8px 12px",
              gap: "8px",
            }}
          >
            {/* Full 3D Hero Mascot Character standing uncropped */}
            <div 
              onClick={handleHeroClick}
              className="hero-mascot-container"
              style={{
                width: "100%",
                height: heroExpanded ? "130px" : "185px",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
              title={heroExpanded ? "Click to collapse" : "Click to chat with CoopBot"}
            >
              <Hero3D 
                mode="card" 
                state={isSpeaking ? 'speaking' : isLoadingAi ? 'thinking' : heroState} 
                style={{ width: "100%", height: "100%" }} 
              />

              {/* Status Pill Badge */}
              <div 
                style={{
                  position: "absolute",
                  bottom: "2px",
                  background: "rgba(5, 10, 18, 0.9)",
                  color: "white",
                  padding: "4px 12px",
                  borderRadius: "9999px",
                  fontSize: "10px",
                  fontWeight: "700",
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  border: `1px solid ${isSpeaking ? "#10B981" : moodColors[currentMood]}`,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
                }}
              >
                <span style={{ width: "6px", height: "6px", background: isSpeaking ? "#10B981" : "#FF7900", borderRadius: "50%" }}></span>
                <span style={{ textTransform: "capitalize", color: "#F1F5F9" }}>CoopBot: {isLoadingAi ? "Thinking" : isSpeaking ? "Speaking" : heroState}</span>
                <span style={{ fontSize: "9px", color: "var(--color-secondary)", marginLeft: "2px" }}>
                  {heroExpanded ? "• Close" : "• Tap to Chat"}
                </span>
              </div>
            </div>

            {/* Quick Greeting / Latest AI Guidance Banner (When collapsed) */}
            {!heroExpanded && latestHeroMsg?.text && (
              <div
                onClick={() => setHeroExpanded(true)}
                style={{
                  width: "100%",
                  background: "rgba(255,255,255,0.08)",
                  backdropFilter: "blur(8px)",
                  color: "white",
                  padding: "8px 12px",
                  borderRadius: "14px",
                  fontSize: "11px",
                  fontWeight: "500",
                  lineHeight: "1.4",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "6px",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: "6px", overflow: "hidden" }}>
                  <span>{latestHeroMsg?.emoji || "💡"}</span>
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {latestHeroMsg?.text}
                  </span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  {isSpeaking ? (
                    <VolumeX size={12} color="#10B981" onClick={(e) => { e.stopPropagation(); window.speechSynthesis?.cancel(); setIsSpeaking(false); }} />
                  ) : (
                    <Volume2 size={12} color="rgba(255,255,255,0.6)" onClick={(e) => { e.stopPropagation(); speakResponse(latestHeroMsg.text); }} />
                  )}
                  <ChevronUp size={12} color="rgba(255,255,255,0.6)" />
                </div>
              </div>
            )}
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
