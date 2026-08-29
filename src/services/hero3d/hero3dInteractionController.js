/**
 * COOP HUB 3D HERO INTERACTION CONTROLLER
 * Coordinates global user interactions, DOM pointer tracking, real DOM element pointing,
 * Web Speech API synchronization, and custom portal events.
 */

import { hero3dStateMachine, HERO_STATES } from './hero3dStateMachine';
import { hero3dMovementEngine } from './hero3dMovementEngine';
import { hero3dNavigationTracker } from './hero3dNavigationTracker';

class Hero3DInteractionController {
  constructor() {
    this.isInitialized = false;
    this.currentTargetElement = null;
    this.speechSynthesisActive = false;
  }

  init() {
    if (this.isInitialized || typeof window === 'undefined') return;
    this.isInitialized = true;

    // Start navigation tracker
    hero3dNavigationTracker.start();

    // 1. Pointer Tracking across window
    this.handlePointerMove = (e) => {
      // Normalize mouse coordinates to [-1, 1] relative to viewport center
      const normX = (e.clientX / window.innerWidth) * 2 - 1;
      const normY = (e.clientY / window.innerHeight) * 2 - 1;
      hero3dMovementEngine.setTargetGaze(normX, normY);
    };

    this.handlePointerLeave = () => {
      // Smoothly return to neutral center gaze
      hero3dMovementEngine.setTargetGaze(0, 0);
    };

    window.addEventListener('pointermove', this.handlePointerMove, { passive: true });
    document.addEventListener('mouseleave', this.handlePointerLeave);

    // 2. Listen to custom application Hero events ('coophub-hero-event')
    this.handleCustomEvent = (e) => {
      const detail = e.detail || {};
      const { type, state, targetSelector, duration } = detail;

      if (state && HERO_STATES[state.toUpperCase()]) {
        hero3dStateMachine.setState(HERO_STATES[state.toUpperCase()]);
      } else if (type) {
        switch (type.toLowerCase()) {
          case 'greet':
          case 'greeting':
            hero3dStateMachine.setState(HERO_STATES.GREETING);
            break;
          case 'speak':
          case 'speaking':
            hero3dStateMachine.setState(HERO_STATES.SPEAKING);
            break;
          case 'listen':
          case 'listening':
            hero3dStateMachine.setState(HERO_STATES.LISTENING);
            break;
          case 'think':
          case 'thinking':
            hero3dStateMachine.setState(HERO_STATES.THINKING);
            break;
          case 'success':
            hero3dStateMachine.setState(HERO_STATES.SUCCESS);
            break;
          case 'error':
          case 'alert':
            hero3dStateMachine.setState(HERO_STATES.ERROR);
            break;
          case 'warn':
          case 'warning':
            hero3dStateMachine.setState(HERO_STATES.WARNING);
            break;
          case 'confirm':
          case 'confirmation':
            hero3dStateMachine.setState(HERO_STATES.CONFIRMATION);
            break;
          case 'point':
            if (targetSelector) {
              this.pointAtElement(targetSelector);
            } else {
              hero3dStateMachine.setState(HERO_STATES.POINTING);
            }
            break;
          case 'idle':
          case 'reset':
            hero3dStateMachine.setState(HERO_STATES.IDLE);
            break;
          default:
            break;
        }
      }
    };

    window.addEventListener('coophub-hero-event', this.handleCustomEvent);
  }

  pointAtElement(selectorOrElement) {
    if (typeof document === 'undefined') return;

    let el = null;
    if (typeof selectorOrElement === 'string') {
      el = document.querySelector(selectorOrElement);
    } else if (selectorOrElement instanceof HTMLElement) {
      el = selectorOrElement;
    }

    if (!el) {
      // Safe fallback if target element not found on DOM
      hero3dStateMachine.setState(HERO_STATES.POINTING);
      return;
    }

    const rect = el.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const normX = (centerX / window.innerWidth) * 2 - 1;
    const normY = (centerY / window.innerHeight) * 2 - 1;

    hero3dMovementEngine.setTargetGaze(normX, normY);
    hero3dStateMachine.setState(HERO_STATES.POINTING);
  }

  notifySpeechStart() {
    this.speechSynthesisActive = true;
    hero3dStateMachine.setState(HERO_STATES.SPEAKING);
  }

  notifySpeechEnd() {
    this.speechSynthesisActive = false;
    if (hero3dStateMachine.getState() === HERO_STATES.SPEAKING) {
      hero3dStateMachine.setState(HERO_STATES.IDLE);
    }
  }

  destroy() {
    if (!this.isInitialized || typeof window === 'undefined') return;
    window.removeEventListener('pointermove', this.handlePointerMove);
    document.removeEventListener('mouseleave', this.handlePointerLeave);
    window.removeEventListener('coophub-hero-event', this.handleCustomEvent);
    hero3dNavigationTracker.stop();
    this.isInitialized = false;
  }
}

export const hero3dInteractionController = new Hero3DInteractionController();
