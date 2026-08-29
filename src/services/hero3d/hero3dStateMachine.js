/**
 * COOP HUB 3D HERO STATE MACHINE
 * Manages Hero animation states, priority overriding, and smooth transitions.
 */

export const HERO_STATES = {
  IDLE: 'IDLE',
  GREETING: 'GREETING',
  LISTENING: 'LISTENING',
  THINKING: 'THINKING',
  SPEAKING: 'SPEAKING',
  SUCCESS: 'SUCCESS',
  ERROR: 'ERROR',
  WARNING: 'WARNING',
  POINTING: 'POINTING',
  CONFIRMATION: 'CONFIRMATION',
};

export const STATE_ANIMATION_MAP = {
  [HERO_STATES.IDLE]: 'Action_Idle',
  [HERO_STATES.GREETING]: 'Action_Greeting',
  [HERO_STATES.LISTENING]: 'Action_Listening',
  [HERO_STATES.THINKING]: 'Action_Thinking',
  [HERO_STATES.SPEAKING]: 'Action_Speaking',
  [HERO_STATES.SUCCESS]: 'Action_Success',
  [HERO_STATES.ERROR]: 'Action_Error',
  [HERO_STATES.WARNING]: 'Action_Warning',
  [HERO_STATES.POINTING]: 'Action_Point',
  [HERO_STATES.CONFIRMATION]: 'Action_Confirmation',
};

export const STATE_MORPH_MAP = {
  [HERO_STATES.IDLE]: {},
  [HERO_STATES.GREETING]: { Smile: 0.8 },
  [HERO_STATES.LISTENING]: { Smile: 0.3 },
  [HERO_STATES.THINKING]: { Thinking: 0.85 },
  [HERO_STATES.SPEAKING]: { Speaking: 0.8, Smile: 0.3 },
  [HERO_STATES.SUCCESS]: { Smile: 1.0 },
  [HERO_STATES.ERROR]: { Alert: 0.9 },
  [HERO_STATES.WARNING]: { Alert: 0.7, Thinking: 0.4 },
  [HERO_STATES.POINTING]: { Smile: 0.4 },
  [HERO_STATES.CONFIRMATION]: { Smile: 0.7 },
};

// Priority scale (higher number overrides lower number)
const STATE_PRIORITY = {
  [HERO_STATES.IDLE]: 1,
  [HERO_STATES.LISTENING]: 2,
  [HERO_STATES.THINKING]: 3,
  [HERO_STATES.SPEAKING]: 4,
  [HERO_STATES.GREETING]: 5,
  [HERO_STATES.POINTING]: 5,
  [HERO_STATES.CONFIRMATION]: 6,
  [HERO_STATES.WARNING]: 7,
  [HERO_STATES.ERROR]: 8,
  [HERO_STATES.SUCCESS]: 8,
};

// One-shot durations in seconds before auto-returning to previous state
const ONE_SHOT_DURATIONS = {
  [HERO_STATES.GREETING]: 2.5,
  [HERO_STATES.SUCCESS]: 2.2,
  [HERO_STATES.ERROR]: 1.8,
  [HERO_STATES.POINTING]: 2.2,
  [HERO_STATES.CONFIRMATION]: 1.8,
  [HERO_STATES.WARNING]: 2.0,
};

class Hero3DStateMachine {
  constructor() {
    this.currentState = HERO_STATES.IDLE;
    this.previousState = HERO_STATES.IDLE;
    this.subscribers = new Set();
    this.timer = null;
  }

  getState() {
    return this.currentState;
  }

  getAnimationName(state = this.currentState) {
    return STATE_ANIMATION_MAP[state] || STATE_ANIMATION_MAP[HERO_STATES.IDLE];
  }

  getMorphTargets(state = this.currentState) {
    return STATE_MORPH_MAP[state] || {};
  }

  subscribe(callback) {
    this.subscribers.add(callback);
    callback(this.currentState, null);
    return () => this.subscribers.delete(callback);
  }

  notify(prevState) {
    this.subscribers.forEach((cb) => {
      try {
        cb(this.currentState, prevState);
      } catch (err) {
        console.warn('[Hero3DStateMachine] Subscriber notification error:', err);
      }
    });
  }

  setState(nextState, force = false) {
    if (!HERO_STATES[nextState]) {
      console.warn(`[Hero3DStateMachine] Invalid state requested: ${nextState}`);
      return false;
    }

    if (this.currentState === nextState && !force) {
      return true;
    }

    const currentPriority = STATE_PRIORITY[this.currentState] || 1;
    const nextPriority = STATE_PRIORITY[nextState] || 1;

    // Check if transition is allowed based on priority
    if (!force && nextPriority < currentPriority && ONE_SHOT_DURATIONS[this.currentState]) {
      // Current active one-shot state is higher priority, queue or ignore
      return false;
    }

    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }

    const prevState = this.currentState;
    this.previousState = prevState;
    this.currentState = nextState;

    // Auto-return for one-shot states
    const duration = ONE_SHOT_DURATIONS[nextState];
    if (duration) {
      this.timer = setTimeout(() => {
        this.timer = null;
        this.returnToDefault();
      }, duration * 1000);
    }

    this.notify(prevState);
    return true;
  }

  returnToDefault() {
    this.setState(HERO_STATES.IDLE, true);
  }

  reset() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const prevState = this.currentState;
    this.currentState = HERO_STATES.IDLE;
    this.previousState = HERO_STATES.IDLE;
    this.notify(prevState);
  }
}

export const hero3dStateMachine = new Hero3DStateMachine();
