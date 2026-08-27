// ===========================
// MascotNotification — Mascot-driven notification pop-up
// ===========================

export default function MascotNotification({ notification, onClose, className = '' }) {
    if (!notification) return null;

    return (
        <div className={`mascot-notification ${className}`} role="status">
            <p>{notification}</p>
            {onClose && (
                <button onClick={onClose} aria-label="Close notification" className="ml-2 text-gray-400 hover:text-gray-600">
                    ✕
                </button>
            )}
        </div>
    );
}
