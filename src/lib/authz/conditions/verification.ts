import type { Condition } from "../types";

export const accountActive: Condition = (p) =>
  p.account_status === "active"
    ? { passed: true }
    : { passed: false, reason: `Account is ${p.account_status}.` };

export const emailVerified: Condition = (p) =>
  p.email_verified
    ? { passed: true }
    : { passed: false, reason: "Email must be verified." };

export const phoneVerified: Condition = (p) =>
  p.phone_verified
    ? { passed: true }
    : { passed: false, reason: "Phone must be verified." };
