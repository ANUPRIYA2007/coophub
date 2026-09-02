import React from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/useTranslation";
import { Globe, Bell, Shield, HelpCircle, Moon, Smartphone, ArrowLeft } from "lucide-react";

export default function SettingsPage() {
  const navigate = useNavigate();
  const { t, language, changeLanguage, supportedLanguages } = useTranslation();

  return (
    <div className="container" style={{ paddingTop: "var(--space-6)" }}>
      <div className="page-header">
        <div>
          <div style={{ marginBottom: "6px" }}>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-outline btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", fontSize: "12px", fontWeight: "700" }}
              title="Back to Pillar Dashboard Home"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
          </div>
          <h1 className="page-title">{t("settings.title")}</h1>
          <p className="page-subtitle">Configure app preferences, notifications, and security</p>
        </div>
      </div>

      <div className="grid grid-2">
        {/* Language & Regional */}
        <div className="card">
          <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Globe size={20} color="var(--color-secondary)" />
            <h3 style={{ fontSize: "var(--font-size-base)", fontWeight: "600" }}>{t("settings.language")}</h3>
          </div>
          <div className="card-body">
            <p style={{ color: "var(--color-text-secondary)", fontSize: "var(--font-size-sm)", marginBottom: "var(--space-4)" }}>
              Choose your preferred language for the Pillar Portal interface:
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              {supportedLanguages.map((lang) => (
                <button
                  key={lang.code}
                  className={`btn ${language === lang.code ? "btn-primary" : "btn-outline"}`}
                  onClick={() => changeLanguage(lang.code)}
                >
                  {lang.nativeName} ({lang.name})
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* App Version & Info */}
        <div className="card">
          <div className="card-header" style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <Smartphone size={20} color="var(--color-secondary)" />
            <h3 style={{ fontSize: "var(--font-size-base)", fontWeight: "600" }}>{t("settings.about")}</h3>
          </div>
          <div className="card-body">
            <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)", fontSize: "var(--font-size-sm)" }}>
              <div><strong>Application:</strong> COOP HUB Pillar Portal</div>
              <div><strong>{t("settings.appVersion")}:</strong> v1.0.0 (Production Build)</div>
              <div><strong>Branch:</strong> pillar-dashboard</div>
              <div><strong>Database:</strong> Supabase PostgreSQL (Live)</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
