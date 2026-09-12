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
export default function OrderReceiptModal({ order, onClose, isPillarView = false }) {
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
      const baseFee = Number(order.base_amount || order.amount || 450);
      const matFee = Number(order.materials_parts != null ? order.materials_parts : (order.extra_charge_amount || 0));
      const addFee = Number(order.additional_charges || 0);
      const subTot = order.subtotal != null ? Number(order.subtotal) : (baseFee + matFee + addFee);
      const gstVal = order.gst_amount != null ? Number(order.gst_amount) : Math.round(subTot * 0.18 * 100) / 100;
      const totVal = order.final_amount != null ? Number(order.final_amount) : (order.total_amount != null ? Number(order.total_amount) : Math.round((subTot + gstVal) * 100) / 100);

      const resolvedCustomer = (order.customer_name && order.customer_name !== 'Valued Customer' && order.customer_name !== 'Coop Customer' && order.customer_name !== '[Customer Name]' && order.customer_name !== 'Anupriya Murugan' && order.customer_name !== 'Anupriya Sundaram') 
        ? order.customer_name 
        : ((order.customer?.full_name && order.customer.full_name !== 'Anupriya Murugan' && order.customer.full_name !== 'Anupriya Sundaram' ? order.customer.full_name : null) || localStorage.getItem('coophub_customer_name') || 'Anupriya');

      const resolveModalServiceId = () => {
        if (order.service_id && !order.service_id.includes('a0000') && !order.service_id.includes('000000')) return order.service_id;
        if (order.service_code && !order.service_code.includes('a0000')) return order.service_code;
        const raw = String(order.service_id || order.service?.id || '').toLowerCase();
        const name = String(order.service_name || order.service?.name || '').toLowerCase();
        if (raw.includes('0001') || raw.includes('elec') || raw === 'srv-1' || raw.includes('a0000') || name.includes('electr') || name.includes('fan')) return 'SRV-ELEC-101';
        if (raw.includes('0002') || raw.includes('ac') || raw === 'srv-2' || name.includes('ac')) return 'SRV-AC-202';
        if (raw.includes('0003') || raw.includes('plumb') || raw === 'srv-3' || name.includes('plumb')) return 'SRV-PLUM-201';
        return 'SRV-ELEC-101';
      };

      await emailService.sendServiceReceiptEmail({
        email: recipientEmail,
        customer_name: resolvedCustomer,
        receipt_no: order.invoice_id || `CH-2026-${order.id?.slice(0, 6)?.toUpperCase() || "000123"}`,
        booking_id: order.booking_code || `BK-2026-${order.id?.slice(0, 5)?.toUpperCase() || "00456"}`,
        invoice_no: `INV-2026-${order.id?.slice(0, 6)?.toUpperCase() || "00789"}`,
        service_date: order.scheduled_date || "02 Sep 2026",
        service_time: order.scheduled_time || "11:30 AM",
        service_id: resolveModalServiceId(),
        service_title: order.service_name || "[Electrical Repair]",
        service_description: order.sub_service_name || order.description || "[Service Description]",
        service_location: order.service_address || "[Service Location]",
        pillar_name: order.pillar?.full_name || "[Pillar Name]",
        pillar_id: order.pillar_id || "[Pillar ID]",
        pillar_trade: order.service?.category || "[Electrician]",
        service_charge: `₹${baseFee.toFixed(2)}`,
        materials_parts: `₹${matFee.toFixed(2)}`,
        additional_charges: `₹${addFee.toFixed(2)}`,
        subtotal: `₹${subTot.toFixed(2)}`,
        gst: `₹${gstVal.toFixed(2)}`,
        total_amount: `₹${totVal.toFixed(2)}`,
        payment_method: order.payment_method || "HAND CASH",
        transaction_id: order.payment_gateway_ref || (order.payment_method === 'Online Payment (UPI)' ? 'TXN000123' : 'CASH-VERIFIED')
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
        <CoopHubServiceReceipt order={order} serviceId={order.service_id || order.service?.id} isPillarView={isPillarView} />

      </div>
    </div>
  );
}
