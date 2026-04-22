"use client";

import { useMemo } from "react";
import type { Capability, Decision, Resource } from "@/lib/authz/types";
import { can } from "@/lib/authz/engine";
import { useAuth } from "./context";

/**
 * Runs the same `can()` engine used on the server against the client's
 * hydrated Principal. UI gates must prefer this over ad-hoc role checks —
 * the engine is the only source of truth.
 */
export function useCan(capability: Capability, resource?: Resource): Decision {
  const { principal } = useAuth();
  return useMemo(
    () => can(principal, capability, resource),
    [principal, capability, resource],
  );
}
