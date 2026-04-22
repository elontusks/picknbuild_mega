import { beforeEach, describe, expect, test, vi } from "vitest";
import { makeFixtureListingObject, makeFixtureUser } from "@/contracts";

const hoisted = vi.hoisted(() => ({
  requireUser: vi.fn(),
  getListing: vi.fn(),
  markListingStatus: vi.fn(),
  upsertDealerListing: vi.fn(),
  openOrCreateThread: vi.fn(),
  loadUserById: vi.fn(),
  redirect: vi.fn((_path: string) => {
    throw new Error("__redirect__");
  }),
  revalidatePath: vi.fn(),
}));

vi.mock("@/services/team-01-auth", () => ({
  requireUser: (...a: unknown[]) => hoisted.requireUser(...a),
}));

vi.mock("@/services/team-03-supply", () => ({
  getListing: (...a: unknown[]) => hoisted.getListing(...a),
  markListingStatus: (...a: unknown[]) => hoisted.markListingStatus(...a),
  upsertDealerListing: (...a: unknown[]) => hoisted.upsertDealerListing(...a),
}));

vi.mock("@/services/team-13-messaging", () => ({
  openOrCreateThread: (...a: unknown[]) => hoisted.openOrCreateThread(...a),
}));

vi.mock("@/lib/profiles/load-user", () => ({
  loadUserById: (...a: unknown[]) => hoisted.loadUserById(...a),
}));

vi.mock("next/navigation", () => ({
  redirect: (path: string) => hoisted.redirect(path),
}));

vi.mock("next/cache", () => ({
  revalidatePath: (...a: unknown[]) => hoisted.revalidatePath(...a),
}));

import {
  openDealerThread,
  removeDealerListing,
  saveDealerListing,
} from "@/app/dealers/[userId]/actions";
import { openSellerThread } from "@/app/sellers/[userId]/actions";

type DealerListingFormState = Awaited<ReturnType<typeof saveDealerListing>>;
const INITIAL: DealerListingFormState = { status: "idle" };

const fdFromObject = (obj: Record<string, string | number | undefined>): FormData => {
  const fd = new FormData();
  for (const [key, value] of Object.entries(obj)) {
    if (value === undefined) continue;
    fd.append(key, String(value));
  }
  return fd;
};

const dealer = () =>
  makeFixtureUser({ id: "d_owner", role: "dealer", displayName: "Honest Autos" });
const buyer = () => makeFixtureUser({ id: "buyer_1", role: "buyer" });
const seller = () => makeFixtureUser({ id: "seller_1", role: "seller" });

