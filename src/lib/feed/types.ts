import type { ISOTimestamp } from "@/contracts";

// Team 16 — feed-local types. Not a cross-team contract: feed posts are
// only ever read/written by Team 16 and Team 15 (admin tile count). If a
// future team needs them, promote the shape into src/contracts/.

export type FeedPostKind =
  | "deal"
  | "problem"
  | "question"
  | "build"
  | "recommendation"
  | "warning";

export type FeedComment = {
  id: string;
  postId: string;
  userId: string;
  body: string;
  createdAt: ISOTimestamp;
};

export type FeedPost = {
  id: string;
  authorId: string;
  kind: FeedPostKind;
  body: string;
  listingId?: string;
  mediaRefs?: string[];
  createdAt: ISOTimestamp;
  // Per-kind optional fields kept as a shallow map so new kinds can add
  // fields without a contract migration. Templates read what they need.
  extras?: {
    dealPrice?: number;
    buildBeforeRef?: string;
    buildAfterRef?: string;
    recommendationTarget?: string;
    warningSeverity?: "low" | "med" | "high";
  };
};

export const FEED_POST_KINDS: readonly FeedPostKind[] = [
  "deal",
  "problem",
  "question",
  "build",
  "recommendation",
  "warning",
] as const;

export const isFeedPostKind = (value: unknown): value is FeedPostKind =>
  typeof value === "string" &&
  (FEED_POST_KINDS as readonly string[]).includes(value);
