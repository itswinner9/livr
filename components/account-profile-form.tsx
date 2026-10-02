"use client";

import { useActionState } from "react";
import { updateProfile } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountProfileForm({ displayName }: { displayName: string }) {
  const [state, action, pending] = useActionState(
    async (_prev: { error?: string; ok?: string } | null, formData: FormData) => updateProfile(formData),
    null,
  );
  return (
    <form action={action} className="space-y-4">
      {state?.error ? (
        <p className="rounded-md border border-destructive/30 bg-paper px-3 py-2 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      {state?.ok ? (
        <p className="rounded-md border border-rule bg-paper px-3 py-2 text-sm text-ink" role="status">
          {state.ok}
        </p>
      ) : null}
      <div>
        <Label htmlFor="display_name">Display name</Label>
        <Input
          id="display_name"
          name="display_name"
          defaultValue={displayName}
          autoComplete="nickname"
          className="mt-1.5"
        />
        <p className="mt-2 text-sm text-mute">Shown on your published reviews as the public byline.</p>
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save name"}
      </Button>
    </form>
  );
}
