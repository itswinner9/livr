-- Hide seed demo buildings from the public site and skip them in lookups.

update public.properties
set status = 'hidden'
where is_demo = true
  and status in ('active', 'pending');

create or replace view public.public_properties with (security_barrier = true) as
select
  id, slug, address_line_1, address_line_2, city, province, postal_code, country,
  building_name, property_type, year_built, units_count, latitude, longitude,
  normalized_address, normalized_city, normalized_postal_code,
  review_count, rent_report_count, avg_overall_rating, last_review_date, last_rent_report_date,
  has_manager, has_ai_summary, is_demo, created_at, updated_at
from public.properties
where status = 'active' and is_demo = false;

create or replace view public.public_reviews with (security_barrier = true) as
select
  r.id, r.property_id,
  r.overall_rating, r.maintenance_rating, r.management_rating, r.noise_rating,
  r.cleanliness_rating, r.building_condition_rating, r.parking_rating, r.value_rating,
  r.review_title, r.review_body, r.bedrooms, r.bathrooms, r.move_in_year, r.move_out_year,
  r.renter_status,
  case when r.public_display_name then pr.display_name end as author_display_name,
  r.verified_status, r.helpful_count, r.not_helpful_count, r.is_demo,
  r.published_at, r.created_at,
  case when r.renter_status = 'former' and u.status = 'active' then u.id end as unit_id,
  case when r.renter_status = 'former' and u.status = 'active' then u.unit_key end as unit_key
from public.reviews r
join public.properties p on p.id = r.property_id and p.status = 'active' and p.is_demo = false
left join public.profiles pr on pr.id = r.user_id
left join public.property_units u on u.id = r.unit_id
where r.status = 'published';

create or replace view public.public_rent_reports with (security_barrier = true) as
select
  rr.id, rr.property_id, rr.bedrooms, rr.bathrooms, rr.monthly_rent, rr.parking_cost,
  rr.storage_cost, rr.utilities_included, rr.lease_start_year, rr.lease_end_year,
  rr.renter_status, rr.verified_status, rr.is_demo, rr.published_at, rr.created_at
from public.rent_reports rr
join public.properties p on p.id = rr.property_id and p.status = 'active' and p.is_demo = false
where rr.status = 'published';

create or replace view public.public_management_responses with (security_barrier = true) as
select mr.id, mr.review_id, mr.property_id, mr.response_body, mr.published_at as created_at
from public.management_responses mr
join public.reviews r on r.id = mr.review_id and r.status = 'published'
join public.properties p on p.id = mr.property_id and p.status = 'active' and p.is_demo = false
where mr.status = 'published';

create or replace view public.public_property_topics with (security_barrier = true) as
select r.property_id, t.topic, count(distinct t.review_id)::integer as mentions
from public.review_topics t
join public.reviews r on r.id = t.review_id and r.status = 'published'
join public.properties p on p.id = r.property_id and p.status = 'active' and p.is_demo = false
where t.confidence >= 0.5
group by r.property_id, t.topic;

create or replace view public.public_property_units with (security_barrier = true) as
select
  u.id, u.property_id, u.unit_key,
  count(r.id)::integer as review_count,
  round(avg(r.overall_rating)::numeric, 2) as avg_overall_rating,
  max(r.published_at) as last_review_date
from public.property_units u
join public.properties p on p.id = u.property_id and p.status = 'active' and p.is_demo = false
join public.reviews r on r.unit_id = u.id and r.status = 'published' and r.renter_status = 'former'
where u.status = 'active'
group by u.id, u.property_id, u.unit_key;

grant select on public.public_properties, public.public_reviews, public.public_rent_reports,
  public.public_management_responses, public.public_property_topics, public.public_property_units
  to anon, authenticated;

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
    and p.is_demo = false
    and (p.slug = p_id_or_slug
         or (p_id_or_slug ~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
             and p.id = p_id_or_slug::uuid))
  limit 1;
$$;

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
    and p.is_demo = false
    and (p.normalized_address = p_normalized_address
         or (p_provider_place_id is not null and p.provider_place_id = p_provider_place_id))
  order by (p.normalized_address = p_normalized_address) desc, (p.status = 'active') desc
  limit 1;
$$;
