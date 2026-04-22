"use client";

import type { BuildCustomizations } from "@/contracts";
import { useBuildRecord } from "@/lib/compare/build-record-store";

type ToggleKey = keyof BuildCustomizations;

const TOGGLES: { key: ToggleKey; label: string; hint: string }[] = [
  { key: "wrap", label: "Wrap", hint: "Custom vinyl wrap" },
  { key: "seats", label: "Seats", hint: "Upgraded seats via Add-to-Build" },
  { key: "starlight", label: "Starlight", hint: "Fiber-optic headliner" },
  { key: "paint", label: "Paint", hint: "Full repaint" },
];

/**
 * Card-level picknbuild customization toggles. Writes into the draft
 * BuildRecord so the Configurator page (Team 9) hydrates with whatever the
 * buyer already flipped on while comparing.
 */
export function PicknbuildCustomizationToggles() {
  const { build, setCustomization } = useBuildRecord();

  return (
    <fieldset
      data-testid="picknbuild-customization-toggles"
      className="flex flex-col gap-1.5"
    >
      <legend className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        Customize on picknbuild
      </legend>
      <ul className="grid grid-cols-2 gap-1.5">
        {TOGGLES.map(({ key, label, hint }) => {
          const checked = Boolean(build.customizations[key]);
          return (
            <li key={key}>
              <label
                className={`flex cursor-pointer items-center gap-2 rounded-md border px-2 py-1 text-xs transition ${
                  checked
                    ? "border-emerald-400 bg-emerald-50 text-emerald-900 dark:border-emerald-500/60 dark:bg-emerald-950/30 dark:text-emerald-100"
                    : "border-zinc-200 bg-white text-zinc-700 hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200"
                }`}
              >
                <input
                  type="checkbox"
                  className="h-3.5 w-3.5 accent-emerald-500"
                  checked={checked}
                  data-testid={`customization-${key}`}
                  onChange={(e) => setCustomization(key, e.target.checked)}
                />
                <span className="flex flex-col leading-tight">
                  <span className="font-semibold">{label}</span>
                  <span className="text-[10px] text-zinc-500 dark:text-zinc-400">
                    {hint}
                  </span>
                </span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}
