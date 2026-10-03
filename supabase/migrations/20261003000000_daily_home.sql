-- Daily renter home: watch lists, private lease/rent notes, and city searches.

alter table public.profiles
  add column if not exists home_city text
    check (home_city is null or char_length(home_city) between 2 and 100),
  add column if not exists home_province text
    check (home_province is null or home_province in (
      'AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'
    ));

alter table public.saved_properties
  add column if not exists is_home boolean not null default false;

create unique index if not exists saved_properties_one_home
  on public.saved_properties (user_id) where is_home;

create table public.saved_searches (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  city text not null check (char_length(city) between 2 and 100),
  province text not null check (province in (
    'AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT'
  )),
  property_type text check (property_type is null or property_type in (
    'apartment','condo','house','townhouse','basement','duplex','triplex',
    'fourplex','student_housing','other'
  )),
  created_at timestamptz not null default now()
);
create unique index saved_searches_unique
  on public.saved_searches (user_id, lower(city), province, coalesce(property_type, ''));
create index saved_searches_user_idx on public.saved_searches (user_id, created_at desc);

create table public.lease_dates (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,
  lease_end date not null,
  notice_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create trigger lease_dates_updated_at before update on public.lease_dates
  for each row execute function public.set_updated_at();

create table public.rent_logs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,
  year integer not null check (year between 1950 and 2100),
  month integer not null check (month between 1 and 12),
  amount numeric(10, 2) not null check (amount > 0 and amount < 100000),
  paid_on date,
  created_at timestamptz not null default now(),
  unique (user_id, year, month)
);
create index rent_logs_user_idx on public.rent_logs (user_id, year desc, month desc);

create table public.home_notes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  property_id uuid references public.properties (id) on delete set null,
  topic text not null check (topic in ('noise','repairs','heat','pests','management','other')),
  body text not null check (char_length(body) between 1 and 2000),
  created_at timestamptz not null default now()
);
create index home_notes_user_idx on public.home_notes (user_id, created_at desc);

create table public.move_checklist (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  completed_steps text[] not null default '{}',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, property_id),
  check (completed_steps <@ array['view','reviews','rent','insurance','utilities','keys']::text[])
);
create trigger move_checklist_updated_at before update on public.move_checklist
  for each row execute function public.set_updated_at();

create or replace function public.remap_daily_home_property(p_source uuid, p_target uuid)
returns void
language plpgsql
set search_path = public
as $$
begin
  delete from public.move_checklist s
  where s.property_id = p_source
    and exists (
      select 1 from public.move_checklist t
      where t.user_id = s.user_id and t.property_id = p_target
    );
  update public.move_checklist set property_id = p_target where property_id = p_source;
  update public.lease_dates set property_id = p_target where property_id = p_source;
  update public.rent_logs set property_id = p_target where property_id = p_source;
  update public.home_notes set property_id = p_target where property_id = p_source;
end;
$$;

create or replace function public.merge_properties(
  p_source uuid,
  p_target uuid,
  p_actor uuid default null,
  p_reason text default null
)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_source public.properties;
  v_target public.properties;
  v_hidden_conflicts uuid[];
  v_moved jsonb;
  v_count integer;
