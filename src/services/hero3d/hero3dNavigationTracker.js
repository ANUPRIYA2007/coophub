/**
 * COOP HUB 3D HERO NAVIGATION TRACKER
 * Tracks realtime router/location navigation changes across Customer, Pillar, and Admin portals.
 * Emits throttled attention gestures (Greeting, Attention Gaze, Pointing).
 */

import { hero3dStateMachine, HERO_STATES } from './hero3dStateMachine';

class Hero3DNavigationTracker {
  constructor() {
    this.currentPath = typeof window !== 'undefined' ? window.location.pathname : '/';
    this.lastTransitionTime = 0;
    this.throttleMs = 3500; // Prevent spamming animations during rapid navigation
    this.isTracking = false;
  }

  start() {
    if (this.isTracking || typeof window === 'undefined') return;
    this.isTracking = true;

    this.handleLocationChange = () => {
      const newPath = window.location.pathname;
      if (newPath !== this.currentPath) {
        const prevPath = this.currentPath;
        this.currentPath = newPath;
        this.onNavigate(newPath, prevPath);
      }
    };

    window.addEventListener('popstate', this.handleLocationChange);
    window.addEventListener('hashchange', this.handleLocationChange);

    // Monkey-patch history pushState/replaceState to detect in-app SPA React Router navigations
    const origPush = window.history.pushState;
    const origReplace = window.history.replaceState;

    window.history.pushState = (...args) => {
      origPush.apply(window.history, args);
      this.handleLocationChange();
    };

    window.history.replaceState = (...args) => {
      origReplace.apply(window.history, args);
      this.handleLocationChange();
    };
  }

  onNavigate(newPath, prevPath) {
    const now = Date.now();
    if (now - this.lastTransitionTime < this.throttleMs) {
      return;
    }
    this.lastTransitionTime = now;

    // React with contextual states based on destination
    if (newPath.includes('/auth') || newPath.includes('/register') || newPath.includes('/login')) {
      hero3dStateMachine.setState(HERO_STATES.GREETING);
    } else if (newPath.includes('/orders') || newPath.includes('/requests') || newPath.includes('/bookings')) {
      hero3dStateMachine.setState(HERO_STATES.LISTENING);
    } else if (newPath.includes('/forecast') || newPath.includes('/allocation') || newPath.includes('/admin')) {
      hero3dStateMachine.setState(HERO_STATES.THINKING);
    }
  }

  stop() {
    if (!this.isTracking || typeof window === 'undefined') return;
    window.removeEventListener('popstate', this.handleLocationChange);
    window.removeEventListener('hashchange', this.handleLocationChange);
    this.isTracking = false;
  }
}

export const hero3dNavigationTracker = new Hero3DNavigationTracker();
