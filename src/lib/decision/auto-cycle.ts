"use client";

import { useEffect, useRef, useState } from "react";
import type { PathKind } from "@/contracts";

export const DEFAULT_CYCLE_MS = 6000;

/**
 * Auto-cycle behavior for the See Where You Stand panel. Advances the active
 * gap path through the given rotation until the user interacts (selects or
 * explicitly stops). The `stop` callback is returned so callers can freeze
 * the rotation on path-toggle clicks.
 */
export function useAutoCycle(
  paths: readonly PathKind[],
  initial: PathKind,
  opts: { intervalMs?: number; enabled?: boolean } = {},
): {
  activePath: PathKind;
  setActivePath: (p: PathKind) => void;
  stopped: boolean;
  stop: () => void;
  resume: () => void;
} {
  const intervalMs = opts.intervalMs ?? DEFAULT_CYCLE_MS;
  const enabled = opts.enabled ?? true;

  const [activePath, setActiveInternal] = useState<PathKind>(initial);
  const [stopped, setStopped] = useState(false);
  const pathsRef = useRef(paths);

  useEffect(() => {
    pathsRef.current = paths;
  }, [paths]);

  useEffect(() => {
    if (stopped || !enabled) return;
    if (paths.length < 2) return;
    const id = setInterval(() => {
      setActiveInternal((cur) => {
        const pool = pathsRef.current;
        if (pool.length === 0) return cur;
        const idx = pool.indexOf(cur);
        const next = pool[(idx + 1) % pool.length];
        return next ?? cur;
      });
    }, intervalMs);
    return () => clearInterval(id);
  }, [stopped, enabled, intervalMs, paths.length]);

  const setActivePath = (p: PathKind) => {
    setStopped(true);
    setActiveInternal(p);
  };

  return {
    activePath,
    setActivePath,
    stopped,
    stop: () => setStopped(true),
    resume: () => setStopped(false),
  };
}
