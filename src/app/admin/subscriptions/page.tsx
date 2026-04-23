import Link from "next/link";
import * as Storage from "@/services/team-15-storage";
import {
  SUBSCRIPTIONS_BUCKET,
  type Subscription,
} from "@/services/team-14-payments";

export default async function AdminSubscriptionsPage() {
  const all = await Storage.listRecords<Subscription>(SUBSCRIPTIONS_BUCKET);
  const sorted = [...all].sort((a, b) =>
    b.updatedAt.localeCompare(a.updatedAt),
  );

  return (
    <section data-testid="admin-subscriptions" className="flex flex-col gap-3">
      <table
        className="w-full text-left text-sm"
        data-testid="admin-subscriptions-table"
      >
        <thead className="text-xs text-zinc-500">
          <tr>
            <th className="pb-2">User</th>
            <th className="pb-2">Plan</th>
            <th className="pb-2">Status</th>
            <th className="pb-2">Amount</th>
            <th className="pb-2">Current period ends</th>
            <th className="pb-2">Cancel at period end</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((s) => (
            <tr
              key={s.id}
              className="border-t border-zinc-100 text-xs dark:border-zinc-900"
            >
              <td className="py-2">
                <Link
                  href={`/admin/users/${s.userId}`}
                  className="underline"
                >
                  {s.userId}
                </Link>
              </td>
              <td className="py-2">{s.plan}</td>
              <td className="py-2">{s.status}</td>
              <td className="py-2">${s.amountUsd}/mo</td>
              <td className="py-2">
                {new Date(s.currentPeriodEnd).toLocaleDateString()}
              </td>
              <td className="py-2">{s.cancelAtPeriodEnd ? "yes" : "no"}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 ? (
        <p className="text-sm text-zinc-500">No subscriptions yet.</p>
      ) : null}
    </section>
  );
}
