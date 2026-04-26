"use client";

import { useState } from "react";
import type { ListingObject, TitleStatus } from "@/contracts";

export type ListingFormMode = "user" | "dealer";

type FormState = {
  year: string;
  make: string;
  model: string;
  trim: string;
  mileage: string;
  price: string;
  vin: string;
  titleStatus: TitleStatus;
  locationZip: string;
  photos: string;
  sourceUrl: string;
};

const EMPTY: FormState = {
  year: "",
  make: "",
  model: "",
  trim: "",
  mileage: "",
  price: "",
  vin: "",
  titleStatus: "clean",
  locationZip: "",
  photos: "",
  sourceUrl: "",
};

function toBody(mode: ListingFormMode, state: FormState) {
  return {
    source: mode,
    year: state.year ? Number(state.year) : undefined,
    make: state.make.trim(),
    model: state.model.trim(),
    trim: state.trim.trim() || undefined,
    mileage: state.mileage ? Number(state.mileage) : undefined,
    price: state.price ? Number(state.price) : undefined,
    vin: state.vin.trim() || undefined,
    titleStatus: state.titleStatus,
    locationZip: state.locationZip.trim() || undefined,
    photos: state.photos
      .split(/\n|,/)
      .map((p) => p.trim())
      .filter(Boolean),
    sourceUrl: state.sourceUrl.trim() || undefined,
  };
}

/**
 * Shared listing form used by both the user-generated listing upload (T3) and
 * the dealer-posted listing form (T3 UI mounted inside T2's Dealer Page Edit
 * Panel). `mode` controls copy + the server-side `source` value.
 */
export function ListingForm({
  mode,
  initial,
  onCreated,
}: {
  mode: ListingFormMode;
  initial?: Partial<FormState>;
  onCreated?: (listing: ListingObject) => void;
}) {
  const [state, setState] = useState<FormState>({ ...EMPTY, ...initial });
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  function patch<K extends keyof FormState>(key: K, value: FormState[K]) {
    setState((s) => ({ ...s, [key]: value }));
  }

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setPending(true);
    try {
      const res = await fetch("/api/listings", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(toBody(mode, state)),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.error ?? "Could not save listing.");
        return;
      }
      setState(EMPTY);
      onCreated?.(json.listing);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Network error");
    } finally {
      setPending(false);
    }
  }

  const submitLabel = mode === "dealer" ? "Post listing" : "List my car";

  return (
    <form onSubmit={submit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          Year
          <input
            required
            inputMode="numeric"
            value={state.year}
            onChange={(e) => patch("year", e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </label>
        <label className="text-sm">
          Title
          <select
            value={state.titleStatus}
            onChange={(e) => patch("titleStatus", e.target.value as TitleStatus)}
            className="mt-1 w-full rounded border px-2 py-1"
          >
            <option value="clean">Clean</option>
            <option value="rebuilt">Rebuilt</option>
            <option value="unknown">Unknown</option>
          </select>
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          Make
          <input
            required
            value={state.make}
            onChange={(e) => patch("make", e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </label>
        <label className="text-sm">
          Model
          <input
            required
            value={state.model}
            onChange={(e) => patch("model", e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          Trim (optional)
          <input
            value={state.trim}
            onChange={(e) => patch("trim", e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </label>
        <label className="text-sm">
          Mileage
          <input
            inputMode="numeric"
            value={state.mileage}
            onChange={(e) => patch("mileage", e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <label className="text-sm">
          Ask price ($)
          <input
            required
            inputMode="numeric"
            value={state.price}
            onChange={(e) => patch("price", e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </label>
        <label className="text-sm">
          ZIP
          <input
            value={state.locationZip}
            onChange={(e) => patch("locationZip", e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1"
          />
        </label>
      </div>

      <label className="block text-sm">
        VIN (17 characters, optional)
        <input
          value={state.vin}
          onChange={(e) => patch("vin", e.target.value.toUpperCase())}
          className="mt-1 w-full rounded border px-2 py-1 font-mono"
          maxLength={17}
        />
      </label>

      <label className="block text-sm">
        Photo URLs (one per line)
        <textarea
          rows={3}
          value={state.photos}
          onChange={(e) => patch("photos", e.target.value)}
          className="mt-1 w-full rounded border px-2 py-1 font-mono text-xs"
        />
      </label>

      {mode === "dealer" ? (
        <label className="block text-sm">
          Dealer page URL (optional — we generate one if left blank)
          <input
            value={state.sourceUrl}
            onChange={(e) => patch("sourceUrl", e.target.value)}
            className="mt-1 w-full rounded border px-2 py-1"
            placeholder="https://dealer.example.com/inventory/..."
          />
        </label>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-red-600">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="rounded bg-black px-3 py-2 text-sm text-primary-foreground disabled:opacity-60"
      >
        {pending ? "Saving…" : submitLabel}
      </button>
    </form>
  );
}
