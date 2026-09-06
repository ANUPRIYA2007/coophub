// ==============================================================================
// COOP HUB — Centralized Google Maps Platform Configuration
// ==============================================================================
// Configures Google Maps SDK parameters, environment variables, default map centers,
// visual map style themes, and required Cloud APIs checklist.
// ==============================================================================

// Environment variable resolution
const envKey = import.meta.env?.VITE_GOOGLE_MAPS_API_KEY || "";

export const GOOGLE_MAPS_CONFIG = {
  // Resolved API key
  apiKey: envKey,
  
  // Flag indicating if API key is unconfigured
  isPrototypeKey: !envKey,
  
  // Default Geographic Center: Chennai Cooperative Hub (Guindy)
  defaultCenter: {
    lat: 13.0067,
    lng: 80.2025,
    name: "Cooperative HQ (Guindy, Chennai)"
  },
  
  // Default Zoom Levels
  zoomLevels: {
    city: 11,
    hub: 13,
    street: 15,
    building: 17,
    tracking: 14
  },
  
  // Libraries required by CoopHub
  libraries: ["places", "geometry"],
  
  // Language & Region localization
  language: "en",
  region: "IN",
  
  // Required Google Cloud APIs checklist for developer audit
  requiredCloudApis: [
    { id: "maps_js", name: "Maps JavaScript API", required: true, purpose: "Interactive Map Canvas & Marker Overlays" },
    { id: "places", name: "Places API / Places (New)", required: true, purpose: "Address Autocomplete & Landmark Search" },
    { id: "routes", name: "Routes API / Directions Service", required: true, purpose: "Route Polylines, Distance & Live ETA" },
    { id: "geocoding", name: "Geocoding API", required: true, purpose: "Reverse Coordinates to Address & Pincode" }
  ]
};

// ==========================================
// Custom Map Styles for Rich Aesthetics
// ==========================================

export const MAP_STYLES = {
  // Sleek Dark Theme (Used in Admin Live Radar & Night Mode)
  darkRadar: [
    { elementType: "geometry", stylers: [{ color: "#0B1528" }] },
    { elementType: "labels.text.stroke", stylers: [{ color: "#0B1528" }] },
    { elementType: "labels.text.fill", stylers: [{ color: "#8E9EB5" }] },
    {
      featureType: "administrative.locality",
      elementType: "labels.text.fill",
      stylers: [{ color: "#FF7900" }]
    },
    {
      featureType: "poi",
      elementType: "labels.text.fill",
      stylers: [{ color: "#64748B" }]
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#112240" }]
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#1E293B" }]
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#0F172A" }]
    },
    {
      featureType: "road.highway",
      elementType: "geometry",
      stylers: [{ color: "#334155" }]
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#1E293B" }]
    },
    {
      featureType: "transit",
      elementType: "geometry",
      stylers: [{ color: "#1E293B" }]
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#07111E" }]
    },
    {
      featureType: "water",
      elementType: "labels.text.fill",
      stylers: [{ color: "#475569" }]
    }
  ],

  // Clean Crisp Light Theme (Used in Customer Booking & Tracking)
  cleanLight: [
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#e9eaf2" }]
    },
    {
      featureType: "landscape",
      elementType: "geometry",
      stylers: [{ color: "#f8f9fc" }]
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#ffffff" }]
    },
    {
      featureType: "road.highway",
      elementType: "geometry.fill",
      stylers: [{ color: "#ffe2cc" }]
    },
    {
      featureType: "road.highway",
      elementType: "geometry.stroke",
      stylers: [{ color: "#ffd0b3" }]
    },
    {
      featureType: "poi.park",
      elementType: "geometry",
      stylers: [{ color: "#e8f5e9" }]
    }
  ]
};

/**
 * Validates Google Maps Platform Configuration
 * @returns {{ valid: boolean, message: string, keyPreview: string, isDemo: boolean }}
 */
export function checkGoogleMapsConfig() {
  const key = GOOGLE_MAPS_CONFIG.apiKey;
  const isDemo = GOOGLE_MAPS_CONFIG.isPrototypeKey;

  if (!key) {
    return {
      valid: false,
      message: "Google Maps API Key is missing. Set VITE_GOOGLE_MAPS_API_KEY in .env.",
      keyPreview: "NONE",
      isDemo: false
    };
  }

  return {
    valid: true,
    message: isDemo 
      ? "Using Prototype/Demo Google Maps Key for testing." 
      : "Using Custom Environment Google Maps API Key.",
    keyPreview: `${key.slice(0, 8)}...${key.slice(-4)}`,
    isDemo
  };
}

export default GOOGLE_MAPS_CONFIG;
