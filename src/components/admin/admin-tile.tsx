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
      className="flex flex-col gap-1 rounded-lg border border-zinc-200 bg-white p-4 hover:border-zinc-400 hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:border-zinc-600 dark:hover:bg-zinc-900"
    >
      <span className="text-sm text-zinc-500 dark:text-zinc-400">{label}</span>
      <span className="text-2xl font-semibold">{value}</span>
      {hint ? (
        <span className="text-xs text-zinc-500 dark:text-zinc-400">{hint}</span>
      ) : null}
    </Link>
  );
}
