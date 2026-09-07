import React, { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useTheme } from "../../../context/ThemeContext";
import { useAuth } from "../../../context/AuthContext";
import { useTranslation } from "../../../i18n/useTranslation";
import { getLanguageMetadata } from "../../../i18n/languages.js";
import { aiService } from "../../../services/pillar/aiService";
import Hero3D from "../../../components/hero3d/Hero3D";
import coopHubLogo from "../../../assets/branding/coop-hub-logo.png";
import GradientText from "../../../components/ui/GradientText";
import {
  LayoutDashboard,
  Globe,
  ShieldCheck,
  Building2,
  Lock,
  AlertOctagon,
  MessageSquare,
  Radio,
  Star,
  Users,
  Activity,
  Wallet,
  Shield,
  BarChart3,
  Sparkles,
  Server,
  FileText,
  Settings,
  Bot,
  X,
  ChevronRight,
  LogOut,
  Volume2,
  VolumeX,
  Send,
  Mic,
  MicOff,
  ChevronUp,
  ChevronDown
} from "lucide-react";

export default function SuperAdminSidebar({ isOpen, toggleSidebar, onOpenChat }) {
  const { isDark } = useTheme();
  const { user, profile, session } = useAuth();
  const { t, language } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();

  // Hero AI State
  const [heroState, setHeroState] = useState("idle");
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isLoadingAi, setIsLoadingAi] = useState(false);
  const [heroExpanded, setHeroExpanded] = useState(false);
  const [heroMessages, setHeroMessages] = useState([]);
  const [heroInput, setHeroInput] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [currentMood, setCurrentMood] = useState("happy");
  const heroMsgEndRef = useRef(null);
  const heroInputRef = useRef(null);

  // Approved Super Admin Sidebar Navigation Items (No Numbers)
  const navItems = [
    { name: "Dashboard", path: "/admin/super-admin", icon: LayoutDashboard },
    { name: "Geography", path: "/admin/geography", icon: Globe },
    { name: "Admins", path: "/admin/admins", icon: ShieldCheck },
    { name: "Zone Management", path: "/admin/zone-management", icon: Building2 },
    { name: "Access & Permissions", path: "/admin/access", icon: Lock },
    { name: "Enforcement", path: "/admin/enforcement", icon: AlertOctagon },
    { name: "Admin Communication", path: "/admin/communication", icon: MessageSquare },
    { name: "Broadcast", path: "/admin/broadcast", icon: Radio },
    { name: "Feedback Management", path: "/admin/feedback-mgmt", icon: Star },
    { name: "Pillar Network", path: "/admin/pillar-network", icon: Users },
    { name: "Operations", path: "/admin/ops", icon: Activity },
    { name: "Finance", path: "/admin/coop-finance", icon: Wallet },
    { name: "Welfare", path: "/admin/welfare-mgmt", icon: Shield },
    { name: "Analytics", path: "/admin/analytics", icon: BarChart3 },
    { name: "AI Intelligence", path: "/admin/ai-intelligence", icon: Sparkles },
    { name: "System Management", path: "/admin/system-health", icon: Server },
    { name: "Security & Audit", path: "/admin/security-audit", icon: FileText },
    { name: "Settings", path: "/admin/settings-apex", icon: Settings },
  ];

  // Route Personality & Operational Context Matrix
  const superAdminRoutePersonality = {
    "/admin/super-admin": {
      emoji: "🇮🇳",
      mood: "happy",
      section: "Apex Command",
      greeting: "National Apex Command active. All systems, zones, and telemetry are operational.",
    },
    "/admin/geography": {
      emoji: "🗺️",
      mood: "helpful",
      section: "All-India Geography",
      greeting: "All-India Geography hierarchy active across 4 zones, 28 states, and 8 union territories.",
    },
    "/admin/admins": {
      emoji: "🛡️",
      mood: "thinking",
      section: "Admin Governance",
      greeting: "Admin Governance directory active. Click any admin to audit scopes, generate AI clearance, or enforce restrictions.",
    },
    "/admin/zone-management": {
      emoji: "🏢",
      mood: "helpful",
      section: "Zone Management",
      greeting: "Zonal hierarchy active. Reviewing North, South, East, and West zone sector operations.",
    },
    "/admin/access": {
      emoji: "🔐",
      mood: "thinking",
      section: "Access & Permissions",
      greeting: "Role-Based Access Control and capability matrices active. Auditing administrator permission boundaries.",
    },
    "/admin/access-permissions": {
      emoji: "🔐",
      mood: "thinking",
      section: "Access & Permissions",
      greeting: "Role-Based Access Control and capability matrices active. Auditing administrator permission boundaries.",
    },
    "/admin/enforcement": {
      emoji: "⚖️",
      mood: "excited",
      section: "Enforcement Center",
      greeting: "National Enforcement Center active. Monitoring disciplinary actions, strikes, and suspension orders.",
    },
    "/admin/communication": {
      emoji: "💬",
      mood: "helpful",
      section: "Admin Communication",
      greeting: "Apex Inter-Admin Communication channel active. Emergency alerts and message dispatch ready.",
    },
    "/admin/broadcast": {
      emoji: "📡",
      mood: "excited",
      section: "Broadcast Engine",
      greeting: "National Broadcast Engine active. Dispatching critical announcements to customer and pillar networks.",
    },
    "/admin/feedback-mgmt": {
      emoji: "⭐",
      mood: "happy",
      section: "Feedback Intelligence",
      greeting: "National Feedback Intelligence active. Aggregating customer satisfaction and complaint telemetry.",
    },
    "/admin/pillar-network": {
      emoji: "👥",
      mood: "helpful",
      section: "Pillar Network",
      greeting: "Pillar Workforce Registry active. Supervising identity verification, skill badges, and KYC clearances.",
    },
    "/admin/ops": {
      emoji: "⚡",
      mood: "excited",
      section: "Live Operations",
      greeting: "Live National Dispatch Radar active. Tracking real-time emergency orders and workforce response.",
    },
    "/admin/coop-finance": {
      emoji: "💰",
      mood: "thinking",
      section: "Statutory Finance",
      greeting: "Statutory Split Settlement active. Auditing 91.5% pillar share and 8.5% platform cooperative fee ledger.",
    },
    "/admin/welfare-mgmt": {
      emoji: "🛡️",
      mood: "helpful",
      section: "Welfare & Benefits",
      greeting: "Social Security Enrollment active. Monitoring cooperative provident fund and emergency health coverage.",
    },
    "/admin/analytics": {
      emoji: "📊",
      mood: "happy",
      section: "Analytics & BI",
      greeting: "National Business Intelligence Telemetry active. Real-time platform volume and growth metrics.",
    },
    "/admin/ai-intelligence": {
      emoji: "🧠",
      mood: "excited",
      section: "AI Intelligence Hub",
      greeting: "Neural Chronos-2 Forecasting & Generative Summary Hub active. Predicting national service demand.",
    },
    "/admin/system-health": {
      emoji: "🖥️",
      mood: "thinking",
      section: "System Management",
      greeting: "Apex Infrastructure Monitor active. Monitoring database connection pools, RPC latencies, and server health.",
    },
    "/admin/security-audit": {
      emoji: "📜",
      mood: "thinking",
      section: "Security & Audit",
      greeting: "Immutable Security Audit Trail active. Tracking all privileged administrative actions with correlation IDs.",
    },
    "/admin/settings-apex": {
      emoji: "⚙️",
      mood: "helpful",
      section: "Governance Settings",
      greeting: "Apex Governance Settings active. Configuring platform parameters, split ratios, and statutory rules.",
    },
  };

  const getRoutePersonality = (path) => {
    for (const [route, p] of Object.entries(superAdminRoutePersonality)) {
      if (path === route || (route !== "/admin/super-admin" && path.startsWith(route))) {
        return p;
      }
    }
    return superAdminRoutePersonality["/admin/super-admin"];
  };

  // Live AI Navigation Tracking — Queries AI API on Every Route Change
  useEffect(() => {
    let isMounted = true;
    const path = location.pathname;
    const personality = getRoutePersonality(path);

    setCurrentMood(personality.mood);
    setHeroState("thinking");
    setIsLoadingAi(true);

    // Instant local greeting for instant UI feedback
    const initialMsg = {
      id: `nav-${Date.now()}`,
      sender: "hero",
      text: personality.greeting,
      emoji: personality.emoji,
      section: personality.section,
      isThinking: true,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setHeroMessages([initialMsg]);

    // Live AI query prompt for national apex command
    const promptText = `You are CoopBot Hero AI, the National Apex Command Advisor for the Super Admin of COOP HUB. The Super Administrator just navigated to the "${personality.section}" (${path}) section. Provide an authoritative, concise 1-2 sentence executive briefing on governance objectives for this module. Focus on oversight, compliance, and actionable intelligence.`;

    aiService.chatWithMascot({
      message: promptText,
      context: {
        isAuthenticated: true,
        user,
        profile,
        session,
        route: path,
        language,
        role: "SUPER_ADMIN",
      }
    }).then((res) => {
      if (isMounted && res?.reply) {
        const clean = res.reply.split("\n")[0].replace(/[*#_]/g, "").slice(0, 190);
        setHeroMessages([{
          id: `guide-${Date.now()}`,
          sender: "hero",
          text: clean || personality.greeting,
          emoji: personality.emoji,
          section: personality.section,
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
          section: personality.section,
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

    return () => {
      isMounted = false;
    };
  }, [location.pathname]);

  // Text-To-Speech (TTS) Voice Synthesizer
  const speakResponse = (text) => {
    if (!text || !("speechSynthesis" in window)) return;

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      setHeroState("idle");
      return;
    }

    window.speechSynthesis.cancel();
    const cleanText = text.replace(/[*#_`]/g, "");
    const utterance = new SpeechSynthesisUtterance(cleanText);
    const meta = getLanguageMetadata(language);
    utterance.lang = meta?.bcp47 || "en-IN";
    utterance.rate = 1.0;
    utterance.pitch = 1.05;
    utterance.onstart = () => {
      setIsSpeaking(true);
      setHeroState("speaking");
    };
    utterance.onend = () => {
      setIsSpeaking(false);
      setHeroState("idle");
    };
    utterance.onerror = () => {
      setIsSpeaking(false);
      setHeroState("idle");
    };
    window.speechSynthesis.speak(utterance);
  };

  // Interactive Mini Chat Send
  const handleHeroSend = async (e) => {
    if (e) e.preventDefault();
    const text = heroInput.trim();
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
        context: {
          isAuthenticated: true,
          user,
          profile,
          session,
          route: location.pathname,
          language,
          role: "SUPER_ADMIN",
        }
      });

      const clean = (response?.reply || "").split("\n")[0].replace(/[*#_]/g, "").slice(0, 220);
      setHeroMessages(prev => [...prev, {
        id: `hero-${Date.now()}`,
        sender: "hero",
        text: clean || "Super Admin command acknowledged.",
        emoji: "💡",
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

  // Voice Input (Speech-to-Text)
  const toggleVoice = () => {
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    if (isListening) {
      setIsListening(false);
      return;
    }

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
    } catch {
      setIsListening(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("coophub_super_admin_session");
    localStorage.removeItem("coophub_demo_admin");
    navigate("/admin/login");
  };

  const moodColors = {
    happy: "#FF7900",
    thinking: "#3B82F6",
    excited: "#10B981",
    helpful: "#A855F7",
  };

  const latestHeroMsg = heroMessages[heroMessages.length - 1];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          onClick={toggleSidebar}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.6)",
            zIndex: 90,
            display: "block"
          }}
          className="hide-on-desktop"
        />
      )}

      <aside
        style={{
          width: "270px",
          backgroundColor: isDark ? "#0A1220" : "#050A12",
          color: "#FFFFFF",
          display: "flex",
          flexDirection: "column",
          position: "fixed",
          top: 0,
          left: isOpen ? 0 : "calc(-1 * 270px)",
          height: "100vh",
          zIndex: 100,
          borderRight: "1px solid rgba(255, 255, 255, 0.08)",
          transition: "left 0.3s ease",
          boxShadow: isOpen ? "0 20px 40px rgba(0,0,0,0.5)" : "none"
        }}
        className="super-admin-sidebar"
      >
        {/* Top Header Branding with Official Logo */}
        <div style={{
          height: "60px",
          display: "flex",
          alignItems: "center",
          padding: "0 16px",
          justifyContent: "space-between",
          borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(0,0,0,0.2)",
          flexShrink: 0
        }}>
          <Link to="/admin/super-admin" title="COOP HUB Apex Home" style={{ display: "flex", alignItems: "center", gap: "10px", textDecoration: "none" }}>
            <img src={coopHubLogo} alt="COOP HUB Logo" style={{ height: "30px", width: "auto" }} />
            <GradientText
              colors={["#FF7900", "#FFFFFF", "#FF7900"]}
              animationSpeed={8}
              showBorder={false}
              className="font-extrabold text-white"
              style={{ fontSize: "1.02rem" }}
            >
              COOP HUB
            </GradientText>
          </Link>
          <button onClick={toggleSidebar} style={{ background: "none", border: "none", color: "white", cursor: "pointer" }} className="hide-on-desktop">
            <X size={20} />
          </button>
        </div>

        {/* Portal Scope Label */}
        <div style={{ padding: "6px 16px", background: "rgba(255, 121, 0, 0.08)", borderBottom: "1px solid rgba(255, 121, 0, 0.15)", flexShrink: 0 }}>
          <div style={{ fontWeight: "800", color: "#FF7900", fontSize: "9.5px", textTransform: "uppercase", letterSpacing: "1.2px", fontFamily: "monospace" }}>
            🇮🇳 SUPER ADMIN APEX COMMAND
          </div>
        </div>

        {/* Navigation Module List */}
        <div style={{ flex: 1, overflowY: "auto", padding: "8px 0" }} className="hide-scrollbar">
          <ul style={{ display: "flex", flexDirection: "column", gap: "2px", padding: "0 10px", listStyle: "none", margin: 0 }}>
            {navItems.map((item) => {
              const isActive = location.pathname === item.path;
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className="super-admin-nav-item"
                    onClick={() => { if (window.innerWidth <= 1024) toggleSidebar(); }}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "9px",
                      padding: "8px 12px",
                      borderRadius: "8px",
                      textDecoration: "none",
                      fontSize: "12px",
                      fontWeight: isActive ? "800" : "600",
                      color: isActive ? "#FF7900" : "rgba(255, 255, 255, 0.75)",
                      background: isActive ? "rgba(255, 121, 0, 0.12)" : "transparent",
                      borderLeft: isActive ? "3px solid #FF7900" : "3px solid transparent",
                      transition: "all 0.15s ease"
                    }}
                  >
                    <Icon size={15} color={isActive ? "#FF7900" : "rgba(255, 255, 255, 0.6)"} />
                    <span style={{ flex: 1 }}>{t(item.name)}</span>
                    {isActive && <ChevronRight size={13} color="#FF7900" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>

        {/* ============================================================ */}
        {/* HERO AI INTERACTIVE AGENT — FULL VISIBLE 3D MASCOT & API TRACKING */}
        {/* ============================================================ */}
        <div
          style={{
            borderTop: "1px solid rgba(255,255,255,0.08)",
            background: heroExpanded ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.25)",
            transition: "all 0.3s ease",
            flexShrink: 0
          }}
        >
          {/* Expanded Interactive Mini Chat Panel */}
          {heroExpanded && (
            <div style={{
              maxHeight: "260px",
              display: "flex",
              flexDirection: "column",
              animation: "slideUp 0.3s ease",
              borderBottom: "1px solid rgba(255,255,255,0.06)"
            }}>
              {/* Messages Scroll Area */}
              <div style={{
                flex: 1,
                overflowY: "auto",
                padding: "8px 10px",
                display: "flex",
                flexDirection: "column",
                gap: "6px",
                maxHeight: "150px"
              }} className="hide-scrollbar">
                {heroMessages.map((m) => (
                  <div key={m.id} style={{
                    display: "flex",
                    justifyContent: m.sender === "user" ? "flex-end" : "flex-start",
                    animation: "fadeIn 0.2s ease",
                  }}>
                    <div style={{
                      maxWidth: "90%",
                      padding: m.sender === "user" ? "6px 10px" : "7px 10px",
                      borderRadius: m.sender === "user" ? "10px 10px 2px 10px" : "10px 10px 10px 2px",
                      background: m.sender === "user" ? "#FF7900" : "rgba(255,255,255,0.12)",
                      color: "white",
                      fontSize: "11.5px",
                      lineHeight: "1.4",
                    }}>
                      {m.sender === "hero" && m.emoji && (
                        <span style={{ marginRight: "4px" }}>{m.emoji}</span>
                      )}
                      <span>{m.text}</span>
                    </div>
                  </div>
                ))}
                {isLoadingAi && (
                  <div style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "5px 8px", borderRadius: "8px",
                    background: "rgba(255,255,255,0.08)", width: "fit-content",
                    fontSize: "10.5px", color: "rgba(255,255,255,0.7)",
                  }}>
                    <Sparkles size={11} color="#FF7900" style={{ animation: "spin 2s linear infinite" }} />
                    <span>Analyzing apex command...</span>
                  </div>
                )}
                <div ref={heroMsgEndRef} />
              </div>

              {/* Quick Action Chips for Super Admin */}
              <div style={{
                padding: "4px 8px",
                display: "flex",
                gap: "4px",
                overflowX: "auto",
                borderTop: "1px solid rgba(255,255,255,0.06)"
              }} className="hide-scrollbar">
                {[
                  { label: "🛡️ Admins", query: "Audit administrator accounts and clearance" },
                  { label: "🗺️ 36 States", query: "Summarize 4 zones and 36 states/UTs" },
                  { label: "⚖️ Enforcement", query: "Show recent disciplinary actions" },
                  { label: "💰 91.5% Split", query: "Review 91.5% and 8.5% split compliance" },
                ].map((chip) => (
                  <button
                    key={chip.label}
                    onClick={() => {
                      setHeroInput(chip.query);
                      setTimeout(() => handleHeroSend(), 50);
                    }}
                    style={{
                      padding: "3px 8px",
                      fontSize: "9.5px",
                      fontWeight: "700",
                      borderRadius: "6px",
                      border: "1px solid rgba(255,255,255,0.15)",
                      background: "rgba(255,255,255,0.06)",
                      color: "rgba(255,255,255,0.85)",
                      cursor: "pointer",
                      whiteSpace: "nowrap"
                    }}
                  >
                    {chip.label}
                  </button>
                ))}
              </div>

              {/* Chat Input Bar */}
              <form onSubmit={handleHeroSend} style={{
                display: "flex",
                gap: "5px",
                padding: "6px 8px",
                borderTop: "1px solid rgba(255,255,255,0.06)",
                alignItems: "center"
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
                    alignItems: "center"
                  }}
                  title="Voice input"
                >
                  {isListening ? <MicOff size={13} /> : <Mic size={13} />}
                </button>
                <input
                  ref={heroInputRef}
                  type="text"
                  value={heroInput}
                  onChange={(e) => setHeroInput(e.target.value)}
                  placeholder="Ask CoopBot Apex AI..."
                  style={{
                    flex: 1,
                    padding: "5px 8px",
                    fontSize: "11px",
                    borderRadius: "6px",
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
                    background: heroInput.trim() ? "#FF7900" : "rgba(255,255,255,0.1)",
                    border: "none",
                    color: "white",
                    cursor: heroInput.trim() ? "pointer" : "default",
                    padding: "5px",
                    borderRadius: "6px",
                    display: "flex",
                    alignItems: "center"
                  }}
                >
                  <Send size={13} />
                </button>
              </form>
            </div>
          )}

          {/* Full Standing 3D Hero Mascot Character */}
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              padding: "6px 12px 10px",
              gap: "6px"
            }}
          >
            <div
              onClick={() => setHeroExpanded(prev => !prev)}
              className="super-admin-hero-mascot-container"
              style={{
                width: "100%",
                height: heroExpanded ? "110px" : "155px",
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
              }}
              title={heroExpanded ? "Click to collapse" : "Click to chat with CoopBot Hero AI"}
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
                  background: "rgba(5, 10, 18, 0.92)",
                  color: "white",
                  padding: "3px 10px",
                  borderRadius: "9999px",
                  fontSize: "9.5px",
                  fontWeight: "800",
                  backdropFilter: "blur(8px)",
                  display: "flex",
                  alignItems: "center",
                  gap: "5px",
                  border: `1px solid ${isSpeaking ? "#10B981" : moodColors[currentMood]}`,
                  boxShadow: "0 4px 12px rgba(0,0,0,0.5)"
                }}
              >
                <span style={{
                  width: "6px",
                  height: "6px",
                  background: isSpeaking ? "#10B981" : isLoadingAi ? "#3B82F6" : "#FF7900",
                  borderRadius: "50%",
                }}></span>
                <span style={{ color: "#F8FAFC", textTransform: "capitalize" }}>
                  CoopBot: {isSpeaking ? "Speaking" : isLoadingAi ? "Analyzing..." : currentMood}
                </span>
                <span style={{ fontSize: "8.5px", color: "#FF7900", fontWeight: "700" }}>
                  {heroExpanded ? "▲" : "▼"}
                </span>
              </div>
            </div>

            {/* Live Vocal Guidance & Telemetry Banner */}
            <div
              onClick={() => setHeroExpanded(prev => !prev)}
              style={{
                width: "100%",
                padding: "8px 10px",
                background: "rgba(255, 121, 0, 0.08)",
                borderRadius: "9px",
                border: "1px solid rgba(255, 121, 0, 0.22)",
                cursor: "pointer",
                display: "flex",
                flexDirection: "column",
                gap: "4px",
                boxSizing: "border-box"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <span style={{
                  fontSize: "9.5px",
                  fontWeight: "800",
                  color: "#FF7900",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px"
                }}>
                  <Sparkles size={11} color="#FF7900" />
                  {latestHeroMsg?.section || "Apex AI Telemetry"}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      speakResponse(latestHeroMsg?.text);
                    }}
                    style={{
                      background: isSpeaking ? "rgba(255, 121, 0, 0.3)" : "rgba(255, 255, 255, 0.06)",
                      border: "none",
                      borderRadius: "5px",
                      padding: "2px 5px",
                      color: isSpeaking ? "#FF7900" : "#CBD5E1",
                      cursor: "pointer",
                      display: "flex",
                      alignItems: "center"
                    }}
                    title={isSpeaking ? "Mute speech" : "Read aloud (Text-to-Speech)"}
                  >
                    {isSpeaking ? <VolumeX size={11} /> : <Volume2 size={11} />}
                  </button>
                </div>
              </div>
              <p style={{
                margin: 0,
                fontSize: "10.5px",
                lineHeight: "1.35",
                color: "#E2E8F0",
                fontWeight: "500"
              }}>
                {latestHeroMsg?.emoji && <span style={{ marginRight: "4px" }}>{latestHeroMsg.emoji}</span>}
                {latestHeroMsg?.text}
                {isLoadingAi && <span style={{ color: "#FF7900", marginLeft: "4px" }}>●</span>}
              </p>
            </div>
          </div>
        </div>

        {/* Bottom Profile Footer */}
        <div style={{
          padding: "10px 14px",
          borderTop: "1px solid rgba(255, 255, 255, 0.08)",
          background: "rgba(0,0,0,0.3)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", minWidth: 0 }}>
            <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#FF7900", color: "#050A12", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800", fontSize: "11px", flexShrink: 0 }}>
              SA
            </div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontSize: "12px", fontWeight: "800", color: "#FFFFFF", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                Super Admin Apex
              </div>
              <div style={{ fontSize: "10px", color: "#FF7900", fontWeight: "700" }}>
                ID: SA-000001 • GLOBAL
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{ background: "none", border: "none", color: "#94A3B8", cursor: "pointer", padding: "4px" }}
            title="Sign out of Super Admin Portal"
          >
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 1025px) {
          .super-admin-sidebar {
            left: 0 !important;
            box-shadow: none !important;
          }
          .hide-on-desktop {
            display: none !important;
          }
        }
        @media (max-width: 1024px) {
          .hide-on-mobile {
            display: none !important;
          }
        }
        .super-admin-nav-item:hover {
          background: rgba(255, 121, 0, 0.15) !important;
          color: #FF7900 !important;
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .hide-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .super-admin-hero-mascot-container:hover {
          transform: scale(1.02);
        }
      `}} />
    </>
  );
}
