import * as Storage from "@/services/team-15-storage";
import type { DealRecord, PaymentRecord } from "@/contracts";
import type { Subscription } from "@/services/team-14-payments";
import { PAYMENTS_BUCKET, SUBSCRIPTIONS_BUCKET } from "@/services/team-14-payments";
import { listAllUsers } from "@/lib/admin/users";
import { listAllDealRequests } from "@/services/team-10-dashboard";
import { getLatestIngestionRun } from "@/lib/admin/ingestion";
import { countListings } from "@/lib/admin/listings";
import { countFeedPosts } from "@/services/team-16-feed";
import { AdminTile } from "@/components/admin/admin-tile";

const DEAL_BUCKET = "deals";

// Team 16 Feed is live — the tile shows the post count read from the feed
// index bucket. Flip this to false only if the feed is temporarily dark.
const FEED_LIVE = true;

export default async function AdminOverviewPage() {
  const [
    users,
    deals,
    payments,
    subscriptions,
    dealRequests,
    ingestion,
    listingsCount,
    feedPostCount,
  ] = await Promise.all([
    listAllUsers(),
    Storage.listRecords<DealRecord>(DEAL_BUCKET),
    Storage.listRecords<PaymentRecord>(PAYMENTS_BUCKET),
    Storage.listRecords<Subscription>(SUBSCRIPTIONS_BUCKET),
    listAllDealRequests(),
    getLatestIngestionRun(),
    countListings(),
    FEED_LIVE ? countFeedPosts() : Promise.resolve(0),
  ]);

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
        value={String(listingsCount)}
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
        value={FEED_LIVE ? String(feedPostCount) : "—"}
        hint={FEED_LIVE ? "posts" : "Feed not live"}
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
