// ===========================
// Location Service
// ===========================
// Uses HTML5 Geolocation API (no Google Maps API dependency).
// Google Maps may be opened externally via URL when the user explicitly chooses.

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
 * Open the user's location in Google Maps (external browser tab).
 * @param {number} lat
 * @param {number} lng
 */
export function openInGoogleMaps(lat, lng) {
    window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
}

export default {
    getCurrentPosition,
    openInGoogleMaps,
};
