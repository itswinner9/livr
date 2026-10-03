import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { propertyCanonicalPath } from "@/lib/seo";

type WatchKind = "review" | "rent";

function copyFor(kind: WatchKind, address: string) {
  if (kind === "review") {
    return {
      title: `New review at ${address}`,
      body: "A published renter review was added to a building you saved.",
    };
  }
  return {
    title: `New rent report at ${address}`,
    body: "Someone reported rent for a building you saved.",
  };
}

export async function notifySavedWatchers(input: {
  propertyId: string;
  kind: WatchKind;
  excludeUserId?: string | null;
}) {
  const admin = createAdminClient();
  if (!admin) return;

  const [{ data: savers }, { data: property }] = await Promise.all([
    admin.from("saved_properties").select("user_id").eq("property_id", input.propertyId),
    admin
      .from("properties")
      .select("id, slug, address_line_1, city, province")
      .eq("id", input.propertyId)
      .maybeSingle(),
  ]);
  if (!property) return;

  const userIds = [...new Set((savers ?? []).map((row) => String(row.user_id)))].filter(
    (id) => id && id !== input.excludeUserId,
  );
  if (userIds.length === 0) return;

  const address = `${property.address_line_1}, ${property.city}`;
  const copy = copyFor(input.kind, address);
  const link = propertyCanonicalPath(property);
  await admin.from("notifications").insert(
    userIds.map((userId) => ({
      user_id: userId,
      type: "saved_property_update",
      title: copy.title,
      body: copy.body,
      link,
    })),
  );
}

export async function notifyContributor(input: {
  userId: string | null | undefined;
  kind: WatchKind;
  propertyId: string;
}) {
  if (!input.userId) return;
  const admin = createAdminClient();
  if (!admin) return;
  const { data: property } = await admin
    .from("properties")
    .select("id, slug, address_line_1, city, province")
    .eq("id", input.propertyId)
    .maybeSingle();
  const address = property ? `${property.address_line_1}, ${property.city}` : "your building";
  await admin.from("notifications").insert({
    user_id: input.userId,
    type: input.kind === "review" ? "review_approved" : "rent_report_approved",
    title: input.kind === "review" ? "Your review is published" : "Your rent report is published",
    body: `It is now on the file for ${address}.`,
    link: property ? propertyCanonicalPath(property) : "/account",
  });
}
