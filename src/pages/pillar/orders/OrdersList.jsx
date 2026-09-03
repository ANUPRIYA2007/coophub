import React, { useState, useEffect } from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { pillarOrderService } from "../../../services/pillar/orderService";
import { emergencyDispatchService } from "../../../services/emergency/emergencyDispatchService";
import ArrivalOTPModal from "../../../components/pillar/orders/ArrivalOTPModal";
import ExtraChargeModal from "../../../components/pillar/orders/ExtraChargeModal";
import LiveTrackingMap from "../../../components/maps/LiveTrackingMap";
import {
  Clock,
  MapPin,
  Calendar,
  Phone,
  MessageSquare,
  Check,
  X,
  Navigation,
  DollarSign,
  ClipboardList,
  User,
  Loader2,
  ChevronDown,
  ChevronUp,
  Eye,
  Printer,
  ArrowLeft,
  AlertTriangle,
  Zap
} from "lucide-react";
import { useNavigate } from "react-router-dom";

import FinalizeBillModal from "../../../components/pillar/orders/FinalizeBillModal";
import OrderDetailsModal from "../../../components/pillar/orders/OrderDetailsModal";
import OrderReceiptModal from "../../../components/common/OrderReceiptModal";

export default function OrdersList() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("pending");
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedBookingForOtp, setSelectedBookingForOtp] = useState(null);
  const [selectedBookingForExtra, setSelectedBookingForExtra] = useState(null);
  const [selectedOrderForCompletion, setSelectedOrderForCompletion] = useState(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null);
  const [expandedMapOrderId, setExpandedMapOrderId] = useState(null);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data } = await pillarOrderService.getOrders(user?.id);
      setOrders(data || []);
    } catch (e) {
      console.error("fetchOrders error:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();

    // Live Realtime Channel for new incoming customer requests & status updates
    const channel = pillarOrderService.subscribeToPillarOrders(user?.id, (payload) => {
      console.log("⚡ Incoming realtime order event for Pillar:", payload);
      fetchOrders();
    });

    return () => {
      channel?.unsubscribe();
    };
  }, [user]);

  const handleStatusChange = async (bookingId, newStatus) => {
    const metadata = {};
    if (newStatus === "accepted" && user?.id) {
      metadata.pillar_id = user.id;
    }
    await pillarOrderService.updateOrderStatus(bookingId, newStatus, metadata);
    if (newStatus === "accepted") {
      setActiveTab("accepted");
    } else if (newStatus === "onTheWay" || newStatus === "inProgress") {
      setActiveTab("inProgress");
    } else if (newStatus === "completed") {
      setActiveTab("completed");
    }
    fetchOrders();
  };

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "inProgress") {
      return ["onTheWay", "arrived", "inProgress"].includes(o.status);
    }
    return o.status === activeTab;
  });

  const tabs = [
    { id: "pending", label: t("orders.pending"), count: orders.filter((o) => o.status === "pending").length },
    { id: "accepted", label: t("orders.accepted"), count: orders.filter((o) => o.status === "accepted").length },
    { id: "inProgress", label: t("orders.inProgress"), count: orders.filter((o) => ["onTheWay", "arrived", "inProgress"].includes(o.status)).length },
    { id: "completed", label: t("orders.completed"), count: orders.filter((o) => o.status === "completed").length },
  ];

  return (
    <div className="container" style={{ paddingTop: "var(--space-6)", paddingBottom: "var(--space-12)" }}>
      <div className="page-header">
        <div>
          <div style={{ marginBottom: "6px" }}>
            <button
              onClick={() => navigate('/dashboard')}
              className="btn btn-outline btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "4px 10px", fontSize: "12px", fontWeight: "700" }}
              title="Back to Pillar Dashboard Home"
            >
              <ArrowLeft size={14} /> Back to Dashboard
            </button>
          </div>
          <h1 className="page-title">{t("orders.title")}</h1>
          <p className="page-subtitle">Manage customer bookings, dispatch transit, and record completion</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="filter-bar">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`filter-btn ${activeTab === tab.id ? "active" : ""}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
            <span
              style={{
                background: activeTab === tab.id ? "white" : "var(--color-surface-hover)",
                color: activeTab === tab.id ? "var(--color-primary)" : "inherit",
                padding: "2px 7px",
                borderRadius: "12px",
                fontSize: "11px",
                marginLeft: "8px",
                fontWeight: "700",
              }}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {/* 🚨 High-Priority Emergency Order Queue */}
      {orders.some(o => (o.is_emergency || o.priority_level === 'EMERGENCY') && o.status === 'pending') && (
        <div style={{ marginBottom: "var(--space-4)" }}>
          {orders.filter(o => (o.is_emergency || o.priority_level === 'EMERGENCY') && o.status === 'pending').map(em => (
            <div 
              key={em.id} 
              style={{
                background: "rgba(239, 68, 68, 0.08)",
                border: "2px solid #EF4444",
                borderRadius: "var(--radius-lg)",
                padding: "20px",
                boxShadow: "0 6px 20px rgba(239, 68, 68, 0.25)",
                display: "flex",
                flexDirection: "column",
                gap: "12px",
                marginBottom: "12px"
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                  <div style={{ background: "#EF4444", color: "white", padding: "8px", borderRadius: "10px" }}>
                    <Zap size={20} />
                  </div>
                  <div>
                    <span style={{ fontSize: "0.75rem", fontWeight: "900", color: "#EF4444", textTransform: "uppercase", letterSpacing: "1px" }}>
                      🚨 High-Priority Emergency Dispatch Offer (90s Window)
                    </span>
                    <h3 style={{ fontSize: "1.15rem", fontWeight: "900", color: "var(--color-text)", margin: "2px 0 0" }}>
                      {em.service_name} • Order #{em.booking_code || em.id.slice(0, 8)}
                    </h3>
                  </div>
                </div>
                <span style={{ background: "#EF4444", color: "white", padding: "4px 12px", borderRadius: "20px", fontSize: "0.78rem", fontWeight: "900" }}>
                  URGENT RESPONSE
                </span>
              </div>

              <div style={{ background: "var(--color-surface)", padding: "12px", borderRadius: "8px", border: "1px solid var(--color-border)", fontSize: "0.85rem" }}>
                <strong>Reported Emergency Hazard:</strong> {em.emergency_reason || em.customer_description || "Urgent on-site assistance requested."}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                <div style={{ fontSize: "0.82rem", color: "var(--color-text-secondary)" }}>
                  📍 {em.service_address || em.address_line || "Chennai"} • Distance: <strong>{em.distance_km || "1.8"} km</strong> • ETA: <strong>10 mins (ESTIMATED)</strong>
                </div>
                <div style={{ display: "flex", gap: "10px" }}>
                  <button
                    onClick={async () => {
                      await emergencyDispatchService.declineEmergencyOffer(em.id, user?.id, "Pillar unavailable");
                      fetchOrders();
                    }}
                    className="btn btn-outline"
                    style={{ borderColor: "#64748B", color: "#64748B", fontWeight: "700" }}
                  >
                    Decline
                  </button>
                  <button
                    onClick={async () => {
                      await emergencyDispatchService.acceptEmergencyOffer(em.id, user?.id);
                      handleStatusChange(em.id, "accepted");
                    }}
                    className="btn btn-primary"
                    style={{ background: "#EF4444", color: "white", fontWeight: "900", display: "flex", alignItems: "center", gap: "6px" }}
                  >
                    <Zap size={16} /> Accept Emergency & Mobilize
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="loading-container">
          <Loader2 size={36} className="spinner" />
          <p>Loading real-time bookings from Supabase...</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <ClipboardList size={36} />
            </div>
            <h3 className="empty-state-title">No {t(`orders.${activeTab}`).toLowerCase()} orders</h3>
            <p className="empty-state-text">
              {activeTab === "pending"
                ? "New incoming customer bookings in your service area will appear here automatically."
                : `You currently have no ${activeTab} jobs.`}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-2">
          {filteredOrders.map((order) => (
            <div key={order.id} className="card" style={{ display: "flex", flexDirection: "column" }}>
              <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "4px" }}>
                    <span style={{ fontSize: "var(--font-size-sm)", fontWeight: "bold", color: "var(--color-primary)" }}>
                      {order.booking_code || order.id.slice(0, 8)}
                    </span>
                    <span
                      className={`badge ${
                        order.status === "pending"
                          ? "badge-warning"
                          : order.status === "completed"
                          ? "badge-success"
                          : "badge-info"
                      }`}
                    >
                      {t(`orders.${order.status}`)}
                    </span>
                  </div>
                  <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: "600" }}>{order.service_name}</h3>
                  {order.sub_service_name && (
                    <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                      {order.sub_service_name}
                    </p>
                  )}
                  {order.attachments && order.attachments.length > 0 && (
                    <div style={{ marginTop: "6px" }}>
                      <span
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrderForDetails(order);
                        }}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "4px",
                          background: "rgba(245, 124, 32, 0.12)",
                          color: "var(--color-secondary)",
                          border: "1px solid rgba(245, 124, 32, 0.3)",
                          fontSize: "11px",
                          fontWeight: "700",
                          padding: "2px 8px",
                          borderRadius: "10px",
                          cursor: "pointer"
                        }}
                        title="Customer uploaded photos / documents — Click to view"
                      >
                        📎 {order.attachments.length} {order.attachments.length === 1 ? "Photo/PDF" : "Photos/PDFs"} Attached
                      </span>
                    </div>
                  )}
                </div>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "6px" }}>
                  <div style={{ fontSize: "var(--font-size-xl)", fontWeight: "bold", color: "var(--color-secondary)" }}>
                    ₹{order.total_amount || order.base_amount || "0"}
                  </div>
                  <button
                    className="btn btn-outline btn-sm"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "5px",
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "4px 10px",
                      borderRadius: "14px",
                      color: "var(--color-primary)",
                      borderColor: "var(--color-border-light)"
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedOrderForDetails(order);
                    }}
                    title="View Full Order Details"
                  >
                    <Eye size={13} /> View Details
                  </button>
                </div>
              </div>

              <div className="card-body" style={{ flex: 1, padding: "var(--space-4) var(--space-6)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", fontSize: "var(--font-size-sm)" }}>
                    <User size={16} color="var(--color-text-muted)" />
                    <span style={{ fontWeight: "500" }}>{order.customer_name}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", fontSize: "var(--font-size-sm)" }}>
                    <MapPin size={16} color="var(--color-text-muted)" />
                    <span>{order.service_address}</span>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", fontSize: "var(--font-size-sm)" }}>
                    <Calendar size={16} color="var(--color-text-muted)" />
                    <span>{order.scheduled_date || "Today"}</span>
                    {order.scheduled_time && (
                      <>
                        <span style={{ margin: "0 8px", color: "var(--color-border)" }}>|</span>
                        <Clock size={16} color="var(--color-text-muted)" />
                        <span>{order.scheduled_time}</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Collapsible Google Maps Route Preview */}
                {(order.status === "accepted" || order.status === "onTheWay" || order.status === "arrived") && (
                  <div style={{ marginTop: "var(--space-3)", paddingTop: "var(--space-2)", borderTop: "1px dashed var(--color-border-light)" }}>
                    <button
                      onClick={() => setExpandedMapOrderId(expandedMapOrderId === order.id ? null : order.id)}
                      style={{
                        background: "none",
                        border: "none",
                        color: "var(--color-primary)",
                        fontSize: "0.8rem",
                        fontWeight: "700",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: "4px",
                        padding: 0
                      }}
                    >
                      🗺️ {expandedMapOrderId === order.id ? "Hide Live Navigation Map" : "Preview Live Route & GPS"}
                      {expandedMapOrderId === order.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </button>

                    {expandedMapOrderId === order.id && (
                      <div style={{ marginTop: "10px" }}>
                        <LiveTrackingMap
                          customerLocation={{
                            lat: order.latitude || order.lat,
                            lng: order.longitude || order.lng
                          }}
                          pillarLocation={(user?.current_lat != null && user?.current_lng != null) ? {
                            lat: Number(user.current_lat),
                            lng: Number(user.current_lng)
                          } : (user?.lat != null && user?.lng != null) ? {
                            lat: Number(user.lat),
                            lng: Number(user.lng)
                          } : null}
                          pillarName={user?.full_name || "You (Technician)"}
                          pillarRole="Technician"
                          height="220px"
                        />
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div
                style={{
                  padding: "var(--space-4) var(--space-6)",
                  borderTop: "1px solid var(--color-border-light)",
                  background: "var(--color-surface-hover)",
                  borderBottomLeftRadius: "var(--radius-xl)",
                  borderBottomRightRadius: "var(--radius-xl)",
                  display: "flex",
                  gap: "var(--space-3)",
                }}
              >
                {order.status === "pending" && (
                  <>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, color: "var(--color-error)", borderColor: "var(--color-error)", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}
                      onClick={() => handleStatusChange(order.id, "rejected")}
                    >
                      <X size={14} /> {t("orders.reject")}
                    </button>
                    <button
                      className="btn btn-success btn-sm"
                      style={{ flex: 1.5, fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}
                      onClick={() => handleStatusChange(order.id, "accepted")}
                    >
                      <Check size={14} /> {t("orders.accept")}
                    </button>
                  </>
                )}

                {order.status === "accepted" && (
                  <>
                    <button
                      className="btn btn-primary"
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      onClick={() => handleStatusChange(order.id, "onTheWay")}
                    >
                      <Navigation size={16} /> {t("orders.startTravel")}
                    </button>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${order.latitude || 13.3627904},${order.longitude || 80.134144}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                      title="Open Directions in Google Maps"
                    >
                      🗺️ Maps
                    </a>
                    <button
                      className="btn btn-outline btn-sm"
                      onClick={() => navigate("/dashboard/chat")}
                    >
                      <MessageSquare size={16} />
                    </button>
                  </>
                )}

                {order.status === "onTheWay" && (
                  <div style={{ display: "flex", gap: "var(--space-2)", width: "100%" }}>
                    <button
                      className="btn btn-warning"
                      style={{ flex: 3, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      onClick={() => setSelectedBookingForOtp(order.id)}
                    >
                      <MapPin size={16} /> {t("orders.markArrived")} (Enter OTP)
                    </button>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${order.latitude || 13.3627904},${order.longitude || 80.134144}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, display: "inline-flex", alignItems: "center", justifyContent: "center" }}
                      title="Open Directions in Google Maps"
                    >
                      🗺️ Maps
                    </a>
                  </div>
                )}

                {(order.status === "arrived" || order.status === "inProgress") && (
                  <div style={{ display: "flex", gap: "var(--space-2)", width: "100%" }}>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "5px" }}
                      onClick={() => setSelectedBookingForExtra(order.id)}
                    >
                      <DollarSign size={16} /> + Extra
                    </button>
                    <button
                      className="btn btn-success btn-sm"
                      style={{ flex: 2, fontWeight: "bold", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
                      onClick={() => setSelectedOrderForCompletion(order)}
                    >
                      <Check size={16} /> Complete & Finalize
                    </button>
                  </div>
                )}

                {order.status === "completed" && (
                  <div style={{ display: "flex", gap: "var(--space-2)", width: "100%" }}>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: "700", padding: "10px 16px" }}
                      onClick={() => setSelectedOrderForReceipt(order)}
                    >
                      <Printer size={16} /> Generate & View Official Receipt
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Arrival OTP Modal */}
      {selectedBookingForOtp && (
        <ArrivalOTPModal
          bookingId={selectedBookingForOtp}
          onClose={() => setSelectedBookingForOtp(null)}
          onSuccess={() => {
            setActiveTab("inProgress");
            fetchOrders();
          }}
        />
      )}

      {/* Extra Charge Modal */}
      {selectedBookingForExtra && (
        <ExtraChargeModal
          bookingId={selectedBookingForExtra}
          onClose={() => setSelectedBookingForExtra(null)}
          onSuccess={fetchOrders}
        />
      )}

      {/* Finalize Bill & Job Completion Modal */}
      {selectedOrderForCompletion && (
        <FinalizeBillModal
          order={selectedOrderForCompletion}
          onClose={() => setSelectedOrderForCompletion(null)}
          onSuccess={() => {
            setActiveTab("completed");
            fetchOrders();
          }}
        />
      )}

      {/* Complete Order Details Modal */}
      {selectedOrderForDetails && (
        <OrderDetailsModal
          order={selectedOrderForDetails}
          onClose={() => setSelectedOrderForDetails(null)}
          onStatusChange={handleStatusChange}
          onTriggerOtp={(id) => {
            setSelectedBookingForOtp(id);
            setSelectedOrderForDetails(null);
          }}
          onTriggerExtra={(order) => {
            setSelectedBookingForExtra(order.id);
            setSelectedOrderForDetails(null);
          }}
          onTriggerComplete={(order) => {
            setSelectedOrderForCompletion(order);
            setSelectedOrderForDetails(null);
          }}
          onTriggerReceipt={(order) => {
            setSelectedOrderForReceipt(order);
          }}
        />
      )}

      {/* Official Tax Invoice & Cash Receipt Generator Modal */}
      {selectedOrderForReceipt && (
        <OrderReceiptModal
          order={selectedOrderForReceipt}
          onClose={() => setSelectedOrderForReceipt(null)}
        />
      )}
    </div>
  );
}
