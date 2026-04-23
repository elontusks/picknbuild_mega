import type { User } from "@/contracts";
import type { FeedPost } from "./types";

// Feed clustering stub. v1: sort newest-first. The signature accepts an
// optional viewer so a later PR can swap in ranking by follow graph /
// interests without touching callers. Keep pure — the service pre-fetches
// the posts, this only reorders.
export const clusterFeedPosts = (
  posts: FeedPost[],
  _viewer?: User | null,
): FeedPost[] =>
  [...posts].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
