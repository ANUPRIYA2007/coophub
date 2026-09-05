import React, { useState, useEffect } from "react";
import { Star, MessageSquare, Search, Filter, Globe } from "lucide-react";
import { adminService } from "../services/adminService";

export default function SuperAdminFeedback() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [ratingFilter, setRatingFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [geoFilter, setGeoFilter] = useState("national");

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      try {
        const data = await adminService.getBookingReviews();
        setReviews(data || []);
      } catch (err) {
        console.error("Failed to fetch feedback", err);
      } finally {
        setLoading(false);
      }
    };
    fetchReviews();
  }, []);

  const filtered = reviews.filter(r => {
    const matchR = ratingFilter === "all" || r.rating === Number(ratingFilter);
    const q = searchQuery.toLowerCase();
    const customerName = (r.customer_name || "").toLowerCase();
    const serviceName = (r.booking?.service_name || "").toLowerCase();
    const comment = (r.review_text || "").toLowerCase();
    const pillarName = (r.pillar?.full_name || "").toLowerCase();
    
    const matchQ = customerName.includes(q) || serviceName.includes(q) || comment.includes(q) || pillarName.includes(q);
    
    // In a real database query, we'd filter by geographic scope.
    // For now, we apply the filter (since we don't have geo data on all reviews locally, we'll pretend national includes all).
    const matchGeo = geoFilter === "national" || true; 

    return matchR && matchQ && matchGeo;
  });

  // Analytics
  const totalReviews = filtered.length;
  const totalRatingSum = filtered.reduce((sum, r) => sum + (Number(r.rating) || 0), 0);
  const avgRating = totalReviews > 0 ? (totalRatingSum / totalReviews).toFixed(2) : "0.00";

  const fiveStarCount = filtered.filter(r => Number(r.rating) === 5).length;
  const fiveStarShare = totalReviews > 0 ? ((fiveStarCount / totalReviews) * 100).toFixed(1) + "%" : "0%";

  const positiveCount = filtered.filter(r => Number(r.rating) >= 4).length;
  const positivePercent = totalReviews > 0 ? `↑ ${((positiveCount / totalReviews) * 100).toFixed(1)}% Positive Feedback` : "No reviews recorded yet";

  return (
    <div className="fade-in">
      <div style={{ marginBottom: "var(--space-5)" }}>
        <h1 style={{ fontSize: "1.5rem", fontWeight: "800", color: "var(--color-text)", marginBottom: "var(--space-2)" }}>
          National Feedback Management
        </h1>
        <p style={{ color: "var(--color-text-secondary)" }}>
          Global grievance tracking and cooperative quality assurance metrics across all 36 States & UTs.
        </p>
      </div>

      {/* Analytics Cards */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "var(--space-4)", marginBottom: "var(--space-5)" }}>
        <div style={{ background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>National Satisfaction Index</span>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
            <span style={{ fontSize: "2rem", fontWeight: "800", color: "var(--color-text)" }}>{avgRating}</span>
            <div style={{ display: "flex", color: "#F59E0B" }}>
              {[1, 2, 3, 4, 5].map(star => <Star key={star} size={16} fill={Number(avgRating) >= star ? "#F59E0B" : "none"} stroke="#F59E0B" />)}
            </div>
          </div>
          <span style={{ fontSize: "0.75rem", color: totalReviews > 0 ? "var(--color-success)" : "var(--color-text-muted)", fontWeight: "700", marginTop: "4px", display: "block" }}>
            {positivePercent}
          </span>
        </div>

        <div style={{ background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>5-Star Quality Share</span>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--color-secondary)", marginTop: "4px" }}>
            {fiveStarShare}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "4px", display: "block" }}>
            {totalReviews > 0 ? `${fiveStarCount} of ${totalReviews} ratings are five-star` : "Across verified jobs"}
          </span>
        </div>

        <div style={{ background: "var(--color-surface)", padding: "var(--space-4)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)" }}>
          <span style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", fontWeight: "600" }}>Total Analyzed Reviews</span>
          <div style={{ fontSize: "2rem", fontWeight: "800", color: "var(--color-primary)", marginTop: "4px" }}>
            {totalReviews.toLocaleString()}
          </div>
          <span style={{ fontSize: "0.75rem", color: "var(--color-text-secondary)", marginTop: "4px", display: "block" }}>
            Based on current filter selection
          </span>
        </div>
      </div>

      {/* List and Filters */}
      <div style={{ background: "var(--color-surface)", borderRadius: "var(--radius-lg)", border: "1px solid var(--color-border)", boxShadow: "var(--shadow-sm)", overflow: "hidden" }}>
        
        {/* Controls */}
        <div style={{ padding: "var(--space-4)", borderBottom: "1px solid var(--color-border)", display: "flex", flexWrap: "wrap", gap: "var(--space-3)", alignItems: "center", justifyContent: "space-between" }}>
          
          <div style={{ display: "flex", gap: "var(--space-3)", flex: 1, minWidth: "280px" }}>
            <div style={{ position: "relative", flex: 1 }}>
              <input 
                type="text" 
                placeholder="Search reviews or pillars..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="form-input" 
                style={{ paddingLeft: "36px", width: "100%" }} 
              />
              <Search size={16} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-text-muted)" }} />
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-color)", border: "1px solid var(--color-border)", padding: "0 12px", borderRadius: "var(--radius-md)" }}>
              <Globe size={16} color="var(--color-text-muted)" />
              <select 
                value={geoFilter} 
                onChange={(e) => setGeoFilter(e.target.value)}
                style={{ border: "none", background: "transparent", color: "var(--color-text)", fontWeight: "600", outline: "none", padding: "8px 0" }}
              >
                <option value="national">National Scope</option>
                <option value="zone_north">North Zone</option>
                <option value="zone_south">South Zone</option>
                <option value="zone_east">East Zone</option>
                <option value="zone_west">West Zone</option>
                <option value="zone_central">Central Zone</option>
                <option value="zone_northeast">NE Zone</option>
              </select>
            </div>
            
            <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "var(--bg-color)", border: "1px solid var(--color-border)", padding: "0 12px", borderRadius: "var(--radius-md)" }}>
              <Filter size={16} color="var(--color-text-muted)" />
              <select 
                value={ratingFilter} 
                onChange={(e) => setRatingFilter(e.target.value)}
                style={{ border: "none", background: "transparent", color: "var(--color-text)", fontWeight: "600", outline: "none", padding: "8px 0" }}
              >
                <option value="all">All Ratings</option>
                <option value="5">5 Stars (Excellent)</option>
                <option value="4">4 Stars (Good)</option>
                <option value="3">3 Stars (Average)</option>
                <option value="2">2 Stars (Poor)</option>
                <option value="1">1 Star (Critical)</option>
              </select>
            </div>
          </div>
        </div>

        {/* Data Grid */}
        <div style={{ overflowX: "auto" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", minWidth: "900px" }}>
            <thead>
              <tr style={{ background: "var(--color-surface-hover)", borderBottom: "1px solid var(--color-border)", textAlign: "left" }}>
                <th style={{ padding: "12px 24px", fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Customer & Service</th>
                <th style={{ padding: "12px 24px", fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Pillar Assigned</th>
                <th style={{ padding: "12px 24px", fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Rating</th>
                <th style={{ padding: "12px 24px", fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Review Details</th>
                <th style={{ padding: "12px 24px", fontSize: "0.75rem", fontWeight: "700", color: "var(--color-text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} style={{ padding: "40px 0", textAlign: "center" }}>
                    <div className="spinner"></div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: "60px 0", textAlign: "center", color: "var(--color-text-muted)" }}>
                    <MessageSquare size={48} style={{ opacity: 0.2, margin: "0 auto 16px" }} />
                    <p style={{ fontWeight: "600", fontSize: "1.1rem" }}>No feedback records found</p>
                    <p style={{ fontSize: "0.9rem" }}>Try adjusting your filters or search query.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((review) => (
                  <tr key={review.id} style={{ borderBottom: "1px solid var(--color-border)" }} className="table-row-hover">
                    <td style={{ padding: "16px 24px", verticalAlign: "top" }}>
                      <div style={{ fontWeight: "700", color: "var(--color-text)", marginBottom: "4px" }}>
                        {review.customer_name || "Cooperative Client"}
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                        <span style={{ padding: "2px 6px", background: "var(--bg-color)", borderRadius: "4px", border: "1px solid var(--color-border)" }}>
                          {review.booking?.service_name || "General Service"}
                        </span>
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", verticalAlign: "top" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "var(--color-primary-light)", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-primary)", fontWeight: "800", fontSize: "0.85rem" }}>
                          {(review.pillar?.full_name || "P")[0]}
                        </div>
                        <div>
                          <div style={{ fontWeight: "700", color: "var(--color-text)" }}>{review.pillar?.full_name || "Unknown Pillar"}</div>
                          <div style={{ fontSize: "0.8rem", color: "var(--color-text-muted)", fontFamily: "monospace" }}>{review.pillar?.pillar_code || "N/A"}</div>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: "16px 24px", verticalAlign: "top" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ display: "flex", color: "#F59E0B" }}>
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star key={star} size={14} fill={Number(review.rating) >= star ? "#F59E0B" : "none"} stroke="#F59E0B" />
                          ))}
                        </div>
                        <span style={{ fontWeight: "800", color: "var(--color-text)" }}>{review.rating}/5</span>
                      </div>
                      {Number(review.rating) <= 2 && (
                        <div style={{ display: "inline-block", marginTop: "8px", fontSize: "0.7rem", padding: "2px 8px", background: "var(--color-error-light)", color: "var(--color-error)", borderRadius: "10px", fontWeight: "700", textTransform: "uppercase" }}>
                          Attention Required
                        </div>
                      )}
                    </td>
                    <td style={{ padding: "16px 24px", verticalAlign: "top" }}>
                      <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text)", lineHeight: "1.5", maxWidth: "300px" }}>
                        "{review.review_text}"
                      </p>
                    </td>
                    <td style={{ padding: "16px 24px", verticalAlign: "top", fontSize: "0.85rem", color: "var(--color-text-secondary)" }}>
                      {new Date(review.created_at).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
