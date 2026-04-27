// @vitest-environment jsdom
import { describe, expect, test, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import AuctionDIYColumn from "@/components/clarity/columns/AuctionDIYColumn";
import DealerColumn from "@/components/clarity/columns/DealerColumn";
import IndividualColumn from "@/components/clarity/columns/IndividualColumn";
import type { UserProfile } from "@/lib/search-demo/types";

// next/navigation isn't used by these columns, but PickNBuildColumn pulls it
// in transitively via shared utils — stub defensively.
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn() }),
}));

beforeEach(() => {
  vi.restoreAllMocks();
});

const profile: UserProfile = {
  availableCash: 8000,
  creditScore: 700,
  matchModeEnabled: false,
};

const stubFetch = (impl: (url: string) => Response | Promise<Response>) => {
  vi.spyOn(globalThis, "fetch").mockImplementation((input: RequestInfo | URL) =>
    Promise.resolve(impl(typeof input === "string" ? input : String(input))),
  );
};

describe("AuctionDIYColumn empty state", () => {
  test("auto-fires onRequestLiveScrape once when filters carry a make", async () => {
    const onRequestLiveScrape = vi.fn();
    render(
      <AuctionDIYColumn
        cars={[]}
        onPick={vi.fn()}
        onSelect={vi.fn()}
        userProfile={profile}
        intakeFilters={{ make: "Honda", model: "", year: "", mileageBucket: "", trim: "" }}
        liveScrapeState="idle"
        onRequestLiveScrape={onRequestLiveScrape}
      />,
    );
    await waitFor(() => expect(onRequestLiveScrape).toHaveBeenCalledTimes(1));
    expect(screen.getByTestId("auction-empty")).toBeTruthy();
  });

  test("does not auto-fire when neither make nor model is set", async () => {
    const onRequestLiveScrape = vi.fn();
    render(
      <AuctionDIYColumn
        cars={[]}
        onPick={vi.fn()}
        onSelect={vi.fn()}
        userProfile={profile}
        intakeFilters={{ make: "", model: "", year: "", mileageBucket: "", trim: "" }}
        liveScrapeState="idle"
        onRequestLiveScrape={onRequestLiveScrape}
      />,
    );
    // give the effect a tick
    await new Promise((r) => setTimeout(r, 0));
    expect(onRequestLiveScrape).not.toHaveBeenCalled();
    // Status copy should hint that adding a make/model unlocks live scrape.
    expect(screen.getByTestId("auction-empty-status").textContent).toMatch(/make.+model/i);
  });

  test("pending state shows the 'searching' copy", () => {
    render(
      <AuctionDIYColumn
        cars={[]}
        onPick={vi.fn()}
        onSelect={vi.fn()}
        userProfile={profile}
        intakeFilters={{ make: "Toyota", model: "", year: "", mileageBucket: "", trim: "" }}
        liveScrapeState="pending"
      />,
    );
    expect(screen.getByTestId("auction-empty-status").textContent).toMatch(/Searching/i);
  });

  test("unavailable state shows offline copy and a retry button", () => {
    const onRequestLiveScrape = vi.fn();
    render(
      <AuctionDIYColumn
        cars={[]}
        onPick={vi.fn()}
        onSelect={vi.fn()}
        userProfile={profile}
        intakeFilters={{ make: "Toyota", model: "", year: "", mileageBucket: "", trim: "" }}
        liveScrapeState="unavailable"
        onRequestLiveScrape={onRequestLiveScrape}
      />,
    );
    expect(screen.getByTestId("auction-empty-status").textContent).toMatch(/offline/i);
    fireEvent.click(screen.getByTestId("auction-live-scrape-button"));
    expect(onRequestLiveScrape).toHaveBeenCalledTimes(1);
  });

  test("paste-a-link success calls onCarParsed and clears the field", async () => {
    const onCarParsed = vi.fn();
    stubFetch(() =>
      new Response(
        JSON.stringify({
          listing: {
            id: "L1",
            source: "copart",
            sourceUrl: "https://copart.com/lot/12345",
            year: 2018,
            make: "Honda",
            model: "Civic",
            titleStatus: "clean",
            photos: [],
            sourceUpdatedAt: new Date().toISOString(),
            lastRefreshedAt: new Date().toISOString(),
            status: "active",
          },
        }),
        { status: 201 },
      ),
    );
    render(
      <AuctionDIYColumn
        cars={[]}
        onPick={vi.fn()}
        onSelect={vi.fn()}
        onCarParsed={onCarParsed}
        userProfile={profile}
        intakeFilters={{ make: "", model: "", year: "", mileageBucket: "", trim: "" }}
        liveScrapeState="idle"
      />,
    );
    const input = screen.getByPlaceholderText(/Copart/) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "https://copart.com/lot/12345" } });
    fireEvent.click(screen.getByText("Parse Listing"));
    await waitFor(() => expect(onCarParsed).toHaveBeenCalledTimes(1));
    expect(onCarParsed.mock.calls[0]![0].path).toBe("auction");
    expect(input.value).toBe("");
  });

  test("paste-a-link failure surfaces the service reason", async () => {
    stubFetch(() =>
      new Response(JSON.stringify({ error: "We don't recognize that domain yet." }), {
        status: 400,
      }),
    );
    render(
      <AuctionDIYColumn
        cars={[]}
        onPick={vi.fn()}
        onSelect={vi.fn()}
        userProfile={profile}
        intakeFilters={{ make: "", model: "", year: "", mileageBucket: "", trim: "" }}
        liveScrapeState="idle"
      />,
    );
    fireEvent.change(screen.getByPlaceholderText(/Copart/), {
      target: { value: "https://example.com/whatever" },
    });
    fireEvent.click(screen.getByText("Parse Listing"));
    await waitFor(() =>
      expect(screen.getByRole("alert").textContent).toMatch(/don.t recognize/i),
    );
  });
});

