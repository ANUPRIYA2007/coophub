import React, { useState, useEffect, useMemo } from "react";
import { getAdmins, getAdminMessages, sendAdminMessage } from "../../../services/admin/governanceService";
import { MessageSquare, Send, Search, User, Shield, AlertTriangle, Clock, MapPin, Globe, Filter } from "lucide-react";
import { useTheme } from "../../../context/ThemeContext";

const ZONE_OPTIONS = [
  { code: "ALL", label: "All Zones (National)" },
  { code: "SZ", label: "South Zone (SZ)", states: ["TN", "KL", "KA", "AP", "TS"], uts: ["PY", "LD", "AN"] },
  { code: "NZ", label: "North Zone (NZ)", states: ["HR", "HP", "PB", "RJ", "UK", "UP"], uts: ["DL", "JK", "LA", "CH"] },
  { code: "WZ", label: "West Zone (WZ)", states: ["GA", "GJ", "MH"], uts: ["DD"] },
  { code: "EZ", label: "East Zone (EZ)", states: ["WB", "BR", "JH", "OD", "AS", "AR", "MN", "ML", "MZ", "NL", "SK", "TR"], uts: [] }
];

const STATE_NAMES = {
  TN: "Tamil Nadu", KL: "Kerala", KA: "Karnataka", AP: "Andhra Pradesh", TS: "Telangana",
  PY: "Puducherry", LD: "Lakshadweep", AN: "Andaman & Nicobar",
  HR: "Haryana", HP: "Himachal Pradesh", PB: "Punjab", RJ: "Rajasthan", UK: "Uttarakhand", UP: "Uttar Pradesh",
  DL: "Delhi", JK: "Jammu & Kashmir", LA: "Ladakh", CH: "Chandigarh",
  GA: "Goa", GJ: "Gujarat", MH: "Maharashtra", DD: "Dadra & Nagar Haveli and Daman & Diu",
  WB: "West Bengal", BR: "Bihar", JH: "Jharkhand", OD: "Odisha", AS: "Assam", AR: "Arunachal Pradesh",
  MN: "Manipur", ML: "Meghalaya", MZ: "Mizoram", NL: "Nagaland", SK: "Sikkim", TR: "Tripura"
};

