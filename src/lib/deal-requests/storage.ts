import "server-only";

import * as Storage from "@/services/team-15-storage";
import type { DealRequest } from "./types";

// New Team-10-owned bucket. Flagged in the PR body: Team 15's admin queue will
// read from here. Do not rename without coordinating with Team 15.
export const DEAL_REQUESTS_BUCKET = "deal_requests";

export const putDealRequest = async (request: DealRequest): Promise<void> => {
  await Storage.putRecord(DEAL_REQUESTS_BUCKET, request.id, request);
};

export const getDealRequest = (id: string): Promise<DealRequest | null> =>
  Storage.getRecord<DealRequest>(DEAL_REQUESTS_BUCKET, id);

export const listDealRequestsForUser = async (
  userId: string,
): Promise<DealRequest[]> => {
  const all = await Storage.listRecords<DealRequest>(DEAL_REQUESTS_BUCKET);
  return all
    .filter((r) => r.userId === userId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const listDealRequestsForDeal = async (
  dealId: string,
): Promise<DealRequest[]> => {
  const all = await Storage.listRecords<DealRequest>(DEAL_REQUESTS_BUCKET);
  return all
    .filter((r) => r.dealId === dealId)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};

export const listAllDealRequests = async (): Promise<DealRequest[]> => {
  const all = await Storage.listRecords<DealRequest>(DEAL_REQUESTS_BUCKET);
  return all.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
};
