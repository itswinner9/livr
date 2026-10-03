import { getAdminCounts, getStaffClient } from "@/lib/admin/data";
import { ModerationButtons } from "@/components/admin-table";
import { EmptyState } from "@/components/empty-state";
import { ReviewPhotoGrid } from "@/components/review-photo-grid";
import { holdReasonsFromFlags, labelHoldReason } from "@/lib/moderation/review-gate";
import { reviewPhotoUrl } from "@/lib/reviews/photos";
import type { ReviewPhoto } from "@/types/review";
import Link from "next/link";

type QueueReview = {
  id: string;
  review_title: string;
  review_body: string;
  status: string;
  property_id: string;
  created_at: string;
  published_at: string | null;
  unit_id: string | null;
  overall_rating: number;
  renter_status: string;
  heuristic_flags: unknown;
  properties: { address_line_1: string; city: string; province: string } | { address_line_1: string; city: string; province: string }[] | null;
  property_units: { unit_key: string } | { unit_key: string }[] | null;
};

type QueueReply = {
  id: string;
  body: string;
  status: string;
  created_at: string;
  heuristic_flags: unknown;
  review_id: string;
  reviews:
    | {
        review_title: string;
        property_id: string;
        properties: { address_line_1: string; city: string; province: string } | { address_line_1: string; city: string; province: string }[] | null;
      }
    | {
        review_title: string;
        property_id: string;
        properties: { address_line_1: string; city: string; province: string } | { address_line_1: string; city: string; province: string }[] | null;
      }[]
    | null;
};

