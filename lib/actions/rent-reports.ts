"use server";

import { getSessionUser } from "@/lib/auth/session";
import { rateLimit } from "@/lib/rate-limit";
import { createServerSupabase } from "@/lib/supabase/server";
import { rentReportSchema } from "@/lib/validation/schemas";
import { track } from "@/lib/analytics";
import { revalidatePath } from "next/cache";
import { logServerError } from "@/lib/errors";

export type RentReportFormState = {
  ok?: string;
  error?: string;
  fieldErrors?: Partial<Record<string, string>>;
  values?: Record<string, string>;
} | null;

function formValues(formData: FormData): Record<string, string> {
  return Object.fromEntries(
    [...formData.entries()].filter(([, v]) => typeof v === "string") as [string, string][],
  );
}

export async function submitRentReport(formData: FormData): Promise<NonNullable<RentReportFormState>> {
  const values = formValues(formData);
  try {
    const user = await getSessionUser();
    if (!user) return { error: "Please log in to report rent.", values };
    const limited = rateLimit(`rent:${user.id}`, 10, 60 * 60 * 1000);
    if (!limited.ok) return { error: "Please wait before submitting another rent report.", values };
    const parsed = rentReportSchema.safeParse({
      propertyId: formData.get("propertyId"),
      bedrooms: formData.get("bedrooms"),
      bathrooms: formData.get("bathrooms") || undefined,
      monthly_rent: formData.get("monthly_rent"),
      parking_cost: formData.get("parking_cost") || undefined,
      storage_cost: formData.get("storage_cost") || undefined,
      utilities_included: formData.get("utilities_included") === "on",
      lease_start_year: formData.get("lease_start_year") || undefined,
      lease_end_year: formData.get("lease_end_year") || undefined,
      renter_status: formData.get("renter_status"),
      notes: formData.get("notes") || undefined,
    });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const key = String(issue.path[0] ?? "form");
        fieldErrors[key] ??= issue.message;
      }
      return { error: parsed.error.issues[0]?.message ?? "Please check the form.", fieldErrors, values };
    }
    const supabase = await createServerSupabase();
    if (!supabase) return { error: "We couldn't save your rent report. Please try again.", values };
    const { error } = await supabase.from("rent_reports").insert({
      property_id: parsed.data.propertyId,
      user_id: user.id,
      bedrooms: parsed.data.bedrooms,
      bathrooms: parsed.data.bathrooms ?? null,
      monthly_rent: parsed.data.monthly_rent,
      parking_cost: parsed.data.parking_cost ?? null,
      storage_cost: parsed.data.storage_cost ?? null,
      utilities_included: parsed.data.utilities_included ?? null,
      lease_start_year: parsed.data.lease_start_year ?? null,
      lease_end_year: parsed.data.lease_end_year ?? null,
      renter_status: parsed.data.renter_status,
      notes: parsed.data.notes ?? null,
      status: "pending",
    });
    if (error) return { error: "We couldn't save your rent report. Please try again.", values };
    track("rent_report_submit");
    revalidatePath(`/property/${parsed.data.propertyId}`);
    return { ok: "Thanks. Your rent report has been submitted for moderation." };
  } catch (error) {
    logServerError("submitRentReport", error);
    return { error: "We couldn't save your rent report. Please try again.", values };
  }
}
