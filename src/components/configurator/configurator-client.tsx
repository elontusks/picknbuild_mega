"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import type {
  BuildAttachment,
  BuildCustomizations,
  BuildRecord,
  IntakeState,
  ListingObject,
  PackageTier,
  Term,
  TitleStatus,
} from "@/contracts";
import { Disclaimer } from "@/components/legal/disclaimer";
import { saveBuildDraft } from "@/app/configurator/actions";
import {
  quoteLivePrice,
  type LivePriceOutput,
} from "@/lib/build-records/price";
import { buildSpecSummary } from "@/lib/build-records/summary";
import {
  PACKAGE_BY_TIER,
  type CustomizationKey,
} from "@/lib/build-records/packages";
import { PackageCards, PackageIncludesDisclosure } from "./package-cards";
import { CustomizationPanel } from "./customization-panel";
import { AttachmentsPanel } from "./attachments-panel";
import { LivePricePanel } from "./live-price-panel";
import { SpecSummary } from "./spec-summary";

type Props = {
  initialBuild: BuildRecord;
  listing?: ListingObject;
  intake?: IntakeState;
  viewer: {
    creditScore?: number;
    noCredit?: boolean;
  };
};

const TERM_OPTIONS: Term[] = ["cash", "1y", "2y", "3y", "4y", "5y"];

const resolveTitleStatus = (
  listing?: ListingObject,
  intake?: IntakeState,
): TitleStatus => {
  if (listing?.titleStatus && listing.titleStatus !== "unknown") {
    return listing.titleStatus;
  }
  if (intake?.titlePreference === "rebuilt") return "rebuilt";
  return "clean";
};

