type Props = {
  className?: string;
};

export function BestFitBadge({ className }: Props) {
  return (
    <span
      data-testid="best-fit-badge"
      className={`inline-flex items-center rounded-full bg-emerald-500 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white ${className ?? ""}`}
    >
      Best fit
    </span>
  );
}
