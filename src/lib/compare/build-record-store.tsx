"use client";

import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useReducer,
  type ReactNode,
} from "react";
import {
  makeFixtureBuildRecord,
  type AlreadyHaveACar,
  type BuildCustomizations,
  type BuildRecord,
  type TradeIn,
  nowIso,
} from "@/contracts";

// Card-level client state for picknbuild customizations, trade-in, and the
// already-have-a-car flow. Team 9 owns the persisted `BuildRecord` contract
// and the Configurator page — this store holds the pre-configurator draft so
// toggles on the compare page survive until the user commits.

export type BuildRecordAction =
  | {
      type: "setCustomization";
      key: keyof BuildCustomizations;
      value: boolean;
    }
  | { type: "setListing"; listingId?: string }
  | { type: "setTradeIn"; tradeIn?: TradeIn }
  | { type: "setAlreadyHaveACar"; alreadyHaveACar?: AlreadyHaveACar };

const reducer = (
  state: BuildRecord,
  action: BuildRecordAction,
): BuildRecord => {
  const updatedAt = nowIso();
  switch (action.type) {
    case "setCustomization":
      return {
        ...state,
        customizations: {
          ...state.customizations,
          [action.key]: action.value,
        },
        updatedAt,
      };
    case "setListing":
      return { ...state, listingId: action.listingId, updatedAt };
    case "setTradeIn":
      return { ...state, tradeIn: action.tradeIn, updatedAt };
    case "setAlreadyHaveACar":
      return {
        ...state,
        alreadyHaveACar: action.alreadyHaveACar,
        updatedAt,
      };
  }
};

type Ctx = {
  build: BuildRecord;
  dispatch: (a: BuildRecordAction) => void;
  setCustomization: (key: keyof BuildCustomizations, value: boolean) => void;
  setListing: (listingId?: string) => void;
  setTradeIn: (tradeIn?: TradeIn) => void;
  setAlreadyHaveACar: (val?: AlreadyHaveACar) => void;
};

const BuildRecordContext = createContext<Ctx | null>(null);

type ProviderProps = {
  children: ReactNode;
  userId: string;
  listingId?: string;
  initial?: BuildRecord;
};

export function BuildRecordProvider({
  children,
  userId,
  listingId,
  initial,
}: ProviderProps) {
  const seed = useMemo<BuildRecord>(
    () =>
      initial ?? makeFixtureBuildRecord({ userId, listingId }),
    [initial, userId, listingId],
  );
  const [build, dispatch] = useReducer(reducer, seed);

  const setCustomization = useCallback(
    (key: keyof BuildCustomizations, value: boolean) =>
      dispatch({ type: "setCustomization", key, value }),
    [],
  );
  const setListing = useCallback(
    (id?: string) => dispatch({ type: "setListing", listingId: id }),
    [],
  );
  const setTradeIn = useCallback(
    (t?: TradeIn) => dispatch({ type: "setTradeIn", tradeIn: t }),
    [],
  );
  const setAlreadyHaveACar = useCallback(
    (v?: AlreadyHaveACar) =>
      dispatch({ type: "setAlreadyHaveACar", alreadyHaveACar: v }),
    [],
  );

  const value = useMemo<Ctx>(
    () => ({
      build,
      dispatch,
      setCustomization,
      setListing,
      setTradeIn,
      setAlreadyHaveACar,
    }),
    [build, setCustomization, setListing, setTradeIn, setAlreadyHaveACar],
  );

  return (
    <BuildRecordContext.Provider value={value}>
      {children}
    </BuildRecordContext.Provider>
  );
}

export function useBuildRecord(): Ctx {
  const ctx = useContext(BuildRecordContext);
  if (!ctx) {
    throw new Error(
      "useBuildRecord must be used inside a BuildRecordProvider",
    );
  }
  return ctx;
}

export { reducer as _buildRecordReducer };
