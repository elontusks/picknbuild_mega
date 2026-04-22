// Team 15 — secure storage layer abstraction + sponsor catalog.
//
// Thin in-memory stub so feature teams can call `put` / `get` / `list` without
// a real persistence layer wired up. Real implementation lives in Supabase.

const store = new Map<string, unknown>();

export const putRecord = async <T>(
  bucket: string,
  id: string,
  value: T,
): Promise<void> => {
  store.set(`${bucket}:${id}`, value);
};

export const getRecord = async <T>(
  bucket: string,
  id: string,
): Promise<T | null> => {
  const v = store.get(`${bucket}:${id}`);
  return (v as T) ?? null;
};

export const listRecords = async <T>(bucket: string): Promise<T[]> => {
  const prefix = `${bucket}:`;
  const out: T[] = [];
  for (const [k, v] of store.entries()) {
    if (k.startsWith(prefix)) out.push(v as T);
  }
  return out;
};

export const removeRecord = async (
  bucket: string,
  id: string,
): Promise<void> => {
  store.delete(`${bucket}:${id}`);
};

export type SponsorBlock = {
  id: string;
  path: "dealer" | "auction" | "picknbuild" | "private";
  title: string;
  bodyHtml: string;
  cta?: { label: string; href: string };
};

export const getSponsorsForPath = async (
  path: SponsorBlock["path"],
): Promise<SponsorBlock[]> => [
  {
    id: `sponsor-${path}-1`,
    path,
    title: `${path} partner slot`,
    bodyHtml: "<p>Sponsor fixture.</p>",
  },
];
