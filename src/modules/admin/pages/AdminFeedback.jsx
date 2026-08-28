import React, { useState, useEffect } from "react";
import { Star, ThumbsUp, MessageSquare, Search, Filter, CheckCircle, User, Calendar } from "lucide-react";
import { adminService } from "../services/adminService";

export default function AdminFeedback() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      const data = await adminService.getBookingReviews();
      setReviews(data);
      setLoading(false);
    };
    fetchReviews();
  }, []);

  const [ratingFilter, setRatingFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const filtered = reviews.filter(r => {
    const matchR = ratingFilter === "all" || r.rating === Number(ratingFilter);
    const q = searchQuery.toLowerCase();
    const customerName = (r.customer_name || "").toLowerCase();
    const serviceName = (r.booking?.service_name || "").toLowerCase();
    const comment = (r.review_text || "").toLowerCase();
    const pillarName = (r.pillar?.full_name || "").toLowerCase();
    
    const matchQ = customerName.includes(q) || serviceName.includes(q) || comment.includes(q) || pillarName.includes(q);
    return matchR && matchQ;
  });

  const isDemo = localStorage.getItem("coophub_demo_admin") === "true";

  // Dynamic KPI calculations from actual reviews
  const totalReviews = reviews.length;
  const totalRatingSum = reviews.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
  const avgRating = totalReviews > 0 
    ? (totalRatingSum / totalReviews).toFixed(2) 
    : (isDemo ? "4.92" : "0.00");

  const fiveStarCount = reviews.filter(r => Number(r.rating) === 5).length;
  const fiveStarShare = totalReviews > 0 
    ? ((fiveStarCount / totalReviews) * 100).toFixed(1) + "%" 
    : (isDemo ? "94.6%" : "0%");

  const positiveCount = reviews.filter(r => Number(r.rating) >= 4).length;
  const positivePercent = totalReviews > 0 
    ? `↑ ${((positiveCount / totalReviews) * 100).toFixed(1)}% Positive Feedback`
    : (isDemo ? "↑ 98.4% Positive Feedback" : "No reviews recorded yet");

  const displayedTotalReviews = totalReviews > 0 
    ? totalReviews.toLocaleString() 
    : (isDemo ? "1,248" : "0");

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
            <span style={{ fontSize: "2rem", fontWeight: "800", color: "var(--color-text)" }}>{avgRating}</span>
            <div style={{ display: "flex", color: "#F59E0B" }}>
              {[1, 2, 3, 4, 5].map(star => <Star key={star} size={16} fill={Number(avgRating) >= star ? "#F59E0B" : "none"} stroke="#F59E0B" />)}
            </div>
          </div>
          <span style={{ fontSize: "0.75rem", color: totalReviews > 0 || isDemo ? "var(--color-success)" : "var(--color-text-muted)", fontWeight: "700", marginTop: "4px", display: "block" }}>
            {positivePercent}
          </span>
        </div>

        {/* 5-Star Share */}
        <div style={{ background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>5-Star Reviews Share</span>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--color-secondary)", marginTop: "4px" }}>
            {fiveStarShare}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "4px", display: "block" }}>
            {totalReviews > 0 ? `${fiveStarCount} of ${totalReviews} five-star ratings` : (isDemo ? "Across all cooperative trades" : "Across verified jobs")}
          </span>
        </div>

        {/* Total Reviews */}
        <div style={{ background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Total Verified Reviews</span>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--color-primary)", marginTop: "4px" }}>
            {displayedTotalReviews}
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
                    Service: <strong>{rev.booking?.service_name || "Service"}</strong> • Pillar: <strong>{rev.pillar?.full_name || "Unknown"}</strong>
                  </div>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <div style={{ display: "flex", color: "#F59E0B" }}>
                    {[...Array(rev.rating)].map((_, i) => (
                      <Star key={i} size={15} fill="#F59E0B" />
                    ))}
                  </div>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-text-muted)" }}>{new Date(rev.created_at).toLocaleDateString()}</span>
                </div>
              </div>

              <p style={{ margin: "8px 0 10px 0", fontSize: "0.9rem", color: "var(--color-text)", lineHeight: "1.5" }}>
                "{rev.review_text}"
              </p>

              <div style={{ display: "flex", gap: "6px" }}>
                {rev.tags?.map((tag) => (
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
