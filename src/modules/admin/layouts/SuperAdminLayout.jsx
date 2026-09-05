import React, { useState } from "react";
import SuperAdminSidebar from "./SuperAdminSidebar";
import Header from "../../../components/pillar/layout/Header";
import { useTheme } from "../../../context/ThemeContext";

export default function SuperAdminLayout({ children }) {
  const { isDark } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: isDark ? "#050A12" : "#F5F7FA", color: isDark ? "#F8FAFC" : "#0F172A" }}>
      <SuperAdminSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
      <div 
        className="layout-content super-admin-content"
        style={{ 
          flex: 1, 
          display: "flex", 
          flexDirection: "column",
          minWidth: 0,
          transition: "margin-left 0.3s ease"
        }}
      >
        <Header toggleSidebar={toggleSidebar} />
        
        <main style={{ flex: 1, overflowY: "auto", padding: "20px" }}>
          {children}
        </main>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @media (min-width: 1025px) {
          .super-admin-sidebar {
            left: 0 !important;
            box-shadow: none !important;
          }
          .super-admin-content {
            margin-left: 260px !important;
          }
          .hide-on-desktop {
            display: none !important;
          }
        }
        @media (max-width: 1024px) {
          .super-admin-content {
            margin-left: 0 !important;
          }
        }
      `}} />
    </div>
  );
}
