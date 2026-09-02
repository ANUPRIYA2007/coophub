/**
 * Custom React Hooks for 3D GSAP animations across all dashboards and pages
 */

import { useEffect, useRef } from "react";
import { gsap3dEngine } from "../services/animation/gsap3dEngine";

export function use3DTilt(options = {}) {
  const ref = useRef(null);

  useEffect(() => {
    if (ref.current) {
      gsap3dEngine.attach3DTilt(ref.current, options);
    }
  }, [options]);

  return ref;
}

export function use3DStaggerEntrance(targetSelector, deps = [], options = {}) {
  const containerRef = useRef(null);

  useEffect(() => {
    if (containerRef.current) {
      const targets = targetSelector
        ? containerRef.current.querySelectorAll(targetSelector)
        : containerRef.current.children;

      if (targets && targets.length > 0) {
        gsap3dEngine.animate3DStaggerEntrance(targets, options);
      }
    }
  }, deps);

  return containerRef;
}

export default {
  use3DTilt,
  use3DStaggerEntrance,
};
