"use client";

import { useActionState } from "react";
import { moderateContent, type ModerateState } from "@/lib/actions/admin";
import { ConfirmDeleteButton } from "@/components/confirm-delete";

const DEFAULT_ACTIONS = ["approve", "reject", "hide"] as const;

function actionLabel(action: string) {
  if (action === "hide") return "Remove";
  return action;
}

export function ModerationButtons({
  targetType,
  targetId,
  actions = DEFAULT_ACTIONS,
}: {
  targetType: string;
  targetId: string;
  actions?: readonly string[];
}) {
  const [state, action, pending] = useActionState<ModerateState, FormData>(
    async (_prev, formData) => moderateContent(formData),
    null,
  );
  const regular = actions.filter((item) => item !== "delete");
  const canDelete = actions.includes("delete");

  return (
    <div className="space-y-2">
      {state?.error ? (
        <p className="rounded-md bg-destructive/10 px-2 py-1 text-xs text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="text-xs text-mute" role="status">
          {state.ok}
        </p>
      ) : null}
      <div className="flex flex-wrap items-start gap-2">
        {regular.map((moderationAction) => (
          <form key={moderationAction} action={action}>
            <input type="hidden" name="targetType" value={targetType} />
            <input type="hidden" name="targetId" value={targetId} />
            <input type="hidden" name="action" value={moderationAction} />
            <button
              className="rounded border px-2 py-1 text-xs capitalize disabled:opacity-50"
              type="submit"
              disabled={pending}
            >
              {pending ? "Saving…" : actionLabel(moderationAction)}
            </button>
          </form>
        ))}
        {canDelete ? (
          <ConfirmDeleteButton
            action={async (_prev, formData) => moderateContent(formData)}
            fields={{ targetType, targetId, action: "delete" }}
          />
        ) : null}
      </div>
    </div>
  );
}
