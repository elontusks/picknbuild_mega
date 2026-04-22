import type {
  IntakeState,
  Term,
  TitlePreference,
  User,
} from "@/contracts";

export type IntakeAction =
  | { type: "set-make"; make?: string }
  | { type: "set-model"; model?: string }
  | { type: "set-year-range"; yearRange?: [number, number] }
  | { type: "set-mileage-max"; mileageMax?: number }
  | { type: "set-trim"; trim?: string }
  | { type: "set-cash"; cash: number }
  | { type: "set-credit-score"; creditScore?: number }
  | { type: "set-no-credit"; noCredit: boolean }
  | { type: "set-title-preference"; titlePreference: TitlePreference }
  | { type: "set-match-mode"; matchMode: boolean }
  | { type: "set-selected-term"; selectedTerm?: Term }
  | { type: "hydrate"; state: IntakeState }
  | { type: "reset"; state: IntakeState };

export const intakeReducer = (
  state: IntakeState,
  action: IntakeAction,
): IntakeState => {
  switch (action.type) {
    case "set-make":
      return { ...state, make: normString(action.make) };
    case "set-model":
      return { ...state, model: normString(action.model) };
    case "set-year-range":
      return { ...state, yearRange: action.yearRange };
    case "set-mileage-max":
      return { ...state, mileageMax: action.mileageMax };
    case "set-trim":
      return { ...state, trim: normString(action.trim) };
    case "set-cash":
      return { ...state, cash: Math.max(0, action.cash) };
    case "set-credit-score": {
      const next: IntakeState = {
        ...state,
        creditScore: action.creditScore,
      };
      if (action.creditScore !== undefined) next.noCredit = false;
      return next;
    }
    case "set-no-credit": {
      if (!action.noCredit) return { ...state, noCredit: false };
      return { ...state, noCredit: true, creditScore: undefined };
    }
    case "set-title-preference":
      return { ...state, titlePreference: action.titlePreference };
    case "set-match-mode":
      return { ...state, matchMode: action.matchMode };
    case "set-selected-term":
      return { ...state, selectedTerm: action.selectedTerm };
    case "hydrate":
    case "reset":
      return action.state;
  }
};

const normString = (v?: string): string | undefined => {
  const t = v?.trim();
  return t && t.length > 0 ? t : undefined;
};

/**
 * Default IntakeState for a freshly-logged-in user. Fills the four fields the
 * contract requires (location, cash, noCredit, titlePreference, matchMode) from
 * the User record; everything else is left undefined until the buyer sets it.
 */
export const initialIntakeFromUser = (user: User): IntakeState => ({
  location: { zip: user.zip },
  cash: user.budget ?? 0,
  creditScore: user.creditScore,
  noCredit: user.noCredit ?? false,
  titlePreference: "both",
  matchMode: false,
});
