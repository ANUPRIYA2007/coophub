import React, { useState, useEffect } from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import { pillarOrderService, formatOrderTime } from "../../../services/pillar/orderService";
import { emergencyDispatchService } from "../../../services/emergency/emergencyDispatchService";
import ArrivalOTPModal from "../../../components/pillar/orders/ArrivalOTPModal";
import ExtraChargeModal from "../../../components/pillar/orders/ExtraChargeModal";
import CancelOrderModal from "../../../components/pillar/orders/CancelOrderModal";
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
import { paymentService } from "../../../services/customer/paymentService";

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
  const [newOrderAlert, setNewOrderAlert] = useState(null);
  const knownOrderIdsRef = React.useRef(new Set());
  const [selectedBookingForOtp, setSelectedBookingForOtp] = useState(null);
  const [selectedBookingForExtra, setSelectedBookingForExtra] = useState(null);
  const [selectedOrderForCompletion, setSelectedOrderForCompletion] = useState(null);
  const [selectedOrderForDetails, setSelectedOrderForDetails] = useState(null);
  const [selectedOrderForReceipt, setSelectedOrderForReceipt] = useState(null);
  const [expandedMapOrderId, setExpandedMapOrderId] = useState(null);
  const [cancelModalOrder, setCancelModalOrder] = useState(null);
  const [isCancelling, setIsCancelling] = useState(false);
  const [markingCashId, setMarkingCashId] = useState(null);
  const [cancelledOrderAlert, setCancelledOrderAlert] = useState(null);

  // Play pleasant double-chime when an incoming order arrives
  const playChime = () => {
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.36);
    } catch (e) {}
  };

  // Check if pillar already has an active order
  const isEngaged = orders.some(o => ["accepted", "onTheWay", "arrived", "inProgress"].includes(o.status));

  const fetchOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const { data } = await pillarOrderService.getOrders(user?.id);
      const list = data || [];

      // Detect if any previously known order was cancelled by the customer
      if (knownOrderIdsRef.current.size > 0) {
        const newlyArrived = list.find(o => !knownOrderIdsRef.current.has(o.id) && (o.status === "pending" || o.status === "assigned"));
        if (newlyArrived) {
          playChime();
          setNewOrderAlert(newlyArrived);
          setActiveTab("pending");
        }

        // Check for customer-initiated cancellations
        const previousOrders = orders; // current state before update
        for (const prevOrder of previousOrders) {
          if (['pending', 'assigned', 'accepted', 'onTheWay', 'on_the_way', 'arrived'].includes(prevOrder.status)) {
            const updatedOrder = list.find(o => o.id === prevOrder.id);
            if (updatedOrder && updatedOrder.status === 'cancelled' && updatedOrder.cancelled_by === 'customer') {
              setCancelledOrderAlert({
                id: updatedOrder.id,
                customer_name: updatedOrder.customer_name || updatedOrder.customer?.full_name || 'Customer',
                service_name: updatedOrder.service_name || 'Service',
                cancel_reason: updatedOrder.cancel_reason || 'No reason provided',
                booking_code: updatedOrder.booking_code || updatedOrder.id
              });
              break;
            }
          }
        }
      } else {
        // First load — detect new orders
        const newlyArrived = null; // skip on first load
      }

      knownOrderIdsRef.current = new Set(list.map(o => o.id));
      setOrders(list);
    } catch (e) {
      console.error("fetchOrders error:", e);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders(false);

    // Live Realtime Channel for new incoming customer requests & status updates
    const channel = pillarOrderService.subscribeToPillarOrders(user?.id, (payload) => {
      console.log("⚡ Incoming realtime order event for Pillar:", payload);
      fetchOrders(true);
    });

    // 8-second polling heartbeat ensures guaranteed live synchronization
    const pollInterval = setInterval(() => {
      fetchOrders(true);
    }, 8000);

    return () => {
      channel?.unsubscribe();
      clearInterval(pollInterval);
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

  const handleAcceptClick = async (bookingId) => {
    if (isEngaged) {
      alert(t("You already have an active order. Please complete or cancel it before accepting a new one."));
      return;
    }
    handleStatusChange(bookingId, "accepted");
  };

  const handleCancelConfirm = async (reason) => {
    if (!cancelModalOrder) return;
    setIsCancelling(true);
    await pillarOrderService.cancelOrder(cancelModalOrder.id, reason, user?.id);
    setIsCancelling(false);
    setCancelModalOrder(null);
    fetchOrders();
  };

  const handleMarkPaymentComplete = async (order) => {
    const activePillarId = user?.id || order?.pillar_id;
    if (!order?.id || !activePillarId) return;
    setMarkingCashId(order.id);
    try {
      const res = await paymentService.confirmHandCashPayment(order.id, activePillarId);
      if (res && (res.success || res.status === "paid" || res.payment_status === "completed")) {
        await fetchOrders();
      } else {
        alert(res?.error || "Failed to confirm payment");
      }
    } catch (err) {
      console.error("Mark payment error:", err);
      alert(err.message || "Failed to confirm payment");
    } finally {
      setMarkingCashId(null);
    }
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
              <ArrowLeft size={14} /> {t("Back to Dashboard")}
            </button>
          </div>
          <h1 className="page-title">{t("orders.title")}</h1>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            <p className="page-subtitle" style={{ margin: 0 }}>
              {t("Manage customer bookings, dispatch transit, and record completion")}
            </p>
            <span
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                fontSize: "11px",
                fontWeight: "700",
                color: "#059669",
                background: "rgba(16, 185, 129, 0.12)",
                border: "1px solid rgba(16, 185, 129, 0.3)",
                padding: "3px 9px",
                borderRadius: "12px",
              }}
            >
              <span
                style={{
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: "#10b981",
                  display: "inline-block",
                  boxShadow: "0 0 8px #10b981",
                }}
              />
              {t("Live Feed Active")}
            </span>
          </div>
        </div>
      </div>

      {/* Global Modals */}
      <CancelOrderModal
        isOpen={!!cancelModalOrder}
        order={cancelModalOrder}
        onClose={() => setCancelModalOrder(null)}
        onConfirm={handleCancelConfirm}
        isSubmitting={isCancelling}
      />

      {/* Realtime Live Incoming Order Alert Banner */}
      {newOrderAlert && (
        <div
          style={{
            background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
            border: "2px solid #10b981",
            borderRadius: "16px",
            padding: "14px 20px",
            marginBottom: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 8px 20px -4px rgba(16, 185, 129, 0.25)",
            animation: "fadeIn 0.3s ease-out"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "#10b981",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 12px rgba(16, 185, 129, 0.5)"
              }}
            >
              <Zap size={22} />
            </div>
            <div>
              <div style={{ fontWeight: "800", color: "#065f46", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>⚡ {t("New Customer Booking Received!")}</span>
                <span style={{ fontSize: "11px", background: "#059669", color: "white", padding: "1px 8px", borderRadius: "10px", fontWeight: "700" }}>
                  {newOrderAlert.booking_code || "LIVE"}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#047857", marginTop: "2px" }}>
                <strong>{newOrderAlert.customer_name}</strong> • {newOrderAlert.service_name} • ₹{newOrderAlert.total_amount}
              </div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <button
              onClick={() => {
                setActiveTab("pending");
                setNewOrderAlert(null);
              }}
              style={{
                background: "#059669",
                color: "white",
                border: "none",
                borderRadius: "10px",
                padding: "8px 14px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer"
              }}
            >
              {t("View Request")}
            </button>
            <button
              onClick={() => setNewOrderAlert(null)}
              style={{
                background: "transparent",
                border: "none",
                color: "#065f46",
                cursor: "pointer",
                padding: "4px"
              }}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      )}

      {/* Customer-Initiated Cancellation Alert Banner */}
      {cancelledOrderAlert && (
        <div
          style={{
            background: "linear-gradient(135deg, #fef2f2 0%, #fecaca 100%)",
            border: "2px solid #ef4444",
            borderRadius: "16px",
            padding: "14px 20px",
            marginBottom: "18px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 8px 20px -4px rgba(239, 68, 68, 0.25)",
            animation: "fadeIn 0.3s ease-out"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div
              style={{
                width: "40px",
                height: "40px",
                borderRadius: "12px",
                background: "#ef4444",
                color: "white",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                boxShadow: "0 0 12px rgba(239, 68, 68, 0.5)"
              }}
            >
              <AlertTriangle size={22} />
            </div>
            <div>
              <div style={{ fontWeight: "800", color: "#991b1b", fontSize: "14px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span>⚠️ {t("Order Cancelled by Customer")}</span>
                <span style={{ fontSize: "11px", background: "#dc2626", color: "white", padding: "1px 8px", borderRadius: "10px", fontWeight: "700" }}>
                  {cancelledOrderAlert.booking_code}
                </span>
              </div>
              <div style={{ fontSize: "12px", color: "#b91c1c", marginTop: "2px" }}>
                <strong>{cancelledOrderAlert.customer_name}</strong> cancelled: {cancelledOrderAlert.cancel_reason}
              </div>
            </div>
          </div>
          <button
            onClick={() => setCancelledOrderAlert(null)}
            style={{
              background: "transparent",
              border: "none",
              color: "#991b1b",
              cursor: "pointer",
              padding: "4px"
            }}
          >
            <X size={18} />
          </button>
        </div>
      )}

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

      {/* Content */}
      {loading ? (
        <div className="loading-container">
          <Loader2 size={36} className="spinner" />
          <p>{t("Loading real-time bookings from Supabase...")}</p>
        </div>
      ) : filteredOrders.length === 0 ? (
        <div className="card">
          <div className="empty-state">
            <div className="empty-state-icon">
              <ClipboardList size={36} />
            </div>
            <h3 className="empty-state-title">{t("No active orders found in this category")}</h3>
            <p className="empty-state-text">
              {activeTab === "pending"
                ? t("New incoming customer bookings in your service area will appear here automatically.")
                : t(`You currently have no ${activeTab} jobs.`)}
            </p>
          </div>
        </div>
      ) : (
        <div className="grid grid-2">
          {filteredOrders.map((order) => (
            <div key={order.id} className="card" style={{ display: "flex", flexDirection: "column" }}>
              <div className="card-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)", marginBottom: "4px", flexWrap: "wrap" }}>
                    <span style={{ fontSize: "var(--font-size-sm)", fontWeight: "bold", color: "var(--color-primary)" }}>
                      {order.booking_code || order.id.slice(0, 8)}
                    </span>
                    <span 
                      style={{ 
                        fontSize: "11px", 
                        fontWeight: "700", 
                        fontFamily: "monospace", 
                        color: "#64748B", 
                        background: "rgba(100, 116, 139, 0.08)", 
                        border: "1px solid rgba(100, 116, 139, 0.2)", 
                        padding: "1px 6px", 
                        borderRadius: "6px" 
                      }} 
                      title="Catalog Service ID"
                    >
                      {order.service_id ? (String(order.service_id).length > 12 ? 'SRV-' + String(order.service_id).slice(0, 6).toUpperCase() : order.service_id) : (order.service?.id || "SRV-ELEC-101")}
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
                  <h3 style={{ fontSize: "var(--font-size-lg)", fontWeight: "600" }}>{t(order.service_name)}</h3>
                  {order.sub_service_name && (
                    <p style={{ fontSize: "var(--font-size-sm)", color: "var(--color-text-secondary)" }}>
                      {t(order.sub_service_name)}
                    </p>
                  )}
                  {((order.attachments && order.attachments.length > 0) || (order.photo_urls && order.photo_urls.length > 0)) && (
                    <div style={{ marginTop: "8px", display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
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
                          padding: "3px 8px",
                          borderRadius: "10px",
                          cursor: "pointer",
                          transition: "background 0.2s"
                        }}
                        title="Customer uploaded photos / documents — Click to view"
                      >
                        📎 {(order.attachments?.length || order.photo_urls?.length || 1)} {t("Attached")}
                      </span>

                      {/* Mini Image Thumbnail Preview on Card */}
                      {(() => {
                        const firstAtt = (order.attachments && order.attachments[0]) || (order.photo_urls && order.photo_urls[0]);
                        const imgUrl = typeof firstAtt === 'string' ? firstAtt : (firstAtt?.url || firstAtt?.previewUrl || firstAtt?.dataUrl);
                        if (!imgUrl || (typeof imgUrl === 'string' && imgUrl.toLowerCase().endsWith('.pdf'))) return null;
                        return (
                          <div
                            onClick={(e) => {
                              e.stopPropagation();
                              setSelectedOrderForDetails(order);
                            }}
                            title="Click to zoom customer photo"
                            style={{
                              width: "32px",
                              height: "32px",
                              borderRadius: "8px",
                              overflow: "hidden",
                              border: "1.5px solid var(--color-secondary)",
                              cursor: "pointer",
                              display: "inline-flex",
                              alignItems: "center",
                              justifyContent: "center",
                              background: "#050B14",
                              boxShadow: "0 2px 5px rgba(0,0,0,0.15)"
                            }}
                          >
                            <img 
                              src={imgUrl} 
                              alt="Customer Upload" 
                              style={{ width: "100%", height: "100%", objectFit: "cover" }} 
                              onError={(e) => { e.currentTarget.style.display = 'none'; }}
                            />
                          </div>
                        );
                      })()}
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
                    <Eye size={13} /> {t("View Details")}
                  </button>
                </div>
              </div>

              <div className="card-body" style={{ flex: 1, padding: "var(--space-4) var(--space-6)" }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
                  
                  {/* Customer Details Block with Quick Actions */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    background: "rgba(27, 42, 74, 0.03)",
                    padding: "8px 12px",
                    borderRadius: "10px",
                    border: "1px solid var(--color-border-light)"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <div style={{
                        width: "32px",
                        height: "32px",
                        borderRadius: "50%",
                        background: "rgba(245, 124, 32, 0.12)",
                        color: "var(--color-secondary)",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontWeight: "bold",
                        fontSize: "13px"
                      }}>
                        {order.customer_name?.charAt(0) || "C"}
                      </div>
                      <div>
                        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                          <span style={{ fontWeight: "700", fontSize: "13px", color: "var(--color-text)" }}>
                            {order.customer_name}
                          </span>
                          <span style={{
                            fontSize: "10px",
                            fontWeight: "700",
                            color: "#10B981",
                            background: "rgba(16, 185, 129, 0.1)",
                            padding: "1px 6px",
                            borderRadius: "8px"
                          }}>
                            {t("Verified Customer")}
                          </span>
                        </div>
                        {order.customer_mobile && (
                          <a
                            href={`tel:${order.customer_mobile}`}
                            onClick={(e) => e.stopPropagation()}
                            style={{
                              fontSize: "11.5px",
                              color: "var(--color-secondary)",
                              textDecoration: "none",
                              fontWeight: "600",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px",
                              marginTop: "2px"
                            }}
                          >
                            <Phone size={11} /> {order.customer_mobile}
                          </a>
                        )}
                      </div>
                    </div>
                    <div style={{ display: "flex", gap: "6px" }}>
                      {order.customer_mobile && (
                        <a
                          href={`tel:${order.customer_mobile}`}
                          onClick={(e) => e.stopPropagation()}
                          className="btn btn-outline btn-sm"
                          style={{
                            borderRadius: "50%",
                            width: "30px",
                            height: "30px",
                            padding: 0,
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            color: "#10B981",
                            borderColor: "#10B981"
                          }}
                          title="Call Customer"
                        >
                          <Phone size={13} />
                        </a>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/dashboard/chat?orderId=${order.id}`, { state: { orderId: order.id } });
                        }}
                        className="btn btn-outline btn-sm"
                        style={{
                          borderRadius: "50%",
                          width: "30px",
                          height: "30px",
                          padding: 0,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          color: "var(--color-secondary)",
                          borderColor: "var(--color-secondary)"
                        }}
                        title="Chat with Customer"
                      >
                        <MessageSquare size={13} />
                      </button>
                    </div>
                  </div>

                  {/* Clean Service Address */}
                  <div style={{ display: "flex", alignItems: "flex-start", gap: "var(--space-3)", fontSize: "var(--font-size-sm)" }}>
                    <MapPin size={16} color="var(--color-secondary)" style={{ marginTop: "2px", flexShrink: 0 }} />
                    <span style={{ color: "var(--color-text)", lineHeight: "1.4" }}>
                      {order.service_address}
                    </span>
                  </div>

                  {/* Order Placement Time & Booking Schedule Slot */}
                  <div style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    flexWrap: "wrap",
                    gap: "8px",
                    paddingTop: "6px",
                    borderTop: "1px dashed var(--color-border-light)",
                    fontSize: "12px"
                  }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-text-secondary)" }}>
                      <Clock size={14} color="var(--color-secondary)" />
                      <span>{t("Order Placed")}: <strong style={{ color: "var(--color-text)" }}>{order.order_time_formatted || formatOrderTime(order.created_at)}</strong></span>
                    </div>

                    <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "var(--color-text-secondary)" }}>
                      <Calendar size={14} color="var(--color-text-muted)" />
                      <span>{t("Slot")}: <strong style={{ color: "var(--color-text)" }}>{order.scheduled_time || t("Flexible")}</strong></span>
                    </div>
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
                      🗺️ {expandedMapOrderId === order.id ? t("Hide Live Navigation Map") : t("Preview Live Route & GPS")}
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
                          pillarName={user?.full_name || t("You (Technician)")}
                          pillarRole={t("Technician")}
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
                      style={{ flex: 1.5, fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", opacity: isEngaged ? 0.5 : 1, cursor: isEngaged ? 'not-allowed' : 'pointer' }}
                      onClick={() => handleAcceptClick(order.id)}
                      disabled={isEngaged}
                      title={isEngaged ? "Complete your active order first" : "Accept Order"}
                    >
                      <Check size={14} /> {t("orders.accept")}
                    </button>
                  </>
                )}

                {order.status === "accepted" && (
                  <>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, color: "var(--color-error)", borderColor: "var(--color-error)", fontWeight: "600" }}
                      onClick={() => setCancelModalOrder(order)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 2, fontWeight: "700", background: "var(--color-primary)" }}
                      onClick={() => handleStatusChange(order.id, "onTheWay")}
                    >
                      <Navigation size={14} style={{ display: "inline", marginRight: "4px" }} />
                      {t("Start Trip to Location")}
                    </button>
                  </>
                )}

                {order.status === "onTheWay" && (
                  <>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, color: "var(--color-error)", borderColor: "var(--color-error)", fontWeight: "600" }}
                      onClick={() => setCancelModalOrder(order)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1.5, fontWeight: "700" }}
                      onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${order.latitude || order.lat},${order.longitude || order.lng}`, "_blank")}
                    >
                      🗺️ {t("Maps")}
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 2, fontWeight: "700", background: "var(--color-secondary)" }}
                      onClick={() => setSelectedBookingForOtp(order.id)}
                    >
                      <MapPin size={14} style={{ display: "inline", marginRight: "4px" }} />
                      {t("Mark Arrived (Enter OTP)")}
                    </button>
                  </>
                )}

                {(order.status === "arrived" || order.status === "inProgress") && (
                  <>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1, color: "var(--color-error)", borderColor: "var(--color-error)", fontWeight: "600" }}
                      onClick={() => setCancelModalOrder(order)}
                    >
                      Cancel
                    </button>
                    <button
                      className="btn btn-outline btn-sm"
                      style={{ flex: 1.5, fontWeight: "700" }}
                      onClick={() => setSelectedBookingForExtra(order.id)}
                    >
                      <DollarSign size={14} style={{ display: "inline", marginRight: "4px" }} />
                      {t("Add Spares/Extra")}
                    </button>
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 2, fontWeight: "700", background: "var(--color-success)" }}
                      onClick={() => setSelectedOrderForCompletion(order)}
                    >
                      <Check size={14} style={{ display: "inline", marginRight: "4px" }} />
                      {t("Finish Job & Bill")}
                    </button>
                  </>
                )}

                {order.status === "completed" && (
                  <div style={{ display: "flex", gap: "var(--space-2)", width: "100%", flexWrap: "wrap" }}>
                    {order.payment_status !== "completed" && (
                      <button
                        className="btn btn-success btn-sm"
                        style={{
                          flex: 1,
                          display: "flex",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: "6px",
                          fontWeight: "700",
                          padding: "10px 14px",
                          background: "#10B981",
                          color: "#fff"
                        }}
                        onClick={() => handleMarkPaymentComplete(order)}
                        disabled={markingCashId === order.id}
                      >
                        <Check size={16} />
                        {markingCashId === order.id ? t("Confirming...") : t("MARK PAYMENT COMPLETE")}
                      </button>
                    )}
                    <button
                      className="btn btn-primary btn-sm"
                      style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px", fontWeight: "700", padding: "10px 16px" }}
                      onClick={() => setSelectedOrderForReceipt(order)}
                    >
                      <Printer size={16} /> {t("Generate & View Official Receipt")}
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
