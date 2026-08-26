import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import { Settings, Save, CheckCircle, Shield, Sliders, DollarSign, Phone, Map, Radio } from "lucide-react";

export default function AdminSettings() {
  const [settings, setSettings] = useState({
    commission_rate: 8.5,
    emergency_contact: "+91 94440 12345",
    auto_dispatch_enabled: true,
    max_service_radius_km: 15,
    payout_cycle: "weekly",
    system_notice: "Cooperative operations running normally."
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    const data = await adminService.getAdminSettings();
    if (data) setSettings(data);
    setLoading(false);
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    const res = await adminService.saveAdminSettings(settings);
    if (res.success) {
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } else {
      alert("Failed to save settings: " + res.error);
    }
    setSaving(false);
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: "var(--space-5)" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
          Platform & Cooperative Configuration
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Fine-tune financial commissions, auto-dispatch dispatch parameters, and emergency configurations.
        </p>
      </div>

      <div style={{ maxWidth: "800px" }}>
        <div style={{ 
          background: "var(--color-surface)", 
          borderRadius: "var(--radius-lg)", 
          border: "1px solid var(--color-border)",
          padding: "var(--space-5)",
          boxShadow: "var(--shadow-sm)"
        }}>
          {savedSuccess && (
            <div style={{ 
              background: "var(--color-success-light)", 
              color: "var(--color-success)", 
              padding: "12px 16px", 
              borderRadius: "var(--radius-md)", 
              marginBottom: "var(--space-4)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontWeight: "600"
            }}>
              <CheckCircle size={18} /> Admin system settings saved and applied in real-time!
            </div>
          )}

          {loading ? (
            <div style={{ padding: "var(--space-6)", textAlign: "center" }}><div className="spinner"></div></div>
          ) : (
            <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column", gap: "var(--space-5)" }}>
              
              {/* Financial Section */}
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <DollarSign size={18} color="var(--color-secondary)" /> Financial & Cooperative Commission
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-4)" }}>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                      Cooperative Commission Fee (%)
                    </label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="100"
                      className="form-input"
                      value={settings.commission_rate || ""}
                      onChange={(e) => setSettings({ ...settings, commission_rate: parseFloat(e.target.value) || 0 })}
                    />
                    <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>Default cooperative platform share (standard: 8.5%)</span>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                      Payout Cycle Schedule
                    </label>
                    <select
                      className="form-input"
                      value={settings.payout_cycle || "weekly"}
                      onChange={(e) => setSettings({ ...settings, payout_cycle: e.target.value })}
                    >
                      <option value="daily">Daily Instant Payout</option>
                      <option value="weekly">Weekly (Every Monday)</option>
                      <option value="biweekly">Bi-weekly (1st & 15th)</option>
                      <option value="monthly">Monthly</option>
                    </select>
                  </div>
                </div>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid var(--color-border)" }} />

              {/* Dispatch & Operations Section */}
              <div>
                <h3 style={{ fontSize: "1.1rem", fontWeight: "700", marginBottom: "var(--space-3)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <Sliders size={18} color="var(--color-primary)" /> Dispatch & Geospatial Controls
                </h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "var(--space-4)" }}>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                      Maximum Service Search Radius (KM)
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="100"
                      className="form-input"
                      value={settings.max_service_radius_km || ""}
                      onChange={(e) => setSettings({ ...settings, max_service_radius_km: parseInt(e.target.value) || 10 })}
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                      Emergency SOS Contact Number
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      value={settings.emergency_contact || ""}
                      onChange={(e) => setSettings({ ...settings, emergency_contact: e.target.value })}
                    />
                  </div>
                </div>

                <div style={{ marginTop: "var(--space-4)" }}>
                  <label style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={settings.auto_dispatch_enabled !== false}
                      onChange={(e) => setSettings({ ...settings, auto_dispatch_enabled: e.target.checked })}
                      style={{ width: "18px", height: "18px", accentColor: "var(--color-primary)" }}
                    />
                    <span style={{ fontWeight: "600", fontSize: "0.9rem" }}>
                      Enable AI Intelligent Auto-Dispatch (Auto matches nearest qualified Pillar)
                    </span>
                  </label>
                </div>
              </div>

              <hr style={{ border: "none", borderTop: "1px solid var(--color-border)" }} />

              {/* System Notice */}
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                  Global System Notice / Banner
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={settings.system_notice || ""}
                  onChange={(e) => setSettings({ ...settings, system_notice: e.target.value })}
                  placeholder="e.g. All service hubs operating in normal hours."
                />
              </div>

              {/* Save Button */}
              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "var(--space-3)" }}>
                <button 
                  type="submit" 
                  className="btn btn-primary" 
                  disabled={saving}
                  style={{ display: "flex", alignItems: "center", gap: "8px", padding: "10px 24px" }}
                >
                  <Save size={16} /> {saving ? "Saving Changes..." : "Save Platform Settings"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
