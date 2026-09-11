import React, { useState, useEffect, useRef } from "react";
import { googleMapsService } from "../../services/maps/googleMapsService";
import { GOOGLE_MAPS_CONFIG } from "../../config/maps";
import {
  Navigation, MapPin, Clock, ExternalLink, ShieldCheck,
  Compass, Radio, AlertCircle, RefreshCw
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

  const [routeInfo, setRouteInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [useOsmFallback, setUseOsmFallback] = useState(false);

  const hasCustCoords = customerLocation?.lat != null && customerLocation?.lng != null;
  const custLat = hasCustCoords ? Number(customerLocation.lat) : Number(customerLocation?.latitude || 13.0067);
  const custLng = hasCustCoords ? Number(customerLocation.lng) : Number(customerLocation?.longitude || 80.2025);

  const hasPillarCoords = pillarLocation?.lat != null && pillarLocation?.lng != null;
  const pilLat = hasPillarCoords ? Number(pillarLocation.lat) : null;
  const pilLng = hasPillarCoords ? Number(pillarLocation.lng) : null;

  // Initialize Map
  useEffect(() => {
    let isMounted = true;

    async function initLiveMap() {
      // Calculate immediate baseline route info (distance & ETA)
      if (hasPillarCoords && pilLat != null && pilLng != null) {
        const dist = googleMapsService.calculateHaversineDistance(pilLat, pilLng, custLat, custLng);
        const mins = Math.ceil((dist / 25) * 60) + 5;
        setRouteInfo({
          distanceKm: dist,
          durationMins: mins,
          distanceText: `${dist} km`,
          durationText: `~${mins} mins`,
          isFallback: true
        });
      }

      // If Google Maps API key is missing or prototype, default directly to OpenStreetMap embed
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

        // Base center point (Customer destination)
        const center = { lat: custLat, lng: custLng };

        const map = new window.google.maps.Map(containerRef.current, {
          center,
          zoom: 14,
          mapTypeId: "roadmap",
          disableDefaultUI: false,
          zoomControl: true
        });

        if (!isMounted) return;
        mapInstanceRef.current = map;

        // 1. Customer Marker (Red Pin)
        customerMarkerRef.current = new window.google.maps.Marker({
          position: { lat: custLat, lng: custLng },
          map,
          title: `${customerName} (Service Location)`,
          icon: {
            path: window.google.maps.SymbolPath.BACKWARD_CLOSED_ARROW,
            fillColor: "#EF4444",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 2,
            scale: 6
          }
        });

        // 2. Real Pillar Marker (Only if pillar has live GPS coordinates)
        if (hasPillarCoords && pilLat != null && pilLng != null) {
          pillarMarkerRef.current = new window.google.maps.Marker({
            position: { lat: pilLat, lng: pilLng },
            map,
            title: `${pillarName} (${pillarRole})`,
            icon: {
              path: window.google.maps.SymbolPath.CIRCLE,
              fillColor: "#10B981",
              fillOpacity: 1,
              strokeColor: "#ffffff",
              strokeWeight: 3,
              scale: 9
            }
          });

          // 3. Compute Real Route & Polyline via Google Directions API
          await updateRoute(map, { lat: pilLat, lng: pilLng }, { lat: custLat, lng: custLng });
        }

        setLoading(false);
      } catch (err) {
        console.warn("Google Maps load notice, using OpenStreetMap fallback:", err);
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
  }, [custLat, custLng, pilLat, pilLng]);

  // Update Route and Polyline helper
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

    if (route.path && route.path.length > 0 && map && window.google?.maps) {
      polylineRef.current = new window.google.maps.Polyline({
        path: route.path,
        geodesic: true,
        strokeColor: "#FF7900",
        strokeOpacity: 0.85,
        strokeWeight: 4,
        map
      });

      // Fit map to show both markers
      const bounds = new window.google.maps.LatLngBounds();
      bounds.extend(origin);
      bounds.extend(destination);
      map.fitBounds(bounds, { top: 40, bottom: 40, left: 40, right: 40 });
    }
  };

  // Move pillar marker when real live GPS updates via Supabase Realtime
  useEffect(() => {
    if (!window.google?.maps || !mapInstanceRef.current) return;

    if (hasPillarCoords && pilLat != null && pilLng != null) {
      const newPos = { lat: pilLat, lng: pilLng };

      if (!pillarMarkerRef.current) {
        pillarMarkerRef.current = new window.google.maps.Marker({
          position: newPos,
          map: mapInstanceRef.current,
          title: `${pillarName} (${pillarRole})`,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            fillColor: "#10B981",
            fillOpacity: 1,
            strokeColor: "#ffffff",
            strokeWeight: 3,
            scale: 9
          }
        });
      } else {
        pillarMarkerRef.current.setPosition(newPos);
      }

      updateRoute(mapInstanceRef.current, newPos, { lat: custLat, lng: custLng });
    }
  }, [pilLat, pilLng, hasPillarCoords]);

  // Dynamic OpenStreetMap Bounding Box
  const deltaLat = 0.012;
  const deltaLng = 0.015;
  const bboxMinLat = Math.min(custLat, pilLat || custLat) - deltaLat;
  const bboxMaxLat = Math.max(custLat, pilLat || custLat) + deltaLat;
  const bboxMinLng = Math.min(custLng, pilLng || custLng) - deltaLng;
  const bboxMaxLng = Math.max(custLng, pilLng || custLng) + deltaLng;
  const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${bboxMinLng}%2C${bboxMinLat}%2C${bboxMaxLng}%2C${bboxMaxLat}&layer=mapnik&marker=${custLat}%2C${custLng}`;

  return (
    <div
      className={`relative rounded-2xl overflow-hidden border border-slate-200 shadow-sm ${className}`}
      style={{ height, width: "100%", background: "#E2E8F0", position: "relative" }}
    >
      {/* 1. OpenStreetMap Interactive Embed Fallback when Google Maps SDK is not loaded */}
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

      {/* Floating Live Telemetry Badge */}
      <div
        style={{
          position: "absolute",
          top: "10px",
          left: "10px",
          background: "rgba(255, 255, 255, 0.95)",
          backdropFilter: "blur(6px)",
          padding: "6px 12px",
          borderRadius: "12px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.12)",
          border: "1px solid rgba(0,0,0,0.08)",
          display: "flex",
          alignItems: "center",
          gap: "8px",
          zIndex: 10,
          fontSize: "12px"
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <span
            style={{
              width: "8px",
              height: "8px",
              borderRadius: "50%",
              background: hasPillarCoords ? "#10B981" : "#F59E0B",
              display: "inline-block"
            }}
          />
          <span style={{ fontWeight: "700", color: "#1E293B" }}>
            {hasPillarCoords ? "Live Telemetry" : "Customer Location"}
          </span>
        </div>
        {routeInfo && (
          <>
            <span style={{ color: "#94A3B8" }}>|</span>
            <div style={{ display: "flex", alignItems: "center", gap: "4px", fontWeight: "700", color: "#EA580C" }}>
              <Clock size={13} />
              <span>ETA {routeInfo.durationMins}m</span>
            </div>
            <span style={{ color: "#64748B", fontSize: "11px" }}>
              ({routeInfo.distanceKm} km)
            </span>
          </>
        )}
      </div>

      {/* External Map Navigation Link */}
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${custLat},${custLng}`}
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
        title="Open turn-by-turn navigation in Google Maps app"
      >
        <Navigation size={13} color="#FF7900" />
        <span>Open Navigation</span>
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
          <span style={{ fontSize: "12px", fontWeight: "600", color: "#475569" }}>Loading route map...</span>
        </div>
      )}
    </div>
  );
}
