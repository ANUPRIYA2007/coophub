export const locationService = {
    // Attempt to parse standard Geolocation API coordinates natively
    getCurrentPosition: () => {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error('Geolocation is not supported by your browser'));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                (position) => {
                    resolve({
                        latitude: position.coords.latitude,
                        longitude: position.coords.longitude
                    });
                },
                (error) => {
                    let errorMessage = 'Location unavailable';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errorMessage = 'User denied the request for Geolocation. Please allow location access or type manually.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errorMessage = 'Location information is unavailable.';
                            break;
                        case error.TIMEOUT:
                            errorMessage = 'The request to get user location timed out.';
                            break;
                    }
                    reject(new Error(errorMessage));
                },
                { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
            );
        });
    },

    // Try to rely on the Web Share API if possible
    shareLocation: async (url, title, text) => {
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title || 'Service Location',
                    text: text || 'Here is my requested service location.',
                    url: url
                });
                return true;
            } catch (err) {
                if (err.name !== 'AbortError') {
                    throw new Error('Failed to share location');
                }
                return false;
            }
        } else {
            throw new Error('Web Share API is not supported in your browser');
        }
    }
};
