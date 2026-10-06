import { createAdminClient } from "@/lib/supabase/admin";
import { createPublicSupabase } from "@/lib/supabase/public";
import { createServerSupabase } from "@/lib/supabase/server";
import { cityCanonicalPath, siteOrigin } from "@/lib/seo";
import type { MetadataRoute } from "next";

export const revalidate = 300;

function laterDate(left?: string | null, right?: string | null) {
  if (!left) return right ?? undefined;
  if (!right) return left;
  return left > right ? left : right;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const origin = siteOrigin();
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${origin}/`, changeFrequency: "daily", priority: 1 },
    { url: `${origin}/explore`, changeFrequency: "daily", priority: 0.9 },
    { url: `${origin}/search`, changeFrequency: "weekly", priority: 0.6 },
    { url: `${origin}/compare`, changeFrequency: "weekly", priority: 0.4 },
    { url: `${origin}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${origin}/community-guidelines`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${origin}/pricing`, changeFrequency: "monthly", priority: 0.3 },
    { url: `${origin}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${origin}/terms`, changeFrequency: "yearly", priority: 0.2 },
  ];

  const client = createAdminClient() ?? createPublicSupabase() ?? (await createServerSupabase());
  if (!client) return staticRoutes;

  const [{ data: properties }, { data: units }] = await Promise.all([
    client
      .from("public_properties")
      .select("slug, id, city, province, review_count, rent_report_count, last_review_date, last_rent_report_date, updated_at")
      .order("last_review_date", { ascending: false, nullsFirst: false }),
    client.from("public_property_units").select("property_id, unit_key, last_review_date, review_count"),
  ]);

  const indexable = (properties ?? []).filter(
    (row) => (row.review_count ?? 0) > 0 || (row.rent_report_count ?? 0) > 0,
  );

  const places = new Map<string, { city: string; province: string; lastModified?: string }>();
  for (const row of indexable) {
    if (!row.city || !row.province) continue;
    const key = `${row.city}|${row.province}`;
    const lastModified = laterDate(row.last_review_date, laterDate(row.last_rent_report_date, row.updated_at));
    const current = places.get(key);
    if (!current || (lastModified && (!current.lastModified || lastModified > current.lastModified))) {
      places.set(key, { city: row.city, province: row.province, lastModified });
    }
  }

  const byId = new Map(indexable.map((row) => [row.id, row]));
  const unitRoutes: MetadataRoute.Sitemap = [];
  for (const unit of units ?? []) {
    if ((unit.review_count ?? 0) < 1) continue;
    const property = byId.get(unit.property_id);
    if (!property) continue;
    unitRoutes.push({
      url: `${origin}/property/${property.slug || property.id}/units/${encodeURIComponent(String(unit.unit_key))}`,
      lastModified: unit.last_review_date ?? property.updated_at ?? undefined,
      changeFrequency: "weekly",
      priority: 0.5,
    });
  }

  return [
    ...staticRoutes,
    ...[...places.values()].map((place) => ({
      url: `${origin}${cityCanonicalPath(place)}`,
      lastModified: place.lastModified,
      changeFrequency: "daily" as const,
      priority: 0.8,
    })),
    ...indexable.map((row) => ({
      url: `${origin}/property/${row.slug || row.id}`,
      lastModified: row.last_review_date ?? row.updated_at ?? undefined,
      changeFrequency: "weekly" as const,
      priority: (row.review_count ?? 0) > 2 ? 0.8 : 0.7,
    })),
    ...unitRoutes,
  ];
}
