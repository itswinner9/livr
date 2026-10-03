"use client";

import { useEffect, useId, useMemo, useRef } from "react";
import { ImagePlus, X } from "lucide-react";
import {
  REVIEW_PHOTO_MAX,
  REVIEW_PHOTO_MAX_BYTES,
  isReviewPhotoType,
} from "@/lib/reviews/photos";
import { cn } from "@/lib/utils";

export function ReviewPhotoPicker({
  files,
  onChange,
  error,
}: {
  files: File[];
  onChange: (files: File[]) => void;
  error?: string;
}) {
  const inputId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const previews = useMemo(
    () => files.map((file) => ({ file, url: URL.createObjectURL(file) })),
    [files],
  );

  useEffect(() => {
    return () => {
      previews.forEach((preview) => URL.revokeObjectURL(preview.url));
    };
  }, [previews]);

  function addFiles(list: FileList | null) {
    if (!list) return;
    const next = [...files];
    for (const file of Array.from(list)) {
      if (!isReviewPhotoType(file.type) || file.size > REVIEW_PHOTO_MAX_BYTES) continue;
      if (next.some((existing) => existing.name === file.name && existing.size === file.size)) continue;
      if (next.length >= REVIEW_PHOTO_MAX) break;
      next.push(file);
    }
    onChange(next);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div>
      <p className="text-sm font-medium">
        Photos <span className="font-normal text-mute">(optional, up to {REVIEW_PHOTO_MAX})</span>
      </p>
      <p className="mt-1 text-xs text-mute">
        JPEG, PNG, or WebP under 4 MB. Show the unit, lobby, or a repair — no faces or documents.
      </p>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="sr-only"
        onChange={(event) => addFiles(event.target.files)}
      />
      <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {previews.map((preview, index) => (
          <div key={`${preview.file.name}-${preview.file.size}`} className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={preview.url}
              alt={`Selected photo ${index + 1}`}
              className="aspect-square w-full rounded-md border border-rule object-cover"
            />
            <button
              type="button"
              className="absolute right-1 top-1 inline-flex size-8 items-center justify-center rounded-md bg-ink/80 text-paper hover:bg-ink"
              onClick={() => onChange(files.filter((_, current) => current !== index))}
              aria-label={`Remove photo ${index + 1}`}
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
        {files.length < REVIEW_PHOTO_MAX ? (
          <label
            htmlFor={inputId}
            className={cn(
              "flex aspect-square cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-rule bg-muted text-sm text-mute hover:border-accent hover:text-ink",
            )}
          >
            <ImagePlus className="size-5" aria-hidden />
            Add photos
          </label>
        ) : null}
      </div>
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
    </div>
  );
}
