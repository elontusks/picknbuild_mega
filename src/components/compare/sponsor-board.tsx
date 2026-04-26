"use client";

import { useEffect, useState } from "react";
import type { PathKind } from "@/contracts";

export type SponsorBlock = {
  id: string;
  path: PathKind;
  title: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
};

type Props = {
  path: PathKind;
  initial?: SponsorBlock[];
};

async function fetchSponsors(path: PathKind): Promise<SponsorBlock[]> {
  const res = await fetch(`/api/sponsors/${encodeURIComponent(path)}`, {
    cache: "no-store",
  });
  if (!res.ok) return [];
  const body = (await res.json().catch(() => ({}))) as {
    sponsors?: SponsorBlock[];
  };
  return body.sponsors ?? [];
}

/**
 * Path-specific sponsor blocks. Reads the sponsor catalog (Team 15) keyed by
 * path and renders whatever the operator has curated. Falls back to nothing
 * if the catalog is empty or the fetch fails — sponsors are never blocking.
 */
export function SponsorBoard({ path, initial }: Props) {
  const [sponsors, setSponsors] = useState<SponsorBlock[]>(initial ?? []);

  useEffect(() => {
    if (initial !== undefined) return;
    let cancelled = false;
    fetchSponsors(path).then((rows) => {
      if (!cancelled) setSponsors(rows);
    });
    return () => {
      cancelled = true;
    };
  }, [path, initial]);

  if (sponsors.length === 0) return null;

  return (
    <aside
      data-testid={`sponsor-board-${path}`}
      data-path={path}
      aria-label={`${path} sponsors`}
      className="flex flex-col gap-2 rounded-lg border border-dashed border-border bg-background p-2 text-[11px]-700-900/40"
    >
      <p className="font-semibold uppercase tracking-wide text-muted-foreground">
        Sponsored for this path
      </p>
      <ul className="flex flex-col gap-2">
        {sponsors.map((s) => (
          <li
            key={s.id}
            data-testid={`sponsor-block-${s.id}`}
            className="rounded border border-border bg-background p-2-800-950"
          >
            <p className="text-xs font-semibold text-foreground">
              {s.title}
            </p>
            <div
              className="mt-1 text-[11px] leading-snug text-muted-foreground"
              // Sponsor copy is operator-curated in Team 15's catalog. The
              // catalog is the single source of trust — rendering as HTML is
              // intentional so operators can include links.
              dangerouslySetInnerHTML={{ __html: s.bodyHtml }}
            />
            {s.cta ? (
              <a
                href={s.cta.href}
                className="mt-1 inline-block text-[11px] font-semibold text-emerald-700 underline hover:text-emerald-900 dark:text-emerald-300"
                target="_blank"
                rel="noreferrer noopener"
                data-testid={`sponsor-cta-${s.id}`}
              >
                {s.cta.label}
              </a>
            ) : null}
          </li>
        ))}
      </ul>
    </aside>
  );
}
