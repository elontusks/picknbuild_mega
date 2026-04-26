import type { User } from "@/contracts";

type Props = {
  user: User;
  eyebrow: string;
  accentLabel?: string;
};

const initials = (u: User): string => {
  const from = (u.displayName ?? u.phone ?? u.id).trim();
  const parts = from.split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    const [a, b] = parts;
    return `${a!.charAt(0)}${b!.charAt(0)}`.toUpperCase();
  }
  return from.slice(0, 2).toUpperCase();
};

export function ProfileHeader({ user, eyebrow, accentLabel }: Props) {
  return (
    <header
      data-testid="profile-header"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: '16px',
        padding: '20px',
        backgroundColor: 'var(--card)',
        borderRadius: '8px',
        border: '1px solid var(--border)',
      }}
    >
      <p style={{ fontSize: '11px', fontWeight: '600', color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.5px', margin: 0 }}>
        {eyebrow}
      </p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div
          aria-hidden
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '50%',
            backgroundColor: 'var(--accent)',
            color: 'var(--accent-foreground)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '18px',
            fontWeight: '700',
            flexShrink: 0,
          }}
        >
          {initials(user)}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
          <h1
            data-testid="profile-display-name"
            style={{ fontSize: '18px', fontWeight: '700', margin: 0, color: 'var(--foreground)' }}
          >
            {user.displayName ?? "PicknBuild member"}
          </h1>
          <p style={{ fontSize: '12px', color: 'var(--muted-foreground)', margin: 0 }}>
            ZIP {user.zip}
            {accentLabel ? ` · ${accentLabel}` : ""}
          </p>
        </div>
      </div>
    </header>
  );
}
