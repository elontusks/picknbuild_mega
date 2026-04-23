// @vitest-environment jsdom
import { beforeEach, describe, expect, test, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";

const hoisted = vi.hoisted(() => ({
  signAgreement: vi.fn(),
}));

vi.mock("@/app/checkout/actions", () => ({
  signAgreement: (...a: unknown[]) => hoisted.signAgreement(...a),
}));

import { AgreementForm } from "@/components/checkout/agreement-form";

const renderForm = (onSigned = vi.fn()) =>
  render(
    <AgreementForm
      buildRecordId="b_1"
      specSummary="Spec: 2020 Honda Accord"
      onSigned={onSigned}
    />,
  );

beforeEach(() => {
  hoisted.signAgreement.mockReset();
});

describe("AgreementForm", () => {
  test("renders insurance-required + non-refundable notices", () => {
    renderForm();
    expect(screen.getByTestId("insurance-required-notice")).toBeTruthy();
    expect(screen.getByTestId("non-refundable-notice")).toBeTruthy();
  });

  test("submit button stays disabled until both acks + signature are captured", () => {
    renderForm();
    const submit = screen.getByTestId("agreement-submit") as HTMLButtonElement;
    expect(submit.disabled).toBe(true);

    fireEvent.click(screen.getByTestId("ack-insurance"));
    expect(submit.disabled).toBe(true);
    fireEvent.click(screen.getByTestId("ack-non-refundable"));
    expect(submit.disabled).toBe(true);
    fireEvent.change(screen.getByTestId("signature-input"), {
      target: { value: "Jane Buyer" },
    });
    expect(submit.disabled).toBe(false);
  });

  test("rejects when only one acknowledgement is checked", async () => {
    renderForm();
    fireEvent.click(screen.getByTestId("ack-insurance"));
    // Only insurance is on; non-refundable stays unchecked. The signature
    // input isn't populated either — the form should surface an error before
    // calling the server action.
    fireEvent.submit(screen.getByTestId("agreement-form"));
    await waitFor(() => {
      expect(screen.getByTestId("agreement-error")).toBeTruthy();
    });
    expect(hoisted.signAgreement).not.toHaveBeenCalled();
  });

  test("submits both acks + signature to signAgreement and reports agreementId back", async () => {
    const onSigned = vi.fn();
    hoisted.signAgreement.mockResolvedValue({ ok: true, agreementId: "a_9" });
    renderForm(onSigned);

    fireEvent.click(screen.getByTestId("ack-insurance"));
    fireEvent.click(screen.getByTestId("ack-non-refundable"));
    fireEvent.change(screen.getByTestId("signature-input"), {
      target: { value: "Jane Buyer" },
    });
    fireEvent.submit(screen.getByTestId("agreement-form"));

    await waitFor(() => {
      expect(hoisted.signAgreement).toHaveBeenCalled();
    });
    const arg = hoisted.signAgreement.mock.calls.at(-1)?.[0];
    expect(arg).toMatchObject({
      buildRecordId: "b_1",
      insuranceAcknowledged: true,
      nonRefundableAcknowledged: true,
    });
    // The form must NOT forward pricing-influencing fields — signAgreement
    // now re-derives them on the server from the persisted BuildRecord.
    expect(arg.selectedPackage).toBeUndefined();
    expect(arg.term).toBeUndefined();
    expect(arg.titleStatus).toBeUndefined();
    expect(typeof arg.signatureImage).toBe("string");
    expect(arg.signatureImage.length).toBeGreaterThan(0);
    await waitFor(() => {
      expect(onSigned).toHaveBeenCalledWith("a_9");
    });
  });
});
