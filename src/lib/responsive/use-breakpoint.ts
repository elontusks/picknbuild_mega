"use client";

import { useEffect, useState } from "react";
import {
  resolveBreakpoint,
  type Breakpoint,
} from "./breakpoints";

/**
 * Returns the current breakpoint based on viewport width. Returns "xs" during
 * SSR / before hydration; consumers that need to avoid layout shift should
 * gate on a separate "mounted" state.
 */
export function useBreakpoint(): Breakpoint {
  const [bp, setBp] = useState<Breakpoint>("xs");
  useEffect(() => {
    const recompute = () => setBp(resolveBreakpoint(window.innerWidth));
    recompute();
    window.addEventListener("resize", recompute, { passive: true });
    return () => window.removeEventListener("resize", recompute);
  }, []);
  return bp;
}
