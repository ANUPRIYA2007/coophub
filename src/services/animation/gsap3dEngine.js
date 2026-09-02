/**
 * COOP HUB — Smooth & Refined Animation Engine
 * 
 * Provides subtle, elegant micro-animations, smooth fade entrances,
 * and stable hover states without excessive tilting or spring oscillation.
 */

import gsap from "gsap";

class Gsap3dEngine {
  constructor() {
    this.isInitialized = false;
    this.activeCards = new WeakSet();
    this.activeButtons = new WeakSet();
    this.activeNavs = new WeakSet();
  }

  /**
   * Initializes global subtle interactions and entrance observers.
   */
  initGlobal3DInteractions() {
    if (typeof window === "undefined") return;
    if (this.isInitialized) {
      this.refresh();
      return;
    }

    this.isInitialized = true;
    this.bindAllElements();

    const observer = new MutationObserver(() => {
      this.bindAllElements();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  /**
   * Scans document and attaches subtle, calm hover micro-interactions.
   */
  bindAllElements() {
    const cardSelectors = [
      ".card",
      ".stat-card",
      ".admin-stat-card",
      ".service-card",
      ".order-card",
      ".gsap-3d-card",
      "[data-3d-card]",
    ];

    document.querySelectorAll(cardSelectors.join(",")).forEach((card) => {
      if (this.activeCards.has(card)) return;
      this.attachSmoothCard(card);
      this.activeCards.add(card);
    });
  }

  /**
   * Attaches clean, stable hover elevation without wild 3D rotation or mouse tracking.
   */
  attachSmoothCard(el) {
    el.style.transition = "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.25s cubic-bezier(0.16, 1, 0.3, 1)";

    const onMouseEnter = () => {
      gsap.to(el, {
        y: -3,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const onMouseLeave = () => {
      gsap.to(el, {
        y: 0,
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    el.addEventListener("mouseenter", onMouseEnter);
    el.addEventListener("mouseleave", onMouseLeave);
  }

  /**
   * Attaches subtle hover to buttons.
   */
  attach3DButton(btn) {
    // Keep buttons solid and stable
  }

  /**
   * Attaches subtle hover depth to navigation.
   */
  attach3DNavigation(nav) {
    // Handled smoothly via CSS
  }

  /**
   * Smooth, modern stagger entrance for dashboards and grids.
   */
  animate3DStaggerEntrance(targets, options = {}) {
    if (!targets) return;

    gsap.fromTo(
      targets,
      {
        opacity: 0,
        y: options.y || 16,
        scale: options.scale || 0.98,
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: options.duration || 0.45,
        stagger: options.stagger || 0.05,
        ease: options.ease || "power2.out",
        clearProps: "transform,opacity",
      }
    );
  }

  /**
   * Very gentle ambient float for badges without distracting tilt.
   */
  animate3DFloat(target, options = {}) {
    if (!target) return;

    return gsap.to(target, {
      y: options.y || -3,
      duration: options.duration || 2.5,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
    });
  }

  refresh() {
    this.bindAllElements();
  }
}

export const gsap3dEngine = new Gsap3dEngine();
export default gsap3dEngine;

