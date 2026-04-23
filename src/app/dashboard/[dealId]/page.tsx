import { redirect } from "next/navigation";

// Deep link form: /dashboard/<dealId> just redirects into the query-param
// route so the main page owns the rendering + ownership guard.
export default async function DashboardDealPage({
  params,
}: {
  params: Promise<{ dealId: string }>;
}) {
  const { dealId } = await params;
  redirect(`/dashboard?dealId=${encodeURIComponent(dealId)}`);
}
