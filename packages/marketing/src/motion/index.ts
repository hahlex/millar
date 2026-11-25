import { useEffect, useState } from "react";
import { MILLAR_MOTION_DURATION_MS, MILLAR_MOTION_EASING } from "@hahlex/millar-tokens/ts";

export { MILLAR_MOTION_DURATION_MS, MILLAR_MOTION_EASING };

/**
 * Reactive reduced-motion hook. Always defaults safely for SSR and ensures
 * static-first marketing sections render their completed resting state immediately.
 */
export function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") return;
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const handler = (event: MediaQueryListEvent) => setReduced(event.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  return reduced;
}

export const MILLAR_CSS_TRANSITIONS = {
  productiveFast: `all ${MILLAR_MOTION_DURATION_MS.productiveFast}ms cubic-bezier(${MILLAR_MOTION_EASING.productiveStandard.join(", ")})`,
  productiveBase: `all ${MILLAR_MOTION_DURATION_MS.productiveBase}ms cubic-bezier(${MILLAR_MOTION_EASING.productiveStandard.join(", ")})`,
  productiveSlow: `all ${MILLAR_MOTION_DURATION_MS.productiveSlow}ms cubic-bezier(${MILLAR_MOTION_EASING.productiveEntrance.join(", ")})`,
  expressiveModerate: `all ${MILLAR_MOTION_DURATION_MS.expressiveModerate}ms cubic-bezier(${MILLAR_MOTION_EASING.expressiveStandard.join(", ")})`,
  expressiveSlow: `all ${MILLAR_MOTION_DURATION_MS.expressiveSlow}ms cubic-bezier(${MILLAR_MOTION_EASING.expressiveEntrance.join(", ")})`,
} as const;
