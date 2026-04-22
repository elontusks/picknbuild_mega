export type CreditTierInput = { creditScore?: number; noCredit?: boolean };

const FLOOR_PCT = 0.22;
const CEILING_PCT = 0.12;

const ANCHORS: ReadonlyArray<readonly [score: number, pct: number]> = [
  [600, 0.22],
  [625, 0.21],
  [650, 0.2],
  [675, 0.18],
  [700, 0.16],
  [725, 0.14],
  [750, 0.13],
  [775, 0.125],
  [800, 0.12],
] as const;

export const resolveDownPaymentPercentage = ({
  creditScore,
  noCredit,
}: CreditTierInput): number => {
  if (noCredit) return FLOOR_PCT;
  if (creditScore === undefined) return FLOOR_PCT;
  if (creditScore < 600) return FLOOR_PCT;
  if (creditScore >= 800) return CEILING_PCT;

  for (let i = 0; i < ANCHORS.length - 1; i += 1) {
    const lo = ANCHORS[i]!;
    const hi = ANCHORS[i + 1]!;
    if (creditScore >= lo[0] && creditScore <= hi[0]) {
      if (creditScore === lo[0]) return lo[1];
      if (creditScore === hi[0]) return hi[1];
      const t = (creditScore - lo[0]) / (hi[0] - lo[0]);
      return lo[1] + t * (hi[1] - lo[1]);
    }
  }
  return FLOOR_PCT;
};

export type CreditBand = "red" | "yellow" | "green" | "locked";

export const resolveCreditBand = ({
  creditScore,
  noCredit,
}: CreditTierInput): CreditBand => {
  if (noCredit) return "locked";
  if (creditScore === undefined) return "locked";
  if (creditScore < 600) return "locked";
  if (creditScore < 650) return "red";
  if (creditScore < 700) return "yellow";
  return "green";
};
