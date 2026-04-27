import type { TitleStatus } from "@/contracts";

export const TITLE_LABEL: Record<TitleStatus, string> = {
  clean: "Clean",
  rebuilt: "Rebuilt",
  unknown: "Unknown",
};

const CHIP_CLASS: Record<TitleStatus, string> = {
  clean: "bg-emerald-400 !text-black",
  rebuilt: "bg-amber-300 !text-black",
  unknown: "bg-muted text-muted-foreground",
};

type Props = {
  status: TitleStatus;
  className?: string;
};

export function TitleBadge({ status, className }: Props) {
  const isLight = status === "clean" || status === "rebuilt";
  return (
    <span
      data-testid="title-badge"
      data-title-status={status}
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium ${CHIP_CLASS[status]} ${className ?? ""}`}
      style={isLight ? { color: "#000000" } : undefined}
    >
      {TITLE_LABEL[status]}
    </span>
  );
}
