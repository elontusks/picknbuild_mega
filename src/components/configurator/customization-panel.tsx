"use client";

import type { BuildCustomizations } from "@/contracts";
import {
  CUSTOMIZATION_CATALOG,
  type CustomizationKey,
} from "@/lib/build-records/packages";

type Props = {
  value: BuildCustomizations;
  onChange: (key: CustomizationKey, value: boolean) => void;
};

const formatUsd = (n: number) => `+$${n.toLocaleString("en-US")}`;

export function CustomizationPanel({ value, onChange }: Props) {
  return (
    <div data-testid="customization-panel" className="space-y-2">
      {CUSTOMIZATION_CATALOG.map((c) => {
        const checked = Boolean(value[c.key]);
        return (
          <label
            key={c.key}
            data-testid={`customization-${c.key}`}
            className="flex items-start gap-3 rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800"
          >
            <input
              type="checkbox"
              data-testid={`customization-input-${c.key}`}
              checked={checked}
              onChange={(e) => onChange(c.key, e.target.checked)}
              className="mt-1"
            />
            <div className="flex-1">
              <div className="flex items-baseline justify-between">
                <span className="font-medium">{c.label}</span>
                <span className="font-mono text-xs">{formatUsd(c.price)}</span>
              </div>
              <p className="text-xs text-zinc-500">{c.blurb}</p>
            </div>
          </label>
        );
      })}
    </div>
  );
}
