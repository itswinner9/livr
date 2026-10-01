"use client";

import { useActionState, useState } from "react";
import Link from "next/link";
import { submitReply, type ReviewFormState } from "@/lib/actions/reviews";

const MAX_BODY = 1000;

export function ReviewReplyForm({
  reviewId,
  loginHref,
  loggedIn,
}: {
  reviewId: string;
  loginHref: string;
  loggedIn: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ReviewFormState, FormData>(
    async (_prev, formData) => submitReply(formData),
    null,
  );
  const bodyError = state?.fieldErrors?.body;
  const value = state?.values?.body ?? "";

  if (!loggedIn) {
    return (
      <p className="text-sm text-mute">
        <Link className="font-semibold text-accent hover:text-accent-hover" href={loginHref}>
          Log in to reply
        </Link>
      </p>
    );
  }

  if (!open && !state?.ok) {
    return (
      <button
        type="button"
        className="text-sm font-semibold text-accent hover:text-accent-hover"
        onClick={() => setOpen(true)}
      >
        Reply
      </button>
    );
  }

  if (state?.ok) {
    return (
      <p className="text-sm text-mute" role="status">
        {state.ok}
      </p>
    );
  }

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="reviewId" value={reviewId} />
      <label className="text-sm font-medium text-ink" htmlFor={`reply-${reviewId}`}>
        Reply
      </label>
      <textarea
        id={`reply-${reviewId}`}
        name="body"
        required
        minLength={20}
        maxLength={MAX_BODY}
        rows={3}
        defaultValue={value}
        className="rounded-md border border-rule bg-muted px-3 py-2 text-sm text-ink"
      />
      {bodyError ? (
        <p className="text-xs text-destructive" role="alert">
          {bodyError}
        </p>
      ) : null}
      {state?.error ? (
        <p className="text-xs text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="inline-flex min-h-11 items-center rounded-md bg-accent px-4 text-sm font-semibold text-paper hover:bg-accent-hover disabled:opacity-50"
        >
          {pending ? "Sending…" : "Post reply"}
        </button>
        <button
          type="button"
          className="text-sm font-semibold text-mute hover:text-ink"
          onClick={() => setOpen(false)}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
