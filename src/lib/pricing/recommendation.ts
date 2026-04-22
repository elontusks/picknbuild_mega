import type {
  BestFitPreference,
  IntakeState,
  PathKind,
  PathQuote,
} from "@/contracts";

export type RecommendationOutput = {
  recommendedPath: PathKind;
  reason: string;
  supportingBullets: string[];
  alternatives: PathKind[];
  primaryCta: { label: string; href: string };
};

const sortLowestTotal = (a: PathQuote, b: PathQuote) => a.total - b.total;

const sortLowestMonthly = (a: PathQuote, b: PathQuote) => {
  const am = a.biweekly !== undefined ? a.biweekly * 26 : a.monthly !== undefined ? a.monthly * 12 : Infinity;
  const bm = b.biweekly !== undefined ? b.biweekly * 26 : b.monthly !== undefined ? b.monthly * 12 : Infinity;
  return am - bm;
};

const isEligible = (q: PathQuote, intake: IntakeState): boolean => {
  if (q.approvedBool === false) return false;
  if (intake.titlePreference !== "both") {
    if (q.titleStatus !== intake.titlePreference && q.titleStatus !== "unknown") {
      return false;
    }
  }
  if (q.down !== undefined && q.down > intake.cash) return false;
  if (q.path === "auction" && q.total > intake.cash) return false;
  if (q.path === "private" && q.total > intake.cash) return false;
  return true;
};

const ctaForPath = (path: PathKind): { label: string; href: string } => {
  switch (path) {
    case "picknbuild":
      return { label: "Start Your Build", href: "#picknbuild" };
    case "dealer":
      return { label: "Message Dealer", href: "#dealer" };
    case "auction":
      return { label: "See Auction Details", href: "#auction" };
    case "private":
      return { label: "Contact Seller", href: "#private" };
  }
};

const reasonFor = (
  path: PathKind,
  pref: BestFitPreference,
  qualified: number,
): string => {
  if (qualified === 0) {
    return "Nothing fully clears your cash + credit — start with the lowest-barrier option.";
  }
  const metric = pref === "lowestMonthly" ? "lowest ongoing payment" : "lowest all-in cost";
  switch (path) {
    case "picknbuild":
      return `picknbuild has the ${metric} for your credit tier and clears today.`;
    case "dealer":
      return `Dealer wins on ${metric} once your approval is factored in.`;
    case "auction":
      return `Auction has the ${metric} — if you can handle transport and repairs.`;
    case "private":
      return `Private-seller ${metric} is best — you inspect and pay direct.`;
  }
};

const bulletsFor = (q: PathQuote, intake: IntakeState): string[] => {
  const out: string[] = [];
  if (q.down !== undefined) {
    const canAfford = q.down <= intake.cash;
    out.push(
      canAfford
        ? `Down payment $${q.down.toLocaleString()} fits your $${intake.cash.toLocaleString()} cash.`
        : `Short $${(q.down - intake.cash).toLocaleString()} on the down payment.`,
    );
  }
  if (q.biweekly !== undefined) {
    out.push(`Bi-weekly payment $${q.biweekly.toLocaleString()} over ${q.term}.`);
  }
  if (q.monthly !== undefined && q.apr !== undefined) {
    out.push(
      `Monthly $${q.monthly.toLocaleString()} at ${(q.apr * 100).toFixed(1)}% APR.`,
    );
  }
  if (q.titleStatus === "rebuilt") {
    out.push("Title is Rebuilt — lower price, higher risk.");
  }
  if (q.approvedBool === false) {
    out.push("Approval not expected at your credit tier.");
  }
  return out;
};

export const recommendBestPath = (input: {
  intake: IntakeState;
  quotes: PathQuote[];
  bestFit?: BestFitPreference;
}): RecommendationOutput => {
  const pref = input.bestFit ?? "lowestTotal";
  const eligible = input.quotes.filter((q) => isEligible(q, input.intake));
  const pool = eligible.length > 0 ? eligible : input.quotes.filter((q) => q.approvedBool !== false);

  const sorter = pref === "lowestMonthly" ? sortLowestMonthly : sortLowestTotal;
  const ranked = [...pool].sort(sorter);
  const pick = ranked[0];
  const path: PathKind = pick?.path ?? "picknbuild";

  return {
    recommendedPath: path,
    reason: reasonFor(path, pref, eligible.length),
    supportingBullets: pick ? bulletsFor(pick, input.intake) : [],
    alternatives: ranked.slice(1).map((q) => q.path),
    primaryCta: ctaForPath(path),
  };
};
