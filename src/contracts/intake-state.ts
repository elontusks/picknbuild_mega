export type TitlePreference = "clean" | "rebuilt" | "both";

export type Term = "cash" | "1y" | "2y" | "3y" | "4y" | "5y";

export type IntakeState = {
  location: { zip: string };
  make?: string;
  model?: string;
  yearRange?: [number, number];
  mileageMax?: number;
  trim?: string;
  cash: number;
  creditScore?: number;
  noCredit: boolean;
  titlePreference: TitlePreference;
  matchMode: boolean;
  selectedTerm?: Term;
};

export const makeFixtureIntakeState = (
  overrides: Partial<IntakeState> = {},
): IntakeState => ({
  location: { zip: "43210" },
  cash: 5000,
  creditScore: 680,
  noCredit: false,
  titlePreference: "both",
  matchMode: false,
  ...overrides,
});
