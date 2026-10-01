-- Resolve an address to a property, creating a pending property page when none exists.
-- Callers must pass values normalized by lib/address/normalize.ts.

create or replace function public.find_or_create_property(
  p_address_line_1 text,
  p_address_line_2 text,
  p_city text,
  p_province text,
  p_postal_code text,
  p_normalized_address text,
  p_normalized_city text,
  p_normalized_postal_code text,
  p_slug text,
  p_latitude double precision default null,
  p_longitude double precision default null,
  p_provider_place_id text default null,
  p_building_name text default null,
  p_property_type text default null)
returns table (id uuid, slug text, status text, created boolean)
language plpgsql
security definer
set search_path = public, extensions
as $$
#variable_conflict use_column
declare
  v_uid uuid := auth.uid();
  v_row public.properties%rowtype;
  v_slug text;
begin
  if v_uid is null then
    raise exception 'authentication required' using errcode = '42501';
  end if;
  if coalesce(trim(p_normalized_address), '') = '' or coalesce(trim(p_address_line_1), '') = ''
     or coalesce(trim(p_city), '') = '' or coalesce(trim(p_province), '') = '' then
    raise exception 'address is incomplete' using errcode = '22023';
  end if;

  select * into v_row from public.properties p
  where p.status <> 'merged'
    and (p.normalized_address = p_normalized_address
         or (p_provider_place_id is not null and p.provider_place_id = p_provider_place_id))
  order by (p.normalized_address = p_normalized_address) desc
  limit 1;

  if found then
    return query select v_row.id, v_row.slug, v_row.status, false;
    return;
  end if;

  if not public.check_rate_limit('property_create:' || v_uid::text, 10, 3600) then
    raise exception 'rate limit exceeded' using errcode = 'P0429';
  end if;

  v_slug := nullif(trim(p_slug), '');
  if v_slug is not null and (
       exists (select 1 from public.properties p where p.slug = v_slug)
       or exists (select 1 from public.property_slug_redirects r where r.slug = v_slug)) then
    v_slug := v_slug || '-' || substr(replace(gen_random_uuid()::text, '-', ''), 1, 6);
  end if;

  insert into public.properties (
    address_line_1, address_line_2, city, province, postal_code, country,
    building_name, property_type, latitude, longitude,
    normalized_address, normalized_city, normalized_postal_code, provider_place_id,
    slug, status, created_by, is_demo
  ) values (
    trim(p_address_line_1), nullif(trim(p_address_line_2), ''), trim(p_city), upper(trim(p_province)),
    nullif(trim(p_postal_code), ''), 'Canada',
    nullif(trim(p_building_name), ''), nullif(p_property_type, ''), p_latitude, p_longitude,
    p_normalized_address, p_normalized_city, nullif(p_normalized_postal_code, ''), p_provider_place_id,
    v_slug, 'pending', v_uid, false
  )
  on conflict do nothing
  returning * into v_row;

  if v_row.id is null then
    select * into v_row from public.properties p
    where p.normalized_address = p_normalized_address and p.status <> 'merged'
    limit 1;
    return query select v_row.id, v_row.slug, v_row.status, false;
    return;
  end if;

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (v_uid, 'property.proposed', 'property', v_row.id,
          jsonb_build_object('source', case when p_provider_place_id is null then 'manual' else 'mapbox' end));

  return query select v_row.id, v_row.slug, v_row.status, true;
end;
$$;

revoke execute on function public.find_or_create_property(
  text, text, text, text, text, text, text, text, text, double precision, double precision, text, text, text)
  from public, anon;
grant execute on function public.find_or_create_property(
  text, text, text, text, text, text, text, text, text, double precision, double precision, text, text, text)
  to authenticated, service_role;
