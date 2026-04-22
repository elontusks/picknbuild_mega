"use client";

import { useState } from "react";
import type { PackageTier, Term, TitleStatus } from "@/contracts";
import { AgreementForm } from "./agreement-form";
import { DepositStep } from "./deposit-step";

type Props = {
  buildRecordId: string;
  specSummary: string;
  selectedPackage: PackageTier;
  term: Term;
  titleStatus: TitleStatus;
  depositAmount: number;
  initialAgreementId?: string;
};

export function CheckoutClient({
  buildRecordId,
  specSummary,
  selectedPackage,
  term,
  titleStatus,
  depositAmount,
  initialAgreementId,
}: Props) {
  const [agreementId, setAgreementId] = useState<string | null>(
    initialAgreementId ?? null,
  );

  return (
    <div
      data-testid="checkout"
      className="mx-auto flex max-w-3xl flex-col gap-6 p-6"
    >
      <header className="space-y-1">
        <h1 className="text-2xl font-semibold">Commit + deposit</h1>
        <p className="text-sm text-zinc-500">
          Sign the agreement, then place your $1,000 deposit to start the
          build.
        </p>
      </header>

      {!agreementId ? (
        <AgreementForm
          buildRecordId={buildRecordId}
          specSummary={specSummary}
          selectedPackage={selectedPackage}
          term={term}
          titleStatus={titleStatus}
          onSigned={(id) => setAgreementId(id)}
        />
      ) : (
        <DepositStep
          buildRecordId={buildRecordId}
          agreementId={agreementId}
          amount={depositAmount}
        />
      )}
    </div>
  );
}
