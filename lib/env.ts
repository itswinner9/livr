export function hasSupabaseConfig() {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function hasServiceRole() {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY);
}

export function hasOpenRouter() {
  return Boolean(process.env.OPENROUTER_API_KEY);
}

export function hasStripe() {
  return Boolean(
    process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET,
  );
}

export function hasResend() {
  return Boolean(process.env.RESEND_API_KEY);
}

export function appUrl() {
  return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
}

export function aiModels() {
  return {
    default: process.env.OPENROUTER_DEFAULT_MODEL || "openai/gpt-4o-mini",
    fast: process.env.OPENROUTER_FAST_MODEL || "openai/gpt-4o-mini",
    reasoning: process.env.OPENROUTER_REASONING_MODEL || "openai/gpt-4o",
    embedding:
      process.env.OPENROUTER_EMBEDDING_MODEL ||
      "openai/text-embedding-3-small",
  };
}
