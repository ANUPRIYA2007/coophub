import React, { useState } from "react";
import { useTranslation } from "../../../i18n/useTranslation";
import { useAuth } from "../../../context/AuthContext";
import LiveTrackingMap from "../../maps/LiveTrackingMap";
import { formatOrderTime } from "../../../services/pillar/orderService";
import {
  X,
  Calendar,
  Clock,
  MapPin,
  Phone,
  MessageSquare,
  DollarSign,
  User,
  ShieldCheck,
  CheckCircle2,
  Navigation,
  KeyRound,
  FileText,
  AlertCircle,
  Wrench,
  ChevronRight,
  ExternalLink,
  Copy,
  Check,
  Zap,
  Tag,
  Paperclip,
  Download,
  Maximize2,
  Camera,
  Eye,
  Printer
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { paymentService } from "../../../services/customer/paymentService";
import { openPillarChat } from "../chat/PillarChatDrawer";

export default function OrderDetailsModal({
  order,
  onClose,
  onStatusChange,
  onTriggerOtp,
  onTriggerExtra,
  onTriggerComplete,
  onTriggerReceipt
}) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [copied, setCopied] = useState(false);
  const [showMap, setShowMap] = useState(true);
  const [previewImage, setPreviewImage] = useState(null);
  const [markingCash, setMarkingCash] = useState(false);
  const [cashConfirmed, setCashConfirmed] = useState(order?.payment_status === 'completed');

  // Normalize customer uploaded files, whether stored as objects, URLs, base64 strings, or in photo_urls
  const allAttachments = React.useMemo(() => {
    const raw = (order?.attachments && order.attachments.length > 0)
      ? order.attachments
      : (order?.photo_urls || order?.photos || []);
    const list = Array.isArray(raw) ? raw : (raw ? [raw] : []);
    return list.map((item, idx) => {
      if (typeof item === 'string') {
        const isPdf = item.includes('application/pdf') || item.toLowerCase().endsWith('.pdf');
        const isData = item.startsWith('data:');
        const isHttp = item.startsWith('http://') || item.startsWith('https://');
        const url = (isData || isHttp)
          ? item
          : `https://aqzkzaswckfoazpqeeti.supabase.co/storage/v1/object/public/request_attachments/${item}`;
        return {
          id: `att-${idx}`,
          name: isData ? `Customer_Photo_${idx + 1}.jpg` : (item.split('/').pop() || `Attachment_${idx + 1}`),
          url: url,
          previewUrl: url,
          type: isPdf ? 'pdf' : 'image',
          size: isPdf ? 'PDF Document' : 'Photo',
          uploaded_at: 'Customer Upload'
        };
      }
      const url = item.url || item.previewUrl || item.dataUrl || (item.path ? `https://aqzkzaswckfoazpqeeti.supabase.co/storage/v1/object/public/request_attachments/${item.path}` : '');
      const isPdf = item.type === 'pdf' || (item.name || url || '').toLowerCase().includes('.pdf');
      return {
        ...item,
        id: item.id || `att-${idx}`,
        name: item.name || (isPdf ? `Document_${idx + 1}.pdf` : `Customer_Photo_${idx + 1}.jpg`),
        url: url,
        previewUrl: item.previewUrl || url,
        type: isPdf ? 'pdf' : 'image',
        size: item.size || (isPdf ? 'PDF Document' : 'Inspection Photo'),
        uploaded_at: item.uploaded_at || 'Attached'
      };
    });
  }, [order?.attachments, order?.photo_urls, order?.photos]);

  if (!order) return null;

  const handleMarkPaymentComplete = async () => {
    setMarkingCash(true);
    try {
      const activePillarId = user?.id || order.pillar_id;
      const res = await paymentService.confirmHandCashPayment(order.id, activePillarId);
      if (res.success) {
        setCashConfirmed(true);
        if (onStatusChange) {
          onStatusChange(order.id, order.status);
        }
      } else {
        alert(res.error || "Failed to confirm cash payment.");
      }
    } catch (err) {
      alert("Error confirming payment: " + err.message);
    } finally {
      setMarkingCash(false);
    }
  };

  const copyBookingCode = () => {
    navigator.clipboard.writeText(order.booking_code || order.id);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const bookingCode = order.booking_code || "ORD-" + order.id.slice(0, 6).toUpperCase();
  const baseAmount = Number(order.base_amount || order.total_amount || 450);
  const extraAmount = Number(order.extra_charge_amount || 0);
  const totalAmount = baseAmount + extraAmount;
  const platformFee = Math.round(totalAmount * 0.085); // 8.5% coop fee
  const netEarnings = totalAmount - platformFee;

  // Status mapping for visual workflow stepper
  const steps = [
    { key: "pending", label: "Request Placed" },
    { key: "accepted", label: "Accepted" },
    { key: "onTheWay", label: "On The Way" },
    { key: "inProgress", label: "In Progress" },
    { key: "completed", label: "Completed" }
  ];

  const getStepStatus = (stepKey) => {
    const orderStatus = order.status;
    const hierarchy = ["pending", "accepted", "onTheWay", "inProgress", "completed"];
    const currentIndex = hierarchy.indexOf(orderStatus === "arrived" ? "inProgress" : orderStatus);
    const stepIndex = hierarchy.indexOf(stepKey);

    if (orderStatus === "rejected" || orderStatus === "cancelled") {
      return stepKey === "pending" ? "completed" : "inactive";
    }
    if (stepIndex < currentIndex) return "completed";
    if (stepIndex === currentIndex) return "current";
    return "upcoming";
  };

  const statusColors = {
    pending: { bg: "#FEF3C7", text: "#D97706", border: "#F59E0B" },
    accepted: { bg: "#DBEAFE", text: "#1D4ED8", border: "#3B82F6" },
    onTheWay: { bg: "#E0E7FF", text: "#4338CA", border: "#6366F1" },
    arrived: { bg: "#EDE9FE", text: "#6D28D9", border: "#8B5CF6" },
    inProgress: { bg: "#F3E8FF", text: "#7E22CE", border: "#A855F7" },
    completed: { bg: "#D1FAE5", text: "#047857", border: "#10B981" },
    rejected: { bg: "#FEE2E2", text: "#B91C1C", border: "#EF4444" }
  };

  const currentStatusStyle = statusColors[order.status] || statusColors.pending;

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px" }}>
      <div
        className="modal-content"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "760px",
          width: "100%",
          maxHeight: "90vh",
          display: "flex",
          flexDirection: "column",
          borderRadius: "var(--radius-xl)",
          overflow: "hidden",
          boxShadow: "0 20px 40px rgba(0, 0, 0, 0.3)",
          animation: "modalSlideUp 0.25s ease-out"
        }}
      >
        {/* ─── Modal Header ─── */}
        <div
          style={{
            padding: "18px 24px",
            background: "var(--color-surface)",
            borderBottom: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "44px",
              height: "44px",
              borderRadius: "12px",
              background: "rgba(245, 124, 32, 0.12)",
              color: "var(--color-secondary)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Wrench size={22} />
            </div>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ fontSize: "1.1rem", fontWeight: "800", color: "var(--color-text)" }}>
                  {bookingCode}
                </span>
                <button
                  onClick={copyBookingCode}
                  style={{
                    background: "none",
                    border: "none",
                    color: "var(--color-text-secondary)",
                    cursor: "pointer",
                    padding: "2px",
                    display: "flex",
                    alignItems: "center"
                  }}
                  title="Copy Reference ID"
                >
                  {copied ? <Check size={14} color="#10B981" /> : <Copy size={14} />}
                </button>
                <span
                  style={{
                    background: currentStatusStyle.bg,
                    color: currentStatusStyle.text,
                    border: `1px solid ${currentStatusStyle.border}`,
                    fontSize: "11px",
                    fontWeight: "700",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    textTransform: "capitalize"
                  }}
                >
                  {t(`orders.${order.status}`) || order.status}
                </span>
              </div>
              <p style={{ margin: "2px 0 0 0", fontSize: "12px", color: "var(--color-text-secondary)" }}>
                {t("Order Placed")}: <strong style={{ color: "var(--color-text)" }}>{order.order_time_formatted || formatOrderTime(order.created_at)}</strong> • Ref ID: {order.id.slice(0, 12)}
              </p>
            </div>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", textTransform: "uppercase", fontWeight: "600" }}>Total Value</span>
              <div style={{ fontSize: "1.35rem", fontWeight: "800", color: "var(--color-secondary)" }}>
                ₹{totalAmount}
              </div>
            </div>
            <button
              className="btn-icon"
              onClick={onClose}
              style={{ borderRadius: "50%", background: "var(--color-background)", width: "36px", height: "36px", display: "flex", alignItems: "center", justifyContent: "center" }}
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* ─── Scrollable Modal Body ─── */}
        <div style={{ flex: 1, overflowY: "auto", padding: "20px 24px", display: "flex", flexDirection: "column", gap: "20px" }}>
          
          {/* Visual Status Progress Stepper */}
          <div style={{
            background: "var(--color-background)",
            padding: "16px 20px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--color-border)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
              {steps.map((s, idx) => {
                const statusState = getStepStatus(s.key);
                const isDone = statusState === "completed";
                const isCurrent = statusState === "current";

                return (
                  <div key={s.key} style={{ display: "flex", flexDirection: "column", alignItems: "center", flex: 1, position: "relative", zIndex: 1 }}>
                    <div style={{
                      width: "28px",
                      height: "28px",
                      borderRadius: "50%",
                      background: isDone ? "#10B981" : isCurrent ? "var(--color-secondary)" : "var(--color-surface)",
                      color: isDone || isCurrent ? "#FFFFFF" : "var(--color-text-muted)",
                      border: isCurrent ? "2px solid #FFFFFF" : "1px solid var(--color-border)",
                      boxShadow: isCurrent ? "0 0 10px rgba(245, 124, 32, 0.4)" : "none",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      fontSize: "12px",
                      fontWeight: "700",
                      marginBottom: "6px"
                    }}>
                      {isDone ? <Check size={14} /> : idx + 1}
                    </div>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: isCurrent ? "700" : "500",
                      color: isCurrent ? "var(--color-secondary)" : isDone ? "#10B981" : "var(--color-text-muted)",
                      textAlign: "center"
                    }}>
                      {s.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Service & Problem Description Card */}
          <div style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-lg)",
            padding: "16px 18px",
            border: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
                  <span style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    textTransform: "uppercase",
                    letterSpacing: "0.5px",
                    color: "var(--color-primary)",
                    background: "rgba(27, 42, 74, 0.08)",
                    padding: "2px 8px",
                    borderRadius: "6px"
                  }}>
                    {order.service?.category || "Electrical & Appliances"}
                  </span>
                  <span style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    fontFamily: "monospace",
                    color: "#64748B",
                    background: "#F1F5F9",
                    border: "1px solid #CBD5E1",
                    padding: "2px 8px",
                    borderRadius: "6px"
                  }}>
                    Service ID: {order.service_id ? (String(order.service_id).length > 12 ? 'SRV-' + String(order.service_id).slice(0, 8).toUpperCase() : order.service_id) : (order.service?.id || "SRV-ELEC-101")}
                  </span>
                </div>
                <h3 style={{ margin: "6px 0 2px 0", fontSize: "1.15rem", fontWeight: "700", color: "var(--color-text)" }}>
                  {order.service_name}
                </h3>
                {order.sub_service_name && (
                  <p style={{ margin: 0, fontSize: "13px", color: "var(--color-text-secondary)" }}>
                    {order.sub_service_name}
                  </p>
                )}
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "11px", color: "var(--color-text-muted)" }}>Schedule</span>
                <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "12.5px", fontWeight: "600", color: "var(--color-text)", marginTop: "2px" }}>
                  <Calendar size={14} color="var(--color-secondary)" />
                  <span>{order.scheduled_date || "Today"}</span>
                  <span style={{ opacity: 0.4 }}>•</span>
                  <Clock size={14} color="var(--color-secondary)" />
                  <span>{order.scheduled_time || "Morning Slot"}</span>
                </div>
              </div>
            </div>

            {/* Customer Issue Description / Notes */}
            <div style={{
              background: "var(--color-background)",
              borderRadius: "var(--radius-md)",
              padding: "12px 14px",
              border: "1px solid var(--color-border-light)"
            }}>
              <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                <FileText size={13} color="var(--color-secondary)" /> Problem Note / Customer Instructions
              </span>
              <p style={{ margin: "6px 0 0 0", fontSize: "13px", color: "var(--color-text)", lineHeight: "1.5" }}>
                "{order.description || "Customer reported electrical tripping and speed control failure on the main switchboard. Requires testing and line replacement."}"
              </p>
            </div>

            {/* Arrival OTP Display if status is onTheWay or arrived */}
            {(order.status === "onTheWay" || order.status === "arrived") && (
              <div style={{
                background: "rgba(245, 124, 32, 0.08)",
                border: "1px dashed var(--color-secondary)",
                borderRadius: "var(--radius-md)",
                padding: "10px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between"
              }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <KeyRound size={18} color="var(--color-secondary)" />
                  <div>
                    <div style={{ fontSize: "12px", fontWeight: "700", color: "var(--color-text)" }}>Arrival Verification Required</div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>Ask customer for 6-digit OTP upon doorstep arrival</div>
                  </div>
                </div>
                <button
                  className="btn btn-secondary btn-sm"
                  onClick={() => onTriggerOtp?.(order.id)}
                  style={{ fontSize: "12px", padding: "6px 14px" }}
                >
                  Verify OTP
                </button>
              </div>
            )}
          </div>

          {/* ─── Customer Uploaded Images & Documents (PDFs) ─── */}
          <div style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-lg)",
            padding: "16px 18px",
            border: "1px solid var(--color-border)",
            display: "flex",
            flexDirection: "column",
            gap: "12px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "8px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <div style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "8px",
                  background: "rgba(245, 124, 32, 0.12)",
                  color: "var(--color-secondary)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center"
                }}>
                  <Paperclip size={16} />
                </div>
                <div>
                  <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "var(--color-text)" }}>
                    Customer Uploaded Images & Documents (PDFs)
                  </h4>
                  <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                    Inspect files attached by customer before arrival
                  </span>
                </div>
              </div>
              <span style={{
                background: allAttachments.length > 0 ? "rgba(16, 185, 129, 0.15)" : "var(--color-background)",
                color: allAttachments.length > 0 ? "#10B981" : "var(--color-text-muted)",
                fontSize: "11px",
                fontWeight: "700",
                padding: "3px 10px",
                borderRadius: "12px",
                border: allAttachments.length > 0 ? "1px solid rgba(16, 185, 129, 0.35)" : "1px solid var(--color-border)"
              }}>
                {allAttachments.length > 0 ? `📎 ${allAttachments.length} File${allAttachments.length > 1 ? "s" : ""} Attached` : "No Files Attached"}
              </span>
            </div>

            {allAttachments.length > 0 ? (
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "12px" }}>
                {allAttachments.map((file, idx) => {
                  const isPdf = file.type === "pdf" || file.name?.toLowerCase().endsWith(".pdf");

                  if (isPdf) {
                    return (
                      <div
                        key={file.id || idx}
                        style={{
                          background: "var(--color-background)",
                          borderRadius: "var(--radius-md)",
                          border: "1px solid rgba(239, 68, 68, 0.35)",
                          padding: "12px 14px",
                          display: "flex",
                          flexDirection: "column",
                          justifyContent: "space-between",
                          gap: "10px",
                          boxShadow: "var(--shadow-sm)"
                        }}
                      >
                        <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
                          <div style={{
                            width: "38px",
                            height: "38px",
                            borderRadius: "8px",
                            background: "rgba(239, 68, 68, 0.12)",
                            color: "#EF4444",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            flexShrink: 0,
                            fontWeight: "800",
                            fontSize: "11px",
                            border: "1px solid rgba(239, 68, 68, 0.25)"
                          }}>
                            PDF
                          </div>
                          <div style={{ overflow: "hidden", flex: 1 }}>
                            <span style={{ fontSize: "12.5px", fontWeight: "700", color: "var(--color-text)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={file.name}>
                              {file.name}
                            </span>
                            <span style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>
                              {file.size || "PDF Document"} • {file.uploaded_at || "Attached"}
                            </span>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "8px", borderTop: "1px solid var(--color-border-light)", paddingTop: "8px" }}>
                          <button
                            className="btn btn-outline btn-sm"
                            style={{ flex: 1, fontSize: "11.5px", padding: "4px 8px", display: "flex", alignItems: "center", justifyContent: "center", gap: "5px", color: "var(--color-primary)" }}
                            onClick={() => window.open(file.url, "_blank")}
                            title="Open PDF Document in new tab"
                          >
                            <ExternalLink size={12} /> Open PDF
                          </button>
                          <a
                            href={file.url}
                            download={file.name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-sm"
                            style={{ padding: "4px 8px", display: "flex", alignItems: "center", justifyContent: "center" }}
                            title="Download PDF"
                          >
                            <Download size={12} />
                          </a>
                        </div>
                      </div>
                    );
                  }

                  // Photo / Image Attachment
                  return (
                    <div
                      key={file.id || idx}
                      style={{
                        background: "var(--color-background)",
                        borderRadius: "var(--radius-md)",
                        border: "1px solid var(--color-border)",
                        overflow: "hidden",
                        display: "flex",
                        flexDirection: "column",
                        boxShadow: "var(--shadow-sm)"
                      }}
                    >
                      {/* Image Thumbnail with Overlay */}
                      <div
                        onClick={() => setPreviewImage(file)}
                        style={{
                          height: "135px",
                          width: "100%",
                          position: "relative",
                          cursor: "pointer",
                          overflow: "hidden",
                          background: "#050B14"
                        }}
                        title="Click to view full size photo"
                      >
                        <img
                          src={file.url || file.previewUrl}
                          alt={file.name}
                          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.3s ease" }}
                          onMouseEnter={(e) => e.currentTarget.style.transform = "scale(1.06)"}
                          onMouseLeave={(e) => e.currentTarget.style.transform = "scale(1)"}
                          onError={(e) => {
                            if (file.previewUrl && e.currentTarget.src !== file.previewUrl) {
                              e.currentTarget.src = file.previewUrl;
                            }
                          }}
                        />
                        <div style={{
                          position: "absolute",
                          bottom: "6px",
                          right: "6px",
                          background: "rgba(0,0,0,0.75)",
                          color: "#FFFFFF",
                          padding: "3px 8px",
                          borderRadius: "4px",
                          fontSize: "10px",
                          fontWeight: "700",
                          display: "flex",
                          alignItems: "center",
                          gap: "4px",
                          backdropFilter: "blur(4px)"
                        }}>
                          <Maximize2 size={10} /> Zoom Photo
                        </div>
                      </div>

                      {/* File meta & actions */}
                      <div style={{ padding: "8px 10px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <div style={{ overflow: "hidden", flex: 1, paddingRight: "6px" }}>
                          <span style={{ fontSize: "12px", fontWeight: "700", color: "var(--color-text)", display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={file.name}>
                            {file.name}
                          </span>
                          <span style={{ fontSize: "10.5px", color: "var(--color-text-secondary)" }}>
                            {file.size || "Inspection Photo"}
                          </span>
                        </div>
                        <div style={{ display: "flex", gap: "4px" }}>
                          <button
                            onClick={() => setPreviewImage(file)}
                            className="btn btn-outline btn-sm"
                            style={{ padding: "4px 7px", fontSize: "11px" }}
                            title="Full screen view"
                          >
                            <Eye size={12} />
                          </button>
                          <a
                            href={file.url}
                            download={file.name}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-outline btn-sm"
                            style={{ padding: "4px 7px" }}
                            title="Download image"
                          >
                            <Download size={12} />
                          </a>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{
                background: "var(--color-background)",
                borderRadius: "var(--radius-md)",
                padding: "16px",
                border: "1px dashed var(--color-border-light)",
                textAlign: "center"
              }}>
                <p style={{ margin: 0, fontSize: "12.5px", color: "var(--color-text-secondary)" }}>
                  ℹ️ No photos or PDF documents were attached by the customer for this booking. You can request photos via customer chat if needed.
                </p>
              </div>
            )}
          </div>

          {/* Two-Column Layout: Customer Info & Financial Breakdown */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "16px" }}>
            
            {/* Customer Details Card */}
            <div style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              padding: "16px 18px",
              border: "1px solid var(--color-border)",
              display: "flex",
              flexDirection: "column",
              gap: "12px"
            }}>
              <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                <User size={15} color="var(--color-secondary)" /> Customer Information
              </h4>

              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                <div>
                  <div style={{ fontWeight: "700", fontSize: "14px", color: "var(--color-text)" }}>
                    {order.customer_name}
                  </div>
                  <div style={{ fontSize: "12px", color: "var(--color-secondary)", marginTop: "2px", fontWeight: "600" }}>
                    📞 {order.customer_mobile || "+91 98401 23456"}
                  </div>
                  {order.customer_email && (
                    <div style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", marginTop: "1px" }}>
                      ✉️ {order.customer_email}
                    </div>
                  )}
                  <div style={{ fontSize: "11px", color: "#10B981", marginTop: "2px", fontWeight: "600" }}>
                    ✓ {t("Verified Resident Customer")} • Coop Rating: 5.0 ★
                  </div>
                </div>
                <div style={{ display: "flex", gap: "6px" }}>
                  <a
                    href={`tel:${order.customer_mobile || "+919840123456"}`}
                    className="btn btn-outline btn-sm"
                    style={{ borderRadius: "50%", width: "34px", height: "34px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "#10B981", borderColor: "#10B981" }}
                    title="Call Customer"
                  >
                    <Phone size={14} />
                  </a>
                  <button
                    onClick={() => openPillarChat(order)}
                    className="btn btn-outline btn-sm"
                    style={{ borderRadius: "50%", width: "34px", height: "34px", padding: 0, display: "flex", alignItems: "center", justifyContent: "center", color: "var(--color-secondary)" }}
                    title="Message Customer"
                  >
                    <MessageSquare size={14} />
                  </button>
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--color-border-light)", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "12.5px" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "8px" }}>
                  <MapPin size={15} color="var(--color-text-muted)" style={{ marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <span style={{ fontWeight: "600", color: "var(--color-text)" }}>Service Location:</span>
                    <p style={{ margin: "2px 0 0 0", color: "var(--color-text-secondary)", lineHeight: "1.4" }}>
                      {order.service_address}
                    </p>
                    {order.landmark && (
                      <span style={{ fontSize: "11.5px", color: "var(--color-secondary)", display: "block", marginTop: "2px" }}>
                        Landmark: {order.landmark}
                      </span>
                    )}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "4px" }}>
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&destination=${order.customer_latitude || order.latitude || 13.0067},${order.customer_longitude || order.longitude || 80.2025}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-outline btn-sm"
                    style={{ fontSize: "11.5px", display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px" }}
                  >
                    <Navigation size={12} color="var(--color-secondary)" /> Open GPS Route <ExternalLink size={11} />
                  </a>
                </div>
              </div>
            </div>

            {/* Financial Payout Breakdown Card */}
            <div style={{
              background: "var(--color-surface)",
              borderRadius: "var(--radius-lg)",
              padding: "16px 18px",
              border: "1px solid var(--color-border)",
              display: "flex",
              flexDirection: "column",
              gap: "10px"
            }}>
              <h4 style={{ margin: 0, fontSize: "13px", fontWeight: "700", textTransform: "uppercase", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "6px" }}>
                <DollarSign size={15} color="#10B981" /> Financials & Payout
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "12.5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span style={{ color: "var(--color-text-secondary)" }}>Base Service Rate:</span>
                  <span style={{ fontWeight: "600", color: "var(--color-text)" }}>₹{baseAmount}</span>
                </div>

                {extraAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-secondary)" }}>
                    <span>Extra Materials/Labor:</span>
                    <span style={{ fontWeight: "600" }}>+₹{extraAmount}</span>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed var(--color-border-light)", paddingTop: "6px" }}>
                  <span style={{ fontWeight: "600", color: "var(--color-text)" }}>Gross Customer Bill:</span>
                  <span style={{ fontWeight: "700", color: "var(--color-text)" }}>₹{totalAmount}</span>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", color: "var(--color-text-muted)", fontSize: "11.5px" }}>
                  <span>Cooperative Share (8.5%):</span>
                  <span>-₹{platformFee}</span>
                </div>

                <div style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  background: "rgba(16, 185, 129, 0.1)",
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid rgba(16, 185, 129, 0.25)",
                  marginTop: "4px"
                }}>
                  <div>
                    <div style={{ fontSize: "10.5px", textTransform: "uppercase", fontWeight: "700", color: "#10B981" }}>Your Net Take-Home</div>
                    <div style={{ fontSize: "11px", color: "var(--color-text-secondary)" }}>Direct to Bank / PF Wallet</div>
                  </div>
                  <div style={{ fontSize: "1.2rem", fontWeight: "800", color: "#10B981" }}>
                    ₹{netEarnings}
                  </div>
                </div>

                <div style={{ fontSize: "11.5px", color: "var(--color-text-secondary)", display: "flex", alignItems: "center", gap: "5px", marginTop: "2px" }}>
                  <ShieldCheck size={13} color="#10B981" />
                  <span>Payment Mode: {order.payment_method || "Cash on Service / UPI"}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Collapsible Live Map Preview */}
          <div style={{
            background: "var(--color-surface)",
            borderRadius: "var(--radius-lg)",
            padding: "14px 18px",
            border: "1px solid var(--color-border)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: showMap ? "12px" : "0" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <Navigation size={16} color="var(--color-secondary)" />
                <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--color-text)" }}>Live Geospatial Transit Route</span>
              </div>
              <button
                onClick={() => setShowMap(!showMap)}
                className="btn btn-outline btn-sm"
                style={{ fontSize: "11px", padding: "3px 8px" }}
              >
                {showMap ? "Hide Map" : "Show Map"}
              </button>
            </div>

            {showMap && (
              <div style={{ borderRadius: "8px", overflow: "hidden", border: "1px solid var(--color-border-light)" }}>
                <LiveTrackingMap
                  customerLocation={{
                    lat: Number(order.customer_latitude || order.latitude || 13.0067),
                    lng: Number(order.customer_longitude || order.longitude || 80.2025)
                  }}
                  pillarLocation={(user?.current_lat != null && user?.current_lng != null) ? {
                    lat: Number(user.current_lat),
                    lng: Number(user.current_lng)
                  } : { lat: 13.0827, lng: 80.2707 }}
                  pillarName={user?.full_name || "You (Technician)"}
                  pillarRole="Pillar Technician"
                  height="200px"
                />
              </div>
            )}
          </div>

        </div>

        {/* ─── Modal Footer with Context-Aware Actions ─── */}
        <div
          style={{
            padding: "16px 24px",
            background: "var(--color-surface)",
            borderTop: "1px solid var(--color-border)",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px"
          }}
        >
          <button
            className="btn btn-outline"
            onClick={onClose}
            style={{ fontSize: "13px" }}
          >
            Close
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            {order.status === "pending" && (
              <>
                <button
                  className="btn btn-outline"
                  style={{ color: "var(--color-error)", borderColor: "var(--color-error)", fontSize: "13px" }}
                  onClick={() => {
                    onStatusChange(order.id, "rejected");
                    onClose();
                  }}
                >
                  <X size={15} /> Reject Job
                </button>
                <button
                  className="btn btn-success"
                  style={{ fontSize: "13px", padding: "8px 20px" }}
                  onClick={() => {
                    onStatusChange(order.id, "accepted");
                    onClose();
                  }}
                >
                  <Check size={15} /> Accept Job
                </button>
              </>
            )}

            {order.status === "accepted" && (
              <>
                <button
                  className="btn btn-outline btn-sm"
                  onClick={() => openPillarChat(order)}
                >
                  <MessageSquare size={14} /> Message Customer
                </button>
                <button
                  className="btn btn-primary"
                  style={{ fontSize: "13px", padding: "8px 20px" }}
                  onClick={() => {
                    onStatusChange(order.id, "onTheWay");
                    onClose();
                  }}
                >
                  <Navigation size={15} /> Start Travel
                </button>
              </>
            )}

            {order.status === "onTheWay" && (
              <button
                className="btn btn-warning"
                style={{ fontSize: "13px", padding: "8px 20px" }}
                onClick={() => onTriggerOtp?.(order.id)}
              >
                <KeyRound size={15} /> Verify Arrival OTP
              </button>
            )}

            {(order.status === "arrived" || order.status === "inProgress") && (
              <>
                <button
                  className="btn btn-outline"
                  style={{ fontSize: "13px" }}
                  onClick={() => onTriggerExtra?.(order)}
                >
                  <Tag size={15} /> Add Extra Charges
                </button>
                <button
                  className="btn btn-success"
                  style={{ fontSize: "13px", padding: "8px 20px" }}
                  onClick={() => onTriggerComplete?.(order)}
                >
                  <CheckCircle2 size={15} /> Finalize Bill & Complete
                </button>
              </>
            )}

            {order.status === "completed" ? (
              <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                {!cashConfirmed && order.payment_status !== "completed" ? (
                  <button
                    className="btn btn-success"
                    style={{ fontSize: "12.5px", padding: "8px 18px", display: "flex", alignItems: "center", gap: "6px", fontWeight: "700" }}
                    onClick={handleMarkPaymentComplete}
                    disabled={markingCash}
                  >
                    <CheckCircle2 size={16} />
                    <span>{markingCash ? "Confirming..." : "MARK PAYMENT COMPLETE"}</span>
                  </button>
                ) : (
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#10B981", fontWeight: "700", fontSize: "13px" }}>
                    <CheckCircle2 size={18} />
                    <span>Payment Confirmed ({order.payment_method || "HAND CASH"})</span>
                  </div>
                )}
                <button
                  className="btn btn-primary"
                  style={{ fontSize: "12.5px", padding: "8px 18px", display: "flex", alignItems: "center", gap: "6px" }}
                  onClick={() => onTriggerReceipt?.({
                    ...order,
                    payment_status: (cashConfirmed || order.payment_status === "completed") ? "PAID" : "pending",
                    payment_method: (cashConfirmed || order.payment_status === "completed") ? "HAND CASH" : (order.payment_method || "HAND CASH")
                  })}
                >
                  <Printer size={15} /> Generate & Print Receipt
                </button>
              </div>
            ) : (
              <button
                className="btn btn-outline"
                style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "5px" }}
                onClick={() => onTriggerReceipt?.(order)}
                title="Preview Proforma Tax Invoice / Receipt"
              >
                <Printer size={13} /> View Invoice / Receipt
              </button>
            )}
          </div>
        </div>

      </div>

      {/* Full-Screen Image Lightbox Preview Modal */}
      {previewImage && (
        <div
          className="modal-overlay"
          onClick={() => setPreviewImage(null)}
          style={{ zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px", background: "rgba(0,0,0,0.88)" }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              maxWidth: "850px",
              width: "100%",
              background: "var(--color-surface)",
              borderRadius: "var(--radius-xl)",
              overflow: "hidden",
              border: "1px solid var(--color-border)",
              boxShadow: "0 25px 50px rgba(0,0,0,0.5)"
            }}
          >
            <div style={{ padding: "14px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--color-border)" }}>
              <div>
                <span style={{ fontSize: "13px", fontWeight: "700", color: "var(--color-text)" }}>{previewImage.name}</span>
                <span style={{ fontSize: "11px", color: "var(--color-text-secondary)", marginLeft: "8px" }}>{previewImage.size}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <a
                  href={previewImage.url}
                  download={previewImage.name}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-outline btn-sm"
                  style={{ display: "flex", alignItems: "center", gap: "5px", fontSize: "12px" }}
                >
                  <Download size={13} /> Download
                </a>
                <button
                  className="btn-icon"
                  onClick={() => setPreviewImage(null)}
                  style={{ borderRadius: "50%", padding: "6px" }}
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div style={{ maxHeight: "75vh", overflow: "auto", display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "#050B14" }}>
              <img
                src={previewImage.url || previewImage.previewUrl}
                alt={previewImage.name}
                style={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", borderRadius: "8px" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
