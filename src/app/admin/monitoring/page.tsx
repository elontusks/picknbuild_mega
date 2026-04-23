import { listAdminLogs } from "@/services/team-15-logging";
import * as Storage from "@/services/team-15-storage";
import { STRIPE_EVENTS_BUCKET } from "@/services/team-14-payments";
import { listIngestionRuns } from "@/lib/admin/ingestion";

export default async function AdminMonitoringPage() {
  const [logs, stripeEvents, ingestion] = await Promise.all([
    listAdminLogs(),
    Storage.listRecords<unknown>(STRIPE_EVENTS_BUCKET),
    listIngestionRuns(),
  ]);

  return (
    <section data-testid="admin-monitoring" className="flex flex-col gap-6">
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat
          label="Stripe webhook events"
          value={String(stripeEvents.length)}
        />
        <Stat label="Admin log entries" value={String(logs.length)} />
        <Stat label="Ingestion runs" value={String(ingestion.length)} />
      </div>

      <section>
        <h3 className="pb-2 text-sm font-semibold">Recent admin actions</h3>
        {logs.length === 0 ? (
          <p className="text-xs text-zinc-500">No admin actions logged yet.</p>
        ) : (
          <ul
            className="flex flex-col gap-1 text-xs"
            data-testid="admin-monitoring-log"
          >
            {logs.slice(0, 50).map((entry) => (
              <li key={entry.id} className="flex flex-wrap gap-2">
                <span className="text-zinc-500">
                  {new Date(entry.createdAt).toLocaleString()}
                </span>
                <span className="font-semibold">{entry.action}</span>
                {entry.target ? <span>→ {entry.target}</span> : null}
                <span className="text-zinc-500">by {entry.actor}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section>
        <h3 className="pb-2 text-sm font-semibold">Recent ingestion runs</h3>
        {ingestion.length === 0 ? (
          <p className="text-xs text-zinc-500">No ingestion runs recorded.</p>
        ) : (
          <ul className="flex flex-col gap-1 text-xs">
            {ingestion.slice(0, 20).map((run) => (
              <li key={run.id}>
                {new Date(run.occurredAt).toLocaleString()} · {run.source} · {" "}
                {run.status} · ingested {run.ingested}
                {run.note ? ` — ${run.note}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border border-zinc-200 p-3 text-sm dark:border-zinc-800">
      <div className="text-xs text-zinc-500">{label}</div>
      <div className="text-xl font-semibold">{value}</div>
    </div>
  );
}
