import React, { useState, useEffect } from "react";
import { getAdminBroadcasts, sendAdminBroadcast } from "../../../services/admin/governanceService";
import { supabase } from "../../../lib/supabase";
import { 
  MessageSquare, Send, CheckCircle, Clock, Users, Globe, 
  Layers, Wrench, Shield, CheckCheck, Sparkles, Filter 
} from "lucide-react";

export default function SuperAdminBroadcast() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [dbServices, setDbServices] = useState([]);
  
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [targetAudience, setTargetAudience] = useState("all_pillars");
  const [geographicScope, setGeographicScope] = useState("national");
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    fetchBroadcasts();
    fetchServices();
  }, []);

  const fetchBroadcasts = async () => {
    setLoading(true);
    try {
      const res = await getAdminBroadcasts();
      setBroadcasts(res.broadcasts || []);
    } catch (err) {
      console.error("Failed to fetch broadcasts", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .order('display_order', { ascending: true });
      if (!error && data) {
        setDbServices(data);
      }
    } catch (err) {
      console.warn("Notice: could not query db services, using master catalog:", err);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSending(true);
    try {
      const res = await sendAdminBroadcast({
        title,
        message,
        category,
        priority,
        target_audience: targetAudience,
        geographic_scope: geographicScope
      });

      if (res.success) {
        setBroadcasts([res.data, ...broadcasts]);
        setTitle("");
        setMessage("");
        setSuccessMsg(true);
        setTimeout(() => setSuccessMsg(false), 4000);
      }
    } catch (err) {
      alert("Failed to send broadcast: " + err.message);
    } finally {
      setSending(false);
    }
  };

  // Comprehensive master catalog of all trade services in COOP HUB
  const ALL_SERVICES_CATALOG = [
    {
      group: "General Platform Roles",
      options: [
        { value: "all_pillars", label: "👥 All Workforce Pillars (Universal Workforce)" },
        { value: "all_customers", label: "🛍️ All Registered Customers" },
        { value: "all_admins", label: "🛡️ Subordinate & Zonal Admins" }
      ]
    },
    {
      group: "Electrical, Mechanical & Cooling Services",
      options: [
        { value: "electrician", label: "⚡ Electrician & Electrical Repair" },
        { value: "plumber", label: "🚰 Plumber & Sanitary Pipe Fitting" },
        { value: "ac_technician", label: "❄️ AC Repair & HVAC Maintenance" },
        { value: "appliance_repair", label: "🧺 Home Appliance Repair (Washing Machine, Fridge, Microwave)" },
        { value: "carpenter", label: "🪚 Carpenter & Woodwork Fabrication" },
        { value: "painter", label: "🎨 Professional House Painter & Wood Polish" },
        { value: "cctv_technician", label: "📹 CCTV, Security & Electronics Technicians" },
        { value: "technician_services", label: "🔧 General Technician & Diagnostics" }
      ]
    },
    {
      group: "Home Cleaning, Care & Domestic Services",
      options: [
        { value: "home_cleaning", label: "✨ Deep Home Cleaning & Sanitation" },
        { value: "domestic_helpers", label: "🍲 Domestic Helpers & Housekeeping" },
        { value: "caregiver_services", label: "🩺 Caregiver Services & Home Nursing Support" },
        { value: "gardening_landscaping", label: "🌿 Gardening & Landscaping" },
        { value: "pest_control", label: "🐜 Pest Control & Fumigation" },
        { value: "masonry_civil", label: "🧱 Masonry, Civil Works & Tile Fitting" }
      ]
    },
    {
      group: "Transport, Logistics & Vehicle Services",
      options: [
        { value: "driver_services", label: "🚗 Professional Driver & Chauffeur Services" }
      ]
    },
    {
      group: "Specialized & Rapid Response Operations",
      options: [
        { value: "emergency_services", label: "🚨 24/7 Emergency Rapid Response Squad" },
        { value: "on_demand_services", label: "⚡ On-Demand Priority Dispatch Squad" },
        { value: "verified_coop", label: "🛡️ Verified Cooperative Society Workers" },
        { value: "training_certification", label: "🎓 Training & Certification Trainees" },
        { value: "specialized_trades", label: "🛠️ Specialized & Custom Trade Artisans" }
      ]
    }
  ];

  // Helper to nicely format audience in the transmission logs
  const formatTargetAudience = (target) => {
    const map = {
      all_pillars: "👥 All Workforce Pillars",
      all_customers: "🛍️ All Customers",
      all_admins: "🛡️ Subordinate Admins",
      electrician: "⚡ Electricians",
      electricians: "⚡ Electricians",
      plumber: "🚰 Plumbers",
      plumbers: "🚰 Plumbers",
      ac_technician: "❄️ AC Technicians",
      ac_technicians: "❄️ AC Technicians",
      appliance_repair: "🧺 Appliance Repair",
      appliance: "🧺 Appliance Technicians",
      carpenter: "🪚 Carpenters",
      carpenters: "🪚 Carpenters",
      painter: "🎨 Painters",
      painters: "🎨 Painters",
      cctv_technician: "📹 CCTV Technicians",
      technician_services: "🔧 Technician Services",
      home_cleaning: "✨ Deep Home Cleaning",
      domestic_helpers: "🍲 Domestic Helpers",
      caregiver_services: "🩺 Caregivers & Nursing",
      gardening_landscaping: "🌿 Gardening & Landscaping",
      pest_control: "🐜 Pest Control Squad",
      masonry_civil: "🧱 Masonry & Civil Works",
      driver_services: "🚗 Professional Drivers",
      drivers: "🚗 Professional Drivers",
      emergency_services: "🚨 Emergency Response Squad",
      emergency: "🚨 Emergency Response Squad",
      on_demand_services: "⚡ On-Demand Squad",
      verified_coop: "🛡️ Verified Coop Workers",
      training_certification: "🎓 Training Candidates",
      specialized_trades: "🛠️ Specialized Trades"
    };
    return map[target] || target?.replace(/_/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "All Pillars";
  };

  // Find label of currently selected audience
  const selectedAudienceLabel = (() => {
    for (const group of ALL_SERVICES_CATALOG) {
      const match = group.options.find(o => o.value === targetAudience);
      if (match) return match.label;
    }
    return formatTargetAudience(targetAudience);
  })();

  return (
    <div className="fade-in">
      <div style={{ marginBottom: "var(--space-4)" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)", margin: 0, marginBottom: "var(--space-2)" }}>
          National Broadcast Engine
        </h1>
        <p style={{ color: "var(--color-text-secondary)", margin: 0 }}>
          Command Center for dispatching emergency alerts, policy updates, and service catalogs across 36 States & UTs.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "var(--space-5)" }}>
        
        {/* Broadcast Composer */}
        <div style={{ 
          background: "var(--color-surface)", 
          borderRadius: "var(--radius-lg)", 
          border: "1px solid var(--color-border)",
          padding: "var(--space-5)",
          boxShadow: "var(--shadow-sm)"
        }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
            <h2 style={{ fontSize: "1.15rem", fontWeight: "700", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
              <Globe size={18} color="var(--color-primary)" /> Target & Dispatch
            </h2>
            <span style={{
              fontSize: "0.72rem", fontWeight: "700", padding: "3px 8px", borderRadius: "10px",
              background: "rgba(59, 130, 246, 0.1)", color: "var(--color-primary)"
            }}>
              All Services Enabled
            </span>
          </div>

          {successMsg && (
            <div style={{ 
              background: "var(--color-success-light)", 
              color: "var(--color-success)", 
              padding: "10px 14px", 
              borderRadius: "var(--radius-md)", 
              marginBottom: "var(--space-4)",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontSize: "0.85rem",
              fontWeight: "600"
            }}>
              <CheckCircle size={16} /> Broadcast transmitted successfully across target network!
            </div>
          )}

          <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                Broadcast Headline
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. National Policy Update: Safety & Welfare Standards"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                  Geographic Scope
                </label>
                <select className="form-input" value={geographicScope} onChange={(e) => setGeographicScope(e.target.value)}>
                  <option value="national">National (All 36 States & UTs)</option>
                  <option value="zone_south">South Zone (TN, KL, KA, AP, TG, PY)</option>
                  <option value="zone_north">North Zone (DL, UP, HR, PB, RJ, HP, UK)</option>
                  <option value="zone_west">West Zone (MH, GJ, GA, DD, DNH)</option>
                  <option value="zone_east">East Zone (WB, OD, BR, JH)</option>
                  <option value="zone_central">Central Zone (MP, CG)</option>
                  <option value="zone_northeast">North-East Zone (AS, ML, MN, MZ, NL, TR, AR, SK)</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                  Priority Level
                </label>
                <select className="form-input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="normal">Standard Notice</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Critical Emergency Alert</option>
                </select>
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                  Target Audience (All Services)
                </label>
                <select 
                  className="form-input" 
                  value={targetAudience} 
                  onChange={(e) => setTargetAudience(e.target.value)}
                  style={{ fontSize: "0.83rem" }}
                >
                  {ALL_SERVICES_CATALOG.map((grp) => (
                    <optgroup key={grp.group} label={grp.group}>
                      {grp.options.map((opt) => (
                        <option key={opt.value} value={opt.value}>
                          {opt.label}
                        </option>
                      ))}
                    </optgroup>
                  ))}

                  {/* Any extra services loaded from Database that aren't already listed */}
                  {dbServices.length > 0 && (
                    <optgroup label="Custom Registered Database Services">
                      {dbServices
                        .filter(s => !ALL_SERVICES_CATALOG.some(grp => grp.options.some(o => o.label.toLowerCase().includes(s.name.toLowerCase()))))
                        .map(s => (
                          <option key={s.id || s.name} value={s.name.toLowerCase().replace(/[^a-z0-9]+/g, '_')}>
                            {s.icon || '🛠️'} {s.name} Only
                          </option>
                        ))}
                    </optgroup>
                  )}
                </select>
              </div>
              
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                  Category
                </label>
                <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="general">General Advisory</option>
                  <option value="surge">Surge & Economics</option>
                  <option value="emergency">Weather / Disaster Response</option>
                  <option value="payout">Statutory & Compliance</option>
                  <option value="training">Training & Certification</option>
                  <option value="welfare">Welfare & Social Security</option>
                </select>
              </div>
            </div>

            {/* Recipient Scope Summary Preview */}
            <div style={{
              padding: "8px 12px", borderRadius: "6px",
              background: "rgba(59, 130, 246, 0.06)", border: "1px solid rgba(59, 130, 246, 0.15)",
              display: "flex", alignItems: "center", gap: "8px", fontSize: "0.78rem", color: "var(--color-text)"
            }}>
              <Filter size={13} color="var(--color-primary)" />
              <span>
                <strong>Target Selected:</strong> {selectedAudienceLabel} ({geographicScope === 'national' ? 'All India' : geographicScope.replace('_', ' ').toUpperCase()})
              </span>
            </div>

            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                Transmission Payload
              </label>
              <textarea
                className="form-input"
                rows={5}
                placeholder="Type the message body that will display on the recipient's mobile devices and dashboards..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
                style={{ resize: "vertical", fontFamily: "inherit" }}
              />
            </div>

            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={sending || !title.trim() || !message.trim()}
              style={{ marginTop: "var(--space-2)", display: "flex", justifyContent: "center", alignItems: "center", gap: "8px" }}
            >
              <Send size={16} /> {sending ? "Transmitting..." : "Dispatch National Broadcast"}
            </button>
          </form>
        </div>

        {/* Broadcast History */}
        <div style={{ 
          background: "var(--color-surface)", 
          borderRadius: "var(--radius-lg)", 
          border: "1px solid var(--color-border)",
          padding: "var(--space-5)",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column"
        }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Clock size={18} color="var(--color-secondary)" /> Global Transmission Logs
          </h2>

          <div style={{ flex: 1, overflowY: "auto", maxHeight: "540px", display: "flex", flexDirection: "column", gap: "12px" }} className="hide-scrollbar">
            {loading ? (
              <div style={{ textAlign: "center", padding: "var(--space-5)" }}><div className="spinner"></div></div>
            ) : broadcasts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--space-5)", color: "var(--color-text-secondary)" }}>
                <MessageSquare size={36} style={{ opacity: 0.3, margin: "0 auto var(--space-3)" }} />
                <p style={{ fontWeight: "600" }}>No global broadcasts dispatched.</p>
              </div>
            ) : (
              broadcasts.map((b) => (
                <div 
                  key={b.id || b.created_at}
                  style={{
                    padding: "14px",
                    borderRadius: "var(--radius-md)",
                    border: "1px solid var(--color-border)",
                    background: "var(--color-surface-hover)"
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "6px" }}>
                    <h4 style={{ margin: 0, fontSize: "0.95rem", fontWeight: "700", color: "var(--color-text)" }}>
                      {b.title}
                    </h4>
                    <span style={{
                      fontSize: "0.7rem",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "10px",
                      background: b.priority === 'urgent' ? 'var(--color-error-light)' : 'var(--color-primary-light)',
                      color: b.priority === 'urgent' ? 'var(--color-error)' : 'var(--color-primary)',
                      textTransform: "uppercase"
                    }}>
                      {b.priority || "Normal"}
                    </span>
                  </div>

                  <p style={{ margin: "0 0 10px 0", fontSize: "0.85rem", color: "var(--color-text-secondary)", lineHeight: "1.45" }}>
                    {b.message}
                  </p>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "0.75rem", color: "var(--color-text-muted)" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: "600" }}>
                      <Users size={12} /> {formatTargetAudience(b.target_audience)}
                    </span>
                    <span>{b.created_at ? new Date(b.created_at).toLocaleDateString() + ' ' + new Date(b.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : "Just now"}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
