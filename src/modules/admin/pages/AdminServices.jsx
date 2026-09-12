import React, { useState, useEffect, useMemo } from "react";
import { adminService } from "../services/adminService";
import { idGenerator } from "../../../utils/idGenerator";
import { 
  Wrench, Plus, Search, CheckCircle, Edit, Trash2, Tag, ShieldCheck, 
  ToggleLeft, ToggleRight, DollarSign, Save, ChevronDown, ChevronRight, 
  ChevronUp, Layers, Zap, Wind, Hammer, Paintbrush, Sparkles, Car, 
  HeartHandshake, Trees, Cpu, AlertCircle, Clock, Scissors, GraduationCap, 
  Check, RefreshCw
} from "lucide-react";

export default function AdminServices() {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  
  // Expanded service accordion tracking
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [allExpanded, setAllExpanded] = useState(false);

  // Modals state
  const [showAddModal, setShowAddModal] = useState(false);
  const [addMode, setAddMode] = useState("service"); // 'service' | 'sub_service'
  const [parentServiceIdForSub, setParentServiceIdForSub] = useState("");
  
  const [newService, setNewService] = useState({ 
    name: "", 
    category: "Electrical", 
    base_price: "", 
    standard_time: "45 mins",
    description: ""
  });

  const [newSubService, setNewSubService] = useState({
    parent_service_id: "",
    name: "",
    base_price: "",
    standard_time: "45 mins",
    description: ""
  });

  // Edit Tariff Modal State (can be a main service or sub-service)
  const [editingItem, setEditingItem] = useState(null); // { type: 'service' | 'sub_service', data: ... }
  const [saveSuccessNotice, setSaveSuccessNotice] = useState("");

  // Load live catalog on mount
  useEffect(() => {
    fetchServicesCatalog();
  }, []);

  const fetchServicesCatalog = async () => {
    setLoading(true);
    try {
      const data = await adminService.getServices();
      setServices(data || []);
    } catch (err) {
      console.error("Failed to load services:", err);
    } finally {
      setLoading(false);
    }
  };

  // Helper for dynamic category icons
  const getCategoryIcon = (category = "", serviceName = "") => {
    const c = category.toLowerCase();
    const n = serviceName.toLowerCase();
    if (c.includes("elect") || n.includes("elect")) return <Zap size={16} color="#F59E0B" />;
    if (c.includes("plumb") || n.includes("plumb")) return <Wrench size={16} color="#3B82F6" />;
    if (c.includes("ac") || c.includes("cool") || c.includes("hvac")) return <Wind size={16} color="#06B6D4" />;
    if (c.includes("carp") || n.includes("carp") || n.includes("wood")) return <Hammer size={16} color="#8B5CF6" />;
    if (c.includes("paint") || n.includes("paint")) return <Paintbrush size={16} color="#EC4899" />;
    if (c.includes("clean") || n.includes("clean")) return <Sparkles size={16} color="#10B981" />;
    if (c.includes("trans") || c.includes("driver") || n.includes("driver")) return <Car size={16} color="#6366F1" />;
    if (c.includes("care") || c.includes("health") || n.includes("care")) return <HeartHandshake size={16} color="#EF4444" />;
    if (c.includes("out") || c.includes("garden") || n.includes("garden")) return <Trees size={16} color="#10B981" />;
    if (c.includes("tech") || c.includes("appl") || n.includes("techn")) return <Cpu size={16} color="#8B5CF6" />;
    if (c.includes("emerg") || n.includes("emerg")) return <AlertCircle size={16} color="#EF4444" />;
    if (c.includes("demand") || n.includes("demand")) return <Clock size={16} color="#F59E0B" />;
    if (c.includes("trade") || c.includes("custom") || n.includes("trade")) return <Scissors size={16} color="#64748B" />;
    if (c.includes("train") || n.includes("train")) return <GraduationCap size={16} color="#3B82F6" />;
    if (c.includes("coop") || n.includes("worker")) return <ShieldCheck size={16} color="#10B981" />;
    return <Wrench size={16} color="var(--color-primary)" />;
  };

  // Toggle Accordion row
  const toggleExpand = (serviceId) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(serviceId)) {
        next.delete(serviceId);
      } else {
        next.add(serviceId);
      }
      return next;
    });
  };

  // Expand / Collapse all services
  const toggleExpandAll = () => {
    if (allExpanded) {
      setExpandedIds(new Set());
      setAllExpanded(false);
    } else {
      const allIds = new Set(services.map(s => s.id));
      setExpandedIds(allIds);
      setAllExpanded(true);
    }
  };

  // Toggle active status for Main Service
  const handleToggleServiceStatus = async (serviceId, currentStatus) => {
    setServices(prev => prev.map(s => s.id === serviceId ? { ...s, active: !currentStatus } : s));
    await adminService.toggleServiceStatus(serviceId, currentStatus);
  };

  // Toggle active status for Sub-Service
  const handleToggleSubServiceStatus = async (serviceId, subServiceId, currentStatus) => {
    setServices(prev => prev.map(s => {
      if (s.id === serviceId) {
        return {
          ...s,
          subServices: (s.subServices || []).map(sub => sub.id === subServiceId ? { ...sub, active: !currentStatus } : sub)
        };
      }
      return s;
    }));
    await adminService.toggleSubServiceStatus(subServiceId, currentStatus);
  };

  // Handle Save Edited Tariff / Details
  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingItem) return;

    const { type, data } = editingItem;
    const basePriceNum = Number(data.base_price);

    if (type === "service") {
      setServices(prev => prev.map(s => s.id === data.id ? {
        ...s,
        name: data.name,
        category: data.category,
        base_price: basePriceNum,
        standard_time: data.standard_time,
        description: data.description
      } : s));

      await adminService.updateServiceTariff(data.id, {
        name: data.name,
        category: data.category,
        base_price: basePriceNum,
        standard_time: data.standard_time,
        description: data.description
      });
      setSaveSuccessNotice(`Main Service tariff "${data.name}" updated successfully!`);
    } else if (type === "sub_service") {
      setServices(prev => prev.map(s => {
        if (s.id === data.service_id) {
          return {
            ...s,
            subServices: (s.subServices || []).map(sub => sub.id === data.id ? {
              ...sub,
              name: data.name,
              base_price: basePriceNum,
              standard_time: data.standard_time,
              description: data.description
            } : sub)
          };
        }
        return s;
      }));

      await adminService.updateSubServiceTariff(data.id, {
        name: data.name,
        base_price: basePriceNum,
        standard_time: data.standard_time,
        description: data.description
      });
      setSaveSuccessNotice(`Sub-Service tariff "${data.name}" updated successfully!`);
    }

    setEditingItem(null);
    setTimeout(() => setSaveSuccessNotice(""), 4000);
  };

  // Handle Add New Main Service
  const handleAddService = async (e) => {
    e.preventDefault();
    if (!newService.name.trim() || !newService.base_price) return;
    const realServiceCode = idGenerator.generateServiceCode ? idGenerator.generateServiceCode(newService.category, services) : `SRV-CUST-${Date.now().toString().slice(-4)}`;
    const created = {
      id: `srv-${Date.now()}`,
      service_code: realServiceCode,
      name: newService.name,
      category: newService.category,
      base_price: Number(newService.base_price),
      standard_time: newService.standard_time || "45 mins",
      description: newService.description || "Custom cooperative service offering.",
      active: true,
      pillars_assigned: 1,
      sub_services_count: 0,
      subServices: []
    };

    setServices([created, ...services]);
    await adminService.addService(created);
    setNewService({ name: "", category: "Electrical", base_price: "", standard_time: "45 mins", description: "" });
    setShowAddModal(false);
    setSaveSuccessNotice(`New Service "${created.name}" created!`);
    setTimeout(() => setSaveSuccessNotice(""), 4000);
  };

  // Handle Add Sub-Service under an existing service
  const handleAddSubService = async (e) => {
    e.preventDefault();
    const parentId = newSubService.parent_service_id || parentServiceIdForSub;
    if (!parentId || !newSubService.name.trim() || !newSubService.base_price) return;

    const parent = services.find(s => s.id === parentId);
    const subCode = `SUB-${(parent?.service_code || 'GEN').replace('SRV-', '').split('-')[0]}-${String((parent?.subServices?.length || 0) + 1).padStart(2, '0')}`;

    const createdSub = {
      id: `sub-${Date.now()}`,
      sub_service_code: subCode,
      service_id: parentId,
      service_name: parent?.name || "General",
      category: parent?.category || "General",
      name: newSubService.name,
      description: newSubService.description || "Cooperative specialized sub-service.",
      base_price: Number(newSubService.base_price),
      standard_time: newSubService.standard_time || "45 mins",
      active: true,
      pillars_assigned: parent?.pillars_assigned || 1,
      specialist: {
        pillar_code: `PIL-CHE-${Math.floor(100 + Math.random() * 80)}`,
        name: "Cooperative Certified Specialist",
        area: "Chennai Central",
        rating: 4.9,
        role: `${newSubService.name} Specialist`
      }
    };

    setServices(prev => prev.map(s => {
      if (s.id === parentId) {
        return {
          ...s,
          sub_services_count: (s.subServices || []).length + 1,
          subServices: [...(s.subServices || []), createdSub]
        };
      }
      return s;
    }));

    // Auto expand parent so the new sub-service is visible
    setExpandedIds(prev => new Set([...prev, parentId]));

    await adminService.addSubService(parentId, createdSub);
    setNewSubService({ parent_service_id: "", name: "", base_price: "", standard_time: "45 mins", description: "" });
    setShowAddModal(false);
    setSaveSuccessNotice(`New Sub-Service "${createdSub.name}" added under ${parent?.name}!`);
    setTimeout(() => setSaveSuccessNotice(""), 4000);
  };

  // Dynamic Categories extracted from the full catalog
  const categories = useMemo(() => {
    const set = new Set();
    services.forEach(s => {
      if (s.category) set.add(s.category);
    });
    return ["all", ...Array.from(set)];
  }, [services]);

  // Comprehensive Search & Category Filtering
  const filteredServices = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();

    return services.filter(srv => {
      // Category filter check
      const matchCat = categoryFilter === "all" || srv.category.toLowerCase() === categoryFilter.toLowerCase();
      if (!matchCat) return false;

      // If no search query, keep it
      if (!query) return true;

      // Check if main service matches
      const mainMatch = 
        srv.name.toLowerCase().includes(query) ||
        srv.category.toLowerCase().includes(query) ||
        (srv.service_code && srv.service_code.toLowerCase().includes(query)) ||
        (srv.description && srv.description.toLowerCase().includes(query));

      if (mainMatch) return true;

      // Check if any child sub-service matches
      const subMatch = (srv.subServices || []).some(sub => 
        sub.name.toLowerCase().includes(query) ||
        (sub.description && sub.description.toLowerCase().includes(query)) ||
        (sub.sub_service_code && sub.sub_service_code.toLowerCase().includes(query)) ||
        (sub.specialist?.name && sub.specialist.name.toLowerCase().includes(query))
      );

      return subMatch;
    });
  }, [services, searchQuery, categoryFilter]);

  // Auto-expand services if a search query matches sub-services
  useEffect(() => {
    if (searchQuery.trim().length > 1) {
      const matchingIds = new Set();
      filteredServices.forEach(s => {
        const subMatch = (s.subServices || []).some(sub => 
          sub.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          (sub.description && sub.description.toLowerCase().includes(searchQuery.toLowerCase()))
        );
        if (subMatch) matchingIds.add(s.id);
      });
      if (matchingIds.size > 0) {
        setExpandedIds(prev => new Set([...prev, ...matchingIds]));
      }
    }
  }, [searchQuery, filteredServices]);

  // Calculate high-level summary metrics
  const totalSubServicesCount = useMemo(() => {
    return services.reduce((acc, s) => acc + (s.subServices?.length || 0), 0);
  }, [services]);

  return (
    <div className="fade-in" style={{ paddingBottom: "var(--space-6)" }}>
      {/* Toast Notice */}
      {saveSuccessNotice && (
        <div style={{
          position: "fixed",
          bottom: "24px",
          right: "24px",
          zIndex: 1200,
          background: "var(--color-surface)",
          border: "1px solid var(--color-success)",
          boxShadow: "var(--shadow-lg)",
          borderRadius: "var(--radius-md)",
          padding: "12px 18px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          color: "var(--color-text)",
          fontWeight: "600",
          fontSize: "0.9rem"
        }}>
          <CheckCircle size={18} color="var(--color-success)" />
          {saveSuccessNotice}
        </div>
      )}

      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-4)", flexWrap: "wrap", gap: "var(--space-3)" }}>
        <div>
          <h1 style={{ fontSize: "1.55rem", fontWeight: "800", color: "var(--color-text)", marginBottom: "var(--space-1)", display: "flex", alignItems: "center", gap: "10px" }}>
            <span>Service Catalog & Rate Master</span>
            <span style={{ fontSize: "0.75rem", padding: "3px 8px", borderRadius: "12px", background: "rgba(245, 124, 32, 0.12)", color: "#FF7900", fontWeight: "700" }}>
              Cooperative Regulated
            </span>
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.9rem", margin: 0 }}>
            Define standard cooperative tariffs, qualified pillar mappings, and maintain master service costs across all 16 categories and 80 specialized sub-services.
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button 
            onClick={fetchServicesCatalog} 
            className="btn btn-outline"
            style={{ display: "flex", alignItems: "center", gap: "6px" }}
            title="Reload live services from database"
          >
            <RefreshCw size={15} /> Refresh
          </button>
          <button 
            onClick={() => {
              setAddMode("service");
              setShowAddModal(true);
            }} 
            className="btn btn-primary"
            style={{ display: "flex", alignItems: "center", gap: "8px" }}
          >
            <Plus size={16} /> Add New Service
          </button>
        </div>
      </div>

      {/* Metrics Summary Strip */}
      <div style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
        gap: "var(--space-3)",
        marginBottom: "var(--space-4)"
      }}>
        <div style={{ background: "var(--color-surface)", padding: "14px 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>MAIN CATEGORIES</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)", marginTop: "4px" }}>
            {services.length} Services
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>100% Active in Chennai</div>
        </div>

        <div style={{ background: "var(--color-surface)", padding: "14px 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>SPECIALIZED SUB-SERVICES</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#FF7900", marginTop: "4px" }}>
            {totalSubServicesCount} Sub-Services
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>5 per main service category</div>
        </div>

        <div style={{ background: "var(--color-surface)", padding: "14px 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>QUALIFIED PILLARS</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-success)", marginTop: "4px" }}>
            80 Specialists
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>1 dedicated pillar per sub-service</div>
        </div>

        <div style={{ background: "var(--color-surface)", padding: "14px 18px", borderRadius: "var(--radius-md)", border: "1px solid var(--color-border)" }}>
          <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>TARIFF STABILITY</div>
          <div style={{ fontSize: "1.5rem", fontWeight: "800", color: "#3B82F6", marginTop: "4px" }}>
            ₹249 – ₹1,999
          </div>
          <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", marginTop: "2px" }}>Regulated cooperative ceilings</div>
        </div>
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
          padding: "var(--space-3) var(--space-4)", 
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          flexWrap: "wrap",
          gap: "var(--space-3)",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          {/* Category Tabs with horizontal scroll */}
          <div style={{ 
            display: "flex", 
            gap: "6px", 
            overflowX: "auto", 
            paddingBottom: "4px",
            maxWidth: "calc(100% - 380px)",
            scrollbarWidth: "none"
          }}>
            {categories.map((cat) => {
              const count = cat === "all" ? services.length : services.filter(s => s.category.toLowerCase() === cat.toLowerCase()).length;
              return (
                <button
                  key={cat}
                  onClick={() => setCategoryFilter(cat)}
                  style={{
                    padding: "6px 14px",
                    borderRadius: "20px",
                    fontSize: "0.82rem",
                    fontWeight: categoryFilter === cat ? "700" : "500",
                    background: categoryFilter === cat ? "var(--color-primary)" : "var(--color-surface-hover)",
                    color: categoryFilter === cat ? "white" : "var(--color-text)",
                    border: "none",
                    cursor: "pointer",
                    textTransform: "capitalize",
                    whiteSpace: "nowrap",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "all 0.15s ease"
                  }}
                >
                  <span>{cat}</span>
                  <span style={{ 
                    fontSize: "0.72rem", 
                    opacity: categoryFilter === cat ? 0.9 : 0.6,
                    background: categoryFilter === cat ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.06)",
                    padding: "1px 6px",
                    borderRadius: "10px"
                  }}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Right Action Controls: Search & Expand All */}
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={toggleExpandAll}
              className="btn btn-sm btn-outline"
              style={{ display: "flex", alignItems: "center", gap: "5px", whiteSpace: "nowrap", fontSize: "0.8rem", height: "36px" }}
              title={allExpanded ? "Collapse all sub-services" : "Expand all 80 sub-services"}
            >
              <Layers size={14} />
              {allExpanded ? "Collapse All" : "Expand All (80 Subs)"}
            </button>

            {/* Search Box */}
            <div style={{ position: "relative", width: "240px" }}>
              <Search size={15} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
              <input
                type="text"
                className="form-input"
                placeholder="Search services or sub-services..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ paddingLeft: "32px", height: "36px", fontSize: "0.83rem" }}
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  style={{ position: "absolute", right: "8px", top: "50%", transform: "translateY(-50%)", background: "none", border: "none", cursor: "pointer", color: "var(--color-text-muted)", fontSize: "0.8rem" }}
                >
                  ✕
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-secondary)" }}>
              <div className="spinner" style={{ margin: "0 auto 12px" }}></div>
              Loading master service catalog & certified pillar mappings...
            </div>
          ) : filteredServices.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-secondary)" }}>
              No services found matching your filter "{searchQuery || categoryFilter}".
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ width: "42px", padding: "12px 10px 12px 16px" }}></th>
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
                {filteredServices.map((s) => {
                  const isExpanded = expandedIds.has(s.id);
                  const subCount = s.subServices?.length || 0;

                  return (
                    <React.Fragment key={s.id}>
                      {/* ─── MAIN SERVICE ROW ─── */}
                      <tr 
                        style={{ 
                          borderBottom: isExpanded ? "none" : "1px solid var(--color-border)",
                          background: isExpanded ? "rgba(245, 124, 32, 0.03)" : "transparent",
                          cursor: "pointer",
                          transition: "background 0.15s ease"
                        }} 
                        className="hover-row"
                        onClick={() => toggleExpand(s.id)}
                      >
                        {/* Accordion Expand Chevron */}
                        <td style={{ padding: "12px 10px 12px 16px", textAlign: "center" }} onClick={(e) => { e.stopPropagation(); toggleExpand(s.id); }}>
                          <button
                            type="button"
                            style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", justifyContent: "center" }}
                            title={isExpanded ? "Collapse sub-services" : "Expand sub-services"}
                          >
                            {isExpanded ? <ChevronDown size={18} color="#FF7900" /> : <ChevronRight size={18} />}
                          </button>
                        </td>

                        {/* Service Title & Code */}
                        <td style={{ padding: "12px 16px", fontWeight: "700", color: "var(--color-text)" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                            <div style={{ 
                              width: "32px", 
                              height: "32px", 
                              borderRadius: "8px", 
                              background: "var(--color-surface-hover)", 
                              display: "flex", 
                              alignItems: "center", 
                              justifyContent: "center",
                              flexShrink: 0
                            }}>
                              {getCategoryIcon(s.category, s.name)}
                            </div>
                            <div>
                              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                <span>{s.name}</span>
                                <span style={{
                                  fontSize: "0.72rem",
                                  fontWeight: "700",
                                  padding: "2px 6px",
                                  borderRadius: "10px",
                                  background: isExpanded ? "#FF7900" : "var(--color-surface-hover)",
                                  color: isExpanded ? "white" : "var(--color-text-secondary)"
                                }}>
                                  {subCount} Sub-Services
                                </span>
                              </div>
                              <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)", fontWeight: "500", marginTop: "2px" }}>
                                Code: {s.service_code || s.id}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Category Badge */}
                        <td style={{ padding: "12px 16px" }}>
                          <span style={{ 
                            padding: "4px 10px", 
                            borderRadius: "12px", 
                            fontSize: "0.75rem", 
                            fontWeight: "700",
                            background: "rgba(245, 124, 32, 0.12)",
                            color: "var(--color-secondary)"
                          }}>
                            {s.category}
                          </span>
                        </td>

                        {/* Base Price */}
                        <td style={{ padding: "12px 16px", fontWeight: "800", color: "#FF7900" }}>
                          From ₹{Number(s.base_price).toFixed(2)}
                        </td>

                        {/* Duration */}
                        <td style={{ padding: "12px 16px", color: "var(--color-text-secondary)" }}>
                          {s.standard_time}
                        </td>

                        {/* Active Pillars */}
                        <td style={{ padding: "12px 16px", fontWeight: "600" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "5px" }}>
                            <ShieldCheck size={14} color="var(--color-success)" />
                            {s.pillars_assigned || 5} Pillars
                          </span>
                        </td>

                        {/* Active Status */}
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

                        {/* Actions */}
                        <td style={{ padding: "12px 16px", textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}>
                            {/* Add Sub-service under this category button */}
                            <button
                              onClick={() => {
                                setParentServiceIdForSub(s.id);
                                setNewSubService(prev => ({ ...prev, parent_service_id: s.id }));
                                setAddMode("sub_service");
                                setShowAddModal(true);
                              }}
                              className="btn btn-xs btn-outline"
                              style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", fontSize: "0.78rem" }}
                              title={`Add new sub-service under ${s.name}`}
                            >
                              <Plus size={13} /> Add Sub
                            </button>

                            {/* Edit Price / Tariff Button */}
                            <button 
                              onClick={() => setEditingItem({ type: "service", data: { ...s } })}
                              className="btn btn-xs btn-outline"
                              style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", fontSize: "0.78rem" }}
                              title="Edit Main Service Cost & Tariff"
                            >
                              <Edit size={13} /> Edit Cost
                            </button>

                            {/* Enable/Disable Toggle */}
                            <button 
                              onClick={() => handleToggleServiceStatus(s.id, s.active)}
                              style={{ background: "transparent", border: "none", cursor: "pointer", color: s.active ? "#10B981" : "var(--color-text-muted)", display: "flex", alignItems: "center" }}
                              title="Toggle Service Availability"
                            >
                              {s.active ? <ToggleRight size={26} /> : <ToggleLeft size={26} />}
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* ─── EXPANDABLE SUB-SERVICES ACCORDION ─── */}
                      {isExpanded && (
                        <tr style={{ background: "rgba(245, 124, 32, 0.02)", borderBottom: "1px solid var(--color-border)" }}>
                          <td colSpan={8} style={{ padding: "0 0 16px 42px" }}>
                            <div style={{
                              background: "var(--color-surface)",
                              borderRadius: "var(--radius-md)",
                              border: "1px solid var(--color-border)",
                              marginRight: "16px",
                              boxShadow: "var(--shadow-xs)",
                              overflow: "hidden"
                            }}>
                              {/* Sub-services header banner */}
                              <div style={{
                                padding: "10px 16px",
                                background: "var(--color-surface-hover)",
                                borderBottom: "1px solid var(--color-border)",
                                display: "flex",
                                justifyContent: "space-between",
                                alignItems: "center"
                              }}>
                                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                                  <Layers size={15} color="#FF7900" />
                                  <span style={{ fontWeight: "700", fontSize: "0.85rem", color: "var(--color-text)" }}>
                                    Specialized Sub-Services under {s.name} ({subCount} Offerings)
                                  </span>
                                </div>
                                <button
                                  onClick={() => {
                                    setParentServiceIdForSub(s.id);
                                    setNewSubService(prev => ({ ...prev, parent_service_id: s.id }));
                                    setAddMode("sub_service");
                                    setShowAddModal(true);
                                  }}
                                  className="btn btn-xs btn-primary"
                                  style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", fontSize: "0.75rem" }}
                                >
                                  <Plus size={12} /> Add Sub-Service
                                </button>
                              </div>

                              {/* Nested Sub-Services Table */}
                              {subCount === 0 ? (
                                <div style={{ padding: "18px", textAlign: "center", color: "var(--color-text-secondary)", fontSize: "0.85rem" }}>
                                  No sub-services configured under {s.name} yet. Click "+ Add Sub-Service" to register one.
                                </div>
                              ) : (
                                <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.84rem" }}>
                                  <thead>
                                    <tr style={{ borderBottom: "1px solid var(--color-border)", background: "rgba(0,0,0,0.02)" }}>
                                      <th style={{ padding: "8px 14px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600", fontSize: "0.78rem" }}>SUB-SERVICE</th>
                                      <th style={{ padding: "8px 14px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600", fontSize: "0.78rem" }}>CODE</th>
                                      <th style={{ padding: "8px 14px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600", fontSize: "0.78rem" }}>REGULATED BASE RATE</th>
                                      <th style={{ padding: "8px 14px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600", fontSize: "0.78rem" }}>EST. DURATION</th>
                                      <th style={{ padding: "8px 14px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600", fontSize: "0.78rem" }}>ASSIGNED SPECIALIST</th>
                                      <th style={{ padding: "8px 14px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600", fontSize: "0.78rem" }}>STATUS</th>
                                      <th style={{ padding: "8px 14px", textAlign: "right", color: "var(--color-text-secondary)", fontWeight: "600", fontSize: "0.78rem" }}>ACTIONS</th>
                                    </tr>
                                  </thead>
                                  <tbody>
                                    {s.subServices.map((sub, idx) => (
                                      <tr 
                                        key={sub.id || idx}
                                        style={{ 
                                          borderBottom: idx < subCount - 1 ? "1px solid var(--color-border)" : "none"
                                        }}
                                        className="hover-row"
                                      >
                                        {/* Sub-Service Name & Description */}
                                        <td style={{ padding: "10px 14px" }}>
                                          <div style={{ fontWeight: "700", color: "var(--color-text)" }}>
                                            {sub.name}
                                          </div>
                                          {sub.description && (
                                            <div style={{ fontSize: "0.76rem", color: "var(--color-text-secondary)", marginTop: "2px", maxWidth: "340px" }}>
                                              {sub.description}
                                            </div>
                                          )}
                                        </td>

                                        {/* Code */}
                                        <td style={{ padding: "10px 14px", fontFamily: "monospace", fontSize: "0.78rem", color: "var(--color-text-secondary)" }}>
                                          {sub.sub_service_code || `SUB-${idx + 1}`}
                                        </td>

                                        {/* Regulated Price */}
                                        <td style={{ padding: "10px 14px", fontWeight: "800", color: "#FF7900" }}>
                                          ₹{Number(sub.base_price).toFixed(2)}
                                        </td>

                                        {/* Duration */}
                                        <td style={{ padding: "10px 14px", color: "var(--color-text-secondary)" }}>
                                          {sub.standard_time || "45 mins"}
                                        </td>

                                        {/* Assigned Specialist */}
                                        <td style={{ padding: "10px 14px" }}>
                                          {sub.specialist ? (
                                            <div>
                                              <div style={{ display: "flex", alignItems: "center", gap: "5px", fontWeight: "600", color: "var(--color-text)" }}>
                                                <span style={{ fontSize: "0.75rem", padding: "1px 5px", borderRadius: "4px", background: "rgba(16, 185, 129, 0.12)", color: "#10B981", fontWeight: "700" }}>
                                                  {sub.specialist.pillar_code}
                                                </span>
                                                <span>{sub.specialist.name}</span>
                                              </div>
                                              <div style={{ fontSize: "0.73rem", color: "var(--color-text-muted)", marginTop: "1px" }}>
                                                ★ {sub.specialist.rating} · {sub.specialist.area}
                                              </div>
                                            </div>
                                          ) : (
                                            <span style={{ color: "var(--color-text-muted)", fontSize: "0.78rem" }}>
                                              {s.pillars_assigned || 5} Qualified Pillars
                                            </span>
                                          )}
                                        </td>

                                        {/* Status */}
                                        <td style={{ padding: "10px 14px" }}>
                                          <span style={{
                                            padding: "2px 7px",
                                            borderRadius: "8px",
                                            fontSize: "0.72rem",
                                            fontWeight: "700",
                                            background: sub.active ? "var(--color-success-light)" : "var(--color-surface-hover)",
                                            color: sub.active ? "var(--color-success)" : "var(--color-text-muted)"
                                          }}>
                                            {sub.active ? "Enabled" : "Disabled"}
                                          </span>
                                        </td>

                                        {/* Actions */}
                                        <td style={{ padding: "10px 14px", textAlign: "right" }}>
                                          <div style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                            <button
                                              onClick={() => setEditingItem({
                                                type: "sub_service",
                                                data: { ...sub, service_id: s.id }
                                              })}
                                              className="btn btn-xs btn-outline"
                                              style={{ padding: "3px 8px", fontSize: "0.74rem", display: "inline-flex", alignItems: "center", gap: "3px" }}
                                              title="Edit Sub-Service Rate & Time"
                                            >
                                              <Edit size={12} /> Edit Rate
                                            </button>

                                            <button
                                              onClick={() => handleToggleSubServiceStatus(s.id, sub.id, sub.active)}
                                              style={{ background: "transparent", border: "none", cursor: "pointer", color: sub.active ? "#10B981" : "var(--color-text-muted)", display: "flex", alignItems: "center" }}
                                              title="Toggle Sub-Service Availability"
                                            >
                                              {sub.active ? <ToggleRight size={22} /> : <ToggleLeft size={22} />}
                                            </button>
                                          </div>
                                        </td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ─── ADD SERVICE OR SUB-SERVICE MODAL ─── */}
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
            maxWidth: "520px",
            padding: "var(--space-5)",
            boxShadow: "var(--shadow-xl)",
            border: "1px solid var(--color-border)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "var(--space-3)" }}>
              <h2 style={{ fontSize: "1.2rem", fontWeight: "800", margin: 0 }}>
                {addMode === "service" ? "Add New Cooperative Service Category" : "Add Sub-Service Offering"}
              </h2>
              <button onClick={() => setShowAddModal(false)} style={{ background: "transparent", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "var(--color-text-secondary)" }}>✕</button>
            </div>

            {/* Mode Switch Tabs */}
            <div style={{ display: "flex", gap: "8px", marginBottom: "var(--space-4)", background: "var(--color-surface-hover)", padding: "4px", borderRadius: "8px" }}>
              <button
                type="button"
                onClick={() => setAddMode("service")}
                style={{
                  flex: 1,
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  fontWeight: addMode === "service" ? "700" : "500",
                  background: addMode === "service" ? "var(--color-surface)" : "transparent",
                  color: addMode === "service" ? "var(--color-primary)" : "var(--color-text)",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                1. Main Category
              </button>
              <button
                type="button"
                onClick={() => setAddMode("sub_service")}
                style={{
                  flex: 1,
                  padding: "6px 12px",
                  borderRadius: "6px",
                  fontSize: "0.85rem",
                  fontWeight: addMode === "sub_service" ? "700" : "500",
                  background: addMode === "sub_service" ? "var(--color-surface)" : "transparent",
                  color: addMode === "sub_service" ? "var(--color-primary)" : "var(--color-text)",
                  border: "none",
                  cursor: "pointer"
                }}
              >
                2. Sub-Service Offering
              </button>
            </div>

            {addMode === "service" ? (
              /* FORM: ADD MAIN SERVICE */
              <form onSubmit={handleAddService} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                    Service Category Name
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Solar Panel & Inverter Maintenance"
                    value={newService.name}
                    onChange={(e) => setNewService({ ...newService, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                      Category Sector
                    </label>
                    <select
                      className="form-input"
                      value={newService.category}
                      onChange={(e) => setNewService({ ...newService, category: e.target.value })}
                    >
                      <option value="Electrical">Electrical</option>
                      <option value="Plumbing">Plumbing</option>
                      <option value="AC & HVAC">AC & HVAC</option>
                      <option value="Carpentry">Carpentry</option>
                      <option value="Painting">Painting</option>
                      <option value="Cleaning">Cleaning</option>
                      <option value="Appliances">Appliances</option>
                      <option value="Transport">Transport</option>
                      <option value="Domestic">Domestic</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Outdoor">Outdoor</option>
                      <option value="Technical">Technical</option>
                      <option value="Emergency">Emergency</option>
                      <option value="Custom Trades">Custom Trades</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                      Base Tariff (₹)
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
                    Standard Estimated Duration
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. 60 mins"
                    value={newService.standard_time}
                    onChange={(e) => setNewService({ ...newService, standard_time: e.target.value })}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                    Description & Scope
                  </label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Cooperative service scope and warranty..."
                    value={newService.description}
                    onChange={(e) => setNewService({ ...newService, description: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Create Service Category
                  </button>
                </div>
              </form>
            ) : (
              /* FORM: ADD SUB-SERVICE */
              <form onSubmit={handleAddSubService} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                    Select Parent Category
                  </label>
                  <select
                    className="form-input"
                    value={newSubService.parent_service_id || parentServiceIdForSub}
                    onChange={(e) => {
                      setParentServiceIdForSub(e.target.value);
                      setNewSubService({ ...newSubService, parent_service_id: e.target.value });
                    }}
                    required
                  >
                    <option value="">-- Choose Main Service --</option>
                    {services.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.name} ({s.category})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                    Sub-Service Title
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    placeholder="e.g. Geyser Anode Rod Replacement"
                    value={newSubService.name}
                    onChange={(e) => setNewSubService({ ...newSubService, name: e.target.value })}
                    required
                  />
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                      Regulated Rate (₹)
                    </label>
                    <input
                      type="number"
                      min="50"
                      step="10"
                      className="form-input"
                      placeholder="e.g. 350"
                      value={newSubService.base_price}
                      onChange={(e) => setNewSubService({ ...newSubService, base_price: e.target.value })}
                      required
                    />
                  </div>

                  <div>
                    <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                      Est. Duration
                    </label>
                    <input
                      type="text"
                      className="form-input"
                      placeholder="e.g. 45 mins"
                      value={newSubService.standard_time}
                      onChange={(e) => setNewSubService({ ...newSubService, standard_time: e.target.value })}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                    Specific Scope / Inclusion
                  </label>
                  <textarea
                    className="form-input"
                    rows={2}
                    placeholder="Scope of work, diagnostic check and cleanup..."
                    value={newSubService.description}
                    onChange={(e) => setNewSubService({ ...newSubService, description: e.target.value })}
                  />
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-3)" }}>
                  <button type="button" className="btn btn-outline" onClick={() => setShowAddModal(false)}>
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Register Sub-Service
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* ─── EDIT TARIFF MODAL (Main Service or Sub-Service) ─── */}
      {editingItem && (
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
                <h2 style={{ fontSize: "1.2rem", fontWeight: "800", margin: 0 }}>
                  {editingItem.type === "service" ? "Edit Main Service Tariff" : "Edit Sub-Service Tariff & Details"}
                </h2>
              </div>
              <button onClick={() => setEditingItem(null)} style={{ background: "transparent", border: "none", fontSize: "1.3rem", cursor: "pointer", color: "var(--color-text-secondary)" }}>✕</button>
            </div>

            <form onSubmit={handleSaveEdit} style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                  {editingItem.type === "service" ? "Service Title" : "Sub-Service Name"}
                </label>
                <input
                  type="text"
                  className="form-input"
                  value={editingItem.data.name}
                  onChange={(e) => setEditingItem({
                    ...editingItem,
                    data: { ...editingItem.data, name: e.target.value }
                  })}
                  required
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "var(--space-3)" }}>
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                    Standard Base Price (₹)
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="10"
                    className="form-input"
                    value={editingItem.data.base_price}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, base_price: e.target.value }
                    })}
                    required
                    style={{ fontWeight: "800", color: "#FF7900" }}
                  />
                </div>

                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                    Standard Est. Duration
                  </label>
                  <input
                    type="text"
                    className="form-input"
                    value={editingItem.data.standard_time || "45 mins"}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, standard_time: e.target.value }
                    })}
                  />
                </div>
              </div>

              {editingItem.type === "service" && (
                <div>
                  <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                    Category
                  </label>
                  <select
                    className="form-input"
                    value={editingItem.data.category}
                    onChange={(e) => setEditingItem({
                      ...editingItem,
                      data: { ...editingItem.data, category: e.target.value }
                    })}
                  >
                    {categories.filter(c => c !== "all").map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label style={{ fontSize: "0.85rem", fontWeight: "700", color: "var(--color-text-secondary)", display: "block", marginBottom: "4px" }}>
                  Scope / Description
                </label>
                <textarea
                  className="form-input"
                  rows={2}
                  value={editingItem.data.description || ""}
                  onChange={(e) => setEditingItem({
                    ...editingItem,
                    data: { ...editingItem.data, description: e.target.value }
                  })}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)", marginTop: "var(--space-4)" }}>
                <button type="button" className="btn btn-outline" onClick={() => setEditingItem(null)}>
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
