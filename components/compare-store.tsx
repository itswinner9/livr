"use client";

import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  COMPARE_MAX,
  COMPARE_STORAGE_KEY,
  compareHref,
  type CompareItem,
} from "@/lib/compare/ids";

const EVENT = "livrank-compare";

function isItem(value: unknown): value is CompareItem {
  if (!value || typeof value !== "object") return false;
  const item = value as CompareItem;
  return typeof item.id === "string" && typeof item.address === "string" && typeof item.city === "string";
}

export function readCompareItems(): CompareItem[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    const seen = new Set<string>();
    const items: CompareItem[] = [];
    for (const entry of parsed) {
      if (!isItem(entry) || seen.has(entry.id)) continue;
      seen.add(entry.id);
      items.push({
        id: entry.id,
        address: entry.address,
        city: entry.city,
        slug: entry.slug ?? null,
      });
      if (items.length >= COMPARE_MAX) break;
    }
    return items;
  } catch {
    return [];
  }
}

export function writeCompareItems(items: CompareItem[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(COMPARE_STORAGE_KEY, JSON.stringify(items.slice(0, COMPARE_MAX)));
  window.dispatchEvent(new Event(EVENT));
}

export function useCompareSet() {
  const pathname = usePathname();
  const router = useRouter();
  const [items, setItems] = useState<CompareItem[]>([]);

  useEffect(() => {
    setItems(readCompareItems());
    const onChange = () => setItems(readCompareItems());
    window.addEventListener(EVENT, onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener(EVENT, onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const syncUrl = useCallback(
    (next: CompareItem[]) => {
      if (pathname !== "/compare") return;
      const href = compareHref(next.map((item) => item.id));
      if (typeof window !== "undefined" && `${window.location.pathname}${window.location.search}` !== href) {
        window.history.replaceState(null, "", href);
      }
      router.replace(href, { scroll: false });
    },
    [pathname, router],
  );

  const replace = useCallback(
    (next: CompareItem[]) => {
      const capped = next.slice(0, COMPARE_MAX);
      writeCompareItems(capped);
      setItems(capped);
      syncUrl(capped);
    },
    [syncUrl],
  );

  const append = useCallback(
    (item: CompareItem) => {
      const current = readCompareItems();
      if (current.some((entry) => entry.id === item.id)) {
        return { ok: false as const, reason: "duplicate" as const };
      }
      if (current.length >= COMPARE_MAX) {
        return { ok: false as const, reason: "full" as const };
      }
      const next = [...current, item];
      writeCompareItems(next);
      setItems(next);
      syncUrl(next);
      return { ok: true as const };
    },
    [syncUrl],
  );

  const remove = useCallback(
    (id: string) => {
      const next = readCompareItems().filter((entry) => entry.id !== id);
      writeCompareItems(next);
      setItems(next);
      syncUrl(next);
    },
    [syncUrl],
  );

  return { items, append, remove, replace, full: items.length >= COMPARE_MAX };
}
