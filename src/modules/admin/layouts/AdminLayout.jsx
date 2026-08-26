import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import Header from "../../../components/pillar/layout/Header";

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  return (
    <div style={{ display: "flex", minHeight: "100vh", background: "var(--color-background)" }}>
      <AdminSidebar isOpen={sidebarOpen} toggleSidebar={toggleSidebar} />
      
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
