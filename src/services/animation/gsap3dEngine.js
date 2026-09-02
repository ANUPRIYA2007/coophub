/**
 * COOP HUB — Heavy 3D GSAP Animation & Physics Engine
 * 
 * Delivers AAA-tier 3D perspective tilt, magnetic buttons, tactile 3D press physics,
 * specular 3D glare shine, and cinematic 3D stagger entrances across:
 * 1. Main Landing Page
 * 2. Customer Portal Dashboard & Navigation
 * 3. Pillar Partner Dashboard & Order Cards
 * 4. Admin Cooperative Control Center & Telemetry Stats
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
   * Initializes global 3D listeners, auto-observers, and magnetic interactions.
   */
  initGlobal3DInteractions() {
    if (typeof window === "undefined") return;
    if (this.isInitialized) {
      this.refresh();
      return;
    }

    this.isInitialized = true;

    // Initial binding
    this.bindAllElements();

    // Auto-bind new DOM nodes on route/tab changes via MutationObserver
    const observer = new MutationObserver(() => {
      this.bindAllElements();
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true,
    });

    // Global 3D Button Tactile Physics on Click / MouseDown
    document.addEventListener("mousedown", (e) => {
      const btn = e.target.closest("button, .btn, .btn-primary, .btn-secondary, .btn-success, .btn-outline, a.btn, [data-3d-btn]");
      if (!btn) return;

      gsap.to(btn, {
        scale: 0.94,
        translateZ: -12,
        rotationX: 4,
        duration: 0.12,
        ease: "power2.out",
        transformPerspective: 800,
        overwrite: "auto",
      });
    });

    document.addEventListener("mouseup", (e) => {
      const btn = e.target.closest("button, .btn, .btn-primary, .btn-secondary, .btn-success, .btn-outline, a.btn, [data-3d-btn]");
      if (!btn) return;

      gsap.to(btn, {
        scale: 1,
        translateZ: 0,
        rotationX: 0,
        duration: 0.45,
        ease: "elastic.out(1.2, 0.4)",
        overwrite: "auto",
      });
    });
  }

  /**
   * Scans document and attaches 3D tilt & physics to cards, buttons, and navigation links.
   */
  bindAllElements() {
    // 1. 3D Tilt Cards (Dashboard stats, service cards, order cards, portal cards)
    const cardSelectors = [
      ".card",
      ".stat-card",
      ".admin-stat-card",
      ".service-card",
      ".order-card",
      ".gsap-3d-card",
      "[data-3d-card]",
      ".bg-white\\/5",
    ];

    document.querySelectorAll(cardSelectors.join(",")).forEach((card) => {
      if (this.activeCards.has(card)) return;
      this.attach3DTilt(card, {
        maxTilt: 14,
        perspective: 1200,
        scale: 1.035,
        glare: true,
      });
      this.activeCards.add(card);
    });

    // 2. 3D Magnetic & Glow Buttons
    const buttonSelectors = [
      "button.btn",
      ".btn-primary",
      ".btn-secondary",
      ".btn-success",
      ".btn-warning",
      ".gsap-3d-btn",
      "[data-3d-btn]",
    ];

    document.querySelectorAll(buttonSelectors.join(",")).forEach((btn) => {
      if (this.activeButtons.has(btn)) return;
      this.attach3DButton(btn);
      this.activeButtons.add(btn);
    });

    // 3. 3D Navigation Links & Tabs
    const navSelectors = [
      ".nav-item",
      ".framer-side-menu-link",
      ".tab-item",
      ".nav-tab",
      ".gsap-3d-nav",
      "[data-3d-nav]",
    ];

    document.querySelectorAll(navSelectors.join(",")).forEach((nav) => {
      if (this.activeNavs.has(nav)) return;
      this.attach3DNavigation(nav);
      this.activeNavs.add(nav);
    });
  }

  /**
   * Attaches heavy 3D perspective tilt and dynamic specular glare on mouse movement.
   */
  attach3DTilt(el, options = {}) {
    const maxTilt = options.maxTilt || 14;
    const perspective = options.perspective || 1200;
    const scale = options.scale || 1.035;
    const glareEnabled = options.glare !== false;

    // Apply baseline CSS 3D properties
    el.style.transformStyle = "preserve-3d";
    el.style.willChange = "transform";

    // Create 3D Glare overlay if enabled
    let glareEl = null;
    if (glareEnabled) {
      glareEl = el.querySelector(".gsap-3d-glare");
      if (!glareEl) {
        glareEl = document.createElement("div");
        glareEl.className = "gsap-3d-glare";
        glareEl.style.position = "absolute";
        glareEl.style.top = "0";
        glareEl.style.left = "0";
        glareEl.style.width = "100%";
        glareEl.style.height = "100%";
        glareEl.style.borderRadius = "inherit";
        glareEl.style.pointerEvents = "none";
        glareEl.style.opacity = "0";
        glareEl.style.background = "radial-gradient(circle at 50% 50%, rgba(255, 255, 255, 0.22) 0%, rgba(255, 255, 255, 0) 70%)";
        glareEl.style.transition = "opacity 0.25s ease";
        glareEl.style.zIndex = "10";
        el.style.position = el.style.position || "relative";
        el.appendChild(glareEl);
      }
    }

    const onMouseMove = (e) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      const centerX = rect.width / 2;
      const centerY = rect.height / 2;

      const rotateX = ((y - centerY) / centerY) * -maxTilt;
      const rotateY = ((x - centerX) / centerX) * maxTilt;

      gsap.to(el, {
        rotationX: rotateX,
        rotationY: rotateY,
        scale: scale,
        translateZ: 25,
        transformPerspective: perspective,
        duration: 0.3,
        ease: "power2.out",
        overwrite: "auto",
      });

      if (glareEl) {
        const glareX = (x / rect.width) * 100;
        const glareY = (y / rect.height) * 100;
        glareEl.style.opacity = "1";
        glareEl.style.background = `radial-gradient(circle at ${glareX}% ${glareY}%, rgba(255, 255, 255, 0.28) 0%, rgba(255, 255, 255, 0) 65%)`;
      }
    };

    const onMouseLeave = () => {
      gsap.to(el, {
        rotationX: 0,
        rotationY: 0,
        scale: 1,
        translateZ: 0,
        duration: 0.65,
        ease: "elastic.out(1.1, 0.4)",
        overwrite: "auto",
      });

      if (glareEl) {
        glareEl.style.opacity = "0";
      }
    };

    el.addEventListener("mousemove", onMouseMove);
    el.addEventListener("mouseleave", onMouseLeave);
  }

  /**
   * Attaches magnetic 3D float physics to interactive buttons.
   */
  attach3DButton(btn) {
    btn.style.transformStyle = "preserve-3d";
    btn.style.willChange = "transform";

    const onMouseMove = (e) => {
      const rect = btn.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;

      gsap.to(btn, {
        x: x * 0.22,
        y: y * 0.22,
        rotationX: (y / (rect.height / 2)) * -8,
        rotationY: (x / (rect.width / 2)) * 8,
        translateZ: 14,
        scale: 1.04,
        transformPerspective: 600,
        duration: 0.25,
        ease: "power2.out",
        overwrite: "auto",
      });
    };

    const onMouseLeave = () => {
      gsap.to(btn, {
        x: 0,
        y: 0,
        rotationX: 0,
        rotationY: 0,
        translateZ: 0,
        scale: 1,
        duration: 0.55,
        ease: "elastic.out(1.2, 0.4)",
        overwrite: "auto",
      });
    };

    btn.addEventListener("mousemove", onMouseMove);
    btn.addEventListener("mouseleave", onMouseLeave);
  }

  /**
   * Attaches 3D layer depth to navigation links.
   */
  attach3DNavigation(nav) {
    nav.style.transformStyle = "preserve-3d";
    nav.style.willChange = "transform";

    const onMouseEnter = () => {
      gsap.to(nav, {
        x: 6,
        translateZ: 16,
        scale: 1.025,
        duration: 0.25,
        ease: "power2.out",
      });

      const icon = nav.querySelector("svg, .icon, i");
      if (icon) {
        gsap.to(icon, {
          scale: 1.18,
          rotation: 4,
          duration: 0.3,
          ease: "back.out(2)",
        });
      }
    };

    const onMouseLeave = () => {
      gsap.to(nav, {
        x: 0,
        translateZ: 0,
        scale: 1,
        duration: 0.4,
        ease: "power2.out",
      });

      const icon = nav.querySelector("svg, .icon, i");
      if (icon) {
        gsap.to(icon, {
          scale: 1,
          rotation: 0,
          duration: 0.35,
          ease: "power2.out",
        });
      }
    };

    nav.addEventListener("mouseenter", onMouseEnter);
    nav.addEventListener("mouseleave", onMouseLeave);
  }

  /**
   * Cinematic 3D stagger entrance for dashboards, grids, and hero cards.
   */
  animate3DStaggerEntrance(targets, options = {}) {
    if (!targets) return;

    gsap.fromTo(
      targets,
      {
        opacity: 0,
        y: options.y || 45,
        rotationX: options.rotationX || 25,
        rotationY: options.rotationY || -10,
        translateZ: options.translateZ || -80,
        scale: options.scale || 0.92,
        transformPerspective: 1200,
      },
      {
        opacity: 1,
        y: 0,
        rotationX: 0,
        rotationY: 0,
        translateZ: 0,
        scale: 1,
        duration: options.duration || 0.75,
        stagger: options.stagger || 0.08,
        ease: options.ease || "back.out(1.6)",
        clearProps: "all",
      }
    );
  }

  /**
   * 3D Floating Bobbing effect for badges, mascot cards, and hero elements.
   */
  animate3DFloat(target, options = {}) {
    if (!target) return;

    return gsap.to(target, {
      y: options.y || -10,
      rotationZ: options.rotationZ || 2,
      rotationX: options.rotationX || 4,
      duration: options.duration || 2.4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      transformPerspective: 1000,
    });
  }

  refresh() {
    this.bindAllElements();
  }
}

export const gsap3dEngine = new Gsap3dEngine();
export default gsap3dEngine;
