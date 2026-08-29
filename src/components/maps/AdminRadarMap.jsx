import React, { useState, useEffect, useRef } from "react";
import { googleMapsService } from "../../services/maps/googleMapsService";
import { GOOGLE_MAPS_CONFIG, MAP_STYLES } from "../../config/maps";
import {
  Radio, MapPin, Navigation, User, Star, Award, ShieldAlert,
  Clock, RefreshCw, Layers, Filter, Search, Phone
} from "lucide-react";

function formatLocation(pillar) {
  if (!pillar) return "Chennai Central";
  if (pillar.area) {
    return `${pillar.area}${pillar.pincode ? ` (PIN: ${pillar.pincode})` : ""}`;
  }
  let area = pillar.service_area;
  if (Array.isArray(area)) {
    return area.filter(Boolean).join(", ") || "Chennai Central";
  }
  if (typeof area === "string") {
    if (area.startsWith("[") || area.startsWith("{")) {
      try {
        const parsed = JSON.parse(area);
        if (Array.isArray(parsed)) {
          return parsed.filter(Boolean).join(", ") || "Chennai Central";
        }
      } catch (e) { /* ignore */ }
    }
    const cleaned = area.replace(/[\[\]"']/g, "").trim();
    return cleaned || "Chennai Central";
  }
  return "Chennai Central";
}

export default function AdminRadarMap({
  pillars = [],
  emergencyRequests = [],
  onSelectPillar = null,
  selectedPillar = null,
  height = "420px",
  className = ""
}) {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const infoWindowRef = useRef(null);

  const [mapTheme, setMapTheme] = useState("darkRadar"); // 'darkRadar' | 'cleanLight'
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    async function initRadar() {
      try {
        setLoading(true);
        const map = await googleMapsService.initializeMap(containerRef.current, {
          center: GOOGLE_MAPS_CONFIG.defaultCenter,
          zoom: 13,
          theme: mapTheme,
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false
        });

        if (!isMounted) return;
        mapInstanceRef.current = map;
        infoWindowRef.current = new window.google.maps.InfoWindow();

        renderRadarMarkers(map);
        setLoading(false);
      } catch (err) {
        console.warn("AdminRadarMap initialization note:", err);
        setLoading(false);
      }
    }

    initRadar();

    return () => {
      isMounted = false;
      clearMarkers();
    };
  }, [mapTheme]);

  // Update Markers when pillars or filter changes
  useEffect(() => {
    if (mapInstanceRef.current) {
      renderRadarMarkers(mapInstanceRef.current);
    }
  }, [pillars, filterStatus, searchQuery, selectedPillar]);

  const clearMarkers = () => {
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];
  };

  const getPillarColor = (p) => {
    if (p.is_emergency) return "#EF4444"; // Red Emergency
    if (p.is_available) return "#10B981"; // Green Available
    if (p.status === "verified" || p.status === "in_progress") return "#F59E0B"; // Amber Busy
    return "#64748B"; // Grey Offline
  };

  const renderRadarMarkers = (map) => {
    if (!window.google?.maps) return;
    clearMarkers();

    const filtered = pillars.filter((p) => {
      // Status filter
      if (filterStatus === "available" && !p.is_available) return false;
      if (filterStatus === "busy" && p.is_available) return false;
      if (filterStatus === "emergency" && !p.is_emergency) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const name = (p.full_name || "").toLowerCase();
        const code = (p.pillar_code || "").toLowerCase();
        const area = (p.service_area || "").toLowerCase();
        const trade = String(p.main_services || "").toLowerCase();
        return name.includes(q) || code.includes(q) || area.includes(q) || trade.includes(q);
      }

      return true;
    });

    filtered.forEach((p) => {
      const rawLat = p.current_lat != null ? p.current_lat : p.lat;
      const rawLng = p.current_lng != null ? p.current_lng : p.lng;
      if (rawLat == null || rawLng == null) return; // Skip pillars without real GPS coordinates

      const lat = Number(rawLat);
      const lng = Number(rawLng);
      const isSelected = selectedPillar?.id === p.id;
      const markerColor = getPillarColor(p);

      const marker = new window.google.maps.Marker({
        position: { lat, lng },
        map,
        title: `${p.full_name} (${p.pillar_code || "Pillar"})`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: markerColor,
          fillOpacity: 1,
          strokeColor: isSelected ? "#3B82F6" : "#ffffff",
          strokeWeight: isSelected ? 3.5 : 2,
          scale: isSelected ? 12 : 9
        },
        zIndex: isSelected ? 100 : 10
      });

      marker.addListener("click", () => {
        if (onSelectPillar) onSelectPillar(p);
        const locationLabel = formatLocation(p);

        // Open InfoWindow
        const contentString = `
          <div style="padding: 8px; font-family: system-ui, sans-serif; min-width: 180px;">
            <div style="font-weight: 800; font-size: 13px; color: #0F172A; margin-bottom: 2px;">
              ${p.full_name}
            </div>
            <div style="font-size: 11px; font-weight: 700; color: #FF7900; margin-bottom: 6px;">
              ${p.pillar_code || "PIL-CHE-001"} • ${Array.isArray(p.main_services) ? p.main_services[0] : (p.main_services || "Technician")}
            </div>
            <div style="font-size: 11px; color: #64748B; margin-bottom: 4px;">
              Status: <strong style="color: ${markerColor}">${p.is_available ? "Available (Online)" : "On Job / Busy"}</strong>
            </div>
            <div style="font-size: 11px; color: #64748B;">
              Rating: <strong>★ ${p.rating || 5.0}</strong> • Area: <strong>${locationLabel}</strong>
            </div>
          </div>
        `;

        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(contentString);
          infoWindowRef.current.open(map, marker);
        }
      });

      markersRef.current.push(marker);
    });

    // Add Emergency Request Markers (Red Beacon)
    emergencyRequests.forEach((req) => {
      if (!req.latitude || !req.longitude) return;
      const emMarker = new window.google.maps.Marker({
        position: { lat: Number(req.latitude), lng: Number(req.longitude) },
        map,
        title: `🚨 EMERGENCY: ${req.service_name || "Immediate Assistance"}`,
        icon: {
          path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
          fillColor: "#EF4444",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2,
          scale: 7
        },
        zIndex: 200
      });

      emMarker.addListener("click", () => {
        if (infoWindowRef.current) {
          infoWindowRef.current.setContent(`
            <div style="padding: 8px; font-family: system-ui, sans-serif;">
              <span style="background: #EF4444; color: white; padding: 2px 6px; border-radius: 4px; font-size: 10px; font-weight: 800;">
                EMERGENCY REQUEST
              </span>
              <div style="font-weight: 800; font-size: 13px; margin-top: 4px;">
                ${req.service_name || "Emergency Service"}
              </div>
              <div style="font-size: 11px; color: #64748B; margin-top: 2px;">
                Customer: ${req.customer_name || "Guest"} (${req.customer_phone || "—"})
              </div>
            </div>
          `);
          infoWindowRef.current.open(map, emMarker);
        }
      });

      markersRef.current.push(emMarker);
    });
  };

  return (
    <div className={`relative rounded-3xl overflow-hidden border border-navy-100 shadow-sm ${className}`} style={{ height }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Top Floating Control Bar */}
      <div className="absolute top-3 left-3 right-3 flex justify-between items-center gap-2 flex-wrap pointer-events-none z-10">
        {/* Search & Filter */}
        <div className="flex items-center gap-2 pointer-events-auto bg-navy-950/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-lg">
          <div className="relative">
            <input
              type="text"
              placeholder="Filter by name, area, trade..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-navy-900/90 text-white placeholder-navy-400 text-xs px-3 py-1.5 pl-7 rounded-xl border border-white/10 focus:outline-none focus:border-orange-500 w-44 sm:w-56"
            />
            <Search size={13} className="absolute left-2 top-2.5 text-navy-400" />
          </div>

          <div className="flex gap-1">
            {["all", "available", "busy", "emergency"].map((st) => (
              <button
                key={st}
                onClick={() => setFilterStatus(st)}
                className={`text-[11px] font-bold px-2.5 py-1 rounded-xl transition-colors capitalize ${
                  filterStatus === st
                    ? "bg-orange-500 text-white"
                    : "bg-white/5 text-navy-300 hover:bg-white/10"
                }`}
              >
                {st}
              </button>
            ))}
          </div>
        </div>

        {/* Theme Toggle */}
        <div className="flex items-center gap-1.5 pointer-events-auto bg-navy-950/80 backdrop-blur-md p-1.5 rounded-2xl border border-white/10 shadow-lg">
          <button
            onClick={() => setMapTheme(mapTheme === "darkRadar" ? "cleanLight" : "darkRadar")}
            className="text-[11px] font-bold text-navy-200 px-2.5 py-1 rounded-xl hover:bg-white/10 flex items-center gap-1 transition-colors"
          >
            <Layers size={13} className="text-orange-400" />
            <span>{mapTheme === "darkRadar" ? "Radar Dark" : "Clean Light"}</span>
          </button>
        </div>
      </div>

      {/* Bottom Live Counter Legend */}
      <div className="absolute bottom-3 left-3 bg-navy-950/85 backdrop-blur-md px-3.5 py-2 rounded-2xl border border-white/10 shadow-lg flex items-center gap-4 text-xs font-bold text-white z-10">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
          <span>Online ({pillars.filter((p) => p.is_available).length})</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span>Busy ({pillars.filter((p) => !p.is_available).length})</span>
        </div>
        {emergencyRequests.length > 0 && (
          <div className="flex items-center gap-1.5 text-red-400">
            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse"></span>
            <span>Emergency ({emergencyRequests.length})</span>
          </div>
        )}
      </div>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-navy-950/80 backdrop-blur-xs z-20">
          <div className="spinner spinner-sm"></div>
        </div>
      )}
    </div>
  );
}
