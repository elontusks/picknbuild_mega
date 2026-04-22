// @vitest-environment jsdom
import { act, fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, test, vi } from "vitest";
import { PaymentProcessingInterface } from "@/components/payments/payment-processing-interface";

describe("PaymentProcessingInterface", () => {
  test("submits the entered payment method id and shows processing state", async () => {
    const onSubmit = vi
      .fn<(pm: string) => Promise<void>>()
      .mockResolvedValue(undefined);
    render(
      <PaymentProcessingInterface
        amount={1000}
        label="Pay deposit"
        onSubmit={onSubmit}
      />,
    );
    const input = screen.getByTestId(
      "payment-method-input",
    ) as HTMLInputElement;
    fireEvent.change(input, { target: { value: "pm_card_visa" } });

    await act(async () => {
      fireEvent.click(screen.getByTestId("payment-submit"));
      // flush microtasks
      await Promise.resolve();
    });

    expect(onSubmit).toHaveBeenCalledWith("pm_card_visa");
  });

  test("shows the error returned by onSubmit", async () => {
    const onSubmit = vi
      .fn<(pm: string) => Promise<void>>()
      .mockRejectedValue(new Error("card declined"));
    render(
      <PaymentProcessingInterface
        amount={15}
        label="Unlock lead"
        onSubmit={onSubmit}
      />,
    );
    await act(async () => {
      fireEvent.click(screen.getByTestId("payment-submit"));
      await Promise.resolve();
    });
    expect(screen.getByTestId("payment-error").textContent).toBe("card declined");
  });

  test("blocks empty input with a validation message", async () => {
    const onSubmit = vi.fn();
    render(
      <PaymentProcessingInterface
        amount={5}
        label="Extra listing"
        onSubmit={onSubmit}
      />,
    );
    fireEvent.change(screen.getByTestId("payment-method-input"), {
      target: { value: "" },
    });
    await act(async () => {
      fireEvent.click(screen.getByTestId("payment-submit"));
      await Promise.resolve();
    });
    expect(onSubmit).not.toHaveBeenCalled();
    expect(screen.getByTestId("payment-error").textContent).toMatch(
      /payment method/i,
    );
  });
});
