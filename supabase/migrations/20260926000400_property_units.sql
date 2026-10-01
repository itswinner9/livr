-- Per-unit reviews for multi-unit buildings.
-- Unit numbers are stored for every review but exposed publicly only on former renters' reviews,
-- so current tenants can't be identified by their landlord. Building stats still count every review.

create table public.property_units (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id),
  unit_key text not null check (unit_key ~ '^[A-Z0-9][A-Z0-9-]{0,9}$'),
  created_by uuid references public.profiles (id) on delete set null,
  status text not null default 'active' check (status in ('active', 'hidden')),
  created_at timestamptz not null default now(),
  unique (property_id, unit_key),
  unique (id, property_id)
);

create index property_units_created_by_idx on public.property_units (created_by);

alter table public.property_units enable row level security;
create policy property_units_select_mod on public.property_units for select to authenticated
  using ((select public.is_moderator()));
create policy property_units_update_mod on public.property_units for update to authenticated
  using ((select public.is_moderator())) with check ((select public.is_moderator()));
revoke all on public.property_units from anon;
grant select, update on public.property_units to authenticated;

alter table public.reviews add column unit_id uuid;
alter table public.reviews add constraint reviews_unit_same_property
  foreign key (unit_id, property_id) references public.property_units (id, property_id);
create index reviews_unit_id_idx on public.reviews (unit_id) where unit_id is not null;

drop index public.reviews_one_active_per_user_property;
create unique index reviews_one_active_per_user_property_unit
  on public.reviews (user_id, property_id, coalesce(unit_id, '00000000-0000-0000-0000-000000000000'::uuid))
  where status in ('pending', 'published') and user_id is not null;

-- Canonical unit key; mirrors normalizeUnit() in lib/address/normalize.ts.
create or replace function public.normalize_unit_key(p_label text)
returns text
language sql
immutable
set search_path = public
as $$
  select nullif(
    regexp_replace(
      regexp_replace(upper(trim(coalesce(p_label, ''))), '^(UNIT|APARTMENT|APT|SUITE|STE)[\s.#-]*', ''),
      '[\s#.]', '', 'g'),
    '');
$$;

create or replace function public.find_or_create_unit(p_property_id uuid, p_unit_label text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid := auth.uid();
  v_key text := public.normalize_unit_key(p_unit_label);
  v_id uuid;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if v_key is null or v_key !~ '^[A-Z0-9][A-Z0-9-]{0,9}$' then
    raise exception 'invalid unit number' using errcode = '22023';
  end if;
  if not exists (select 1 from public.properties p where p.id = p_property_id and p.status in ('active', 'pending')) then
    raise exception 'property not found' using errcode = 'P0002';
  end if;

  select u.id into v_id from public.property_units u where u.property_id = p_property_id and u.unit_key = v_key;
  if found then
    return v_id;
  end if;

  if not public.check_rate_limit('unit_create:' || v_uid::text, 30, 3600) then
    raise exception 'rate limit exceeded' using errcode = 'P0429';
  end if;

  insert into public.property_units (property_id, unit_key, created_by)
  values (p_property_id, v_key, v_uid)
  on conflict (property_id, unit_key) do nothing
  returning id into v_id;
  if v_id is null then
    select u.id into v_id from public.property_units u where u.property_id = p_property_id and u.unit_key = v_key;
  end if;
  return v_id;
end;
$$;

-- Property merges move reviews to another building; carry their unit across by key.
create or replace function public.remap_review_unit_on_property_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_key text;
  v_id uuid;
begin
  if new.unit_id is null or new.property_id = old.property_id then
    return new;
  end if;
  select unit_key into v_key from public.property_units where id = new.unit_id;
  insert into public.property_units (property_id, unit_key, created_by)
  values (new.property_id, v_key, null)
  on conflict (property_id, unit_key) do nothing;
  select id into v_id from public.property_units where property_id = new.property_id and unit_key = v_key;
  new.unit_id := v_id;
  return new;
end;
$$;

create trigger reviews_remap_unit before update of property_id on public.reviews
  for each row execute function public.remap_review_unit_on_property_change();

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
join public.properties p on p.id = r.property_id and p.status = 'active'
left join public.profiles pr on pr.id = r.user_id
left join public.property_units u on u.id = r.unit_id
where r.status = 'published';

create view public.public_property_units with (security_barrier = true) as
select
  u.id, u.property_id, u.unit_key,
  count(r.id)::integer as review_count,
  round(avg(r.overall_rating)::numeric, 2) as avg_overall_rating,
  max(r.published_at) as last_review_date
from public.property_units u
join public.properties p on p.id = u.property_id and p.status = 'active'
join public.reviews r on r.unit_id = u.id and r.status = 'published' and r.renter_status = 'former'
where u.status = 'active'
group by u.id, u.property_id, u.unit_key;

grant select on public.public_reviews, public.public_property_units to anon, authenticated;

revoke execute on function public.find_or_create_unit(uuid, text) from public, anon;
grant execute on function public.find_or_create_unit(uuid, text) to authenticated, service_role;
revoke execute on function public.remap_review_unit_on_property_change() from public, anon, authenticated;
