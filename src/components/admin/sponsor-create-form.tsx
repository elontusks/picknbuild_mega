"use client";

import { useState, useTransition } from "react";
import { upsertSponsorAction } from "@/app/admin/actions";

export function SponsorCreateForm() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);

  return (
    <form
      data-testid="admin-sponsor-create"
      className="flex flex-col gap-2 rounded-md border border-border p-3 text-xs-800"
      onSubmit={(e) => {
        e.preventDefault();
        const form = e.currentTarget as HTMLFormElement;
        const fd = new FormData(form);
        const path = fd.get("path") as
          | "dealer"
          | "auction"
          | "picknbuild"
          | "private";
        const title = (fd.get("title") as string) ?? "";
        const bodyHtml = (fd.get("bodyHtml") as string) ?? "";
        const ctaLabel = (fd.get("ctaLabel") as string) ?? "";
        const ctaHref = (fd.get("ctaHref") as string) ?? "";
        startTransition(async () => {
          const res = await upsertSponsorAction({
            path,
            title,
            bodyHtml,
            ...(ctaLabel ? { ctaLabel } : {}),
            ...(ctaHref ? { ctaHref } : {}),
          });
          setMessage(res.ok ? "Saved." : `Error: ${res.error}`);
          if (res.ok) form.reset();
        });
      }}
    >
      <label className="flex flex-col gap-1">
        Path
        <select
          name="path"
          className="rounded-md border border-border px-2 py-1-800"
          defaultValue="picknbuild"
        >
          <option value="dealer">dealer</option>
          <option value="auction">auction</option>
          <option value="picknbuild">picknbuild</option>
          <option value="private">private</option>
        </select>
      </label>
      <input
        name="title"
        required
        placeholder="Title"
        className="rounded-md border border-border px-2 py-1-800"
      />
      <textarea
        name="bodyHtml"
        rows={3}
        placeholder="Body HTML"
        className="rounded-md border border-border px-2 py-1-800"
      />
      <input
        name="ctaLabel"
        placeholder="CTA label (optional)"
        className="rounded-md border border-border px-2 py-1-800"
      />
      <input
        name="ctaHref"
        placeholder="CTA href (optional)"
        className="rounded-md border border-border px-2 py-1-800"
      />
      <button
        type="submit"
        disabled={pending}
        className="self-start rounded-md bg-muted px-3 py-1 text-primary-foreground disabled:opacity-50-100"
      >
        Save sponsor
      </button>
      {message ? <p className="text-muted-foreground">{message}</p> : null}
    </form>
  );
}
