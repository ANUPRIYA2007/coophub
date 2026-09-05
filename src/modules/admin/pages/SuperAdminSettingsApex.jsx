import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "../../../lib/supabase";
import { useTheme } from "../../../context/ThemeContext";
import { adminService } from "../services/adminService";
import { auditLogService } from "../services/auditLogService";
import { 
  Settings, Save, CheckCircle2, AlertTriangle, Shield, 
  Sliders, Moon, Sun, Lock, Cpu, Globe, Radio, 
  RefreshCw, DollarSign, Users, Award, ShieldCheck
} from "lucide-react";

export default function SuperAdminSettingsApex() {
  const { theme, toggleTheme, isDark } = useTheme();

  // Active Tab
  const [activeTab, setActiveTab] = useState("governance"); // 'governance' | 'dispatch' | 'ai' | 'session' | 'appearance'

  // Settings State
  const [settings, setSettings] = useState({
    commission_rate: 8.5,
    emergency_contact: "+91 94440 12345",
    auto_dispatch_enabled: true,
    max_service_radius_km: 15,
    payout_cycle: "weekly",
    system_notice: "Cooperative operations running smoothly across all service hubs.",
    cancellation_grace_minutes: 15,
    cancellation_fee_fixed: 50.00,
    pf_contribution_enabled: true,
    pf_pillar_rate: 2.50,
    pf_coop_match_rate: 2.50
  });

  // Client Session & Preferences State
  const [sessionPrefs, setSessionPrefs] = useState({
    sessionTimeout: 60,
    enforceCorrelation: true,
    aiModel: "NVIDIA NIM (Llama 3.2 Vision)",
    forecastConfidence: "90%"
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Load Authoritative Settings
  const loadSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getAdminSettings();
      if (data) {
        setSettings(prev => ({
          ...prev,
          ...data
        }));
      }

      // Load client session prefs if stored
      const savedPrefs = localStorage.getItem("coophub_apex_session_prefs");
      if (savedPrefs) {
        try {
          setSessionPrefs(JSON.parse(savedPrefs));
        } catch (e) {}
      }
    } catch (err) {
      console.warn("Settings fetch error:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  // Handle Save
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setSaveError(null);
    setSaveSuccess(false);

    try {
      // 1. Save authoritative settings to database via adminService
      const res = await adminService.saveAdminSettings(settings);

      // 2. Persist local session preferences
      localStorage.setItem("coophub_apex_session_prefs", JSON.stringify(sessionPrefs));

      if (res.success) {
        // 3. Immutably log settings modification
        await auditLogService.logAction({
          admin_id: "SA-000001",
          action: "apex_settings_update",
          entity_type: "platform_governance",
          entity_id: "apex_settings",
          entity_name: "Apex Platform Configuration",
          reason: "Super Admin updated statutory splits, platform policies, or AI governance settings",
          metadata: {
            commission_rate: settings.commission_rate,
            payout_cycle: settings.payout_cycle,
            auto_dispatch_enabled: settings.auto_dispatch_enabled,
            pf_pillar_rate: settings.pf_pillar_rate,
            ai_model: sessionPrefs.aiModel,
            timestamp: new Date().toISOString()
          }
        });

        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 4000);
      } else {
        setSaveError(res.error || "Failed to persist configuration to authoritative database.");
      }
    } catch (err) {
      setSaveError(err.message || "An exception occurred while persisting settings.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div style={{ padding: "28px", maxWidth: "1600px", margin: "0 auto" }}>
      {/* ─────────────────────────────────────────────────────────────
          1. HEADER & APEX CLEARANCE BADGE
          ───────────────────────────────────────────────────────────── */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "24px", flexWrap: "wrap", gap: "16px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "6px" }}>
            <div style={{
              width: "42px", height: "42px", borderRadius: "12px",
              background: isDark ? "rgba(99, 102, 241, 0.15)" : "#EEF2FF",
              color: "#6366F1", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <Settings size={24} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <h1 style={{ fontSize: "24px", fontWeight: "700", color: isDark ? "#F9FAFB" : "#111827", margin: 0 }}>
                  Apex Governance Settings
                </h1>
                <span style={{
                  fontSize: "11px", fontWeight: "700", padding: "3px 8px", borderRadius: "20px",
                  background: isDark ? "rgba(239, 68, 68, 0.15)" : "#FEE2E2",
                  color: "#EF4444", border: "1px solid rgba(239, 68, 68, 0.3)", display: "inline-flex", alignItems: "center", gap: "4px"
                }}>
                  <ShieldCheck size={12} />
                  APEX LEVEL 5 CLEARANCE
                </span>
              </div>
              <p style={{ fontSize: "14px", color: isDark ? "#9CA3AF" : "#6B7280", margin: "2px 0 0 0" }}>
                Statutory revenue split ratios, welfare allocations, AI parameters, and national platform policies
              </p>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <button
            onClick={loadSettings}
            disabled={loading}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "9px 16px", borderRadius: "8px", fontSize: "13px", fontWeight: "600",
              background: isDark ? "#1F2937" : "#F3F4F6", color: isDark ? "#F9FAFB" : "#111827",
              border: isDark ? "1px solid #374151" : "1px solid #D1D5DB", cursor: "pointer"
            }}
          >
            <RefreshCw size={15} className={loading ? "animate-spin" : ""} />
            Reload
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            style={{
              display: "flex", alignItems: "center", gap: "8px",
              padding: "9px 20px", borderRadius: "8px", fontSize: "13px", fontWeight: "600",
              background: "#3B82F6", color: "#FFFFFF", border: "none", cursor: "pointer"
            }}
          >
            <Save size={16} />
            {saving ? "Saving Settings..." : "Save Apex Settings"}
          </button>
        </div>
      </div>

      {/* ─────────────────────────────────────────────────────────────
          2. APEX IDENTITY CARD
          ───────────────────────────────────────────────────────────── */}
      <div style={{
        background: isDark ? "rgba(17, 24, 39, 0.7)" : "#F8FAFC",
        border: isDark ? "1px solid #1F2937" : "1px solid #E2E8F0",
        borderRadius: "12px", padding: "16px 20px", marginBottom: "24px"
      }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: isDark ? "#9CA3AF" : "#64748B", display: "block" }}>
                Super Admin Code:
              </span>
              <strong style={{ fontSize: "13px", color: isDark ? "#F9FAFB" : "#111827" }}>
                SA-000001 (National Apex)
              </strong>
            </div>
            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: isDark ? "#9CA3AF" : "#64748B", display: "block" }}>
                Authoritative Email:
              </span>
              <strong style={{ fontSize: "13px", color: "#3B82F6" }}>
                superadmin@coophub.gov.in
              </strong>
            </div>
            <div>
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: isDark ? "#9CA3AF" : "#64748B", display: "block" }}>
                Territorial Scope:
              </span>
              <strong style={{ fontSize: "13px", color: "#10B981" }}>
                National (36 States & UTs)
              </strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: "6px", background: isDark ? "#1F2937" : "#F3F4F6", padding: "4px", borderRadius: "8px" }}>
            {[
              { id: "governance", label: "Statutory Splits", icon: DollarSign },
              { id: "dispatch", label: "Dispatch Policies", icon: Sliders },
              { id: "ai", label: "AI Parameters", icon: Cpu },
              { id: "session", label: "Security & Session", icon: Lock },
              { id: "appearance", label: "Appearance", icon: Moon }
            ].map(tab => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  style={{
                    display: "flex", alignItems: "center", gap: "6px",
                    padding: "6px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: "600",
                    background: active ? (isDark ? "#374151" : "#FFFFFF") : "transparent",
                    color: active ? (isDark ? "#FFFFFF" : "#111827") : (isDark ? "#9CA3AF" : "#6B7280"),
                    boxShadow: active ? "0 1px 3px rgba(0,0,0,0.1)" : "none",
                    border: "none", cursor: "pointer"
                  }}
                >
                  <Icon size={14} />
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {saveSuccess && (
        <div style={{
          padding: "12px 16px", borderRadius: "8px", marginBottom: "20px",
          background: isDark ? "rgba(16, 185, 129, 0.15)" : "#D1FAE5",
          color: "#10B981", border: "1px solid rgba(16, 185, 129, 0.3)",
          display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600"
        }}>
          <CheckCircle2 size={18} />
          Apex settings successfully persisted to database and recorded in security audit trail.
        </div>
      )}

      {saveError && (
        <div style={{
          padding: "12px 16px", borderRadius: "8px", marginBottom: "20px",
          background: isDark ? "rgba(239, 68, 68, 0.15)" : "#FEE2E2",
          color: "#EF4444", border: "1px solid rgba(239, 68, 68, 0.3)",
          display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", fontWeight: "600"
        }}>
          <AlertTriangle size={18} />
          {saveError}
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          3. TAB 1: STATUTORY REVENUE SPLITS & WELFARE RATIOS
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "governance" && (
        <div style={{
          background: isDark ? "#111827" : "#FFFFFF",
          border: isDark ? "1px solid #1F2937" : "1px solid #E5E7EB",
          borderRadius: "12px", padding: "28px"
        }}>
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: isDark ? "#F9FAFB" : "#111827", margin: "0 0 4px 0" }}>
              Statutory Revenue Split Ratios & Welfare Reserves
            </h3>
            <p style={{ fontSize: "13px", color: isDark ? "#9CA3AF" : "#6B7280", margin: 0 }}>
              Defines the legal economic model of COOP HUB. Every rupee is mathematically accounted for.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
            {/* Commission Rate */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: isDark ? "#D1D5DB" : "#374151", marginBottom: "6px" }}>
                Cooperative Platform Contribution Rate (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="25"
                value={settings.commission_rate ?? 8.5}
                onChange={(e) => setSettings({ ...settings, commission_rate: parseFloat(e.target.value) || 0 })}
                style={{
                  width: "100%", padding: "9px 14px", borderRadius: "8px", fontSize: "13px",
                  background: isDark ? "#1F2937" : "#F9FAFB", color: isDark ? "#F9FAFB" : "#111827",
                  border: isDark ? "1px solid #374151" : "1px solid #D1D5DB", outline: "none"
                }}
              />
              <span style={{ fontSize: "11px", color: isDark ? "#9CA3AF" : "#6B7280" }}>
                Statutory cooperative split funding national insurance and PF reserves (default: 8.5%).
              </span>
            </div>

            {/* Calculated Worker Share */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: isDark ? "#D1D5DB" : "#374151", marginBottom: "6px" }}>
                Technician Take-Home Direct Share (%)
              </label>
              <div style={{
                padding: "9px 14px", borderRadius: "8px", fontSize: "14px", fontWeight: "700",
                background: isDark ? "rgba(16, 185, 129, 0.15)" : "#ECFDF5", color: "#10B981",
                border: isDark ? "1px solid rgba(16, 185, 129, 0.3)" : "1px solid #A7F3D0"
              }}>
                {(100 - (settings.commission_rate ?? 8.5)).toFixed(1)}% Direct Payout
              </div>
              <span style={{ fontSize: "11px", color: isDark ? "#9CA3AF" : "#6B7280" }}>
                Calculated automatically as (100 - Cooperative Share)% to guarantee fair wages.
              </span>
            </div>

            {/* PF Pillar Rate */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: isDark ? "#D1D5DB" : "#374151", marginBottom: "6px" }}>
                Worker Provident Fund Contribution (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={settings.pf_pillar_rate ?? 2.5}
                onChange={(e) => setSettings({ ...settings, pf_pillar_rate: parseFloat(e.target.value) || 0 })}
                style={{
                  width: "100%", padding: "9px 14px", borderRadius: "8px", fontSize: "13px",
                  background: isDark ? "#1F2937" : "#F9FAFB", color: isDark ? "#F9FAFB" : "#111827",
                  border: isDark ? "1px solid #374151" : "1px solid #D1D5DB", outline: "none"
                }}
              />
              <span style={{ fontSize: "11px", color: isDark ? "#9CA3AF" : "#6B7280" }}>
                Technician voluntary retirement savings contribution deducted per invoice.
              </span>
            </div>

            {/* PF Coop Match Rate */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: isDark ? "#D1D5DB" : "#374151", marginBottom: "6px" }}>
                Cooperative PF Matching Contribution (%)
              </label>
              <input
                type="number"
                step="0.1"
                min="0"
                max="10"
                value={settings.pf_coop_match_rate ?? 2.5}
                onChange={(e) => setSettings({ ...settings, pf_coop_match_rate: parseFloat(e.target.value) || 0 })}
                style={{
                  width: "100%", padding: "9px 14px", borderRadius: "8px", fontSize: "13px",
                  background: isDark ? "#1F2937" : "#F9FAFB", color: isDark ? "#F9FAFB" : "#111827",
                  border: isDark ? "1px solid #374151" : "1px solid #D1D5DB", outline: "none"
                }}
              />
              <span style={{ fontSize: "11px", color: isDark ? "#9CA3AF" : "#6B7280" }}>
                100% matched cooperative deposit into technician retirement account.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          4. TAB 2: DISPATCH POLICIES & OPERATIONAL CONTROLS
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "dispatch" && (
        <div style={{
          background: isDark ? "#111827" : "#FFFFFF",
          border: isDark ? "1px solid #1F2937" : "1px solid #E5E7EB",
          borderRadius: "12px", padding: "28px"
        }}>
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: isDark ? "#F9FAFB" : "#111827", margin: "0 0 4px 0" }}>
              Dispatch Parameters & Operational Helpline
            </h3>
            <p style={{ fontSize: "13px", color: isDark ? "#9CA3AF" : "#6B7280", margin: 0 }}>
              National dispatch policies, maximum service radii, and customer cancellation rules
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }}>
            {/* Service Radius */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: isDark ? "#D1D5DB" : "#374151", marginBottom: "6px" }}>
                Max Service Dispatch Radius (km)
              </label>
              <input
                type="number"
                min="1"
                max="60"
                value={settings.max_service_radius_km ?? 15}
                onChange={(e) => setSettings({ ...settings, max_service_radius_km: parseInt(e.target.value) || 15 })}
                style={{
                  width: "100%", padding: "9px 14px", borderRadius: "8px", fontSize: "13px",
                  background: isDark ? "#1F2937" : "#F9FAFB", color: isDark ? "#F9FAFB" : "#111827",
                  border: isDark ? "1px solid #374151" : "1px solid #D1D5DB", outline: "none"
                }}
              />
            </div>

            {/* Emergency Helpline */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: isDark ? "#D1D5DB" : "#374151", marginBottom: "6px" }}>
                National Emergency Helpline
              </label>
              <input
                type="text"
                value={settings.emergency_contact || ""}
                onChange={(e) => setSettings({ ...settings, emergency_contact: e.target.value })}
                style={{
                  width: "100%", padding: "9px 14px", borderRadius: "8px", fontSize: "13px",
                  background: isDark ? "#1F2937" : "#F9FAFB", color: isDark ? "#F9FAFB" : "#111827",
                  border: isDark ? "1px solid #374151" : "1px solid #D1D5DB", outline: "none"
                }}
              />
            </div>

            {/* Cancellation Grace Period */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: isDark ? "#D1D5DB" : "#374151", marginBottom: "6px" }}>
                Free Cancellation Grace Window (minutes)
              </label>
              <input
                type="number"
                min="0"
                max="60"
                value={settings.cancellation_grace_minutes ?? 15}
                onChange={(e) => setSettings({ ...settings, cancellation_grace_minutes: parseInt(e.target.value) || 15 })}
                style={{
                  width: "100%", padding: "9px 14px", borderRadius: "8px", fontSize: "13px",
                  background: isDark ? "#1F2937" : "#F9FAFB", color: isDark ? "#F9FAFB" : "#111827",
                  border: isDark ? "1px solid #374151" : "1px solid #D1D5DB", outline: "none"
                }}
              />
            </div>

            {/* Cancellation Fee */}
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: isDark ? "#D1D5DB" : "#374151", marginBottom: "6px" }}>
                Post-Grace Cancellation Fee (INR ₹)
              </label>
              <input
                type="number"
                min="0"
                max="500"
                value={settings.cancellation_fee_fixed ?? 50}
                onChange={(e) => setSettings({ ...settings, cancellation_fee_fixed: parseFloat(e.target.value) || 50 })}
                style={{
                  width: "100%", padding: "9px 14px", borderRadius: "8px", fontSize: "13px",
                  background: isDark ? "#1F2937" : "#F9FAFB", color: isDark ? "#F9FAFB" : "#111827",
                  border: isDark ? "1px solid #374151" : "1px solid #D1D5DB", outline: "none"
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          5. TAB 3: AI PARAMETERS & FORECASTING MODEL
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "ai" && (
        <div style={{
          background: isDark ? "#111827" : "#FFFFFF",
          border: isDark ? "1px solid #1F2937" : "1px solid #E5E7EB",
          borderRadius: "12px", padding: "28px"
        }}>
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: isDark ? "#F9FAFB" : "#111827", margin: "0 0 4px 0" }}>
              AI Intelligence Pipeline Configuration
            </h3>
            <p style={{ fontSize: "13px", color: isDark ? "#9CA3AF" : "#6B7280", margin: 0 }}>
              Governs the multimodal document reasoning and Amazon Chronos-2 forecasting pipelines
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: isDark ? "#D1D5DB" : "#374151", marginBottom: "6px" }}>
                Primary Reasoning AI Provider
              </label>
              <select
                value={sessionPrefs.aiModel}
                onChange={(e) => setSessionPrefs({ ...sessionPrefs, aiModel: e.target.value })}
                style={{
                  width: "100%", padding: "9px 14px", borderRadius: "8px", fontSize: "13px",
                  background: isDark ? "#1F2937" : "#F9FAFB", color: isDark ? "#F9FAFB" : "#111827",
                  border: isDark ? "1px solid #374151" : "1px solid #D1D5DB", outline: "none"
                }}
              >
                <option value="NVIDIA NIM (Llama 3.2 Vision)">NVIDIA NIM (meta/llama-3.2-11b-vision-instruct)</option>
                <option value="Google Gemini 1.5">Google Gemini 1.5 Pro / Flash</option>
                <option value="Deterministic Statistical Fallback">Local Deterministic Engine</option>
              </select>
            </div>

            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: isDark ? "#D1D5DB" : "#374151", marginBottom: "6px" }}>
                Chronos-2 Forecast Confidence Interval
              </label>
              <select
                value={sessionPrefs.forecastConfidence}
                onChange={(e) => setSessionPrefs({ ...sessionPrefs, forecastConfidence: e.target.value })}
                style={{
                  width: "100%", padding: "9px 14px", borderRadius: "8px", fontSize: "13px",
                  background: isDark ? "#1F2937" : "#F9FAFB", color: isDark ? "#F9FAFB" : "#111827",
                  border: isDark ? "1px solid #374151" : "1px solid #D1D5DB", outline: "none"
                }}
              >
                <option value="80%">80% Quantile Range (P10 - P90)</option>
                <option value="90%">90% Quantile Range (P05 - P95)</option>
                <option value="95%">95% Conservative Safety Buffer</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          6. TAB 4: SECURITY & SESSION
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "session" && (
        <div style={{
          background: isDark ? "#111827" : "#FFFFFF",
          border: isDark ? "1px solid #1F2937" : "1px solid #E5E7EB",
          borderRadius: "12px", padding: "28px"
        }}>
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: isDark ? "#F9FAFB" : "#111827", margin: "0 0 4px 0" }}>
              Super Admin Session & Compliance Guard
            </h3>
            <p style={{ fontSize: "13px", color: isDark ? "#9CA3AF" : "#6B7280", margin: 0 }}>
              Apex security enforcement, session timeout limits, and correlation trace header settings
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
            <div>
              <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: isDark ? "#D1D5DB" : "#374151", marginBottom: "6px" }}>
                Session Inactivity Timeout (minutes)
              </label>
              <select
                value={sessionPrefs.sessionTimeout}
                onChange={(e) => setSessionPrefs({ ...sessionPrefs, sessionTimeout: parseInt(e.target.value) || 60 })}
                style={{
                  width: "100%", padding: "9px 14px", borderRadius: "8px", fontSize: "13px",
                  background: isDark ? "#1F2937" : "#F9FAFB", color: isDark ? "#F9FAFB" : "#111827",
                  border: isDark ? "1px solid #374151" : "1px solid #D1D5DB", outline: "none"
                }}
              >
                <option value={15}>15 minutes (Strict High Security)</option>
                <option value={30}>30 minutes</option>
                <option value={60}>60 minutes (Standard)</option>
                <option value={120}>120 minutes (Extended)</option>
              </select>
            </div>

            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "16px", borderRadius: "8px", background: isDark ? "#1F2937" : "#F9FAFB" }}>
              <div>
                <strong style={{ fontSize: "13px", color: isDark ? "#F9FAFB" : "#111827", display: "block" }}>
                  Mandatory Request Correlation ID
                </strong>
                <span style={{ fontSize: "11px", color: isDark ? "#9CA3AF" : "#6B7280" }}>
                  Inject X-Correlation-ID into all privileged administrative requests
                </span>
              </div>
              <input
                type="checkbox"
                checked={sessionPrefs.enforceCorrelation}
                onChange={(e) => setSessionPrefs({ ...sessionPrefs, enforceCorrelation: e.target.checked })}
                style={{ width: "18px", height: "18px" }}
              />
            </div>
          </div>
        </div>
      )}

      {/* ─────────────────────────────────────────────────────────────
          7. TAB 5: APPEARANCE & THEME PREVIEW
          ───────────────────────────────────────────────────────────── */}
      {activeTab === "appearance" && (
        <div style={{
          background: isDark ? "#111827" : "#FFFFFF",
          border: isDark ? "1px solid #1F2937" : "1px solid #E5E7EB",
          borderRadius: "12px", padding: "28px"
        }}>
          <div style={{ marginBottom: "24px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: isDark ? "#F9FAFB" : "#111827", margin: "0 0 4px 0" }}>
              Interface Theme & Design System
            </h3>
            <p style={{ fontSize: "13px", color: isDark ? "#9CA3AF" : "#6B7280", margin: 0 }}>
              Seamlessly toggle between Command Center Dark Mode and Government Enterprise Light Mode
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
            <button
              onClick={toggleTheme}
              style={{
                display: "flex", alignItems: "center", gap: "10px",
                padding: "12px 24px", borderRadius: "10px", fontSize: "14px", fontWeight: "700",
                background: isDark ? "#374151" : "#F3F4F6", color: isDark ? "#F9FAFB" : "#111827",
                border: isDark ? "1px solid #4B5563" : "1px solid #D1D5DB", cursor: "pointer"
              }}
            >
              {isDark ? <Sun size={20} style={{ color: "#F59E0B" }} /> : <Moon size={20} style={{ color: "#6366F1" }} />}
              Switch to {isDark ? "Light Enterprise Theme" : "Command Center Dark Theme"}
            </button>
            <span style={{ fontSize: "13px", color: isDark ? "#9CA3AF" : "#6B7280" }}>
              Current Theme: <strong>{theme.toUpperCase()}</strong> (Persisted to localStorage <code>coophub_theme</code>)
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
