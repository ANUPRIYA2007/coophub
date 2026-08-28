import { useState, useEffect, useRef } from "react";
import { supabase } from "../../lib/supabase";

export function useGeolocation(enabled = false, pillarId = null, isDemo = false) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [tracking, setTracking] = useState(false);
  const lastSyncRef = useRef(0);

  useEffect(() => {
    if (!enabled || !("geolocation" in navigator)) {
      setTracking(false);
      return;
    }

    setTracking(true);
    const watchId = navigator.geolocation.watchPosition(
      async (pos) => {
        const coords = {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        };
        setLocation(coords);
        setError(null);

        // Real Mode: Throttle update to Supabase (at most once every 15 seconds)
        const now = Date.now();
        if (!isDemo && pillarId && now - lastSyncRef.current > 15000) {
          lastSyncRef.current = now;
          try {
            await supabase
              .from("pillar_profiles")
              .update({
                current_lat: pos.coords.latitude,
                current_lng: pos.coords.longitude,
                last_active_at: new Date().toISOString(),
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                last_location_at: new Date().toISOString()
              })
              .eq("id", pillarId);
          } catch (syncErr) {
            console.warn("GPS telemetry sync note:", syncErr);
          }
        }
      },
      (err) => {
        setError(err.message);
      },
      {
        enableHighAccuracy: true,
        timeout: 15000,
        maximumAge: 10000,
      }
    );

    return () => {
      navigator.geolocation.clearWatch(watchId);
      setTracking(false);
    };
  }, [enabled, pillarId, isDemo]);

  return { location, error, tracking };
}

export default useGeolocation;