describe("saveDealerListing", () => {
  beforeEach(() => {
    hoisted.requireUser.mockReset();
    hoisted.getListing.mockReset();
    hoisted.upsertDealerListing.mockReset();
    hoisted.revalidatePath.mockReset();
  });

  test("rejects when viewer.role !== 'dealer'", async () => {
    hoisted.requireUser.mockResolvedValue(buyer());
    const result = await saveDealerListing(
      INITIAL,
      fdFromObject({ year: 2020, make: "Toyota", model: "Tacoma", price: 24000 }),
    );
    expect(result).toMatchObject({ status: "error" });
    if (result.status === "error") {
      expect(result.error).toMatch(/Only dealers/);
    }
    expect(hoisted.upsertDealerListing).not.toHaveBeenCalled();
  });

  test("rejects edit when existing listing is owned by a different user", async () => {
    hoisted.requireUser.mockResolvedValue(dealer());
    hoisted.getListing.mockResolvedValue(
      makeFixtureListingObject({
        id: "l1",
        source: "dealer",
        ownerUserId: "someone_else",
      }),
    );
    const result = await saveDealerListing(
      INITIAL,
      fdFromObject({
        listingId: "l1",
        year: 2020,
        make: "Toyota",
        model: "Tacoma",
        price: 24000,
      }),
    );
    expect(result).toMatchObject({ status: "error" });
    if (result.status === "error") {
      expect(result.error).toMatch(/Not your listing/);
    }
    expect(hoisted.upsertDealerListing).not.toHaveBeenCalled();
  });

  test("rejects edit when existing.source !== 'dealer'", async () => {
    hoisted.requireUser.mockResolvedValue(dealer());
    hoisted.getListing.mockResolvedValue(
      makeFixtureListingObject({
        id: "l1",
        source: "user",
        ownerUserId: "d_owner",
      }),
    );
    const result = await saveDealerListing(
      INITIAL,
      fdFromObject({
        listingId: "l1",
        year: 2020,
        make: "Toyota",
        model: "Tacoma",
        price: 24000,
      }),
    );
    expect(result).toMatchObject({ status: "error" });
    if (result.status === "error") {
      expect(result.error).toMatch(/Not your listing/);
    }
    expect(hoisted.upsertDealerListing).not.toHaveBeenCalled();
  });

  test("create path omits sourceUrl so Team 3 can derive one", async () => {
    hoisted.requireUser.mockResolvedValue(dealer());
    hoisted.upsertDealerListing.mockResolvedValue({
      ok: true,
      listing: makeFixtureListingObject({ id: "l_new", ownerUserId: "d_owner" }),
    });

    const result = await saveDealerListing(
      INITIAL,
      fdFromObject({
        year: 2020,
        make: "Toyota",
        model: "Tacoma",
        price: 24000,
      }),
    );

    expect(result).toMatchObject({ status: "ok", listingId: "l_new" });
    expect(hoisted.getListing).not.toHaveBeenCalled();
    expect(hoisted.upsertDealerListing).toHaveBeenCalledTimes(1);
    const call = hoisted.upsertDealerListing.mock.calls[0]![0] as {
      ownerUserId: string;
      form: { sourceUrl?: string };
    };
    expect(call.ownerUserId).toBe("d_owner");
    expect(call.form.sourceUrl).toBeUndefined();
  });

  test("edit path passes existing sourceUrl through so upsert hits the same row", async () => {
    hoisted.requireUser.mockResolvedValue(dealer());
    hoisted.getListing.mockResolvedValue(
      makeFixtureListingObject({
        id: "l1",
        source: "dealer",
        ownerUserId: "d_owner",
        sourceUrl: "https://pickandbuild.example.com/dealer-post/d_owner/2020-toyota-tacoma",
      }),
    );
    hoisted.upsertDealerListing.mockResolvedValue({
      ok: true,
      listing: makeFixtureListingObject({ id: "l1", ownerUserId: "d_owner" }),
    });

    const result = await saveDealerListing(
      INITIAL,
      fdFromObject({
        listingId: "l1",
        year: 2020,
        make: "Toyota",
        model: "Tacoma",
        price: 25500,
      }),
    );

    expect(result).toMatchObject({ status: "ok", listingId: "l1" });
    const call = hoisted.upsertDealerListing.mock.calls[0]![0] as {
      form: { sourceUrl?: string };
    };
    expect(call.form.sourceUrl).toBe(
      "https://pickandbuild.example.com/dealer-post/d_owner/2020-toyota-tacoma",
    );
  });
});

