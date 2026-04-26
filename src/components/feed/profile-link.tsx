import Link from "next/link";
import { loadUserById } from "@/lib/profiles/load-user";

// Profile Link from Feed Post. Links to /users/<id> — the canonical buyer
// profile. Dealer and seller posters have richer pages at /dealers/<id>
// and /sellers/<id>; resolving authorId → role would be an extra lookup
// per card, so we route through the buyer profile which handles the
// common case and leaves the seam if a future PR wants to upgrade it.
export async function ProfileLinkFromFeedPost({
  userId,
  label,
}: {
  userId: string;
  label?: string;
}) {
  // If a label is provided, use it directly
  if (label) {
    return (
      <Link
        href={`/users/${userId}`}
        data-testid="feed-profile-link"
        className="text-xs font-medium text-muted-foreground hover:underline"
      >
        {label}
      </Link>
    );
  }

  // Otherwise, try to load the user's display name or email
  const user = await loadUserById(userId);
  const displayText = user?.displayName || user?.email || `@${userId.slice(0, 8)}`;

  return (
    <Link
      href={`/users/${userId}`}
      data-testid="feed-profile-link"
      className="text-xs font-medium text-muted-foreground hover:underline"
    >
      {displayText}
    </Link>
  );
}
