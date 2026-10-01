"use client";

import { useId, useState } from "react";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

const WORDS = ["", "Poor", "Fair", "Okay", "Good", "Excellent"];

/**
 * Accessible 1–5 star input built on a native radio group, so arrow keys, form submission,
 * and screen readers work without extra wiring.
 */
export function StarRatingInput({
  name,
  label,
  description,
  required = false,
  defaultValue,
  error,
  size = "md",
}: {
  name: string;
  label: string;
  description?: string;
  required?: boolean;
  defaultValue?: number | null;
  error?: string;
  size?: "md" | "lg";
}) {
  const id = useId();
  const [value, setValue] = useState<number | null>(defaultValue ?? null);
  const [hover, setHover] = useState<number | null>(null);
  const shown = hover ?? value ?? 0;
  const star = size === "lg" ? "size-10" : "size-6";

  return (
    <fieldset aria-describedby={error ? `${id}-error` : description ? `${id}-desc` : undefined}>
      <legend className="text-sm font-medium text-ink">
        {label} {required ? <span className="text-destructive">*</span> : <span className="font-normal text-mute">(optional)</span>}
      </legend>
      {description ? (
        <p id={`${id}-desc`} className="text-xs text-mute">
          {description}
        </p>
      ) : null}
      <div className="mt-1 flex items-center gap-3">
        <div className="flex" onMouseLeave={() => setHover(null)}>
          {[1, 2, 3, 4, 5].map((n) => (
            <label
              key={n}
              className="cursor-pointer rounded p-0.5 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-accent"
              onMouseEnter={() => setHover(n)}
            >
              <input
                type="radio"
                name={name}
                value={n}
                checked={value === n}
                onChange={() => setValue(n)}
                required={required && n === 1}
                className="sr-only"
              />
              <Star
                aria-hidden
                className={cn(
                  star,
                  "transition-colors",
                  n <= shown ? "fill-star text-star" : "fill-transparent text-star-dim",
                )}
              />
              <span className="sr-only">
                {n} {n === 1 ? "star" : "stars"} ({WORDS[n]})
              </span>
            </label>
          ))}
        </div>
        <span className="min-w-16 text-sm text-mute" aria-live="polite">
          {shown ? WORDS[shown] : required ? "Tap to rate" : ""}
        </span>
        {!required && value != null ? (
          <button type="button" className="text-xs text-mute underline" onClick={() => setValue(null)}>
            Clear
          </button>
        ) : null}
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </fieldset>
  );
}
