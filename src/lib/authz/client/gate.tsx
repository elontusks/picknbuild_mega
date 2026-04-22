"use client";

import type { ReactNode } from "react";
import type { Capability, Resource } from "@/lib/authz/types";
import { useCan } from "./use-can";

interface GateProps {
  cap: Capability;
  resource?: Resource;
  children: ReactNode;
  fallback?: ReactNode;
}

/**
 * Render children only when the engine allows `cap` for the current
 * Principal. Falls back to `fallback` (default: nothing) otherwise.
 *
 * Note: client gating is a UX convenience. The server gate is the
 * source of truth — always back a `<Gate>` with a `requireCap()` route.
 */
export function Gate({ cap, resource, children, fallback = null }: GateProps) {
  const { allowed } = useCan(cap, resource);
  return <>{allowed ? children : fallback}</>;
}
