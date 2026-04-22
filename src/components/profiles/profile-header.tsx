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
      className="flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-950"
    >
      <p className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
        {eyebrow}
      </p>
      <div className="flex items-center gap-3">
        <div
          aria-hidden
          className="flex h-12 w-12 items-center justify-center rounded-full bg-zinc-200 text-sm font-semibold text-zinc-800 dark:bg-zinc-800 dark:text-zinc-200"
        >
          {initials(user)}
        </div>
        <div className="flex flex-col">
          <h1
            data-testid="profile-display-name"
            className="text-lg font-semibold text-zinc-950 dark:text-white"
          >
            {user.displayName ?? "PicknBuild member"}
          </h1>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            ZIP {user.zip}
            {accentLabel ? ` · ${accentLabel}` : ""}
          </p>
        </div>
      </div>
    </header>
  );
}
