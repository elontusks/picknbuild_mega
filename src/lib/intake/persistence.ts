import type { IntakeState, TitlePreference, Term } from "@/contracts";

const STORAGE_VERSION = 1;
const keyFor = (userId: string) => `picknbuild:intake:v${STORAGE_VERSION}:${userId}`;

type PersistedShape = {
  version: 1;
  state: IntakeState;
};

/**
 * Type-narrowed read of the persisted shape. Returns null if storage is
 * empty, unparseable, on a different version, or doesn't carry the required
 * fields.
 */
export const loadPersistedIntake = (
  userId: string,
): IntakeState | null => {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PersistedShape> | null;
    if (!parsed || parsed.version !== STORAGE_VERSION) return null;
    const state = parsed.state;
    if (!state) return null;
    return validate(state);
  } catch {
    return null;
  }
};

export const savePersistedIntake = (
  userId: string,
  state: IntakeState,
): void => {
  if (typeof window === "undefined") return;
  try {
    const payload: PersistedShape = { version: STORAGE_VERSION, state };
    window.localStorage.setItem(keyFor(userId), JSON.stringify(payload));
  } catch {
    // quota / disabled — silent, intake just doesn't persist across reloads
  }
};

export const clearPersistedIntake = (userId: string): void => {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(keyFor(userId));
  } catch {
    // ignore
  }
};

const TITLE_PREFS: ReadonlySet<TitlePreference> = new Set<TitlePreference>([
  "clean",
  "rebuilt",
  "both",
]);
const TERMS: ReadonlySet<Term> = new Set<Term>([
  "cash",
  "1y",
  "2y",
  "3y",
  "4y",
  "5y",
]);

const validate = (raw: IntakeState): IntakeState | null => {
  if (!raw.location || typeof raw.location.zip !== "string") return null;
  if (typeof raw.cash !== "number" || !Number.isFinite(raw.cash)) return null;
  if (typeof raw.noCredit !== "boolean") return null;
  if (!TITLE_PREFS.has(raw.titlePreference)) return null;
  if (typeof raw.matchMode !== "boolean") return null;
  if (raw.selectedTerm !== undefined && !TERMS.has(raw.selectedTerm))
    return null;
  return {
    location: { zip: raw.location.zip },
    make: raw.make,
    model: raw.model,
    yearRange: raw.yearRange,
    mileageMax: raw.mileageMax,
    trim: raw.trim,
    cash: Math.max(0, raw.cash),
    creditScore: raw.creditScore,
    noCredit: raw.noCredit,
    titlePreference: raw.titlePreference,
    matchMode: raw.matchMode,
    selectedTerm: raw.selectedTerm,
  };
};
