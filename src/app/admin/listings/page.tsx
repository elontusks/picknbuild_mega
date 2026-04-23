import Link from "next/link";
import { listListings } from "@/lib/listings/store";
import type { ListingObject, ListingSource, ListingStatus } from "@/contracts";

type SearchParams = { source?: string; status?: string };

const SOURCES: ListingSource[] = [
  "copart",
  "iaai",
  "craigslist",
  "dealer",
  "user",
  "parsed-link",
];
const STATUSES: ListingStatus[] = ["active", "stale", "removed"];

const isSource = (raw: string | undefined): raw is ListingSource =>
  Boolean(raw && (SOURCES as string[]).includes(raw));
const isStatus = (raw: string | undefined): raw is ListingStatus =>
  Boolean(raw && (STATUSES as string[]).includes(raw));

export default async function AdminListingsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const source = isSource(params.source) ? params.source : undefined;
  const statusParam = isStatus(params.status) ? params.status : undefined;

  const listings = await listListings({
    status: statusParam ?? "any",
    ...(source ? { source } : {}),
    limit: 100,
  });

  return (
    <section data-testid="admin-listings" className="flex flex-col gap-3">
      <FilterBar source={source} status={statusParam} />
      <table
        className="w-full text-left text-sm"
        data-testid="admin-listings-table"
      >
        <thead className="text-xs text-zinc-500">
          <tr>
            <th className="pb-2">Listing</th>
            <th className="pb-2">Source</th>
            <th className="pb-2">Status</th>
            <th className="pb-2">Price</th>
            <th className="pb-2">Refreshed</th>
          </tr>
        </thead>
        <tbody>
          {listings.map((l) => (
            <ListingRow key={l.id} listing={l} />
          ))}
        </tbody>
      </table>
      {listings.length === 0 ? (
        <p className="text-sm text-zinc-500">No listings match this filter.</p>
      ) : null}
    </section>
  );
}

function FilterBar({
  source,
  status,
}: {
  source?: ListingSource;
  status?: ListingStatus;
}) {
  return (
    <div className="flex flex-wrap gap-4 text-xs">
      <div className="flex flex-wrap gap-1">
        <span className="text-zinc-500">Source:</span>
        <FilterLink href={`/admin/listings${statusQs(status)}`} active={!source} label="any" />
        {SOURCES.map((s) => (
          <FilterLink
            key={s}
            href={`/admin/listings?source=${s}${status ? `&status=${status}` : ""}`}
            active={source === s}
            label={s}
          />
        ))}
      </div>
      <div className="flex flex-wrap gap-1">
        <span className="text-zinc-500">Status:</span>
        <FilterLink
          href={`/admin/listings${source ? `?source=${source}` : ""}`}
          active={!status}
          label="any"
        />
        {STATUSES.map((s) => (
          <FilterLink
            key={s}
            href={`/admin/listings?status=${s}${source ? `&source=${source}` : ""}`}
            active={status === s}
            label={s}
          />
        ))}
      </div>
    </div>
  );
}

function FilterLink({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`rounded-full border px-2 py-0.5 ${
        active
          ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
          : "border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
      }`}
    >
      {label}
    </Link>
  );
}

function statusQs(status?: ListingStatus) {
  return status ? `?status=${status}` : "";
}

function ListingRow({ listing }: { listing: ListingObject }) {
  return (
    <tr className="border-t border-zinc-100 dark:border-zinc-900">
      <td className="py-2">
        <Link
          href={`/admin/listings/${listing.id}`}
          className="underline underline-offset-2"
        >
          {listing.year} {listing.make} {listing.model}
        </Link>
        <div className="text-xs text-zinc-500">{listing.id}</div>
      </td>
      <td className="py-2 text-xs">{listing.source}</td>
      <td className="py-2 text-xs">{listing.status}</td>
      <td className="py-2 text-xs">
        {listing.price != null
          ? `$${listing.price}`
          : listing.currentBid != null
            ? `bid $${listing.currentBid}`
            : "—"}
      </td>
      <td className="py-2 text-xs text-zinc-500">
        {new Date(listing.lastRefreshedAt).toLocaleDateString()}
      </td>
    </tr>
  );
}
