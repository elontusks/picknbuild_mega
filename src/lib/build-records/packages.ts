import type { PackageTier, Term } from "@/contracts";

export type PackageSpec = {
  tier: PackageTier;
  label: string;
  basePrice: number;
  defaultTerm: Term;
  includes: string[];
  tagline: string;
};

export const PACKAGE_CATALOG: PackageSpec[] = [
  {
    tier: "standard",
    label: "Standard",
    basePrice: 16500,
    defaultTerm: "3y",
    tagline: "Clean-title daily driver.",
    includes: [
      "Pre-delivery inspection",
      "30-day mechanical warranty",
      "Standard paint + interior",
      "No credit check; walk-away allowed pre-deposit",
    ],
  },
  {
    tier: "premium",
    label: "Premium",
    basePrice: 22500,
    defaultTerm: "3y",
    tagline: "Nicer trim level, newer model year.",
    includes: [
      "Everything in Standard",
      "Priority sourcing",
      "Extended 60-day warranty",
      "Detail + ceramic wash pre-delivery",
    ],
  },
  {
    tier: "silver",
    label: "Silver",
    basePrice: 32000,
    defaultTerm: "4y",
    tagline: "Luxury tier, lightly optioned.",
    includes: [
      "Everything in Premium",
      "Wheel refurb or replacement",
      "Cabin refresh",
      "Dealer-level detail",
    ],
  },
  {
    tier: "platinum",
    label: "Platinum",
    basePrice: 48000,
    defaultTerm: "4y",
    tagline: "High-end, near-new condition.",
    includes: [
      "Everything in Silver",
      "Mechanical refresh",
      "Cosmetic repaint eligible",
      "White-glove delivery",
    ],
  },
  {
    tier: "gold",
    label: "Gold",
    basePrice: 72000,
    defaultTerm: "5y",
    tagline: "Flagship specification.",
    includes: [
      "Everything in Platinum",
      "Full customization budget allocated",
      "Hand-select sourcing",
      "Dedicated build coordinator",
    ],
  },
];

export const PACKAGE_BY_TIER: Record<PackageTier, PackageSpec> =
  PACKAGE_CATALOG.reduce(
    (acc, spec) => {
      acc[spec.tier] = spec;
      return acc;
    },
    {} as Record<PackageTier, PackageSpec>,
  );

export type CustomizationKey = "wrap" | "seats" | "starlight" | "paint";

export const CUSTOMIZATION_CATALOG: Array<{
  key: CustomizationKey;
  label: string;
  price: number;
  blurb: string;
}> = [
  {
    key: "wrap",
    label: "Full vinyl wrap",
    price: 3500,
    blurb: "Colored vinyl wrap, install + warranty included.",
  },
  {
    key: "seats",
    label: "Seat upgrade",
    price: 2200,
    blurb: "Leather or vinyl seat surfaces. Specify details in attachments.",
  },
  {
    key: "starlight",
    label: "Starlight headliner",
    price: 1800,
    blurb: "Fiber-optic headliner retrofit.",
  },
  {
    key: "paint",
    label: "Custom paint",
    price: 6500,
    blurb: "Full exterior repaint in the color of your choice.",
  },
];

export const CUSTOMIZATION_PRICE: Record<CustomizationKey, number> =
  CUSTOMIZATION_CATALOG.reduce(
    (acc, c) => {
      acc[c.key] = c.price;
      return acc;
    },
    {} as Record<CustomizationKey, number>,
  );

export const sumCustomizations = (
  selected: Partial<Record<CustomizationKey, boolean>>,
): number =>
  CUSTOMIZATION_CATALOG.reduce(
    (acc, c) => acc + (selected[c.key] ? c.price : 0),
    0,
  );
