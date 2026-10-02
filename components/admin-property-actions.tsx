"use client";

import { useActionState } from "react";
import {
  hidePropertyAction,
  restorePropertyAction,
  deletePropertyAction,
  type ModerateState,
} from "@/lib/actions/admin";
import { ConfirmDeleteButton } from "@/components/confirm-delete";

export function AdminPropertyActions({
  propertyId,
  status,
}: {
  propertyId: string;
  status: string;
}) {
  const [hideState, hideAction, hidePending] = useActionState(hidePropertyAction, null);
  const [restoreState, restoreAction, restorePending] = useActionState(restorePropertyAction, null);
  const message = hideState?.error || hideState?.ok || restoreState?.error || restoreState?.ok;

  return (
    <div className="mt-3 space-y-2">
      {message ? (
        <p className={`text-xs ${hideState?.error || restoreState?.error ? "text-destructive" : "text-mute"}`} role="status">
          {message}
        </p>
      ) : null}
      <div className="flex flex-wrap items-start gap-2">
        {status === "hidden" ? (
          <form action={restoreAction}>
            <input type="hidden" name="propertyId" value={propertyId} />
            <button
              type="submit"
              disabled={restorePending}
              className="inline-flex min-h-11 items-center rounded-md border border-rule bg-surface px-3 text-sm font-semibold text-ink hover:bg-muted disabled:opacity-50"
            >
              {restorePending ? "Saving…" : "Restore"}
            </button>
          </form>
        ) : status !== "merged" ? (
          <form action={hideAction}>
            <input type="hidden" name="propertyId" value={propertyId} />
            <button
              type="submit"
              disabled={hidePending}
              className="inline-flex min-h-11 items-center rounded-md border border-rule bg-surface px-3 text-sm font-semibold text-ink hover:bg-muted disabled:opacity-50"
            >
              {hidePending ? "Saving…" : "Remove"}
            </button>
          </form>
        ) : null}
        {status !== "merged" ? (
          <ConfirmDeleteButton action={deletePropertyAction} fields={{ propertyId }} />
        ) : null}
      </div>
    </div>
  );
}
