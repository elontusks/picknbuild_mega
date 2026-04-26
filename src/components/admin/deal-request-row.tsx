"use client";

import { useState, useTransition } from "react";
import type { DealRequest } from "@/services/team-10-dashboard";
import { acknowledgeDealRequestAction } from "@/app/admin/actions";

export function DealRequestRow({ request }: { request: DealRequest }) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  const onAck = () =>
    startTransition(async () => {
      const res = await acknowledgeDealRequestAction({ requestId: request.id });
      setMessage(res.ok ? "Acknowledged." : `Error: ${res.error}`);
    });

  return (
    <li
      data-testid={`deal-request-${request.id}`}
      className="flex items-center justify-between rounded-md border border-border p-2 text-xs-800"
    >
      <div className="flex flex-col gap-0.5">
        <span className="font-semibold">
          {request.kind} · {request.dealId}
        </span>
        <span className="text-muted-foreground">by {request.userId}</span>
        <span className="text-muted-foreground">
          {request.reason}
        </span>
      </div>
      <div className="flex flex-col items-end gap-1">
        <button
          type="button"
          disabled={pending}
          onClick={onAck}
          className="rounded-md bg-muted px-3 py-1 text-primary-foreground disabled:opacity-50-100"
        >
          Acknowledge
        </button>
        {message ? <span className="text-muted-foreground">{message}</span> : null}
      </div>
    </li>
  );
}
