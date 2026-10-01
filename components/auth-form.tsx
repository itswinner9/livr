"use client";

import { signIn, signUp } from "@/lib/actions/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useActionState } from "react";

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(
    async (_p: { error?: string } | null, fd: FormData) => signIn(fd),
    null,
  );
  return (
    <form action={action} className="mt-6 space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state?.error ? (
        <p className="border border-destructive/20 bg-surface p-3 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <label className="block text-sm font-medium text-ink">
        Email
        <Input name="email" type="email" required autoComplete="email" className="mt-1.5" />
      </label>
      <label className="block text-sm font-medium text-ink">
        Password
        <Input name="password" type="password" required autoComplete="current-password" className="mt-1.5" />
      </label>
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Signing in…" : "Log in"}
      </Button>
    </form>
  );
}

export function SignupForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState(
    async (_p: { error?: string } | null, fd: FormData) => signUp(fd),
    null,
  );
  return (
    <form action={action} className="mt-6 space-y-4">
      {next ? <input type="hidden" name="next" value={next} /> : null}
      {state?.error ? (
        <p className="border border-destructive/20 bg-surface p-3 text-sm text-destructive" role="alert">
          {state.error}
        </p>
      ) : null}
      <label className="block text-sm font-medium text-ink">
        Public display name (optional)
        <Input name="display_name" autoComplete="nickname" className="mt-1.5" />
      </label>
      <label className="block text-sm font-medium text-ink">
        Email
        <Input name="email" type="email" required autoComplete="email" className="mt-1.5" />
      </label>
      <label className="block text-sm font-medium text-ink">
        Password (8+ characters)
        <Input name="password" type="password" required minLength={8} autoComplete="new-password" className="mt-1.5" />
      </label>
      <Button className="w-full" disabled={pending} type="submit">
        {pending ? "Creating…" : "Sign up"}
      </Button>
    </form>
  );
}
