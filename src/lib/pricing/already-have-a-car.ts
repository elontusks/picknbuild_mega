export type AlreadyHaveACarInputs = {
  vin?: string;
  fallback?: {
    year: number;
    make: string;
    model: string;
    mileage?: number;
    trim?: string;
  };
  requestedWork: string[];
};

export type AlreadyHaveACarResult =
  | {
      ok: true;
      estimate: number;
      lineItems: { label: string; amount: number }[];
      assumptions: string[];
    }
  | { ok: false; reason: "quote-required"; missing: string[] };

const WORK_PRICE_BOOK: Record<string, number> = {
  wrap: 3500,
  seats: 2800,
  starlight: 1800,
  paint: 4200,
  repairs: 2500,
};

const REQUIRED_WORK_LABELS = Object.keys(WORK_PRICE_BOOK);

export const estimateAlreadyHaveACar = (
  input: AlreadyHaveACarInputs,
): AlreadyHaveACarResult => {
  const hasVehicleId = Boolean(input.vin) || Boolean(input.fallback);
  if (!hasVehicleId) {
    return {
      ok: false,
      reason: "quote-required",
      missing: ["vin or vehicle details"],
    };
  }
  if (input.requestedWork.length === 0) {
    return { ok: false, reason: "quote-required", missing: ["requestedWork"] };
  }

  const lineItems = input.requestedWork.map((w) => ({
    label: w,
    amount: WORK_PRICE_BOOK[w.toLowerCase()] ?? 1500,
  }));
  const estimate = lineItems.reduce((s, x) => s + x.amount, 0);

  const unknownWork = input.requestedWork.filter(
    (w) => !REQUIRED_WORK_LABELS.includes(w.toLowerCase()),
  );

  const assumptions: string[] = [
    "Parts availability stable in current market",
    "Vehicle is drivable and has no frame damage",
  ];
  if (unknownWork.length > 0) {
    assumptions.push(
      `Custom work items (${unknownWork.join(", ")}) priced at default shop rate.`,
    );
  }

  return { ok: true, estimate: Math.round(estimate), lineItems, assumptions };
};
