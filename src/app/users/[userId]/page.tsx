import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { requireUser } from "@/services/team-01-auth";
import { loadUserById } from "@/lib/profiles/load-user";
import { ProfileHeader } from "@/components/profiles/profile-header";
import { SavedSearchSummary } from "@/components/profiles/saved-search-summary";
import { signOut } from "@/services/team-01-auth";

type PageProps = { params: Promise<{ userId: string }> };

export const dynamic = "force-dynamic";

async function handleSignOut() {
  "use server";
  await signOut();
  redirect("/login");
}

export default async function BuyerProfilePage({ params }: PageProps) {
  const { userId } = await params;
  const viewer = await requireUser();
  const target = userId === viewer.id ? viewer : await loadUserById(userId);
  if (!target) notFound();

  const isSelf = target.id === viewer.id;

  return (
    <main style={{ minHeight: '100vh', backgroundColor: 'var(--background)', color: 'var(--foreground)' }}>
      <section style={{ maxWidth: '800px', margin: '0 auto', padding: '24px', display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <ProfileHeader
          user={target}
          eyebrow={isSelf ? "Your profile" : "Buyer profile"}
          accentLabel={isSelf ? undefined : "Buyer"}
        />

        {isSelf && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ padding: '16px', backgroundColor: 'var(--card)', borderRadius: '8px', border: `1px solid var(--border)` }}>
              <h2 style={{ fontSize: '15px', fontWeight: '600', margin: '0 0 12px 0', color: 'var(--foreground)' }}>
                Saved Search
              </h2>
              <SavedSearchSummary userId={target.id} />
            </div>

            <nav style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '12px' }}>
              <Link
                href="/garage"
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-foreground)',
                  border: 'none',
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'opacity 200ms',
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
              >
                Go to Garage →
              </Link>
              <Link
                href="/inbox"
                style={{
                  padding: '12px 16px',
                  backgroundColor: 'var(--background)',
                  color: 'var(--foreground)',
                  border: `1px solid var(--border)`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  textDecoration: 'none',
                  textAlign: 'center',
                  cursor: 'pointer',
                  transition: 'all 200ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--muted)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'var(--background)';
                }}
              >
                Open Inbox →
              </Link>
            </nav>

            <form action={handleSignOut} style={{ marginTop: '8px' }}>
              <button
                type="submit"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  backgroundColor: 'transparent',
                  color: '#ef4444',
                  border: `1px solid #ef4444`,
                  borderRadius: '6px',
                  fontSize: '13px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 200ms',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(239, 68, 68, 0.1)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'transparent';
                }}
              >
                Sign Out
              </button>
            </form>
          </div>
        )}

        {!isSelf && (
          <div style={{ padding: '16px', backgroundColor: 'var(--muted)', borderRadius: '8px', textAlign: 'center' }}>
            <p style={{ fontSize: '13px', color: 'var(--muted-foreground)', margin: 0 }}>
              This is a public buyer profile.
            </p>
          </div>
        )}
      </section>
    </main>
  );
}
