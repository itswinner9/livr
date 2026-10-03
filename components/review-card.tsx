"use client";

import { useState } from "react";
import type { OwnPendingReply, PublicReviewReply, Review, ReviewPhoto } from "@/types/review";
import { ReviewPhotoGrid } from "@/components/review-photo-grid";
import { formatDate } from "@/lib/utils";
import { Stars } from "@/components/stars";
import { FlagReviewButton } from "./flag-review-button";
import { ReviewReplyForm } from "./review-reply-form";

function identity(review: Review) {
  if (review.author_display_name) return review.author_display_name;
  if (review.public_display_name && review.display_name) return review.display_name;
  return review.renter_status === "current" ? "Current renter" : "Former renter";
}

const CATEGORIES: [keyof Review, string][] = [
  ["maintenance_rating", "Maintenance"],
  ["management_rating", "Management"],
  ["noise_rating", "Noise"],
  ["cleanliness_rating", "Cleanliness"],
  ["building_condition_rating", "Building"],
  ["parking_rating", "Parking"],
  ["value_rating", "Value"],
];

export function ReviewCard({
  review,
  photos = [],
  replies = [],
  ownPending = [],
  loggedIn = false,
  loginHref,
}: {
  review: Review;
  photos?: ReviewPhoto[];
  replies?: PublicReviewReply[];
  ownPending?: OwnPendingReply[];
  loggedIn?: boolean;
  loginHref?: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const period =
    review.move_in_year && review.move_out_year
      ? `${review.move_in_year}–${review.move_out_year}`
      : review.move_in_year
        ? `From ${review.move_in_year}`
        : null;
  const extras = CATEGORIES.filter(([key]) => review[key] != null);
  const long = review.review_body.length > 180 || (review.review_body.match(/\n/g)?.length ?? 0) > 2;

  return (
    <article id={`review-${review.id}`} className="flex scroll-mt-32 flex-col gap-3 rounded-md bg-surface p-4 border border-rule md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-ink">{identity(review)}</p>
          <p className="mt-0.5 text-sm text-mute">
            {review.unit_key ? `Unit ${review.unit_key} · ` : ""}
            {period ? `${period} · ` : ""}
            Published {formatDate(review.created_at)}
          </p>
        </div>
        <div className="shrink-0 text-right">
          <p className="figure font-bold text-ink">{review.overall_rating.toFixed(1)} / 5</p>
          <p className="mt-1">
            <Stars
              value={review.overall_rating}
              showValue={false}
              label={`${review.overall_rating.toFixed(1)} out of 5`}
            />
          </p>
        </div>
      </div>
      <h3 className="text-base font-semibold text-ink">{review.review_title}</h3>
      <p
        className={
          expanded
            ? "whitespace-pre-wrap text-base leading-7 text-ink"
            : "line-clamp-4 whitespace-pre-wrap text-base leading-7 text-ink"
        }
      >
        {review.review_body}
      </p>
      <ReviewPhotoGrid photos={photos} />
      {long ? (
        <button
          type="button"
          className="self-start text-sm font-semibold text-accent hover:text-accent-hover"
          onClick={() => setExpanded((value) => !value)}
          aria-expanded={expanded}
        >
          {expanded ? "Show less" : "Read more"}
        </button>
      ) : null}
      {extras.length ? (
        <dl className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {extras.map(([key, label]) => (
            <div key={String(key)} className="inline-flex items-center gap-1.5">
              <span className="text-star" aria-hidden>
                ★
              </span>
              <dt className="text-mute">{label}</dt>
              <dd className="figure font-semibold text-star">{String(review[key])}</dd>
            </div>
          ))}
        </dl>
      ) : null}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs text-mute">
          {review.bedrooms != null ? `${review.bedrooms} bedroom · ` : ""}
          {review.helpful_count} found helpful
        </p>
        <FlagReviewButton reviewId={review.id} />
      </div>
      {replies.length > 0 || ownPending.length > 0 ? (
        <ul className="space-y-3 border-t border-rule pt-3">
          {replies.map((reply) => (
            <li key={reply.id} className="border-l-2 border-rule pl-3">
              <p className="text-xs text-mute">
                {reply.author_display_name || "Renter"} · {formatDate(reply.published_at ?? reply.created_at)}
              </p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink">{reply.body}</p>
            </li>
          ))}
          {ownPending.map((reply) => (
            <li key={reply.id} className="border-l-2 border-rule pl-3">
              <p className="text-xs text-mute">Waiting for a moderator</p>
              <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-ink">{reply.body}</p>
            </li>
          ))}
        </ul>
      ) : null}
      {loginHref ? <ReviewReplyForm reviewId={review.id} loginHref={loginHref} loggedIn={loggedIn} /> : null}
    </article>
  );
}