begin
  if p_source = p_target then
    raise exception 'Source and target must differ';
  end if;
  select * into v_source from public.properties where id = p_source for update;
  select * into v_target from public.properties where id = p_target for update;
  if v_source.id is null or v_target.id is null then
    raise exception 'Property not found';
  end if;
  if v_source.status = 'merged' or v_target.status = 'merged' then
    raise exception 'Cannot merge an already-merged property';
  end if;

  with conflicts as (
    select s.id from public.reviews s
    join public.reviews t on t.user_id = s.user_id and t.property_id = p_target
      and t.status in ('pending', 'published')
    where s.property_id = p_source and s.status in ('pending', 'published') and s.user_id is not null
  ), hidden as (
    update public.reviews set status = 'hidden' where id in (select id from conflicts) returning id
  )
  select array_agg(id) into v_hidden_conflicts from hidden;

  update public.rent_reports s set status = 'hidden'
  where s.property_id = p_source and s.status in ('pending', 'published') and s.user_id is not null
    and exists (
      select 1 from public.rent_reports t
      where t.property_id = p_target and t.user_id = s.user_id and t.bedrooms = s.bedrooms
        and coalesce(t.lease_start_year, 0) = coalesce(s.lease_start_year, 0)
        and t.status in ('pending', 'published'));

  delete from public.saved_properties s
  where s.property_id = p_source
    and exists (select 1 from public.saved_properties t where t.user_id = s.user_id and t.property_id = p_target);

  update public.property_claims c set verification_status = 'rejected', notes = coalesce(c.notes, '') || ' [superseded by merge]'
  where c.property_id = p_source and c.verification_status in ('pending', 'approved')
    and exists (select 1 from public.property_claims t where t.user_id = c.user_id and t.property_id = p_target
                and t.verification_status in ('pending', 'approved'));

  v_moved := '{}'::jsonb;
  update public.reviews set property_id = p_target where property_id = p_source;
  get diagnostics v_count = row_count;
  v_moved := v_moved || jsonb_build_object('reviews', v_count);
  update public.rent_reports set property_id = p_target where property_id = p_source;
  get diagnostics v_count = row_count;
  v_moved := v_moved || jsonb_build_object('rent_reports', v_count);
  update public.saved_properties set property_id = p_target where property_id = p_source;
  get diagnostics v_count = row_count;
  v_moved := v_moved || jsonb_build_object('saved', v_count);
  update public.property_claims set property_id = p_target where property_id = p_source;
  get diagnostics v_count = row_count;
  v_moved := v_moved || jsonb_build_object('claims', v_count);
  update public.management_responses set property_id = p_target where property_id = p_source;
  get diagnostics v_count = row_count;
  v_moved := v_moved || jsonb_build_object('responses', v_count);
  update public.property_media set property_id = p_target where property_id = p_source;
  update public.property_promotions set property_id = p_target where property_id = p_source;
  update public.leads set property_id = p_target where property_id = p_source;
  perform public.remap_daily_home_property(p_source, p_target);

  update public.property_slug_redirects set property_id = p_target where property_id = p_source;
  if v_source.slug is not null then
    insert into public.property_slug_redirects (slug, property_id) values (v_source.slug, p_target)
    on conflict (slug) do update set property_id = excluded.property_id;
  end if;

  update public.properties set status = 'merged', merged_into_id = p_target, slug = null where id = p_source;
  delete from public.property_ai_summaries where property_id = p_source;
  update public.property_ai_summaries set status = 'stale' where property_id = p_target;

  perform public.refresh_property_stats(p_source);
  perform public.refresh_property_stats(p_target);

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (p_actor, 'property.merge', 'property', p_target::text, jsonb_build_object(
    'source_id', p_source, 'target_id', p_target, 'source_slug', v_source.slug,
    'source_address', v_source.address_line_1 || ', ' || v_source.city,
    'moved', v_moved, 'hidden_duplicate_reviews', coalesce(to_jsonb(v_hidden_conflicts), '[]'::jsonb),
    'reason', p_reason));

  return v_moved;
end;
$$;

alter table public.saved_searches enable row level security;
alter table public.lease_dates enable row level security;
alter table public.rent_logs enable row level security;
alter table public.home_notes enable row level security;
alter table public.move_checklist enable row level security;

create policy saved_searches_all_own on public.saved_searches for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy lease_dates_all_own on public.lease_dates for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy rent_logs_all_own on public.rent_logs for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy home_notes_all_own on public.home_notes for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy move_checklist_all_own on public.move_checklist for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

revoke all on public.saved_searches, public.lease_dates, public.rent_logs,
  public.home_notes, public.move_checklist from anon;
grant select, insert, update, delete on public.saved_searches, public.lease_dates,
  public.rent_logs, public.home_notes, public.move_checklist to authenticated;

revoke execute on function public.remap_daily_home_property(uuid, uuid) from public, anon, authenticated;
grant execute on function public.remap_daily_home_property(uuid, uuid) to service_role;
revoke execute on function public.merge_properties(uuid, uuid, uuid, text) from public, anon, authenticated;
grant execute on function public.merge_properties(uuid, uuid, uuid, text) to service_role;
