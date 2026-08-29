/**
 * COOP HUB 3D HERO MOVEMENT ENGINE
 * Handles frame-rate independent procedural calculations:
 * - Damped multi-layer Look-At kinematics (Eyes -> Head -> Spine)
 * - Randomized natural blink cycles
 * - Speech-driven morph pulse resonance
 * - Idle floating & breathing mathematics
 * - Accessibility reduced-motion checks
 */

export class Hero3DMovementEngine {
  constructor() {
    this.targetGaze = { x: 0, y: 0 };
    this.currentGaze = { x: 0, y: 0 };
    
    // Limits (Radians)
    this.MAX_EYE_YAW = (25 * Math.PI) / 180;
    this.MAX_EYE_PITCH = (18 * Math.PI) / 180;
    this.MAX_HEAD_YAW = (22 * Math.PI) / 180;
    this.MAX_HEAD_PITCH = (16 * Math.PI) / 180;
    this.MAX_SPINE_YAW = (8 * Math.PI) / 180;

    // Damping factors (lower = smoother/slower, higher = snappier)
    this.EYE_DAMPING = 8.5;
    this.HEAD_DAMPING = 5.0;
    this.SPINE_DAMPING = 3.0;

    // Blink System State
    this.isBlinking = false;
    this.blinkProgress = 0.0;
    this.blinkDuration = 0.16; // 160ms natural human blink
    this.nextBlinkTime = this.getRandomBlinkInterval();
    this.timeSinceLastBlink = 0.0;

    // Speech Pulse State
    this.speechFrequency = 7.5; // Hz
    this.speechPhase = 0.0;

    // Floating Respiration State
    this.idlePhase = 0.0;

    this.isReducedMotion = false;
    this.initReducedMotion();
  }

  initReducedMotion() {
    if (typeof window !== 'undefined' && window.matchMedia) {
      const media = window.matchMedia('(prefers-reduced-motion: reduce)');
      this.isReducedMotion = media.matches;
      media.addEventListener('change', (e) => {
        this.isReducedMotion = e.matches;
      });
    }
  }

  getRandomBlinkInterval() {
    // Human average: blink every 2.8 to 5.8 seconds
    return 2.8 + Math.random() * 3.0;
  }

  setTargetGaze(normalizedX, normalizedY) {
    // normalizedX: [-1, 1] (left to right)
    // normalizedY: [-1, 1] (top to bottom)
    if (this.isReducedMotion) {
      this.targetGaze.x = 0;
      this.targetGaze.y = 0;
      return;
    }

    // Clamp input safely
    this.targetGaze.x = Math.max(-1.0, Math.min(1.0, normalizedX));
    this.targetGaze.y = Math.max(-1.0, Math.min(1.0, normalizedY));
  }

  update(deltaTime) {
    // Clamp delta time to avoid large jumps during tab switching
    const dt = Math.min(deltaTime, 0.1);

    // 1. Damped Look-At Interpolation
    const dampFactor = Math.min(dt * this.HEAD_DAMPING, 1.0);
    this.currentGaze.x += (this.targetGaze.x - this.currentGaze.x) * dampFactor;
    this.currentGaze.y += (this.targetGaze.y - this.currentGaze.y) * dampFactor;

    // 2. Update Blink Cycle
    this.timeSinceLastBlink += dt;
    let blinkValue = 0.0;

    if (!this.isBlinking && this.timeSinceLastBlink >= this.nextBlinkTime) {
      this.isBlinking = true;
      this.blinkProgress = 0.0;
      this.timeSinceLastBlink = 0.0;
      this.nextBlinkTime = this.getRandomBlinkInterval();
    }

    if (this.isBlinking) {
      this.blinkProgress += dt / this.blinkDuration;
      if (this.blinkProgress >= 1.0) {
        this.isBlinking = false;
        this.blinkProgress = 0.0;
        blinkValue = 0.0;
      } else {
        // Half-sine wave closing then opening: 0 -> 1 -> 0
        blinkValue = Math.sin(this.blinkProgress * Math.PI);
      }
    }

    // 3. Update Idle Floating Phase
    this.idlePhase += dt * 1.8;
    const floatOffsetY = this.isReducedMotion ? 0 : Math.sin(this.idlePhase) * 0.025;
    const idleChestRoll = this.isReducedMotion ? 0 : Math.sin(this.idlePhase * 0.8) * 0.015;

    // 4. Update Speech Pulse Phase
    this.speechPhase += dt * this.speechFrequency;
    const speechPulse = Math.max(0.0, Math.sin(this.speechPhase) * Math.sin(this.speechPhase * 0.5));

    return {
      currentGaze: { x: this.currentGaze.x, y: this.currentGaze.y },
      gazeX: this.currentGaze.x,
      gazeY: this.currentGaze.y,

      // Kinematic Rotations
      eyeYaw: -this.currentGaze.x * this.MAX_EYE_YAW,
      eyePitch: -this.currentGaze.y * this.MAX_EYE_PITCH,
      
      headYaw: -this.currentGaze.x * this.MAX_HEAD_YAW,
      headPitch: -this.currentGaze.y * this.MAX_HEAD_PITCH,
      headRoll: -this.currentGaze.x * 0.05,

      spineYaw: -this.currentGaze.x * this.MAX_SPINE_YAW,
      spinePitch: -this.currentGaze.y * 0.04,

      // Procedural Offsets
      floatOffsetY,
      idleChestRoll,

      // Morph Target Multipliers
      blinkInfluence: blinkValue,
      speechPulseInfluence: speechPulse,
    };
  }

  reset() {
    this.targetGaze = { x: 0, y: 0 };
    this.currentGaze = { x: 0, y: 0 };
    this.isBlinking = false;
    this.blinkProgress = 0.0;
  }
}

export const hero3dMovementEngine = new Hero3DMovementEngine();
