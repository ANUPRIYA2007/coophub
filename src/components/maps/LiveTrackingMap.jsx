import React, { useState, useEffect, useRef } from "react";
import { googleMapsService } from "../../services/maps/googleMapsService";
import { GOOGLE_MAPS_CONFIG } from "../../config/maps";
import {
  Navigation, MapPin, Clock, ExternalLink, ShieldCheck,
  Compass, Radio, AlertCircle
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
      if (!containerRef.current) return;

      try {
        await googleMapsService.loadGoogleMaps();
        if (!window.google || !window.google.maps) return;

        // Base center point (Customer destination)
        const center = { lat: custLat, lng: custLng };

        const map = new window.google.maps.Map(containerRef.current, {
          center,
          zoom: 13,
          mapTypeId: "roadmap",
          disableDefaultUI: false,
          zoomControl: true
        });

        if (!isMounted) return;
        mapInstanceRef.current = map;

        // 1. Customer Marker (Red/Orange Pin)
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
        console.warn("LiveTrackingMap initialization notice:", err);
        setLoading(false);
      }
    }

    initLiveMap();

    return () => {
      isMounted = false;
      if (customerMarkerRef.current) customerMarkerRef.current.setMap(null);
      if (pillarMarkerRef.current) pillarMarkerRef.current.setMap(null);
      if (polylineRef.current) polylineRef.current.setMap(null);
    };
  }, []);

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

  return (
    <div className={`relative rounded-3xl overflow-hidden border border-navy-100 shadow-sm ${className}`} style={{ height }}>
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Floating Live Telemetry Badge */}
      <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-md border border-navy-100/80 flex items-center gap-3 z-10">
        <div className="flex items-center gap-1.5">
          <span className={`w-2.5 h-2.5 rounded-full ${hasPillarCoords ? "bg-emerald-500 animate-ping" : "bg-amber-500"}`}></span>
          <span className="text-[11px] font-bold text-navy-800">
            {hasPillarCoords ? "Live Telemetry Active" : "Service Location"}
          </span>
        </div>
        {routeInfo ? (
          <>
            <span className="text-navy-300">|</span>
            <div className="flex items-center gap-1 text-xs font-bold text-orange-600">
              <Clock size={13} />
              <span>ETA ~{routeInfo.durationMins} mins</span>
            </div>
            <div className="text-[11px] font-medium text-navy-500">
              ({routeInfo.distanceKm} km)
            </div>
          </>
        ) : (
          !hasPillarCoords && (
            <>
              <span className="text-navy-300">|</span>
              <span className="text-[11px] text-navy-500">Awaiting Technician GPS</span>
            </>
          )
        )}
      </div>

      {/* External Map Navigation Link */}
      <a
        href={`https://www.google.com/maps/dir/?api=1&destination=${custLat},${custLng}`}
        target="_blank"
        rel="noopener noreferrer"
        className="absolute bottom-3 right-3 bg-white/95 hover:bg-white text-navy-800 text-[11px] font-bold px-3 py-1.5 rounded-xl shadow-md border border-navy-200/80 flex items-center gap-1.5 transition-all z-10"
      >
        <ExternalLink size={12} className="text-orange-500" />
        <span>Open in Google Maps</span>
      </a>

      {loading && (
        <div className="absolute inset-0 flex items-center justify-center bg-surface/75 backdrop-blur-xs z-20">
          <div className="spinner spinner-sm"></div>
        </div>
      )}
    </div>
  );
}
