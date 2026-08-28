// ===========================
// Location Service
// ===========================
// Uses HTML5 Geolocation API with Google Maps Live Navigation & Location Sharing links

/**
 * Get the user's current position using HTML5 Geolocation API.
 * @param {object} options - PositionOptions (enableHighAccuracy, timeout, maximumAge)
 * @returns {Promise<{latitude: number, longitude: number}>}
 */
export function getCurrentPosition(options = { enableHighAccuracy: true, timeout: 10000 }) {
    return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
            reject(new Error('Geolocation is not supported by this browser.'));
            return;
        }
        navigator.geolocation.getCurrentPosition(
            (position) => {
                resolve({
                    latitude: position.coords.latitude,
                    longitude: position.coords.longitude,
                });
            },
            (error) => reject(error),
            options,
        );
    });
}

/**
 * Build Google Maps Live Location URL matching standard Google Maps format
 * @param {number} lat
 * @param {number} lng
 * @param {number} zoom
 * @returns {string}
 */
export function getGoogleMapsLiveUrl(lat, lng, zoom = 15) {
    const validLat = lat || 13.3627904;
    const validLng = lng || 80.134144;
    return `https://www.google.com/maps/@${validLat},${validLng},${zoom}z?entry=ttu`;
}

/**
 * Build Google Maps Turn-by-Turn Directions URL
 * @param {number} destLat
 * @param {number} destLng
 * @returns {string}
 */
export function getGoogleMapsNavigationUrl(destLat, destLng) {
    const lat = destLat || 13.3627904;
    const lng = destLng || 80.134144;
    return `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;
}

/**
 * Open the user's location in Google Maps (external browser tab).
 * @param {number} lat
 * @param {number} lng
 */
export function openInGoogleMaps(lat, lng) {
    window.open(getGoogleMapsLiveUrl(lat, lng), '_blank', 'noopener,noreferrer');
}

export default {
    getCurrentPosition,
    getGoogleMapsLiveUrl,
    getGoogleMapsNavigationUrl,
    openInGoogleMaps,
};
