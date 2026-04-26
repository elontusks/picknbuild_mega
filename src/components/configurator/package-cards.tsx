"use client";

import type { PackageTier } from "@/contracts";
import { PACKAGE_CATALOG, PACKAGE_BY_TIER } from "@/lib/build-records/packages";

type Props = {
  selected?: PackageTier;
  onChange: (tier: PackageTier) => void;
};

const formatUsd = (n: number) =>
  `$${n.toLocaleString("en-US", { maximumFractionDigits: 0 })}`;

export function PackageCards({ selected, onChange }: Props) {
  return (
    <div
      data-testid="package-cards"
      className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-5"
    >
      {PACKAGE_CATALOG.map((pkg) => {
        const active = selected === pkg.tier;
        return (
          <button
            key={pkg.tier}
            type="button"
            data-testid={`package-card-${pkg.tier}`}
            data-active={active || undefined}
            onClick={() => onChange(pkg.tier)}
            className={`flex h-full flex-col gap-2 rounded-lg border p-3 text-left transition ${
              active
                ? "border-zinc-900 bg-muted text-primary-foreground"
                : "border-border bg-background text-foreground hover:border-zinc-400-800-950"
            }`}
          >
            <div className="flex items-baseline justify-between">
              <span className="text-sm font-semibold uppercase tracking-wide">
                {pkg.label}
              </span>
              <span className="font-mono text-sm">
                {formatUsd(pkg.basePrice)}
              </span>
            </div>
            <p className="text-xs opacity-80">{pkg.tagline}</p>
            <span className="mt-auto text-[11px] uppercase opacity-70">
              default term {pkg.defaultTerm}
            </span>
          </button>
        );
      })}
    </div>
  );
}

type DisclosureProps = { selected?: PackageTier };

export function PackageIncludesDisclosure({ selected }: DisclosureProps) {
  if (!selected) {
    return (
      <p
        data-testid="package-includes-empty"
        className="text-xs text-muted-foreground"
      >
        Pick a package to see what's included.
      </p>
    );
  }
  const pkg = PACKAGE_BY_TIER[selected];
  return (
    <div data-testid={`package-includes-${selected}`} className="space-y-2">
      <h3 className="text-sm font-semibold">
        What Your {pkg.label} Package Includes
      </h3>
      <ul className="list-disc space-y-1 pl-5 text-xs">
        {pkg.includes.map((line) => (
          <li key={line}>{line}</li>
        ))}
      </ul>
      <p className="text-[11px] text-muted-foreground">
        Insurance is required before delivery. You may walk away at any time
        pre-deposit without credit impact.
      </p>
    </div>
  );
}
