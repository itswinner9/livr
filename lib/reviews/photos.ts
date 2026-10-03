import { supabaseUrl } from "@/lib/env";

export const REVIEW_PHOTO_MAX = 4;
export const REVIEW_PHOTO_MAX_BYTES = 4 * 1024 * 1024;
export const REVIEW_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const REVIEW_PHOTO_BUCKET = "review-photos";

export type ReviewPhotoType = (typeof REVIEW_PHOTO_TYPES)[number];

export function isReviewPhotoType(value: string): value is ReviewPhotoType {
  return (REVIEW_PHOTO_TYPES as readonly string[]).includes(value);
}

export function reviewPhotoExtension(type: string) {
  if (type === "image/png") return "png";
  if (type === "image/webp") return "webp";
  return "jpg";
}

export function reviewPhotoUrl(storagePath: string) {
  const base = supabaseUrl().replace(/\/$/, "");
  if (!base || !storagePath) return "";
  const path = storagePath.split("/").filter(Boolean).map(encodeURIComponent).join("/");
  return `${base}/storage/v1/object/public/${REVIEW_PHOTO_BUCKET}/${path}`;
}

export function collectReviewPhotos(formData: FormData): { files: File[]; error?: string } {
  const files = formData
    .getAll("photos")
    .filter((value): value is File => value instanceof File && value.size > 0);
  if (files.length > REVIEW_PHOTO_MAX) {
    return { files: [], error: `You can add up to ${REVIEW_PHOTO_MAX} photos.` };
  }
  for (const file of files) {
    if (!isReviewPhotoType(file.type)) {
      return { files: [], error: "Photos must be JPEG, PNG, or WebP." };
    }
    if (file.size > REVIEW_PHOTO_MAX_BYTES) {
      return { files: [], error: "Each photo must be under 4 MB." };
    }
  }
  return { files };
}
