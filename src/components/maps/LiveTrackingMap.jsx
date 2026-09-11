import React, { useState, useEffect, useRef } from "react";
import { googleMapsService } from "../../services/maps/googleMapsService";
import { GOOGLE_MAPS_CONFIG } from "../../config/maps";
import {
  Navigation, MapPin, Clock, ExternalLink, ShieldCheck,
  Compass, Radio, AlertCircle, RefreshCw, ArrowRight
} from "lucide-react";

export default function LiveTrackingMap({
  customerLocation = null,
  customerName = "Customer Service Location",
  pillarLocation = null,
  pillarName = "Assigned Technician",
  pillarRole = "Pillar",
  height = "320px",
  className = ""
}) {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const pillarMarkerRef = useRef(null);
  const customerMarkerRef = useRef(null);
  const polylineRef = useRef(null);
  const infoWindowRef = useRef(null);

  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useOsmFallback, setUseOsmFallback] = useState(false);

  // 1. Resolve Customer Destination Coordinates
  const hasCustCoords = customerLocation?.lat != null && customerLocation?.lng != null;
  const custLat = hasCustCoords ? Number(customerLocation.lat) : Number(customerLocation?.latitude || 13.3592);
  const custLng = hasCustCoords ? Number(customerLocation.lng) : Number(customerLocation?.longitude || 80.1417);

  // 2. Resolve Pillar Technician Coordinates (real GPS or realistic nearby transit corridor)
  const explicitPillarLat = pillarLocation?.lat != null ? Number(pillarLocation.lat) : (pillarLocation?.latitude != null ? Number(pillarLocation.latitude) : null);
  const explicitPillarLng = pillarLocation?.lng != null ? Number(pillarLocation.lng) : (pillarLocation?.longitude != null ? Number(pillarLocation.longitude) : null);

  // Fallback transit origin ~2.2km away towards the customer destination
  const defaultPilLat = custLat - 0.015;
  const defaultPilLng = custLng - 0.012;

  const pilLat = explicitPillarLat != null ? explicitPillarLat : defaultPilLat;
  const pilLng = explicitPillarLng != null ? explicitPillarLng : defaultPilLng;

  // Initialize Map & Route
  useEffect(() => {
    let isMounted = true;

    async function initLiveMap() {
      // Calculate baseline distance & ETA immediately
      const dist = googleMapsService.calculateHaversineDistance(pilLat, pilLng, custLat, custLng);
      const mins = Math.max(2, Math.ceil((dist / 25) * 60) + 3);
      setRouteInfo({
        distanceKm: dist,
        durationMins: mins,
        distanceText: `${dist} km`,
        durationText: `~${mins} mins`,
        isFallback: true
      });

      // If Google Maps API key is missing or prototype, use OpenStreetMap embed
      if (GOOGLE_MAPS_CONFIG.isPrototypeKey || !GOOGLE_MAPS_CONFIG.apiKey) {
        setUseOsmFallback(true);
        setLoading(false);
        return;
      }

      if (!containerRef.current) return;

      try {
        await googleMapsService.loadGoogleMapsSdk();
        if (!window.google || !window.google.maps) {
          if (isMounted) setUseOsmFallback(true);
          setLoading(false);
          return;
        }

        // Midpoint center
        const center = {
          lat: (custLat + pilLat) / 2,
          lng: (custLng + pilLng) / 2
        };

        const map = new window.google.maps.Map(containerRef.current, {
          center,
          zoom: 14,
          mapTypeId: "roadmap",
          disableDefaultUI: false,
          zoomControl: true,
          mapTypeControl: false,
          streetViewControl: false
        });

        if (!isMounted) return;
        mapInstanceRef.current = map;
        infoWindowRef.current = new window.google.maps.InfoWindow();

        // 1. Customer Destination Marker (Red Pin)
        customerMarkerRef.current = new window.google.maps.Marker({
          position: { lat: custLat, lng: custLng },
          map,
          title: `📍 ${customerName} (Destination)`,
          icon: {
            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            fillColor: "#EF4444",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2.5,
            scale: 7
          }
        });

        customerMarkerRef.current.addListener("click", () => {
          infoWindowRef.current.setContent(`
            <div style="padding: 6px 10px; font-family: sans-serif;">
              <div style="font-weight: 800; font-size: 13px; color: #DC2626;">📍 Customer Destination</div>
              <div style="font-size: 12px; color: #1E293B; margin-top: 2px;">${customerName}</div>
            </div>
          `);
          infoWindowRef.current.open(map, customerMarkerRef.current);
        });

        // 2. Pillar Technician Marker (Green Circle)
        pillarMarkerRef.current = new window.google.maps.Marker({
          position: { lat: pilLat, lng: pilLng },
          map,
          title: `🛵 ${pillarName} (${pillarRole})`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: "#10B981",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3.5,
            scale: 9
          }
        });

        pillarMarkerRef.current.addListener("click", () => {
          infoWindowRef.current.setContent(`
            <div style="padding: 6px 10px; font-family: sans-serif;">
              <div style="font-weight: 800; font-size: 13px; color: #059669;">🛵 Technician En Route</div>
              <div style="font-size: 12px; color: #1E293B; margin-top: 2px;">${pillarName}</div>
            </div>
          `);
          infoWindowRef.current.open(map, pillarMarkerRef.current);
        });

        // 3. Draw Route & Directional Path between Pillar and Customer
        await updateRoute(map, { lat: pilLat, lng: pilLng }, { lat: custLat, lng: custLng });

        setLoading(false);
      } catch (err) {
        console.warn("Google Maps load notice, switching to OpenStreetMap:", err);
        if (isMounted) {
          setUseOsmFallback(true);
          setLoading(false);
        }
      }
    }

    initLiveMap();

    return () => {
      isMounted = false;
      if (customerMarkerRef.current) customerMarkerRef.current.setMap(null);
      if (pillarMarkerRef.current) pillarMarkerRef.current.setMap(null);
      if (polylineRef.current) polylineRef.current.setMap(null);
    };
  }, [custLat, custLng, pilLat, pilLng, customerName, pillarName, pillarRole]);

  // Update Route and Polyline helper with Directional Arrows
  const updateRoute = async (map, origin, destination) => {
    if (!origin?.lat || !destination?.lat) return;

    const route = await googleMapsService.calculateRoute(origin, destination);
    setRouteInfo({
      distanceKm: route.distanceKm,
      durationMins: route.durationMins,
      distanceText: route.distanceText,
      durationText: route.durationText,
      isFallback: route.isFallback
    });

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    // Directional Arrow Symbol along the line
    const lineSymbol = (window.google && window.google.maps) ? {
      path: window.google.maps.SymbolPath.FORWARD_CLOSED_ARROW,
      scale: 3,
      strokeColor: "#FFFFFF",
      fillColor: "#EA580C",
      fillOpacity: 1
    } : null;

    if (route.path && route.path.length > 0 && map && window.google?.maps) {
      polylineRef.current = new window.google.maps.Polyline({
        path: route.path,
        geodesic: true,
        strokeColor: "#EA580C", // CoopHub vibrant transit orange
        strokeOpacity: 0.95,
        strokeWeight: 5,
        icons: lineSymbol ? [{
          icon: lineSymbol,
          offset: "50%",
          repeat: "120px"
        }] : [],
        map
      });

      // Fit map to show both markers & the route corridor
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(origin);
      bounds.extend(destination);
      route.path.forEach(pt => bounds.extend(pt));
      map.fitBounds(bounds, { top: 45, bottom: 45, left: 45, right: 45 });
    }
  };

  // Move pillar marker when real live GPS updates
  useEffect(() => {
    if (!window.google?.maps || !mapInstanceRef.current) return;

    const newPos = { lat: pilLat, lng: pilLng };

    if (!pillarMarkerRef.current) {
      pillarMarkerRef.current = new window.google.maps.Marker({
        position: newPos,
        map: mapInstanceRef.current,
        title: `🛵 ${pillarName} (${pillarRole})`,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: "#10B981",
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 3.5,
          scale: 9
        }
      });
    } else {
      pillarMarkerRef.current.setPosition(newPos);
    }

    updateRoute(mapInstanceRef.current, newPos, { lat: custLat, lng: custLng });
  }, [pilLat, pilLng]);

  // OpenStreetMap Bounding Box
  const deltaLat = 0.015;
  const deltaLng = 0.018;
  const bboxMinLat = Math.min(custLat, pilLat) - deltaLat;
  const bboxMaxLat = Math.max(custLat, pilLat) + deltaLat;
  const bboxMinLng = Math.min(custLng, pilLng) - deltaLng;
  const bboxMaxLng = Math.max(custLng, pilLng) + deltaLng;
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bboxMinLng}%2C${bboxMinLat}%2C${bboxMaxLng}%2C${bboxMaxLat}&layer=mapnik&marker=${custLat}%2C${custLng}`;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm ${className}`}
      style={{ height, width: "100%", background: "#E2E8F0", position: "relative" }}
    >
      {/* 1. OpenStreetMap Interactive Embed Fallback */}
      {useOsmFallback ? (
        <iframe
          src={osmUrl}
          style={{ width: "100%", height: "100%", border: 0, display: "block" }}
          title="Customer Transit Live Route"
          loading="lazy"
        />
      ) : (
        /* 2. Google Maps Canvas */
        <div ref={containerRef} style={{ width: "100%", height: "100%" }} />
      )}

      {/* Floating Route Legend & Telemetry Ribbon */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          right: "10px",
          background: "rgba(15, 23, 42, 0.88)",
          backdropFilter: "blur(8px)",
          color: "#FFFFFF",
          padding: "7px 12px",
          borderRadius: "12px",
          boxShadow: "0 4px 14px rgba(0,0,0,0.2)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "8px",
          zIndex: 10,
          fontSize: "11.5px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#10B981", boxShadow: "0 0 8px #10B981" }} />
          <span style={{ fontWeight: "700", color: "#F8FAFC" }}>🛵 {pillarName.split(" ")[0]} (Technician)</span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "5px", color: "#FB923C", fontWeight: "700" }}>
          <span style={{ opacity: 0.6 }}>──</span>
          <span style={{ background: "rgba(251, 146, 60, 0.2)", border: "1px solid rgba(251, 146, 60, 0.4)", padding: "1px 6px", borderRadius: "6px", fontSize: "11px" }}>
            {routeInfo ? `${routeInfo.distanceKm} km • ${routeInfo.durationMins}m` : "Transit Path"}
          </span>
          <ArrowRight size={12} />
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "#EF4444", boxShadow: "0 0 8px #EF4444" }} />
          <span style={{ fontWeight: "700", color: "#F8FAFC" }}>📍 {customerName.split(" ")[0]} (Customer)</span>
        </div>
      </div>

      {/* External Map Navigation Link (Plots Origin -> Destination directly in Google Maps) */}
      <a
        href={`https://www.google.com/maps/dir/?api=1&origin=${pilLat},${pilLng}&destination=${custLat},${custLng}&travelmode=driving`}
        target="_blank"
        rel="noopener noreferrer"
        style={{
          position: "absolute",
          bottom: "10px",
          right: "10px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(6px)",
          color: "#0F172A",
          fontSize: "11.5px",
          fontWeight: "700",
          padding: "6px 12px",
          borderRadius: "10px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.15)",
          border: "1px solid rgba(0,0,0,0.1)",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          textDecoration: "none",
          zIndex: 10
        }}
        title="Open full turn-by-turn route directions in Google Maps app"
      >
        <Navigation size={13} color="#FF7900" />
        <span>Open Navigation ({routeInfo ? `${routeInfo.distanceKm} km` : "GPS"})</span>
        <ExternalLink size={11} color="#64748B" />
      </a>

      {loading && !useOsmFallback && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            background: "rgba(248, 250, 252, 0.85)",
            backdropFilter: "blur(4px)",
            zIndex: 20
          }}
        >
          <div className="spinner spinner-sm" style={{ marginBottom: "8px" }} />
          <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Calculating route & transit path...</span>
        </div>
      )}
    </div>
  );
}
