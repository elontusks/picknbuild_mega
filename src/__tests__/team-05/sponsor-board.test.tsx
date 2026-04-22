// @vitest-environment jsdom
import { describe, expect, test, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { SponsorBoard } from "@/components/compare/sponsor-board";

beforeEach(() => {
  vi.restoreAllMocks();
});

describe("SponsorBoard", () => {
  test("renders nothing when the sponsor catalog returns no blocks", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ sponsors: [] }), { status: 200 }),
    );
    const { container } = render(<SponsorBoard path="dealer" />);
    await waitFor(() => {
      // Fetch has run; still no DOM output.
      expect(container.firstChild).toBeNull();
    });
  });

  test("renders one block per sponsor when the catalog has entries", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          sponsors: [
            { id: "s1", path: "dealer", title: "Sponsor A", bodyHtml: "<p>hi</p>" },
            {
              id: "s2",
              path: "dealer",
              title: "Sponsor B",
              bodyHtml: "<p>hello</p>",
              cta: { label: "Learn more", href: "https://example.com" },
            },
          ],
        }),
        { status: 200 },
      ),
    );
    render(<SponsorBoard path="dealer" />);
    await waitFor(() => {
      expect(screen.getByTestId("sponsor-block-s1")).toBeTruthy();
    });
    expect(screen.getByTestId("sponsor-block-s2")).toBeTruthy();
    expect(screen.getByTestId("sponsor-cta-s2").getAttribute("href")).toBe(
      "https://example.com",
    );
  });

  test("initial sponsors prop skips the fetch", () => {
    const spy = vi.spyOn(globalThis, "fetch");
    render(
      <SponsorBoard
        path="picknbuild"
        initial={[
          {
            id: "x",
            path: "picknbuild",
            title: "Local seed",
            bodyHtml: "<p>seeded</p>",
          },
        ]}
      />,
    );
    expect(screen.getByTestId("sponsor-block-x")).toBeTruthy();
    expect(spy).not.toHaveBeenCalled();
  });
});
