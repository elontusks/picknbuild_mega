// @vitest-environment jsdom
import { describe, expect, test } from "vitest";
import { act, fireEvent, render, screen } from "@testing-library/react";
import type { IntakeState } from "@/contracts";
import { makeFixtureUser } from "@/contracts";
import { IntakeProvider, useIntakeState } from "@/lib/intake";
import { ChooseYourTerm } from "@/components/decision/choose-your-term";

const memoryPersistence = () => {
  const store = new Map<string, IntakeState>();
  return {
    load: (id: string) => store.get(id) ?? null,
    save: (id: string, s: IntakeState) => {
      store.set(id, s);
    },
  };
};

function TermWatcher() {
  const state = useIntakeState();
  return <span data-testid="term-readout">{state.selectedTerm ?? "undef"}</span>;
}

describe("ChooseYourTerm", () => {
  test("defaults the active radio to 3y when IntakeState.selectedTerm is undefined", () => {
    const user = makeFixtureUser();
    render(
      <IntakeProvider user={user} persistence={memoryPersistence()}>
        <ChooseYourTerm />
        <TermWatcher />
      </IntakeProvider>,
    );
    expect(
      screen.getByTestId("term-3y").getAttribute("aria-checked"),
    ).toBe("true");
    expect(screen.getByTestId("term-readout").textContent).toBe("undef");
  });

  test("clicking a term writes it to IntakeState", () => {
    const user = makeFixtureUser();
    render(
      <IntakeProvider user={user} persistence={memoryPersistence()}>
        <ChooseYourTerm />
        <TermWatcher />
      </IntakeProvider>,
    );
    act(() => {
      fireEvent.click(screen.getByTestId("term-5y"));
    });
    expect(screen.getByTestId("term-readout").textContent).toBe("5y");
    expect(
      screen.getByTestId("term-5y").getAttribute("aria-checked"),
    ).toBe("true");
  });

  test("disabled prop freezes all buttons", () => {
    const user = makeFixtureUser();
    render(
      <IntakeProvider user={user} persistence={memoryPersistence()}>
        <ChooseYourTerm enabled={false} />
        <TermWatcher />
      </IntakeProvider>,
    );
    const button = screen.getByTestId("term-5y") as HTMLButtonElement;
    expect(button.disabled).toBe(true);
  });

  test("cash term selection is honored (for cash-term picknbuild)", () => {
    const user = makeFixtureUser();
    render(
      <IntakeProvider user={user} persistence={memoryPersistence()}>
        <ChooseYourTerm />
        <TermWatcher />
      </IntakeProvider>,
    );
    act(() => {
      fireEvent.click(screen.getByTestId("term-cash"));
    });
    expect(screen.getByTestId("term-readout").textContent).toBe("cash");
  });
});
