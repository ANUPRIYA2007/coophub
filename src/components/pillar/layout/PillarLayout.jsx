import React, { useState, useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import PillarChatDrawer from "../chat/PillarChatDrawer";
import { useAuth } from "../../../context/AuthContext";
import { useGeolocation } from "../../../hooks/pillar/useGeolocation";

export default function PillarLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatDrawerOpen, setChatDrawerOpen] = useState(false);
  const [chatOrder, setChatOrder] = useState(null);
  const { profile, isAvailable } = useAuth();
  const isDemo = localStorage.getItem("coophub_demo_user") === "true";

  // Mount background GPS streaming when technician is online/available and consent is granted
  const pillarId = profile?.id || profile?.user_id;
  const locationConsent = profile?.location_sharing_enabled !== false;
  const isTrackingEnabled = !!(pillarId && isAvailable && locationConsent);
  useGeolocation(isTrackingEnabled, pillarId, isDemo, locationConsent);

  // Global listener for opening the slide-over communication drawer (like Image 3)
  useEffect(() => {
    const handleOpenChat = (e) => {
      const orderData = e.detail?.order || null;
      if (orderData) {
        setChatOrder(orderData);
      }
      setChatDrawerOpen(true);
    };

    window.addEventListener('open_pillar_chat', handleOpenChat);
    return () => window.removeEventListener('open_pillar_chat', handleOpenChat);
  }, []);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-background)" }}>
      <Sidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div 
        className="layout-content"
        style={{ 
          flex: 1, 
          display: "flex", 
          flexDirection: "column",
          minWidth: 0,
          transition: "margin-left 0.3s ease"
        }}
      >
        <Header toggleSidebar={toggleSidebar} />
        
        <main style={{ flex: 1, overflowY: "auto", padding: "var(--space-4)" }}>
          {children}
        </main>
      </div>

      {/* Smart Pillar ↔ Customer Communication Drawer (Image 3 Style) */}
      <PillarChatDrawer
        isOpen={chatDrawerOpen}
        onClose={() => setChatDrawerOpen(false)}
        order={chatOrder}
      />

      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 1025px) {
          .layout-content { margin-left: var(--sidebar-width); }
        }
      `}} />
    </div>
  );
}
