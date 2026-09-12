import React, { useState, useEffect } from "react";
import { CheckCircle2, AlertCircle, X, Loader2, DollarSign, Wrench, ShieldCheck, Tag, FileText, Calculator } from "lucide-react";
import { pillarOrderService } from "../../../services/pillar/orderService";

export default function FinalizeBillModal({ order, onClose, onSuccess }) {
  // Initial state with defaults from order or standard tariff (zero default extra charges)
  const initialBase = Number(order?.service_charge ?? order?.base_amount ?? order?.amount ?? 350);
  const initialMaterials = Number(order?.materials_parts ?? (order?.extra_charge_status === 'accepted' ? order?.extra_charge_amount : 0) ?? 0);
  const initialAdditional = Number(order?.additional_charges ?? 0);

  const defaultWorkSummary = order?.work_summary || order?.completion_notes || (order?.service_name ? `Inspected, serviced, and tested ${order.service_name}. Cleaned contacts and verified safe operation.` : "");
  const [workSummary, setWorkSummary] = useState(defaultWorkSummary);
  const [serviceCharge, setServiceCharge] = useState(String(initialBase));
  const [materialsParts, setMaterialsParts] = useState(String(initialMaterials));
  const [materialsDescription, setMaterialsDescription] = useState(order?.materials_parts_description || (order?.extra_charge_reason || ""));
  const [additionalCharges, setAdditionalCharges] = useState(String(initialAdditional));
  const [additionalDescription, setAdditionalDescription] = useState(order?.additional_charges_description || "");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Live Calculations
  const numService = parseFloat(serviceCharge) || 0;
  const numMaterials = parseFloat(materialsParts) || 0;
  const numAdditional = parseFloat(additionalCharges) || 0;

  const subtotal = numService + numMaterials + numAdditional;
  const gst = Math.round(subtotal * 0.18 * 100) / 100;
  const total = Math.round((subtotal + gst) * 100) / 100;

  // Cooperative Breakdown
  const coopCommission = Math.round(numService * 0.0805 * 100) / 100; // ~₹64.40 on 800
  const pillarEarnings = Math.round((subtotal - coopCommission) * 100) / 100; // ~₹1,085.60

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (numService <= 0) {
      setError("Service charge must be greater than zero.");
      return;
    }
    if (!workSummary.trim()) {
      setError("Please enter what work was done so the customer can review it on the bill.");
      return;
    }

    setLoading(true);
    setError(null);

    const fullReason = `Work Done: ${workSummary.trim()}${materialsDescription.trim() ? ' • Parts: ' + materialsDescription.trim() : ''}${additionalDescription.trim() ? ' • Extra: ' + additionalDescription.trim() : ''}`.trim();

    const payload = {
      status: "completed",
      work_summary: workSummary.trim(),
      completion_notes: workSummary.trim(),
      service_charge: numService,
      materials_parts: numMaterials,
      materials_parts_description: materialsDescription.trim(),
      additional_charges: numAdditional,
      additional_charges_description: additionalDescription.trim(),
      subtotal: subtotal,
      gst_amount: gst,
      final_amount: total,
      amount: numService,
      extra_charge_amount: numMaterials + numAdditional,
      extra_charge_reason: fullReason,
      extra_charge_status: (numMaterials > 0 || numAdditional > 0) ? "accepted" : "none",
      pillar_earnings: pillarEarnings,
      cooperative_commission: coopCommission,
      settlement_status: order.payment_status === "completed" ? "Settled" : "Pending Payment",
      payment_status: order.payment_status === "completed" ? "completed" : "pending",
      payment_method: order.payment_status === "completed" ? (order.payment_method || "HAND CASH") : null,
      payment_gateway_ref: order.payment_status === "completed" ? (order.payment_gateway_ref || "CASH-VERIFIED") : null,
      completed_at: new Date().toISOString()
    };

    const { success, error: reqError } = await pillarOrderService.completeOrderAndFinalizeBill(order.id, payload);
    setLoading(false);

    if (reqError) {
      setError(reqError.message || "Failed to finalize bill. Please try again.");
    } else {
      onSuccess?.();
      onClose();
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1200, display: "flex", alignItems: "center", justifyContent: "center", padding: "16px", background: "rgba(15, 23, 42, 0.75)" }}>
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxWidth: "560px", 
          width: "100%",
          maxHeight: "90vh",
          overflowY: "auto",
          borderRadius: "16px",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.35)",
          padding: 0
        }}
      >
        {/* Header */}
        <div style={{
          padding: "18px 24px",
          background: "#162238",
          color: "#FFFFFF",
          borderTopLeftRadius: "16px",
          borderTopRightRadius: "16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div style={{
              width: "36px",
              height: "36px",
              borderRadius: "8px",
              background: "rgba(255, 121, 0, 0.2)",
              color: "#FF7900",
              display: "flex",
              alignItems: "center",
              justifyContent: "center"
            }}>
              <Calculator size={20} />
            </div>
            <div>
              <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "800", letterSpacing: "0.3px" }}>
                Maintain Charges & Finalize Receipt
              </h3>
              <span style={{ fontSize: "11px", color: "#94A3B8" }}>
                Pillar & Admin Tariff Maintenance Suite
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.1)", border: "none", color: "#FFFFFF", borderRadius: "8px", padding: "6px", cursor: "pointer" }}
          >
            <X size={16} />
          </button>
        </div>

        <form onSubmit={handleSubmit} style={{ padding: "20px 24px", display: "flex", flexDirection: "column", gap: "16px" }}>
          {error && (
            <div style={{ background: "#FEE2E2", color: "#B91C1C", padding: "12px", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px" }}>
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          {/* Order Summary Pill */}
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", padding: "12px 16px", borderRadius: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12.5px" }}>
            <div>
              <span style={{ color: "#64748B", display: "block", fontSize: "10.5px", textTransform: "uppercase", fontWeight: "700" }}>Service & Booking</span>
              <span style={{ fontWeight: "700", color: "#162238" }}>{order.service_name || "Electrical Repair"}</span>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ color: "#64748B", display: "block", fontSize: "10.5px", textTransform: "uppercase", fontWeight: "700" }}>Booking Ref</span>
              <span style={{ fontWeight: "700", color: "#FF7900", fontFamily: "monospace" }}>{order.booking_code || order.id?.slice(0, 8)}</span>
            </div>
          </div>

          {/* ─── WORK DONE & SERVICE SUMMARY ─── */}
          <div style={{ background: "#FFFFFF", border: "1.5px solid #CBD5E1", borderRadius: "12px", padding: "14px 16px", display: "flex", flexDirection: "column", gap: "6px" }}>
            <label style={{ fontSize: "12.5px", fontWeight: "800", color: "#162238", display: "flex", alignItems: "center", gap: "6px" }}>
              <Wrench size={15} color="#FF7900" />
              <span>Works Performed & Service Report (Shown on Customer Bill) *</span>
            </label>
            <textarea
              rows={3}
              value={workSummary}
              onChange={(e) => setWorkSummary(e.target.value)}
              placeholder="Detail the work you did (e.g., Inspected main switchboard, replaced faulty 20A MCB, serviced ceiling fan capacitor and verified load balance)..."
              required
              style={{
                width: "100%",
                fontSize: "12.5px",
                padding: "8px 10px",
                borderRadius: "8px",
                border: "1px solid #CBD5E1",
                fontFamily: "inherit",
                resize: "vertical",
                minHeight: "68px"
              }}
            />
            <span style={{ fontSize: "11px", color: "#64748B" }}>
              The customer will review this complete work summary directly on their bill before making the payment.
            </span>
          </div>

          {/* ─── CHARGES MAINTENANCE INPUTS ─── */}
          <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <span style={{ fontSize: "12px", fontWeight: "800", textTransform: "uppercase", color: "#162238", letterSpacing: "0.5px" }}>
              Itemized Charges Maintenance
            </span>

            {/* 1. Base Service Charge */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: "700", color: "#162238" }}>
                  1. Service Charge (Base Labor)
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#64748B" }}>₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-input"
                    value={serviceCharge}
                    onChange={(e) => setServiceCharge(e.target.value)}
                    style={{ width: "120px", height: "34px", padding: "0 8px", fontSize: "14px", fontWeight: "700", textAlign: "right", borderRadius: "6px" }}
                    placeholder="800.00"
                    required
                  />
                </div>
              </div>
              <span style={{ fontSize: "11px", color: "#64748B" }}>
                Standard diagnostic, inspection, and service labor tariff.
              </span>
            </div>

            {/* 2. Materials & Parts */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: "700", color: "#162238" }}>
                  2. Materials / Replacement Parts
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#64748B" }}>₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-input"
                    value={materialsParts}
                    onChange={(e) => setMaterialsParts(e.target.value)}
                    style={{ width: "120px", height: "34px", padding: "0 8px", fontSize: "14px", fontWeight: "700", textAlign: "right", borderRadius: "6px" }}
                    placeholder="250.00"
                  />
                </div>
              </div>
              <input
                type="text"
                className="form-input"
                value={materialsDescription}
                onChange={(e) => setMaterialsDescription(e.target.value)}
                style={{ width: "100%", height: "32px", padding: "0 8px", fontSize: "12px", borderRadius: "6px", marginTop: "4px" }}
                placeholder="Description of materials used (e.g. Capacitor, wires, fuse)"
              />
            </div>

            {/* 3. Additional Charges */}
            <div style={{ background: "#FFFFFF", border: "1px solid #E2E8F0", borderRadius: "10px", padding: "12px 14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <label style={{ fontSize: "12.5px", fontWeight: "700", color: "#162238" }}>
                  3. Additional Charges
                </label>
                <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                  <span style={{ fontSize: "14px", fontWeight: "700", color: "#64748B" }}>₹</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    className="form-input"
                    value={additionalCharges}
                    onChange={(e) => setAdditionalCharges(e.target.value)}
                    style={{ width: "120px", height: "34px", padding: "0 8px", fontSize: "14px", fontWeight: "700", textAlign: "right", borderRadius: "6px" }}
                    placeholder="100.00"
                  />
                </div>
              </div>
              <input
                type="text"
                className="form-input"
                value={additionalDescription}
                onChange={(e) => setAdditionalDescription(e.target.value)}
                style={{ width: "100%", height: "32px", padding: "0 8px", fontSize: "12px", borderRadius: "6px", marginTop: "4px" }}
                placeholder="Reason for additional charges (e.g. Extra conduit routing)"
              />
            </div>
          </div>

          {/* ─── LIVE RECEIPT CHARGES SUMMARY ─── */}
          <div style={{ background: "#F8FAFC", border: "1px solid #E2E8F0", borderRadius: "12px", padding: "14px 18px", display: "flex", flexDirection: "column", gap: "8px", fontSize: "13px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B" }}>
              <span>Subtotal (1 + 2 + 3):</span>
              <span style={{ fontWeight: "700", color: "#162238" }}>₹{subtotal.toFixed(2)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B" }}>
              <span>GST (18% Tax):</span>
              <span style={{ fontWeight: "600", color: "#162238" }}>₹{gst.toFixed(2)}</span>
            </div>

            {/* Prominent Total Bar */}
            <div style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              background: "#162238",
              color: "#FFFFFF",
              borderRadius: "8px",
              padding: "10px 14px",
              marginTop: "4px",
              borderLeft: "4px solid #FF7900"
            }}>
              <span style={{ fontSize: "13px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                CUSTOMER TOTAL
              </span>
              <span style={{ fontSize: "18px", fontWeight: "900", color: "#FF7900" }}>
                ₹{total.toFixed(2)}
              </span>
            </div>

            {/* Cooperative Breakdown Note */}
            <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px dashed #CBD5E1", paddingTop: "8px", marginTop: "4px", fontSize: "12px" }}>
              <span style={{ color: "#059669", fontWeight: "700" }}>Your Take-Home: ₹{pillarEarnings.toFixed(2)}</span>
              <span style={{ color: "#64748B" }}>Coop Fund (8.5%): ₹{coopCommission.toFixed(2)}</span>
            </div>
          </div>

          {/* Actions */}
          <div style={{ display: "flex", gap: "10px", marginTop: "8px" }}>
            <button
              type="button"
              className="btn btn-outline"
              onClick={onClose}
              style={{ flex: 1, height: "42px", fontSize: "13px" }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary"
              style={{ flex: 2, height: "42px", fontSize: "13px", fontWeight: "700", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
            >
              {loading ? <Loader2 size={16} className="spinner" /> : <CheckCircle2 size={16} />}
              {loading ? "Saving & Finalizing..." : "Confirm & Generate Receipt"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
