import React, { useState } from "react";
import { Printer, X, Mail, Check, Loader2 } from "lucide-react";
import CoopHubServiceReceipt from "./CoopHubServiceReceipt";
import { emailService } from "../../services/email/emailService";

/**
 * OrderReceiptModal
 * 
 * Centered modal overlay that renders the official COOP HUB Service Receipt UI Template.
 * Includes print/PDF action bar, email dispatch to customer, and clean dismissal.
 */
export default function OrderReceiptModal({ order, onClose }) {
  const [emailSending, setEmailSending] = useState(false);
  const [emailSent, setEmailSent] = useState(false);

  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const handleSendEmail = async () => {
    setEmailSending(true);
    try {
      const recipientEmail = order.customer_email || order.customer?.email || "customer@coophub.in";
      await emailService.sendServiceReceiptEmail({
        email: recipientEmail,
        customer_name: order.customer_name || "[Customer Name]",
        receipt_no: order.invoice_id || `CH-2026-${order.id?.slice(0, 6)?.toUpperCase() || "000123"}`,
        booking_id: order.booking_code || `BK-2026-${order.id?.slice(0, 5)?.toUpperCase() || "00456"}`,
        invoice_no: `INV-2026-${order.id?.slice(0, 6)?.toUpperCase() || "00789"}`,
        service_date: order.scheduled_date || "02 Sep 2026",
        service_time: order.scheduled_time || "11:30 AM",
        service_id: order.service_id || order.service?.id || "SRV-ELEC-101",
        service_title: order.service_name || "[Electrical Repair]",
        service_description: order.sub_service_name || order.description || "[Service Description]",
        service_location: order.service_address || "[Service Location]",
        pillar_name: order.pillar?.full_name || "[Pillar Name]",
        pillar_id: order.pillar_id || "[Pillar ID]",
        pillar_trade: order.service?.category || "[Electrician]",
        service_charge: `₹${Number(order.base_amount || 800).toFixed(2)}`,
        materials_parts: `₹${Number(order.extra_charge_amount || 250).toFixed(2)}`,
        additional_charges: "₹100.00",
        subtotal: `₹${(Number(order.base_amount || 800) + Number(order.extra_charge_amount || 250) + 100).toFixed(2)}`,
        gst: `₹${((Number(order.base_amount || 800) + Number(order.extra_charge_amount || 250) + 100) * 0.18).toFixed(2)}`,
        total_amount: `₹${Number(order.final_amount || order.total_amount || 1357).toFixed(2)}`,
        payment_method: order.payment_method || "UPI",
        transaction_id: order.payment_gateway_ref || "TXN000123"
      });

      setEmailSent(true);
      setTimeout(() => setEmailSent(false), 3500);
    } catch (err) {
      console.error("Receipt email dispatch note:", err);
    } finally {
      setEmailSending(false);
    }
  };

  return (
    <div 
      className="modal-overlay receipt-modal-overlay" 
      onClick={onClose} 
      style={{ 
        zIndex: 1300, 
        display: "flex", 
        alignItems: "center", 
        justifyContent: "center", 
        padding: "16px", 
        background: "rgba(15, 23, 42, 0.75)",
        backdropFilter: "blur(4px)"
      }}
    >
      <div
        className="modal-container"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "760px",
          width: "100%",
          maxHeight: "94vh",
          overflowY: "auto",
          display: "flex",
          flexDirection: "column",
          gap: "12px",
          padding: 0
        }}
      >
        {/* Floating Actions Toolbar (hidden during print) */}
        <div 
          className="no-print"
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            background: "#162238",
            color: "#FFFFFF",
            padding: "10px 18px",
            borderRadius: "12px",
            boxShadow: "0 4px 12px rgba(0,0,0,0.2)",
            flexWrap: "wrap",
            gap: "8px"
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF7900" }}></span>
            <span style={{ fontSize: "13px", fontWeight: "700", letterSpacing: "0.3px" }}>
              COOP HUB Service Receipt
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            {/* Email Receipt Button */}
            <button
              onClick={handleSendEmail}
              disabled={emailSending}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: emailSent ? "#10B981" : "rgba(255,255,255,0.12)",
                color: "#FFFFFF",
                border: "1px solid rgba(255,255,255,0.25)",
                borderRadius: "8px",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "all 0.2s ease"
              }}
              title="Dispatch Official Receipt Copy to Customer Email"
            >
              {emailSending ? <Loader2 size={14} className="spinner" /> : emailSent ? <Check size={14} /> : <Mail size={14} />}
              {emailSent ? "Email Dispatched!" : "Email to Customer"}
            </button>

            {/* Print / Save as PDF Button */}
            <button
              onClick={handlePrint}
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "6px",
                background: "#FF7900",
                color: "#FFFFFF",
                border: "none",
                borderRadius: "8px",
                padding: "6px 14px",
                fontSize: "12px",
                fontWeight: "700",
                cursor: "pointer",
                transition: "background 0.2s ease"
              }}
              onMouseEnter={(e) => e.currentTarget.style.background = "#E66A00"}
              onMouseLeave={(e) => e.currentTarget.style.background = "#FF7900"}
              title="Print Receipt or Save as PDF"
            >
              <Printer size={14} /> Print / Save as PDF
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              style={{
                background: "rgba(255,255,255,0.1)",
                border: "none",
                color: "#FFFFFF",
                borderRadius: "8px",
                padding: "6px 10px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}
              title="Close Receipt"
            >
              <X size={16} />
            </button>
          </div>
        </div>

        {/* ─── DYNAMIC COOP HUB SERVICE RECEIPT (WITH MAINTAINED CHARGES) ─── */}
        <CoopHubServiceReceipt order={order} serviceId={order.service_id || order.service?.id} />

      </div>
    </div>
  );
}
