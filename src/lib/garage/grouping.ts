import type { ListingObject } from "@/contracts";

export type GroupedEntries<T> = Array<{
  key: string;
  label: string;
  entries: T[];
}>;

/**
 * Groups garage entries by Year-Make-Model. Preserves the first-seen order of
 * groups so the UI layout is stable across renders on the same data.
 */
export const groupByYearMakeModel = <T extends { listing: ListingObject }>(
  entries: T[],
): GroupedEntries<T> => {
  const groups = new Map<string, { label: string; entries: T[] }>();
  for (const entry of entries) {
    const { year, make, model } = entry.listing;
    const key = `${year}-${make}-${model}`.toLowerCase();
    const label = `${year} ${make} ${model}`;
    const bucket = groups.get(key);
    if (bucket) {
      bucket.entries.push(entry);
    } else {
      groups.set(key, { label, entries: [entry] });
    }
  }
  return Array.from(groups.entries()).map(([key, value]) => ({
    key,
    label: value.label,
    entries: value.entries,
  }));
};
