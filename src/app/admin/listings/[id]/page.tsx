import Link from "next/link";
import { getListing } from "@/lib/listings/store";
import { listModerationLogForTarget } from "@/lib/admin/moderation";
import { ListingModerationPanel } from "@/components/admin/listing-moderation-panel";

export default async function AdminListingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await getListing(id);
  if (!listing) {
    return (
      <section
        className="text-sm text-muted-foreground"
        data-testid="admin-listing-missing"
      >
        Listing not found.{" "}
        <Link className="underline" href="/admin/listings">
          Back
        </Link>
      </section>
    );
  }

  const log = await listModerationLogForTarget("listing", listing.id);

  return (
    <section
      data-testid="admin-listing-detail"
      className="flex flex-col gap-4 text-sm"
    >
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">
          {listing.year} {listing.make} {listing.model}
        </h2>
        <p className="text-xs text-muted-foreground">
          {listing.source} · {listing.status} · {listing.id}
        </p>
      </header>

      <dl className="grid grid-cols-2 gap-2 text-xs md:grid-cols-3">
        <Stat label="Mileage" value={listing.mileage?.toLocaleString() ?? "—"} />
        <Stat
          label="Price"
          value={listing.price != null ? `$${listing.price}` : "—"}
        />
        <Stat
          label="Current bid"
          value={listing.currentBid != null ? `$${listing.currentBid}` : "—"}
        />
        <Stat label="Title" value={listing.titleStatus} />
        <Stat label="VIN" value={listing.vin ?? "—"} />
        <Stat label="ZIP" value={listing.locationZip ?? "—"} />
      </dl>

      <div>
        <a
          href={listing.sourceUrl}
          target="_blank"
          rel="noreferrer noopener"
          className="text-xs underline"
        >
          Open source URL
        </a>
      </div>

      <ListingModerationPanel
        listingId={listing.id}
        currentStatus={listing.status}
      />

      <div>
        <h3 className="pb-2 text-sm font-semibold">Moderation history</h3>
        {log.length === 0 ? (
          <p className="text-xs text-muted-foreground">No actions yet.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-xs">
            {log.map((entry) => (
              <li key={entry.id}>
                {new Date(entry.occurredAt).toLocaleString()} — {entry.action}
                {entry.note ? ` (${entry.note})` : ""} by {entry.actor}
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-2-800">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
