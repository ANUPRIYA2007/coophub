import React, { useMemo } from 'react';
import RotatingCards from '../ui/RotatingCards';

/* ═══════════════════════════════════════════════════════
   Crisp, detailed vector illustrations matching the design system
   ═══════════════════════════════════════════════════════ */
export const ServiceSvgIcons = {
  electrical: (color = '#EA580C') => (
    <svg viewBox="0 0 64 64" fill="none" style={{ width: '100%', height: '100%' }}>
      <path d="M37 4L15 36h14L23 60l26-32H35L45 4H37z" fill={color} opacity="0.95" />
    </svg>
  ),
  plumbing: (color = '#2563EB') => (
    <svg viewBox="0 0 64 64" fill="none" style={{ width: '100%', height: '100%' }}>
      <path
        d="M20 10 C14 10, 10 14, 10 20 C10 24.5, 12.5 28.5, 16 30.5 L33.5 48 C35.5 51.5, 39.5 54, 44 54 C50 54, 54 50, 54 44 C54 39.5, 51.5 35.5, 48 33.5 L30.5 16 C28.5 12.5, 24.5 10, 20 10 Z"
        fill={color}
        opacity="0.85"
      />
      <circle cx="20" cy="20" r="5" fill="#ffffff" />
      <path d="M41 47 L47 41" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" />
    </svg>
  ),
  carpentry: (color = '#2563EB') => (
    <svg viewBox="0 0 64 64" fill="none" style={{ width: '100%', height: '100%' }}>
      <rect x="29" y="24" width="7" height="34" rx="2.5" fill={color} opacity="0.8" transform="rotate(35 32 40)" />
      <path
        d="M20 16 L40 28 C41 24, 46 22, 50 24 L52 20 C46 16, 40 14, 34 16 L22 10 C20 11, 19 14, 20 16 Z"
        fill={color}
        opacity="0.95"
      />
      <rect x="18" y="14" width="6" height="8" rx="1.5" fill={color} opacity="0.9" transform="rotate(35 21 18)" />
    </svg>
  ),
  acService: (color = '#2563EB') => (
    <svg viewBox="0 0 64 64" fill="none" style={{ width: '100%', height: '100%' }}>
      <rect x="8" y="18" width="48" height="26" rx="5" fill={color} opacity="0.2" stroke={color} strokeWidth="2.5" />
      <line x1="14" y1="36" x2="50" y2="36" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.8" />
      <line x1="14" y1="31" x2="42" y2="31" stroke={color} strokeWidth="1.5" strokeDasharray="3 3" opacity="0.5" />
      <circle cx="45" cy="25" r="2" fill={color} opacity="0.9" />
      <path d="M22 47 Q24 53 20 57" stroke={color} strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
      <path d="M32 47 Q34 54 32 58" stroke={color} strokeWidth="1.8" strokeLinecap="round" opacity="0.7" />
      <path d="M42 47 Q44 53 40 57" stroke={color} strokeWidth="1.8" strokeLinecap="round" opacity="0.6" />
    </svg>
  ),
  cleaning: (color = '#D97706') => (
    <svg viewBox="0 0 64 64" fill="none" style={{ width: '100%', height: '100%' }}>
      <line x1="44" y1="12" x2="28" y2="34" stroke={color} strokeWidth="3.5" strokeLinecap="round" opacity="0.85" />
      <path
        d="M28 34 L18 48 C16 51, 20 55, 24 55 L38 43 C38 41, 37 38, 35 36 Z"
        fill={color}
        opacity="0.5"
      />
      <line x1="20" y1="52" x2="25" y2="44" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="25" y1="54" x2="30" y2="44" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="48" cy="22" r="2" fill={color} opacity="0.8" />
      <circle cx="42" cy="10" r="1.5" fill={color} opacity="0.8" />
    </svg>
  ),
  painting: (color = '#EA580C') => (
    <svg viewBox="0 0 64 64" fill="none" style={{ width: '100%', height: '100%' }}>
      <rect x="18" y="14" width="28" height="14" rx="4" fill={color} opacity="0.8" />
      <path d="M46 21 L52 21 C54 21, 54 26, 52 28 L35 34 L35 44" stroke={color} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" fill="none" opacity="0.85" />
      <rect x="31" y="44" width="8" height="13" rx="2" fill={color} opacity="0.9" />
    </svg>
  ),
  driver: (color = '#2563EB') => (
    <svg viewBox="0 0 64 64" fill="none" style={{ width: '100%', height: '100%' }}>
      <path
        d="M14 38 L19 23 C20.5 19, 23 18, 27 18 L37 18 C41 18, 43.5 19, 45 23 L50 38 C53 39, 54 41, 54 44 L54 50 C54 52, 52 53, 50 53 L48 53 C46 53, 45 52, 45 50 L45 48 L19 48 L19 50 C19 52, 18 53, 16 53 L14 53 C12 53, 10 52, 10 50 L10 44 C10 41, 11 39, 14 38 Z"
        fill={color}
        opacity="0.85"
      />
      <path d="M20 25 L44 25 L47 36 L17 36 Z" fill="#ffffff" opacity="0.9" />
      <circle cx="16" cy="42" r="2.5" fill="#ffffff" />
      <circle cx="48" cy="42" r="2.5" fill="#ffffff" />
    </svg>
  ),
  gardening: (color = '#16A34A') => (
    <svg viewBox="0 0 64 64" fill="none" style={{ width: '100%', height: '100%' }}>
      <path d="M32 40 L32 20 C32 16, 26 12, 19 15 C18 22, 24 26, 31 25" fill={color} opacity="0.85" />
      <path d="M32 26 C37 18, 47 18, 48 24 C48 30, 39 33, 33 30" fill={color} opacity="0.7" />
      <path d="M22 40 L42 40 L39 55 L25 55 Z" fill={color} opacity="0.9" rx="1" />
    </svg>
  ),
  caregiving: (color = '#E11D48') => (
    <svg viewBox="0 0 64 64" fill="none" style={{ width: '100%', height: '100%' }}>
      <path
        d="M32 54 S12 40 12 24 C12 16, 18 10, 26 10 C30 10, 33 13, 32 16 C31 13, 34 10, 38 10 C46 10, 52 16, 52 24 C52 40, 32 54, 32 54 Z"
        fill={color}
        opacity="0.85"
      />
      <path d="M26 18 C23 18, 20 21, 20 25" stroke="#ffffff" strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  technician: (color = '#2563EB') => (
    <svg viewBox="0 0 64 64" fill="none" style={{ width: '100%', height: '100%' }}>
      <circle cx="32" cy="32" r="14" stroke={color} strokeWidth="5" fill="none" opacity="0.9" strokeDasharray="9 3" />
      <circle cx="32" cy="32" r="6" fill={color} opacity="0.9" />
    </svg>
  ),
  appliances: (color = '#0284C7') => (
    <svg viewBox="0 0 64 64" fill="none" style={{ width: '100%', height: '100%' }}>
      <rect x="14" y="10" width="36" height="44" rx="6" stroke={color} strokeWidth="3" fill="none" opacity="0.9" />
      <circle cx="32" cy="34" r="11" stroke={color} strokeWidth="2.5" fill="none" opacity="0.8" />
      <circle cx="32" cy="34" r="5" fill={color} opacity="0.8" />
      <circle cx="22" cy="18" r="2" fill={color} opacity="0.9" />
      <circle cx="28" cy="18" r="2" fill={color} opacity="0.9" />
    </svg>
  ),
  emergency: (color = '#DC2626') => (
    <svg viewBox="0 0 64 64" fill="none" style={{ width: '100%', height: '100%' }}>
      <path d="M32 8 L48 16 V32 C48 44 32 56 32 56 C32 56 16 44 16 32 V16 L32 8 Z" fill={color} opacity="0.2" stroke={color} strokeWidth="3" />
      <path d="M32 20 V34" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <circle cx="32" cy="42" r="2.5" fill={color} />
    </svg>
  ),
  verified: (color = '#059669') => (
    <svg viewBox="0 0 64 64" fill="none" style={{ width: '100%', height: '100%' }}>
      <circle cx="32" cy="32" r="22" stroke={color} strokeWidth="3" fill={color} fillOpacity="0.15" />
      <path d="M22 32 L29 39 L42 24" stroke={color} strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  training: (color = '#7C3AED') => (
    <svg viewBox="0 0 64 64" fill="none" style={{ width: '100%', height: '100%' }}>
      <path d="M32 12 L10 24 L32 36 L54 24 L32 12 Z" fill={color} opacity="0.85" />
      <path d="M18 30 V42 C18 42 24 48 32 48 C40 48 46 42 46 42 V30" stroke={color} strokeWidth="3" fill="none" strokeLinecap="round" />
      <line x1="50" y1="26" x2="50" y2="44" stroke={color} strokeWidth="2.5" strokeLinecap="round" />
    </svg>
  ),
  onDemand: (color = '#F59E0B') => (
    <svg viewBox="0 0 64 64" fill="none" style={{ width: '100%', height: '100%' }}>
      <circle cx="32" cy="34" r="18" stroke={color} strokeWidth="3" fill="none" opacity="0.8" />
      <path d="M32 24 V34 L39 39" stroke={color} strokeWidth="3" strokeLinecap="round" />
      <line x1="32" y1="10" x2="32" y2="16" stroke={color} strokeWidth="3" strokeLinecap="round" />
    </svg>
  ),
  domestic: (color = '#D97706') => (
    <svg viewBox="0 0 64 64" fill="none" style={{ width: '100%', height: '100%' }}>
      <path d="M16 28 C16 22 20 18 32 18 C44 18 48 22 48 28 L46 46 C46 50 42 52 32 52 C22 52 18 50 18 46 L16 28 Z" fill={color} opacity="0.25" stroke={color} strokeWidth="3" />
      <line x1="12" y1="28" x2="52" y2="28" stroke={color} strokeWidth="3.5" strokeLinecap="round" />
      <path d="M28 12 Q30 18 28 20" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
      <path d="M36 12 Q38 18 36 20" stroke={color} strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  ),
  specialized: (color = '#0284C7') => (
    <svg viewBox="0 0 64 64" fill="none" style={{ width: '100%', height: '100%' }}>
      <path d="M18 46 L38 26 L46 34 L26 54 Z" fill={color} opacity="0.8" />
      <path d="M38 26 L44 20 C47 17 52 17 55 20 C58 23 58 28 55 31 L49 37 L41 29 Z" fill={color} opacity="0.95" />
      <circle cx="20" cy="52" r="3" fill="#ffffff" />
    </svg>
  ),
};

/**
 * Maps any service object from COOP HUB catalog to its corresponding SVG icon key and brand color.
 */
export function resolveServiceIcon(service) {
  const name = (service.name || '').toLowerCase();
  const category = (service.category || '').toLowerCase();

  if (name.includes('electr') || category.includes('electr')) {
    return { iconKey: 'electrical', color: '#EA580C', shortLabel: 'Electrical' };
  }
  if (name.includes('plumb') || category.includes('plumb') || name.includes('pipe')) {
    return { iconKey: 'plumbing', color: '#2563EB', shortLabel: 'Plumbing' };
  }
  if (name.includes('carpent') || category.includes('woodwork') || name.includes('wood')) {
    return { iconKey: 'carpentry', color: '#2563EB', shortLabel: 'Carpentry' };
  }
  if (name.includes('ac ') || name.includes('cooling') || category.includes('cooling') || name.includes('hvac')) {
    return { iconKey: 'acService', color: '#2563EB', shortLabel: 'AC Service' };
  }
  if (name.includes('paint') || category.includes('paint')) {
    return { iconKey: 'painting', color: '#EA580C', shortLabel: 'Painting' };
  }
  if (name.includes('clean') || category.includes('clean')) {
    return { iconKey: 'cleaning', color: '#D97706', shortLabel: 'Cleaning' };
  }
  if (name.includes('driver') || category.includes('transport') || name.includes('chauffeur')) {
    return { iconKey: 'driver', color: '#2563EB', shortLabel: 'Drivers' };
  }
  if (name.includes('garden') || category.includes('outdoor') || name.includes('landscap')) {
    return { iconKey: 'gardening', color: '#16A34A', shortLabel: 'Gardening' };
  }
  if (name.includes('care') || category.includes('health') || name.includes('elder')) {
    return { iconKey: 'caregiving', color: '#E11D48', shortLabel: 'Caregiving' };
  }
  if (name.includes('technician') || category.includes('technic')) {
    return { iconKey: 'technician', color: '#2563EB', shortLabel: 'Technician' };
  }
  if (name.includes('special') || category.includes('special') || name.includes('trade')) {
    return { iconKey: 'specialized', color: '#0284C7', shortLabel: 'Custom Trades' };
  }
  if (name.includes('appliance') || category.includes('appliance')) {
    return { iconKey: 'appliances', color: '#0284C7', shortLabel: 'Appliances' };
  }
  if (name.includes('emergency') || category.includes('emergency')) {
    return { iconKey: 'emergency', color: '#DC2626', shortLabel: 'Emergency' };
  }
  if (name.includes('verif') || category.includes('cooperative')) {
    return { iconKey: 'verified', color: '#059669', shortLabel: 'Verified Workers' };
  }
  if (name.includes('train') || category.includes('training') || name.includes('certif')) {
    return { iconKey: 'training', color: '#7C3AED', shortLabel: 'Training' };
  }
  if (name.includes('demand') || category.includes('demand')) {
    return { iconKey: 'onDemand', color: '#F59E0B', shortLabel: 'On-Demand' };
  }
  if (name.includes('domestic') || category.includes('domestic') || name.includes('helper') || name.includes('cook')) {
    return { iconKey: 'domestic', color: '#D97706', shortLabel: 'Domestic Helpers' };
  }

  // Fallback defaults
  return { iconKey: 'technician', color: '#2563EB', shortLabel: service.name || 'Service' };
}

/**
 * RotatingServiceEcosystem Component
 * Drives the outer orbital background of all existing COOP HUB services.
 */
export default function RotatingServiceEcosystem({
  services = [],
  isMobile = false,
}) {
  // Map raw services to enriched orbit badges
  const orbitItems = useMemo(() => {
    if (!services || services.length === 0) return [];

    return services.map((service, index) => {
      const mapping = resolveServiceIcon(service);
      return {
        ...service,
        orbitIndex: index,
        iconKey: mapping.iconKey,
        brandColor: mapping.color,
        displayLabel: mapping.shortLabel,
      };
    });
  }, [services]);

  // Orbit radius percentages:
  // Desktop: orbit sweeps outer perimeter around max-w-5xl center cards
  // Mobile: reduced orbit radius so it hugs background margins safely
  const radiusX = isMobile ? 44 : 47.5;
  const radiusY = isMobile ? 40 : 42.5;
  const badgeSize = isMobile ? 66 : 82;

  if (orbitItems.length === 0) return null;

  return (
    <div
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{
        zIndex: 1,
        overflow: 'hidden',
      }}
    >
      <RotatingCards
        items={orbitItems}
        centerX={50}
        centerY={52}
        radiusX={radiusX}
        radiusY={radiusY}
        isPercentRadius={true}
        duration={36} // 36s slow continuous organic orbit (25-45s spec)
        autoPlay={true}
        draggable={false} // Outer background keeps slow automatic orbit without intercepting page gestures
        renderCard={(item) => {
          const iconRenderer = ServiceSvgIcons[item.iconKey] || ServiceSvgIcons.technician;

          return (
            <div
              className="flex flex-col items-center select-none"
              style={{
                width: `${badgeSize + 30}px`,
                gap: '5px',
              }}
            >
              {/* Upright circular service icon card */}
              <div
                style={{
                  width: `${badgeSize}px`,
                  height: `${badgeSize}px`,
                  borderRadius: '50%',
                  background: '#ffffff',
                  border: '1px solid rgba(226, 232, 240, 0.9)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: `${badgeSize * 0.22}px`,
                  boxShadow: `0 10px 25px -4px rgba(0,0,0,0.07), 0 4px 10px -2px rgba(0,0,0,0.03), 0 0 26px -2px ${item.brandColor}22`,
                  transform: 'translateZ(0)', // Force GPU layer
                }}
              >
                {iconRenderer(item.brandColor)}
              </div>

              {/* Upright readable service label */}
              <span
                style={{
                  fontSize: isMobile ? '10px' : '11.5px',
                  fontWeight: '700',
                  color: '#334155',
                  letterSpacing: '0.2px',
                  textAlign: 'center',
                  whiteSpace: 'nowrap',
                  textShadow: '0 1px 2px rgba(255,255,255,0.85)',
                }}
              >
                {item.displayLabel}
              </span>
            </div>
          );
        }}
      />
    </div>
  );
}
