import type { ISOTimestamp } from "@/contracts";

// Post-deposit request a buyer can raise from the dashboard. Team 12 owns
// `DealRecord`; these rows are Team 10's ledger of *requests* against a deal
// that an admin (Team 15) or a workflow owner (Team 12) acts on out of band.
// See ARCHITECTURE §5 Team 10 — "Upgrade / Downgrade / Voluntary-Surrender
// request events → Team 12 + Team 15 admin queue".
export type DealRequestKind = "upgrade" | "downgrade" | "surrender";

export type DealRequestStatus = "submitted" | "acknowledged" | "resolved";

export type DealRequest = {
  id: string;
  userId: string;
  dealId: string;
  kind: DealRequestKind;
  reason: string;
  status: DealRequestStatus;
  createdAt: ISOTimestamp;
};
