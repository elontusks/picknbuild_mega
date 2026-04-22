import type { Term } from "./intake-state";
import type { TitleStatus } from "./listing-object";

export type PathKind = "dealer" | "auction" | "picknbuild" | "private";

export type PathQuote = {
  path: PathKind;
  total: number;
  down?: number;
  monthly?: number;
  biweekly?: number;
  apr?: number;
  term?: Term;
  approvedBool?: boolean;
  barrierLine: string;
  titleStatus: TitleStatus;
};

export const makeFixturePathQuote = (
  overrides: Partial<PathQuote> = {},
): PathQuote => ({
  path: "picknbuild",
  total: 22000,
  down: 3500,
  biweekly: 180,
  term: "3y",
  approvedBool: true,
  barrierLine: "Need $3.5k down + proof of insurance to start.",
  titleStatus: "clean",
  ...overrides,
});
