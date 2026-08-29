import React, { useEffect, useRef, useState } from "react";
import { googleMapsService } from "../../services/maps/googleMapsService";
import { GOOGLE_MAPS_CONFIG } from "../../config/maps";
import { MapPin, AlertCircle, RefreshCw } from "lucide-react";

/**
 * Reusable Google Maps Container Component
 * @param {object} props
 * @param {{lat: number, lng: number}} [props.center]
 * @param {number} [props.zoom]
 * @param {'cleanLight' | 'darkRadar' | 'default'} [props.theme]
 * @param {Array<{id: string, lat: number, lng: number, title: string, iconUrl?: string, color?: string, onClick?: () => void}>} [props.markers]
 * @param {Array<{lat: number, lng: number}>} [props.polylinePath]
 * @param {string} [props.polylineColor]
 * @param {string} [props.height]
 * @param {function} [props.onMapClick]
 * @param {React.ReactNode} [props.children]
 */
export default function GoogleMapView({
  center = GOOGLE_MAPS_CONFIG.defaultCenter,
  zoom = GOOGLE_MAPS_CONFIG.zoomLevels.hub,
  theme = "cleanLight",
  markers = [],
  polylinePath = null,
  polylineColor = "#FF7900",
  height = "380px",
  className = "",
  style = {},
  onMapClick = null,
  children
}) {
  const containerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markersRef = useRef([]);
  const polylineRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      try {
        setLoading(true);
        setError(null);
        const map = await googleMapsService.initializeMap(containerRef.current, {
          center,
          zoom,
          theme
        });

        if (!isMounted) return;
        mapInstanceRef.current = map;

        if (onMapClick) {
          map.addListener("click", (e) => {
            onMapClick({
              lat: e.latLng.lat(),
              lng: e.latLng.lng()
            });
          });
        }

        setLoading(false);
      } catch (err) {
        if (!isMounted) return;
        console.warn("Google Maps View initialization notice:", err);
        setError(err.message || "Failed to load Google Maps");
        setLoading(false);
      }
    }

    initMap();

    return () => {
      isMounted = false;
      // Clear markers
      markersRef.current.forEach((m) => m.setMap(null));
      markersRef.current = [];
      if (polylineRef.current) {
        polylineRef.current.setMap(null);
      }
    };
  }, [theme]);

  // Update center & zoom dynamically
  useEffect(() => {
    if (mapInstanceRef.current && center?.lat && center?.lng) {
      mapInstanceRef.current.panTo({
        lat: Number(center.lat),
        lng: Number(center.lng)
      });
      if (zoom) {
        mapInstanceRef.current.setZoom(Number(zoom));
      }
    }
  }, [center?.lat, center?.lng, zoom]);

  // Update markers
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    // Clear old markers
    markersRef.current.forEach((m) => m.setMap(null));
    markersRef.current = [];

    markers.forEach((item) => {
      if (item.lat == null || item.lng == null) return;

      const markerOptions = {
        position: { lat: Number(item.lat), lng: Number(item.lng) },
        map: mapInstanceRef.current,
        title: item.title || "Location",
        animation: item.animate ? window.google.maps.Animation.DROP : null
      };

      if (item.color) {
        // Custom SVG circle pin
        markerOptions.icon = {
          path: window.google.maps.SymbolPath.CIRCLE,
          fillColor: item.color,
          fillOpacity: 1,
          strokeColor: "#ffffff",
          strokeWeight: 2.5,
          scale: item.size || 8
        };
      } else if (item.iconUrl) {
        markerOptions.icon = item.iconUrl;
      }

      const marker = new window.google.maps.Marker(markerOptions);

      if (item.onClick) {
        marker.addListener("click", item.onClick);
      }

      markersRef.current.push(marker);
    });
  }, [markers]);

  // Update route polyline
  useEffect(() => {
    if (!mapInstanceRef.current || !window.google?.maps) return;

    if (polylineRef.current) {
      polylineRef.current.setMap(null);
      polylineRef.current = null;
    }

    if (polylinePath && polylinePath.length > 1) {
      const gPath = polylinePath.map((p) => ({
        lat: Number(p.lat),
        lng: Number(p.lng)
      }));

      polylineRef.current = new window.google.maps.Polyline({
        path: gPath,
        geodesic: true,
        strokeColor: polylineColor,
        strokeOpacity: 0.85,
        strokeWeight: 4.5,
        map: mapInstanceRef.current
      });

      // Fit bounds to show entire route
      const bounds = new window.google.maps.LatLngBounds();
      gPath.forEach((pt) => bounds.extend(pt));
      mapInstanceRef.current.fitBounds(bounds, { top: 50, bottom: 50, left: 50, right: 50 });
    }
  }, [polylinePath, polylineColor]);

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border border-navy-100 ${className}`}
      style={{ height, width: "100%", ...style }}
    >
      <div ref={containerRef} style={{ width: "100%", height: "100%" }} />

      {/* Loading Overlay */}
      {loading && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center bg-surface/80 backdrop-blur-xs z-10"
        >
          <div className="spinner mb-2"></div>
          <span className="text-xs font-bold text-navy-600">Connecting Google Maps...</span>
        </div>
      )}

      {/* Fallback View if SDK fails */}
      {error && !loading && (
        <div
          className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-navy-50/90 z-10"
        >
          <MapPin size={36} className="text-orange-500 mb-2 opacity-80" />
          <h4 className="font-bold text-navy-800 text-sm mb-1">Geospatial Preview Mode</h4>
          <p className="text-xs text-navy-500 max-w-xs mb-3">
            {center?.name || `Coordinates: ${center?.lat?.toFixed(4)}, ${center?.lng?.toFixed(4)}`}
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
            <AlertCircle size={12} />
            <span>Map preview fallback active</span>
          </div>
        </div>
      )}

      {/* Overlays / Children */}
      {children}
    </div>
  );
}
