// Server-side validation for feed writes. The client UI caps input
// (media-upload.tsx: 4 files × ~1.5MB, composer body is just a textarea),
// but those caps are bypassable by anyone POSTing to the action directly.
// Enforce here so the persistence layer never sees a pathological write.

export const MAX_BODY_CHARS = 10_000;
export const MAX_COMMENT_CHARS = 2_000;
export const MAX_MEDIA_REFS = 4;
export const MAX_MEDIA_BYTES = 2_000_000;

const DATA_URL_IMAGE_PREFIX = "data:image/";
const LISTING_ID_PATTERN = /^listing_[a-zA-Z0-9_-]+$/;

export type FeedValidation =
  | { ok: true }
  | { ok: false; error: string };

// Rough base64 decoded-size estimate: 3 bytes per 4 base64 chars. Counts
// the payload after the comma. We want an upper bound that rejects obvious
// abuse without FileReader-decoding on every request.
const dataUrlByteEstimate = (ref: string): number => {
  const comma = ref.indexOf(",");
  const payload = comma >= 0 ? ref.slice(comma + 1) : ref;
  return Math.floor((payload.length * 3) / 4);
};

export const validatePostBody = (raw: string): FeedValidation => {
  const body = raw?.trim() ?? "";
  if (body.length < 1) return { ok: false, error: "Post body cannot be empty." };
  if (body.length > MAX_BODY_CHARS) {
    return {
      ok: false,
      error: `Post body is too long (max ${MAX_BODY_CHARS} characters).`,
    };
  }
  return { ok: true };
};

export const validateCommentBody = (raw: string): FeedValidation => {
  const body = raw?.trim() ?? "";
  if (body.length < 1) return { ok: false, error: "Comment cannot be empty." };
  if (body.length > MAX_COMMENT_CHARS) {
    return {
      ok: false,
      error: `Comment is too long (max ${MAX_COMMENT_CHARS} characters).`,
    };
  }
  return { ok: true };
};

export const validateMediaRefs = (refs: string[]): FeedValidation => {
  if (refs.length > MAX_MEDIA_REFS) {
    return {
      ok: false,
      error: `At most ${MAX_MEDIA_REFS} media items per post.`,
    };
  }
  for (const ref of refs) {
    if (typeof ref !== "string" || ref.length === 0) {
      return { ok: false, error: "Media ref must be a non-empty string." };
    }
    if (!ref.startsWith(DATA_URL_IMAGE_PREFIX)) {
      return {
        ok: false,
        error: "Media ref must be a data:image/... URL.",
      };
    }
    if (dataUrlByteEstimate(ref) > MAX_MEDIA_BYTES) {
      return {
        ok: false,
        error: `Media item exceeds the ${Math.round(MAX_MEDIA_BYTES / 1_000_000)}MB cap.`,
      };
    }
  }
  return { ok: true };
};

export const validateListingId = (id: string): FeedValidation => {
  if (!LISTING_ID_PATTERN.test(id)) {
    return { ok: false, error: "Invalid listing id." };
  }
  return { ok: true };
};

export const validateDealPrice = (price: number): FeedValidation => {
  if (!Number.isFinite(price) || price < 0) {
    return {
      ok: false,
      error: "Deal price must be a non-negative finite number.",
    };
  }
  return { ok: true };
};
