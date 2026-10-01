export const COMPARE_MAX = 3;
export const COMPARE_STORAGE_KEY = "livrank-compare-ids";

export type CompareItem = {
  id: string;
  address: string;
  city: string;
  slug: string | null;
};

export function parseCompareIds(raw?: string | string[] | null): string[] {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (!value) return [];
  const seen = new Set<string>();
  const ids: string[] = [];
  for (const part of value.split(",")) {
    const id = part.trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    ids.push(id);
    if (ids.length >= COMPARE_MAX) break;
  }
  return ids;
}

export function serializeCompareIds(ids: string[]): string {
  return parseCompareIds(ids.join(",")).join(",");
}

export function compareHref(ids: string[]): string {
  const list = parseCompareIds(ids.join(","));
  return list.length ? `/compare?ids=${encodeURIComponent(list.join(","))}` : "/compare";
}

export function appendCompareId(
  ids: string[],
  id: string,
): { ids: string[]; ok: true } | { ids: string[]; ok: false; reason: "full" | "duplicate" } {
  if (ids.includes(id)) return { ids, ok: false, reason: "duplicate" };
  if (ids.length >= COMPARE_MAX) return { ids, ok: false, reason: "full" };
  return { ids: [...ids, id], ok: true };
}

export function removeCompareId(ids: string[], id: string): string[] {
  return ids.filter((item) => item !== id);
}

export function itemFromProperty(property: {
  id: string;
  address_line_1: string;
  city: string;
  slug: string | null;
}): CompareItem {
  return {
    id: property.id,
    address: property.address_line_1,
    city: property.city,
    slug: property.slug,
  };
}
