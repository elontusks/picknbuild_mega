import type {
  BuildRecord,
  IntakeState,
  ListingObject,
  Term,
  TitleStatus,
} from "@/contracts";
import { CUSTOMIZATION_CATALOG } from "./packages";

export type SpecSummaryInputs = {
  build: BuildRecord;
  intake?: IntakeState;
  listing?: ListingObject;
  term: Term;
  titleStatus: TitleStatus;
  total: number;
  down: number;
  biweekly: number;
};

const mileageBandFor = (mileage?: number): string => {
  if (mileage == null) return "any";
  const lower = Math.max(0, Math.floor(mileage / 10000) * 10000);
  const upper = lower + 10000;
  return `${lower.toLocaleString()}–${upper.toLocaleString()} mi`;
};

const yearRangeFor = (year?: number, range?: [number, number]): string => {
  if (range) return `${range[0]}–${range[1]}`;
  if (year) return `${year - 1}–${year + 1}`;
  return "any year";
};

const titleLabel = (t: TitleStatus): string =>
  t === "rebuilt" ? "rebuilt" : "clean";

const makeModelYearRange = (input: {
  listing?: ListingObject;
  intake?: IntakeState;
}): string => {
  const make = input.listing?.make ?? input.intake?.make ?? "any make";
  const model = input.listing?.model ?? input.intake?.model ?? "any model";
  const yearRange = yearRangeFor(
    input.listing?.year,
    input.intake?.yearRange,
  );
  return `${yearRange} ${make} ${model}`.trim();
};

const mileageRange = (input: {
  listing?: ListingObject;
  intake?: IntakeState;
}): string => {
  if (input.listing?.mileage != null) {
    return mileageBandFor(input.listing.mileage);
  }
  if (input.intake?.mileageMax != null) {
    return `up to ${input.intake.mileageMax.toLocaleString()} mi`;
  }
  return "any mileage";
};

export const buildSpecSummary = (input: SpecSummaryInputs): string => {
  const lines: string[] = [];
  lines.push(`Vehicle: ${makeModelYearRange(input)}`);
  lines.push(`Mileage: ${mileageRange(input)}`);
  lines.push(`Title: ${titleLabel(input.titleStatus)}`);
  if (input.build.selectedPackage) {
    lines.push(`Package: ${input.build.selectedPackage}`);
  }
  const selectedCustomizations = CUSTOMIZATION_CATALOG.filter(
    (c) => input.build.customizations[c.key],
  ).map((c) => c.label);
  lines.push(
    `Customizations: ${
      selectedCustomizations.length > 0 ? selectedCustomizations.join(", ") : "none"
    }`,
  );
  if (input.build.attachments.length > 0) {
    lines.push(
      `Attachments: ${input.build.attachments
        .map((a) => `${a.type}:${a.ref}`)
        .join("; ")}`,
    );
  }
  lines.push(
    `Pricing: $${input.total.toLocaleString()} all-in · $${input.down.toLocaleString()} down · $${input.biweekly.toLocaleString()}/biweekly · ${input.term}`,
  );
  if (input.intake) {
    if (input.intake.creditScore != null) {
      lines.push(`Credit score on file: ${input.intake.creditScore}`);
    } else if (input.intake.noCredit) {
      lines.push("Credit: No Credit (max-down tier)");
    }
    lines.push(`Cash on hand: $${input.intake.cash.toLocaleString()}`);
  }
  return lines.join("\n");
};
