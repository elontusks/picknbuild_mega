"use client";

import { useMemo } from "react";
import { useRouter } from "next/navigation";
import type { IntakeState, ListingObject, PathQuote } from "@/contracts";
import { RiskBadge, TitleBadge } from "../badges";
import { PathCardShell } from "./path-card-shell";
import { SelectPathButton } from "./select-path-button";
import { PicknbuildCustomizationToggles } from "../picknbuild-customization-toggles";
import { TradeInFlow } from "../trade-in-flow";
import { AlreadyHaveACarFlow } from "../already-have-a-car-flow";
import { useBuildRecord } from "@/lib/compare/build-record-store";
import { resolveDownPaymentPercentage } from "@/lib/pricing/credit-tier";
import { pctLabel, TERM_LABEL, usd } from "@/lib/compare/formatters";

type Props = {
  listing: ListingObject;
  intake: IntakeState;
  quote: PathQuote;
  isBestFit?: boolean;
  onSelected?: () => void;
};

/**
 * picknbuild path card. Renders credit-tier down-% / all-in total / biweekly.
 * Hosts the compare-page customization toggles, trade-in flow, and
 * already-have-a-car flow — all of which write the draft BuildRecord that
 * Team 9's Configurator hydrates from.
 *
 * select() routes to the Configurator (Team 9) in addition to recording the
 * conversion-state decision.
 */
export function PicknbuildPathCard({
  listing,
  intake,
  quote,
  isBestFit,
  onSelected,
}: Props) {
  const router = useRouter();
  const { build } = useBuildRecord();

  const downPct = useMemo(
    () =>
      resolveDownPaymentPercentage({
        creditScore: intake.creditScore,
        noCredit: intake.noCredit,
      }),
    [intake.creditScore, intake.noCredit],
  );

  const headline = (() => {
    const base = `All-in ${usd(quote.total)}`;
    if (quote.biweekly !== undefined) {
      return `${base} · ${usd(quote.biweekly)} biweekly${
        quote.term ? ` (${TERM_LABEL[quote.term]})` : ""
      }`;
    }
    return base;
  })();

  const goToConfigurator = () => {
    router.push(
      `/configurator?listingId=${encodeURIComponent(listing.id)}&buildId=${encodeURIComponent(build.id)}`,
    );
  };

  return (
    <PathCardShell
      path="picknbuild"
      isBestFit={isBestFit}
      headline={headline}
      barrierLine={quote.barrierLine}
      badges={
        <>
          <TitleBadge status={quote.titleStatus} />
          <RiskBadge
            creditScore={intake.creditScore}
            noCredit={intake.noCredit}
          />
        </>
      }
      body={
        <dl className="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs text-zinc-700 dark:text-zinc-200">
          <dt className="text-zinc-500 dark:text-zinc-400">Down %</dt>
          <dd className="text-right">{pctLabel(downPct)}</dd>
          {quote.down !== undefined ? (
            <>
              <dt className="text-zinc-500 dark:text-zinc-400">Down</dt>
              <dd className="text-right">{usd(quote.down)}</dd>
            </>
          ) : null}
          {quote.biweekly !== undefined ? (
            <>
              <dt className="text-zinc-500 dark:text-zinc-400">Biweekly</dt>
              <dd className="text-right">{usd(quote.biweekly)}</dd>
            </>
          ) : null}
          {quote.term ? (
            <>
              <dt className="text-zinc-500 dark:text-zinc-400">Term</dt>
              <dd className="text-right">{TERM_LABEL[quote.term]}</dd>
            </>
          ) : null}
        </dl>
      }
      extras={
        <div className="flex flex-col gap-2 border-t border-zinc-200 pt-2 dark:border-zinc-800">
          <PicknbuildCustomizationToggles />
          <TradeInFlow />
          <AlreadyHaveACarFlow />
        </div>
      }
      actions={
        <SelectPathButton
          path="picknbuild"
          listingId={listing.id}
          label="Start picknbuild"
          onSelected={() => {
            onSelected?.();
            goToConfigurator();
          }}
        />
      }
    />
  );
}
