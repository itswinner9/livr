import type { ReviewPhoto } from "@/types/review";

export function ReviewPhotoGrid({
  photos,
  compact = false,
}: {
  photos: ReviewPhoto[];
  compact?: boolean;
}) {
  if (photos.length === 0) return null;
  return (
    <ul className={compact ? "flex flex-wrap gap-2" : "grid grid-cols-2 gap-2 sm:grid-cols-4"}>
      {photos.map((photo, index) => (
        <li key={photo.id} className={compact ? "size-16 overflow-hidden rounded-md" : undefined}>
          <a href={photo.url} target="_blank" rel="noreferrer">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photo.url}
              alt={`Review photo ${index + 1}`}
              className={
                compact
                  ? "size-full object-cover"
                  : "aspect-square w-full rounded-md border border-rule object-cover"
              }
            />
          </a>
        </li>
      ))}
    </ul>
  );
}
