import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

const insertMock = vi.fn();
const fromMock = vi.fn(() => ({ insert: insertMock }));

vi.mock("@/lib/supabase/admin", () => ({
  createAdminClient: () => ({ from: fromMock }),
}));

import { auditDenial } from "@/lib/authz/server/audit";

beforeEach(() => {
  insertMock.mockReset();
  fromMock.mockClear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

describe("auditDenial", () => {
  test("writes a denial row to authz_denials", async () => {
    insertMock.mockResolvedValue({ error: null });

    await auditDenial({
      principal_id: "u1",
      capability: "listings.create",
      resource_type: "listing",
      resource_id: "l1",
      reason: "Phone must be verified.",
      request_path: "/api/listings",
    });

    expect(fromMock).toHaveBeenCalledWith("authz_denials");
    expect(insertMock).toHaveBeenCalledWith({
      principal_id: "u1",
      capability: "listings.create",
      resource_type: "listing",
      resource_id: "l1",
      reason: "Phone must be verified.",
      request_path: "/api/listings",
    });
  });

  test("logs and swallows a returned insert error", async () => {
    insertMock.mockResolvedValue({ error: { message: "boom" } });
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      auditDenial({
        principal_id: null,
        capability: "x",
        resource_type: null,
        resource_id: null,
        reason: "",
        request_path: null,
      }),
    ).resolves.toBeUndefined();

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });

  test("swallows a thrown client error", async () => {
    insertMock.mockRejectedValue(new Error("network down"));
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});

    await expect(
      auditDenial({
        principal_id: null,
        capability: "x",
        resource_type: null,
        resource_id: null,
        reason: "",
        request_path: null,
      }),
    ).resolves.toBeUndefined();

    expect(spy).toHaveBeenCalled();
    spy.mockRestore();
  });
});
