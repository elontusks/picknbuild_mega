"use client";

import { useState, useTransition } from "react";
import type { PackageTier, Term, TitleStatus } from "@/contracts";
import { Disclaimer } from "@/components/legal/disclaimer";
import { PICKNBUILD_CLAUSES } from "@/lib/agreements/clauses";
import { signAgreement } from "@/app/checkout/actions";
import { SignatureCapture } from "./signature-capture";

type Props = {
  buildRecordId: string;
  specSummary: string;
  selectedPackage: PackageTier;
  term: Term;
  titleStatus: TitleStatus;
  onSigned: (agreementId: string) => void;
};

export function AgreementForm({
  buildRecordId,
  specSummary,
  selectedPackage,
  term,
  titleStatus,
  onSigned,
}: Props) {
  const [insurance, setInsurance] = useState(false);
  const [nonRefundable, setNonRefundable] = useState(false);
  const [signatureImage, setSignatureImage] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const missing: string[] = [];
  if (!insurance) missing.push("insurance");
  if (!nonRefundable) missing.push("non-refundable");
  if (!signatureImage) missing.push("signature");

  const submit = () => {
    setError(null);
    if (!insurance || !nonRefundable) {
      setError("You must acknowledge both notices before signing.");
      return;
    }
    if (!signatureImage) {
      setError("Please sign before continuing.");
      return;
    }
    startTransition(async () => {
      const result = await signAgreement({
        buildRecordId,
        signatureImage,
        insuranceAcknowledged: insurance,
        nonRefundableAcknowledged: nonRefundable,
        term,
        titleStatus,
        selectedPackage,
      });
      if (!result.ok) {
        setError(result.error);
        return;
      }
      onSigned(result.agreementId);
    });
  };

  return (
    <form
      data-testid="agreement-form"
      className="space-y-4 rounded-lg border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
      onSubmit={(e) => {
        e.preventDefault();
        submit();
      }}
    >
      <header className="space-y-1">
        <h2 className="text-lg font-semibold">Agreement</h2>
        <p className="text-xs text-zinc-500">
          Review the spec, acknowledge the notices, and sign to continue to the
          $1,000 deposit.
        </p>
      </header>

      <section className="space-y-1">
        <h3 className="text-sm font-semibold">Spec</h3>
        <pre
          data-testid="agreement-spec"
          className="whitespace-pre-wrap break-words rounded bg-zinc-50 p-3 font-mono text-xs dark:bg-zinc-900"
        >
          {specSummary}
        </pre>
      </section>

      <section className="space-y-3">
        <h3 className="text-sm font-semibold">Clauses</h3>
        <ul className="space-y-2 text-xs">
          {PICKNBUILD_CLAUSES.map((c) => (
            <li
              key={c.id}
              data-testid={`clause-${c.id}`}
              className="rounded border border-zinc-200 p-2 dark:border-zinc-800"
            >
              <strong className="block text-sm">{c.title}</strong>
              <p className="text-zinc-600 dark:text-zinc-400">{c.body}</p>
            </li>
          ))}
        </ul>
      </section>

      <section className="space-y-2 rounded-md border border-amber-300 bg-amber-50 p-3 dark:border-amber-700 dark:bg-amber-950/40">
        <h3
          data-testid="insurance-required-notice"
          className="text-sm font-semibold"
        >
          Insurance required before delivery
        </h3>
        <Disclaimer context="insurance" />
        <label className="flex items-start gap-2 text-xs">
          <input
            data-testid="ack-insurance"
            type="checkbox"
            checked={insurance}
            onChange={(e) => setInsurance(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            I acknowledge that proof of insurance is required prior to delivery.
          </span>
        </label>
      </section>

      <section className="space-y-2 rounded-md border border-rose-300 bg-rose-50 p-3 dark:border-rose-700 dark:bg-rose-950/40">
        <h3
          data-testid="non-refundable-notice"
          className="text-sm font-semibold"
        >
          Non-refundable conditions
        </h3>
        <Disclaimer context="non-refundable" />
        <label className="flex items-start gap-2 text-xs">
          <input
            data-testid="ack-non-refundable"
            type="checkbox"
            checked={nonRefundable}
            onChange={(e) => setNonRefundable(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            I acknowledge that my $1,000 deposit is non-refundable once this
            agreement is signed.
          </span>
        </label>
      </section>

      <section className="space-y-2">
        <h3 className="text-sm font-semibold">Signature</h3>
        <SignatureCapture
          value={signatureImage}
          onChange={setSignatureImage}
        />
      </section>

      {error ? (
        <p data-testid="agreement-error" className="text-xs text-red-600">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        data-testid="agreement-submit"
        disabled={isPending || missing.length > 0}
        className="w-full rounded-md bg-zinc-900 px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
      >
        {isPending ? "Signing…" : "Sign + continue to deposit"}
      </button>
    </form>
  );
}
