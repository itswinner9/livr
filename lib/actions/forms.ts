"use server";

import { requestAccountDeletion, resetPassword, signOut, updateProfile } from "@/lib/actions/auth";
import { moderateContent, mergePropertiesAction } from "@/lib/actions/admin";
import { createProperty, submitManagerResponse, claimProperty } from "@/lib/actions/properties";
import { redirect } from "next/navigation";

export async function resetPasswordForm(formData: FormData): Promise<void> {
  await resetPassword(formData);
}

export async function updateProfileForm(formData: FormData): Promise<void> {
  await updateProfile(formData);
}

export async function signOutForm(): Promise<void> {
  await signOut();
}

export async function deleteAccountForm(): Promise<void> {
  await requestAccountDeletion();
}

export async function moderateForm(formData: FormData): Promise<void> {
  await moderateContent(formData);
}

export async function mergePropertiesForm(formData: FormData): Promise<void> {
  await mergePropertiesAction(formData);
}

export async function createPropertyForm(formData: FormData): Promise<void> {
  const result = await createProperty(formData);
  const params = new URLSearchParams({ error: result.error });
  for (const [field, key] of [
    ["address_line_1", "line1"],
    ["address_line_2", "line2"],
    ["city", "city"],
    ["province", "province"],
    ["postal_code", "postal"],
    ["building_name", "building"],
    ["property_type", "type"],
  ] as const) {
    const value = formData.get(field);
    if (typeof value === "string" && value) params.set(key, value);
  }
  redirect(`/property/new?${params.toString()}`);
}

export async function submitManagerResponseForm(formData: FormData): Promise<void> {
  await submitManagerResponse(formData);
}

export async function claimPropertyForm(formData: FormData): Promise<void> {
  await claimProperty(String(formData.get("propertyId")));
}
