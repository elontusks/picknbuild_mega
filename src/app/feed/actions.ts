"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/services/team-01-auth";
import { uploadUserListing } from "@/services/team-03-supply";
import {
  addComment,
  createFeedPost,
  likePost,
  unlikePost,
  type CreateFeedPostInput,
} from "@/services/team-16-feed";
import {
  FEED_POST_KINDS,
  isFeedPostKind,
  type FeedPost,
  type FeedPostKind,
} from "@/lib/feed/types";
import {
  validateCommentBody,
  validateDealPrice,
  validateListingId,
  validateMediaRefs,
  validatePostBody,
} from "@/lib/feed/validate";

// Server actions for the Team 16 feed. Every write goes through
// requireUser(); anonymous viewers can read /feed and /feed/[postId] but
// cannot post, like, comment, or upload. Page state refreshes via
// revalidatePath("/feed") per ARCHITECTURE §2 live-update.

export type CreatePostFormInput = {
  kind: string;
  body: string;
  listingId?: string;
  mediaRefs?: string[];
  dealPrice?: number;
  buildBeforeRef?: string;
  buildAfterRef?: string;
  recommendationTarget?: string;
  warningSeverity?: "low" | "med" | "high";
};

export type CreatePostResult =
  | { ok: true; post: FeedPost }
  | { ok: false; error: string };

const pickExtras = (
  input: CreatePostFormInput,
): FeedPost["extras"] | undefined => {
  const extras: NonNullable<FeedPost["extras"]> = {};
  if (input.dealPrice !== undefined && Number.isFinite(input.dealPrice)) {
    extras.dealPrice = input.dealPrice;
  }
  if (input.buildBeforeRef) extras.buildBeforeRef = input.buildBeforeRef;
  if (input.buildAfterRef) extras.buildAfterRef = input.buildAfterRef;
  if (input.recommendationTarget)
    extras.recommendationTarget = input.recommendationTarget;
  if (input.warningSeverity) extras.warningSeverity = input.warningSeverity;
  return Object.keys(extras).length > 0 ? extras : undefined;
};

export async function submitFeedPost(
  input: CreatePostFormInput,
): Promise<CreatePostResult> {
  const viewer = await requireUser();
  if (!isFeedPostKind(input.kind)) {
    return {
      ok: false,
      error: `Pick a post type (${FEED_POST_KINDS.join(", ")}).`,
    };
  }
  const kind: FeedPostKind = input.kind;

  // Server-side guards: UI limits are bypassable by anyone POSTing the
  // action directly. Enforce body, media, linked-listing, and deal-price
  // shape before touching storage.
  const bodyCheck = validatePostBody(input.body ?? "");
  if (!bodyCheck.ok) return bodyCheck;
  const mediaRefs = input.mediaRefs ?? [];
  const mediaCheck = validateMediaRefs(mediaRefs);
  if (!mediaCheck.ok) return mediaCheck;
  if (input.listingId) {
    const listingCheck = validateListingId(input.listingId);
    if (!listingCheck.ok) return listingCheck;
  }
  if (input.dealPrice !== undefined) {
    const priceCheck = validateDealPrice(input.dealPrice);
    if (!priceCheck.ok) return priceCheck;
  }

  const serviceInput: CreateFeedPostInput = {
    authorId: viewer.id,
    kind,
    body: input.body ?? "",
    ...(input.listingId ? { listingId: input.listingId } : {}),
    ...(mediaRefs.length > 0 ? { mediaRefs } : {}),
  };
  const extras = pickExtras(input);
  if (extras) serviceInput.extras = extras;

  const result = await createFeedPost(serviceInput);
  if (!result.ok) return result;
  revalidatePath("/feed");
  return { ok: true, post: result.post };
}

export type LikeResult =
  | { ok: true; liked: boolean; count: number }
  | { ok: false; error: string };

export async function togglePostLike(input: {
  postId: string;
  liked: boolean;
}): Promise<LikeResult> {
  try {
    const viewer = await requireUser();
    const result = input.liked
      ? await unlikePost({ postId: input.postId, userId: viewer.id })
      : await likePost({ postId: input.postId, userId: viewer.id });
    if (!result.ok) return result;
    revalidatePath("/feed");
    revalidatePath(`/feed/${input.postId}`);
    return { ok: true, liked: result.liked, count: result.count };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to toggle like",
    };
  }
}

export type CommentResult =
  | { ok: true; commentId: string }
  | { ok: false; error: string };

export async function submitFeedComment(input: {
  postId: string;
  body: string;
}): Promise<CommentResult> {
  const viewer = await requireUser();
  const bodyCheck = validateCommentBody(input.body);
  if (!bodyCheck.ok) return bodyCheck;
  const result = await addComment({
    postId: input.postId,
    userId: viewer.id,
    body: input.body,
  });
  if (!result.ok) return result;
  revalidatePath("/feed");
  revalidatePath(`/feed/${input.postId}`);
  return { ok: true, commentId: result.comment.id };
}

// User Vehicle Upload Form → Team 3 persistence, with an optional companion
// feed post. The form UI lives in /feed/upload; this action is the single
// write path. If the companion post fails we keep the listing.
export type UploadVehicleInput = {
  year: number;
  make: string;
  model: string;
  trim?: string;
  mileage?: number;
  titleStatus: "clean" | "rebuilt" | "unknown";
  price?: number;
  vin?: string;
  photos: string[];
  locationZip?: string;
  sourceUrl?: string;
  feedBody?: string;
};

export type UploadVehicleResult =
  | {
      ok: true;
      listingId: string;
      postId?: string;
      postWarning?: string;
    }
  | { ok: false; error: string; field?: string };

export async function submitVehicleUpload(
  input: UploadVehicleInput,
): Promise<UploadVehicleResult> {
  const viewer = await requireUser();
  const upload = await uploadUserListing({
    ownerUserId: viewer.id,
    form: {
      year: input.year,
      make: input.make,
      model: input.model,
      ...(input.trim ? { trim: input.trim } : {}),
      ...(input.mileage !== undefined ? { mileage: input.mileage } : {}),
      titleStatus: input.titleStatus,
      ...(input.price !== undefined ? { price: input.price } : {}),
      ...(input.vin ? { vin: input.vin } : {}),
      photos: input.photos,
      ...(input.locationZip ? { locationZip: input.locationZip } : {}),
      ...(input.sourceUrl ? { sourceUrl: input.sourceUrl } : {}),
    },
  });
  if (!upload.ok) {
    return {
      ok: false,
      error: upload.reason,
      ...(upload.field ? { field: upload.field } : {}),
    };
  }

  let postId: string | undefined;
  let postWarning: string | undefined;
  const body = input.feedBody?.trim();
  if (body) {
    const post = await createFeedPost({
      authorId: viewer.id,
      kind: "deal",
      body,
      listingId: upload.listing.id,
      ...(input.price !== undefined
        ? { extras: { dealPrice: input.price } }
        : {}),
    });
    if (post.ok) {
      postId = post.post.id;
    } else {
      // Listing persisted, companion post didn't. Surface this to the
      // caller — the form renders a non-fatal warning next to success.
      postWarning = post.error;
    }
  }

  revalidatePath("/feed");
  return {
    ok: true,
    listingId: upload.listing.id,
    ...(postId ? { postId } : {}),
    ...(postWarning ? { postWarning } : {}),
  };
}
