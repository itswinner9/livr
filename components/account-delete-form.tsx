"use client";

import { useState } from "react";
import { deleteAccountForm } from "@/lib/actions/forms";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AccountDeleteForm() {
  const [open, setOpen] = useState(false);
  const [typed, setTyped] = useState("");
  const ready = typed.trim() === "Delete";

  if (!open) {
    return (
      <Button type="button" variant="danger" onClick={() => setOpen(true)}>
        Delete account
      </Button>
    );
  }

  return (
    <form action={deleteAccountForm} className="space-y-3">
      <Label htmlFor="account-delete-confirm">Type Delete to confirm</Label>
      <Input
        id="account-delete-confirm"
        value={typed}
        onChange={(event) => setTyped(event.target.value)}
        autoComplete="off"
        aria-describedby="account-delete-hint"
      />
      <p id="account-delete-hint" className="text-sm text-mute">
        This signs you out and clears your public display name. Published reviews may stay on file as Former
        renter.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button type="submit" variant="danger" disabled={!ready}>
          Delete forever
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => {
            setOpen(false);
            setTyped("");
          }}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
