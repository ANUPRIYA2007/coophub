import { useState, useEffect } from "react";

export function useGeolocation(enabled = false) {
  const [location, setLocation] = useState(null);
  const [error, setError] = useState(null);
  const [tracking, setTracking] = useState(false);

  useEffect(() => {
    if (!enabled || !("geolocation" in navigator)) {
      return;
    }

    setTracking(true);
    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        setLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: pos.coords.accuracy,
          timestamp: pos.timestamp,
        });
        setError(null);
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
  }, [enabled]);

  return { location, error, tracking };
}
