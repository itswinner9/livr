-- Read helpers for the "rate an address" flow. Pending properties are invisible in
-- public_properties, but renters must be able to open the review form for them.

-- Public-safe columns of an active or pending property, for signed-in contributors.
create or replace function public.get_contribution_property(p_id_or_slug text)
returns jsonb
language sql
stable
security definer
set search_path = public, extensions
as $$
  select jsonb_build_object(
    'id', p.id, 'slug', p.slug, 'status', p.status,
    'address_line_1', p.address_line_1, 'address_line_2', p.address_line_2,
    'city', p.city, 'province', p.province, 'postal_code', p.postal_code, 'country', p.country,
    'building_name', p.building_name, 'property_type', p.property_type,
    'year_built', p.year_built, 'units_count', p.units_count,
    'latitude', p.latitude, 'longitude', p.longitude,
    'normalized_address', p.normalized_address,
    'review_count', p.review_count, 'rent_report_count', p.rent_report_count,
    'avg_overall_rating', p.avg_overall_rating,
    'last_review_date', p.last_review_date, 'last_rent_report_date', p.last_rent_report_date,
    'has_manager', p.has_manager, 'has_ai_summary', p.has_ai_summary, 'is_demo', p.is_demo,
    'created_at', p.created_at, 'updated_at', p.updated_at)
  from public.properties p
  where auth.uid() is not null
    and p.status in ('active', 'pending')
    and (p.slug = p_id_or_slug
         or (p_id_or_slug ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
             and p.id = p_id_or_slug::uuid))
  limit 1;
$$;

-- Which live property (if any) an address resolves to. Returns identifiers only.
create or replace function public.lookup_property_for_address(p_normalized_address text, p_provider_place_id text default null)
returns table (id uuid, slug text, status text)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select p.id, p.slug, p.status
  from public.properties p
  where p.status in ('active', 'pending')
    and (p.normalized_address = p_normalized_address
         or (p_provider_place_id is not null and p.provider_place_id = p_provider_place_id))
  order by (p.normalized_address = p_normalized_address) desc, (p.status = 'active') desc
  limit 1;
$$;

revoke execute on function public.get_contribution_property(text) from public, anon;
grant execute on function public.get_contribution_property(text) to authenticated, service_role;
revoke execute on function public.lookup_property_for_address(text, text) from public;
grant execute on function public.lookup_property_for_address(text, text) to anon, authenticated, service_role;
