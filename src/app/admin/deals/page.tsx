import Link from "next/link";
import * as Storage from "@/services/team-15-storage";
import type { DealRecord, DealStatus } from "@/contracts";
import { listAllDealRequests } from "@/services/team-10-dashboard";
import { DealRequestRow } from "@/components/admin/deal-request-row";

type SearchParams = { status?: string };

const DEAL_BUCKET = "deals";

const DEAL_STATUSES: DealStatus[] = [
  "build-started",
  "sourcing",
  "purchased",
  "in-transit",
  "delivered",
  "surrendered",
  "cancelled",
];

const isDealStatus = (raw: string | undefined): raw is DealStatus =>
  Boolean(raw && (DEAL_STATUSES as string[]).includes(raw));

export default async function AdminDealsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const status = isDealStatus(params.status) ? params.status : undefined;

  const [allDeals, requests] = await Promise.all([
    Storage.listRecords<DealRecord>(DEAL_BUCKET),
    listAllDealRequests(),
  ]);
  const deals = status ? allDeals.filter((d) => d.status === status) : allDeals;

  const counts: Record<DealStatus, number> = {
    "build-started": 0,
    sourcing: 0,
    purchased: 0,
    "in-transit": 0,
    delivered: 0,
    surrendered: 0,
    cancelled: 0,
  };
  for (const d of allDeals) counts[d.status]++;

  const submittedRequests = requests.filter((r) => r.status === "submitted");

  return (
    <section data-testid="admin-deals" className="flex flex-col gap-4">
      <div data-testid="admin-deals-status-counts" className="flex flex-wrap gap-2 text-xs">
        {DEAL_STATUSES.map((s) => (
          <Link
            key={s}
            href={status === s ? "/admin/deals" : `/admin/deals?status=${s}`}
            className={`rounded-full border px-3 py-1 ${
              status === s
                ? "border-zinc-900 bg-zinc-900 text-white dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900"
                : "border-zinc-200 text-zinc-700 dark:border-zinc-800 dark:text-zinc-300"
            }`}
          >
            {s}: {counts[s]}
          </Link>
        ))}
      </div>

      <section>
        <h3 className="pb-2 text-sm font-semibold">Deals</h3>
        <table
          className="w-full text-left text-sm"
          data-testid="admin-deals-table"
        >
          <thead className="text-xs text-zinc-500">
            <tr>
              <th className="pb-2">Deal</th>
              <th className="pb-2">User</th>
              <th className="pb-2">Status</th>
              <th className="pb-2">Total</th>
              <th className="pb-2">Created</th>
            </tr>
          </thead>
          <tbody>
            {deals.map((d) => (
              <tr
                key={d.id}
                className="border-t border-zinc-100 dark:border-zinc-900"
              >
                <td className="py-2 text-xs">{d.id}</td>
                <td className="py-2 text-xs">
                  <Link
                    href={`/admin/users/${d.userId}`}
                    className="underline"
                  >
                    {d.userId}
                  </Link>
                </td>
                <td className="py-2 text-xs">{d.status}</td>
                <td className="py-2 text-xs">${d.pricing.total}</td>
                <td className="py-2 text-xs text-zinc-500">
                  {new Date(d.createdAt).toLocaleDateString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {deals.length === 0 ? (
          <p className="text-xs text-zinc-500">No deals match.</p>
        ) : null}
      </section>

      <section>
        <h3 className="pb-2 text-sm font-semibold">
          Pending requests ({submittedRequests.length})
        </h3>
        {submittedRequests.length === 0 ? (
          <p className="text-xs text-zinc-500">Nothing awaiting acknowledgement.</p>
        ) : (
          <ul
            className="flex flex-col gap-2"
            data-testid="admin-pending-requests"
          >
            {submittedRequests.map((req) => (
              <DealRequestRow key={req.id} request={req} />
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}
