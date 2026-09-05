import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import { MessageSquare, Send, Bell, CheckCircle, AlertTriangle, Info, Users, Clock } from "lucide-react";

export default function AdminMessages() {
  const [broadcasts, setBroadcasts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [category, setCategory] = useState("general");
  const [priority, setPriority] = useState("normal");
  const [targetAudience, setTargetAudience] = useState("all_pillars");
  const [successMsg, setSuccessMsg] = useState(false);

  useEffect(() => {
    fetchBroadcasts();
  }, []);

  const fetchBroadcasts = async () => {
    setLoading(true);
    const data = await adminService.getBroadcastMessages();
    setBroadcasts(data);
    setLoading(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) return;

    setSending(true);
    const res = await adminService.sendBroadcastMessage({
      title,
      message,
      category,
      priority,
      target_audience: targetAudience
    });

    if (res.success) {
      setBroadcasts([res.data, ...broadcasts]);
      setTitle("");
      setMessage("");
      setSuccessMsg(true);
      setTimeout(() => setSuccessMsg(false), 4000);
    } else {
      alert("Failed to send broadcast: " + res.error);
    }
    setSending(false);
  };

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: "var(--space-5)" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
          Broadcast & System Messages
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Send direct announcements, critical emergency alerts, and job notices across the cooperative network.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "var(--space-5)" }}>
        
        {/* Broadcast Composer */}
        <div style={{ 
          background: "var(--color-surface)", 
          borderRadius: "var(--radius-lg)", 
          border: "1px solid var(--color-border)",
          padding: "var(--space-5)",
          boxShadow: "var(--shadow-sm)"
        }}>
          <h2 style={{ fontSize: "1.15rem", fontWeight: "700", marginBottom: "var(--space-4)", display: "flex", alignItems: "center", gap: "8px" }}>
            <Send size={18} color="var(--color-primary)" /> Compose New Broadcast
          </h2>

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
              <CheckCircle size={16} /> Broadcast sent successfully to all selected recipients!
            </div>
          )}

          <form onSubmit={handleSend} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                Broadcast Title / Headline
              </label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Surge Pricing Alert in Guindy Hub (₹150 Extra)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                  Category
                </label>
                <select className="form-input" value={category} onChange={(e) => setCategory(e.target.value)}>
                  <option value="general">General Notice</option>
                  <option value="surge">Surge & Incentive</option>
                  <option value="emergency">Emergency / Weather</option>
                  <option value="payout">Payout Update</option>
                </select>
              </div>

              <div>
                <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                  Priority
                </label>
                <select className="form-input" value={priority} onChange={(e) => setPriority(e.target.value)}>
                  <option value="normal">Normal</option>
                  <option value="high">High Priority</option>
                  <option value="urgent">Urgent / Alert</option>
                </select>
              </div>
            </div>

            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                Target Recipients
              </label>
              <select className="form-input" value={targetAudience} onChange={(e) => setTargetAudience(e.target.value)}>
                <optgroup label="General Workforce">
                  <option value="all_pillars">👥 All Registered Pillars (Cooperative Wide)</option>
                </optgroup>
                <optgroup label="Technical & Repair Services">
                  <option value="electrician">⚡ Electricians & Electrical Repair</option>
                  <option value="plumber">🚰 Plumbers & Sanitary Pipe Fitting</option>
                  <option value="ac_technician">❄️ AC Repair & HVAC Maintenance</option>
                  <option value="appliance_repair">🧺 Home Appliance Repair</option>
                  <option value="carpenter">🪚 Carpenters & Woodwork</option>
                  <option value="painter">🎨 Professional Painters</option>
                  <option value="cctv_technician">📹 CCTV & Electronics Technicians</option>
                </optgroup>
                <optgroup label="Home Cleaning, Domestic & Care">
                  <option value="home_cleaning">✨ Deep Home Cleaning & Sanitation</option>
                  <option value="domestic_helpers">🍲 Domestic Helpers & Housekeeping</option>
                  <option value="caregiver_services">🩺 Caregivers & Home Nursing</option>
                  <option value="gardening_landscaping">🌿 Gardening & Landscaping</option>
                  <option value="pest_control">🐜 Pest Control & Fumigation</option>
                  <option value="masonry_civil">🧱 Masonry & Civil Works</option>
                </optgroup>
                <optgroup label="Transport & Rapid Response">
                  <option value="driver_services">🚗 Professional Drivers</option>
                  <option value="emergency_services">🚨 Emergency Response Squad</option>
                  <option value="on_demand_services">⚡ On-Demand Priority Squad</option>
                </optgroup>
              </select>
            </div>

            <div>
              <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                Message Content
              </label>
              <textarea
                className="form-input"
                rows={4}
                placeholder="Type the message body that will display on the Pillar mobile devices and notifications..."
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
              <Send size={16} /> {sending ? "Broadcasting..." : "Send Live Broadcast"}
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
            <Clock size={18} color="var(--color-secondary)" /> Broadcast History & Logs
          </h2>

          <div style={{ flex: 1, overflowY: "auto", maxHeight: "420px", display: "flex", flexDirection: "column", gap: "12px" }} className="hide-scrollbar">
            {loading ? (
              <div style={{ textAlign: "center", padding: "var(--space-5)" }}><div className="spinner"></div></div>
            ) : broadcasts.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--space-5)", color: "var(--color-text-secondary)" }}>
                <MessageSquare size={36} style={{ opacity: 0.3, margin: "0 auto var(--space-3)" }} />
                <p style={{ fontWeight: "600" }}>No broadcast messages sent yet.</p>
                <span style={{ fontSize: "0.85rem" }}>Messages sent from the composer will be archived here.</span>
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
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <Users size={12} /> {b.target_audience?.replace("_", " ") || "All Pillars"}
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
