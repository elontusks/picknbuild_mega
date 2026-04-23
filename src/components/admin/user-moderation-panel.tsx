"use client";

import { useTransition, useState } from "react";
import {
  resetUserFinancialsAction,
  suspendUserAction,
} from "@/app/admin/actions";

export function UserModerationPanel({ userId }: { userId: string }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const onSuspend = (note: string) =>
    startTransition(async () => {
      const res = await suspendUserAction({
        userId,
        ...(note ? { note } : {}),
      });
      setMessage(res.ok ? "User suspended." : `Error: ${res.error}`);
    });

  const onResetFinancials = () =>
    startTransition(async () => {
      const res = await resetUserFinancialsAction({ userId });
      setMessage(res.ok ? "Financial fields reset." : `Error: ${res.error}`);
    });

  return (
    <div
      data-testid="admin-user-moderation"
      className="flex flex-col gap-2 rounded-md border border-zinc-200 p-3 dark:border-zinc-800"
    >
      <h3 className="text-sm font-semibold">Moderation</h3>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          const form = e.currentTarget as HTMLFormElement;
          const note = (form.elements.namedItem("note") as HTMLInputElement)
            .value;
          onSuspend(note);
        }}
        className="flex flex-col gap-2"
      >
        <input
          name="note"
          placeholder="Reason (optional)"
          className="rounded-md border border-zinc-200 px-2 py-1 text-xs dark:border-zinc-800"
        />
        <div className="flex gap-2">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-red-600 px-3 py-1 text-xs text-white disabled:opacity-50"
          >
            Suspend user
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onResetFinancials}
            className="rounded-md border border-zinc-300 px-3 py-1 text-xs disabled:opacity-50 dark:border-zinc-700"
          >
            Reset financial fields
          </button>
        </div>
      </form>
      {message ? <p className="text-xs text-zinc-500">{message}</p> : null}
    </div>
  );
}
