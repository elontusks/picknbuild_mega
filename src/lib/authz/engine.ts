import type {
  Capability,
  Condition,
  Decision,
  Principal,
  Resource,
} from "./types";
import { ROLE_CAPABILITIES } from "./roles";
import { CAPABILITY_POLICIES } from "./capability-policies";
import { accountActive } from "./conditions/verification";

const DEFAULT_POLICY: Condition[] = [accountActive];

/**
 * Pure decision function. No I/O, no clocks, no randomness. Same input →
 * same output. Runs identically on server and client.
 */
export function can(
  principal: Principal | null,
  capability: Capability,
  resource?: Resource,
): Decision {
  const policies = CAPABILITY_POLICIES[capability] ?? DEFAULT_POLICY;

  // Anonymous branch: only empty-policy capabilities are accessible.
  if (!principal) {
    if (policies.length === 0) return { allowed: true, reason: "" };
    return { allowed: false, reason: "Not signed in." };
  }

  // Role grant check
  const grants = new Set(
    principal.roles.flatMap((r) => ROLE_CAPABILITIES[r] ?? []),
  );
  if (!grants.has(capability)) {
    return {
      allowed: false,
      reason: `Missing capability: ${capability}.`,
      missingCapabilities: [capability],
    };
  }

  // All conditions must pass
  const failures = policies
    .map((fn) => fn(principal, resource))
    .filter((r) => !r.passed);

  if (failures.length === 0) return { allowed: true, reason: "" };

  const firstReason = failures[0]?.reason ?? "Denied by policy.";
  return {
    allowed: false,
    reason: firstReason,
    failedConditions: failures
      .map((f) => f.reason)
      .filter((r): r is string => typeof r === "string"),
  };
}

export function cannot(
  principal: Principal | null,
  capability: Capability,
  resource?: Resource,
): boolean {
  return !can(principal, capability, resource).allowed;
}
