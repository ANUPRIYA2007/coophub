import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import coopHubLogo from '../../assets/branding/coop-hub-logo.png';

export default function SplashScreen({ onComplete }) {
    const containerRef = useRef(null);
    const logoRef = useRef(null);
    const titleRef = useRef(null);
    const taglineRef = useRef(null);
    const loaderRef = useRef(null);
    const progressRef = useRef(null);
    const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

    useEffect(() => {
        // Respect prefers-reduced-motion
        const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        setPrefersReducedMotion(mediaQuery.matches);

        if (mediaQuery.matches) {
            // Skip animation, show briefly then complete
            const timer = setTimeout(() => onComplete?.(), 1200);
            return () => clearTimeout(timer);
        }

        const safetyTimer = setTimeout(() => {
            onComplete?.();
        }, 1800);

        const ctx = gsap.context(() => {
            const tl = gsap.timeline({
                onComplete: () => {
                    // Fade out entire splash screen
                    gsap.to(containerRef.current, {
                        opacity: 0,
                        duration: 0.4,
                        ease: 'power2.inOut',
                        onComplete: () => onComplete?.(),
                    });
                },
            });

            // 1. Background is already visible

            // 2. Logo scales/fades into view
            tl.fromTo(
                logoRef.current,
                { opacity: 0, scale: 0.7, y: 30 },
                { opacity: 1, scale: 1, y: 0, duration: 1, ease: 'back.out(1.4)' },
                0.3
            );

            // 3. Title appears
            tl.fromTo(
                titleRef.current,
                { opacity: 0, y: 20 },
                { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' },
                '-=0.3'
            );

            // 4. Tagline appears
            tl.fromTo(
                taglineRef.current,
                { opacity: 0, y: 15 },
                { opacity: 1, y: 0, duration: 0.6, ease: 'power3.out' },
                '-=0.2'
            );

            // 5. Loader bar appears
            tl.fromTo(
                loaderRef.current,
                { opacity: 0 },
                { opacity: 1, duration: 0.3 },
                '-=0.1'
            );

            // 6. Progress bar fills
            tl.fromTo(
                progressRef.current,
                { width: '0%' },
                { width: '100%', duration: 1.4, ease: 'power2.inOut' },
                '-=0.1'
            );
        }, containerRef);

        return () => {
            clearTimeout(safetyTimer);
            ctx.revert();
        };
    }, [onComplete]);

    return (
        <div
            ref={containerRef}
            onClick={() => onComplete?.()}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white cursor-pointer"
            role="status"
            aria-label="Loading COOP HUB"
        >
            {/* Subtle background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-navy-50/50 via-white to-orange-50/30" />

            {/* Decorative circles */}
            <div className="absolute top-[-10%] right-[-5%] w-[400px] h-[400px] rounded-full bg-orange-500/5 blur-3xl" />
            <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] rounded-full bg-navy-500/5 blur-3xl" />

            {/* Content */}
            <div className="relative flex flex-col items-center px-6">
                {/* Logo */}
                <img
                    ref={logoRef}
                    src={coopHubLogo}
                    alt="COOP HUB Logo"
                    className="w-48 sm:w-56 md:w-64 h-auto object-contain mb-6"
                    style={{ opacity: prefersReducedMotion ? 1 : 0 }}
                />

                {/* Title — hidden since it's part of the logo image, but kept for SEO/accessibility */}
                <h1
                    ref={titleRef}
                    className="sr-only"
                    style={{ opacity: prefersReducedMotion ? 1 : 0 }}
                >
                    COOP HUB
                </h1>

                {/* Tagline */}
                <p
                    ref={taglineRef}
                    className="text-sm sm:text-base tracking-[0.35em] font-medium text-navy-400 mt-2 uppercase"
                    style={{ opacity: prefersReducedMotion ? 1 : 0 }}
                >
                    Connect &nbsp;|&nbsp; Serve &nbsp;|&nbsp; Empower
                </p>

                {/* Loading bar */}
                <div
                    ref={loaderRef}
                    className="mt-10 w-48 sm:w-56 h-1 bg-navy-100 rounded-full overflow-hidden"
                    style={{ opacity: prefersReducedMotion ? 1 : 0 }}
                >
                    <div
                        ref={progressRef}
                        className="h-full bg-gradient-to-r from-navy-500 via-orange-500 to-orange-400 rounded-full"
                        style={{ width: prefersReducedMotion ? '100%' : '0%' }}
                    />
                </div>
            </div>
        </div>
    );
}