describe("removeDealerListing", () => {
  beforeEach(() => {
    hoisted.requireUser.mockReset();
    hoisted.getListing.mockReset();
    hoisted.markListingStatus.mockReset();
    hoisted.revalidatePath.mockReset();
  });

  test("throws when viewer isn't a dealer", async () => {
    hoisted.requireUser.mockResolvedValue(buyer());
    await expect(
      removeDealerListing(fdFromObject({ listingId: "l1" })),
    ).rejects.toThrow(/Only dealers/);
    expect(hoisted.markListingStatus).not.toHaveBeenCalled();
  });

  test("throws when listing isn't owned by viewer", async () => {
    hoisted.requireUser.mockResolvedValue(dealer());
    hoisted.getListing.mockResolvedValue(
      makeFixtureListingObject({
        id: "l1",
        source: "dealer",
        ownerUserId: "someone_else",
      }),
    );
    await expect(
      removeDealerListing(fdFromObject({ listingId: "l1" })),
    ).rejects.toThrow(/Not your listing/);
    expect(hoisted.markListingStatus).not.toHaveBeenCalled();
  });

  test("calls markListingStatus(id, 'removed') on success", async () => {
    hoisted.requireUser.mockResolvedValue(dealer());
    hoisted.getListing.mockResolvedValue(
      makeFixtureListingObject({
        id: "l1",
        source: "dealer",
        ownerUserId: "d_owner",
      }),
    );
    hoisted.markListingStatus.mockResolvedValue(undefined);

    await removeDealerListing(fdFromObject({ listingId: "l1" }));

    expect(hoisted.markListingStatus).toHaveBeenCalledWith("l1", "removed");
  });
});

describe("openDealerThread", () => {
  beforeEach(() => {
    hoisted.requireUser.mockReset();
    hoisted.loadUserById.mockReset();
    hoisted.openOrCreateThread.mockReset();
    hoisted.redirect.mockReset();
    hoisted.redirect.mockImplementation((_path: string) => {
      throw new Error("__redirect__");
    });
  });

  test("throws when the target user isn't a dealer", async () => {
    hoisted.requireUser.mockResolvedValue(buyer());
    hoisted.loadUserById.mockResolvedValue(
      makeFixtureUser({ id: "d_owner", role: "buyer" }),
    );
    await expect(
      openDealerThread(fdFromObject({ dealerId: "d_owner" })),
    ).rejects.toThrow(/Dealer not found/);
    expect(hoisted.openOrCreateThread).not.toHaveBeenCalled();
    expect(hoisted.redirect).not.toHaveBeenCalled();
  });

  test("throws when the target user does not exist", async () => {
    hoisted.requireUser.mockResolvedValue(buyer());
    hoisted.loadUserById.mockResolvedValue(null);
    await expect(
      openDealerThread(fdFromObject({ dealerId: "ghost" })),
    ).rejects.toThrow(/Dealer not found/);
    expect(hoisted.openOrCreateThread).not.toHaveBeenCalled();
  });
});

describe("openSellerThread", () => {
  beforeEach(() => {
    hoisted.requireUser.mockReset();
    hoisted.loadUserById.mockReset();
    hoisted.openOrCreateThread.mockReset();
    hoisted.redirect.mockReset();
    hoisted.redirect.mockImplementation((_path: string) => {
      throw new Error("__redirect__");
    });
  });

  test("throws when the target user isn't a seller", async () => {
    hoisted.requireUser.mockResolvedValue(buyer());
    hoisted.loadUserById.mockResolvedValue(
      makeFixtureUser({ id: "seller_1", role: "dealer" }),
    );
    await expect(
      openSellerThread(fdFromObject({ sellerId: "seller_1" })),
    ).rejects.toThrow(/Seller not found/);
    expect(hoisted.openOrCreateThread).not.toHaveBeenCalled();
  });

  test("happy path opens a buyer-seller thread and redirects", async () => {
    hoisted.requireUser.mockResolvedValue(buyer());
    hoisted.loadUserById.mockResolvedValue(seller());
    hoisted.openOrCreateThread.mockResolvedValue({
      id: "t_abc",
      participants: ["buyer_1", "seller_1"],
      kind: "buyer-seller",
      lastMessageAt: new Date().toISOString(),
    });

    await expect(
      openSellerThread(fdFromObject({ sellerId: "seller_1", listingId: "l1" })),
    ).rejects.toThrow(/__redirect__/);

    expect(hoisted.openOrCreateThread).toHaveBeenCalledWith({
      kind: "buyer-seller",
      participants: ["buyer_1", "seller_1"],
      listingId: "l1",
    });
    expect(hoisted.redirect).toHaveBeenCalledWith("/inbox/t_abc");
  });
});
