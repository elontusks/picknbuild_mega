import "server-only";

// Team 10 — Post-Deposit Dashboard.
//
// Publishes the `deal_requests` bucket surface so Team 15's admin queue can
// read the upgrade / downgrade / voluntary-surrender requests the dashboard
// writes. Team 12 can also subscribe if it ever grows a workflow that
// consumes them (none today). Do not reach into `src/lib/deal-requests`
// from outside Team 10 — go through this file so the public contract stays
// in one place.

export {
  DEAL_REQUESTS_BUCKET,
  getDealRequest,
  putDealRequest,
  listDealRequestsForUser,
  listDealRequestsForDeal,
  listAllDealRequests,
} from "@/lib/deal-requests/storage";

export type {
  DealRequest,
  DealRequestKind,
  DealRequestStatus,
} from "@/lib/deal-requests/types";
