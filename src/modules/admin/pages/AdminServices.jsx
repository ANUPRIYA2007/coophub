import React, { useState } from "react";
import { idGenerator } from "../../../utils/idGenerator";
import { Wrench, Plus, Search, CheckCircle, Edit, Trash2, Tag, ShieldCheck, ToggleLeft, ToggleRight, DollarSign, Save } from "lucide-react";

export default function AdminServices() {
  const [services, setServices] = useState([
    { id: "SRV-ELEC-101", service_code: "SRV-ELEC-101", name: "Ceiling Fan Installation & Repair", category: "Electrician", base_price: 350, standard_time: "45 mins", active: true, pillars_assigned: 14 },
    { id: "SRV-ELEC-102", service_code: "SRV-ELEC-102", name: "Switchboard & Wiring Troubleshooting", category: "Electrician", base_price: 450, standard_time: "60 mins", active: true, pillars_assigned: 18 },
    { id: "SRV-PLUM-201", service_code: "SRV-PLUM-201", name: "Pipe Leakage & Tap Replacement", category: "Plumber", base_price: 300, standard_time: "30 mins", active: true, pillars_assigned: 12 },
    { id: "SRV-PLUM-202", service_code: "SRV-PLUM-202", name: "Water Tank Cleaning & Motor Check", category: "Plumber", base_price: 850, standard_time: "90 mins", active: true, pillars_assigned: 9 },
    { id: "SRV-ACRP-301", service_code: "SRV-ACRP-301", name: "Air Conditioner Deep Gas Refill & Service", category: "Appliance", base_price: 1200, standard_time: "75 mins", active: true, pillars_assigned: 15 },
    { id: "SRV-APPL-302", service_code: "SRV-APPL-302", name: "Washing Machine Drum & Motor Diagnostic", category: "Appliance", base_price: 650, standard_time: "60 mins", active: true, pillars_assigned: 11 },
    { id: "SRV-CLEN-401", service_code: "SRV-CLEN-401", name: "Full Home Deep Sanitization", category: "Cleaning", base_price: 1800, standard_time: "180 mins", active: false, pillars_assigned: 6 },
  ]);

  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [showAddModal, setShowAddModal] = useState(false);
  const [newService, setNewService] = useState({ name: "", category: "Electrician", base_price: "", standard_time: "45 mins" });

  // Edit Tariff Modal State
  const [editingService, setEditingService] = useState(null);

  const toggleStatus = (id) => {
    setServices(prev => prev.map(s => s.id === id ? { ...s, active: !s.active } : s));
  };

  const handleAddService = (e) => {
    e.preventDefault();
    if (!newService.name.trim() || !newService.base_price) return;
    const realServiceCode = idGenerator.generateServiceCode(newService.category, services);
    const created = {
      id: realServiceCode,
      service_code: realServiceCode,
      name: newService.name,
      category: newService.category,
      base_price: Number(newService.base_price),
      standard_time: newService.standard_time || "45 mins",
      active: true,
      pillars_assigned: 0
    };
    setServices([created, ...services]);
    setNewService({ name: "", category: "Electrician", base_price: "", standard_time: "45 mins" });
    setShowAddModal(false);
  };

  const handleSaveEditService = (e) => {
    e.preventDefault();
    if (!editingService || !editingService.name.trim() || !editingService.base_price) return;
    setServices(prev => prev.map(s => s.id === editingService.id ? {
      ...s,
      name: editingService.name,
      category: editingService.category,
      base_price: Number(editingService.base_price),
      standard_time: editingService.standard_time
    } : s));
    setEditingService(null);
  };

  const filtered = services.filter(s => {
    const matchQ = s.name.toLowerCase().includes(searchQuery.toLowerCase()) || s.category.toLowerCase().includes(searchQuery.toLowerCase());
    const matchCat = categoryFilter === "all" || s.category.toLowerCase() === categoryFilter.toLowerCase();
    return matchQ && matchCat;
  });

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-5)" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
            Service Catalog & Rate Master
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            Define standard cooperative tariffs, qualified pillar mappings, and maintain service costs.
          </p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)} 
          className="btn btn-primary"
          style={{ display: "flex", alignItems: "center", gap: "8px" }}
        >
          <Plus size={16} /> Add New Service
        </button>
      </div>

      {/* Main Container */}
      <div style={{ 
        background: "var(--color-surface)", 
        borderRadius: "var(--radius-lg)", 
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden"
      }}>
        {/* Filter Bar */}
        <div style={{ 
          padding: "var(--space-4)", 
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-3)",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          {/* Category Tabs */}
          <div style={{ display: "flex", gap: "6px" }}>
            {["all", "Electrician", "Plumber", "Appliance", "Cleaning"].map((cat) => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  fontWeight: categoryFilter === cat ? "700" : "500",
                  background: categoryFilter === cat ? "var(--color-primary)" : "var(--color-surface-hover)",
                  color: categoryFilter === cat ? "white" : "var(--color-text)",
                  border: "none",
                  cursor: "pointer",
                  textTransform: "capitalize"
                }}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Search Box */}
          <div style={{ position: "relative", width: "260px" }}>
            <Search size={16} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            <input
              type="text"
              className="form-input"
              placeholder="Search services or code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ paddingLeft: "32px", height: "36px", fontSize: "0.85rem" }}
            />
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
            <thead>
              <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Service Name</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Category</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Standard Base Cost</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Est. Duration</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Active Technicians</th>
                <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Status</th>
                <th style={{ padding: "12px 16px", textAlign: "right", color: "var(--color-text-secondary)", fontWeight: "600" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((s) => (
                <tr key={s.id} style={{ borderBottom: "1px solid var(--color-border)" }} className="hover-row">
                  <td style={{ padding: "12px 16px", fontWeight: "700", color: "var(--color-text)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <Wrench size={16} color="var(--color-primary)" />
                      {s.name}
                    </div>
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{ 
                      padding: "3px 10px", 
                      borderRadius: "12px", 
                      fontSize: "0.75rem", 
                      fontWeight: "700",
                      background: "rgba(245, 124, 32, 0.12)",
                      color: "var(--color-secondary)"
                    }}>
                      {s.category}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: "800", color: "#FF7900" }}>
                    ₹{s.base_price.toFixed(2)}
                  </td>
                  <td style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>
                    {s.standard_time}
                  </td>
                  <td style={{ padding: "12px 16px", fontWeight: "600" }}>
                    {s.pillars_assigned} Pillars
                  </td>
                  <td style={{ padding: "12px 16px" }}>
                    <span style={{
                      padding: "3px 8px",
                      borderRadius: "10px",
                      fontSize: "0.75rem",
                      fontWeight: "700",
                      background: s.active ? "var(--color-success-light)" : "var(--color-surface-hover)",
                      color: s.active ? "var(--color-success)" : "var(--color-text-muted)"
                    }}>
                      {s.active ? "Enabled" : "Disabled"}
                    </span>
                  </td>
                  <td style={{ padding: "12px 16px", textAlign: "right" }}>
                    <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                      {/* Edit Price / Tariff Button */}
                      <button 
                        onClick={() => setEditingService({ ...s })}
                        className="btn btn-xs btn-outline"
                        style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px" }}
                        title="Edit Service Cost & Details"
                      >
                        <Edit size={13} /> Edit Cost
                      </button>

                      {/* Enable/Disable Toggle */}
                      <button 
                        onClick={() => toggleStatus(s.id)}
                        style={{ background: "transparent", border: "none", cursor: "pointer", color: s.active ? "#10B981" : "var(--color-text-muted)", display: "flex", alignItems: "center" }}
                        title="Toggle Service Availability"
                      >
                        {s.active ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── ADD NEW SERVICE MODAL ─── */}
      {showAddModal && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1100,
          padding: "var(--space-4)"
        }}>
          <div style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-lg)",
            width: "100%",
            maxWidth: "500px",
            padding: "var(--space-5)",
            boxShadow: "var(--shadow-xl)",
            border: "1px solid var(--color-border)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "800", margin: 0 }}>Add New Cooperative Service</h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "transparent", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "var(--color-text-secondary)" }}>✕</button>
            </div>

            <form onSubmit={handleAddService} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                  Service Name / Title
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. Geyser Heater Element Replacement"
                  value={newService.name}
                  onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                    Category
                  </label>
                  <select
                    className="form-input"
                    value={newService.category}
                    onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                  >
                    <option value="Electrician">Electrician</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Appliance">Appliance</option>
                    <option value="Cleaning">Cleaning</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                    Standard Base Price (₹)
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    className="form-input"
                    placeholder="e.g. 450"
                    value={newService.base_price}
                    onChange={(e) => setNewService({ ...newService, base_price: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                  Estimated Standard Duration
                </label>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. 45 mins"
                  value={newService.standard_time}
                  onChange={(e) => setNewService({ ...newService, standard_time: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
                <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── EDIT SERVICE COST & TARIFF MODAL ─── */}
      {editingService && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.6)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1100,
          padding: "var(--space-4)"
        }}>
          <div style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-lg)",
            width: "100%",
            maxWidth: "500px",
            padding: "var(--space-5)",
            boxShadow: "var(--shadow-xl)",
            border: "1px solid var(--color-border)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-4)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Edit size={18} color="#FF7900" />
                <h2 style={{ fontSize: "1.2rem", fontWeight: "800", margin: 0 }}>Edit Service Cost & Tariff</h2>
              </div>
              <button onClick={() => setEditingService(null)} style={{ background: "transparent", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "var(--color-text-secondary)" }}>✕</button>
            </div>

            <form onSubmit={handleSaveEditService} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                  Service Name / Title
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editingService.name}
                  onChange={(e) => setEditingService({ ...editingService, name: e.target.value })}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                    Category
                  </label>
                  <select
                    className="form-input"
                    value={editingService.category}
                    onChange={(e) => setEditingService({ ...editingService, category: e.target.value })}
                  >
                    <option value="Electrician">Electrician</option>
                    <option value="Plumber">Plumber</option>
                    <option value="Appliance">Appliance</option>
                    <option value="Cleaning">Cleaning</option>
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                    Standard Base Price (₹)
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    className="form-input"
                    value={editingService.base_price}
                    onChange={(e) => setEditingService({ ...editingService, base_price: e.target.value })}
                    required
                    style={{ fontWeight: "800", color: "#FF7900" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                  Estimated Standard Duration
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editingService.standard_time}
                  onChange={(e) => setEditingService({ ...editingService, standard_time: e.target.value })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingService(null)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <Save size={15} /> Save & Apply Tariff
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
