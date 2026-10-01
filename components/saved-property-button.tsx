"use client";

import { toggleSave } from "@/lib/actions/auth";
import { useState } from "react";

export function SavedButton({
  propertyId,
  variant = "button",
}: {
  propertyId: string;
  variant?: "button" | "icon";
}) {
  const [message, setMessage] = useState<string | null>(null);
  return (
    <span className="inline-flex items-center gap-2">
      <button
        type="button"
        aria-label="Save"
        className={
          variant === "icon"
            ? "flex size-8 items-center justify-center rounded-md border border-rule bg-surface text-mute hover:text-accent"
            : "inline-flex min-h-11 items-center rounded-md border border-rule bg-surface px-3.5 text-sm font-semibold text-ink hover:bg-muted"
        }
        onClick={async (event) => {
          event.preventDefault();
          event.stopPropagation();
          const result = await toggleSave(propertyId);
          setMessage(result.error ?? result.ok ?? null);
        }}
      >
        {variant === "icon" ? (
          <svg viewBox="0 0 24 24" className="size-4" fill="none" stroke="currentColor" strokeWidth="1.8">
            <path d="M7 4.5h10a1 1 0 0 1 1 1V20l-6-3.2L6 20V5.5a1 1 0 0 1 1-1Z" />
          </svg>
        ) : (
          "Save"
        )}
      </button>
      {message && variant !== "icon" ? <span className="text-xs text-mute">{message}</span> : null}
    </span>
  );
}
