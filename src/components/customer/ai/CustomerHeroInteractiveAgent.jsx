import React, { useState, useEffect } from "react";
import { useTranslation } from "../../../hooks/useTranslation";
import { translateDynamic } from "../../../i18n/centralEngine.js";
import { Sparkles, Bot, AlertCircle, CheckCircle2, MessageSquare, Send, ShieldCheck, FileText, Lock } from "lucide-react";
import Hero3D from "../../hero3d/Hero3D";
import { aiService } from "../../../services/pillar/aiService";

export default function CustomerHeroInteractiveAgent({
  activeField = null,
  formError = null,
  formSuccess = false,
  mode = "login", // 'login' | 'register'
  customData = null,
  onAskHero = null,
}) {
  const { t, language } = useTranslation();
  const [heroMessage, setHeroMessage] = useState("");
  const [heroState, setHeroState] = useState("idle"); // 'idle' | 'greeting' | 'listening' | 'thinking' | 'speaking' | 'success' | 'error'
  const [askInput, setAskInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);

  // Play greeting animation on mount / mode change
  useEffect(() => {
    setHeroState("greeting");
    const timer = setTimeout(() => {
      setHeroState("idle");
    }, 1300);
    return () => clearTimeout(timer);
  }, [mode]);

  // Reactive state changes based on real user actions
  useEffect(() => {
    let isMounted = true;

    const resolveCustomerMessage = async () => {
      if (formSuccess) {
        setHeroState("success");
        const baseSuccess = "Awesome! Your customer account has been created successfully. Welcome to COOP HUB!";
        const msg = language !== "en" ? await translateDynamic(baseSuccess, language, "en") : baseSuccess;
        if (isMounted) setHeroMessage(msg);
        return;
      }

      if (formError) {
        setHeroState("error");
        setHeroMessage(`⚠️ Oops! ${formError}`);
        return;
      }

      if (activeField) {
        setHeroState("speaking");
        let baseFieldMsg = "I'm watching your progress! Fill in the highlighted field.";
        switch (activeField) {
          case "email":
            baseFieldMsg = "Enter your registered email address to sign in or receive your login OTP.";
            break;
          case "password":
            baseFieldMsg = "Enter your secure password to access your customer dashboard.";
            break;
          case "confirmPassword":
            baseFieldMsg = "Re-enter your password to confirm they match.";
            break;
          case "otp":
            baseFieldMsg = "Enter the 6-digit OTP code sent directly to your email inbox.";
            break;
          case "fullName":
            baseFieldMsg = "Enter your full name to personalize your booking experience.";
            break;
          case "mobile":
          case "phone":
            baseFieldMsg = "Enter your 10-digit mobile number for order dispatch and technician updates.";
            break;
          case "address":
            baseFieldMsg = "Provide your service address or locality in Chennai.";
            break;
          default:
            baseFieldMsg = "I'm watching your progress! Fill in the highlighted field.";
        }

        const msg = language !== "en" ? await translateDynamic(baseFieldMsg, language, "en") : baseFieldMsg;
        if (isMounted) setHeroMessage(msg);
        return;
      }

      // Default idle messages based on mode
      setHeroState("idle");
      let baseIdleMsg = "Welcome to COOP HUB Customer Portal! Sign in with your email, password, or instant OTP.";
      if (mode === "login") {
        baseIdleMsg = "Welcome to COOP HUB Customer Portal! Sign in with your email, password, or instant OTP.";
      } else if (mode === "register") {
        baseIdleMsg = "Create your COOP HUB customer account to book verified cooperative technicians across Chennai!";
      }

      const msg = language !== "en" ? await translateDynamic(baseIdleMsg, language, "en") : baseIdleMsg;
      if (isMounted) setHeroMessage(msg);
    };

    resolveCustomerMessage();
    return () => { isMounted = false; };
  }, [activeField, formError, formSuccess, mode, language]);

  const handleAsk = async (e) => {
    e?.preventDefault();
    if (!askInput.trim() || isAsking) return;

    const q = askInput.trim();
    setAskInput("");
    setIsAsking(true);
    setHeroState("thinking");
    setHeroMessage("Analyzing your question...");

    try {
      const res = await aiService.chatWithMascot({
        message: q,
        context: { isAuthenticated: false, route: mode === "login" ? "/login" : "/register", language },
      });
      setHeroState("speaking");
      const reply = res?.reply || "I am right here to assist your booking needs!";
      setHeroMessage(reply);
      onAskHero?.(reply);
      setTimeout(() => {
        setHeroState("idle");
      }, 4000);
    } catch (err) {
      setHeroState("error");
      setHeroMessage("Sorry, I could not process your question. Please ask again.");
    } finally {
      setIsAsking(false);
    }
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "24px",
        height: "100%",
        maxWidth: "480px",
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      {/* Interactive Speech Bubble */}
      <div
        style={{
          background: "#FFFFFF",
          color: "#0B1220",
          padding: "16px 20px",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.25), 0 0 0 2px " + (heroState === "error" ? "#EF4444" : heroState === "success" ? "#10B981" : "#FF7900"),
          fontSize: "14px",
          lineHeight: "1.5",
          fontWeight: "600",
          position: "relative",
          marginBottom: "24px",
          width: "100%",
          transition: "all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)",
        }}
      >
        <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
          <span style={{ fontSize: "18px" }}>
            {heroState === "error" ? "⚠️" : heroState === "success" ? "🎉" : heroState === "thinking" ? "🤔" : heroState === "speaking" ? "💬" : "🤖"}
          </span>
          <div style={{ flex: 1, textAlign: "left" }}>
            <span style={{ 
              display: "block", fontSize: "11px", textTransform: "uppercase", 
              letterSpacing: "1px", color: heroState === "error" ? "#EF4444" : heroState === "success" ? "#10B981" : "#FF7900", 
              fontWeight: "800", marginBottom: "2px" 
            }}>
              {heroState === "error" ? "CoopBot Alert" : heroState === "success" ? "CoopBot Verified" : heroState === "thinking" ? "CoopBot Thinking" : "CoopBot Live Guidance"}
            </span>
            <span style={{ color: "#0B1220", fontWeight: "600" }}>{heroMessage}</span>
          </div>
        </div>

        {/* Speech Bubble Arrow */}
        <div
          style={{
            position: "absolute",
            bottom: "-10px",
            left: "50%",
            transform: "translateX(-50%)",
            width: 0,
            height: 0,
            borderLeft: "10px solid transparent",
            borderRight: "10px solid transparent",
            borderTop: "10px solid #FFFFFF",
          }}
        />
      </div>

      {/* Expressive 3D Hero Mascot Character (Uncaged Big Size) */}
      <div
        style={{
          width: "280px",
          height: "340px",
          position: "relative",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Hero3D mode="card" state={heroState} style={{ width: "100%", height: "100%" }} />

        {/* Live Active Status Aura */}
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            background: "rgba(5, 10, 18, 0.88)",
            color: "white",
            padding: "5px 14px",
            borderRadius: "9999px",
            fontSize: "11px",
            fontWeight: "700",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            border: "1px solid rgba(255, 121, 0, 0.3)",
            boxShadow: "0 4px 12px rgba(0,0,0,0.4)"
          }}
        >
          <span className="status-dot available" style={{ width: "7px", height: "7px", background: "#10B981", borderRadius: "50%" }}></span>
          <span style={{ textTransform: "capitalize", color: "#F1F5F9" }}>CoopBot: {heroState}</span>
        </div>
      </div>

    </div>
  );
}
