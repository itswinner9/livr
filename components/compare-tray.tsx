"use client";

import { useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCompareSet } from "@/components/compare-store";
import { COMPARE_MAX, compareHref } from "@/lib/compare/ids";

export function CompareTray() {
  const pathname = usePathname();
  const { items, remove } = useCompareSet();
  const show = pathname !== "/compare" && items.length > 0;

  useEffect(() => {
    const main = document.querySelector("main");
    if (!(main instanceof HTMLElement)) return;
    main.style.paddingBottom = show ? "6rem" : "";
    return () => {
      main.style.paddingBottom = "";
    };
  }, [show]);

  if (!show) return null;

  const full = items.length >= COMPARE_MAX;

  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-rule bg-surface">
      <div className="dossier-wrap flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between">
        <ul className="flex min-w-0 flex-1 flex-wrap items-center gap-2 text-sm">
          {items.map((item) => (
            <li
              key={item.id}
              className="inline-flex max-w-full items-center gap-2 rounded-md border border-rule bg-paper px-2.5 py-1"
            >
              <span className="truncate text-ink">
                {item.address}
                <span className="text-mute"> · {item.city}</span>
              </span>
              <button
                type="button"
                className="shrink-0 text-xs font-semibold text-mute hover:text-ink"
                onClick={() => remove(item.id)}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <Link
          href={compareHref(items.map((item) => item.id))}
          className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-md bg-accent px-4 text-sm font-semibold text-paper hover:bg-accent-hover"
        >
          {full ? `Full (${COMPARE_MAX}) · Compare` : `Compare ${items.length}`}
        </Link>
      </div>
    </div>
  );
}

export function CompareNavLink({ className }: { className?: string }) {
  const { items } = useCompareSet();
  const href = compareHref(items.map((item) => item.id));
  return (
    <Link href={href} className={className}>
      Compare
      {items.length > 0 ? <span className="ml-1 text-ink">({items.length})</span> : null}
    </Link>
  );
}
