// @vitest-environment jsdom
import { describe, expect, test } from "vitest";
import { render, screen } from "@testing-library/react";
import { WireInstructionsDisplay } from "@/components/dashboard/wire-instructions-display";
import { getDisclaimer } from "@/lib/legal/disclaimers";

describe("WireInstructionsDisplay", () => {
  test("renders the wire strings from getWireInstructions and the legal disclaimer copy", () => {
    render(
      <WireInstructionsDisplay
        wire={{
          routingNumber: "123456789",
          accountNumber: "000111222",
          beneficiary: "PicknBuild Escrow LLC",
          bankName: "First National",
          reference: "deal_abc123",
        }}
      />,
    );
    expect(screen.getByTestId("wire-beneficiary").textContent).toBe(
      "PicknBuild Escrow LLC",
    );
    expect(screen.getByTestId("wire-bank").textContent).toBe("First National");
    expect(screen.getByTestId("wire-routing").textContent).toBe("123456789");
    expect(screen.getByTestId("wire-account").textContent).toBe("000111222");
    expect(screen.getByTestId("wire-reference").textContent).toBe(
      "deal_abc123",
    );
    // "Confirm by phone" disclaimer must be present per Legal Disclaimer Library.
    expect(
      screen.getByText(getDisclaimer("wire-instructions")),
    ).toBeTruthy();
  });
});
