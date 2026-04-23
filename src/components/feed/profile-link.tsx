import Link from "next/link";

// Profile Link from Feed Post. Links to /users/<id> — the canonical buyer
// profile. Dealer and seller posters have richer pages at /dealers/<id>
// and /sellers/<id>; resolving authorId → role would be an extra lookup
// per card, so we route through the buyer profile which handles the
// common case and leaves the seam if a future PR wants to upgrade it.
export function ProfileLinkFromFeedPost({
  userId,
  label,
}: {
  userId: string;
  label?: string;
}) {
  return (
    <Link
      href={`/users/${userId}`}
      data-testid="feed-profile-link"
      className="text-xs font-medium text-zinc-700 hover:underline dark:text-zinc-200"
    >
      {label ?? `@${userId}`}
    </Link>
  );
}
