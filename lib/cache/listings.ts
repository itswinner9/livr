import { revalidateTag } from "next/cache";

export const LISTINGS_TAG = "listings";

export function refreshListings() {
  revalidateTag(LISTINGS_TAG, { expire: 0 });
}
