"use client";

import { useState } from "react";
import { LEAD_UNLOCK_AMOUNT_USD } from "@/lib/payments/amounts";
import { PaymentProcessingInterface } from "./payment-processing-interface";

type Props = {
  leadId: string;
  onUnlocked?: (paymentId: string) => void;
};

export function LeadUnlockPurchaseInterface({ leadId, onUnlocked }: Props) {
  const [unlockedId, setUnlockedId] = useState<string | null>(null);

  const submit = async (paymentMethodId: string) => {
    const res = await fetch("/api/payments/lead-unlock", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ leadId, paymentMethodId }),
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { error?: string };
      throw new Error(err.error ?? `Unlock failed (${res.status})`);
    }
    const { record } = (await res.json()) as {
      record: { id: string };
    };
    setUnlockedId(record.id);
    onUnlocked?.(record.id);
  };

  if (unlockedId) {
    return (
      <p
        data-testid="lead-unlock-success"
        className="text-sm text-emerald-700 dark:text-emerald-400"
      >
        Lead unlocked. Contact details are now visible.
      </p>
    );
  }

  return (
    <div data-testid="lead-unlock" data-lead-id={leadId}>
      <PaymentProcessingInterface
        amount={LEAD_UNLOCK_AMOUNT_USD}
        label={`Unlock lead ${leadId}`}
        onSubmit={submit}
      />
    </div>
  );
}
