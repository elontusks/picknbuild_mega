import Link from "next/link";
import { getUserForAdmin } from "@/lib/admin/users";
import { listDealsForUser } from "@/services/team-12-workflows";
import { listPaymentsForUser } from "@/services/team-14-payments";
import { UserModerationPanel } from "@/components/admin/user-moderation-panel";

export default async function AdminUserDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const user = await getUserForAdmin(id);
  if (!user) {
    return (
      <section className="text-sm text-muted-foreground" data-testid="admin-user-missing">
        User not found. <Link className="underline" href="/admin/users">Back</Link>
      </section>
    );
  }

  const [deals, payments] = await Promise.all([
    listDealsForUser(user.id),
    listPaymentsForUser(user.id),
  ]);

  const totalPaid = payments
    .filter((p) => p.status === "succeeded" && p.kind !== "refund")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <section
      data-testid="admin-user-detail"
      className="flex flex-col gap-4 text-sm"
    >
      <header className="flex flex-col gap-1">
        <h2 className="text-lg font-semibold">
          {user.displayName ?? user.email ?? user.id}
        </h2>
        <p className="text-xs text-muted-foreground">
          {user.role} · {user.zip} · {user.email ?? user.phone}
        </p>
      </header>

      <dl className="grid grid-cols-3 gap-3 text-xs">
        <Stat label="Budget" value={user.budget ? `$${user.budget}` : "—"} />
        <Stat
          label="Credit"
          value={
            user.noCredit
              ? "no credit"
              : user.creditScore != null
                ? String(user.creditScore)
                : "—"
          }
        />
        <Stat label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
        <Stat label="Deals" value={String(deals.length)} />
        <Stat label="Payments" value={String(payments.length)} />
        <Stat label="Total paid" value={`$${totalPaid}`} />
      </dl>

      <div>
        <h3 className="pb-2 text-sm font-semibold">Deals</h3>
        {deals.length === 0 ? (
          <p className="text-xs text-muted-foreground">No deals yet.</p>
        ) : (
          <ul className="flex flex-col gap-1">
            {deals.map((d) => (
              <li key={d.id} className="text-xs">
                {d.id} · {d.status} · ${d.pricing.total}
              </li>
            ))}
          </ul>
        )}
      </div>

      <UserModerationPanel userId={user.id} />
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-border p-3-800">
      <div className="text-muted-foreground">{label}</div>
      <div className="font-semibold">{value}</div>
    </div>
  );
}
