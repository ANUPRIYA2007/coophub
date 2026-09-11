// ==============================================================================
// COOP HUB — Central Google Maps Platform Unified Service
// ==============================================================================
// Reusable singleton service handling:
//  - Async Google Maps SDK Loading with Promise Caching
//  - Map Initialization & Theming
//  - Geocoding & Reverse Geocoding (Coordinates <-> Address/Pincode)
//  - Google Places Autocomplete & Details
//  - Routes & Directions Service (Polyline, Distance, Live ETA)
//  - Distance Matrix calculations for Intelligent Workforce Matching
//  - Custom Pillar & Customer Marker Factory
//  - Graceful Offline & Error Fallbacks
// ==============================================================================

import { GOOGLE_MAPS_CONFIG, MAP_STYLES } from "../../config/maps.js";

class GoogleMapsService {
  constructor() {
    this.sdkPromise = null;
    this.isLoaded = false;
    this.loadError = null;
    this.geocoder = null;
    this.directionsService = null;
    this.distanceMatrixService = null;
    this.autocompleteService = null;
    this.placesService = null;
  }

  /**
   * Dynamically loads the Google Maps JavaScript SDK script with caching.
   * Resolves immediately if SDK is already available on window.google.maps.
   * @returns {Promise<typeof google.maps>}
   */
  async loadGoogleMapsSdk() {
    // 0. Handle Node.js / CLI environments gracefully
    if (typeof window === 'undefined') {
      this.isLoaded = false;
      return Promise.reject(new Error("Google Maps SDK requires browser environment. Falling back to Haversine."));
    }

    // 1. If already loaded in window
    if (window.google && window.google.maps) {
      this.isLoaded = true;
      this._initializeInternalServices();
      return window.google.maps;
    }

    // 2. Return existing loading promise if already in-flight
    if (this.sdkPromise) {
      return this.sdkPromise;
    }

    // 3. Initiate dynamic script loading
    this.sdkPromise = new Promise((resolve, reject) => {
      // Check for existing script in DOM
      const existingScript = document.getElementById("coophub-google-maps-script");
      if (existingScript) {
        existingScript.addEventListener("load", () => {
          this.isLoaded = true;
          this._initializeInternalServices();
          resolve(window.google.maps);
        });
        existingScript.addEventListener("error", (err) => {
          this.loadError = err;
          reject(new Error("Failed to load Google Maps SDK script"));
        });
        return;
      }

      const apiKey = GOOGLE_MAPS_CONFIG.apiKey;
      const libraries = GOOGLE_MAPS_CONFIG.libraries.join(",");
      const callbackName = `__coophub_maps_callback_${Date.now()}`;

      window[callbackName] = () => {
        delete window[callbackName];
        this.isLoaded = true;
        this._initializeInternalServices();
        resolve(window.google.maps);
      };

      const script = document.createElement("script");
      script.id = "coophub-google-maps-script";
      script.type = "text/javascript";
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=${libraries}&callback=${callbackName}&region=${GOOGLE_MAPS_CONFIG.region}&language=${GOOGLE_MAPS_CONFIG.language}&loading=async`;
      script.async = true;
      script.defer = true;

      script.onerror = (err) => {
        this.loadError = err;
        delete window[callbackName];
        console.warn("Google Maps SDK script failed to load. Operating in fallback mode.", err);
        reject(new Error("Unable to connect to Google Maps Platform"));
      };

      document.head.appendChild(script);
    });

    return this.sdkPromise;
  }

  /**
   * Internal helper to instantiate shared services once SDK is loaded
   * @private
   */
  _initializeInternalServices() {
    if (!window.google?.maps) return;
    try {
      if (!this.geocoder) this.geocoder = new window.google.maps.Geocoder();
      if (!this.directionsService) this.directionsService = new window.google.maps.DirectionsService();
      if (!this.distanceMatrixService) this.distanceMatrixService = new window.google.maps.DistanceMatrixService();
      if (!this.autocompleteService && window.google.maps.places) {
        this.autocompleteService = new window.google.maps.places.AutocompleteService();
      }
    } catch (e) {
      console.warn("Could not instantiate internal Google Maps services:", e);
    }
  }

  /**
   * Initializes a Google Map on a DOM container element
   * @param {HTMLElement} container 
   * @param {object} options 
   * @returns {Promise<google.maps.Map>}
   */
  async initializeMap(container, options = {}) {
    if (!container) throw new Error("Map container element is required");
    await this.loadGoogleMapsSdk();

    const {
      center = GOOGLE_MAPS_CONFIG.defaultCenter,
      zoom = GOOGLE_MAPS_CONFIG.zoomLevels.hub,
      theme = "cleanLight", // 'cleanLight' | 'darkRadar' | 'default'
      disableDefaultUI = false,
      zoomControl = true,
      mapTypeControl = false,
      streetViewControl = false,
      fullscreenControl = true,
      gestureHandling = "auto"
    } = options;

    const styles = theme === "darkRadar" 
      ? MAP_STYLES.darkRadar 
      : (theme === "cleanLight" ? MAP_STYLES.cleanLight : null);

    const mapOptions = {
      center: { lat: Number(center.lat), lng: Number(center.lng) },
      zoom: Number(zoom),
      styles,
      disableDefaultUI,
      zoomControl,
      mapTypeControl,
      streetViewControl,
      fullscreenControl,
      gestureHandling,
      mapTypeId: window.google.maps.MapTypeId.ROADMAP
    };

    const map = new window.google.maps.Map(container, mapOptions);
    return map;
  }

  /**
   * Geocode a textual address into GPS coordinates
   * @param {string} address 
   * @returns {Promise<{lat: number, lng: number, formattedAddress: string, placeId: string, success: boolean}>}
   */
  async geocodeAddress(address) {
    if (!address || typeof address !== "string") {
      return { success: false, error: "Invalid address string" };
    }

    try {
      await this.loadGoogleMapsSdk();
      this._initializeInternalServices();

      return new Promise((resolve) => {
        this.geocoder.geocode({ address, region: "IN" }, (results, status) => {
          if (status === window.google.maps.GeocoderStatus.OK && results?.[0]) {
            const loc = results[0].geometry.location;
            resolve({
              success: true,
              lat: loc.lat(),
              lng: loc.lng(),
              formattedAddress: results[0].formatted_address,
              placeId: results[0].place_id,
              addressComponents: results[0].address_components
            });
          } else {
            resolve({
              success: false,
              error: `Geocoding status: ${status}`,
              lat: GOOGLE_MAPS_CONFIG.defaultCenter.lat,
              lng: GOOGLE_MAPS_CONFIG.defaultCenter.lng,
              formattedAddress: address
            });
          }
        });
      });
    } catch (err) {
      console.warn("Geocoding exception:", err);
      return {
        success: false,
        error: err.message,
        lat: GOOGLE_MAPS_CONFIG.defaultCenter.lat,
        lng: GOOGLE_MAPS_CONFIG.defaultCenter.lng,
        formattedAddress: address
      };
    }
  }

  /**
   * Reverse geocodes coordinates to canonical address components
   * Uses Google Geocoder if available, with automatic fallback to OpenStreetMap / Photon / BigDataCloud.
   * NEVER returns raw coordinates in address fields.
   * @param {number} lat 
   * @param {number} lng 
   * @returns {Promise<{success: boolean, formattedAddress: string, street: string, area: string, city: string, state: string, pincode: string, placeId: string}>}
   */
  async reverseGeocode(lat, lng) {
    if (lat == null || lng == null) {
      return {
        success: false,
        formattedAddress: "",
        street: "",
        area: "Chennai Area",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600032",
        placeId: null
      };
    }

    // 1. Attempt Google Maps Geocoder if SDK is available
    try {
      await this.loadGoogleMapsSdk();
      this._initializeInternalServices();

      if (this.geocoder) {
        const googleRes = await new Promise((resolve) => {
          const latlng = { lat: Number(lat), lng: Number(lng) };
          this.geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === window.google.maps.GeocoderStatus.OK && results?.[0]) {
              const result = results[0];
              const parsed = this._extractAddressComponents(result.address_components || []);
              const street = parsed.street || (result.formatted_address ? result.formatted_address.split(",")[0] : "");

              resolve({
                success: true,
                formattedAddress: result.formatted_address,
                street,
                area: parsed.area || parsed.sublocality || "Chennai Locality",
                city: parsed.city || "Chennai",
                state: parsed.state || "Tamil Nadu",
                pincode: parsed.pincode || "600032",
                placeId: result.place_id,
                rawComponents: result.address_components
              });
            } else {
              resolve(null);
            }
          });
        });

        if (googleRes) {
          return googleRes;
        }
      }
    } catch (err) {
      console.warn("Google reverse geocoding note, using fallback geocoders:", err?.message);
    }

    // 2. High-accuracy fallback to open services (Photon/OSM & BigDataCloud)
    return await this._reverseGeocodeFallback(lat, lng);
  }

  /**
   * Fallback reverse geocoding using Photon (OSM) and BigDataCloud
   * @private
   */
  async _reverseGeocodeFallback(lat, lng) {
    // 1. Try Photon (OpenStreetMap, CORS enabled, fast)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(`https://photon.komoot.io/reverse?lat=${lat}&lon=${lng}`, {
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const p = data?.features?.[0]?.properties;
        if (p) {
          const streetParts = [p.name, p.street].filter(Boolean).filter((v, i, a) => a.indexOf(v) === i);
          const street = streetParts.join(", ");
          const area = p.district || p.suburb || p.county || "Chennai Locality";
          let city = p.city || p.county || "Chennai";
          if (city.includes("Cantonment") || city.includes("taluk") || city.includes("district")) {
            city = "Chennai";
          }
          const state = p.state || "Tamil Nadu";
          const pincode = p.postcode || "600032";
          const formattedAddress = [street, area, city, pincode].filter(Boolean).join(", ");

          return {
            success: true,
            formattedAddress,
            street,
            area,
            city,
            state,
            pincode,
            placeId: p.osm_id ? `osm_${p.osm_id}` : null
          };
        }
      }
    } catch (e) {
      console.warn("Photon fallback reverse geocode note:", e?.message);
    }

    // 2. Try BigDataCloud (CORS enabled, client-friendly)
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);
      const res = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${lat}&longitude=${lng}&localityLanguage=en`,
        { signal: controller.signal }
      );
      clearTimeout(timeoutId);

      if (res.ok) {
        const data = await res.json();
        const locality = data.locality || "Chennai Locality";
        const city = data.city || "Chennai";
        const state = data.principalSubdivision || "Tamil Nadu";
        const pincode = data.postcode || "600032";
        const formattedAddress = [locality, city, pincode].filter(Boolean).join(", ");

        return {
          success: true,
          formattedAddress,
          street: "",
          area: locality,
          city,
          state,
          pincode,
          placeId: data.plusCode || null
        };
      }
    } catch (e) {
      console.warn("BigDataCloud fallback reverse geocode note:", e?.message);
    }

    // 3. Last resort fallback (Clean without raw coordinates in address fields)
    return {
      success: false,
      formattedAddress: "",
      street: "",
      area: "Chennai Area",
      city: "Chennai",
      state: "Tamil Nadu",
      pincode: "600032",
      placeId: null
    };
  }

  /**
   * Search place suggestions (Google Places Autocomplete)
   * @param {string} input 
   * @param {object} options 
   * @returns {Promise<Array<{placeId: string, description: string, mainText: string, secondaryText: string}>>}
   */
  async searchPlaces(input, options = {}) {
    if (!input || input.trim().length < 2) return [];

    try {
      await this.loadGoogleMapsSdk();
      this._initializeInternalServices();

      if (!this.autocompleteService) {
        return [];
      }

      return new Promise((resolve) => {
        const request = {
          input,
          componentRestrictions: { country: "in" },
          locationBias: new window.google.maps.Circle({
            center: GOOGLE_MAPS_CONFIG.defaultCenter,
            radius: 40000 // 40km around Chennai
          }),
          ...options
        };

        this.autocompleteService.getPlacePredictions(request, (predictions, status) => {
          if (status === window.google.maps.places.PlacesServiceStatus.OK && predictions) {
            const results = predictions.map(p => ({
              placeId: p.place_id,
              description: p.description,
              mainText: p.structured_formatting?.main_text || p.description,
              secondaryText: p.structured_formatting?.secondary_text || ""
            }));
            resolve(results);
          } else {
            resolve([]);
          }
        });
      });
    } catch (err) {
      console.warn("Place search exception:", err);
      return [];
    }
  }

  /**
   * Get detailed geometry and address information for a placeId
   * @param {string} placeId 
   * @param {google.maps.Map} [mapInstance] 
   * @returns {Promise<{lat: number, lng: number, formattedAddress: string, area: string, city: string, pincode: string}>}
   */
  async getPlaceDetails(placeId, mapInstance = null) {
    try {
      await this.loadGoogleMapsSdk();
      this._initializeInternalServices();

      const container = mapInstance ? mapInstance.getDiv() : document.createElement("div");
      const service = new window.google.maps.places.PlacesService(container);

      return new Promise((resolve, reject) => {
        service.getDetails(
          {
            placeId,
            fields: ["geometry", "formatted_address", "address_components", "name"]
          },
          (place, status) => {
            if (status === window.google.maps.places.PlacesServiceStatus.OK && place?.geometry?.location) {
              const loc = place.geometry.location;
              const parsed = this._extractAddressComponents(place.address_components || []);
              resolve({
                success: true,
                lat: loc.lat(),
                lng: loc.lng(),
                formattedAddress: place.formatted_address || place.name,
                area: parsed.area || parsed.sublocality || place.name,
                city: parsed.city || "Chennai",
                pincode: parsed.pincode || "600032"
              });
            } else {
              reject(new Error(`Failed to fetch place details: ${status}`));
            }
          }
        );
      });
    } catch (err) {
      console.warn("getPlaceDetails exception:", err);
      return {
        success: false,
        error: err.message,
        lat: GOOGLE_MAPS_CONFIG.defaultCenter.lat,
        lng: GOOGLE_MAPS_CONFIG.defaultCenter.lng
      };
    }
  }

  /**
   * Calculate Google Route between Origin (Pillar GPS) and Destination (Customer Service Location)
   * @param {{lat: number, lng: number}} origin 
   * @param {{lat: number, lng: number}} destination 
   * @param {string} [travelMode="DRIVING"]
   * @returns {Promise<{success: boolean, distanceKm: number, durationMins: number, durationText: string, distanceText: string, path: Array<{lat: number, lng: number}>, routeResult: any}>}
   */
  async calculateRoute(origin, destination, travelMode = "DRIVING") {
    const originLat = Number(origin?.lat || origin?.latitude || 13.0067);
    const originLng = Number(origin?.lng || origin?.longitude || 80.2025);
    const destLat = Number(destination?.lat || destination?.latitude || 13.0418);
    const destLng = Number(destination?.lng || destination?.longitude || 80.2341);

    try {
      await this.loadGoogleMapsSdk();
      this._initializeInternalServices();

      const request = {
        origin: new window.google.maps.LatLng(originLat, originLng),
        destination: new window.google.maps.LatLng(destLat, destLng),
        travelMode: window.google.maps.TravelMode[travelMode] || window.google.maps.TravelMode.DRIVING,
        unitSystem: window.google.maps.UnitSystem.METRIC
      };

      return new Promise((resolve) => {
        this.directionsService.route(request, (result, status) => {
          if (status === window.google.maps.DirectionsStatus.OK && result.routes?.[0]?.legs?.[0]) {
            const leg = result.routes[0].legs[0];
            const distanceKm = Math.round((leg.distance.value / 1000) * 10) / 10;
            const durationMins = Math.ceil(leg.duration.value / 60);

            // Extract polyline path coordinates
            const path = result.routes[0].overview_path.map(p => ({
              lat: p.lat(),
              lng: p.lng()
            }));

            resolve({
              success: true,
              distanceKm,
              durationMins,
              distanceText: leg.distance.text,
              durationText: leg.duration.text,
              startAddress: leg.start_address,
              endAddress: leg.end_address,
              path,
              routeResult: result
            });
          } else {
            // Fallback to Haversine calculation
            const fallbackDist = this.calculateHaversineDistance(originLat, originLng, destLat, destLng);
            const fallbackMins = Math.ceil((fallbackDist / 25) * 60) + 5; // Avg 25 km/h city speed
            resolve({
              success: false,
              isFallback: true,
              distanceKm: fallbackDist,
              durationMins: fallbackMins,
              distanceText: `${fallbackDist} km`,
              durationText: `~${fallbackMins} mins`,
              path: [
                { lat: originLat, lng: originLng },
                { lat: destLat, lng: destLng }
              ],
              error: `Directions status: ${status}`
            });
          }
        });
      });
    } catch (err) {
      console.warn("calculateRoute exception:", err);
      const fallbackDist = this.calculateHaversineDistance(originLat, originLng, destLat, destLng);
      const fallbackMins = Math.ceil((fallbackDist / 25) * 60) + 5;
      return {
        success: false,
        isFallback: true,
        distanceKm: fallbackDist,
        durationMins: fallbackMins,
        distanceText: `${fallbackDist} km`,
        durationText: `~${fallbackMins} mins`,
        path: [
          { lat: originLat, lng: originLng },
          { lat: destLat, lng: destLng }
        ],
        error: err.message
      };
    }
  }

  /**
   * Calculate distance matrix for multiple candidates (e.g. Workforce Matching)
   * @param {Array<{lat: number, lng: number}>} origins 
   * @param {Array<{lat: number, lng: number}>} destinations 
   * @returns {Promise<Array<Array<{distanceKm: number, durationMins: number, status: string}>>>}
   */
  async calculateDistanceMatrix(origins, destinations) {
    try {
      await this.loadGoogleMapsSdk();
      this._initializeInternalServices();

      const originLatLngs = origins.map(o => new window.google.maps.LatLng(Number(o.lat), Number(o.lng)));
      const destLatLngs = destinations.map(d => new window.google.maps.LatLng(Number(d.lat), Number(d.lng)));

      return new Promise((resolve) => {
        this.distanceMatrixService.getDistanceMatrix(
          {
            origins: originLatLngs,
            destinations: destLatLngs,
            travelMode: window.google.maps.TravelMode.DRIVING,
            unitSystem: window.google.maps.UnitSystem.METRIC
          },
          (response, status) => {
            if (status === window.google.maps.DistanceMatrixStatus.OK && response?.rows) {
              const matrix = response.rows.map(row =>
                row.elements.map(el => {
                  if (el.status === "OK") {
                    return {
                      distanceKm: Math.round((el.distance.value / 1000) * 10) / 10,
                      durationMins: Math.ceil(el.duration.value / 60),
                      distanceText: el.distance.text,
                      durationText: el.duration.text,
                      status: "OK"
                    };
                  }
                  return { distanceKm: 5, durationMins: 15, status: el.status };
                })
              );
              resolve(matrix);
            } else {
              // Fallback to Haversine matrix
              resolve(this._generateHaversineMatrix(origins, destinations));
            }
          }
        );
      });
    } catch (err) {
      console.warn("Distance matrix exception, falling back to Haversine:", err);
      return this._generateHaversineMatrix(origins, destinations);
    }
  }

  /**
   * Pure mathematical Haversine distance calculator in KM (Reliable zero-dependency fallback)
   */
  calculateHaversineDistance(lat1, lon1, lat2, lon2) {
    if (lat1 == null || lon1 == null || lat2 == null || lon2 == null) return null;
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  /**
   * Helper to parse address components into structured format
   * @private
   */
  _extractAddressComponents(components = []) {
    const result = {
      premise: "",
      streetNumber: "",
      route: "",
      street: "",
      pincode: "",
      area: "",
      sublocality: "",
      city: "",
      state: ""
    };

    components.forEach((c) => {
      const types = c.types || [];
      if (types.includes("premise") || types.includes("subpremise")) result.premise = c.long_name;
      if (types.includes("street_number")) result.streetNumber = c.long_name;
      if (types.includes("route")) result.route = c.long_name;
      if (types.includes("postal_code")) result.pincode = c.long_name;
      if (types.includes("sublocality_level_2")) result.sublocality = c.long_name;
      if (types.includes("sublocality_level_1") || types.includes("sublocality")) {
        result.sublocality = result.sublocality ? `${result.sublocality}, ${c.long_name}` : c.long_name;
      }
      if (types.includes("neighborhood") || types.includes("locality")) result.area = c.long_name;
      if (types.includes("administrative_area_level_2") || types.includes("locality")) result.city = c.long_name;
      if (types.includes("administrative_area_level_1")) result.state = c.long_name;
    });

    result.street = [result.premise, result.streetNumber, result.route].filter(Boolean).join(" ");
    return result;
  }

  /**
   * Internal Haversine matrix generator fallback
   * @private
   */
  _generateHaversineMatrix(origins, destinations) {
    return origins.map(orig =>
      destinations.map(dest => {
        const dist = this.calculateHaversineDistance(orig.lat, orig.lng, dest.lat, dest.lng);
        const mins = dist !== null ? Math.ceil((dist / 25) * 60) + 5 : 0;
        return {
          distanceKm: dist,
          durationMins: mins,
          distanceText: dist !== null ? `${dist} km` : 'Unavailable',
          durationText: dist !== null ? `~${mins} mins` : 'Unavailable',
          status: dist !== null ? "FALLBACK_OK" : "FAILED"
        };
      })
    );
  }
}

export const googleMapsService = new GoogleMapsService();
export default googleMapsService;
