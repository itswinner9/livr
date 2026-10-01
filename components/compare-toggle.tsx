"use client";

import { GitCompare } from "lucide-react";
import { useState } from "react";
import { useCompareSet } from "@/components/compare-store";
import type { CompareItem } from "@/lib/compare/ids";
import { cn } from "@/lib/utils";

export function CompareToggle({
  item,
  className,
  selectedLabel = "In compare",
  idleLabel = "Add to compare",
}: {
  item: CompareItem;
  className?: string;
  selectedLabel?: string;
  idleLabel?: string;
}) {
  const { items, append, remove } = useCompareSet();
  const selected = items.some((entry) => entry.id === item.id);
  const [hint, setHint] = useState("");

  return (
    <span className={cn("inline-flex flex-col items-start gap-1", className)}>
      <button
        type="button"
        aria-pressed={selected}
        className={cn(
          "inline-flex min-h-11 items-center gap-2 rounded-md border px-3.5 text-sm font-semibold",
          selected
            ? "border-ink bg-muted text-ink"
            : "border-rule bg-surface text-ink hover:bg-muted",
        )}
        onClick={() => {
          if (selected) {
            remove(item.id);
            setHint("");
            return;
          }
          const result = append(item);
          setHint(result.ok ? "" : "Compare is full. Remove one first.");
        }}
      >
        <GitCompare className="size-4" aria-hidden />
        {selected ? selectedLabel : idleLabel}
      </button>
      {hint ? (
        <span className="text-xs text-mute" role="status">
          {hint}
        </span>
      ) : null}
    </span>
  );
}
