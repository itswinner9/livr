"use client";

import { flagReview } from "@/lib/actions/reviews";
import { useState } from "react";

export function FlagReviewButton({ reviewId }: { reviewId: string }) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  return (
    <div>
      <button
        type="button"
        className="text-xs text-mute hover:text-ink"
        onClick={() => setOpen((v) => !v)}
      >
        Report this review
      </button>
      {open ? (
        <form
          className="mt-2 flex flex-col gap-2"
          action={async (formData) => {
            const result = await flagReview(formData);
            setMessage(result.error ?? result.ok);
            setOpen(false);
          }}
        >
          <input type="hidden" name="reviewId" value={reviewId} />
          <label className="text-xs text-mute" htmlFor={`reason-${reviewId}`}>
            Reason
          </label>
          <select
            id={`reason-${reviewId}`}
            name="reason"
            className="rounded-sm border border-rule bg-surface px-2 py-1 text-sm text-ink"
            defaultValue="spam"
          >
            <option value="spam">Spam</option>
            <option value="personal_information">Personal information</option>
            <option value="harassment">Harassment</option>
            <option value="threat">Threat</option>
            <option value="unsupported_accusation">Unsupported accusation</option>
            <option value="fake_or_misleading">Fake or misleading</option>
            <option value="not_a_renter_experience">Not a renter experience</option>
            <option value="other">Other</option>
          </select>
          <button className="self-start text-sm text-accent hover:text-accent-hover" type="submit">
            Submit report
          </button>
        </form>
      ) : null}
      {message ? <p className="mt-1 text-xs text-mute">{message}</p> : null}
    </div>
  );
}
