import { distanceBetweenZips, formatMiles } from "@/lib/geo/zip-distance";

type DistanceDisplayProps = {
  userZip: string | undefined;
  listingZip: string | undefined;
  className?: string;
};

export function DistanceDisplay({ userZip, listingZip, className }: DistanceDisplayProps) {
  const miles = distanceBetweenZips(userZip, listingZip);
  const label = formatMiles(miles);
  const fromTo =
    userZip && listingZip
      ? `from ${userZip} to ${listingZip}`
      : "distance unavailable";
  return (
    <span
      data-testid="distance-display"
      title={fromTo}
      className={className ?? "text-xs text-zinc-600 dark:text-zinc-300"}
    >
      {label}
    </span>
  );
}
