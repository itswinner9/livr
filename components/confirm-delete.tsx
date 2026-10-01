"use client";

import { useActionState, useState } from "react";
import type { ModerateState } from "@/lib/actions/admin";

export function ConfirmDeleteButton({
  action,
  fields,
  label = "Delete",
}: {
  action: (prev: ModerateState, formData: FormData) => Promise<NonNullable<ModerateState>>;
  fields: Record<string, string>;
  label?: string;
}) {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const [state, formAction, pending] = useActionState(action, null);
  const ready = typed.trim() === "Delete";

  if (!open) {
    return (
      <button
        type="button"
        className="rounded border border-destructive/40 px-2 py-1 text-xs text-destructive hover:bg-destructive/10"
        onClick={() => setOpen(true)}
      >
        {label}
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-2 rounded-md border border-destructive/40 bg-paper p-2">
      {Object.entries(fields).map(([name, value]) => (
        <input key={name} type="hidden" name={name} value={value} />
      ))}
      <p className="text-xs text-mute">Type Delete to permanently remove this. It cannot be undone.</p>
      <input
        name="confirm"
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
        autoComplete="off"
        className="w-full rounded-md border border-rule bg-surface px-2 py-1 text-xs text-ink"
        aria-label="Type Delete to confirm"
      />
      {state?.error ? (
        <p className="text-xs text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={!ready || pending}
          className="rounded bg-destructive px-2 py-1 text-xs text-paper disabled:opacity-50"
        >
          {pending ? "Deleting…" : "Delete forever"}
        </button>
        <button
          type="button"
          className="rounded border border-rule px-2 py-1 text-xs text-mute"
          onClick={() => {
            setOpen(false);
            setTyped("");
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
