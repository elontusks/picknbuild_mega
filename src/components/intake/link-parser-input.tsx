"use client";

import { useCallback, useState, useTransition } from "react";
import type { ListingObject, TitleStatus } from "@/contracts";

type Props = {
  onParsed: (listing: ListingObject) => void;
};

type Status =
  | { kind: "idle" }
  | { kind: "parsing" }
  | { kind: "error"; reason: string }
  | { kind: "ok" };

/**
 * "Already Found a Car?" link input. Posts to /api/listings/parse-link which
 * calls Team 3's parseLink. On failure, surfaces a Manual Fallback form so the
 * buyer can type the minimum fields by hand.
 */
export function LinkParserInput({ onParsed }: Props) {
  const [url, setUrl] = useState("");
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [pending, startTransition] = useTransition();
  const [showFallback, setShowFallback] = useState(false);

  const submit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const trimmed = url.trim();
      if (!trimmed) {
        setStatus({ kind: "error", reason: "Enter a listing URL" });
        return;
      }
      setStatus({ kind: "parsing" });
      startTransition(async () => {
        try {
          const res = await fetch("/api/listings/parse-link", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ url: trimmed }),
          });
          const body = (await res.json().catch(() => ({}))) as {
            listing?: ListingObject;
            error?: string;
          };
          if (!res.ok || !body.listing) {
            setStatus({
              kind: "error",
              reason: body.error ?? "Couldn't parse that URL",
            });
            setShowFallback(true);
            return;
          }
          setStatus({ kind: "ok" });
          onParsed(body.listing);
          setUrl("");
        } catch {
          setStatus({ kind: "error", reason: "Network error" });
          setShowFallback(true);
        }
      });
    },
    [url, onParsed],
  );

  return (
    <div data-intake="link-parser" className="flex flex-col gap-2">
      <form onSubmit={submit} className="flex flex-col gap-2 sm:flex-row">
        <label className="flex flex-1 flex-col gap-1">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Already found a car?
          </span>
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Paste a Copart / IAAI / Craigslist / dealer URL"
            className="h-10 rounded-lg border border-zinc-200 bg-white px-3 text-sm text-zinc-900 shadow-sm dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </label>
        <button
          type="submit"
          disabled={pending || url.trim() === ""}
          className="h-10 self-end rounded-lg bg-zinc-900 px-4 text-sm font-medium text-white shadow-sm hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200 sm:self-auto sm:mt-[1.375rem]"
        >
          {pending ? "Parsing…" : "Parse link"}
        </button>
      </form>
      {status.kind === "error" ? (
        <p
          data-intake="link-parser-error"
          className="text-xs text-rose-600 dark:text-rose-400"
        >
          {status.reason}
        </p>
      ) : null}
      {showFallback || status.kind === "error" ? (
        <ManualFallbackEntry
          initialUrl={url.trim()}
          onParsed={(listing) => {
            setStatus({ kind: "ok" });
            setShowFallback(false);
            onParsed(listing);
            setUrl("");
          }}
        />
      ) : null}
    </div>
  );
}

type FallbackProps = {
  initialUrl?: string;
  onParsed: (listing: ListingObject) => void;
};

type FallbackForm = {
  year: string;
  make: string;
  model: string;
  trim: string;
  mileage: string;
  price: string;
  vin: string;
  titleStatus: TitleStatus;
};

const EMPTY_FALLBACK: FallbackForm = {
  year: "",
  make: "",
  model: "",
  trim: "",
  mileage: "",
  price: "",
  vin: "",
  titleStatus: "unknown",
};

export function ManualFallbackEntry({ initialUrl, onParsed }: FallbackProps) {
  const [form, setForm] = useState<FallbackForm>(EMPTY_FALLBACK);
  const [pending, startTransition] = useTransition();
  const [err, setErr] = useState<string | null>(null);

  const set = (k: keyof FallbackForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
  };

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const year = Number(form.year);
    if (!Number.isFinite(year) || year < 1900) {
      setErr("Year must be a valid number");
      return;
    }
    if (!form.make.trim() || !form.model.trim()) {
      setErr("Make and model are required");
      return;
    }
    setErr(null);
    startTransition(async () => {
      const body = {
        url: initialUrl || undefined,
        manual: {
          year: Math.round(year),
          make: form.make.trim(),
          model: form.model.trim(),
          trim: form.trim.trim() || undefined,
          mileage: form.mileage ? Math.round(Number(form.mileage)) : undefined,
          price: form.price ? Math.round(Number(form.price)) : undefined,
          vin: form.vin.trim() || undefined,
          titleStatus: form.titleStatus,
        },
      };
      try {
        const res = await fetch("/api/listings/parse-link", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        const j = (await res.json().catch(() => ({}))) as {
          listing?: ListingObject;
          error?: string;
        };
        if (!res.ok || !j.listing) {
          setErr(j.error ?? "Couldn't save manual entry");
          return;
        }
        onParsed(j.listing);
        setForm(EMPTY_FALLBACK);
      } catch {
        setErr("Network error");
      }
    });
  };

  return (
    <form
      data-intake="manual-fallback"
      onSubmit={submit}
      className="flex flex-col gap-2 rounded-lg border border-dashed border-zinc-300 bg-zinc-50 p-3 dark:border-zinc-700 dark:bg-zinc-900/60"
    >
      <p className="text-xs text-zinc-600 dark:text-zinc-300">
        Manual fallback — enter the basics and we&apos;ll compare paths.
      </p>
      <div className="grid gap-2 sm:grid-cols-3">
        <input
          required
          value={form.year}
          onChange={set("year")}
          placeholder="Year"
          type="number"
          className={FIELD}
        />
        <input
          required
          value={form.make}
          onChange={set("make")}
          placeholder="Make"
          className={FIELD}
        />
        <input
          required
          value={form.model}
          onChange={set("model")}
          placeholder="Model"
          className={FIELD}
        />
        <input
          value={form.trim}
          onChange={set("trim")}
          placeholder="Trim (optional)"
          className={FIELD}
        />
        <input
          value={form.mileage}
          onChange={set("mileage")}
          placeholder="Mileage"
          type="number"
          className={FIELD}
        />
        <input
          value={form.price}
          onChange={set("price")}
          placeholder="Ask price"
          type="number"
          className={FIELD}
        />
        <input
          value={form.vin}
          onChange={set("vin")}
          placeholder="VIN (optional)"
          className={FIELD}
        />
        <select
          value={form.titleStatus}
          onChange={set("titleStatus")}
          className={FIELD}
        >
          <option value="unknown">Title: unknown</option>
          <option value="clean">Title: clean</option>
          <option value="rebuilt">Title: rebuilt</option>
        </select>
      </div>
      {err ? (
        <p className="text-xs text-rose-600 dark:text-rose-400">{err}</p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="h-9 self-start rounded-lg bg-zinc-900 px-3 text-xs font-medium text-white hover:bg-zinc-800 disabled:opacity-50 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
      >
        {pending ? "Saving…" : "Use these details"}
      </button>
    </form>
  );
}

const FIELD =
  "h-9 rounded-md border border-zinc-200 bg-white px-2 text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100";
