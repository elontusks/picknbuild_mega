import { loadDashboard } from "./actions";
import { DashboardSummary } from "@/components/dashboard/dashboard-summary";
import { StatusTimeline } from "@/components/dashboard/status-timeline";
import { PaymentHistoryView } from "@/components/dashboard/payment-history-view";
import { WireInstructionsDisplay } from "@/components/dashboard/wire-instructions-display";
import { DealRequestForm } from "@/components/dashboard/deal-request-form";
import { OutstandingRequests } from "@/components/dashboard/outstanding-requests";
import { PostConversionStatusView } from "@/components/dashboard/post-conversion-status-view";
import { DealSwitcher } from "@/components/dashboard/deal-switcher";

// Cross-cutting rule from ARCHITECTURE §2: post-deposit surfaces are
// live-updating. The page is dynamic (`force-dynamic`) so revalidatePath
// after a deal-request write picks up fresh data without a manual reload.
export const dynamic = "force-dynamic";

type SearchParams = {
  dealId?: string;
  // Team 9's DepositStep redirects to /dashboard?deposit=<paymentId> after
  // the charge confirms — we accept the param but don't branch on it for
  // data loading. It's there so the UI can flash a "deposit received"
  // banner while the async onDepositReceived finishes.
  deposit?: string;
};

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const result = await loadDashboard(
    params.dealId ? { dealId: params.dealId } : undefined,
  );

  if (!result.ok) {
    return (
      <main
        data-testid="dashboard-empty"
        className="mx-auto flex max-w-3xl flex-col gap-4 p-6"
      >
        <h1 className="text-lg font-semibold">Dashboard</h1>
        {result.reason === "no-deals" && params.deposit ? (
          <p className="text-sm text-muted-foreground">
            Deposit received — payment id {params.deposit}. Your build is
            being prepared; this page will populate in a moment.
          </p>
        ) : result.reason === "no-deals" ? (
          <p className="text-sm text-muted-foreground">
            You don't have any deals yet. Sign a picknbuild agreement and
            place a deposit to get started.
          </p>
        ) : result.reason === "forbidden" ? (
          <p className="text-sm text-red-600">This deal isn't yours.</p>
        ) : (
          <p className="text-sm text-red-600">Deal not found.</p>
        )}
      </main>
    );
  }

  const { snapshot } = result;
  const { deal, otherDeals, payments, wireInstructions, requests, conversionState } =
    snapshot;

  return (
    <main
      data-testid="dashboard"
      className="mx-auto flex max-w-4xl flex-col gap-4 p-6"
    >
      {params.deposit ? (
        <p
          data-testid="deposit-banner"
          className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm text-emerald-800-900/40-950/20 dark:text-emerald-300"
        >
          Deposit received — payment id {params.deposit}.
        </p>
      ) : null}

      <DashboardSummary deal={deal} />

      {otherDeals.length > 0 ? (
        <DealSwitcher currentDealId={deal.id} deals={[deal, ...otherDeals]} />
      ) : null}

      <PostConversionStatusView
        deal={deal}
        conversionState={conversionState}
      />

      <StatusTimeline timeline={deal.timeline} />

      <OutstandingRequests requests={requests} />

      <PaymentHistoryView payments={payments} />

      <WireInstructionsDisplay wire={wireInstructions} />

      <DealRequestForm dealId={deal.id} />
    </main>
  );
}
