// ===========================
// COOP HUB — Application Constants
// ===========================

// Portal types for the shared multi-portal architecture
export const PORTALS = {
    CUSTOMER: 'customer',
    WORKER: 'worker',
    COOPERATIVE: 'cooperative',
};

// Current portal
export const CURRENT_PORTAL = PORTALS.CUSTOMER;

// Booking status flow
export const BOOKING_STATUS = {
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    WORKER_EN_ROUTE: 'worker_en_route',
    WORKER_ARRIVED: 'worker_arrived',
    ARRIVAL_VERIFIED: 'arrival_verified',
    IN_PROGRESS: 'in_progress',
    EXTRA_CHARGE_REQUESTED: 'extra_charge_requested',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled',
};

// Realtime event channels
export const REALTIME_EVENTS = {
    BOOKING_CREATED: 'booking.created',
    BOOKING_ACCEPTED: 'booking.accepted',
    WORKER_LOCATION_UPDATED: 'worker.location.updated',
    WORKER_ARRIVED: 'worker.arrived',
    ARRIVAL_VERIFIED: 'arrival.verified',
    SERVICE_STARTED: 'service.started',
    EXTRA_CHARGE_REQUESTED: 'extra_charge.requested',
    SERVICE_COMPLETED: 'service.completed',
    PAYMENT_COMPLETED: 'payment.completed',
    NOTIFICATION_CREATED: 'notification.created',
};

// AI agent types (kept logically separate)
export const AI_AGENTS = {
    MASCOT: 'mascot',   // Proactive guidance, greetings, contextual tips
    CHAT: 'chat',       // Service-booking conversational agent
};

// Supported languages
export const LANGUAGES = {
    en: 'English',
    ta: 'தமிழ்',
    hi: 'हिन्दी',
    te: 'తెలుగు',
    kn: 'ಕನ್ನಡ',
};
