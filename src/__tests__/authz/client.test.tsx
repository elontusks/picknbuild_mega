// @vitest-environment jsdom
import { render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import { AuthProvider, useAuth } from "@/lib/authz/client/context";
import { Gate } from "@/lib/authz/client/gate";
import { useCan } from "@/lib/authz/client/use-can";
import { CAPABILITIES as C } from "@/lib/authz/capabilities";
import type { Principal } from "@/lib/authz/types";

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

function mockMe(principal: Principal | null, ok = principal !== null) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok,
      status: ok ? 200 : 401,
      json: async () => ({ principal }),
    })),
  );
}

beforeEach(() => vi.clearAllMocks());
afterEach(() => vi.unstubAllGlobals());

describe("AuthProvider + useAuth", () => {
  test("hydrates principal from /api/auth/me", async () => {
    mockMe(buyer);
    function Probe() {
      const { principal, loading } = useAuth();
      if (loading) return <span>loading</span>;
      return <span data-testid="id">{principal?.id ?? "anon"}</span>;
    }
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    expect(screen.getByText("loading")).toBeTruthy();
    await waitFor(() =>
      expect(screen.getByTestId("id").textContent).toBe("u-buyer"),
    );
    expect(fetch).toHaveBeenCalledWith(
      "/api/auth/me",
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  test("sets principal to null when /me is 401", async () => {
    mockMe(null, false);
    function Probe() {
      const { principal, loading } = useAuth();
      if (loading) return <span>loading</span>;
      return <span data-testid="id">{principal?.id ?? "anon"}</span>;
    }
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("id").textContent).toBe("anon"),
    );
  });

  test("useAuth throws outside provider", () => {
    function Probe() {
      useAuth();
      return null;
    }
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(() => render(<Probe />)).toThrow(/AuthProvider/);
    spy.mockRestore();
  });
});

describe("useCan", () => {
  test("matches engine for buyer (listings.create denied)", async () => {
    mockMe(buyer);
    function Probe() {
      const d = useCan(C.listings.create);
      return <span data-testid="allowed">{String(d.allowed)}</span>;
    }
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("allowed").textContent).toBe("false"),
    );
  });

  test("matches engine for dealer (listings.create allowed)", async () => {
    mockMe(dealer);
    function Probe() {
      const d = useCan(C.listings.create);
      return <span data-testid="allowed">{String(d.allowed)}</span>;
    }
    render(
      <AuthProvider>
        <Probe />
      </AuthProvider>,
    );
    await waitFor(() =>
      expect(screen.getByTestId("allowed").textContent).toBe("true"),
    );
  });
});

describe("<Gate>", () => {
  test("renders children when allowed", async () => {
    mockMe(dealer);
    render(
      <AuthProvider>
        <Gate cap={C.listings.create} fallback={<span>denied</span>}>
          <span>allowed</span>
        </Gate>
      </AuthProvider>,
    );
    expect(await screen.findByText("allowed")).toBeTruthy();
  });

  test("renders fallback when role denies", async () => {
    mockMe(buyer);
    render(
      <AuthProvider>
        <Gate cap={C.listings.create} fallback={<span>denied</span>}>
          <span>allowed</span>
        </Gate>
      </AuthProvider>,
    );
    // After hydration, principal is buyer; buyer has no listings.create grant.
    await waitFor(() => {
      expect(fetch).toHaveBeenCalled();
      expect(screen.queryByText("allowed")).toBeNull();
    });
    expect(screen.getByText("denied")).toBeTruthy();
  });

  test("renders fallback for anonymous on protected cap", async () => {
    mockMe(null, false);
    render(
      <AuthProvider>
        <Gate cap={C.listings.create} fallback={<span>denied</span>}>
          <span>allowed</span>
        </Gate>
      </AuthProvider>,
    );
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.getByText("denied")).toBeTruthy();
  });

  test("public capability allows anonymous", async () => {
    mockMe(null, false);
    render(
      <AuthProvider>
        <Gate cap={C.reality_check.preview} fallback={<span>denied</span>}>
          <span>allowed</span>
        </Gate>
      </AuthProvider>,
    );
    expect(await screen.findByText("allowed")).toBeTruthy();
  });

  test("renders nothing (no fallback) when denied", async () => {
    mockMe(buyer);
    const { container } = render(
      <AuthProvider>
        <Gate cap={C.listings.create}>
          <span>allowed</span>
        </Gate>
      </AuthProvider>,
    );
    await waitFor(() => expect(fetch).toHaveBeenCalled());
    expect(screen.queryByText("allowed")).toBeNull();
    expect(container.textContent).toBe("");
  });
});
