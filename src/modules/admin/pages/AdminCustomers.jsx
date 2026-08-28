import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import { useTranslation } from "../../../i18n/useTranslation";
import { 
  Users, Search, UserCheck, Shield, Phone, Mail, MapPin, 
  ShoppingBag, Calendar, ArrowUpDown, Filter, Eye, CheckCircle2, 
  AlertTriangle, RefreshCw, X, Award, DollarSign, Star, MoreVertical
} from "lucide-react";

export default function AdminCustomers() {
  const { t } = useTranslation();
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'active' | 'vip' | 'suspended'
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);

  useEffect(() => {
    loadCustomers();
  }, [activeTab]);

  const loadCustomers = async () => {
    setLoading(true);
    const data = await adminService.getCustomers(activeTab);
    setCustomers(data || []);
    setLoading(false);
  };

  const handleStatusChange = async (customerId, newStatus) => {
    setUpdatingId(customerId);
    const res = await adminService.updateCustomerStatus(customerId, newStatus);
    if (res.success) {
      setCustomers(prev => prev.map(c => c.id === customerId ? { ...c, status: newStatus } : c));
      if (selectedCustomer && selectedCustomer.id === customerId) {
        setSelectedCustomer(prev => ({ ...prev, status: newStatus }));
      }
    } else {
      alert("Failed to update status: " + res.error);
    }
    setUpdatingId(null);
  };

  const filteredCustomers = customers.filter(c => {
    const term = searchTerm.toLowerCase();
    const nameMatch = c.full_name?.toLowerCase().includes(term);
    const emailMatch = c.email?.toLowerCase().includes(term);
    const codeMatch = c.customer_code?.toLowerCase().includes(term);
    const phoneMatch = c.mobile?.includes(term);
    return nameMatch || emailMatch || codeMatch || phoneMatch;
  });

  const totalRegistered = customers.length;
  const activeCount = customers.filter(c => c.status === "active" || c.status === "vip").length;
  const vipCount = customers.filter(c => c.status === "vip").length;
  const totalSpend = customers.reduce((sum, c) => sum + (c.total_spent || 0), 0);

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-5)", flexWrap: "wrap", gap: "12px" }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
            <span style={{ 
              background: "rgba(139, 92, 246, 0.15)", color: "#8B5CF6", 
              fontSize: "0.75rem", fontWeight: "800", padding: "2px 8px", borderRadius: "10px", textTransform: "uppercase" 
            }}>
              Customer Registry
            </span>
            <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>• Platform Consumers</span>
          </div>
          <h1 style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--color-text)", margin: 0 }}>
            {t("admin.customers") || "Customers Management"}
          </h1>
          <p style={{ color: "var(--color-text-secondary)", fontSize: "0.88rem", marginTop: "2px", margin: 0 }}>
            Manage registered households, booking history, lifetime spend, and account clearance.
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button 
            onClick={loadCustomers} 
            className="btn btn-outline" 
            style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.85rem" }}
            disabled={loading}
          >
            <RefreshCw size={15} className={loading ? "spin" : ""} /> Refresh List
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div style={{ 
        display: "grid", 
        gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", 
        gap: "var(--space-4)", 
        marginBottom: "var(--space-5)" 
      }}>
        <div style={{ background: "var(--color-surface)", padding: "18px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--color-text-secondary)", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>Total Registered</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(139, 92, 246, 0.12)", color: "#8B5CF6", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Users size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--color-text)" }}>{totalRegistered}</div>
          <span style={{ fontSize: "0.75rem", color: "#10B981", fontWeight: "700" }}>+12% this month</span>
        </div>

        <div style={{ background: "var(--color-surface)", padding: "18px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--color-text-secondary)", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>Active Customers</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(16, 185, 129, 0.12)", color: "#10B981", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <UserCheck size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--color-text)" }}>{activeCount}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Verified accounts</span>
        </div>

        <div style={{ background: "var(--color-surface)", padding: "18px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--color-text-secondary)", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>VIP Frequent Users</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(245, 158, 11, 0.12)", color: "#F59E0B", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <Award size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--color-text)" }}>{vipCount}</div>
          <span style={{ fontSize: "0.75rem", color: "#F59E0B", fontWeight: "700" }}>10+ bookings</span>
        </div>

        <div style={{ background: "var(--color-surface)", padding: "18px", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", color: "var(--color-text-secondary)", marginBottom: "8px" }}>
            <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>Total Customer Spend</span>
            <div style={{ width: "36px", height: "36px", borderRadius: "8px", background: "rgba(255, 121, 0, 0.12)", color: "#FF7900", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <DollarSign size={18} />
            </div>
          </div>
          <div style={{ fontSize: "1.6rem", fontWeight: "800", color: "var(--color-text)" }}>₹{totalSpend.toLocaleString()}</div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)" }}>Direct to cooperative</span>
        </div>
      </div>

      {/* Filter Tabs & Search Toolbar */}
      <div style={{ 
        background: "var(--color-surface)", 
        borderRadius: "var(--radius-lg)", 
        border: "1px solid var(--color-border)",
        padding: "16px 20px",
        marginBottom: "var(--space-4)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        flexWrap: "wrap",
        gap: "14px"
      }}>
        {/* Status Tabs */}
        <div style={{ display: "flex", gap: "6px", background: "var(--color-surface-hover)", padding: "4px", borderRadius: "10px" }}>
          {[
            { id: "all", label: "All Customers" },
            { id: "active", label: "Active" },
            { id: "vip", label: "VIP" },
            { id: "suspended", label: "Suspended" },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "6px 14px",
                fontSize: "0.82rem",
                fontWeight: "700",
                borderRadius: "8px",
                border: "none",
                cursor: "pointer",
                background: activeTab === tab.id ? "#FF7900" : "transparent",
                color: activeTab === tab.id ? "white" : "var(--color-text-secondary)",
                transition: "all 0.2s"
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div style={{ position: "relative", width: "320px", maxWidth: "100%" }}>
          <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
          <input
            type="text"
            placeholder="Search by name, email, phone, code..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-input"
            style={{ paddingLeft: "36px", height: "38px", fontSize: "0.85rem" }}
          />
        </div>
      </div>

      {/* Customer Records Table */}
      <div style={{ 
        background: "var(--color-surface)", 
        borderRadius: "var(--radius-lg)", 
        border: "1px solid var(--color-border)",
        overflow: "hidden",
        boxShadow: "var(--shadow-sm)"
      }}>
        {loading ? (
          <div style={{ padding: "40px", textAlign: "center" }}><div className="spinner"></div></div>
        ) : filteredCustomers.length === 0 ? (
          <div style={{ padding: "40px", textAlign: "center", color: "var(--color-text-secondary)" }}>
            <Users size={36} color="var(--color-text-muted)" style={{ margin: "0 auto 10px" }} />
            <div style={{ fontWeight: "700", fontSize: "1rem" }}>No customer records found</div>
            <div style={{ fontSize: "0.85rem", marginTop: "4px" }}>Try adjusting your search term or filter tabs.</div>
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "0.88rem" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)", color: "var(--color-text-secondary)", fontSize: "0.78rem", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  <th style={{ padding: "14px 18px" }}>Customer Profile</th>
                  <th style={{ padding: "14px 18px" }}>Contact & Language</th>
                  <th style={{ padding: "14px 18px" }}>Location</th>
                  <th style={{ padding: "14px 18px", textAlign: "center" }}>Bookings</th>
                  <th style={{ padding: "14px 18px", textAlign: "right" }}>Total Spend</th>
                  <th style={{ padding: "14px 18px", textAlign: "center" }}>Status</th>
                  <th style={{ padding: "14px 18px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map(customer => {
                  const initials = customer.full_name?.split(" ").map(n => n[0]).join("").slice(0, 2) || "CU";
                  return (
                    <tr 
                      key={customer.id} 
                      style={{ borderBottom: "1px solid var(--color-border-light)", transition: "background 0.15s" }}
                      className="hover:bg-slate-50 dark:hover:bg-slate-800/40"
                    >
                      {/* Profile */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                          <div style={{ 
                            width: "38px", height: "38px", borderRadius: "50%", 
                            background: "linear-gradient(135deg, #FF7900 0%, #162238 100%)", 
                            color: "white", display: "flex", alignItems: "center", justifyContent: "center",
                            fontWeight: "800", fontSize: "0.85rem", flexShrink: 0
                          }}>
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: "700", color: "var(--color-text)" }}>{customer.full_name}</div>
                            <div style={{ fontSize: "0.75rem", color: "var(--color-text-muted)" }}>{customer.customer_code} • {customer.email}</div>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td style={{ padding: "14px 18px" }}>
                        <div style={{ color: "var(--color-text)", fontWeight: "600", fontSize: "0.85rem" }}>{customer.mobile}</div>
                        <span style={{ 
                          display: "inline-block", marginTop: "3px",
                          background: "var(--color-surface-hover)", color: "var(--color-text-secondary)",
                          fontSize: "0.72rem", padding: "1px 6px", borderRadius: "6px", fontWeight: "600"
                        }}>
                          🌐 {customer.language || "English"}
                        </span>
                      </td>

                      {/* Location */}
                      <td style={{ padding: "14px 18px", color: "var(--color-text-secondary)", fontSize: "0.82rem", maxWidth: "200px" }}>
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {customer.address}
                        </div>
                      </td>

                      {/* Bookings */}
                      <td style={{ padding: "14px 18px", textAlign: "center" }}>
                        <span style={{ fontWeight: "800", color: "var(--color-text)", background: "var(--color-surface-hover)", padding: "3px 8px", borderRadius: "8px" }}>
                          {customer.total_bookings}
                        </span>
                      </td>

                      {/* Total Spend */}
                      <td style={{ padding: "14px 18px", textAlign: "right", fontWeight: "800", color: "#FF7900" }}>
                        ₹{customer.total_spent?.toLocaleString()}
                      </td>

                      {/* Status */}
                      <td style={{ padding: "14px 18px", textAlign: "center" }}>
                        <span style={{ 
                          padding: "3px 10px", borderRadius: "12px", fontSize: "0.75rem", fontWeight: "800",
                          background: customer.status === "vip" ? "rgba(245, 158, 11, 0.15)" : customer.status === "active" ? "rgba(16, 185, 129, 0.15)" : "rgba(239, 68, 68, 0.15)",
                          color: customer.status === "vip" ? "#F59E0B" : customer.status === "active" ? "#10B981" : "#EF4444"
                        }}>
                          {customer.status === "vip" ? "★ VIP" : customer.status === "active" ? "● Active" : "✕ Suspended"}
                        </span>
                      </td>

                      {/* Actions */}
                      <td style={{ padding: "14px 18px", textAlign: "right" }}>
                        <button
                          onClick={() => setSelectedCustomer(customer)}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: "0.78rem", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "4px" }}
                        >
                          <Eye size={13} /> View Details
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Customer Details Slide-Over / Modal */}
      {selectedCustomer && (
        <div style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "rgba(5, 10, 18, 0.8)", backdropFilter: "blur(6px)",
          display: "flex", alignItems: "center", justifyContent: "center", padding: "20px"
        }}>
          <div style={{
            background: "var(--color-surface)", borderRadius: "20px",
            width: "100%", maxWidth: "580px", border: "1px solid var(--color-border)",
            boxShadow: "0 25px 50px -12px rgba(0,0,0,0.5)", overflow: "hidden"
          }}>
            {/* Modal Header */}
            <div style={{
              background: "linear-gradient(135deg, #050A12 0%, #162238 100%)",
              color: "white", padding: "18px 22px",
              display: "flex", justifyContent: "space-between", alignItems: "center",
              borderBottom: "1px solid rgba(255, 121, 0, 0.2)"
            }}>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <div style={{ width: "40px", height: "40px", borderRadius: "50%", background: "#FF7900", color: "white", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "800" }}>
                  {selectedCustomer.full_name?.charAt(0)}
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.1rem", fontWeight: "800" }}>{selectedCustomer.full_name}</h3>
                  <p style={{ margin: 0, fontSize: "0.75rem", color: "rgba(255,255,255,0.7)" }}>{selectedCustomer.customer_code} • Registered Consumer</p>
                </div>
              </div>
              <button 
                onClick={() => setSelectedCustomer(null)}
                style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "white", width: "32px", height: "32px", borderRadius: "50%", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
              >
                <X size={16} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: "22px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "18px" }}>
                <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "10px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Contact Number</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--color-text)", marginTop: "2px" }}>{selectedCustomer.mobile}</div>
                </div>

                <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "10px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Email Address</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: "700", color: "var(--color-text)", marginTop: "2px", overflow: "hidden", textOverflow: "ellipsis" }}>{selectedCustomer.email}</div>
                </div>

                <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "10px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Lifetime Bookings</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: "800", color: "var(--color-text)", marginTop: "2px" }}>{selectedCustomer.total_bookings} Services</div>
                </div>

                <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "10px" }}>
                  <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Total Spend</div>
                  <div style={{ fontSize: "0.9rem", fontWeight: "800", color: "#FF7900", marginTop: "2px" }}>₹{selectedCustomer.total_spent?.toLocaleString()}</div>
                </div>
              </div>

              <div style={{ background: "var(--color-surface-hover)", padding: "12px", borderRadius: "10px", marginBottom: "18px" }}>
                <div style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Registered Address</div>
                <div style={{ fontSize: "0.85rem", color: "var(--color-text)", marginTop: "2px", fontWeight: "500" }}>{selectedCustomer.address}</div>
              </div>

              {/* Status Manager */}
              <div style={{ borderTop: "1px solid var(--color-border)", paddingTop: "14px" }}>
                <label style={{ fontSize: "0.8rem", fontWeight: "700", color: "var(--color-text)", display: "block", marginBottom: "8px" }}>
                  Change Customer Account Clearance:
                </label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <button
                    onClick={() => handleStatusChange(selectedCustomer.id, "active")}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, borderColor: selectedCustomer.status === "active" ? "#10B981" : "var(--color-border)", color: selectedCustomer.status === "active" ? "#10B981" : "var(--color-text)" }}
                  >
                    ● Set Active
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedCustomer.id, "vip")}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, borderColor: selectedCustomer.status === "vip" ? "#F59E0B" : "var(--color-border)", color: selectedCustomer.status === "vip" ? "#F59E0B" : "var(--color-text)" }}
                  >
                    ★ Set VIP
                  </button>
                  <button
                    onClick={() => handleStatusChange(selectedCustomer.id, "suspended")}
                    className="btn btn-outline btn-sm"
                    style={{ flex: 1, borderColor: selectedCustomer.status === "suspended" ? "#EF4444" : "var(--color-border)", color: selectedCustomer.status === "suspended" ? "#EF4444" : "var(--color-text)" }}
                  >
                    ✕ Suspend
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div style={{ padding: "14px 22px", background: "var(--color-surface-hover)", borderTop: "1px solid var(--color-border)", display: "flex", justifyContent: "flex-end" }}>
              <button 
                onClick={() => setSelectedCustomer(null)}
                className="btn btn-primary btn-sm"
                style={{ background: "#FF7900" }}
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
