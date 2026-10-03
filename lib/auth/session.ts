import { cache } from "react";
import { createServerSupabase } from "@/lib/supabase/server";
export { isStaff } from "@/lib/auth/roles";

export type SessionUser = {
  id: string;
  email: string | null;
  role: string;
  display_name: string | null;
  subscription_status: string;
  profile: {
    role: string;
    display_name: string | null;
    subscription_status: string;
  };
};

export const getSessionUser = cache(async function getSessionUser(): Promise<SessionUser | null> {
  const supabase = await createServerSupabase();
  if (!supabase) return null;
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("role, display_name, subscription_status")
    .eq("id", user.id)
    .maybeSingle();
  return {
    id: user.id,
    email: user.email ?? null,
    role: profile?.role ?? "user",
    display_name: profile?.display_name ?? null,
    subscription_status: profile?.subscription_status ?? "free",
    profile: {
      role: profile?.role ?? "user",
      display_name: profile?.display_name ?? null,
      subscription_status: profile?.subscription_status ?? "free",
    },
  };
});
