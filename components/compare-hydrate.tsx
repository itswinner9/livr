"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { readCompareItems, writeCompareItems } from "@/components/compare-store";
import { compareHref, type CompareItem } from "@/lib/compare/ids";

export function CompareHydrate({ items }: { items: CompareItem[] }) {
  const router = useRouter();
  const did = useRef(false);

  useEffect(() => {
    if (did.current) return;
    did.current = true;
    if (items.length > 0) {
      writeCompareItems(items);
      return;
    }
    const stored = readCompareItems();
    if (stored.length > 0) {
      router.replace(compareHref(stored.map((item) => item.id)));
    }
  }, [items, router]);

  return null;
}
