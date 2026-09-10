import React, { useRef, useEffect, useState, useCallback } from 'react';
import gsap from 'gsap';

/**
 * React Bits Pro — RotatingCards Component
 * Adapted for 3D circular/elliptical orbital ecosystems.
 * 
 * Features:
 * - 3D circular/elliptical orbit mechanics (Math.cos / Math.sin with perspective)
 * - Upright orientation preservation (cards remain readable, never upside-down)
 * - Subtle 3D depth cueing (scale, opacity, z-index based on orbital depth)
 * - GSAP-driven slow automatic rotation (~25-45s per cycle)
 * - Optional momentum-based drag-to-rotate interaction
 * - prefers-reduced-motion support (freezes orbit into static aesthetic positions)
 * - Clean teardown & strict-mode safety
 */
export default function RotatingCards({
  items = [],
  centerX = 50,
  centerY = 52.5,
  radiusX = 47, // percentage of container width
  radiusY = 42.5, // percentage of container height
  isPercentRadius = true,
  duration = 35, // 35 seconds per full 360 rotation
  autoPlay = true,
  draggable = false, // outer background orbit is default auto; badges can be clickable
  pauseOnHover = false,
  reverse = false,
  className = '',
  cardClassName = '',
  renderCard,
  onCardClick,
}) {
  const containerRef = useRef(null);
  const rotationRef = useRef({ angle: 0 });
  const isDraggingRef = useRef(false);
  const dragStartRef = useRef({ x: 0, angle: 0 });
  const velocityRef = useRef(0);
  const lastXRef = useRef(0);
  const lastTimeRef = useRef(0);
  const [positions, setPositions] = useState([]);
  const [isReducedMotion, setIsReducedMotion] = useState(false);

  // Check prefers-reduced-motion
  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setIsReducedMotion(mediaQuery.matches);
    const handler = (e) => setIsReducedMotion(e.matches);
    mediaQuery.addEventListener('change', handler);
    return () => mediaQuery.removeEventListener('change', handler);
  }, []);

  const total = items.length || 1;
  const angleStep = (2 * Math.PI) / total;

  // Calculate coordinates for all items given current angle
  const computePositions = useCallback((currentAngle) => {
    return items.map((item, index) => {
      // Angle along the circle
      const angle = currentAngle + index * angleStep;

      // Elliptical coordinate relative to center (centerX, centerY)
      const cosVal = Math.cos(angle);
      const sinVal = Math.sin(angle);

      // Orbital position percentages
      const xPercent = centerX + (isPercentRadius ? radiusX : 45) * cosVal;
      const yPercent = centerY + (isPercentRadius ? radiusY : 40) * sinVal;

      // 3D Depth cueing:
      // Front is near the bottom of orbit (sinVal = 1), back is near the top (sinVal = -1)
      const depthNormalized = (sinVal + 1) / 2;

      // Subtle scaling: 0.88 (back) to 1.05 (front)
      const scale = 0.88 + 0.17 * depthNormalized;

      // Subtle opacity: 0.65 (back) to 1.0 (front)
      const opacity = 0.65 + 0.35 * depthNormalized;

      // Z-index layer sorting
      const zIndex = Math.round(1 + depthNormalized * 10);

      return {
        item,
        index,
        xPercent,
        yPercent,
        scale,
        opacity,
        zIndex,
        angle,
      };
    });
  }, [items, angleStep, radiusX, radiusY, isPercentRadius]);

  // Sync animation loop with GSAP ticker
  useEffect(() => {
    if (isReducedMotion) {
      setPositions(computePositions(0));
      return;
    }

    let lastFrameTime = performance.now();
    const speed = ((2 * Math.PI) / duration) * (reverse ? -1 : 1); // radians per second

    const tick = () => {
      const now = performance.now();
      const dt = (now - lastFrameTime) / 1000;
      lastFrameTime = now;

      if (!isDraggingRef.current) {
        // Apply inertia if dragging was just released
        if (Math.abs(velocityRef.current) > 0.0001) {
          rotationRef.current.angle += velocityRef.current;
          velocityRef.current *= 0.92;
        }

        // Automatic slow orbit
        if (autoPlay) {
          rotationRef.current.angle += speed * dt;
        }
      }

      setPositions(computePositions(rotationRef.current.angle));
    };

    gsap.ticker.add(tick);
    return () => {
      gsap.ticker.remove(tick);
    };
  }, [duration, autoPlay, reverse, isReducedMotion, computePositions]);

  // Drag interaction handlers
  const handlePointerDown = (e) => {
    if (!draggable || isReducedMotion) return;
    isDraggingRef.current = true;
    dragStartRef.current = {
      x: e.clientX || (e.touches && e.touches[0]?.clientX) || 0,
      angle: rotationRef.current.angle,
    };
    lastXRef.current = dragStartRef.current.x;
    lastTimeRef.current = performance.now();
    velocityRef.current = 0;
  };

  const handlePointerMove = (e) => {
    if (!isDraggingRef.current) return;
    const currentX = e.clientX || (e.touches && e.touches[0]?.clientX) || 0;
    const dx = currentX - dragStartRef.current.x;
    const dt = Math.max(1, performance.now() - lastTimeRef.current);

    const angleDelta = dx / 400;
    rotationRef.current.angle = dragStartRef.current.angle + angleDelta;

    velocityRef.current = ((currentX - lastXRef.current) / dt) * 0.05;
    lastXRef.current = currentX;
    lastTimeRef.current = performance.now();
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full select-none ${className}`}
      style={{
        perspective: '1200px',
        transformStyle: 'preserve-3d',
        pointerEvents: draggable ? 'auto' : 'none',
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      onMouseLeave={handlePointerUp}
    >
      {positions.map((pos) => {
        return (
          <div
            key={pos.item.id || pos.index}
            className={`absolute ${cardClassName}`}
            style={{
              left: `${pos.xPercent}%`,
              top: `${pos.yPercent}%`,
              transform: `translate(-50%, -50%) scale(${pos.scale})`,
              opacity: pos.opacity,
              zIndex: pos.zIndex,
              willChange: 'transform, opacity, left, top',
              pointerEvents: 'auto',
              cursor: onCardClick ? 'pointer' : 'default',
              transition: isDraggingRef.current ? 'none' : 'opacity 0.15s ease-out',
            }}
            onClick={(e) => {
              if (onCardClick) {
                e.stopPropagation();
                onCardClick(pos.item);
              }
            }}
          >
            {renderCard ? renderCard(pos.item, pos) : <div>{pos.item.name}</div>}
          </div>
        );
      })}
    </div>
  );
}
