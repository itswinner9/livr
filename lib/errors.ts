/** Maps internal failures to renter-friendly messages. Raw database errors are never shown. */

export type ActionResult<T = undefined> =
  | { ok: true; message?: string; data?: T }
  | { ok: false; message: string; fieldErrors?: Record<string, string[] | undefined> };

interface PgLikeError {
  code?: string;
  message?: string;
}

export function friendlyDbError(error: PgLikeError | null | undefined, fallback: string): string {
  if (!error) return fallback;
  switch (error.code) {
    case "23505":
      return "It looks like you've already submitted this. Check your account for its status.";
    case "23514":
    case "22P02":
    case "23502":
      return "Some of the information provided isn't valid. Please review the form and try again.";
    case "42501":
      return "You don't have permission to do that.";
    case "23503":
      return "We couldn't find the related property. Please refresh and try again.";
    default:
      return fallback;
  }
}

export function logServerError(context: string, error: unknown) {
  const detail =
    error && typeof error === "object" && "message" in error ? (error as { message: string }).message : error;
  console.error(`[livrank] ${context}:`, detail);
}

export const MESSAGES = {
  notConfigured:
    "LivRank's database isn't connected yet. Add your Supabase keys to .env.local to enable this feature.",
  signInRequired: "Please log in to continue.",
  rateLimited: "You're doing that a lot. Please wait a bit and try again.",
  genericSave: "We couldn't save that. Please try again.",
} as const;
