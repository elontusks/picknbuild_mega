import { describe, expect, test } from "vitest";
import { can, cannot } from "@/lib/authz/engine";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import type { Principal, Resource } from "@/lib/authz/types";

// -- Fixtures --------------------------------------------------------------

const buyer: Principal = {
  id: "u-buyer",
  roles: ["buyer"],
  email_verified: true,
  phone_verified: true,
  account_status: "active",
};

const buyerNoEmail: Principal = { ...buyer, email_verified: false };
const buyerNoPhone: Principal = { ...buyer, phone_verified: false };
const buyerSuspended: Principal = { ...buyer, account_status: "suspended" };
const buyerBanned: Principal = { ...buyer, account_status: "banned" };

const individualSeller: Principal = {
  ...buyer,
  id: "u-seller",
  roles: ["individual_seller"],
};

const dealerUnclaimed: Principal = {
  id: "u-dealer",
  roles: ["dealer"],
  email_verified: true,
  phone_verified: true,
  account_status: "active",
  dealer: { page_id: "dp-1", page_claimed: false, subscription_active: false },
};
const dealerClaimedNoSub: Principal = {
  ...dealerUnclaimed,
  dealer: { page_id: "dp-1", page_claimed: true, subscription_active: false },
};
const dealerFull: Principal = {
  ...dealerUnclaimed,
  dealer: { page_id: "dp-1", page_claimed: true, subscription_active: true },
};

const admin: Principal = {
  id: "u-admin",
  roles: ["admin"],
  email_verified: true,
  phone_verified: true,
  account_status: "active",
};

const adminPlusBuyer: Principal = { ...admin, roles: ["buyer", "admin"] };

// Resources
const myListing: Resource = {
  type: "listing",
  id: "l-1",
  owner_id: buyer.id,
  dealer_page_id: null,
};
const othersListing: Resource = {
  type: "listing",
  id: "l-2",
  owner_id: "someone-else",
  dealer_page_id: null,
};
const dealerListing: Resource = {
  type: "listing",
  id: "l-3",
  owner_id: null,
  dealer_page_id: "dp-1",
};
const differentDealerListing: Resource = {
  type: "listing",
  id: "l-4",
  owner_id: null,
  dealer_page_id: "dp-999",
};
const orphanListing: Resource = {
  type: "listing",
  id: "l-5",
  owner_id: null,
  dealer_page_id: null,
};

// -- Anonymous access ------------------------------------------------------

describe("anonymous", () => {
  test("can preview reality_check (empty policy, no role check)", () => {
    expect(can(null, C.reality_check.preview).allowed).toBe(true);
  });
  test("can view feed (empty policy)", () => {
    expect(can(null, C.feed.view).allowed).toBe(true);
  });
  test("cannot view listings (requires signed-in)", () => {
    const d = can(null, C.listings.view);
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("Not signed in.");
  });
  test("cannot create listings", () => {
    expect(cannot(null, C.listings.create)).toBe(true);
  });
  test("cannot access admin dashboard", () => {
    expect(cannot(null, C.admin.dashboard_view)).toBe(true);
  });
});

// -- Role grants -----------------------------------------------------------

describe("role grants", () => {
  test("buyer cannot create listings", () => {
    const d = can(buyer, C.listings.create);
    expect(d.allowed).toBe(false);
    expect(d.reason).toContain("Missing capability");
    expect(d.missingCapabilities).toEqual([C.listings.create]);
  });
  test("individual_seller can create listings", () => {
    expect(can(individualSeller, C.listings.create).allowed).toBe(true);
  });
  test("dealer can create listings", () => {
    expect(can(dealerFull, C.listings.create).allowed).toBe(true);
  });
  test("buyer cannot access dealer analytics", () => {
    expect(cannot(buyer, C.dealer.analytics_view)).toBe(true);
  });
  test("admin gets every capability", () => {
    expect(can(admin, C.admin.dashboard_view).allowed).toBe(true);
    expect(can(admin, C.listings.delete_any).allowed).toBe(true);
    expect(can(admin, C.feed.moderate).allowed).toBe(true);
    expect(can(admin, C.reports.resolve).allowed).toBe(true);
  });
  test("multi-role principal unions capabilities", () => {
    expect(can(adminPlusBuyer, C.admin.users_ban).allowed).toBe(true);
    expect(can(adminPlusBuyer, C.garage.view_own).allowed).toBe(true);
  });
  test("buyer cannot moderate feed", () => {
    expect(cannot(buyer, C.feed.moderate)).toBe(true);
  });
});

// -- Verification conditions ----------------------------------------------

describe("email verification", () => {
  test("reality_check.start allowed with verified email", () => {
    expect(can(buyer, C.reality_check.start).allowed).toBe(true);
  });
  test("reality_check.start denied without email", () => {
    const d = can(buyerNoEmail, C.reality_check.start);
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("Email must be verified.");
  });
  test("feed.post.own denied without email", () => {
    expect(cannot(buyerNoEmail, C.feed.post_own)).toBe(true);
  });
});

describe("phone verification", () => {
  test("listings.create denied without phone", () => {
    const d = can({ ...dealerFull, phone_verified: false }, C.listings.create);
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("Phone must be verified.");
  });
  test("messages.send denied without phone", () => {
    const d = can(buyerNoPhone, C.messages.send);
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("Phone must be verified.");
  });
  test("messages.send allowed with phone", () => {
    expect(can(buyer, C.messages.send).allowed).toBe(true);
  });
  test("messages.read allowed without phone", () => {
    expect(can(buyerNoPhone, C.messages.read).allowed).toBe(true);
  });
});

