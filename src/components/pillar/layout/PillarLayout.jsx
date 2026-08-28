import React, { useState } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "../../../context/AuthContext";
import { useGeolocation } from "../../../hooks/pillar/useGeolocation";

export default function PillarLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { profile, isAvailable } = useAuth();
  const isDemo = localStorage.getItem("coophub_demo_user") === "true";

  // Mount background GPS streaming when technician is online/available
  const pillarId = profile?.id || profile?.user_id;
  const isTrackingEnabled = !!(pillarId && isAvailable);
  useGeolocation(isTrackingEnabled, pillarId, isDemo);

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

      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 1025px) {
          .layout-content { margin-left: var(--sidebar-width); }
        }
      `}} />
    </div>
  );
}
