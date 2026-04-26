import type { InspectionResult } from "@/services/team-11-intelligence";

type InspectionPanelProps = {
  inspection: InspectionResult;
};

const STATUS_LABEL: Record<InspectionResult["status"], string> = {
  pending: "Ready to request",
  scheduled: "Scheduled",
  "in-progress": "In progress",
  completed: "Completed",
  unavailable: "Not available for this source",
};

const RECO_LABEL: Record<
  NonNullable<InspectionResult["recommendation"]>,
  string
> = {
  proceed: "Proceed",
  negotiate: "Negotiate",
  "walk-away": "Walk away",
};

export function InspectionPanel({ inspection }: InspectionPanelProps) {
  return (
    <section
      data-testid="inspection-panel"
      data-status={inspection.status}
      aria-label="Inspection"
      className="space-y-1 rounded-lg border border-border bg-background p-3-800-950"
    >
      <header className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Inspection
        </h3>
        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase text-muted-foreground-800">
          {STATUS_LABEL[inspection.status]}
        </span>
      </header>
      {inspection.partnerName ? (
        <p className="text-xs text-muted-foreground">
          Partner:{" "}
          <span className="font-medium text-foreground">
            {inspection.partnerName}
          </span>
        </p>
      ) : null}
      {inspection.conditionSummary ? (
        <p className="text-xs text-muted-foreground">
          {inspection.conditionSummary}
        </p>
      ) : null}
      {inspection.recommendation ? (
        <p
          data-testid="inspection-reco"
          className="text-xs font-medium text-foreground"
        >
          Recommendation: {RECO_LABEL[inspection.recommendation]}
        </p>
      ) : null}
    </section>
  );
}
