import { describe, expect, test } from "vitest";
import { ALL_CAPABILITIES, CAPABILITIES } from "@/lib/authz/capabilities";
import { ROLE_CAPABILITIES } from "@/lib/authz/roles";
import { CAPABILITY_POLICIES } from "@/lib/authz/capability-policies";
import type { UserRole } from "@/lib/authz/types";

describe("capability registry integrity", () => {
  test("every registry leaf is unique", () => {
    const strings = ALL_CAPABILITIES.map(String);
    expect(new Set(strings).size).toBe(strings.length);
  });

  test("every role grant references a known capability", () => {
    const known = new Set(ALL_CAPABILITIES.map(String));
    const roles = Object.keys(ROLE_CAPABILITIES) as UserRole[];
    for (const role of roles) {
      for (const cap of ROLE_CAPABILITIES[role]) {
        expect(known.has(String(cap))).toBe(true);
      }
    }
  });

  test("every policy key references a known capability", () => {
    const known = new Set(ALL_CAPABILITIES.map(String));
    for (const key of Object.keys(CAPABILITY_POLICIES)) {
      expect(known.has(key)).toBe(true);
    }
  });

  test("admin role === ALL_CAPABILITIES", () => {
    expect([...ROLE_CAPABILITIES.admin]).toEqual(ALL_CAPABILITIES);
  });

  test("every capability is either in CAPABILITY_POLICIES or default-policy by design", () => {
    // Allowed to be absent from CAPABILITY_POLICIES: documented defaults only.
    // Currently every capability has an explicit policy entry.
    const absent = ALL_CAPABILITIES.filter(
      (c) => CAPABILITY_POLICIES[c] === undefined,
    );
    expect(absent).toEqual([]);
  });

  test("public capabilities have empty policy", () => {
    expect(CAPABILITY_POLICIES[CAPABILITIES.reality_check.preview]).toEqual([]);
    expect(CAPABILITY_POLICIES[CAPABILITIES.feed.view]).toEqual([]);
  });
});
