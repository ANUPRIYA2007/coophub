import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import {
    Zap,
    Droplets,
    Hammer,
    Paintbrush,
    Home,
    HeartHandshake,
    Car,
    Sprout,
    Sparkles,
    Wrench
} from 'lucide-react';
import { useTranslation } from '../../hooks/useTranslation';

// 10 SIH Worker Categories with positions, depths, and animation profiles
const WORKER_CATEGORIES = [
    {
        id: 'electrician',
        name: 'Electrician',
        icon: Zap,
        accent: '#F59E0B',
        accentBg: 'rgba(245, 158, 11, 0.12)',
        accentBorder: 'rgba(245, 158, 11, 0.25)',
        layer: 'near',
        // Top-left perimeter
        pos: { top: '14%', left: '5%' },
        motion: { x: 18, y: -22, rot: 4, dur: 6.2, delay: 0.1 }
    },
    {
        id: 'plumber',
        name: 'Plumber',
        icon: Droplets,
        accent: '#38BDF8',
        accentBg: 'rgba(56, 189, 248, 0.12)',
        accentBorder: 'rgba(56, 189, 248, 0.25)',
        layer: 'near',
        // Top-right perimeter
        pos: { top: '15%', right: '6%' },
        motion: { x: -20, y: 24, rot: -5, dur: 7.0, delay: 0.5 }
    },
    {
        id: 'carpenter',
        name: 'Carpenter',
        icon: Hammer,
        accent: '#EA580C',
        accentBg: 'rgba(234, 88, 12, 0.12)',
        accentBorder: 'rgba(234, 88, 12, 0.25)',
        layer: 'far',
        // Mid-left flank
        pos: { top: '44%', left: '3%' },
        motion: { x: 15, y: -16, rot: 3, dur: 9.2, delay: 1.2 }
    },
    {
        id: 'painter',
        name: 'Painter',
        icon: Paintbrush,
        accent: '#A855F7',
        accentBg: 'rgba(168, 85, 247, 0.12)',
        accentBorder: 'rgba(168, 85, 247, 0.25)',
        layer: 'far',
        // Mid-right flank
        pos: { top: '42%', right: '3%' },
        motion: { x: -16, y: -20, rot: -4, dur: 8.8, delay: 0.8 }
    },
    {
        id: 'domestic-helper',
        name: 'Domestic Helper',
        icon: Home,
        accent: '#10B981',
        accentBg: 'rgba(16, 185, 129, 0.12)',
        accentBorder: 'rgba(16, 185, 129, 0.25)',
        layer: 'far',
        // Upper center-left (above portal cards)
        pos: { top: '8%', left: '26%' },
        motion: { x: 12, y: 14, rot: 2, dur: 10.5, delay: 1.6 }
    },
    {
        id: 'caregiver',
        name: 'Caregiver',
        icon: HeartHandshake,
        accent: '#F43F5E',
        accentBg: 'rgba(244, 63, 94, 0.12)',
        accentBorder: 'rgba(244, 63, 94, 0.25)',
        layer: 'near',
        // Lower-right perimeter
        pos: { bottom: '16%', right: '6%' },
        motion: { x: -22, y: -18, rot: 5, dur: 6.8, delay: 0.3 }
    },
    {
        id: 'driver',
        name: 'Driver',
        icon: Car,
        accent: '#6366F1',
        accentBg: 'rgba(99, 102, 241, 0.12)',
        accentBorder: 'rgba(99, 102, 241, 0.25)',
        layer: 'far',
        // Upper center-right (above portal cards)
        pos: { top: '8%', right: '25%' },
        motion: { x: -14, y: 16, rot: -3, dur: 9.6, delay: 1.0 }
    },
    {
        id: 'gardener',
        name: 'Gardener',
        icon: Sprout,
        accent: '#22C55E',
        accentBg: 'rgba(34, 197, 94, 0.12)',
        accentBorder: 'rgba(34, 197, 94, 0.25)',
        layer: 'near',
        // Lower-left perimeter
        pos: { bottom: '18%', left: '4%' },
        motion: { x: 20, y: 22, rot: -4, dur: 7.4, delay: 0.7 }
    },
    {
        id: 'cleaner',
        name: 'Cleaner',
        icon: Sparkles,
        accent: '#06B6D4',
        accentBg: 'rgba(6, 182, 212, 0.12)',
        accentBorder: 'rgba(6, 182, 212, 0.25)',
        layer: 'far',
        // Lower-mid center-left
        pos: { bottom: '7%', left: '20%' },
        motion: { x: 14, y: -14, rot: 3, dur: 10.0, delay: 2.0 }
    },
    {
        id: 'technician',
        name: 'Technician',
        icon: Wrench,
        accent: '#FF7900',
        accentBg: 'rgba(255, 121, 0, 0.14)',
        accentBorder: 'rgba(255, 121, 0, 0.30)',
        layer: 'near',
        // Lower-mid center-right
        pos: { bottom: '7%', right: '20%' },
        motion: { x: -18, y: 16, rot: -4, dur: 6.5, delay: 0.4 }
    }
];

