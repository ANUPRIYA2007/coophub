import React, { useState, useEffect, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { pillarOrderService, formatOrderTime } from "../../../services/pillar/orderService";
import {
  CheckCircle2,
  Clock,
  XCircle,
  Loader2,
  ClipboardList,
  ArrowLeft,
  Search,
  AlertTriangle,
  MapPin,
  Phone,
  Calendar,
  DollarSign,
  Eye,
  Printer,
  FileText,
  RotateCcw,
  Sparkles,
  TrendingUp,
  X
} from "lucide-react";
import OrderDetailsModal from "../../../components/pillar/orders/OrderDetailsModal";
import OrderReceiptModal from "../../../components/common/OrderReceiptModal";

export default function HistoryPage() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { user } = useAuth();

  const [historyItems, setHistoryItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Modals
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null);

  // Load history records
  const loadHistory = useCallback(async () => {
    if (!user) {
      setLoading(false);
      return;
    }
    try {
      const { data } = await pillarOrderService.getOrders(user.id);
      const pastItems = (data || []).filter((o) =>
        ["completed", "cancelled", "rejected", "declined"].includes(o.status)
      );

      // Sort by newest first
      pastItems.sort((a, b) => {
        const timeA = new Date(a.updated_at || a.cancelled_at || a.created_at || 0).getTime();
        const timeB = new Date(b.updated_at || b.cancelled_at || b.created_at || 0).getTime();
        return timeB - timeA;
      });

      setHistoryItems(pastItems);
    } catch (err) {
      console.error("Error loading pillar history:", err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    loadHistory();

    // ⚡ Realtime Live Subscription for incoming changes (Supabase Realtime, BroadcastChannel, local events)
    const subscription = pillarOrderService.subscribeToPillarOrders(user?.id, () => {
      loadHistory();
    });

    return () => {
      if (subscription?.unsubscribe) subscription.unsubscribe();
    };
  }, [user, loadHistory]);

  // Metrics calculation
  const metrics = useMemo(() => {
    const total = historyItems.length;
    const completed = historyItems.filter((i) => i.status === "completed");
    const cancelled = historyItems.filter((i) =>
      ["cancelled", "rejected", "declined"].includes(i.status)
    );
    const totalEarned = completed.reduce((sum, i) => {
      const amt = Number(i.total_amount || i.base_amount || 0);
      return sum + (isNaN(amt) ? 0 : amt);
    }, 0);
    const successRate = total > 0 ? Math.round((completed.length / total) * 100) : 100;

    return {
      total,
      completedCount: completed.length,
      cancelledCount: cancelled.length,
      totalEarned,
      successRate,
    };
  }, [historyItems]);

  // Filtered items based on active tab and search query
  const filteredItems = useMemo(() => {
    return historyItems.filter((item) => {
      // Tab filter
      if (activeTab === "completed" && item.status !== "completed") return false;
      if (
        activeTab === "cancelled" &&
        !["cancelled", "rejected", "declined"].includes(item.status)
      )
        return false;

      // Search filter
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const code = (item.booking_code || item.order_code || item.id || "").toLowerCase();
        const sName = (item.service_name || "").toLowerCase();
        const subName = (item.sub_service_name || "").toLowerCase();
        const custName = (item.customer_name || "").toLowerCase();
        const custPhone = (item.customer_mobile || item.customer_phone || "").toLowerCase();
        const addr = (item.service_address || "").toLowerCase();

        return (
          code.includes(q) ||
          sName.includes(q) ||
          subName.includes(q) ||
          custName.includes(q) ||
          custPhone.includes(q) ||
          addr.includes(q)
        );
      }
      return true;
    });
  }, [historyItems, activeTab, searchQuery]);

  return (
    <div className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-12)" }}>
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ marginBottom: "8px" }}>
            <button
              onClick={() => navigate("/dashboard")}
              className="btn btn-outline btn-sm"
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                padding: "5px 12px",
                fontSize: "12px",
                fontWeight: "700",
                borderRadius: "14px",
              }}
              title="Back to Pillar Dashboard Home"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
          </div>
          <h1 className="page-title">{t("history.title") || "Service & Order History"}</h1>
          <p className="page-subtitle">
            Complete historical log of all completed, cancelled, and closed service requests
          </p>
        </div>

        <button
          onClick={loadHistory}
          className="btn btn-outline btn-sm"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "6px",
            fontSize: "12px",
            fontWeight: "600",
          }}
          title="Refresh History Logs"
        >
          <RotateCcw size={14} /> Refresh
        </button>
      </div>

      {/* KPI Overview Cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "var(--space-4)",
          marginBottom: "var(--space-6)",
        }}
      >
        <div className="card" style={{ padding: "var(--space-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: "600" }}>
              Total History Records
            </span>
            <span style={{ background: "rgba(27, 42, 74, 0.08)", padding: "6px", borderRadius: "8px" }}>
              <FileText size={18} color="var(--color-primary)" />
            </span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", marginTop: "6px", color: "var(--color-text)" }}>
            {metrics.total}
          </div>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
            Completed & Cancelled jobs
          </span>
        </div>

        <div className="card" style={{ padding: "var(--space-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: "600" }}>
              Completed Jobs
            </span>
            <span style={{ background: "rgba(16, 185, 129, 0.12)", padding: "6px", borderRadius: "8px" }}>
              <CheckCircle2 size={18} color="#10B981" />
            </span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", marginTop: "6px", color: "#10B981" }}>
            {metrics.completedCount}
          </div>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
            Total Earned: <strong style={{ color: "var(--color-secondary)" }}>₹{metrics.totalEarned.toLocaleString()}</strong>
          </span>
        </div>

        <div className="card" style={{ padding: "var(--space-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: "600" }}>
              Cancelled / Declined
            </span>
            <span style={{ background: "rgba(239, 68, 68, 0.12)", padding: "6px", borderRadius: "8px" }}>
              <XCircle size={18} color="#ef4444" />
            </span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", marginTop: "6px", color: "#ef4444" }}>
            {metrics.cancelledCount}
          </div>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
            Customer or technician cancelled
          </span>
        </div>

        <div className="card" style={{ padding: "var(--space-4)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <span style={{ fontSize: "13px", color: "var(--color-text-secondary)", fontWeight: "600" }}>
              Job Success Rate
            </span>
            <span style={{ background: "rgba(245, 124, 32, 0.12)", padding: "6px", borderRadius: "8px" }}>
              <TrendingUp size={18} color="var(--color-secondary)" />
            </span>
          </div>
          <div style={{ fontSize: "28px", fontWeight: "800", marginTop: "6px", color: "var(--color-secondary)" }}>
            {metrics.successRate}%
          </div>
          <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>
            Historical fulfillment ratio
          </span>
        </div>
      </div>

      {/* Filter Tabs & Search Bar */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          gap: "var(--space-3)",
          marginBottom: "var(--space-5)",
        }}
      >
        <div className="filter-bar" style={{ margin: 0 }}>
          <button
            className={`filter-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All History
            <span
              style={{
                background: activeTab === "all" ? "white" : "var(--color-surface-hover)",
                color: activeTab === "all" ? "var(--color-primary)" : "inherit",
                padding: "2px 7px",
                borderRadius: "12px",
                fontSize: "11px",
                marginLeft: "8px",
                fontWeight: "700",
              }}
            >
              {metrics.total}
            </span>
          </button>

          <button
            className={`filter-btn ${activeTab === "completed" ? "active" : ""}`}
            onClick={() => setActiveTab("completed")}
          >
            <CheckCircle2 size={13} style={{ display: "inline", marginRight: "4px" }} />
            Completed
            <span
              style={{
                background: activeTab === "completed" ? "white" : "var(--color-surface-hover)",
                color: activeTab === "completed" ? "var(--color-primary)" : "inherit",
                padding: "2px 7px",
                borderRadius: "12px",
                fontSize: "11px",
                marginLeft: "8px",
                fontWeight: "700",
              }}
            >
              {metrics.completedCount}
            </span>
          </button>

          <button
            className={`filter-btn ${activeTab === "cancelled" ? "active" : ""}`}
            onClick={() => setActiveTab("cancelled")}
          >
            <AlertTriangle size={13} style={{ display: "inline", marginRight: "4px" }} />
            Cancelled
            <span
              style={{
                background: activeTab === "cancelled" ? "white" : "var(--color-surface-hover)",
                color: activeTab === "cancelled" ? "var(--color-primary)" : "inherit",
                padding: "2px 7px",
                borderRadius: "12px",
                fontSize: "11px",
                marginLeft: "8px",
                fontWeight: "700",
              }}
            >
              {metrics.cancelledCount}
            </span>
          </button>
        </div>

        {/* Search Input */}
        <div style={{ position: "relative", minWidth: "260px", flex: 1, maxWidth: "420px" }}>
          <Search
            size={16}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--color-text-muted)",
            }}
          />
          <input
            type="text"
            className="input-field"
            placeholder="Search by ID, customer, service..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            style={{
              paddingLeft: "36px",
              paddingRight: searchQuery ? "32px" : "12px",
              fontSize: "13px",
              height: "40px",
              borderRadius: "12px",
            }}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              style={{
                position: "absolute",
                right: "10px",
                top: "50%",
                transform: "translateY(-50%)",
                background: "transparent",
                border: "none",
                cursor: "pointer",
                color: "var(--color-text-muted)",
                padding: "2px",
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {/* Main List Display */}
      {loading ? (
        <div className="loading-container">
          <Loader2 size={36} className="spinner" />
          <p>Loading historical records from Supabase...</p>
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="card">
          <div className="empty-state" style={{ padding: "var(--space-12) var(--space-6)" }}>
            <div className="empty-state-icon">
              <ClipboardList size={38} />
            </div>
            <h3 className="empty-state-title">
              {searchQuery
                ? "No matching history records"
                : activeTab === "completed"
                ? "No completed jobs yet"
                : activeTab === "cancelled"
                ? "No cancelled orders on record"
                : "No service history records yet"}
            </h3>
            <p className="empty-state-text" style={{ maxWidth: "460px", margin: "0 auto" }}>
              {searchQuery
                ? `No history records found matching "${searchQuery}". Try a different keyword.`
                : activeTab === "completed"
                ? "Jobs that you accept, perform, and complete will be logged here with official receipts."
                : activeTab === "cancelled"
                ? "Any service cancellations (initiated by customers or declined by you) will be logged here."
                : "Your historical jobs, completed customer invoices, and cancellation logs will appear here automatically."}
            </p>
          </div>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
          {filteredItems.map((item) => {
            const isCompleted = item.status === "completed";
            const isCancelled = ["cancelled", "rejected", "declined"].includes(item.status);
            const cancelActor =
              item.cancelled_by === "customer"
                ? "Customer"
                : item.cancelled_by === "pillar"
                ? "Technician"
                : "System";

            return (
              <div
                key={item.id}
                className="card"
                style={{
                  border: isCancelled
                    ? "1px solid rgba(239, 68, 68, 0.3)"
                    : "1px solid var(--color-border-light)",
                  borderRadius: "var(--radius-xl)",
                  overflow: "hidden",
                  transition: "transform 0.2s, box-shadow 0.2s",
                }}
              >
                <div
                  className="card-body"
                  style={{ padding: "var(--space-5) var(--space-6)" }}
                >
                  {/* Top Bar: Code, Catalog Service, Status Badge & Amount */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                      flexWrap: "wrap",
                      gap: "10px",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                        <span
                          style={{
                            fontFamily: "monospace",
                            fontWeight: "800",
                            fontSize: "13px",
                            color: "var(--color-primary)",
                            background: "rgba(27, 42, 74, 0.06)",
                            padding: "2px 8px",
                            borderRadius: "6px",
                          }}
                        >
                          {item.booking_code || item.order_code || `ORD-${String(item.id).substring(0, 6).toUpperCase()}`}
                        </span>

                        <span
                          className={`badge ${
                            isCompleted
                              ? "badge-success"
                              : isCancelled
                              ? "badge-danger"
                              : "badge-info"
                          }`}
                        >
                          {isCompleted ? "Completed" : isCancelled ? "Cancelled" : item.status}
                        </span>

                        {item.service_id && (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "var(--color-text-muted)",
                              background: "var(--color-surface-hover)",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            {String(item.service_id).length > 12
                              ? "SRV-" + String(item.service_id).slice(0, 6).toUpperCase()
                              : item.service_id}
                          </span>
                        )}
                      </div>

                      <h3
                        style={{
                          fontSize: "16px",
                          fontWeight: "700",
                          color: "var(--color-text)",
                          marginTop: "6px",
                        }}
                      >
                        {item.service_name || "Home Service"}
                      </h3>

                      {item.sub_service_name && (
                        <p
                          style={{
                            fontSize: "12.5px",
                            color: "var(--color-text-secondary)",
                            marginTop: "2px",
                          }}
                        >
                          {item.sub_service_name}
                        </p>
                      )}
                    </div>

                    <div style={{ textAlign: "right" }}>
                      <div
                        style={{
                          fontSize: "20px",
                          fontWeight: "800",
                          color: isCompleted ? "var(--color-secondary)" : "var(--color-text-muted)",
                        }}
                      >
                        ₹{item.total_amount || item.base_amount || 0}
                      </div>
                      <span
                        style={{
                          fontSize: "11px",
                          fontWeight: "600",
                          color: isCompleted ? "#10B981" : "#ef4444",
                          display: "inline-block",
                          marginTop: "2px",
                        }}
                      >
                        {isCompleted
                          ? "✓ Paid / Settled"
                          : isCancelled
                          ? "Cancelled / Refunded"
                          : item.payment_status || "Pending"}
                      </span>
                    </div>
                  </div>

                  {/* Customer & Location Details */}
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
                      gap: "10px",
                      background: "rgba(27, 42, 74, 0.02)",
                      padding: "10px 14px",
                      borderRadius: "10px",
                      border: "1px solid var(--color-border-light)",
                      fontSize: "13px",
                      marginBottom: "12px",
                    }}
                  >
                    <div>
                      <span style={{ color: "var(--color-text-muted)", fontSize: "11px", display: "block" }}>
                        Customer
                      </span>
                      <strong style={{ color: "var(--color-text)" }}>{item.customer_name || "Customer"}</strong>
                      {item.customer_mobile && (
                        <a
                          href={`tel:${item.customer_mobile}`}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "4px",
                            color: "var(--color-secondary)",
                            textDecoration: "none",
                            fontSize: "12px",
                            marginTop: "3px",
                            fontWeight: "600",
                          }}
                        >
                          <Phone size={12} /> {item.customer_mobile}
                        </a>
                      )}
                    </div>

                    <div>
                      <span style={{ color: "var(--color-text-muted)", fontSize: "11px", display: "block" }}>
                        Service Location
                      </span>
                      <div style={{ display: "flex", alignItems: "flex-start", gap: "6px", marginTop: "2px" }}>
                        <MapPin size={14} color="var(--color-secondary)" style={{ flexShrink: 0, marginTop: "2px" }} />
                        <span style={{ color: "var(--color-text)", lineHeight: "1.3" }}>
                          {item.service_address || "Guindy, Chennai"}
                        </span>
                      </div>
                    </div>

                    <div>
                      <span style={{ color: "var(--color-text-muted)", fontSize: "11px", display: "block" }}>
                        Schedule / Date
                      </span>
                      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "2px" }}>
                        <Calendar size={14} color="var(--color-text-muted)" />
                        <span style={{ color: "var(--color-text)" }}>
                          {item.scheduled_date || new Date(item.created_at || Date.now()).toLocaleDateString()}
                          {item.scheduled_time ? ` • ${item.scheduled_time}` : ""}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* 🛑 CANCELLED ORDER DETAILS BANNER */}
                  {isCancelled && (
                    <div
                      style={{
                        background: "rgba(239, 68, 68, 0.08)",
                        border: "1px dashed rgba(239, 68, 68, 0.35)",
                        borderRadius: "10px",
                        padding: "10px 14px",
                        marginBottom: "12px",
                        display: "flex",
                        alignItems: "flex-start",
                        gap: "10px",
                      }}
                    >
                      <AlertTriangle size={18} color="#ef4444" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <div style={{ flex: 1 }}>
                        <div style={{ fontWeight: "700", fontSize: "13px", color: "#b91c1c" }}>
                          Order Cancelled (by {cancelActor})
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#991b1b", marginTop: "2px" }}>
                          <strong>Reason:</strong> {item.cancel_reason || item.escalation_reason || "Not specified"}
                        </div>
                        {item.cancelled_at && (
                          <div style={{ fontSize: "11px", color: "#991b1b", opacity: 0.85, marginTop: "4px" }}>
                            Cancelled at: {new Date(item.cancelled_at).toLocaleString()}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Action Buttons Footer */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "8px",
                      paddingTop: "10px",
                      borderTop: "1px solid var(--color-border-light)",
                    }}
                  >
                    <span style={{ fontSize: "11.5px", color: "var(--color-text-muted)" }}>
                      {isCompleted ? "Completed on:" : "Updated:"}{" "}
                      {new Date(item.updated_at || item.created_at).toLocaleDateString()}
                    </span>

                    <div style={{ display: "flex", gap: "8px" }}>
                      {isCompleted && (
                        <button
                          onClick={() => setSelectedOrderForReceipt(item)}
                          className="btn btn-outline btn-sm"
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "5px",
                            fontSize: "12px",
                            fontWeight: "700",
                            color: "var(--color-primary)",
                          }}
                          title="Generate & View Official Receipt"
                        >
                          <Printer size={13} /> View Receipt
                        </button>
                      )}

                      <button
                        onClick={() => setSelectedOrderForDetails(item)}
                        className="btn btn-primary btn-sm"
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "5px",
                          fontSize: "12px",
                          fontWeight: "700",
                        }}
                      >
                        <Eye size={13} /> Full Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Full Order Details Modal */}
      {selectedOrderForDetails && (
        <OrderDetailsModal
          order={selectedOrderForDetails}
          onClose={() => setSelectedOrderForDetails(null)}
          onTriggerReceipt={(order) => {
            setSelectedOrderForReceipt(order);
          }}
        />
      )}

      {/* Official Tax Invoice & Cash Receipt Modal */}
      {selectedOrderForReceipt && (
        <OrderReceiptModal
          order={selectedOrderForReceipt}
          onClose={() => setSelectedOrderForReceipt(null)}
          isPillarView={true}
        />
      )}
    </div>
  );
}
