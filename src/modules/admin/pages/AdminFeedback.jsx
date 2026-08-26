import React, { useState } from "react";
import { Star, ThumbsUp, MessageSquare, Search, Filter, CheckCircle, User, Calendar } from "lucide-react";

export default function AdminFeedback() {
  const [reviews, setReviews] = useState([
    {
      id: "rev-1",
      customer_name: "Meenakshi Sundaram",
      service_name: "Fan Motor Rewinding & Wiring",
      pillar_name: "Senthil Kumar (PIL-CHE-042)",
      rating: 5,
      comment: "Arrived right on time in Guindy! Verified everything using arrival OTP and fixed the fan wiring without any extra mess. Very polite technician.",
      date: "Today, 2:15 PM",
      sentiment: "positive",
      tags: ["Punctual", "Expert", "Fair Price"]
    },
    {
      id: "rev-2",
      customer_name: "Karthik Rajan",
      service_name: "Bathroom Pipe Leakage Repair",
      pillar_name: "Murugan V (PIL-CHE-019)",
      rating: 5,
      comment: "Very fast service in Velachery. Explained the issue clearly and charged strictly as per the cooperative rate card.",
      date: "Yesterday",
      sentiment: "positive",
      tags: ["Transparent", "Polite"]
    },
    {
      id: "rev-3",
      customer_name: "Anandh Balaji",
      service_name: "AC Gas Top-up & Coil Service",
      pillar_name: "Praveen K (PIL-CHE-031)",
      rating: 4,
      comment: "Cooling is back to 100%. Had to wait 15 mins for technician arrival due to rain, but overall quality of work was excellent.",
      date: "2 days ago",
      sentiment: "positive",
      tags: ["Quality Work"]
    },
    {
      id: "rev-4",
      customer_name: "Deepa Ramakrishnan",
      service_name: "Switchboard Replacement",
      pillar_name: "Senthil Kumar (PIL-CHE-042)",
      rating: 5,
      comment: "Clean installation and very trustworthy cooperative service! Will book again.",
      date: "3 days ago",
      sentiment: "positive",
      tags: ["Clean Work", "Trustworthy"]
    }
  ]);

  const [ratingFilter, setRatingFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = reviews.filter(r => {
    const matchR = ratingFilter === "all" || r.rating === Number(ratingFilter);
    const q = searchQuery.toLowerCase();
    const matchQ = r.customer_name.toLowerCase().includes(q) || r.service_name.toLowerCase().includes(q) || r.comment.toLowerCase().includes(q) || r.pillar_name.toLowerCase().includes(q);
    return matchR && matchQ;
  });

  return (
    <div className="fade-in">
      {/* Header */}
      <div style={{ marginBottom: "var(--space-5)" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
          Customer Feedback & Quality Assurance
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Track consumer satisfaction index, verified job reviews, and technician performance metrics.
        </p>
      </div>

      {/* Analytics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
        
        {/* Overall CSAT */}
        <div style={{ background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Overall Satisfaction</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
            <span style={{ fontSize: "2rem", fontWeight: "800", color: "var(--color-text)" }}>4.92</span>
            <div style={{ display: "flex", color: "#F59E0B" }}>
              {[1, 2, 3, 4, 5].map(star => <Star key={star} size={16} fill="#F59E0B" />)}
            </div>
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-success)", fontWeight: "700", marginTop: "4px", display: "block" }}>
            ↑ 98.4% Positive Feedback
          </span>
        </div>

        {/* 5-Star Share */}
        <div style={{ background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>5-Star Reviews Share</span>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--color-secondary)", marginTop: "4px" }}>
            94.6%
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "4px", display: "block" }}>
            Across all cooperative trades
          </span>
        </div>

        {/* Total Reviews */}
        <div style={{ background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Total Verified Reviews</span>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--color-primary)", marginTop: "4px" }}>
            1,248
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "4px", display: "block" }}>
            100% OTP Verified Bookings
          </span>
        </div>

      </div>

      {/* Main Reviews Container */}
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
          {/* Star Filter */}
          <div style={{ display: "flex", gap: "6px" }}>
            {["all", "5", "4", "3", "2"].map((val) => (
              <button
                key={val}
                onClick={() => setRatingFilter(val)}
                style={{
                  padding: "6px 14px",
                  borderRadius: "20px",
                  fontSize: "0.85rem",
                  fontWeight: ratingFilter === val ? "700" : "500",
                  background: ratingFilter === val ? "var(--color-primary)" : "var(--color-surface-hover)",
                  color: ratingFilter === val ? "white" : "var(--color-text-secondary)",
                  border: "none",
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "4px"
                }}
              >
                {val === "all" ? "All Ratings" : `${val} ★`}
              </button>
            ))}
          </div>

          <div className="input-wrapper" style={{ width: "280px" }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Search customer, comments..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <Search size={16} className="input-icon" />
          </div>
        </div>

        {/* Reviews List */}
        <div style={{ padding: "var(--space-4)", display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {filtered.map((rev) => (
            <div 
              key={rev.id}
              style={{
                padding: "16px",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--color-border)",
                background: "var(--color-surface-hover)"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: "700", color: "var(--color-text)", fontSize: "0.95rem" }}>
                      {rev.customer_name}
                    </span>
                    <span style={{ fontSize: "0.75rem", background: "var(--color-success-light)", color: "var(--color-success)", fontWeight: "700", padding: "2px 8px", borderRadius: "10px" }}>
                      Verified Booking
                    </span>
                  </div>
                  <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", marginTop: "2px" }}>
                    Service: <strong>{rev.service_name}</strong> • Pillar: <strong>{rev.pillar_name}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ display: "flex", color: "#F59E0B" }}>
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} size={15} fill="#F59E0B" />
                    ))}
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{rev.date}</span>
                </div>
              </div>

              <p style={{ margin: "8px 0 10px 0", fontSize: "0.9rem", color: "var(--color-text)", lineHeight: "1.5" }}>
                "{rev.comment}"
              </p>

              <div style={{ display: "flex", gap: "6px" }}>
                {rev.tags.map((tag) => (
                  <span 
                    key={tag}
                    style={{
                      fontSize: "0.75rem",
                      padding: "2px 8px",
                      borderRadius: "6px",
                      background: "rgba(255,255,255,0.08)",
                      border: "1px solid var(--color-border)",
                      color: "var(--color-text-secondary)",
                      fontWeight: "600"
                    }}
                  >
                    ✓ {tag}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
