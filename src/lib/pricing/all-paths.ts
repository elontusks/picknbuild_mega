import type { IntakeState, ListingObject, PathKind, PathQuote, Term } from "@/contracts";
import { buildAuctionPathQuote } from "./auction-quote";
import { buildDealerPathQuote } from "./dealer-quote";
import { buildPicknbuildPathQuote } from "./picknbuild-quote";
import { buildPrivatePathQuote } from "./private-quote";
import { isFinancedTerm } from "./term-cadence";

const defaultFinancedTerm: Term = "3y";

export const quotePathForListing = (
  path: PathKind,
  listing: ListingObject,
  intake: IntakeState,
): PathQuote => {
  const term = intake.selectedTerm ?? defaultFinancedTerm;

  switch (path) {
    case "picknbuild": {
      const basePrice = listing.price ?? listing.binPrice ?? listing.currentBid ?? 20000;
      const titleStatus =
        listing.titleStatus === "unknown" ? "clean" : listing.titleStatus;
      return buildPicknbuildPathQuote({
        basePrice,
        titleStatus,
        creditScore: intake.creditScore,
        noCredit: intake.noCredit,
        term: isFinancedTerm(term) ? term : defaultFinancedTerm,
      });
    }
    case "dealer": {
      const listingPrice = listing.price ?? listing.binPrice ?? 22000;
      return buildDealerPathQuote({
        creditScore: intake.creditScore,
        noCredit: intake.noCredit,
        listingPrice,
        titleStatus: listing.titleStatus,
        term,
      });
    }
    case "auction":
      return buildAuctionPathQuote({ listing });
    case "private":
      return buildPrivatePathQuote({ listing });
  }
};

export const quoteAllPathsForListing = (
  listing: ListingObject,
  intake: IntakeState,
): PathQuote[] =>
  (["dealer", "auction", "picknbuild", "private"] as const).map((p) =>
    quotePathForListing(p, listing, intake),
  );
