import React, { useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { openPillarChat } from "../../../components/pillar/chat/PillarChatDrawer";

export default function CustomerChat() {
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const queryParams = new URLSearchParams(location.search);
    const targetRequestId = queryParams.get("requestId") || queryParams.get("orderId") || location.state?.orderId || location.state?.requestId;
    
    // Automatically trigger slide-over communication drawer (like Image 3)
    openPillarChat(targetRequestId ? { id: targetRequestId } : null);
    
    // Return smoothly to orders
    navigate("/dashboard/orders", { replace: true });
  }, [location, navigate]);

  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "60vh", color: "var(--color-text-secondary)" }}>
      <div className="spinner spinner-md" />
      <span style={{ marginLeft: "12px", fontSize: "14px" }}>Opening Communication Drawer...</span>
    </div>
  );
}
