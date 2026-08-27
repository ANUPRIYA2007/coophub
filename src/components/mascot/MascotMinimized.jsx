// ===========================
// MascotMinimized — Small floating mascot widget
// ===========================

export default function MascotMinimized({ onClick, className = '' }) {
    return (
        <button
            onClick={onClick}
            className={`mascot-minimized fixed bottom-6 right-6 z-50 ${className}`}
            aria-label="Open COOP HUB assistant"
        >
            {/* Minimized mascot avatar will be rendered here */}
        </button>
    );
}
