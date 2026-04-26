import type { TitleStatus } from "@/contracts";

export const TITLE_LABEL: Record<TitleStatus, string> = {
  clean: "Clean",
  rebuilt: "Rebuilt",
  unknown: "Unknown",
};

const CHIP_CLASS: Record<TitleStatus, string> = {
  clean:
    "bg-emerald-100 text-emerald-800-900/40 dark:text-emerald-100",
  rebuilt:
    "bg-amber-100 text-amber-800-900/40 dark:text-amber-100",
  unknown: "bg-muted text-muted-foreground-800",
};

type Props = {
  status: TitleStatus;
  className?: string;
};

export function TitleBadge({ status, className }: Props) {
  return (
    <span
      data-testid="title-badge"
      data-title-status={status}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${CHIP_CLASS[status]} ${className ?? ""}`}
    >
      {TITLE_LABEL[status]}
    </span>
  );
}
