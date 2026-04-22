export type UserRole = "buyer" | "dealer" | "individual_seller" | "admin";

export type AccountStatus = "active" | "suspended" | "banned" | "unverified";

export interface DealerContext {
  page_id: string | null;
  page_claimed: boolean;
  subscription_active: boolean;
}

export interface Principal {
  id: string;
  roles: UserRole[];
  email_verified: boolean;
  phone_verified: boolean;
  account_status: AccountStatus;
  dealer?: DealerContext;
}

/**
 * Branded string. Only constructable through the CAPABILITIES registry.
 * Format: `<domain>.<action>[.<scope>]`.
 */
export type Capability = string & { readonly __brand: "Capability" };

export interface Resource {
  type: string;
  id: string;
  owner_id?: string | null;
  dealer_page_id?: string | null;
  [key: string]: unknown;
}

export interface Decision {
  allowed: boolean;
  reason: string;
  missingCapabilities?: Capability[];
  failedConditions?: string[];
}

export type ConditionResult = { passed: boolean; reason?: string };

export type Condition = (
  principal: Principal,
  resource?: Resource,
) => ConditionResult;