describe("DealerColumn empty state", () => {
  test("renders the paste-a-link block", () => {
    render(
      <DealerColumn
        cars={[]}
        onPick={vi.fn()}
        onSelect={vi.fn()}
        userProfile={profile}
      />,
    );
    expect(screen.getByTestId("dealer-empty")).toBeTruthy();
    expect(screen.getByPlaceholderText(/Paste dealer link/)).toBeTruthy();
  });

  test("paste-a-link success routes through onCarParsed", async () => {
    const onCarParsed = vi.fn();
    stubFetch(() =>
      new Response(
        JSON.stringify({
          listing: {
            id: "L2",
            source: "dealer",
            sourceUrl: "https://dealer.example/v/1",
            year: 2019,
            make: "Honda",
            model: "Accord",
            titleStatus: "clean",
            photos: [],
            sourceUpdatedAt: new Date().toISOString(),
            lastRefreshedAt: new Date().toISOString(),
            status: "active",
          },
        }),
        { status: 201 },
      ),
    );
    render(
      <DealerColumn
        cars={[]}
        onPick={vi.fn()}
        onSelect={vi.fn()}
        onCarParsed={onCarParsed}
        userProfile={profile}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText(/Paste dealer link/), {
      target: { value: "https://dealer.example/v/1" },
    });
    fireEvent.click(screen.getByText("Parse Listing"));
    await waitFor(() => expect(onCarParsed).toHaveBeenCalledTimes(1));
    expect(onCarParsed.mock.calls[0]![0].path).toBe("dealer");
  });
});

describe("IndividualColumn empty state", () => {
  test("renders the paste-a-link block", () => {
    render(
      <IndividualColumn
        cars={[]}
        onPick={vi.fn()}
        onSelect={vi.fn()}
        userProfile={profile}
      />,
    );
    expect(screen.getByTestId("individual-empty")).toBeTruthy();
    expect(screen.getByPlaceholderText(/Paste private seller link/)).toBeTruthy();
  });

  test("paste-a-link success routes through onCarParsed", async () => {
    const onCarParsed = vi.fn();
    stubFetch(() =>
      new Response(
        JSON.stringify({
          listing: {
            id: "L3",
            source: "craigslist",
            sourceUrl: "https://craigslist.org/foo",
            year: 2017,
            make: "Toyota",
            model: "Camry",
            titleStatus: "clean",
            photos: [],
            sourceUpdatedAt: new Date().toISOString(),
            lastRefreshedAt: new Date().toISOString(),
            status: "active",
          },
        }),
        { status: 201 },
      ),
    );
    render(
      <IndividualColumn
        cars={[]}
        onPick={vi.fn()}
        onSelect={vi.fn()}
        onCarParsed={onCarParsed}
        userProfile={profile}
      />,
    );
    fireEvent.change(screen.getByPlaceholderText(/Paste private seller link/), {
      target: { value: "https://craigslist.org/foo" },
    });
    fireEvent.click(screen.getByText("Parse Listing"));
    await waitFor(() => expect(onCarParsed).toHaveBeenCalledTimes(1));
    expect(onCarParsed.mock.calls[0]![0].path).toBe("individual");
  });
});
