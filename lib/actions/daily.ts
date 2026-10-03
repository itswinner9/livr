"use server";

import { HOME_NOTE_TOPICS, isMoveChecklistStep } from "@/lib/daily/checklist";
import { getSessionUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { createServerSupabase } from "@/lib/supabase/server";
import {
  homeNoteSchema,
  leaseDatesSchema,
  moveChecklistSchema,
  rentLogSchema,
  savedSearchSchema,
} from "@/lib/validation/schemas";
import { revalidatePath } from "next/cache";

export type DailyActionState = { ok?: string; error?: string } | null;

function refreshDaily() {
  revalidatePath("/today");
  revalidatePath("/saved");
  revalidatePath("/account");
  revalidatePath("/account/inbox");
}

async function requireUser() {
  const user = await getSessionUser();
  if (!user) return { error: "Please log in." } as const;
  const supabase = await createServerSupabase();
  if (!supabase) return { error: "Connect your account to use Today." } as const;
  const limited = rateLimit(`daily:${user.id}`, 80);
  if (!limited.ok) return { error: "Please slow down." } as const;
  return { user, supabase };
}

export async function setHomeProperty(formData: FormData): Promise<NonNullable<DailyActionState>> {
  const ready = await requireUser();
  if ("error" in ready) return ready;
  const propertyId = String(formData.get("propertyId") ?? "");
  if (!propertyId) return { error: "Choose a building." };
  const { data: property } = await ready.supabase
    .from("public_properties")
    .select("id, city, province")
    .eq("id", propertyId)
    .maybeSingle();
  if (!property) return { error: "That building is not on the public file." };

  await ready.supabase.from("saved_properties").update({ is_home: false }).eq("user_id", ready.user.id).eq("is_home", true);
  const { data: existing } = await ready.supabase
    .from("saved_properties")
    .select("id")
    .eq("user_id", ready.user.id)
    .eq("property_id", propertyId)
    .maybeSingle();
  if (existing) {
    const { error } = await ready.supabase.from("saved_properties").update({ is_home: true }).eq("id", existing.id);
    if (error) return { error: "We couldn't mark that as home." };
  } else {
    const { error } = await ready.supabase.from("saved_properties").insert({
      user_id: ready.user.id,
      property_id: propertyId,
      is_home: true,
    });
    if (error) return { error: "We couldn't mark that as home." };
  }
  await ready.supabase
    .from("profiles")
    .update({ home_city: property.city, home_province: property.province })
    .eq("id", ready.user.id);
  refreshDaily();
  return { ok: "This is your home on LivRank." };
}

export async function saveLeaseDates(formData: FormData): Promise<NonNullable<DailyActionState>> {
  const ready = await requireUser();
  if ("error" in ready) return ready;
  const parsed = leaseDatesSchema.safeParse({
    propertyId: formData.get("propertyId") || undefined,
    lease_end: formData.get("lease_end"),
    notice_date: formData.get("notice_date") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the dates." };
  const { error } = await ready.supabase.from("lease_dates").upsert(
    {
      user_id: ready.user.id,
      property_id: parsed.data.propertyId ?? null,
      lease_end: parsed.data.lease_end,
      notice_date: parsed.data.notice_date ?? null,
    },
    { onConflict: "user_id" },
  );
  if (error) return { error: "We couldn't save those dates." };
  refreshDaily();
  return { ok: "Dates saved. These are your dates, not legal advice." };
}

export async function saveRentLog(formData: FormData): Promise<NonNullable<DailyActionState>> {
  const ready = await requireUser();
  if ("error" in ready) return ready;
  const parsed = rentLogSchema.safeParse({
    propertyId: formData.get("propertyId") || undefined,
    year: formData.get("year"),
    month: formData.get("month"),
    amount: formData.get("amount"),
    paid_on: formData.get("paid_on") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the rent log." };
  const { error } = await ready.supabase.from("rent_logs").upsert(
    {
      user_id: ready.user.id,
      property_id: parsed.data.propertyId ?? null,
      year: parsed.data.year,
      month: parsed.data.month,
      amount: parsed.data.amount,
      paid_on: parsed.data.paid_on ?? null,
    },
    { onConflict: "user_id,year,month" },
  );
  if (error) return { error: "We couldn't save that rent log." };
  refreshDaily();
  return { ok: "Rent logged for this month." };
}

export async function addHomeNote(formData: FormData): Promise<NonNullable<DailyActionState>> {
  const ready = await requireUser();
  if ("error" in ready) return ready;
  const parsed = homeNoteSchema.safeParse({
    propertyId: formData.get("propertyId") || undefined,
    topic: formData.get("topic"),
    body: formData.get("body"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Write a short note." };
  if (!HOME_NOTE_TOPICS.some((topic) => topic.key === parsed.data.topic)) {
    return { error: "Choose a topic." };
  }
  const { error } = await ready.supabase.from("home_notes").insert({
    user_id: ready.user.id,
    property_id: parsed.data.propertyId ?? null,
    topic: parsed.data.topic,
    body: parsed.data.body,
  });
  if (error) return { error: "We couldn't save that note." };
  refreshDaily();
  return { ok: "Note saved privately." };
}

export async function saveCitySearch(formData: FormData): Promise<NonNullable<DailyActionState>> {
  const ready = await requireUser();
  if ("error" in ready) return ready;
  const parsed = savedSearchSchema.safeParse({
    city: formData.get("city"),
    province: formData.get("province"),
    property_type: formData.get("property_type") || undefined,
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Choose a city." };
  const { error } = await ready.supabase.from("saved_searches").insert({
    user_id: ready.user.id,
    city: parsed.data.city,
    province: parsed.data.province,
    property_type: parsed.data.property_type ?? null,
  });
  if (error) {
    if (error.code === "23505") return { error: "You already watch that search." };
    return { error: "We couldn't save that search." };
  }
  refreshDaily();
  revalidatePath("/explore");
  return { ok: "City saved. New buildings will show on Today." };
}

export async function removeSavedSearch(formData: FormData): Promise<NonNullable<DailyActionState>> {
  const ready = await requireUser();
  if ("error" in ready) return ready;
  const id = String(formData.get("searchId") ?? "");
  if (!id) return { error: "Missing search." };
  const { error } = await ready.supabase.from("saved_searches").delete().eq("id", id).eq("user_id", ready.user.id);
  if (error) return { error: "We couldn't remove that search." };
  refreshDaily();
  return { ok: "Search removed." };
}

export async function toggleChecklistStep(formData: FormData): Promise<NonNullable<DailyActionState>> {
  const ready = await requireUser();
  if ("error" in ready) return ready;
  const parsed = moveChecklistSchema.safeParse({
    propertyId: formData.get("propertyId"),
    step: formData.get("step"),
    done: formData.get("done"),
  });
  if (!parsed.success || !isMoveChecklistStep(parsed.data.step)) return { error: "Choose a checklist step." };
  const { data: existing } = await ready.supabase
    .from("move_checklist")
    .select("id, completed_steps")
    .eq("user_id", ready.user.id)
    .eq("property_id", parsed.data.propertyId)
    .maybeSingle();
  const current = new Set((existing?.completed_steps ?? []) as string[]);
  if (parsed.data.done) current.add(parsed.data.step);
  else current.delete(parsed.data.step);
  const steps = [...current];
  if (existing) {
    const { error } = await ready.supabase.from("move_checklist").update({ completed_steps: steps }).eq("id", existing.id);
    if (error) return { error: "We couldn't update the checklist." };
  } else {
    const { error } = await ready.supabase.from("move_checklist").insert({
      user_id: ready.user.id,
      property_id: parsed.data.propertyId,
      completed_steps: steps,
    });
    if (error) return { error: "We couldn't update the checklist." };
  }
  refreshDaily();
  return { ok: "Checklist updated." };
}

export async function removeSavedSearchForm(formData: FormData): Promise<void> {
  await removeSavedSearch(formData);
}

export async function toggleChecklistStepForm(formData: FormData): Promise<void> {
  await toggleChecklistStep(formData);
}

export async function markNotificationsReadForm(formData: FormData): Promise<void> {
  await markNotificationsRead(formData);
}

export async function markNotificationsRead(formData: FormData): Promise<NonNullable<DailyActionState>> {
  const ready = await requireUser();
  if ("error" in ready) return ready;
  const id = String(formData.get("notificationId") ?? "");
  const now = new Date().toISOString();
  let query = ready.supabase.from("notifications").update({ read_at: now }).eq("user_id", ready.user.id).is("read_at", null);
  if (id) query = query.eq("id", id);
  const { error } = await query;
  if (error) return { error: "We couldn't update the inbox." };
  refreshDaily();
  return { ok: "Marked as read." };
}
