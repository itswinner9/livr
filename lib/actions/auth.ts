"use server";

import { getSessionUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { appUrl } from "@/lib/env";
import { createServerSupabase } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { safeNextPath } from "@/lib/safe-redirect";

export async function signUp(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const display_name = String(formData.get("display_name") ?? "");
  if (!email || password.length < 8) {
    return { error: "Use a valid email and a password with at least 8 characters." };
  }
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Authentication is not configured yet." };
  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: { data: { display_name } },
  });
  if (error) return { error: "We couldn't create that account. Please try again." };
  redirect(safeNextPath(formData.get("next")));
}

export async function signIn(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Authentication is not configured yet." };
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return { error: "Email or password did not match." };
  redirect(safeNextPath(formData.get("next")));
}

export async function signOut() {
  const supabase = await createServerSupabase();
  if (supabase) await supabase.auth.signOut();
  redirect("/");
}

export async function resetPassword(formData: FormData) {
  const email = String(formData.get("email") ?? "");
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Authentication is not configured yet." };
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: `${appUrl()}/login`,
  });
  if (error) return { error: "We couldn't send a reset email. Please try again." };
  return { ok: "If that email exists, a reset link is on its way." };
}

export async function updateProfile(formData: FormData) {
  const user = await getSessionUser();
  if (!user) return { error: "Please log in." };
  const display_name = String(formData.get("display_name") ?? "").trim();
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "We couldn't update your profile." };
  const { error } = await supabase
    .from("profiles")
    .update({ display_name })
    .eq("id", user.id);
  if (error) return { error: "We couldn't update your profile." };
  return { ok: "Profile updated." };
}

export async function requestAccountDeletion() {
  const user = await getSessionUser();
  if (!user) return { error: "Please log in." };
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "We couldn't process that request." };
  await supabase
    .from("profiles")
    .update({ display_name: "Deleted user", avatar_url: null })
    .eq("id", user.id);
  await supabase.auth.signOut();
  redirect("/");
}

export async function toggleSave(propertyId: string) {
  const user = await getSessionUser();
  if (!user) return { error: "Please log in to save properties." };
  const limited = rateLimit(`save:${user.id}`, 40);
  if (!limited.ok) return { error: "Please slow down." };
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Saving is unavailable in demo mode." };
  const { data: existing } = await supabase
    .from("saved_properties")
    .select("id")
    .eq("user_id", user.id)
    .eq("property_id", propertyId)
    .maybeSingle();
  if (existing) {
    await supabase.from("saved_properties").delete().eq("id", existing.id);
    return { ok: "Removed from saved." };
  }
  const { error } = await supabase.from("saved_properties").insert({
    user_id: user.id,
    property_id: propertyId,
  });
  if (error) return { error: "We couldn't save that property." };
  return { ok: "Saved." };
}