export default function WorkerEcosystemBackground() {
    const { t } = useTranslation();
    const containerRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return;

        // Accessibility: Check prefers-reduced-motion
        const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

        // Use GSAP context for automatic cleanup and React StrictMode resilience
        const ctx = gsap.context(() => {
            // Initial entrance fade of background ecosystem
            gsap.fromTo(
                '.worker-eco-node',
                { opacity: 0, scale: 0.8 },
                {
                    opacity: (i, target) => {
                        const isFar = target.getAttribute('data-layer') === 'far';
                        return isFar ? 0.35 : 0.65;
                    },
                    scale: 1,
                    duration: 1.2,
                    stagger: 0.08,
                    ease: 'power2.out'
                }
            );

            // Skip continuous floating loop if user prefers reduced motion
            if (prefersReducedMotion) return;

            // Continuous subtle organic floating tweens for each category node
            WORKER_CATEGORIES.forEach((cat) => {
                const el = container.querySelector(`[data-cat="${cat.id}"]`);
                if (!el) return;

                const { x, y, rot, dur, delay } = cat.motion;
                const isFar = cat.layer === 'far';

                // Subtle organic path with non-synchronized duration and delay
                gsap.to(el, {
                    x,
                    y,
                    rotation: rot,
                    scale: isFar ? 0.94 : 1.04,
                    opacity: isFar ? 0.22 : 0.48,
                    duration: dur,
                    delay,
                    repeat: -1,
                    yoyo: true,
                    ease: 'sine.inOut'
                });
            });
        }, containerRef);

        return () => {
            ctx.revert(); // Reverts all GSAP animations created in this context
        };
    }, []);

    return (
        <div
            ref={containerRef}
            aria-hidden="true"
            className="absolute inset-0 overflow-hidden pointer-events-none z-0 select-none"
        >
            {/* Subtle contextual ambient connector web */}
            <svg
                className="absolute inset-0 w-full h-full opacity-[0.07] stroke-slate-400"
                xmlns="http://www.w3.org/2000/svg"
            >
                <defs>
                    <linearGradient id="ecoLineGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="#FF7900" stopOpacity="0.4" />
                        <stop offset="50%" stopColor="#38BDF8" stopOpacity="0.1" />
                        <stop offset="100%" stopColor="#10B981" stopOpacity="0.4" />
                    </linearGradient>
                </defs>
                <circle cx="15%" cy="20%" r="180" fill="none" stroke="url(#ecoLineGrad)" strokeWidth="1" strokeDasharray="6 8" />
                <circle cx="85%" cy="22%" r="200" fill="none" stroke="url(#ecoLineGrad)" strokeWidth="1" strokeDasharray="6 8" />
                <circle cx="50%" cy="85%" r="240" fill="none" stroke="url(#ecoLineGrad)" strokeWidth="1" strokeDasharray="8 10" />
            </svg>

            {/* 10 SIH Worker Category Animated Nodes */}
            {WORKER_CATEGORIES.map((cat) => {
                const IconComponent = cat.icon;
                const isFar = cat.layer === 'far';

                return (
                    <div
                        key={cat.id}
                        data-cat={cat.id}
                        data-layer={cat.layer}
                        style={{
                            ...cat.pos,
                            position: 'absolute',
                            willChange: 'transform, opacity'
                        }}
                        className={`worker-eco-node flex items-center gap-2.5 px-3 py-1.5 rounded-2xl backdrop-blur-md transition-shadow ${
                            isFar
                                ? 'hidden lg:flex scale-85 opacity-30'
                                : 'flex scale-95 opacity-55'
                        }`}
                    >
                        {/* Glowing Glass Icon Pill */}
                        <div
                            style={{
                                background: cat.accentBg,
                                borderColor: cat.accentBorder,
                                boxShadow: `0 0 16px ${cat.accentBg}`
                            }}
                            className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl border flex items-center justify-center flex-shrink-0"
                        >
                            <IconComponent size={17} color={cat.accent} strokeWidth={2.2} />
                        </div>

                        {/* Trade Name Pill (hidden on very small screens for clean viewport) */}
                        <div
                            style={{
                                background: 'rgba(15, 23, 42, 0.65)',
                                borderColor: 'rgba(255, 255, 255, 0.08)'
                            }}
                            className="hidden sm:flex flex-col border rounded-xl px-2.5 py-1"
                        >
                            <span
                                style={{ color: cat.accent }}
                                className="text-[10px] sm:text-[11px] font-bold tracking-wide leading-none"
                            >
                                {t(cat.name)}
                            </span>
                            <span className="text-[8px] text-slate-400 font-medium tracking-wider uppercase leading-tight mt-0.5">
                                {t("Skilled Worker")}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}