// -- Account status -------------------------------------------------------

describe("account status", () => {
  test("suspended buyer denied from listings.view", () => {
    const d = can(buyerSuspended, C.listings.view);
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("Account is suspended.");
  });
  test("banned buyer denied everything gated by accountActive", () => {
    expect(cannot(buyerBanned, C.messages.send)).toBe(true);
    expect(cannot(buyerBanned, C.garage.pick)).toBe(true);
    expect(cannot(buyerBanned, C.reports.submit)).toBe(true);
  });
  test("suspended admin denied admin dashboard", () => {
    const suspAdmin = { ...admin, account_status: "suspended" as const };
    expect(cannot(suspAdmin, C.admin.dashboard_view)).toBe(true);
  });
});

// -- Ownership ------------------------------------------------------------

describe("ownership", () => {
  test("buyer can edit own listing is denied (buyer lacks capability)", () => {
    const d = can(buyer, C.listings.edit_own, myListing);
    expect(d.allowed).toBe(false);
    expect(d.reason).toContain("Missing capability");
  });
  test("individual_seller can edit own listing", () => {
    expect(
      can(
        individualSeller,
        C.listings.edit_own,
        { ...myListing, owner_id: individualSeller.id },
      ).allowed,
    ).toBe(true);
  });
  test("individual_seller cannot edit another's listing", () => {
    const d = can(individualSeller, C.listings.edit_own, othersListing);
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("You do not own this resource.");
  });
  test("dealer can delete a listing belonging to their page", () => {
    expect(
      can(dealerFull, C.listings.delete_own, dealerListing).allowed,
    ).toBe(true);
  });
  test("dealer cannot delete a different dealer's listing", () => {
    expect(
      can(dealerFull, C.listings.delete_own, differentDealerListing).allowed,
    ).toBe(false);
  });
  test("ownership denied when resource has no owner", () => {
    const d = can(dealerFull, C.listings.edit_own, orphanListing);
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("Resource has no owner.");
  });
  test("ownership denied when resource is omitted", () => {
    const d = can(individualSeller, C.listings.edit_own);
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("Resource required for ownership check.");
  });
});

// -- Dealer-specific gating -----------------------------------------------

describe("dealer.profile_edit — page-claim gate", () => {
  test.each([
    ["buyer",               buyer,               false, "Missing capability"],
    ["dealer unclaimed",    dealerUnclaimed,     false, "Dealer page must be claimed."],
    ["dealer claimed",      dealerClaimedNoSub,  true,  ""],
    ["dealer claimed + sub", dealerFull,         true,  ""],
  ] as const)("%s", (_name, principal, allowed, reason) => {
    const d = can(principal, C.dealer.profile_edit);
    expect(d.allowed).toBe(allowed);
    if (!allowed) expect(d.reason).toContain(reason);
  });
});

describe("dealer.analytics_view — claim + subscription gate", () => {
  test.each([
    ["buyer",                 buyer,              false, "Missing capability"],
    ["dealer unclaimed",      dealerUnclaimed,    false, "Dealer page must be claimed."],
    ["dealer claimed no sub", dealerClaimedNoSub, false, "Dealer subscription is inactive."],
    ["dealer claimed + sub",  dealerFull,         true,  ""],
  ] as const)("%s", (_name, principal, allowed, reason) => {
    const d = can(principal, C.dealer.analytics_view);
    expect(d.allowed).toBe(allowed);
    if (!allowed) expect(d.reason).toContain(reason);
  });
});

describe("dealer.claim — email gate", () => {
  test("dealer with verified email can attempt claim", () => {
    expect(can(dealerUnclaimed, C.dealer.claim).allowed).toBe(true);
  });
  test("dealer without verified email denied", () => {
    const d = can(
      { ...dealerUnclaimed, email_verified: false },
      C.dealer.claim,
    );
    expect(d.allowed).toBe(false);
    expect(d.reason).toBe("Email must be verified.");
  });
  test("buyer denied (no capability)", () => {
    expect(cannot(buyer, C.dealer.claim)).toBe(true);
  });
});

// -- Multi-failure reporting ----------------------------------------------

describe("failure aggregation", () => {
  test("reports all failed conditions", () => {
    const dealerBroken: Principal = {
      ...dealerUnclaimed,
      phone_verified: false,
    };
    // listings.create requires [accountActive, emailVerified, phoneVerified].
    // Only phone fails.
    const d = can(dealerBroken, C.listings.create);
    expect(d.allowed).toBe(false);
    expect(d.failedConditions).toEqual(["Phone must be verified."]);
  });

  test("reports multiple failures at once", () => {
    const dealerVeryBroken: Principal = {
      ...dealerUnclaimed,
      email_verified: false,
      phone_verified: false,
    };
    const d = can(dealerVeryBroken, C.listings.create);
    expect(d.allowed).toBe(false);
    expect(d.failedConditions).toEqual([
      "Email must be verified.",
      "Phone must be verified.",
    ]);
    // First failure wins for `reason`.
    expect(d.reason).toBe("Email must be verified.");
  });
});

// -- cannot() helper ------------------------------------------------------

describe("cannot()", () => {
  test("inverts can()", () => {
    expect(cannot(null, C.reality_check.preview)).toBe(false);
    expect(cannot(null, C.listings.create)).toBe(true);
    expect(cannot(admin, C.admin.dashboard_view)).toBe(false);
  });
});
