import Link from "next/link";
import * as Storage from "@/services/team-15-storage";
import type { PaymentRecord } from "@/contracts";
import { PAYMENTS_BUCKET } from "@/services/team-14-payments";

export default async function AdminPaymentsPage() {
  const all = await Storage.listRecords<PaymentRecord>(PAYMENTS_BUCKET);
  const sorted = [...all].sort((a, b) =>
    b.createdAt.localeCompare(a.createdAt),
  );

  return (
    <section data-testid="admin-payments" className="flex flex-col gap-3">
      <table
        className="w-full text-left text-sm"
        data-testid="admin-payments-table"
      >
        <thead className="text-xs text-muted-foreground">
          <tr>
            <th className="pb-2">When</th>
            <th className="pb-2">Kind</th>
            <th className="pb-2">Amount</th>
            <th className="pb-2">Status</th>
            <th className="pb-2">User</th>
            <th className="pb-2">Deal</th>
            <th className="pb-2">Mercury ref</th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((p) => (
            <tr
              key={p.id}
              data-testid={`admin-payment-row-${p.id}`}
              className="border-t border-zinc-100 text-xs-900"
            >
              <td className="py-2">
                {new Date(p.createdAt).toLocaleString()}
              </td>
              <td className="py-2">{p.kind}</td>
              <td className="py-2">${p.amount}</td>
              <td className="py-2">{p.status}</td>
              <td className="py-2">
                <Link
                  href={`/admin/users/${p.userId}`}
                  className="underline"
                >
                  {p.userId}
                </Link>
              </td>
              <td className="py-2">{p.dealId ?? "—"}</td>
              <td className="py-2 text-muted-foreground">{p.mercuryRef}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 ? (
        <p className="text-sm text-muted-foreground">No payments yet.</p>
      ) : null}
    </section>
  );
}
