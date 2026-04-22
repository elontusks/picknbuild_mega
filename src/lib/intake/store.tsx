"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  type ReactNode,
} from "react";
import type { IntakeState, User } from "@/contracts";
import { intakeReducer, initialIntakeFromUser, type IntakeAction } from "./reducer";
import {
  loadPersistedIntake,
  savePersistedIntake,
} from "./persistence";

type IntakeContextValue = {
  state: IntakeState;
  baseline: IntakeState;
  dispatch: (action: IntakeAction) => void;
  reset: () => void;
};

const IntakeContext = createContext<IntakeContextValue | null>(null);

type IntakeProviderProps = {
  user: User;
  children: ReactNode;
  /** Override persistence; tests pass a memory implementation. */
  persistence?: {
    load: (userId: string) => IntakeState | null;
    save: (userId: string, s: IntakeState) => void;
  };
};

export function IntakeProvider({
  user,
  children,
  persistence,
}: IntakeProviderProps) {
  const baseline = useMemo(() => initialIntakeFromUser(user), [user]);
  const [state, dispatch] = useReducer(intakeReducer, baseline);
  const hydrated = useRef(false);

  const load = persistence?.load ?? loadPersistedIntake;
  const save = persistence?.save ?? savePersistedIntake;

  // Hydrate once from persistence on mount (per userId). Skipped on SSR.
  useEffect(() => {
    if (hydrated.current) return;
    hydrated.current = true;
    const persisted = load(user.id);
    if (persisted) {
      dispatch({ type: "hydrate", state: persisted });
    }
  }, [user.id, load]);

  // Persist every change after hydration.
  useEffect(() => {
    if (!hydrated.current) return;
    save(user.id, state);
  }, [user.id, state, save]);

  const reset = useCallback(() => {
    dispatch({ type: "reset", state: baseline });
  }, [baseline]);

  const value = useMemo(
    () => ({ state, baseline, dispatch, reset }),
    [state, baseline, reset],
  );

  return <IntakeContext.Provider value={value}>{children}</IntakeContext.Provider>;
}

export function useIntakeState(): IntakeState {
  const ctx = useContext(IntakeContext);
  if (!ctx) throw new Error("useIntakeState must be used inside IntakeProvider");
  return ctx.state;
}

export function useIntakeBaseline(): IntakeState {
  const ctx = useContext(IntakeContext);
  if (!ctx) throw new Error("useIntakeBaseline must be used inside IntakeProvider");
  return ctx.baseline;
}

export function useIntakeDispatch(): (action: IntakeAction) => void {
  const ctx = useContext(IntakeContext);
  if (!ctx)
    throw new Error("useIntakeDispatch must be used inside IntakeProvider");
  return ctx.dispatch;
}

export function useIntakeReset(): () => void {
  const ctx = useContext(IntakeContext);
  if (!ctx) throw new Error("useIntakeReset must be used inside IntakeProvider");
  return ctx.reset;
}
