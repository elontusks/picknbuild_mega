"use client";

import { useState, useTransition } from "react";
import type { AlreadyHaveACar } from "@/contracts";
import { useBuildRecord } from "@/lib/compare/build-record-store";
import { usd } from "@/lib/compare/formatters";

type ApiResponse =
  | { ok: true; estimate: number; assumptions: string[] }
  | { ok: false; reason: "quote-required" }
  | { ok: false; reason: string };

const VIN_PATTERN = /^[A-HJ-NPR-Z0-9]{17}$/i;

async function requestEstimate(payload: unknown): Promise<ApiResponse> {
  const res = await fetch("/api/pricing/already-have-a-car", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const body = (await res.json().catch(() => ({}))) as {
    ok?: boolean;
    estimate?: number;
    assumptions?: string[];
    reason?: string;
    error?: string;
  };
  if (!res.ok) {
    return { ok: false, reason: body.reason ?? body.error ?? "Estimate failed" };
  }
  if (body.reason === "quote-required") {
    return { ok: false, reason: "quote-required" };
  }
  if (typeof body.estimate === "number") {
    return {
      ok: true,
      estimate: body.estimate,
      assumptions: body.assumptions ?? [],
    };
  }
  return { ok: false, reason: "Malformed response" };
}

type EstimateState =
  | { status: "idle" }
  | { status: "ok"; estimate: number; assumptions: string[] }
  | { status: "quote-required" };

/**
 * Entry form for the "already have a car" flow. Captures either a VIN or
 * fallback {year, make, model, mileage, trim} plus a free-text "requested
 * work" list, then hits Team 11's estimator. Writes everything into the
 * draft BuildRecord so the Configurator can pick it up.
 */
export function AlreadyHaveACarFlow() {
  const { build, setAlreadyHaveACar } = useBuildRecord();
  const existing = build.alreadyHaveACar;
  const [useVin, setUseVin] = useState(existing?.vin !== undefined);
  const [vin, setVin] = useState(existing?.vin ?? "");
  const [year, setYear] = useState(existing?.fallback?.year?.toString() ?? "");
  const [make, setMake] = useState(existing?.fallback?.make ?? "");
  const [model, setModel] = useState(existing?.fallback?.model ?? "");
  const [mileage, setMileage] = useState(
    existing?.fallback?.mileage?.toString() ?? "",
  );
  const [trim, setTrim] = useState(existing?.fallback?.trim ?? "");
  const [work, setWork] = useState(
    (existing?.requestedWork ?? []).join(", "),
  );
  const [state, setState] = useState<EstimateState>({ status: "idle" });
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const submit = () => {
    setError(null);
    const requestedWork = work
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    let payload: AlreadyHaveACar;
    if (useVin) {
      const v = vin.trim().toUpperCase();
      if (!VIN_PATTERN.test(v)) {
        setError("Enter a 17-character VIN");
        return;
      }
      payload = { vin: v, requestedWork };
    } else {
      const y = Number(year);
      if (!Number.isFinite(y) || y < 1900 || y > 2100) {
        setError("Year must be between 1900 and 2100");
        return;
      }
      if (!make.trim() || !model.trim()) {
        setError("Make and model are required");
        return;
      }
      const fallback: AlreadyHaveACar["fallback"] = {
        year: y,
        make: make.trim(),
        model: model.trim(),
      };
      const mi = Number(mileage);
      if (mileage && Number.isFinite(mi)) fallback.mileage = mi;
      if (trim.trim()) fallback.trim = trim.trim();
      payload = { fallback, requestedWork };
    }

    startTransition(async () => {
      const result = await requestEstimate(payload);
      if (!result.ok) {
        if (result.reason === "quote-required") {
          setAlreadyHaveACar(payload);
          setState({ status: "quote-required" });
          return;
        }
        setError(result.reason);
        return;
      }
      setAlreadyHaveACar(payload);
      setState({
        status: "ok",
        estimate: result.estimate,
        assumptions: result.assumptions,
      });
    });
  };

  const clear = () => {
    setAlreadyHaveACar(undefined);
    setState({ status: "idle" });
    setError(null);
  };

  return (
    <details
      data-testid="already-have-a-car-flow"
      className="rounded-md border border-border px-2 py-1.5 text-xs-800"
    >
      <summary className="cursor-pointer select-none font-semibold text-muted-foreground">
        Already have a car? Customize it
      </summary>
      <div className="mt-2 flex flex-col gap-2">
        <div className="flex items-center gap-3 text-[11px]">
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={useVin}
              onChange={() => setUseVin(true)}
              data-testid="ahac-mode-vin"
            />
            By VIN
          </label>
          <label className="flex items-center gap-1">
            <input
              type="radio"
              checked={!useVin}
              onChange={() => setUseVin(false)}
              data-testid="ahac-mode-fallback"
            />
            Manual entry
          </label>
        </div>
        {useVin ? (
          <label className="flex flex-col gap-0.5">
            <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
              VIN
            </span>
            <input
              type="text"
              value={vin}
              onChange={(e) => setVin(e.target.value)}
              data-testid="ahac-vin"
              maxLength={17}
              placeholder="17-character VIN"
              className="rounded border border-border px-2 py-1 font-mono text-xs-700-900"
            />
          </label>
        ) : (
          <div className="grid grid-cols-3 gap-1.5">
            <input
              type="number"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              data-testid="ahac-year"
              placeholder="Year"
              className="rounded border border-border px-2 py-1 text-xs-700-900"
            />
            <input
              type="text"
              value={make}
              onChange={(e) => setMake(e.target.value)}
              data-testid="ahac-make"
              placeholder="Make"
              className="rounded border border-border px-2 py-1 text-xs-700-900"
            />
            <input
              type="text"
              value={model}
              onChange={(e) => setModel(e.target.value)}
              data-testid="ahac-model"
              placeholder="Model"
              className="rounded border border-border px-2 py-1 text-xs-700-900"
            />
            <input
              type="text"
              value={trim}
              onChange={(e) => setTrim(e.target.value)}
              data-testid="ahac-trim"
              placeholder="Trim"
              className="rounded border border-border px-2 py-1 text-xs-700-900"
            />
            <input
              type="number"
              value={mileage}
              onChange={(e) => setMileage(e.target.value)}
              data-testid="ahac-mileage"
              placeholder="Mileage"
              className="col-span-2 rounded border border-border px-2 py-1 text-xs-700-900"
            />
          </div>
        )}
        <label className="flex flex-col gap-0.5">
          <span className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Work you want done (comma-separated)
          </span>
          <input
            type="text"
            value={work}
            onChange={(e) => setWork(e.target.value)}
            data-testid="ahac-work"
            placeholder="wrap, seats, paint…"
            className="rounded border border-border px-2 py-1 text-xs-700-900"
          />
        </label>
        {error ? (
          <p
            data-testid="ahac-error"
            className="text-[11px] text-rose-600 dark:text-rose-400"
          >
            {error}
          </p>
        ) : null}
        {state.status === "ok" ? (
          <div
            data-testid="ahac-estimate"
            className="rounded bg-emerald-50 p-1.5 text-[11px] text-emerald-900-950/30 dark:text-emerald-100"
          >
            Estimated spend: {usd(state.estimate)}
            {state.assumptions.length > 0 ? (
              <ul className="mt-1 list-disc pl-4 text-[10px] opacity-80">
                {state.assumptions.map((a, i) => (
                  <li key={i}>{a}</li>
                ))}
              </ul>
            ) : null}
          </div>
        ) : null}
        {state.status === "quote-required" ? (
          <p
            data-testid="ahac-quote-required"
            className="rounded bg-amber-50 p-1.5 text-[11px] text-amber-900-950/30 dark:text-amber-100"
          >
            This scope of work needs a custom quote. We&rsquo;ll follow up on
            commit.
          </p>
        ) : null}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            data-testid="ahac-submit"
            className="rounded bg-muted px-2 py-1 text-[11px] font-semibold text-primary-foreground disabled:bg-zinc-400"
          >
            {pending ? "Estimating…" : "Estimate"}
          </button>
          {existing ? (
            <button
              type="button"
              onClick={clear}
              data-testid="ahac-clear"
              className="text-[11px] text-muted-foreground underline hover:text-zinc-800"
            >
              Remove
            </button>
          ) : null}
        </div>
      </div>
    </details>
  );
}