export function ConfiguratorClient({
  initialBuild,
  listing,
  intake,
  viewer,
}: Props) {
  const router = useRouter();
  const [build, setBuild] = useState<BuildRecord>(initialBuild);
  const [selectedPackage, setSelectedPackage] = useState<PackageTier>(
    initialBuild.selectedPackage ?? "standard",
  );
  const [term, setTerm] = useState<Term>(
    PACKAGE_BY_TIER[initialBuild.selectedPackage ?? "standard"].defaultTerm,
  );
  const [customizations, setCustomizations] = useState<BuildCustomizations>(
    initialBuild.customizations ?? {},
  );
  const [attachments, setAttachments] = useState<BuildAttachment[]>(
    initialBuild.attachments ?? [],
  );
  const [status, setStatus] = useState<
    { kind: "idle" } | { kind: "saving" } | { kind: "error"; message: string }
  >({ kind: "idle" });
  const [isPending, startTransition] = useTransition();

  const titleStatus = resolveTitleStatus(listing, intake);

  const quote: LivePriceOutput = useMemo(
    () =>
      quoteLivePrice({
        packageTier: selectedPackage,
        customizations,
        term,
        titleStatus,
        creditScore: viewer.creditScore,
        noCredit: viewer.noCredit,
        tradeInValue: initialBuild.tradeIn?.estimatedValue,
      }),
    [
      selectedPackage,
      customizations,
      term,
      titleStatus,
      viewer.creditScore,
      viewer.noCredit,
      initialBuild.tradeIn?.estimatedValue,
    ],
  );

  const summary = useMemo(
    () =>
      buildSpecSummary({
        build: {
          ...build,
          selectedPackage,
          customizations,
          attachments,
        },
        intake,
        listing,
        term,
        titleStatus,
        total: quote.total,
        down: quote.down,
        biweekly: quote.biweekly,
      }),
    [
      build,
      selectedPackage,
      customizations,
      attachments,
      intake,
      listing,
      term,
      titleStatus,
      quote.total,
      quote.down,
      quote.biweekly,
    ],
  );

  const handlePackage = (tier: PackageTier) => {
    setSelectedPackage(tier);
    // Auto-sync term to package default when user picks a new tier — keeps the
    // biweekly figure within the expected range for that tier.
    setTerm(PACKAGE_BY_TIER[tier].defaultTerm);
  };

  const handleCustomization = (key: CustomizationKey, value: boolean) => {
    setCustomizations((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = () => {
    setStatus({ kind: "saving" });
    startTransition(async () => {
      const result = await saveBuildDraft({
        buildRecordId: build.id,
        listingId: listing?.id ?? build.listingId,
        selectedPackage,
        customizations,
        attachments,
      });
      if (!result.ok) {
        setStatus({ kind: "error", message: result.error });
        return;
      }
      setBuild((prev) => ({
        ...prev,
        id: result.buildRecordId,
        selectedPackage,
        customizations,
        attachments,
      }));
      setStatus({ kind: "idle" });
    });
  };

  const handleContinue = () => {
    setStatus({ kind: "saving" });
    startTransition(async () => {
      const result = await saveBuildDraft({
        buildRecordId: build.id,
        listingId: listing?.id ?? build.listingId,
        selectedPackage,
        customizations,
        attachments,
      });
      if (!result.ok) {
        setStatus({ kind: "error", message: result.error });
        return;
      }
      const params = new URLSearchParams({
        build: result.buildRecordId,
        pkg: selectedPackage,
        term,
      });
      router.push(`/checkout?${params.toString()}`);
    });
  };

  return (
    <div
      data-testid="configurator"
      className="mx-auto flex max-w-6xl flex-col gap-6 p-6 lg:flex-row"
    >
      <main className="flex min-w-0 flex-1 flex-col gap-6">
        <header className="space-y-1">
          <h1 className="text-2xl font-semibold">picknbuild Configurator</h1>
          <p className="text-sm text-zinc-500">
            Pick your package, customize, and lock in the spec. Pricing is live.
          </p>
        </header>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            1. Package
          </h2>
          <PackageCards
            selected={selectedPackage}
            onChange={handlePackage}
          />
          <PackageIncludesDisclosure selected={selectedPackage} />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            2. Term
          </h2>
          <div className="flex flex-wrap gap-2">
            {TERM_OPTIONS.map((t) => (
              <button
                key={t}
                type="button"
                data-testid={`term-${t}`}
                data-active={term === t || undefined}
                onClick={() => setTerm(t)}
                className={`rounded px-3 py-1 text-sm ${
                  term === t
                    ? "bg-zinc-900 text-white dark:bg-white dark:text-zinc-900"
                    : "border border-zinc-300 dark:border-zinc-700"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            3. Customizations
          </h2>
          <CustomizationPanel
            value={customizations}
            onChange={handleCustomization}
          />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            4. Add to Your Build
          </h2>
          <AttachmentsPanel value={attachments} onChange={setAttachments} />
        </section>

        <section className="space-y-3">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-zinc-500">
            5. Review Spec
          </h2>
          <SpecSummary summary={summary} />
        </section>

        <section className="space-y-2 rounded-lg border border-amber-300 bg-amber-50 p-4 text-xs dark:border-amber-700 dark:bg-amber-950/40">
          <h3 className="font-semibold">Before you sign</h3>
          <Disclaimer context="insurance" />
          <Disclaimer context="non-refundable" />
        </section>

        {status.kind === "error" ? (
          <p data-testid="configurator-error" className="text-sm text-red-600">
            {status.message}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            data-testid="configurator-save"
            onClick={handleSave}
            disabled={isPending}
            className="rounded-md border border-zinc-300 px-4 py-2 text-sm disabled:opacity-50 dark:border-zinc-700"
          >
            {status.kind === "saving" ? "Saving…" : "Save draft"}
          </button>
          <button
            type="button"
            data-testid="configurator-continue"
            onClick={handleContinue}
            disabled={isPending}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 dark:bg-white dark:text-zinc-900"
          >
            Continue to agreement
          </button>
        </div>
      </main>

      <aside className="lg:w-80">
        <div className="sticky top-6">
          <LivePricePanel quote={quote} />
        </div>
      </aside>
    </div>
  );
}
