"use client";

import type {
  BestFitPreference,
  ConversionState,
  ListingObject,
  PathQuote,
} from "@/contracts";
import { VehicleCard } from "@/components/vehicles/vehicle-card";
import { PathComparisonRow } from "@/components/compare/path-comparison-row";
import { RiskBadge } from "@/components/compare/badges";
import { pickBestFitPath } from "@/lib/compare/best-fit";
import type { GarageDecision } from "@/lib/garage/store";
import { GarageActionButtons } from "./action-buttons";
import { PassPickDecisionInterface } from "./pass-pick-interface";
import { DecisionHighlightBadges } from "./decision-highlight-badges";

type Props = {
  listing: ListingObject;
  quotes: PathQuote[];
  conversionState: ConversionState;
  decision: GarageDecision;
  userZip?: string;
  userCreditScore?: number;
  userNoCredit?: boolean;
  bestFitPreference: BestFitPreference;
  isLowestTotalInGarage: boolean;
  isLowestMonthlyInGarage: boolean;
  onDecisionChange?: (decision: GarageDecision) => void;
};

/**
 * Wraps Team 7's VehicleCard with garage-specific chrome: pass/pick toggle,
 * per-row decision highlights, the four-path comparison row, and action
 * buttons. Keeps the underlying VehicleCard as-is so any future visual tweaks
 * to the shared card propagate here automatically.
 */
export function GarageItemCard({
  listing,
  quotes,
  conversionState,
  decision,
  userZip,
  userCreditScore,
  userNoCredit,
  bestFitPreference,
  isLowestTotalInGarage,
  isLowestMonthlyInGarage,
  onDecisionChange,
}: Props) {
  const bestFitPath = pickBestFitPath(quotes, bestFitPreference);

  return (
    <article
      data-testid="garage-item-card"
      data-listing-id={listing.id}
      data-decision={decision ?? "none"}
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-3 shadow-sm dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <VehicleCard listing={listing} userZip={userZip} />
        </div>
        <div className="flex flex-col items-end gap-2">
          <PassPickDecisionInterface
            listingId={listing.id}
            initialDecision={decision}
            {...(onDecisionChange ? { onChange: onDecisionChange } : {})}
          />
          <RiskBadge
            {...(userCreditScore !== undefined
              ? { creditScore: userCreditScore }
              : {})}
            {...(userNoCredit !== undefined ? { noCredit: userNoCredit } : {})}
          />
        </div>
      </div>
      <DecisionHighlightBadges
        conversionState={conversionState}
        quotes={quotes}
        isLowestTotalInGarage={isLowestTotalInGarage}
        isLowestMonthlyInGarage={isLowestMonthlyInGarage}
      />
      <PathComparisonRow
        quotes={quotes}
        {...(bestFitPath ? { bestFitPath } : {})}
      />
      <GarageActionButtons
        listing={listing}
        conversionState={conversionState}
      />
    </article>
  );
}
