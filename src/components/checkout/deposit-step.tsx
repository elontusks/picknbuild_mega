"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { PaymentProcessingInterface } from "@/components/payments/payment-processing-interface";
import { submitDeposit } from "@/app/checkout/actions";

type Props = {
  buildRecordId: string;
  agreementId: string;
  amount: number;
};

export function DepositStep({ buildRecordId, agreementId, amount }: Props) {
  const router = useRouter();
  const [result, setResult] = useState<
    | { kind: "idle" }
    | { kind: "success"; paymentId: string }
    | { kind: "error"; message: string }
  >({ kind: "idle" });

  const onSubmit = async () => {
    setResult({ kind: "idle" });
    const r = await submitDeposit({
      buildRecordId,
      agreementId,
    });
    if (!r.ok) {
      setResult({ kind: "error", message: r.error });
      // Re-throw so PaymentProcessingInterface shows its own error state too.
      throw new Error(r.error);
    }
    setResult({ kind: "success", paymentId: r.paymentId });
    // Team 14 auto-dispatches to Team 12's onDepositReceived on success, so
    // the DealRecord is already in flight. Hand off to Team 10's dashboard.
    router.push(`/dashboard?deposit=${encodeURIComponent(r.paymentId)}`);
  };

  return (
    <section
      data-testid="deposit-step"
      className="space-y-3 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Deposit</h2>
        <p className="text-xs text-zinc-500">
          Your $1,000 deposit locks the build. Non-refundable once charged.
        </p>
      </header>

      <PaymentProcessingInterface
        amount={amount}
        label="picknbuild deposit"
        onSubmit={() => onSubmit()}
      />

      {result.kind === "success" ? (
        <p data-testid="deposit-success" className="text-xs text-emerald-600">
          Deposit submitted — payment id {result.paymentId}. Redirecting to your
          dashboard…
        </p>
      ) : null}
      {result.kind === "error" ? (
        <p data-testid="deposit-error" className="text-xs text-red-600">
          {result.message}
        </p>
      ) : null}
    </section>
  );
}
