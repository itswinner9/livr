import { describe, expect, it } from "vitest";
import { collectReviewPhotos, reviewPhotoExtension, reviewPhotoUrl } from "./photos";

function photo(name: string, type: string, size = 12) {
  return new File([new Uint8Array(size)], name, { type });
}

describe("review photos", () => {
  it("accepts up to four jpeg, png, or webp files", () => {
    const form = new FormData();
    form.append("photos", photo("a.jpg", "image/jpeg"));
    form.append("photos", photo("b.png", "image/png"));
    form.append("photos", photo("c.webp", "image/webp"));
    expect(collectReviewPhotos(form).files).toHaveLength(3);
    expect(collectReviewPhotos(form).error).toBeUndefined();
  });

  it("rejects extra files, wrong types, and oversized images", () => {
    const tooMany = new FormData();
    for (const name of ["a", "b", "c", "d", "e"]) {
      tooMany.append("photos", photo(`${name}.jpg`, "image/jpeg"));
    }
    expect(collectReviewPhotos(tooMany).error).toMatch(/up to 4/i);

    const badType = new FormData();
    badType.append("photos", photo("notes.pdf", "application/pdf"));
    expect(collectReviewPhotos(badType).error).toMatch(/jpeg/i);

    const huge = new FormData();
    huge.append("photos", photo("big.jpg", "image/jpeg", 5 * 1024 * 1024));
    expect(collectReviewPhotos(huge).error).toMatch(/4 MB/i);
  });

  it("builds a public storage url and file extension", () => {
    expect(reviewPhotoExtension("image/png")).toBe("png");
    expect(reviewPhotoExtension("image/webp")).toBe("webp");
    expect(reviewPhotoExtension("image/jpeg")).toBe("jpg");
    process.env.NEXT_PUBLIC_SUPABASE_URL = "https://example.supabase.co";
    const url = reviewPhotoUrl("user-1/review-2/shot 1.jpg");
    expect(url).toBe(
      "https://example.supabase.co/storage/v1/object/public/review-photos/user-1/review-2/shot%201.jpg",
    );
  });
});
