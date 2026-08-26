import React, { useState, useEffect } from "react";
import { adminService } from "../services/adminService";
import { Search, Eye, Filter } from "lucide-react";
import { Link } from "react-router-dom";

export default function PillarsList() {
  const [pillars, setPillars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchPillars();
  }, []);

  const fetchPillars = async () => {
    setLoading(true);
    const data = await adminService.getAllPillars();
    setPillars(data);
    setLoading(false);
  };

  const handleSearch = async (e) => {
    const value = e.target.value;
    setSearchQuery(value);
    
    if (value.trim().length > 2) {
      setLoading(true);
      const data = await adminService.searchPillars(value);
      setPillars(data);
      setLoading(false);
    } else if (value.trim().length === 0) {
      fetchPillars();
    }
  };

  return (
    <div className="fade-in">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "var(--space-5)" }}>
        <div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
            Pillar Management
          </h1>
          <p style={{ color: "var(--color-text-secondary)" }}>
            View and manage all registered cooperative members.
          </p>
        </div>
        <button className="btn btn-primary" onClick={() => alert("Add Pillar flow to be implemented")}>
          + Add Pillar
        </button>
      </div>

      <div style={{ 
        background: "var(--color-surface)", 
        borderRadius: "var(--radius-lg)", 
        border: "1px solid var(--color-border)",
        boxShadow: "var(--shadow-sm)",
        overflow: "hidden"
      }}>
        {/* Toolbar */}
        <div style={{ 
          padding: "var(--space-4)", 
          borderBottom: "1px solid var(--color-border)",
          display: "flex",
          gap: "var(--space-3)",
          alignItems: "center"
        }}>
          <div className="input-wrapper" style={{ flex: 1, maxWidth: "400px" }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search Pillar ID or Name..." 
              value={searchQuery}
              onChange={handleSearch}
            />
            <Search size={18} className="input-icon" />
          </div>
          <button className="btn btn-outline" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <Filter size={16} /> Filter
          </button>
        </div>

        {/* Table */}
        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: "var(--space-6)", textAlign: "center" }}>
              <div className="spinner"></div>
            </div>
          ) : pillars.length === 0 ? (
            <div style={{ padding: "var(--space-6)", textAlign: "center", color: "var(--color-text-secondary)" }}>
              No Pillars found.
            </div>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.9rem" }}>
              <thead>
                <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)" }}>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Pillar ID</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Name</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Mobile</th>
                  <th style={{ padding: "12px 16px", textAlign: "left", color: "var(--color-text-secondary)", fontWeight: "600" }}>Status</th>
                  <th style={{ padding: "12px 16px", textAlign: "right", color: "var(--color-text-secondary)", fontWeight: "600" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {pillars.map((pillar) => (
                  <tr key={pillar.id} style={{ borderBottom: "1px solid var(--color-border)", transition: "background 0.2s" }} className="hover-row">
                    <td style={{ padding: "12px 16px", fontWeight: "600" }}>{pillar.pillar_code || pillar.id.substring(0, 8)}</td>
                    <td style={{ padding: "12px 16px" }}>{pillar.full_name || "N/A"}</td>
                    <td style={{ padding: "12px 16px" }}>{pillar.mobile || "N/A"}</td>
                    <td style={{ padding: "12px 16px" }}>
                      <span style={{ 
                        padding: "4px 8px", 
                        borderRadius: "12px", 
                        fontSize: "0.75rem", 
                        fontWeight: "700",
                        textTransform: "capitalize",
                        background: pillar.status === 'verified' ? 'var(--color-success-light)' : 'var(--color-warning-light)',
                        color: pillar.status === 'verified' ? 'var(--color-success)' : 'var(--color-warning)'
                      }}>
                        {pillar.status?.replace("_", " ") || "Pending"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px", textAlign: "right" }}>
                      <Link to={`/admin/pillars/${pillar.id}`} className="btn btn-outline btn-sm" style={{ padding: "4px 8px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                        <Eye size={14} /> View
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
