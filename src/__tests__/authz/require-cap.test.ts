import { beforeEach, describe, expect, test, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("@/lib/authz/server/principal-loader", () => ({
  loadPrincipal: vi.fn(),
}));
vi.mock("@/lib/authz/server/audit", () => ({
  auditDenial: vi.fn(async () => {}),
}));

import { requireCap } from "@/lib/authz/server/require-cap";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import { loadPrincipal } from "@/lib/authz/server/principal-loader";
import { auditDenial } from "@/lib/authz/server/audit";
import type { Principal, Resource } from "@/lib/authz/types";

const buyer: Principal = {
  id: "u-buyer",
  roles: ["buyer"],
  email_verified: true,
  phone_verified: true,
  account_status: "active",
};
const dealer: Principal = {
  id: "u-dealer",
  roles: ["dealer"],
  email_verified: true,
  phone_verified: true,
  account_status: "active",
  dealer: { page_id: "dp-1", page_claimed: true, subscription_active: true },
};

const mockLoad = vi.mocked(loadPrincipal);
const mockAudit = vi.mocked(auditDenial);

function makeReq(path: string, method = "POST") {
  return new NextRequest(`http://localhost${path}`, { method });
}

beforeEach(() => {
  mockLoad.mockReset();
  mockAudit.mockReset();
  mockAudit.mockResolvedValue(undefined);
});

describe("requireCap", () => {
  test("401 for anonymous principal on protected cap", async () => {
    mockLoad.mockResolvedValue(null);
    const handler = vi.fn();
    const route = requireCap(C.listings.create)(handler);
    const res = await route(makeReq("/api/listings"), {});

    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Not signed in." });
    expect(handler).not.toHaveBeenCalled();
    expect(mockAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        principal_id: null,
        capability: "listings.create",
        reason: "Not signed in.",
        request_path: "/api/listings",
      }),
    );
  });

  test("403 when principal lacks the capability", async () => {
    mockLoad.mockResolvedValue(buyer);
    const handler = vi.fn();
    const route = requireCap(C.listings.create)(handler);
    const res = await route(makeReq("/api/listings"), {});

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: "Missing capability: listings.create.",
    });
    expect(handler).not.toHaveBeenCalled();
    expect(mockAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        principal_id: "u-buyer",
        capability: "listings.create",
        reason: "Missing capability: listings.create.",
      }),
    );
  });

  test("200 and calls the wrapped handler when allowed", async () => {
    mockLoad.mockResolvedValue(dealer);
    const handler = vi.fn(async (_req, _ctx, principal: Principal) => {
      return Response.json({ ok: true, userId: principal.id });
    });
    const route = requireCap(C.listings.create)(handler);
    const req = makeReq("/api/listings");
    const ctx = { foo: "bar" };
    const res = await route(req, ctx);

    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, userId: "u-dealer" });
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler).toHaveBeenCalledWith(req, ctx, dealer);
    expect(mockAudit).not.toHaveBeenCalled();
  });

  test("403 when ownership resolver returns a resource the principal does not own", async () => {
    mockLoad.mockResolvedValue(dealer);
    const handler = vi.fn();
    const getResource = vi.fn(
      async (): Promise<Resource> => ({
        type: "listing",
        id: "l-2",
        owner_id: "someone-else",
        dealer_page_id: "dp-999",
      }),
    );
    const route = requireCap(C.listings.delete_own, getResource)(handler);
    const res = await route(makeReq("/api/listings/l-2", "DELETE"), {});

    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({
      error: "You do not own this resource.",
    });
    expect(getResource).toHaveBeenCalledTimes(1);
    expect(handler).not.toHaveBeenCalled();
    expect(mockAudit).toHaveBeenCalledWith(
      expect.objectContaining({
        principal_id: "u-dealer",
        capability: "listings.delete.own",
        resource_type: "listing",
        resource_id: "l-2",
      }),
    );
  });

  test("200 when the ownership resolver returns a resource the principal owns", async () => {
    mockLoad.mockResolvedValue(dealer);
    const handler = vi.fn(async () => Response.json({ ok: true }));
    const getResource = vi.fn(
      async (): Promise<Resource> => ({
        type: "listing",
        id: "l-1",
        owner_id: null,
        dealer_page_id: "dp-1",
      }),
    );
    const route = requireCap(C.listings.delete_own, getResource)(handler);
    const res = await route(makeReq("/api/listings/l-1", "DELETE"), {});

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(mockAudit).not.toHaveBeenCalled();
  });

  test("passes the Next.js ctx arg through to the handler and resolver", async () => {
    mockLoad.mockResolvedValue(dealer);
    const handler = vi.fn(async () => new Response(null));
    const getResource = vi.fn(async () => undefined);
    const route = requireCap<{ params: Promise<{ id: string }> }>(
      C.listings.view,
      getResource,
    )(handler);
    const req = makeReq("/api/listings/x", "GET");
    const ctx = { params: Promise.resolve({ id: "x" }) };

    await route(req, ctx);

    expect(getResource).toHaveBeenCalledWith(req, ctx);
    expect(handler).toHaveBeenCalledWith(req, ctx, dealer);
  });
});
