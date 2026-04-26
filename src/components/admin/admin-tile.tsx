import Link from "next/link";

type Props = {
  href: string;
  label: string;
  value: string;
  hint?: string;
  testId?: string;
};

export function AdminTile({ href, label, value, hint, testId }: Props) {
  return (
    <Link
      href={href}
      data-testid={testId}
      className="flex flex-col gap-1 rounded-lg border border-border bg-background p-4 hover:border-zinc-400 hover:bg-background-800-950 dark:hover:bg-muted"
    >
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold">{value}</span>
      {hint ? (
        <span className="text-xs text-muted-foreground">{hint}</span>
      ) : null}
    </Link>
  );
}