function first<T>(value: T | T[] | null | undefined): T | null {
  if (!value) return null;
  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function tabClass(active: boolean) {
  return active
    ? "inline-flex min-h-11 items-center rounded-md border border-ink bg-surface px-3.5 text-sm font-semibold text-ink"
    : "inline-flex min-h-11 items-center rounded-md px-3.5 text-sm font-semibold text-mute hover:bg-muted hover:text-ink";
}

export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const published = tab === "published";
  const replies = tab === "replies";
  const [counts, client] = await Promise.all([getAdminCounts(), getStaffClient()]);

  const reviewQuery = client && !replies
    ? published
      ? client
          .from("reviews")
          .select(
            "id, review_title, review_body, status, property_id, created_at, published_at, unit_id, overall_rating, renter_status, heuristic_flags, properties (address_line_1, city, province), property_units (unit_key)",
          )
          .eq("status", "published")
          .order("published_at", { ascending: false })
          .limit(20)
      : client
          .from("reviews")
          .select(
            "id, review_title, review_body, status, property_id, created_at, published_at, unit_id, overall_rating, renter_status, heuristic_flags, properties (address_line_1, city, province), property_units (unit_key)",
          )
          .eq("status", "pending")
          .order("created_at", { ascending: true })
          .limit(50)
    : null;
  const replyQuery = client && replies
    ? client
        .from("review_replies")
        .select(
          "id, body, status, created_at, heuristic_flags, review_id, reviews (review_title, property_id, properties (address_line_1, city, province))",
        )
        .eq("status", "pending")
        .order("created_at", { ascending: true })
        .limit(50)
    : null;

  const [{ data: reviewData }, { data: replyData }] = await Promise.all([
    reviewQuery ? reviewQuery : Promise.resolve({ data: [] }),
    replyQuery ? replyQuery : Promise.resolve({ data: [] }),
  ]);
  const reviews = (reviewData ?? []) as unknown as QueueReview[];
  const pendingReplies = (replyData ?? []) as unknown as QueueReply[];
  const reviewIds = reviews.map((review) => review.id);
  const { data: photoData } =
    client && reviewIds.length > 0
      ? await client
          .from("review_photos")
          .select("id, review_id, storage_path, sort_order")
          .in("review_id", reviewIds)
          .order("sort_order", { ascending: true })
      : { data: [] };
  const photosByReview = new Map<string, ReviewPhoto[]>();
  for (const row of photoData ?? []) {
    const photo = {
      id: String(row.id),
      review_id: String(row.review_id),
      storage_path: String(row.storage_path),
      sort_order: Number(row.sort_order ?? 0),
      url: reviewPhotoUrl(String(row.storage_path)),
    };
    const list = photosByReview.get(photo.review_id) ?? [];
    list.push(photo);
    photosByReview.set(photo.review_id, list);
  }

  return (
    <div>
      <h1 className="display text-3xl text-ink">
        {replies ? "Replies" : published ? "Recently published" : "Needs review"}
      </h1>
      <div className="mt-4 flex flex-wrap gap-1">
        <Link href="/admin/reviews" className={tabClass(!published && !replies)}>
          Needs review{counts.pendingReviews ? ` · ${counts.pendingReviews}` : ""}
        </Link>
        <Link href="/admin/reviews?tab=published" className={tabClass(published)}>
          Recently published
        </Link>
        <Link href="/admin/reviews?tab=replies" className={tabClass(replies)}>
          Replies{counts.pendingReplies ? ` · ${counts.pendingReplies}` : ""}
        </Link>
      </div>
      {replies ? (
        <ul className="mt-6 space-y-3">
          {pendingReplies.map((reply) => {
            const parent = first(reply.reviews);
            const property = first(parent?.properties);
            const address = property
              ? `${property.address_line_1}, ${property.city} ${property.province}`
              : "Unknown address";
            const reasons = holdReasonsFromFlags(reply.heuristic_flags);
            return (
              <li key={reply.id} className="rounded-md border border-rule bg-surface p-4">
                <p className="font-medium">{parent?.review_title ?? "Review reply"}</p>
                <p className="mt-1 text-sm text-mute">{address}</p>
                {parent?.property_id ? (
                  <p className="mt-1 text-xs text-mute">
                    <Link className="underline" href={`/property/${parent.property_id}`}>
                      View property
                    </Link>
                  </p>
                ) : null}
                <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{reply.body}</p>
                {reasons.length ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {reasons.map((reason) => (
                      <li
                        key={reason}
                        className="rounded-sm bg-muted px-2.5 py-0.5 text-xs font-medium text-mute"
                      >
                        {labelHoldReason(reason)}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-3">
                  <ModerationButtons
                    targetType="review_reply"
                    targetId={reply.id}
                    actions={["approve", "reject", "hide", "delete"]}
                  />
                </div>
              </li>
            );
          })}
          {pendingReplies.length === 0 ? (
            <li className="rounded-md border border-rule bg-surface px-4">
              <EmptyState title="No pending replies." />
            </li>
          ) : null}
        </ul>
      ) : (
        <ul className="mt-6 space-y-3">
          {reviews.map((review) => {
            const property = first(review.properties);
            const unit = first(review.property_units);
            const address = property
              ? `${property.address_line_1}, ${property.city} ${property.province}`
              : "Unknown address";
            const reasons = holdReasonsFromFlags(review.heuristic_flags);
            return (
              <li key={review.id} className="rounded-md border border-rule bg-surface p-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{review.review_title}</p>
                    <p className="mt-1 text-sm text-mute">
                      {address}
                      {unit?.unit_key ? ` · Unit ${unit.unit_key} (private)` : ""}
                    </p>
                    <p className="mt-1 text-xs text-mute">
                      {review.overall_rating}/5 · {review.renter_status} renter ·{" "}
                      <Link className="underline" href={`/property/${review.property_id}`}>
                        View property
                      </Link>
                    </p>
                  </div>
                </div>
                <p className="mt-3 whitespace-pre-wrap text-sm text-ink">{review.review_body}</p>
                <div className="mt-3">
                  <ReviewPhotoGrid photos={photosByReview.get(review.id) ?? []} />
                </div>
                {reasons.length ? (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {reasons.map((reason) => (
                      <li
                        key={reason}
                        className="rounded-sm bg-muted px-2.5 py-0.5 text-xs font-medium text-mute"
                      >
                        {labelHoldReason(reason)}
                      </li>
                    ))}
                  </ul>
                ) : null}
                <div className="mt-3">
                  <ModerationButtons
                    targetType="review"
                    targetId={review.id}
                    actions={published ? ["hide", "delete"] : ["approve", "reject", "hide", "delete"]}
                  />
                </div>
              </li>
            );
          })}
          {reviews.length === 0 ? (
            <li className="rounded-md border border-rule bg-surface px-4">
              <EmptyState title={published ? "No recently published reviews." : "No pending reviews."} />
            </li>
          ) : null}
        </ul>
      )}
    </div>
  );
}
