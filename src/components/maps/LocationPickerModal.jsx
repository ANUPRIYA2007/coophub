import React, { useState, useEffect, useRef } from "react";
import { googleMapsService } from "../../services/maps/googleMapsService";
import { getCurrentPosition } from "../../services/location/locationService";
import { GOOGLE_MAPS_CONFIG } from "../../config/maps";
import {
  MapPin, Search, Navigation, CheckCircle2, X, AlertCircle,
  Loader2, Building2, Compass
} from "lucide-react";

export default function LocationPickerModal({
  isOpen,
  onClose,
  onConfirmLocation,
  initialCoords = null,
  initialAddress = ""
}) {
  const [coords, setCoords] = useState(
    initialCoords || { lat: GOOGLE_MAPS_CONFIG.defaultCenter.lat, lng: GOOGLE_MAPS_CONFIG.defaultCenter.lng }
  );
  const [searchQuery, setSearchQuery] = useState(initialAddress || "");
  const [predictions, setPredictions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [resolvedAddress, setResolvedAddress] = useState(null);
  const [isResolving, setIsResolving] = useState(false);

  const mapContainerRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const markerRef = useRef(null);

  // Initialize map when modal opens
  useEffect(() => {
    if (!isOpen) return;

    let isMounted = true;

    async function initPickerMap() {
      try {
        const map = await googleMapsService.initializeMap(mapContainerRef.current, {
          center: coords,
          zoom: 15,
          theme: "cleanLight"
        });

        if (!isMounted) return;
        mapInstanceRef.current = map;

        // Add Draggable Marker
        const marker = new window.google.maps.Marker({
          position: coords,
          map,
          draggable: true,
          title: "Drag to pinpoint service location",
          animation: window.google.maps.Animation.DROP
        });

        markerRef.current = marker;

        // Marker drag events
        marker.addListener("dragend", async (e) => {
          const newLat = e.latLng.lat();
          const newLng = e.latLng.lng();
          setCoords({ lat: newLat, lng: newLng });
          await handleReverseGeocode(newLat, newLng);
        });

        // Map click events to reposition marker
        map.addListener("click", async (e) => {
          const newLat = e.latLng.lat();
          const newLng = e.latLng.lng();
          marker.setPosition({ lat: newLat, lng: newLng });
          setCoords({ lat: newLat, lng: newLng });
          await handleReverseGeocode(newLat, newLng);
        });

        // Initial reverse geocode
        await handleReverseGeocode(coords.lat, coords.lng);
      } catch (err) {
        console.warn("Location picker map initialization note:", err);
      }
    }

    initPickerMap();

    return () => {
      isMounted = false;
      if (markerRef.current) markerRef.current.setMap(null);
    };
  }, [isOpen]);

  // Handle Reverse Geocode
  const handleReverseGeocode = async (lat, lng) => {
    setIsResolving(true);
    const res = await googleMapsService.reverseGeocode(lat, lng);
    setResolvedAddress(res);
    setIsResolving(false);
  };

  // Autocomplete place search as user types
  const handleSearchChange = async (e) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (val.trim().length >= 2) {
      setIsSearching(true);
      const results = await googleMapsService.searchPlaces(val);
      setPredictions(results);
      setIsSearching(false);
    } else {
      setPredictions([]);
    }
  };

  // Select place from autocomplete
  const handleSelectPrediction = async (prediction) => {
    setSearchQuery(prediction.mainText);
    setPredictions([]);
    setIsResolving(true);

    const details = await googleMapsService.getPlaceDetails(prediction.placeId, mapInstanceRef.current);
    if (details.success) {
      const newPos = { lat: details.lat, lng: details.lng };
      setCoords(newPos);

      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo(newPos);
        mapInstanceRef.current.setZoom(16);
      }

      if (markerRef.current) {
        markerRef.current.setPosition(newPos);
      }

      setResolvedAddress({
        formattedAddress: details.formattedAddress,
        area: details.area,
        city: details.city,
        pincode: details.pincode,
        placeId: prediction.placeId
      });
    }
    setIsResolving(false);
  };

  // Current Device GPS Locator
  const handleUseCurrentLocation = async () => {
    setIsLocating(true);
    try {
      const pos = await getCurrentPosition({ enableHighAccuracy: true, timeout: 10000 });
      const newCoords = { lat: pos.latitude, lng: pos.longitude };
      setCoords(newCoords);

      if (mapInstanceRef.current) {
        mapInstanceRef.current.panTo(newCoords);
        mapInstanceRef.current.setZoom(16);
      }

      if (markerRef.current) {
        markerRef.current.setPosition(newCoords);
      }

      await handleReverseGeocode(newCoords.lat, newCoords.lng);
    } catch (err) {
      alert("Could not detect device GPS location: " + err.message);
    } finally {
      setIsLocating(false);
    }
  };

  // Submit and confirm location
  const handleConfirm = () => {
    const finalLocation = {
      latitude: coords.lat,
      longitude: coords.lng,
      address_line: resolvedAddress?.formattedAddress || searchQuery || "Selected Location",
      area: resolvedAddress?.area || "Chennai",
      city: resolvedAddress?.city || "Chennai",
      state: resolvedAddress?.state || "Tamil Nadu",
      postal_code: resolvedAddress?.pincode || "600032",
      place_id: resolvedAddress?.placeId || null
    };

    onConfirmLocation(finalLocation);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-3xl max-w-xl w-full shadow-2xl border border-navy-100 overflow-hidden flex flex-col max-h-[92vh] animate-scale-up">
        {/* Header */}
        <div className="p-4 border-b border-navy-100 flex items-center justify-between bg-surface">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold">
              <MapPin size={18} />
            </div>
            <div>
              <h3 className="font-bold text-navy-900 text-base">Select Service Location</h3>
              <p className="text-[11px] text-navy-500">Search place or drag pin on Google Map</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-navy-100 text-navy-500 flex items-center justify-center transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Search & Actions Bar */}
        <div className="p-3 bg-white border-b border-navy-50 space-y-2 relative z-20">
          <div className="relative">
            <input
              type="text"
              placeholder="Search street, landmark, area, or pincode..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-navy-200 text-xs text-navy-900 focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500"
            />
            <Search size={16} className="absolute left-3 top-3 text-navy-400" />
            {isSearching && (
              <Loader2 size={16} className="absolute right-3 top-3 text-orange-500 animate-spin" />
            )}
          </div>

          {/* Autocomplete Predictions Dropdown */}
          {predictions.length > 0 && (
            <div className="absolute top-12 left-3 right-3 bg-white rounded-2xl shadow-xl border border-navy-100 max-h-48 overflow-y-auto divide-y divide-navy-50 z-30">
              {predictions.map((p) => (
                <button
                  key={p.placeId}
                  onClick={() => handleSelectPrediction(p)}
                  className="w-full p-2.5 text-left hover:bg-orange-50/50 flex items-start gap-2.5 transition-colors"
                >
                  <MapPin size={14} className="text-orange-500 shrink-0 mt-0.5" />
                  <div className="text-xs">
                    <p className="font-bold text-navy-800">{p.mainText}</p>
                    {p.secondaryText && <p className="text-navy-500 text-[11px]">{p.secondaryText}</p>}
                  </div>
                </button>
              ))}
            </div>
          )}

          {/* Quick GPS Locator Button */}
          <div className="flex justify-between items-center">
            <button
              onClick={handleUseCurrentLocation}
              disabled={isLocating}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 flex items-center gap-1.5 py-1 px-2.5 rounded-lg hover:bg-orange-50 transition-colors"
            >
              <Compass size={14} className={isLocating ? "animate-spin" : ""} />
              <span>{isLocating ? "Detecting GPS Location..." : "Use My Current Device GPS"}</span>
            </button>
            <span className="text-[10px] text-navy-400 font-mono">
              GPS: {coords.lat.toFixed(4)}, {coords.lng.toFixed(4)}
            </span>
          </div>
        </div>

        {/* Google Map View Canvas */}
        <div className="relative flex-1 min-h-[260px] bg-navy-50">
          <div ref={mapContainerRef} style={{ width: "100%", height: "100%" }} />
          <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-xs px-2.5 py-1 rounded-md text-[10px] font-bold text-navy-600 shadow-xs border border-navy-100 pointer-events-none">
            📍 Drag pin or click map to move
          </div>
        </div>

        {/* Resolved Address Footer */}
        <div className="p-4 bg-white border-t border-navy-100 space-y-3">
          <div className="bg-navy-50/70 p-3 rounded-2xl border border-navy-100 space-y-1 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-orange-600">
                Resolved Canonical Address
              </span>
              {isResolving && <span className="text-[10px] text-navy-400">Resolving street details...</span>}
            </div>

            <p className="font-bold text-navy-900 line-clamp-2">
              {resolvedAddress?.formattedAddress || searchQuery || "Pin Location on Map"}
            </p>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[11px] text-navy-600 pt-1 border-t border-navy-200/50">
              <span>Area: <strong>{resolvedAddress?.area || "Chennai Hub"}</strong></span>
              <span>City: <strong>{resolvedAddress?.city || "Chennai"}</strong></span>
              <span>Pincode: <strong>{resolvedAddress?.pincode || "600032"}</strong></span>
            </div>
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="btn-secondary flex-1 py-2.5 text-xs font-bold"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              className="btn-primary flex-[2] py-2.5 text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center justify-center gap-1.5"
              style={{ background: "#FF7900" }}
            >
              <CheckCircle2 size={15} />
              <span>Confirm & Use Location</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
