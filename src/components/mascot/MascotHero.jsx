// ===========================
// MascotHero — Full-size mascot display
// ===========================
// The actual mascot image will be supplied by the user.
// This component provides the architecture for displaying and animating it.

export default function MascotHero({ className = '' }) {
    return (
        <div className={`mascot-hero ${className}`}>
            {/* Mascot hero image will be rendered here once the asset is provided */}
        </div>
    );
}
