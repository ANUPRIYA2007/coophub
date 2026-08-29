import React, { useState, useEffect } from 'react';
import Hero3DCanvas from './Hero3DCanvas';
import { hero3dStateMachine, HERO_STATES } from '../../services/hero3d/hero3dStateMachine';
import { hero3dInteractionController } from '../../services/hero3d/hero3dInteractionController';

/**
 * Universal 3D Hero Component
 * 
 * Props:
 * - mode: 'bubble' (floating action button), 'card' (interactive panel), 'avatar' (header/sidebar small icon), 'full' (large stage)
 * - state: Hero state override (idle, greeting, listening, thinking, speaking, success, error, etc.)
 * - interactive: enable mouse/pointer look-at tracking
 * - onClick: click handler (e.g. opens guidance/chat agent)
 * - className: custom Tailwind/CSS classes
 */
export default function Hero3D({
  mode = 'bubble',
  state = null,
  interactive = true,
  onClick = null,
  className = '',
  style = {},
}) {
  const [hasWebGL, setHasWebGL] = useState(true);

  // Sync external state prop if provided
  useEffect(() => {
    if (state && HERO_STATES[state.toUpperCase()]) {
      hero3dStateMachine.setState(HERO_STATES[state.toUpperCase()]);
    }
  }, [state]);

  // Check WebGL availability
  useEffect(() => {
    try {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
      setHasWebGL(Boolean(gl));
    } catch {
      setHasWebGL(false);
    }
  }, []);

  // Mode Specific Camera & Sizing configurations
  let cameraDistance = 3.8;
  let targetHeight = 0.95;
  let defaultDimensions = 'w-16 h-16';

  if (mode === 'bubble') {
    // Focused upper body & head for floating bubble
    cameraDistance = 2.4;
    targetHeight = 1.45;
    defaultDimensions = 'w-14 h-14';
  } else if (mode === 'avatar') {
    // Tight headshot
    cameraDistance = 1.9;
    targetHeight = 1.62;
    defaultDimensions = 'w-10 h-10';
  } else if (mode === 'card') {
    // Upper torso with expressive arms
    cameraDistance = 3.2;
    targetHeight = 1.15;
    defaultDimensions = 'w-48 h-48';
  } else if (mode === 'full') {
    // Full body
    cameraDistance = 4.2;
    targetHeight = 0.95;
    defaultDimensions = 'w-full h-80';
  }

  // Fallback 2D Sprite if WebGL unavailable
  if (!hasWebGL) {
    return (
      <div
        onClick={onClick}
        className={`relative flex items-center justify-center cursor-pointer ${defaultDimensions} ${className}`}
        style={style}
      >
        <img
          src="/assets/images/mascot-hero.png"
          alt="CoopBot 3D Hero"
          className="w-full h-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      onClick={onClick}
      className={`relative select-none flex items-center justify-center ${onClick ? 'cursor-pointer' : ''} ${defaultDimensions} ${className}`}
      style={{ width: '100%', height: '100%', ...style }}
    >
      <Hero3DCanvas
        mode={mode}
        interactive={interactive}
      />
    </div>
  );
}

export { HERO_STATES, hero3dStateMachine, hero3dInteractionController };
