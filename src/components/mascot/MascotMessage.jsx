// ===========================
// MascotMessage — Speech bubble for mascot guidance
// ===========================

export default function MascotMessage({ message, onDismiss, className = '' }) {
    if (!message) return null;

    return (
        <div className={`mascot-message ${className}`} role="alert">
            <p>{message}</p>
            {onDismiss && (
                <button onClick={onDismiss} aria-label="Dismiss message" className="ml-2 text-gray-400 hover:text-gray-600">
                    ✕
                </button>
            )}
        </div>
    );
}