export default function SuperAdminCommunication() {
  const { isDark } = useTheme();
  const [admins, setAdmins] = useState([]);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [selectedAdmin, setSelectedAdmin] = useState(null);
  const [messageInput, setMessageInput] = useState("");
  const [sending, setSending] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Geographic Filters
  const [selectedZone, setSelectedZone] = useState("ALL");
  const [selectedState, setSelectedState] = useState("ALL");
  const [selectedScopeType, setSelectedScopeType] = useState("ALL"); // 'ALL' | 'ZONE' | 'STATE' | 'UNION_TERRITORY'

  const CURRENT_ADMIN_ID = "00000000-0000-0000-0000-000000000001"; // Simulated SA ID for testing if no auth context

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // 1. Fetch Admin Directory
      const adminRes = await getAdmins({ limit: 100 });
      const adminList = adminRes.admins || adminRes.data || [];
      setAdmins(adminList);
      
      // 2. Fetch all messages
      const msgRes = await getAdminMessages();
      setMessages(msgRes.messages || []);

      if (adminList.length > 0 && !selectedAdmin) {
        setSelectedAdmin(adminList[0]);
      }
    } catch (err) {
      console.error("Failed to load communications:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!selectedAdmin || !messageInput.trim()) return;

    setSending(true);
    try {
      const res = await sendAdminMessage(selectedAdmin.id, messageInput);
      if (res.data) {
        setMessages([res.data, ...messages]);
      }
      setMessageInput("");
    } catch (err) {
      alert("Failed to send message: " + err.message);
    } finally {
      setSending(false);
    }
  };

  // Helper to determine administrator zone code
  const getAdminZone = (admin) => {
    if (admin.role === 'SUPER_ADMIN') return 'GLOBAL';
    const scopeCodes = (admin.scopes || []).map(s => s.entity_code?.toUpperCase());
    
    if (scopeCodes.includes('SZ') || admin.full_name?.toLowerCase().includes('south') || admin.email?.includes('south') || admin.admin_code?.includes('CHE')) return 'SZ';
    if (scopeCodes.includes('NZ') || admin.full_name?.toLowerCase().includes('north') || admin.email?.includes('north') || admin.admin_code?.includes('DEL')) return 'NZ';
    if (scopeCodes.includes('WZ') || admin.full_name?.toLowerCase().includes('west') || admin.email?.includes('west') || admin.admin_code?.includes('MUM')) return 'WZ';
    if (scopeCodes.includes('EZ') || admin.full_name?.toLowerCase().includes('east') || admin.email?.includes('east') || admin.admin_code?.includes('KOL')) return 'EZ';

    return 'UNASSIGNED';
  };

  // Available States / UTs based on selected zone
  const availableStates = useMemo(() => {
    if (selectedZone === 'ALL') {
      return Object.entries(STATE_NAMES).map(([code, name]) => ({ code, name }));
    }
    const zoneObj = ZONE_OPTIONS.find(z => z.code === selectedZone);
    if (!zoneObj) return [];
    const codes = [...(zoneObj.states || []), ...(zoneObj.uts || [])];
    return codes.map(code => ({ code, name: STATE_NAMES[code] || code }));
  }, [selectedZone]);

  // Filtered Admins with Geographic options
  const filteredAdmins = admins.filter(admin => {
    const matchesSearch = 
      admin.full_name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      admin.admin_code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      admin.role.toLowerCase().includes(searchTerm.toLowerCase());

    if (!matchesSearch) return false;

    const adminZone = getAdminZone(admin);

    if (selectedZone !== "ALL") {
      if (admin.role !== "SUPER_ADMIN" && adminZone !== selectedZone) {
        return false;
      }
    }

    if (selectedScopeType !== "ALL") {
      const hasLevel = (admin.scopes || []).some(s => s.level === selectedScopeType);
      if (selectedScopeType === "ZONE" && admin.role === "ZONE_ADMIN") return true;
      if (!hasLevel && admin.role !== "SUPER_ADMIN") return false;
    }

    if (selectedState !== "ALL") {
      const hasState = (admin.scopes || []).some(s => s.entity_code === selectedState);
      if (!hasState && admin.role !== "SUPER_ADMIN") return false;
    }

    return true;
  });

  // Group messages for selected admin
  const conversation = messages.filter(m => 
    (m.receiver_id === selectedAdmin?.id) || 
    (m.sender_id === selectedAdmin?.id)
  ).sort((a, b) => new Date(a.created_at) - new Date(b.created_at));

  const selectedAdminZone = selectedAdmin ? getAdminZone(selectedAdmin) : "";
  const selectedAdminZoneLabel = ZONE_OPTIONS.find(z => z.code === selectedAdminZone)?.label || (selectedAdmin?.role === 'SUPER_ADMIN' ? 'All-India Sovereign Command' : 'Regional');

  return (
    <div className="fade-in" style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
      {/* Header */}
      <div style={{ marginBottom: "var(--space-4)" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
          Direct Communication & Dispatch
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Secure, direct inter-administrator communication for coordinate operations across the cooperative network.
        </p>
      </div>

      <div style={{ display: "flex", flex: 1, gap: "var(--space-4)", overflow: "hidden" }}>
        
        {/* Left Pane: Admin Directory with Geographic Filters */}
        <div style={{ 
          width: "380px",
          background: "var(--color-surface)", 
          borderRadius: "var(--radius-lg)", 
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          {/* Header & Search */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid var(--color-border)" }}>
            <h2 style={{ fontSize: "0.95rem", fontWeight: "700", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>
              <Shield size={16} color="var(--color-primary)" /> Administrator Directory
            </h2>

            {/* Search Box */}
            <div style={{ position: "relative", marginBottom: "10px" }}>
              <input
                type="text"
                placeholder="Search by name, ID, role..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="form-input"
                style={{ paddingLeft: "32px", fontSize: "0.82rem", width: "100%" }}
              />
              <Search size={14} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            </div>

            {/* Geographic Filter 1: Zone Selector */}
            <div style={{ marginBottom: "8px" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", fontWeight: "700", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                <Globe size={11} /> FILTER BY ZONE
              </label>
              <select
                value={selectedZone}
                onChange={(e) => {
                  setSelectedZone(e.target.value);
                  setSelectedState("ALL");
                }}
                className="form-input"
                style={{ fontSize: "0.8rem", padding: "6px 8px", width: "100%" }}
              >
                {ZONE_OPTIONS.map(z => (
                  <option key={z.code} value={z.code}>{z.label}</option>
                ))}
              </select>
            </div>

            {/* Geographic Filter 2: State / UT Selector */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", fontWeight: "700", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                  <MapPin size={11} /> STATE / UT
                </label>
                <select
                  value={selectedState}
                  onChange={(e) => setSelectedState(e.target.value)}
                  className="form-input"
                  style={{ fontSize: "0.78rem", padding: "6px 6px", width: "100%" }}
                >
                  <option value="ALL">All States/UTs</option>
                  {availableStates.map(st => (
                    <option key={st.code} value={st.code}>{st.name} ({st.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", fontWeight: "700", color: "var(--color-text-secondary)", marginBottom: "4px" }}>
                  <Filter size={11} /> SCOPE TIER
                </label>
                <select
                  value={selectedScopeType}
                  onChange={(e) => setSelectedScopeType(e.target.value)}
                  className="form-input"
                  style={{ fontSize: "0.78rem", padding: "6px 6px", width: "100%" }}
                >
                  <option value="ALL">All Tiers</option>
                  <option value="ZONE">Zonal Admins</option>
                  <option value="STATE">State Level</option>
                  <option value="UNION_TERRITORY">Union Territory</option>
                </select>
              </div>
            </div>
          </div>

          {/* Quick Zone Filter Pills */}
          <div style={{ display: "flex", gap: "4px", padding: "6px 12px", background: "var(--bg-color)", borderBottom: "1px solid var(--color-border)", overflowX: "auto" }}>
            {["ALL", "SZ", "NZ", "WZ", "EZ"].map(code => (
              <button
                key={code}
                onClick={() => {
                  setSelectedZone(code);
                  setSelectedState("ALL");
                }}
                style={{
                  padding: "2px 8px",
                  borderRadius: "10px",
                  fontSize: "0.7rem",
                  fontWeight: "700",
                  border: "none",
                  cursor: "pointer",
                  background: selectedZone === code ? "var(--color-primary)" : "transparent",
                  color: selectedZone === code ? "#050A12" : "var(--color-text-secondary)"
                }}
              >
                {code}
              </button>
            ))}
          </div>

          {/* Directory List */}
          <div style={{ flex: 1, overflowY: "auto" }} className="hide-scrollbar">
            {loading ? (
              <div style={{ textAlign: "center", padding: "var(--space-4)" }}><div className="spinner"></div></div>
            ) : filteredAdmins.length === 0 ? (
              <div style={{ textAlign: "center", padding: "var(--space-4)", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                No administrators found matching criteria
              </div>
            ) : (
              filteredAdmins.map((admin) => {
                const zoneCode = getAdminZone(admin);
                const isSelected = selectedAdmin?.id === admin.id;

                return (
                  <div 
                    key={admin.id}
                    onClick={() => setSelectedAdmin(admin)}
                    style={{
                      padding: "12px 14px",
                      borderBottom: "1px solid var(--color-border)",
                      cursor: "pointer",
                      background: isSelected ? "var(--color-primary-light)" : "transparent",
                      borderLeft: isSelected ? "3px solid var(--color-primary)" : "3px solid transparent",
                      transition: "background 0.2s"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "4px" }}>
                      <h4 style={{ margin: 0, fontSize: "0.88rem", fontWeight: "700", color: "var(--color-text)" }}>
                        {admin.full_name}
                      </h4>
                      <span style={{ fontSize: "0.68rem", padding: "2px 6px", borderRadius: "8px", background: "var(--color-surface-hover)", color: "var(--color-text-secondary)", fontWeight: "600" }}>
                        {admin.admin_code}
                      </span>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "4px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.72rem", color: "var(--color-text-muted)" }}>
                        <Shield size={11} /> {admin.role.replace('_', ' ')}
                      </div>

                      {/* Geographic Badge */}
                      <span style={{
                        fontSize: "0.68rem",
                        fontWeight: "800",
                        padding: "1px 6px",
                        borderRadius: "4px",
                        background: zoneCode === "SZ" ? "rgba(59, 130, 246, 0.15)" : zoneCode === "NZ" ? "rgba(16, 185, 129, 0.15)" : zoneCode === "WZ" ? "rgba(245, 158, 11, 0.15)" : zoneCode === "EZ" ? "rgba(139, 92, 246, 0.15)" : "rgba(255, 121, 0, 0.15)",
                        color: zoneCode === "SZ" ? "#3B82F6" : zoneCode === "NZ" ? "#10B981" : zoneCode === "WZ" ? "#F59E0B" : zoneCode === "EZ" ? "#8B5CF6" : "#FF7900"
                      }}>
                        {zoneCode === "GLOBAL" ? "National Apex" : zoneCode}
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Chat Thread */}
        <div style={{ 
          flex: 1,
          background: "var(--color-surface)", 
          borderRadius: "var(--radius-lg)", 
          border: "1px solid var(--color-border)",
          boxShadow: "var(--shadow-sm)",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden"
        }}>
          {!selectedAdmin ? (
            <div style={{ flex: 1, display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", color: "var(--color-text-muted)" }}>
              <MessageSquare size={48} style={{ opacity: 0.2, marginBottom: "var(--space-3)" }} />
              <p style={{ fontWeight: "600" }}>Select an administrator from the directory to start communication</p>
            </div>
          ) : (
            <>
              {/* Chat Header with Full Geographic Context */}
              <div style={{ padding: "14px 20px", borderBottom: "1px solid var(--color-border)", background: "var(--color-surface)", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800", color: "var(--color-text)" }}>
                      {selectedAdmin.full_name}
                    </h3>
                    <span style={{ 
                      fontSize: "0.7rem", 
                      padding: "2px 8px", 
                      borderRadius: "10px", 
                      background: "rgba(255, 121, 0, 0.12)", 
                      color: "#FF7900", 
                      fontWeight: "800" 
                    }}>
                      {selectedAdmin.admin_code}
                    </span>
                  </div>

                  <div style={{ fontSize: "0.78rem", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "8px", marginTop: "4px", flexWrap: "wrap" }}>
                    <span>{selectedAdmin.role.replace('_', ' ')}</span> &bull; 
                    <span style={{ color: "#3B82F6", fontWeight: "700" }}>
                      📍 {selectedAdminZoneLabel}
                    </span> &bull; 
                    <span style={{ color: selectedAdmin.status === 'active' ? "var(--color-success)" : "var(--color-error)" }}>
                      {selectedAdmin.status === 'active' ? '● Online/Active' : '○ Offline'}
                    </span>
                  </div>
                </div>

                <div style={{ textAlign: "right" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", display: "block" }}>
                    Jurisdiction Clearance
                  </span>
                  <strong style={{ fontSize: "0.82rem", color: "var(--color-text)" }}>
                    {selectedAdmin.role === 'SUPER_ADMIN' ? 'Level 5 (Sovereign Apex)' : 'Level 4 (Zonal Command)'}
                  </strong>
                </div>
              </div>

              {/* Chat Thread */}
              <div style={{ flex: 1, padding: "20px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "14px", background: "var(--bg-color)" }} className="hide-scrollbar">
                {conversation.length === 0 ? (
                  <div style={{ textAlign: "center", margin: "auto", color: "var(--color-text-muted)", fontSize: "0.85rem" }}>
                    No messages yet with {selectedAdmin.full_name}. Send an administrative dispatch to start the conversation.
                  </div>
                ) : (
                  conversation.map((msg) => {
                    const isActuallyMe = msg.sender_id !== selectedAdmin.id; 
                    
                    return (
                      <div key={msg.id || msg.created_at} style={{
                        display: "flex",
                        justifyContent: isActuallyMe ? "flex-end" : "flex-start",
                        alignItems: "flex-end",
                        gap: "8px"
                      }}>
                        <div style={{
                          maxWidth: "70%",
                          padding: "10px 14px",
                          borderRadius: "12px",
                          background: isActuallyMe ? "var(--color-primary)" : "var(--color-surface)",
                          color: isActuallyMe ? "#050A12" : "var(--color-text)",
                          border: isActuallyMe ? "none" : "1px solid var(--color-border)",
                          boxShadow: "var(--shadow-sm)"
                        }}>
                          <div style={{ fontSize: "0.88rem", lineHeight: "1.4", wordBreak: "break-word" }}>
                            {msg.message || msg.content}
                          </div>
                          <div style={{ fontSize: "0.68rem", color: isActuallyMe ? "rgba(0,0,0,0.6)" : "var(--color-text-muted)", textAlign: "right", marginTop: "4px" }}>
                            {msg.created_at ? new Date(msg.created_at).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) : ""}
                          </div>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Message Input Box */}
              <form onSubmit={handleSendMessage} style={{ padding: "14px 20px", borderTop: "1px solid var(--color-border)", display: "flex", gap: "10px", background: "var(--color-surface)" }}>
                <input
                  type="text"
                  placeholder={`Message ${selectedAdmin.full_name} (${selectedAdminZoneLabel})...`}
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  className="form-input"
                  style={{ flex: 1, fontSize: "0.88rem" }}
                />
                <button
                  type="submit"
                  disabled={sending || !messageInput.trim()}
                  className="btn btn-primary"
                  style={{ display: "flex", alignItems: "center", gap: "6px", padding: "0 18px", background: "#FF7900", border: "none", color: "#050A12", fontWeight: "800" }}
                >
                  <Send size={15} /> {sending ? "Sending..." : "Send"}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
