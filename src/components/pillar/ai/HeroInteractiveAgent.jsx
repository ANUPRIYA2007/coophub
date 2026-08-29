import React, { useState, useEffect } from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { Sparkles, Bot, AlertCircle, CheckCircle2, MessageSquare, Send, ShieldCheck, FileText, Lock } from "lucide-react";
import { aiService } from "../../../services/pillar/aiService";
import Hero3D from "../../hero3d/Hero3D";

export default function HeroInteractiveAgent({
  currentStep = 1,
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

  // Reactive state changes based on real user actions and newly added steps
  useEffect(() => {
    if (formSuccess) {
      setHeroState("success");
      setHeroMessage(
        language === "ta" 
          ? "அருமை! உங்கள் ஆவணங்கள் சரிபார்ப்புக்கு வெற்றிகரமாக சமர்ப்பிக்கப்பட்டது!" 
          : "Awesome! Your registration and ID document are submitted for PaddleOCR verification!"
      );
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
          setHeroMessage(
            language === "ta" 
              ? "உங்கள் சரியான மின்னஞ்சல் அல்லது பதிவு செய்த பில்லர் ஐடியை உள்ளிடவும்!"
              : "Enter your registered email or Unique Pillar ID. I'll guide your sign-in!"
          );
          break;
        case "pillarId":
          setHeroMessage(
            language === "ta"
              ? "நிர்வாகத்தால் ஒதுக்கப்பட்ட உங்கள் பில்லர் ஐடியை (எ.கா. PIL-CHE-042) உள்ளிடவும்."
              : "Enter your unique Pillar ID (e.g. PIL-CHE-042) or mobile number to receive an OTP."
          );
          break;
        case "password":
          setHeroMessage(
            language === "ta"
              ? "குறைந்தது 8 எழுத்துக்கள் கொண்ட பாதுகாப்பான கடவுச்சொல்லை உள்ளிடவும்."
              : "Make sure your password is at least 8 characters long with numbers and letters."
          );
          break;
        case "otp":
          setHeroMessage(
            language === "ta"
              ? "உங்கள் மொபைலுக்கு அனுப்பப்பட்ட 6 இலக்க OTP எண்ணை உள்ளிடவும்."
              : "Enter the 6-digit OTP code sent to your phone via SMS."
          );
          break;
        case "fullName":
          setHeroMessage(
            language === "ta"
              ? "உங்கள் அரசு அடையாள அட்டையில் உள்ளவாறு முழு சட்டப்பூர்வ பெயரை உள்ளிடவும்."
              : "Enter your full legal name exactly as it appears on your Government ID."
          );
          break;
        case "mainServices":
          setHeroMessage(
            language === "ta"
              ? "உங்கள் முதன்மை தொழில் பிரிவைத் தேர்ந்தெடுக்கவும் (மின்சார வல்லுநர், பிளம்பர், ஏசி பழுது)."
              : "Select your core trade specialization (Electrician, Plumber, AC Repair, etc.)."
          );
          break;
        case "subServices":
          setHeroMessage("Add comma-separated sub-skills (e.g. Wiring, DB Box, Pipe Fitting, Inverter).");
          break;
        case "experience":
          setHeroMessage("Select your verified years of on-field technical trade experience.");
          break;
        case "serviceArea":
          setHeroMessage("Specify your operating localities or pin codes across Chennai for job dispatch.");
          break;
        case "documentType":
          setHeroMessage("Select your Government ID type: Aadhaar, PAN Card, Voter ID, or Driving Licence.");
          break;
        case "customDocumentType":
          setHeroMessage("Specify your custom government identity document title.");
          break;
        case "documentNumber":
          setHeroMessage("Enter your official document number. Sensitive digits are automatically masked for privacy.");
          break;
        case "dob":
          setHeroMessage("Select your Date of Birth as printed on your uploaded identity document.");
          break;
        default:
          setHeroMessage("I'm watching your progress! Fill in the highlighted field.");
      }
      return;
    }

    // Default idle messages based on exact step lifecycle
    setHeroState("idle");
    if (mode === "login") {
      setHeroMessage(
        language === "ta"
          ? "வணக்கம்! உங்கள் COOP HUB பில்லர் கணக்கில் உள்நுழையவும். உங்களுக்கு உதவ நான் எப்போதும் தயார்!"
          : "Welcome to COOP HUB Pillar Portal! Enter your assigned Pillar ID or login with Password/OTP."
      );
    } else if (mode === "register") {
      if (currentStep === 1) {
        setHeroMessage(
          language === "ta"
            ? "படி 1/4: உங்கள் தனிப்பட்ட சுயவிவர தகவல்களை உள்ளிட்டு 'Next' பொத்தானை அழுத்தவும்!"
            : "Step 1 of 4: Enter your personal profile details to begin your Pillar registration!"
        );
      } else if (currentStep === 2) {
        setHeroMessage(
          language === "ta"
            ? "படி 2/4: உங்கள் முதன்மை தொழில் திறன் மற்றும் சேவை பகுதிகளைத் தேர்ந்தெடுக்கவும்!"
            : "Step 2 of 4: Select your trade skills and operating service areas across Chennai!"
        );
      } else if (currentStep === 3) {
        setHeroMessage(
          language === "ta"
            ? "படி 3/4: ஆதார், பான், வாக்காளர் அட்டை அல்லது ஓட்டுநர் உரிமத்தைப் பதிவேற்றி சரிபார்க்கவும்!"
            : "Step 3 of 4: Upload your Government Identity Document for PaddleOCR administrative verification!"
        );
      } else if (currentStep === 4) {
        setHeroMessage(
          language === "ta"
            ? "படி 4/4: உங்கள் திறன் சான்றிதழ்களைப் பதிவேற்றி பில்லர் பதிவை நிறைவு செய்யவும்!"
            : "Step 4 of 4: Upload optional trade skill certificates to boost your verified ranking and complete registration!"
        );
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
    setHeroMessage("Analyzing your question...");

    try {
      const res = await aiService.chatWithMascot({
        message: q,
        context: { isAuthenticated: false, route: mode === "login" ? "/pillar/login" : "/pillar/register", language },
      });
      setHeroState("speaking");
      setHeroMessage(res.reply);
      onAskHero?.(res.reply);
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

      {/* Expressive 3D Hero Mascot Character */}
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

        {/* Live Active Status Aura with Global Dark Navy & Orange Styling */}
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
