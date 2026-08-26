import React, { useState, useEffect } from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { Sparkles, Bot, AlertCircle, CheckCircle2, MessageSquare, Send } from "lucide-react";
import { aiService } from "../../../services/pillar/aiService";

export default function HeroInteractiveAgent({
  currentStep = 1,
  activeField = null,
  formError = null,
  formSuccess = false,
  mode = "login", // 'login' | 'register'
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
    if (formSuccess) {
      setHeroState("success");
      setHeroMessage(language === "ta" ? "அருமை! படிவம் வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!" : "Awesome! Your submission is successful!");
      return;
    }

    if (formError) {
      setHeroState("error");
      setHeroMessage(`⚠️ Oops! ${formError}`);
      return;
    }

    if (activeField) {
      setHeroState("speaking");
      switch (activeField) {
        case "identifier":
        case "email":
          setHeroMessage(language === "ta" 
            ? "உங்கள் சரியான மின்னஞ்சல் அல்லது மொபைல் எண்ணை உள்ளிடவும். நான் உங்களுக்கு வழிகாட்டுகிறேன்!"
            : "Enter your registered email or mobile number. I'll help you sign in!");
          break;
        case "password":
          setHeroMessage(language === "ta"
            ? "குறைந்தது 8 எழுத்துக்கள் கொண்ட பாதுகாப்பான கடவுச்சொல்லை உள்ளிடவும்."
            : "Make sure your password is at least 8 characters long with numbers and letters.");
          break;
        case "otp":
          setHeroMessage(language === "ta"
            ? "உங்கள் மொபைலுக்கு அனுப்பப்பட்ட 6 இலக்க OTP எண்ணை உள்ளிடவும்."
            : "Enter the 6-digit OTP code sent to your phone via SMS.");
          break;
        case "fullName":
          setHeroMessage("Enter your full legal name as it appears on your ID documents.");
          break;
        case "mainServices":
          setHeroMessage("Select your primary professional trade (e.g. Electrician, Plumber, AC Repair).");
          break;
        case "experience":
          setHeroMessage("Tell us how many years of experience you have in this service.");
          break;
        case "serviceArea":
          setHeroMessage("Enter the localities or pincodes where you want to receive service jobs.");
          break;
        default:
          setHeroMessage("I'm watching your progress! Fill in the highlighted field.");
      }
      return;
    }

    // Default idle messages
    setHeroState("idle");
    if (mode === "login") {
      setHeroMessage(language === "ta"
        ? "வணக்கம்! உங்கள் COOP HUB பில்லர் கணக்கில் உள்நுழையவும். உங்களுக்கு உதவ நான் எப்போதும் தயார்!"
        : "Welcome back! Enter your login details or switch to Mobile OTP. I'm right here to assist you.");
    } else if (mode === "register") {
      if (currentStep === 1) {
        setHeroMessage(language === "ta"
          ? "படி 1: உங்கள் அடிப்படை தகவல்களை உள்ளிட்டு 'Next' பொத்தானை அழுத்தவும்!"
          : "Step 1 of 2: Fill in your personal details to begin your Pillar registration!");
      } else {
        setHeroMessage(language === "ta"
          ? "படி 2: உங்கள் தொழில் மற்றும் சேவை பகுதிகளைத் தேர்ந்தெடுத்து சமர்ப்பிக்கவும்!"
          : "Step 2 of 2: Select your trade skills and service areas to finish onboarding!");
      }
    }
  }, [activeField, formError, formSuccess, mode, currentStep, language]);

  const handleAsk = async (e) => {
    e?.preventDefault();
    if (!askInput.trim() || isAsking) return;

    const q = askInput.trim();
    setAskInput("");
    setIsAsking(true);
    setHeroState("thinking");
    setHeroMessage("Thinking...");

    try {
      const res = await aiService.chatWithMascot({
        message: q,
        context: { isAuthenticated: false, route: mode === "login" ? "/login" : "/register", language },
      });
      setHeroState("speaking");
      setHeroMessage(res.reply);
      onAskHero?.(res.reply);
      setTimeout(() => {
        setHeroState("idle");
      }, 4000);
    } catch (err) {
      setHeroState("error");
      setHeroMessage("Sorry, I could not process your question. Please try again.");
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
        padding: "var(--space-6)",
        height: "100%",
        maxWidth: "480px",
        margin: "0 auto",
        textAlign: "center",
      }}
    >
      {/* Interactive Speech Bubble */}
      <div
        style={{
          background: "white",
          color: "var(--color-primary)",
          padding: "16px 20px",
          borderRadius: "20px",
          boxShadow: "0 10px 30px rgba(0, 0, 0, 0.15), 0 0 0 2px " + (heroState === "error" ? "var(--color-error)" : heroState === "success" ? "var(--color-success)" : "var(--color-secondary)"),
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
            <span style={{ display: "block", fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: heroState === "error" ? "var(--color-error)" : heroState === "success" ? "var(--color-success)" : "var(--color-secondary)", fontWeight: "800", marginBottom: "2px" }}>
              {heroState === "error" ? "CoopBot Alert" : heroState === "success" ? "CoopBot Success" : heroState === "thinking" ? "CoopBot Thinking" : "CoopBot Live Guidance"}
            </span>
            <span style={{ color: "var(--color-text)", fontWeight: "500" }}>{heroMessage}</span>
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
            borderTop: "10px solid white",
          }}
        ></div>
      </div>

      {/* Expressive Hero Mascot Character with Eye Blink & State Classes */}
      <div
        className={`hero-mascot-container hero-state-${heroState}`}
        style={{
          width: "280px",
          height: "360px",
        }}
      >
        <img
          src="/assets/images/mascot-hero.png"
          alt="Hero AI Mascot"
          style={{
            width: "100%",
            height: "100%",
            objectFit: "contain",
          }}
        />

        {/* Natural eye blink overlay positioned precisely over character screen eyes */}
        <div className="hero-blink-overlay" />

        {/* Live Active Status Aura */}
        <div
          style={{
            position: "absolute",
            bottom: "10px",
            background: "rgba(27, 42, 74, 0.85)",
            color: "white",
            padding: "4px 12px",
            borderRadius: "9999px",
            fontSize: "11px",
            fontWeight: "700",
            backdropFilter: "blur(6px)",
            display: "flex",
            alignItems: "center",
            gap: "6px",
            border: "1px solid rgba(255, 255, 255, 0.2)",
          }}
        >
          <span className="status-dot available" style={{ width: "6px", height: "6px" }}></span>
          <span style={{ textTransform: "capitalize" }}>CoopBot: {heroState}</span>
        </div>
      </div>


    </div>
  );
}
