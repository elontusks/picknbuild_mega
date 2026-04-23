"use client";

import { useTransition } from "react";
import { toggleSponsorActiveAction } from "@/app/admin/actions";

export function SponsorToggleButton({
  id,
  active,
}: {
  id: string;
  active: boolean;
}) {
  const [pending, startTransition] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() =>
        startTransition(async () => {
          await toggleSponsorActiveAction({ id, active: !active });
        })
      }
      className="rounded-md border border-zinc-300 px-2 py-0.5 text-xs disabled:opacity-50 dark:border-zinc-700"
    >
      {active ? "Disable" : "Enable"}
    </button>
  );
}
