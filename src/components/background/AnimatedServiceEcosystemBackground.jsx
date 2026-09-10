import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import RotatingServiceEcosystem, { ServiceSvgIcons } from './RotatingServiceEcosystem';
import { MASTER_SERVICES } from '../../hooks/useServices';

/* ═══════════════════════════════════════════════════════
   Crisp vector icons map (re-exported for consistency)
   ═══════════════════════════════════════════════════════ */
const ServiceIcons = ServiceSvgIcons;

/* Dotted connection paths */
const CONN_PATHS = [
  'M 150 90 Q 320 60 520 130',
  'M 120 290 Q 280 250 460 230',
  'M 860 100 Q 700 80 560 140',
  'M 880 430 Q 720 390 560 370',
];

export default function AnimatedServiceEcosystemBackground({ services }) {
  const containerRef = useRef(null);
  const ctxRef = useRef(null);
  const [isMobile, setIsMobile] = useState(false);

  // Use provided services or fallback to full master catalog
  const activeServices = (services && services.length > 0) ? services : MASTER_SERVICES;

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth < 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    ctxRef.current = gsap.context(() => {
      if (reduced) return;

      // Subtle pulse on connection dots
      containerRef.current.querySelectorAll('.eco-dot').forEach((dot, i) => {
        const path = containerRef.current.querySelectorAll('.eco-path')[i];
        if (!path) return;
        const len = path.getTotalLength();
        const obj = { p: 0 };
        gsap.to(obj, {
          p: 1,
          duration: 9 + i * 2.5,
          ease: 'none',
          repeat: -1,
          onUpdate: () => {
            const pt = path.getPointAtLength(obj.p * len);
            gsap.set(dot, { attr: { cx: pt.x, cy: pt.y } });
          },
        });
      });
    }, containerRef);

    return () => {
      if (ctxRef.current) ctxRef.current.revert();
    };
  }, [isMobile]);

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        minHeight: '100%',
        overflow: 'hidden',
        pointerEvents: 'none',
        zIndex: 0,
      }}
    >
      {/* ═══ LAYER 1: VIBRANT SKY BLUE TO WHITE GRADIENT TOP ═══ */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '420px',
          background:
            'radial-gradient(ellipse at 50% -10%, rgba(191,219,254,0.65) 0%, rgba(219,234,254,0.40) 45%, rgba(255,255,255,0) 85%)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          height: '240px',
          background:
            'linear-gradient(180deg, rgba(224,242,254,0.45) 0%, rgba(239,246,255,0.25) 60%, rgba(255,255,255,0) 100%)',
        }}
      />

      {/* ═══ LAYER 2: BOTTOM CURVED ENVIRONMENTAL HILLS & COMMUNITY SILHOUETTES ═══ */}
      {/* Illustrated city/community silhouettes at the lower left & right as in image 3 */}
      <div
        style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          width: '260px',
          height: '180px',
          opacity: 0.16,
          background: 'radial-gradient(circle at 10% 90%, #3B82F6 0%, transparent 70%)',
          filter: 'blur(12px)',
        }}
      />

      <svg
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
        viewBox="0 0 1440 900"
        preserveAspectRatio="none"
      >
        {/* Left skyline buildings silhouette */}
        <g fill="#3B82F6" opacity="0.09">
          <rect x="20" y="680" width="18" height="180" rx="2" />
          <rect x="42" y="640" width="22" height="220" rx="2" />
          <rect x="68" y="690" width="16" height="170" rx="2" />
          <rect x="88" y="620" width="26" height="240" rx="2" />
          <rect x="118" y="660" width="20" height="200" rx="2" />
          <rect x="142" y="710" width="22" height="150" rx="2" />
          <rect x="168" y="740" width="18" height="120" rx="2" />
          {/* Subtle windows */}
          <circle cx="53" cy="655" r="1.5" fill="#fff" opacity="0.6" />
          <circle cx="53" cy="670" r="1.5" fill="#fff" opacity="0.6" />
          <circle cx="101" cy="635" r="1.5" fill="#fff" opacity="0.6" />
          <circle cx="101" cy="650" r="1.5" fill="#fff" opacity="0.6" />
        </g>

        {/* Right community houses silhouette */}
        <g fill="#3B82F6" opacity="0.08">
          {/* House 1 */}
          <path d="M 1240 760 L 1280 720 L 1320 760 L 1320 860 L 1240 860 Z" />
          {/* House 2 */}
          <path d="M 1310 740 L 1355 700 L 1400 740 L 1400 860 L 1310 860 Z" />
          {/* House 3 */}
          <path d="M 1370 770 L 1410 735 L 1440 765 L 1440 860 L 1370 860 Z" />
          {/* Little tree */}
          <circle cx="1225" cy="780" r="18" fill="#16A34A" opacity="0.1" />
          <rect x="1223" y="795" width="4" height="40" fill="#78350F" opacity="0.12" />
        </g>

        {/* Dynamic sweeping landscape curves */}
        <path
          d="M 0 820 Q 360 760 720 810 Q 1080 860 1440 800 L 1440 900 L 0 900 Z"
          fill="rgba(219,234,254,0.22)"
        />
        <path
          d="M 0 850 Q 400 800 850 840 Q 1200 870 1440 830 L 1440 900 L 0 900 Z"
          fill="rgba(191,219,254,0.30)"
        />
      </svg>

      {/* ═══ LAYER 2B: DOTTED CONNECTION PATHS ═══ */}
      {!isMobile && (
        <svg
          style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
          viewBox="0 0 1000 800"
          preserveAspectRatio="none"
        >
          {CONN_PATHS.map((d, i) => (
            <path
              key={i}
              className="eco-path"
              d={d}
              fill="none"
              stroke="rgba(59,130,246,0.20)"
              strokeWidth="1.8"
              strokeDasharray="4 8"
              strokeLinecap="round"
            />
          ))}
          {CONN_PATHS.map((_, i) => (
            <circle key={`d${i}`} className="eco-dot" r="3.5" fill="#3B82F6" opacity="0.6" />
          ))}
        </svg>
      )}

      {/* ═══ LAYER 3: ROTATING SERVICE ECOSYSTEM (REACT BITS PRO 3D ORBIT) ═══ */}
      <RotatingServiceEcosystem services={activeServices} isMobile={isMobile} />

      {/* ═══ LAYER 4: HANDWRITTEN DECORATIVE MOTTO TEXT (EXACT MATCH TO IMAGE 3) ═══ */}
      {!isMobile && (
        <>
          {/* Upper-left: "Skilled People Stronger Communities" */}
          <div
            style={{
              position: 'absolute',
              top: '5%',
              left: '4%',
              zIndex: 0,
              pointerEvents: 'none',
            }}
          >
            <div
              style={{
                fontFamily: "'Brush Script MT', 'Dancing Script', 'Caveat', 'Segoe Script', cursive, sans-serif",
                fontSize: '34px',
                fontWeight: '400',
                color: '#93C5FD',
                lineHeight: 1.15,
                transform: 'rotate(-6deg)',
                letterSpacing: '0.5px',
                textShadow: '0 2px 10px rgba(147,197,253,0.3)',
              }}
            >
              <div style={{ marginLeft: '4px' }}>Skilled</div>
              <div style={{ marginLeft: '22px' }}>People</div>
              <div style={{ position: 'relative', marginLeft: '6px', marginTop: '2px' }}>
                <div>Stronger</div>
                <div style={{ marginLeft: '12px' }}>Communities</div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-4px',
                    left: 0,
                    width: '95%',
                    height: '3px',
                    background: 'linear-gradient(90deg, #FDBA74, transparent)',
                    borderRadius: '3px',
                  }}
                />
              </div>
            </div>
          </div>

          {/* Lower-right: "Better Homes Happier Lives" */}
          <div
            style={{
              position: 'absolute',
              top: '64%',
              right: '4.5%',
              zIndex: 0,
              pointerEvents: 'none',
              textAlign: 'right',
            }}
          >
            <div
              style={{
                fontFamily: "'Brush Script MT', 'Dancing Script', 'Caveat', 'Segoe Script', cursive, sans-serif",
                fontSize: '34px',
                fontWeight: '400',
                color: '#93C5FD',
                lineHeight: 1.15,
                transform: 'rotate(-4deg)',
                letterSpacing: '0.5px',
                textShadow: '0 2px 10px rgba(147,197,253,0.3)',
              }}
            >
              <div>Better</div>
              <div style={{ marginRight: '16px' }}>Homes</div>
              <div style={{ position: 'relative', marginTop: '2px' }}>
                <div>Happier</div>
                <div style={{ marginRight: '8px' }}>Lives</div>
                <div
                  style={{
                    position: 'absolute',
                    bottom: '-4px',
                    right: 0,
                    width: '90%',
                    height: '3px',
                    background: 'linear-gradient(270deg, #FDBA74, transparent)',
                    borderRadius: '3px',
                  }}
                />
              </div>
            </div>
          </div>
        </>
      )}

      {/* Subtle small floating accent sparkles/dots */}
      <div
        style={{
          position: 'absolute',
          top: '6%',
          left: '35%',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: '#93C5FD',
          opacity: 0.5,
        }}
      />
      <div
        style={{
          position: 'absolute',
          top: '12%',
          right: '34%',
          width: '8px',
          height: '8px',
          borderRadius: '50%',
          background: '#FDBA74',
          opacity: 0.6,
        }}
      />
    </div>
  );
}
