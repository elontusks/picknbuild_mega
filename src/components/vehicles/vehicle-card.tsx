import Link from "next/link";
import type { ListingObject } from "@/contracts";
import { distanceBetweenZips, formatMiles } from "@/lib/geo/zip-distance";

export type VehicleCardVariant = "list" | "detail" | "feed";

type VehicleCardProps = {
  listing: ListingObject;
  variant?: VehicleCardVariant;
  userZip?: string;
  href?: string;
  riskTier?: "low" | "med" | "high";
  footer?: React.ReactNode;
};

const SOURCE_LABEL: Record<ListingObject["source"], string> = {
  copart: "Copart",
  iaai: "IAAI",
  craigslist: "Craigslist",
  dealer: "Dealer",
  user: "Private seller",
  "parsed-link": "External link",
};

const TITLE_LABEL: Record<ListingObject["titleStatus"], string> = {
  clean: "Clean",
  rebuilt: "Rebuilt",
  unknown: "Title unknown",
};

const TITLE_CHIP_CLASS: Record<ListingObject["titleStatus"], string> = {
  clean: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100",
  rebuilt: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100",
  unknown: "bg-zinc-100 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-200",
};

const RISK_LABEL: Record<"low" | "med" | "high", string> = {
  low: "Low risk",
  med: "Medium risk",
  high: "High risk",
};

const RISK_CHIP_CLASS: Record<"low" | "med" | "high", string> = {
  low: "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-100",
  med: "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-100",
  high: "bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-100",
};

const headlinePrice = (listing: ListingObject): { label: string; value: string } => {
  if (listing.source === "copart" || listing.source === "iaai") {
    if (listing.currentBid !== undefined) {
      return { label: "Current bid", value: `$${listing.currentBid.toLocaleString()}` };
    }
    if (listing.binPrice !== undefined) {
      return { label: "Buy it now", value: `$${listing.binPrice.toLocaleString()}` };
    }
  }
  if (listing.price !== undefined) {
    return { label: "Ask", value: `$${listing.price.toLocaleString()}` };
  }
  if (listing.binPrice !== undefined) {
    return { label: "Buy it now", value: `$${listing.binPrice.toLocaleString()}` };
  }
  if (listing.currentBid !== undefined) {
    return { label: "Current bid", value: `$${listing.currentBid.toLocaleString()}` };
  }
  return { label: "Price", value: "—" };
};

const titleLine = (listing: ListingObject): string => {
  const parts = [listing.year.toString(), listing.make, listing.model];
  if (listing.trim) parts.push(listing.trim);
  return parts.join(" ");
};

const photoSrc = (listing: ListingObject): string | null =>
  listing.photos.length > 0 ? (listing.photos[0] ?? null) : null;

export function VehicleCard({
  listing,
  variant = "list",
  userZip,
  href,
  riskTier,
  footer,
}: VehicleCardProps) {
  const distance = distanceBetweenZips(userZip, listing.locationZip);
  const { label: priceLabel, value: priceValue } = headlinePrice(listing);
  const photo = photoSrc(listing);
  const showMileage = listing.mileage !== undefined;

  const body = (
    <article
      data-testid="vehicle-card"
      data-source={listing.source}
      data-variant={variant}
      className="flex flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white text-left shadow-sm transition hover:shadow-md dark:border-zinc-800 dark:bg-zinc-950"
    >
      <div className="relative aspect-[4/3] w-full bg-zinc-100 dark:bg-zinc-900">
        {photo ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={photo}
            alt={`${titleLine(listing)} photo`}
            className="h-full w-full object-cover"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-xs text-zinc-500 dark:text-zinc-400">
            No photo yet
          </div>
        )}
        <span
          className={`absolute left-2 top-2 rounded-full px-2 py-0.5 text-[11px] font-medium ${TITLE_CHIP_CLASS[listing.titleStatus]}`}
          data-testid="title-chip"
        >
          {TITLE_LABEL[listing.titleStatus]}
        </span>
        {listing.status !== "active" ? (
          <span className="absolute right-2 top-2 rounded-full bg-zinc-900/80 px-2 py-0.5 text-[11px] font-medium text-white">
            {listing.status === "stale" ? "Stale" : "Removed"}
          </span>
        ) : null}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-sm font-semibold leading-tight text-zinc-950 dark:text-white">
            {titleLine(listing)}
          </h3>
          <span className="shrink-0 text-xs text-zinc-500 dark:text-zinc-400">
            {SOURCE_LABEL[listing.source]}
          </span>
        </div>
        <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-zinc-600 dark:text-zinc-300">
          {showMileage ? (
            <span data-testid="mileage">
              {listing.mileage!.toLocaleString()} mi
            </span>
          ) : null}
          <span data-testid="distance">{formatMiles(distance)}</span>
          {riskTier ? (
            <span
              data-testid="risk-chip"
              className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${RISK_CHIP_CLASS[riskTier]}`}
            >
              {RISK_LABEL[riskTier]}
            </span>
          ) : null}
        </div>
        <div className="mt-auto flex items-baseline justify-between">
          <span className="text-xs uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {priceLabel}
          </span>
          <span
            className="text-base font-semibold text-zinc-950 dark:text-white"
            data-testid="price"
          >
            {priceValue}
          </span>
        </div>
        {footer ? <div className="pt-1">{footer}</div> : null}
      </div>
    </article>
  );

  if (!href) return body;
  return (
    <Link href={href} className="block focus:outline-none focus:ring-2 focus:ring-offset-2">
      {body}
    </Link>
  );
}
