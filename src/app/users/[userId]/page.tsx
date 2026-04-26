import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/services/team-01-auth";
import { loadUserById } from "@/lib/profiles/load-user";
import { ProfileHeader } from "@/components/profiles/profile-header";
import { SavedSearchSummary } from "@/components/profiles/saved-search-summary";

type PageProps = { params: Promise<{ userId: string }> };

export const dynamic = "force-dynamic";

export default async function BuyerProfilePage({ params }: PageProps) {
  const { userId } = await params;
  const viewer = await requireUser();
  const target = userId === viewer.id ? viewer : await loadUserById(userId);
  if (!target) notFound();

  const isSelf = target.id === viewer.id;

  return (
    <section className="mx-auto flex max-w-3xl flex-col gap-6 px-4 py-6 md:py-10">
      <ProfileHeader
        user={target}
        eyebrow={isSelf ? "Your profile" : "Buyer profile"}
        accentLabel={isSelf ? undefined : "Buyer"}
      />

      <div
        data-testid="saved-search-section"
        className="rounded-xl border border-border bg-background p-4-800-950"
      >
        <h2 className="mb-2 text-sm font-semibold text-foreground">
          Saved search
        </h2>
        {isSelf ? (
          <SavedSearchSummary userId={target.id} />
        ) : (
          <p
            data-testid="saved-search-private"
            className="text-sm text-muted-foreground"
          >
            Saved search is private.
          </p>
        )}
      </div>

      <nav
        data-testid="profile-links"
        className="grid gap-3 sm:grid-cols-2"
      >
        {isSelf ? (
          <>
            <Link
              href="/garage"
              data-testid="link-garage"
              className="rounded-xl border border-border bg-background p-4 text-sm font-medium text-foreground hover:bg-background-800-950 dark:hover:bg-muted"
            >
              Go to Garage →
            </Link>
            <Link
              href="/inbox"
              data-testid="link-inbox"
              className="rounded-xl border border-border bg-background p-4 text-sm font-medium text-foreground hover:bg-background-800-950 dark:hover:bg-muted"
            >
              Open Inbox →
            </Link>
          </>
        ) : (
          <p
            data-testid="profile-public-note"
            className="text-sm text-muted-foreground sm:col-span-2"
          >
            Public buyer profile.
          </p>
        )}
      </nav>
    </section>
  );
}
