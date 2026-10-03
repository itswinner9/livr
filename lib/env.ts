function envValue(name: string) {
  const value = process.env[name];
  return typeof value === "string" && value.trim() ? value.trim() : "";
}

/** Server can use runtime Netlify env; client still needs NEXT_PUBLIC_* at build. */
export function supabaseUrl() {
  return envValue("SUPABASE_URL") || envValue("NEXT_PUBLIC_SUPABASE_URL");
}

export function supabaseAnonKey() {
  return envValue("SUPABASE_ANON_KEY") || envValue("NEXT_PUBLIC_SUPABASE_ANON_KEY");
}

export function hasSupabaseConfig() {
  return Boolean(supabaseUrl() && supabaseAnonKey());
}

export function serviceRoleKey() {
  return envValue("SUPABASE_SERVICE_ROLE_KEY");
}

export function hasServiceRole() {
  return Boolean(serviceRoleKey());
}

export function hasOpenRouter() {
  return Boolean(envValue("OPENROUTER_API_KEY"));
}

export function hasStripe() {
  return Boolean(envValue("STRIPE_SECRET_KEY") && envValue("STRIPE_WEBHOOK_SECRET"));
}

export function hasResend() {
  return Boolean(envValue("RESEND_API_KEY"));
}

function isLocalAppUrl(value: string) {
  try {
    const host = new URL(value).hostname.toLowerCase();
    return host === "localhost" || host === "127.0.0.1" || host === "::1";
  } catch {
    return true;
  }
}

export function appUrl() {
  const configured = envValue("NEXT_PUBLIC_APP_URL").replace(/\/$/, "");
  const netlifyUrl = envValue("URL").replace(/\/$/, "");
  const context = envValue("CONTEXT");
  if (configured && !isLocalAppUrl(configured)) return configured;
  if (netlifyUrl && !isLocalAppUrl(netlifyUrl) && context !== "dev") return netlifyUrl;
  if (process.env.NODE_ENV === "production" || context === "production") {
    return "https://livrank.ca";
  }
  return configured || "http://localhost:3000";
}

export function aiModels() {
  return {
    default: envValue("OPENROUTER_DEFAULT_MODEL") || "openai/gpt-4o-mini",
    fast: envValue("OPENROUTER_FAST_MODEL") || "openai/gpt-4o-mini",
    reasoning: envValue("OPENROUTER_REASONING_MODEL") || "openai/gpt-4o",
    embedding: envValue("OPENROUTER_EMBEDDING_MODEL") || "openai/text-embedding-3-small",
  };
}
