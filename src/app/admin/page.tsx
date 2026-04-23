import * as Storage from "@/services/team-15-storage";
import type { DealRecord, PaymentRecord } from "@/contracts";
import type { Subscription } from "@/services/team-14-payments";
import { PAYMENTS_BUCKET, SUBSCRIPTIONS_BUCKET } from "@/services/team-14-payments";
import { listAllUsers } from "@/lib/admin/users";
import { listAllDealRequests } from "@/services/team-10-dashboard";
import { getLatestIngestionRun } from "@/lib/admin/ingestion";
import { AdminTile } from "@/components/admin/admin-tile";
import { listListings } from "@/lib/listings/store";

const DEAL_BUCKET = "deals";

// Feed isn't wired up yet (Team 16 not live); we render a placeholder tile
// rather than querying a non-existent bucket. If Team 16 lands, swap the
// value for a count from their bucket.
const FEED_LIVE = false;

export default async function AdminOverviewPage() {
  const [users, deals, payments, subscriptions, dealRequests, ingestion] =
    await Promise.all([
      listAllUsers(),
      Storage.listRecords<DealRecord>(DEAL_BUCKET),
      Storage.listRecords<PaymentRecord>(PAYMENTS_BUCKET),
      Storage.listRecords<Subscription>(SUBSCRIPTIONS_BUCKET),
      listAllDealRequests(),
      getLatestIngestionRun(),
    ]);

  // Listings go through Team 3's listings table, not a storage bucket.
  // Pull all statuses so the admin count reflects inventory regardless of
  // "active/stale/removed".
  const listings = await listListings({ status: "any", limit: 100 });

  const pendingRequests = dealRequests.filter(
    (r) => r.status === "submitted",
  ).length;

  return (
    <div
      data-testid="admin-overview"
      className="grid grid-cols-2 gap-3 md:grid-cols-3"
    >
      <AdminTile
        testId="tile-users"
        href="/admin/users"
        label="Users"
        value={String(users.length)}
      />
      <AdminTile
        testId="tile-listings"
        href="/admin/listings"
        label="Listings"
        value={String(listings.length)}
        hint={`(page of up to 100)`}
      />
      <AdminTile
        testId="tile-deals"
        href="/admin/deals"
        label="Deals"
        value={String(deals.length)}
      />
      <AdminTile
        testId="tile-payments"
        href="/admin/payments"
        label="Payments"
        value={String(payments.length)}
      />
      <AdminTile
        testId="tile-subscriptions"
        href="/admin/subscriptions"
        label="Subscriptions"
        value={String(subscriptions.length)}
      />
      <AdminTile
        testId="tile-pending-requests"
        href="/admin/deals"
        label="Pending deal requests"
        value={String(pendingRequests)}
        hint="Upgrade / downgrade / surrender waiting for acknowledgement"
      />
      <AdminTile
        testId="tile-feed"
        href="/admin/monitoring"
        label="Feed activity"
        value={FEED_LIVE ? "—" : "—"}
        hint={FEED_LIVE ? "live" : "Feed not live (Team 16 pending)"}
      />
      <AdminTile
        testId="tile-ingestion"
        href="/admin/monitoring"
        label="Last ingestion run"
        value={
          ingestion
            ? new Date(ingestion.occurredAt).toLocaleString()
            : "no runs yet"
        }
        hint={ingestion ? `${ingestion.source} · ${ingestion.status}` : undefined}
      />
      <AdminTile
        testId="tile-sponsors"
        href="/admin/sponsors"
        label="Sponsor catalog"
        value="Manage"
        hint="Team 5 path sponsor boards"
      />
    </div>
  );
}
