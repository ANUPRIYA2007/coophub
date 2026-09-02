import React from "react";
import coopHubLogo from "../../assets/branding/coop-hub-logo.png";

/**
 * COOP HUB Service Receipt UI Template
 * 
 * Professional, clean, community-oriented service receipt design.
 * Maintains charges dynamically from Pillar & Admin while preserving official placeholder defaults.
 * Fully responsive: Desktop, Tablet, Mobile, and Print.
 */
export default function CoopHubServiceReceipt({
  order = null,

  // Optional overrides (Falls back to order data or exact template placeholders)
  receiptNo,
  bookingId,
  invoiceNo,
  date,
  status,

  customerName,
  customerPhone,
  customerEmail,
  customerAddress,

  pillarName,
  pillarId,
  pillarTrade,
  pillarVerification,
  pillarRating,

  serviceTitle,
  serviceDescription,
  serviceDate,
  serviceTime,
  serviceLocation,

  serviceCharge,
  materialsParts,
  additionalCharges,
  subtotal,
  gst,
  total,

  paymentMethod,
  transactionId,
  paymentDate,
  paymentStatus,

  pillarEarnings,
  cooperativeCommission,
  settlementStatus,

  supportEmail = "support@coophub.in",
  supportPhone = "1800-425-COOP"
}) {
  // ─── DYNAMIC FIELD EXTRACTION & PLACEHOLDER FALLBACKS ───
  const displayReceiptNo = receiptNo || order?.invoice_id || (order?.id ? `CH-2026-${order.id.slice(0, 6).toUpperCase()}` : "CH-2026-000123");
  const displayBookingId = bookingId || order?.booking_code || (order?.id ? `BK-2026-${order.id.slice(0, 5).toUpperCase()}` : "BK-2026-00456");
  const displayInvoiceNo = invoiceNo || (order?.id ? `INV-2026-${order.id.slice(0, 6).toUpperCase()}` : "INV-2026-00789");
  const displayDate = date || order?.scheduled_date || "02 Sep 2026";
  const displayStatus = status || (order?.status ? (order.status === "completed" ? "PAID" : order.status.toUpperCase()) : "PAID");

  const displayCustomerName = customerName || order?.customer_name || "[Customer Name]";
  const displayCustomerPhone = customerPhone || order?.customer_mobile || "[Phone Number]";
  const displayCustomerEmail = customerEmail || order?.customer_email || "[Email Address]";
  const displayCustomerAddress = customerAddress || order?.service_address || order?.address_line || "[Service Address]";

  const displayPillarName = pillarName || order?.pillar?.full_name || order?.pillar_name || "[Pillar Name]";
  const displayPillarId = pillarId || order?.pillar_id || "[Pillar ID]";
  const displayPillarTrade = pillarTrade || order?.service?.category || order?.pillar_trade || "[Electrician]";
  const displayPillarVerification = pillarVerification || "Verified";
  const displayPillarRating = pillarRating || (order?.pillar?.rating ? `★ ${order.pillar.rating}` : "★ 4.8");

  const displayServiceTitle = serviceTitle || order?.service_name || order?.service?.name || "[Electrical Repair]";
  const displayServiceDesc = serviceDescription || order?.sub_service_name || order?.service_description || order?.description || "[Service Description]";
  const displayServiceDate = serviceDate || order?.scheduled_date || "[Service Date]";
  const displayServiceTime = serviceTime || order?.scheduled_time || "[Service Time]";
  const displayServiceLoc = serviceLocation || order?.service_address || "[Service Location]";

  // ─── CHARGES & COOPERATIVE BREAKDOWN MAINTENANCE ───
  const rawService = order?.service_charge ?? order?.base_amount ?? order?.amount;
  const rawMaterials = order?.materials_parts ?? order?.extra_charge_amount;
  const rawAdditional = order?.additional_charges;

  const numService = serviceCharge !== undefined
    ? (typeof serviceCharge === "number" ? serviceCharge : parseFloat(String(serviceCharge).replace(/[^0-9.]/g, "")))
    : (rawService !== undefined ? Number(rawService) : 800);

  const numMaterials = materialsParts !== undefined
    ? (typeof materialsParts === "number" ? materialsParts : parseFloat(String(materialsParts).replace(/[^0-9.]/g, "")))
    : (rawMaterials !== undefined ? Number(rawMaterials) : 250);

  const numAdditional = additionalCharges !== undefined
    ? (typeof additionalCharges === "number" ? additionalCharges : parseFloat(String(additionalCharges).replace(/[^0-9.]/g, "")))
    : (rawAdditional !== undefined ? Number(rawAdditional) : 100);

  const numSubtotal = numService + numMaterials + numAdditional;
  const numGst = Math.round(numSubtotal * 0.18 * 100) / 100;
  const numTotal = Math.round((numSubtotal + numGst) * 100) / 100;

  const numCoopCommission = Math.round(numService * 0.0805 * 100) / 100;
  const numPillarEarnings = Math.round((numSubtotal - numCoopCommission) * 100) / 100;

  const displayServiceCharge = serviceCharge || `₹${numService.toFixed(2)}`;
  const displayMaterialsParts = materialsParts || `₹${numMaterials.toFixed(2)}`;
  const displayAdditionalCharges = additionalCharges || `₹${numAdditional.toFixed(2)}`;
  const displaySubtotal = subtotal || `₹${numSubtotal.toFixed(2)}`;
  const displayGst = gst || `₹${numGst.toFixed(2)}`;
  const displayTotal = total || `₹${numTotal.toFixed(2)}`;

  const displayPaymentMethod = paymentMethod || order?.payment_method || "[UPI]";
  const displayTransactionId = transactionId || order?.payment_gateway_ref || "[TXN000123]";
  const displayPaymentDate = paymentDate || order?.scheduled_date || "[02 Sep 2026]";
  const displayPaymentStatus = paymentStatus || "PAID";

  const displayPillarEarnings = pillarEarnings || `₹${numPillarEarnings.toFixed(2)}`;
  const displayCoopCommission = cooperativeCommission || `₹${numCoopCommission.toFixed(2)}`;
  const displaySettlementStatus = settlementStatus || order?.settlement_status || "[Settled]";

  return (
    <div className="coophub-receipt-wrapper" style={{ width: "100%", display: "flex", justifyContent: "center" }}>
      {/* CSS Styles for Responsiveness & Print */}
      <style>{`
        .coophub-receipt-card {
          width: 100%;
          max-width: 720px;
          background: #FFFFFF;
          color: #162238;
          border: 1px solid #E2E8F0;
          border-radius: 16px;
          box-shadow: 0 10px 30px rgba(22, 34, 56, 0.08);
          padding: 36px 40px;
          font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
          box-sizing: border-box;
          margin: 0 auto;
        }

        .coophub-receipt-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }

        .coophub-receipt-info-grid {
          display: grid;
          grid-template-columns: repeat(5, 1fr);
          gap: 12px;
          background: #F8FAFC;
          border: 1px solid #E2E8F0;
          border-radius: 10px;
          padding: 14px 18px;
        }

        .coophub-charges-table {
          width: 100%;
          border-collapse: collapse;
        }

        .coophub-charges-table th {
          text-align: left;
          padding: 10px 0;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: #64748B;
          border-bottom: 1px solid #CBD5E1;
        }

        .coophub-charges-table td {
          padding: 10px 0;
          font-size: 13.5px;
          color: #162238;
          border-bottom: 1px solid #F1F5F9;
        }

        @media (max-width: 680px) {
          .coophub-receipt-card {
            padding: 24px 18px !important;
            border-radius: 12px !important;
          }
          .coophub-receipt-grid-2 {
            grid-template-columns: 1fr !important;
            gap: 20px !important;
          }
          .coophub-receipt-info-grid {
            grid-template-columns: 1fr 1fr !important;
            gap: 12px !important;
          }
          .coophub-header-container {
            flex-direction: column !important;
            align-items: flex-start !important;
            gap: 16px !important;
          }
          .coophub-header-right {
            text-align: left !important;
          }
        }

        @media print {
          body * {
            visibility: hidden;
          }
          .coophub-receipt-card, .coophub-receipt-card * {
            visibility: visible;
          }
          .coophub-receipt-card {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            box-shadow: none !important;
            border: none !important;
            padding: 20px !important;
          }
        }
      `}</style>

      <div className="coophub-receipt-card">

        {/* ══════════════════════════════════════════════════════════
            HEADER
            [COOP HUB LOGO]                         SERVICE RECEIPT
            Cooperative Service Platform
           ══════════════════════════════════════════════════════════ */}
        <div 
          className="coophub-header-container"
          style={{ 
            display: "flex", 
            justifyContent: "space-between", 
            alignItems: "center", 
            borderBottom: "2px solid #162238", 
            paddingBottom: "20px", 
            marginBottom: "20px" 
          }}
        >
          {/* Logo & Platform Subtitle */}
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {coopHubLogo ? (
              <img 
                src={coopHubLogo} 
                alt="COOP HUB Logo" 
                style={{ height: "52px", width: "auto", objectFit: "contain", display: "block" }} 
              />
            ) : (
              <div style={{
                background: "#162238",
                color: "#FF7900",
                fontWeight: "900",
                padding: "8px 14px",
                borderRadius: "8px",
                fontSize: "13px",
                letterSpacing: "0.5px"
              }}>
                [COOP HUB LOGO]
              </div>
            )}
            <div>
              <div style={{ fontSize: "12px", fontWeight: "600", color: "#64748B", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Cooperative Service Platform
              </div>
              <div style={{ fontSize: "11px", color: "#94A3B8" }}>
                Trusted • Transparent • Cooperative
              </div>
            </div>
          </div>

          {/* Receipt Title with Navy & Orange Accent */}
          <div className="coophub-header-right" style={{ textAlign: "right" }}>
            <h1 style={{ margin: 0, fontSize: "22px", fontWeight: "900", color: "#162238", letterSpacing: "1px", textTransform: "uppercase" }}>
              SERVICE RECEIPT
            </h1>
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginTop: "4px" }}>
              <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#FF7900", display: "inline-block" }}></span>
              <span style={{ fontSize: "11px", fontWeight: "700", color: "#FF7900", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Official Service Record
              </span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            RECEIPT INFORMATION
            Receipt No | Booking ID | Invoice No | Date | Status
           ══════════════════════════════════════════════════════════ */}
        <div className="coophub-receipt-info-grid" style={{ marginBottom: "24px" }}>
          <div>
            <div style={{ fontSize: "10.5px", textTransform: "uppercase", fontWeight: "700", color: "#64748B", letterSpacing: "0.3px" }}>
              Receipt No
            </div>
            <div style={{ fontSize: "13px", fontWeight: "800", color: "#162238", marginTop: "3px" }}>
              {displayReceiptNo}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "10.5px", textTransform: "uppercase", fontWeight: "700", color: "#64748B", letterSpacing: "0.3px" }}>
              Booking ID
            </div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#FF7900", marginTop: "3px" }}>
              {displayBookingId}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "10.5px", textTransform: "uppercase", fontWeight: "700", color: "#64748B", letterSpacing: "0.3px" }}>
              Invoice No
            </div>
            <div style={{ fontSize: "13px", fontWeight: "700", color: "#162238", marginTop: "3px" }}>
              {displayInvoiceNo}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "10.5px", textTransform: "uppercase", fontWeight: "700", color: "#64748B", letterSpacing: "0.3px" }}>
              Date
            </div>
            <div style={{ fontSize: "13px", fontWeight: "600", color: "#162238", marginTop: "3px" }}>
              {displayDate}
            </div>
          </div>

          <div>
            <div style={{ fontSize: "10.5px", textTransform: "uppercase", fontWeight: "700", color: "#64748B", letterSpacing: "0.3px" }}>
              Status
            </div>
            <div style={{ marginTop: "3px" }}>
              <span style={{
                display: "inline-flex",
                alignItems: "center",
                gap: "4px",
                background: "#ECFDF5",
                color: "#059669",
                border: "1px solid #A7F3D0",
                fontSize: "11px",
                fontWeight: "800",
                padding: "2px 8px",
                borderRadius: "12px",
                textTransform: "uppercase"
              }}>
                ✓ {displayStatus}
              </span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            CUSTOMER & PILLAR DETAILS (2-Column Grid)
           ══════════════════════════════════════════════════════════ */}
        <div className="coophub-receipt-grid-2" style={{ marginBottom: "24px" }}>
          
          {/* CUSTOMER DETAILS */}
          <div style={{ border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px 18px", background: "#FFFFFF" }}>
            <div style={{ 
              fontSize: "12px", 
              fontWeight: "800", 
              textTransform: "uppercase", 
              color: "#162238", 
              letterSpacing: "0.5px",
              borderBottom: "1px solid #E2E8F0",
              paddingBottom: "8px",
              marginBottom: "12px"
            }}>
              CUSTOMER
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px" }}>
              <div style={{ display: "flex" }}>
                <span style={{ width: "70px", color: "#64748B", fontWeight: "500" }}>Name:</span>
                <span style={{ fontWeight: "700", color: "#162238" }}>{displayCustomerName}</span>
              </div>
              <div style={{ display: "flex" }}>
                <span style={{ width: "70px", color: "#64748B", fontWeight: "500" }}>Phone:</span>
                <span style={{ color: "#334155" }}>{displayCustomerPhone}</span>
              </div>
              <div style={{ display: "flex" }}>
                <span style={{ width: "70px", color: "#64748B", fontWeight: "500" }}>Email:</span>
                <span style={{ color: "#334155" }}>{displayCustomerEmail}</span>
              </div>
              <div style={{ display: "flex" }}>
                <span style={{ width: "70px", color: "#64748B", fontWeight: "500", flexShrink: 0 }}>Address:</span>
                <span style={{ color: "#334155", lineHeight: "1.4" }}>{displayCustomerAddress}</span>
              </div>
            </div>
          </div>

          {/* PILLAR DETAILS */}
          <div style={{ border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px 18px", background: "#FFFFFF" }}>
            <div style={{ 
              fontSize: "12px", 
              fontWeight: "800", 
              textTransform: "uppercase", 
              color: "#162238", 
              letterSpacing: "0.5px",
              borderBottom: "1px solid #E2E8F0",
              paddingBottom: "8px",
              marginBottom: "12px"
            }}>
              PILLAR / TECHNICIAN
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px" }}>
              <div style={{ display: "flex" }}>
                <span style={{ width: "95px", color: "#64748B", fontWeight: "500" }}>Name:</span>
                <span style={{ fontWeight: "700", color: "#162238" }}>{displayPillarName}</span>
              </div>
              <div style={{ display: "flex" }}>
                <span style={{ width: "95px", color: "#64748B", fontWeight: "500" }}>Pillar ID:</span>
                <span style={{ color: "#334155", fontWeight: "600" }}>{displayPillarId}</span>
              </div>
              <div style={{ display: "flex" }}>
                <span style={{ width: "95px", color: "#64748B", fontWeight: "500" }}>Trade:</span>
                <span style={{ color: "#162238", fontWeight: "600" }}>{displayPillarTrade}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ width: "95px", color: "#64748B", fontWeight: "500" }}>Verification:</span>
                <span style={{ 
                  color: "#059669", 
                  fontWeight: "700", 
                  background: "#ECFDF5", 
                  border: "1px solid #A7F3D0",
                  fontSize: "10.5px", 
                  padding: "1px 6px", 
                  borderRadius: "8px" 
                }}>
                  ✓ {displayPillarVerification}
                </span>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ width: "95px", color: "#64748B", fontWeight: "500" }}>Rating:</span>
                <span style={{ color: "#D97706", fontWeight: "700" }}>
                  {displayPillarRating}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ══════════════════════════════════════════════════════════
            SERVICE DETAILS
           ══════════════════════════════════════════════════════════ */}
        <div style={{ 
          border: "1px solid #E2E8F0", 
          borderRadius: "12px", 
          padding: "16px 18px", 
          marginBottom: "24px",
          background: "#FFFFFF"
        }}>
          <div style={{ 
            fontSize: "12px", 
            fontWeight: "800", 
            textTransform: "uppercase", 
            color: "#162238", 
            letterSpacing: "0.5px",
            borderBottom: "1px solid #E2E8F0",
            paddingBottom: "8px",
            marginBottom: "12px"
          }}>
            SERVICE DETAILS
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "10px", fontSize: "12.5px" }}>
            <div>
              <span style={{ color: "#64748B", fontWeight: "500", display: "block", fontSize: "11px", textTransform: "uppercase" }}>Service:</span>
              <span style={{ fontWeight: "700", color: "#162238", fontSize: "13.5px" }}>{displayServiceTitle}</span>
            </div>
            <div>
              <span style={{ color: "#64748B", fontWeight: "500", display: "block", fontSize: "11px", textTransform: "uppercase" }}>Schedule:</span>
              <span style={{ color: "#334155", fontWeight: "600" }}>{displayServiceDate} • {displayServiceTime}</span>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={{ color: "#64748B", fontWeight: "500", display: "block", fontSize: "11px", textTransform: "uppercase" }}>Description:</span>
              <span style={{ color: "#334155", lineHeight: "1.4" }}>{displayServiceDesc}</span>
            </div>
            <div style={{ gridColumn: "1 / -1" }}>
              <span style={{ color: "#64748B", fontWeight: "500", display: "block", fontSize: "11px", textTransform: "uppercase" }}>Location:</span>
              <span style={{ color: "#334155" }}>{displayServiceLoc}</span>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            CHARGES (Table + Subtotal + GST + Prominent TOTAL)
           ══════════════════════════════════════════════════════════ */}
        <div style={{ 
          border: "1px solid #E2E8F0", 
          borderRadius: "12px", 
          padding: "16px 20px", 
          marginBottom: "24px",
          background: "#FFFFFF"
        }}>
          <div style={{ 
            fontSize: "12px", 
            fontWeight: "800", 
            textTransform: "uppercase", 
            color: "#162238", 
            letterSpacing: "0.5px",
            borderBottom: "1px solid #E2E8F0",
            paddingBottom: "8px",
            marginBottom: "12px"
          }}>
            CHARGES
          </div>

          <table className="coophub-charges-table">
            <thead>
              <tr>
                <th style={{ width: "65%" }}>Description</th>
                <th style={{ width: "35%", textAlign: "right" }}>Amount</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>Service Charge</td>
                <td style={{ textAlign: "right", fontWeight: "600" }}>{displayServiceCharge}</td>
              </tr>
              <tr>
                <td>Materials / Parts</td>
                <td style={{ textAlign: "right", fontWeight: "600" }}>{displayMaterialsParts}</td>
              </tr>
              <tr>
                <td>Additional Charges</td>
                <td style={{ textAlign: "right", fontWeight: "600" }}>{displayAdditionalCharges}</td>
              </tr>
            </tbody>
          </table>

          {/* Subtotal, GST, and Highlighted Prominent TOTAL */}
          <div style={{ display: "flex", justifyContent: "flex-end", marginTop: "14px" }}>
            <div style={{ width: "260px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B" }}>
                <span>Subtotal</span>
                <span style={{ fontWeight: "600", color: "#162238" }}>{displaySubtotal}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#64748B" }}>
                <span>GST</span>
                <span style={{ fontWeight: "600", color: "#162238" }}>{displayGst}</span>
              </div>

              {/* Visually Prominent Total (Deep Navy + COOP Orange) */}
              <div style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                background: "#162238",
                color: "#FFFFFF",
                borderRadius: "8px",
                padding: "10px 14px",
                marginTop: "6px",
                borderLeft: "4px solid #FF7900"
              }}>
                <span style={{ fontSize: "14px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                  TOTAL
                </span>
                <span style={{ fontSize: "18px", fontWeight: "900", color: "#FF7900" }}>
                  {displayTotal}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* ══════════════════════════════════════════════════════════
            PAYMENT DETAILS & COOPERATIVE BREAKDOWN (2-Column Grid)
           ══════════════════════════════════════════════════════════ */}
        <div className="coophub-receipt-grid-2" style={{ marginBottom: "28px" }}>
          
          {/* PAYMENT DETAILS */}
          <div style={{ border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px 18px", background: "#FFFFFF" }}>
            <div style={{ 
              fontSize: "12px", 
              fontWeight: "800", 
              textTransform: "uppercase", 
              color: "#162238", 
              letterSpacing: "0.5px",
              borderBottom: "1px solid #E2E8F0",
              paddingBottom: "8px",
              marginBottom: "12px"
            }}>
              PAYMENT DETAILS
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px" }}>
              <div style={{ display: "flex" }}>
                <span style={{ width: "110px", color: "#64748B", fontWeight: "500" }}>Method:</span>
                <span style={{ fontWeight: "700", color: "#162238" }}>{displayPaymentMethod}</span>
              </div>
              <div style={{ display: "flex" }}>
                <span style={{ width: "110px", color: "#64748B", fontWeight: "500" }}>Transaction ID:</span>
                <span style={{ color: "#334155", fontFamily: "monospace", fontSize: "12px" }}>{displayTransactionId}</span>
              </div>
              <div style={{ display: "flex" }}>
                <span style={{ width: "110px", color: "#64748B", fontWeight: "500" }}>Payment Date:</span>
                <span style={{ color: "#334155" }}>{displayPaymentDate}</span>
              </div>
              <div style={{ display: "flex", alignItems: "center" }}>
                <span style={{ width: "110px", color: "#64748B", fontWeight: "500" }}>Status:</span>
                <span style={{ 
                  color: "#059669", 
                  fontWeight: "800", 
                  background: "#ECFDF5", 
                  border: "1px solid #A7F3D0",
                  fontSize: "11px", 
                  padding: "2px 8px", 
                  borderRadius: "10px",
                  textTransform: "uppercase"
                }}>
                  ✓ {displayPaymentStatus}
                </span>
              </div>
            </div>
          </div>

          {/* COOPERATIVE BREAKDOWN */}
          <div style={{ border: "1px solid #E2E8F0", borderRadius: "12px", padding: "16px 18px", background: "#FFFFFF" }}>
            <div style={{ 
              fontSize: "12px", 
              fontWeight: "800", 
              textTransform: "uppercase", 
              color: "#162238", 
              letterSpacing: "0.5px",
              borderBottom: "1px solid #E2E8F0",
              paddingBottom: "8px",
              marginBottom: "12px"
            }}>
              COOPERATIVE BREAKDOWN
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B", fontWeight: "500" }}>Pillar Earnings:</span>
                <span style={{ fontWeight: "700", color: "#059669" }}>{displayPillarEarnings}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ color: "#64748B", fontWeight: "500" }}>Cooperative Commission:</span>
                <span style={{ color: "#334155", fontWeight: "600" }}>{displayCoopCommission}</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px dashed #E2E8F0", paddingTop: "6px", marginTop: "2px" }}>
                <span style={{ color: "#64748B", fontWeight: "500" }}>Settlement Status:</span>
                <span style={{ 
                  color: "#162238", 
                  fontWeight: "700",
                  background: "#F1F5F9",
                  padding: "1px 8px",
                  borderRadius: "6px",
                  fontSize: "11.5px"
                }}>
                  {displaySettlementStatus}
                </span>
              </div>
            </div>
          </div>

        </div>

        {/* ══════════════════════════════════════════════════════════
            FOOTER
            Divider
            [COOP HUB LOGO]
            COOP HUB
            Trusted • Transparent • Cooperative
            Support: [Support Email] | [Support Phone]
            Computer-generated receipt
           ══════════════════════════════════════════════════════════ */}
        <div style={{ 
          borderTop: "1px solid #E2E8F0", 
          paddingTop: "24px", 
          marginTop: "8px", 
          textAlign: "center",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          gap: "8px"
        }}>
          {coopHubLogo ? (
            <img 
              src={coopHubLogo} 
              alt="COOP HUB Logo" 
              style={{ height: "42px", width: "auto", objectFit: "contain", display: "block", marginBottom: "2px" }} 
            />
          ) : (
            <div style={{
              background: "#162238",
              color: "#FF7900",
              fontWeight: "900",
              padding: "6px 12px",
              borderRadius: "6px",
              fontSize: "12px",
              marginBottom: "4px"
            }}>
              [COOP HUB LOGO]
            </div>
          )}

          <div style={{ fontSize: "14px", fontWeight: "800", color: "#162238", letterSpacing: "0.5px" }}>
            COOP HUB
          </div>

          <div style={{ fontSize: "11.5px", color: "#64748B", fontWeight: "600", letterSpacing: "0.3px" }}>
            Trusted • Transparent • Cooperative
          </div>

          <div style={{ fontSize: "11.5px", color: "#475569", marginTop: "4px" }}>
            <span style={{ fontWeight: "600", color: "#162238" }}>Support: </span>
            <span>{supportEmail}</span>
            <span style={{ margin: "0 8px", color: "#CBD5E1" }}>|</span>
            <span>{supportPhone}</span>
          </div>

          <div style={{ fontSize: "10.5px", color: "#94A3B8", marginTop: "6px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Computer-generated receipt
          </div>
        </div>

      </div>
    </div>
  );
}
