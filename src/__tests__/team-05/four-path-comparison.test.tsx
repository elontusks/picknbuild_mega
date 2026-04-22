// @vitest-environment jsdom
import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import {
  makeFixtureIntakeState,
  makeFixtureListingObject,
  makeFixturePathQuote,
} from "@/contracts";
import { FourPathComparisonDisplay } from "@/components/compare/four-path-comparison";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

const fourQuotes = () => [
  makeFixturePathQuote({ path: "dealer", total: 26000, monthly: 520, apr: 0.195, term: "5y" }),
  makeFixturePathQuote({ path: "auction", total: 13000 }),
  makeFixturePathQuote({ path: "picknbuild", total: 22000, biweekly: 185, term: "3y" }),
  makeFixturePathQuote({ path: "private", total: 12000 }),
];

// The compare container mounts four SponsorBoards, each of which fires a
// fetch against /api/sponsors/<path>. In jsdom those relative URLs fail the
// undici URL parser and surface as unhandled rejections. Stub the sponsor
// endpoint across every test so the only fetch we actively assert against
// is /api/pricing/quotes.
const sponsorEmpty = () =>
  new Response(JSON.stringify({ sponsors: [] }), { status: 200 });

const stubSponsors = () => {
  vi.spyOn(globalThis, "fetch").mockImplementation(
    (input: RequestInfo | URL) => {
      const url = typeof input === "string" ? input : String(input);
      if (url.startsWith("/api/sponsors/")) return Promise.resolve(sponsorEmpty());
      return Promise.resolve(new Response("{}", { status: 200 }));
    },
  );
};

describe("FourPathComparisonDisplay", () => {
  test("renders all four path cards when quotes are supplied", async () => {
    stubSponsors();
    render(
      <FourPathComparisonDisplay
        listing={makeFixtureListingObject()}
        intake={makeFixtureIntakeState({ creditScore: 720 })}
        userId="u1"
        initialQuotes={fourQuotes()}
      />,
    );
    expect(screen.getByTestId("four-path-comparison")).toBeTruthy();
    expect(screen.getByTestId("path-card-dealer")).toBeTruthy();
    expect(screen.getByTestId("path-card-auction")).toBeTruthy();
    expect(screen.getByTestId("path-card-picknbuild")).toBeTruthy();
    expect(screen.getByTestId("path-card-private")).toBeTruthy();
  });

  test("highlights exactly one best-fit card", () => {
    stubSponsors();
    render(
      <FourPathComparisonDisplay
        listing={makeFixtureListingObject()}
        intake={makeFixtureIntakeState({ creditScore: 720 })}
        userId="u1"
        bestFitPreference="lowestTotal"
        initialQuotes={fourQuotes()}
      />,
    );
    // Lowest total among [26000, 13000, 22000, 12000] is private.
    const priv = screen.getByTestId("path-card-private");
    expect(priv.getAttribute("data-best-fit")).toBe("true");
    const dealer = screen.getByTestId("path-card-dealer");
    expect(dealer.getAttribute("data-best-fit")).toBe("false");
  });

  test("renders 'filtered out' state when listing's title fails the title preference", () => {
    render(
      <FourPathComparisonDisplay
        listing={makeFixtureListingObject({ titleStatus: "rebuilt" })}
        intake={makeFixtureIntakeState({ titlePreference: "clean" })}
        userId="u1"
        initialQuotes={fourQuotes()}
      />,
    );
    expect(screen.getByTestId("four-path-filtered-out")).toBeTruthy();
    expect(screen.queryByTestId("path-card-dealer")).toBeNull();
  });

  test("fetches quotes via /api/pricing/quotes when no initialQuotes are provided", async () => {
    const fetchSpy = vi
      .spyOn(globalThis, "fetch")
      .mockImplementation((input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : String(input);
        if (url.startsWith("/api/pricing/quotes")) {
          return Promise.resolve(
            new Response(JSON.stringify({ quotes: fourQuotes() }), { status: 200 }),
          );
        }
        if (url.startsWith("/api/sponsors/")) return Promise.resolve(sponsorEmpty());
        return Promise.resolve(new Response("{}", { status: 200 }));
      });
    render(
      <FourPathComparisonDisplay
        listing={makeFixtureListingObject()}
        intake={makeFixtureIntakeState()}
        userId="u1"
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId("path-card-dealer")).toBeTruthy();
    });
    expect(fetchSpy).toHaveBeenCalledWith(
      "/api/pricing/quotes",
      expect.objectContaining({ method: "POST" }),
    );
  });

  test("renders an error state when the pricing API rejects", async () => {
    vi.spyOn(globalThis, "fetch").mockImplementation(
      (input: RequestInfo | URL) => {
        const url = typeof input === "string" ? input : String(input);
        if (url.startsWith("/api/pricing/quotes")) {
          return Promise.resolve(
            new Response(JSON.stringify({ error: "boom" }), { status: 500 }),
          );
        }
        if (url.startsWith("/api/sponsors/")) return Promise.resolve(sponsorEmpty());
        return Promise.resolve(new Response("{}", { status: 200 }));
      },
    );
    render(
      <FourPathComparisonDisplay
        listing={makeFixtureListingObject()}
        intake={makeFixtureIntakeState()}
        userId="u1"
      />,
    );
    await waitFor(() => {
      expect(screen.getByTestId("four-path-error").textContent).toContain("boom");
    });
  });
});
