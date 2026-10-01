-- LivRank initial schema.
-- Properties are the central entity. Reviews and rent reports belong to properties.
-- All user-generated content starts as 'pending' and becomes public only after moderation.
-- Public reads go through the public_* views, which never expose user IDs, emails, or unit numbers.

create schema if not exists extensions;
create extension if not exists postgis with schema extensions;
create extension if not exists vector with schema extensions;
create extension if not exists pg_trgm with schema extensions;

set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- Helpers
-- ---------------------------------------------------------------------------

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

-- True for trusted server contexts: migrations, seeds, SECURITY DEFINER functions, and the service role.
create or replace function public.is_privileged_context()
returns boolean
language sql
stable
as $$
  select current_user in ('postgres', 'supabase_admin', 'service_role')
      or coalesce(auth.role(), '') = 'service_role';
$$;

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  display_name text check (display_name is null or char_length(display_name) between 1 and 60),
  avatar_url text,
  role text not null default 'user' check (role in ('user', 'moderator', 'admin', 'manager')),
  subscription_status text not null default 'free'
    check (subscription_status in ('free', 'premium', 'manager_pro', 'manager_portfolio', 'past_due', 'canceled')),
  subscription_plan text,
  stripe_customer_id text unique,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create trigger profiles_updated_at before update on public.profiles
  for each row execute function public.set_updated_at();

create or replace function public.is_moderator()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('moderator', 'admin')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Role and subscription fields can only be changed by trusted server code (service role).
create or replace function public.guard_profile_update()
returns trigger
language plpgsql
as $$
begin
  if public.is_privileged_context() then
    return new;
  end if;
  if new.id is distinct from old.id
     or new.role is distinct from old.role
     or new.subscription_status is distinct from old.subscription_status
     or new.subscription_plan is distinct from old.subscription_plan
     or new.stripe_customer_id is distinct from old.stripe_customer_id
     or new.stripe_subscription_id is distinct from old.stripe_subscription_id then
    raise exception 'Not allowed to change protected profile fields' using errcode = '42501';
  end if;
  return new;
end;
$$;

create trigger profiles_guard_update before update on public.profiles
  for each row execute function public.guard_profile_update();

-- ---------------------------------------------------------------------------
-- Properties
-- ---------------------------------------------------------------------------

create table public.properties (
  id uuid primary key default gen_random_uuid(),
  address_line_1 text not null check (char_length(address_line_1) between 3 and 200),
  address_line_2 text check (address_line_2 is null or char_length(address_line_2) <= 100),
  city text not null check (char_length(city) between 2 and 100),
  province text not null
    check (province in ('AB','BC','MB','NB','NL','NS','NT','NU','ON','PE','QC','SK','YT')),
  postal_code text,
  country text not null default 'Canada',
  building_name text check (building_name is null or char_length(building_name) <= 120),
  property_type text check (property_type is null or property_type in (
    'apartment','condo','house','townhouse','basement','duplex','triplex','fourplex','student_housing','other')),
  year_built integer check (year_built is null or year_built between 1800 and 2100),
  units_count integer check (units_count is null or units_count between 1 and 5000),
  latitude double precision check (latitude is null or latitude between -90 and 90),
  longitude double precision check (longitude is null or longitude between -180 and 180),
  location geography(Point, 4326),
  normalized_address text not null,
  normalized_city text not null,
  normalized_postal_code text,
  provider_place_id text,
  slug text unique,
  status text not null default 'pending' check (status in ('pending', 'active', 'hidden', 'merged')),
  merged_into_id uuid references public.properties (id),
  created_by uuid references public.profiles (id) on delete set null,
  is_demo boolean not null default false,
  -- Denormalized, LivRank-calculated counters (maintained by refresh_property_stats).
  review_count integer not null default 0,
  rent_report_count integer not null default 0,
  avg_overall_rating numeric(3, 2),
  last_review_date timestamptz,
  last_rent_report_date timestamptz,
  has_manager boolean not null default false,
  has_ai_summary boolean not null default false,
  data_completeness smallint not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (merged_into_id is null or merged_into_id <> id)
);

create unique index properties_normalized_address_live_key
  on public.properties (normalized_address) where status <> 'merged';
create index properties_normalized_address_trgm on public.properties using gin (normalized_address gin_trgm_ops);
create index properties_building_name_trgm on public.properties using gin (lower(building_name) gin_trgm_ops);
create index properties_postal_code_idx on public.properties (normalized_postal_code);
create index properties_city_idx on public.properties (normalized_city);
create index properties_province_idx on public.properties (province);
create index properties_status_idx on public.properties (status);
create index properties_provider_place_idx on public.properties (provider_place_id) where provider_place_id is not null;
create index properties_location_gist on public.properties using gist (location);

create trigger properties_updated_at before update on public.properties
  for each row execute function public.set_updated_at();

create or replace function public.sync_property_location()
returns trigger
language plpgsql
as $$
begin
  if new.latitude is not null and new.longitude is not null then
    new.location := extensions.st_setsrid(extensions.st_makepoint(new.longitude, new.latitude), 4326)::extensions.geography;
  else
    new.location := null;
  end if;
  return new;
end;
$$;

create trigger properties_sync_location before insert or update of latitude, longitude on public.properties
  for each row execute function public.sync_property_location();

-- Users can propose properties, but moderation-controlled fields are forced to safe defaults.
create or replace function public.guard_property_write()
returns trigger
language plpgsql
as $$
begin
  if public.is_privileged_context() or public.is_moderator() then
    return new;
  end if;
  if tg_op = 'INSERT' then
    new.status := 'pending';
    new.created_by := auth.uid();
    new.merged_into_id := null;
    new.is_demo := false;
    new.review_count := 0;
    new.rent_report_count := 0;
    new.avg_overall_rating := null;
    new.last_review_date := null;
    new.last_rent_report_date := null;
    new.has_manager := false;
    new.has_ai_summary := false;
    new.data_completeness := 0;
  end if;
  return new;
end;
$$;

create trigger properties_guard_write before insert on public.properties
  for each row execute function public.guard_property_write();

create table public.property_slug_redirects (
  slug text primary key,
  property_id uuid not null references public.properties (id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_property_public(p_property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.properties where id = p_property_id and status = 'active');
$$;

-- ---------------------------------------------------------------------------
-- Reviews
-- ---------------------------------------------------------------------------

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id),
  -- Nullable so public history survives account deletion (see delete-account flow).
  user_id uuid references public.profiles (id) on delete set null,
  overall_rating integer not null check (overall_rating between 1 and 5),
  maintenance_rating integer check (maintenance_rating between 1 and 5),
  management_rating integer check (management_rating between 1 and 5),
  noise_rating integer check (noise_rating between 1 and 5),
  cleanliness_rating integer check (cleanliness_rating between 1 and 5),
  building_condition_rating integer check (building_condition_rating between 1 and 5),
  parking_rating integer check (parking_rating between 1 and 5),
  value_rating integer check (value_rating between 1 and 5),
  review_title text not null check (char_length(review_title) between 3 and 150),
  review_body text not null check (char_length(review_body) between 50 and 10000),
  bedrooms integer check (bedrooms between 0 and 10),
  bathrooms numeric(3, 1) check (bathrooms between 0 and 10),
  monthly_rent numeric(10, 2) check (monthly_rent > 0 and monthly_rent < 100000),
  move_in_year integer check (move_in_year between 1950 and 2100),
  move_out_year integer check (move_out_year between 1950 and 2100),
  renter_status text not null check (renter_status in ('current', 'former')),
  public_display_name boolean not null default false,
  verified_status text not null default 'unverified' check (verified_status in ('unverified', 'verified')),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected', 'hidden')),
  helpful_count integer not null default 0,
  not_helpful_count integer not null default 0,
  is_demo boolean not null default false,
  -- Private moderation signals. Never exposed through public views.
  heuristic_flags jsonb,
  ai_labels jsonb,
  ai_pii_detected boolean,
  ai_checked_at timestamptz,
  ai_processed_at timestamptz,
  search_vector tsvector generated always as (
    to_tsvector('english', coalesce(review_title, '') || ' ' || coalesce(review_body, ''))
  ) stored,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (move_out_year is null or move_in_year is null or move_out_year >= move_in_year)
);

create index reviews_property_id_idx on public.reviews (property_id);
create index reviews_user_id_idx on public.reviews (user_id);
create index reviews_status_idx on public.reviews (status);
create index reviews_created_at_idx on public.reviews (created_at desc);
create index reviews_property_published_idx on public.reviews (property_id, published_at desc) where status = 'published';
create index reviews_search_vector_idx on public.reviews using gin (search_vector);
-- Duplicate detection: one active review per renter per property.
create unique index reviews_one_active_per_user_property
  on public.reviews (user_id, property_id) where status in ('pending', 'published') and user_id is not null;

create trigger reviews_updated_at before update on public.reviews
  for each row execute function public.set_updated_at();

create table public.review_revisions (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  changed_by uuid references public.profiles (id) on delete set null,
  previous_title text not null,
  previous_body text not null,
  reason text,
  changed_at timestamptz not null default now()
);
create index review_revisions_review_idx on public.review_revisions (review_id);

-- Snapshots the stored title/body before an author edit. Reads the row itself so callers cannot forge history.
create or replace function public.record_review_revision(p_review_id uuid, p_reason text)
returns void
language sql
security definer
set search_path = public
as $$
  insert into public.review_revisions (review_id, changed_by, previous_title, previous_body, reason)
  select r.id, auth.uid(), r.review_title, r.review_body, left(p_reason, 200)
  from public.reviews r
  where r.id = p_review_id
    and (r.user_id = auth.uid() or public.is_moderator() or coalesce(auth.role(), '') = 'service_role');
$$;

create or replace function public.guard_review_write()
returns trigger
language plpgsql
as $$
declare
  privileged boolean := public.is_privileged_context() or public.is_moderator();
begin
  if tg_op = 'INSERT' then
    if not privileged then
      new.user_id := auth.uid();
      new.status := 'pending';
      new.verified_status := 'unverified';
      new.helpful_count := 0;
      new.not_helpful_count := 0;
      new.is_demo := false;
      new.published_at := null;
      new.heuristic_flags := null;
      new.ai_labels := null;
      new.ai_pii_detected := null;
      new.ai_checked_at := null;
      new.ai_processed_at := null;
    end if;
  else
    if not privileged then
      new.user_id := old.user_id;
      new.property_id := old.property_id;
      new.verified_status := old.verified_status;
      new.helpful_count := old.helpful_count;
      new.not_helpful_count := old.not_helpful_count;
      new.is_demo := old.is_demo;
      new.published_at := old.published_at;
      new.heuristic_flags := old.heuristic_flags;
      new.ai_labels := old.ai_labels;
      new.ai_pii_detected := old.ai_pii_detected;
      new.ai_checked_at := old.ai_checked_at;
      new.ai_processed_at := old.ai_processed_at;
      new.status := old.status;
      -- A renter changing text sends the review back through moderation and keeps a revision.
      if new.review_title is distinct from old.review_title or new.review_body is distinct from old.review_body then
        perform public.record_review_revision(old.id, 'author_edit');
        new.status := 'pending';
        new.ai_processed_at := null;
      end if;
    end if;
  end if;
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;

create trigger reviews_guard_write before insert or update on public.reviews
  for each row execute function public.guard_review_write();

-- ---------------------------------------------------------------------------
-- Rent reports
-- ---------------------------------------------------------------------------

create table public.rent_reports (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id),
  user_id uuid references public.profiles (id) on delete set null,
  bedrooms integer not null check (bedrooms between 0 and 10),
  bathrooms numeric(3, 1) check (bathrooms between 0 and 10),
  monthly_rent numeric(10, 2) not null check (monthly_rent > 0 and monthly_rent < 100000),
  parking_cost numeric(10, 2) check (parking_cost >= 0 and parking_cost < 10000),
  storage_cost numeric(10, 2) check (storage_cost >= 0 and storage_cost < 10000),
  utilities_included boolean,
  lease_start_year integer check (lease_start_year between 1950 and 2100),
  lease_end_year integer check (lease_end_year between 1950 and 2100),
  renter_status text not null check (renter_status in ('current', 'former')),
  notes text check (notes is null or char_length(notes) <= 1000),
  verified_status text not null default 'unverified' check (verified_status in ('unverified', 'verified')),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected', 'hidden')),
  is_demo boolean not null default false,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (lease_end_year is null or lease_start_year is null or lease_end_year >= lease_start_year)
);

create index rent_reports_property_id_idx on public.rent_reports (property_id);
create index rent_reports_user_id_idx on public.rent_reports (user_id);
create index rent_reports_status_idx on public.rent_reports (status);
create unique index rent_reports_one_pending_per_user_property_unit
  on public.rent_reports (user_id, property_id, bedrooms, coalesce(lease_start_year, 0))
  where status in ('pending', 'published') and user_id is not null;

create trigger rent_reports_updated_at before update on public.rent_reports
  for each row execute function public.set_updated_at();

create or replace function public.guard_rent_report_write()
returns trigger
language plpgsql
as $$
declare
  privileged boolean := public.is_privileged_context() or public.is_moderator();
begin
  if tg_op = 'INSERT' then
    if not privileged then
      new.user_id := auth.uid();
      new.status := 'pending';
      new.verified_status := 'unverified';
      new.is_demo := false;
      new.published_at := null;
    end if;
  elsif not privileged then
    new.user_id := old.user_id;
    new.property_id := old.property_id;
    new.verified_status := old.verified_status;
    new.is_demo := old.is_demo;
    new.published_at := old.published_at;
    new.status := case
      when row(new.monthly_rent, new.bedrooms, new.bathrooms, new.parking_cost, new.storage_cost,
               new.utilities_included, new.lease_start_year, new.lease_end_year, new.notes)
           is distinct from
           row(old.monthly_rent, old.bedrooms, old.bathrooms, old.parking_cost, old.storage_cost,
               old.utilities_included, old.lease_start_year, old.lease_end_year, old.notes)
      then 'pending' else old.status end;
  end if;
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;

create trigger rent_reports_guard_write before insert or update on public.rent_reports
  for each row execute function public.guard_rent_report_write();

-- ---------------------------------------------------------------------------
-- Votes, flags, moderation, audit
-- ---------------------------------------------------------------------------

create or replace function public.is_review_published(p_review_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.reviews where id = p_review_id and status = 'published');
$$;

create table public.review_votes (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  vote text not null check (vote in ('helpful', 'not_helpful')),
  created_at timestamptz not null default now(),
  unique (review_id, user_id)
);
create index review_votes_user_idx on public.review_votes (user_id);

create or replace function public.refresh_review_vote_counts()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  rid uuid := coalesce(new.review_id, old.review_id);
begin
  update public.reviews r set
    helpful_count = (select count(*) from public.review_votes v where v.review_id = rid and v.vote = 'helpful'),
    not_helpful_count = (select count(*) from public.review_votes v where v.review_id = rid and v.vote = 'not_helpful')
  where r.id = rid;
  return null;
end;
$$;

create trigger review_votes_counts after insert or update or delete on public.review_votes
  for each row execute function public.refresh_review_vote_counts();

create table public.review_flags (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  reported_by uuid references public.profiles (id) on delete set null,
  reason text not null check (reason in (
    'spam','personal_information','harassment','threat','unsupported_accusation',
    'fake_or_misleading','not_renter_experience','other')),
  details text check (details is null or char_length(details) <= 1000),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  source text not null default 'user' check (source in ('user', 'ai', 'system')),
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz,
  created_at timestamptz not null default now()
);
create index review_flags_review_idx on public.review_flags (review_id);
create index review_flags_status_idx on public.review_flags (status);
create unique index review_flags_one_open_per_reporter
  on public.review_flags (review_id, reported_by) where status = 'open' and reported_by is not null;

create or replace function public.guard_flag_insert()
returns trigger
language plpgsql
as $$
begin
  if not (public.is_privileged_context() or public.is_moderator()) then
    new.reported_by := auth.uid();
    new.status := 'open';
    new.source := 'user';
    new.resolved_by := null;
    new.resolved_at := null;
  end if;
  return new;
end;
$$;

create trigger review_flags_guard_insert before insert on public.review_flags
  for each row execute function public.guard_flag_insert();

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  moderator_id uuid references public.profiles (id) on delete set null,
  target_type text not null check (target_type in (
    'review','rent_report','flag','management_response','property_claim','property')),
  target_id uuid not null,
  action text not null,
  reason text,
  created_at timestamptz not null default now()
);
create index moderation_actions_target_idx on public.moderation_actions (target_type, target_id);
create index moderation_actions_created_idx on public.moderation_actions (created_at desc);

create table public.audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid references public.profiles (id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index audit_logs_entity_idx on public.audit_logs (entity_type, entity_id);
create index audit_logs_created_idx on public.audit_logs (created_at desc);

-- ---------------------------------------------------------------------------
-- AI: topics, embeddings, summaries
-- ---------------------------------------------------------------------------

create table public.review_topics (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  topic text not null check (topic in (
    'maintenance','management','noise','parking','security','elevator','heating','water','plumbing',
    'cleanliness','pests','neighbours','rent_increases','building_condition','amenities','transit','location')),
  confidence numeric(4, 3) not null default 1 check (confidence between 0 and 1),
  source text not null default 'ai' check (source in ('ai', 'heuristic', 'seed')),
  created_at timestamptz not null default now(),
  unique (review_id, topic)
);
create index review_topics_topic_idx on public.review_topics (topic);

-- Dimension must match OPENROUTER_EMBEDDING_MODEL (1536 for openai/text-embedding-3-small).
create table public.review_embeddings (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null unique references public.reviews (id) on delete cascade,
  embedding vector(1536) not null,
  model_name text not null,
  content_hash text not null,
  created_at timestamptz not null default now()
);
create index review_embeddings_hnsw on public.review_embeddings using hnsw (embedding vector_cosine_ops);

create table public.property_ai_summaries (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null unique references public.properties (id) on delete cascade,
  summary_text text not null,
  summary_json jsonb,
  source_review_count integer not null,
  model_name text not null,
  status text not null default 'ready' check (status in ('ready', 'stale', 'failed')),
  generated_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Saved properties, notifications
-- ---------------------------------------------------------------------------

create table public.saved_properties (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  property_id uuid not null references public.properties (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, property_id)
);
create index saved_properties_user_idx on public.saved_properties (user_id);
create index saved_properties_property_idx on public.saved_properties (property_id);

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  type text not null check (type in (
    'review_approved','review_rejected','rent_report_approved','rent_report_rejected',
    'new_property_review','new_rent_report','saved_property_update','manager_response',
    'claim_approved','claim_rejected','system')),
  title text not null,
  body text,
  link text,
  read_at timestamptz,
  created_at timestamptz not null default now()
);
create index notifications_user_idx on public.notifications (user_id, created_at desc);

create table public.notification_preferences (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references public.profiles (id) on delete cascade,
  email_reviews boolean not null default true,
  email_rent_reports boolean not null default true,
  email_manager_responses boolean not null default true,
  marketing_email boolean not null default false,
  updated_at timestamptz not null default now()
);

create trigger notification_preferences_updated_at before update on public.notification_preferences
  for each row execute function public.set_updated_at();

-- ---------------------------------------------------------------------------
-- Property managers
-- ---------------------------------------------------------------------------

create table public.property_claims (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id),
  user_id uuid not null references public.profiles (id) on delete cascade,
  verification_status text not null default 'pending'
    check (verification_status in ('pending', 'approved', 'rejected')),
  verification_method text not null
    check (verification_method in ('business_email', 'document', 'phone', 'other')),
  company_name text check (company_name is null or char_length(company_name) <= 120),
  notes text check (notes is null or char_length(notes) <= 2000),
  reviewed_by uuid references public.profiles (id) on delete set null,
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index property_claims_property_idx on public.property_claims (property_id);
create index property_claims_user_idx on public.property_claims (user_id);
create unique index property_claims_one_active
  on public.property_claims (property_id, user_id) where verification_status in ('pending', 'approved');

create trigger property_claims_updated_at before update on public.property_claims
  for each row execute function public.set_updated_at();

create or replace function public.guard_claim_insert()
returns trigger
language plpgsql
as $$
begin
  if not (public.is_privileged_context() or public.is_moderator()) then
    new.user_id := auth.uid();
    new.verification_status := 'pending';
    new.reviewed_by := null;
    new.reviewed_at := null;
  end if;
  return new;
end;
$$;

create trigger property_claims_guard_insert before insert on public.property_claims
  for each row execute function public.guard_claim_insert();

create or replace function public.manages_property(p_property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.is_admin() or exists (
    select 1 from public.property_claims
    where property_id = p_property_id and user_id = auth.uid() and verification_status = 'approved'
  );
$$;

create or replace function public.review_belongs_to_property(p_review_id uuid, p_property_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.reviews
    where id = p_review_id and property_id = p_property_id and status = 'published'
  );
$$;

create table public.management_responses (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  property_id uuid not null references public.properties (id),
  manager_user_id uuid references public.profiles (id) on delete set null,
  response_body text not null check (char_length(response_body) between 10 and 3000),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected', 'hidden')),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index management_responses_review_idx on public.management_responses (review_id);
create index management_responses_property_idx on public.management_responses (property_id);
create unique index management_responses_one_active
  on public.management_responses (review_id) where status in ('pending', 'published');

create trigger management_responses_updated_at before update on public.management_responses
  for each row execute function public.set_updated_at();

create or replace function public.guard_management_response_write()
returns trigger
language plpgsql
as $$
begin
  if not (public.is_privileged_context() or public.is_moderator()) then
    if tg_op = 'INSERT' then
      new.manager_user_id := auth.uid();
      new.status := 'pending';
      new.published_at := null;
    else
      new.manager_user_id := old.manager_user_id;
      new.review_id := old.review_id;
      new.property_id := old.property_id;
      new.published_at := old.published_at;
      new.status := case when new.response_body is distinct from old.response_body then 'pending' else old.status end;
    end if;
  end if;
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;

create trigger management_responses_guard_write before insert or update on public.management_responses
  for each row execute function public.guard_management_response_write();

-- ---------------------------------------------------------------------------
-- Future monetization / media (tables exist; not used in ranking or ratings)
-- ---------------------------------------------------------------------------

create table public.property_promotions (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id),
  manager_user_id uuid references public.profiles (id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'active', 'ended', 'canceled')),
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz not null default now(),
  check (ends_at is null or starts_at is null or ends_at > starts_at)
);
create index property_promotions_property_idx on public.property_promotions (property_id);

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id),
  source text not null,
  type text not null check (type in ('contact_property', 'schedule_viewing', 'request_information')),
  created_at timestamptz not null default now()
);
create index leads_property_idx on public.leads (property_id);

create table public.property_media (
  id uuid primary key default gen_random_uuid(),
  property_id uuid not null references public.properties (id),
  uploaded_by uuid references public.profiles (id) on delete set null,
  storage_path text not null,
  media_type text not null default 'image' check (media_type in ('image')),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected', 'hidden')),
  created_at timestamptz not null default now()
);
create index property_media_property_idx on public.property_media (property_id);

-- ---------------------------------------------------------------------------
-- Rate limiting (shared across serverless instances)
-- ---------------------------------------------------------------------------

create table public.rate_limit_events (
  id bigint generated always as identity primary key,
  key text not null,
  created_at timestamptz not null default now()
);
create index rate_limit_events_key_idx on public.rate_limit_events (key, created_at desc);

create or replace function public.check_rate_limit(p_key text, p_limit integer, p_window_seconds integer)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  recent integer;
begin
  delete from public.rate_limit_events
  where key = p_key and created_at < now() - make_interval(secs => p_window_seconds);
  select count(*) into recent from public.rate_limit_events
  where key = p_key and created_at >= now() - make_interval(secs => p_window_seconds);
  if recent >= p_limit then
    return false;
  end if;
  insert into public.rate_limit_events (key) values (p_key);
  return true;
end;
$$;

-- ---------------------------------------------------------------------------
-- Property statistics (LivRank-calculated, from published content only)
-- ---------------------------------------------------------------------------

create or replace function public.refresh_property_stats(p_property_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  v_review_count integer;
  v_avg numeric;
  v_last_review timestamptz;
  v_rent_count integer;
  v_last_rent timestamptz;
begin
  if p_property_id is null then
    return;
  end if;

  select count(*), round(avg(overall_rating)::numeric, 2), max(published_at)
    into v_review_count, v_avg, v_last_review
  from public.reviews where property_id = p_property_id and status = 'published';

  select count(*), max(published_at)
    into v_rent_count, v_last_rent
  from public.rent_reports where property_id = p_property_id and status = 'published';

  update public.properties p set
    review_count = v_review_count,
    avg_overall_rating = v_avg,
    last_review_date = v_last_review,
    rent_report_count = v_rent_count,
    last_rent_report_date = v_last_rent,
    has_manager = exists (
      select 1 from public.property_claims c
      where c.property_id = p.id and c.verification_status = 'approved'),
    has_ai_summary = exists (
      select 1 from public.property_ai_summaries s where s.property_id = p.id and s.status = 'ready'),
    data_completeness = (
      (case when p.postal_code is not null then 1 else 0 end)
      + (case when p.building_name is not null then 1 else 0 end)
      + (case when p.property_type is not null then 1 else 0 end)
      + (case when p.year_built is not null then 1 else 0 end)
      + (case when p.units_count is not null then 1 else 0 end)
      + (case when p.latitude is not null then 1 else 0 end)) * 100 / 6,
    -- A proposed property becomes public once it has moderated, published content.
    status = case
      when p.status = 'pending' and (v_review_count > 0 or v_rent_count > 0) then 'active'
      else p.status end
  where p.id = p_property_id;
end;
$$;

create or replace function public.on_content_change_refresh_stats()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  o jsonb;
  n jsonb;
begin
  -- Column lists on UPDATE triggers ignore changes made by BEFORE triggers, so compare rows here.
  if tg_op = 'UPDATE' then
    o := to_jsonb(old);
    n := to_jsonb(new);
    if (o ->> 'property_id') is not distinct from (n ->> 'property_id')
       and (o ->> 'status') is not distinct from (n ->> 'status')
       and (o ->> 'verification_status') is not distinct from (n ->> 'verification_status')
       and (o ->> 'overall_rating') is not distinct from (n ->> 'overall_rating')
       and (o ->> 'published_at') is not distinct from (n ->> 'published_at') then
      return null;
    end if;
  end if;
  if tg_op in ('UPDATE', 'DELETE') then
    perform public.refresh_property_stats(old.property_id);
  end if;
  if tg_op = 'INSERT' or (tg_op = 'UPDATE' and new.property_id is distinct from old.property_id) then
    perform public.refresh_property_stats(new.property_id);
  end if;
  return null;
end;
$$;

create trigger reviews_refresh_stats after insert or update or delete
  on public.reviews for each row execute function public.on_content_change_refresh_stats();
create trigger rent_reports_refresh_stats after insert or update or delete
  on public.rent_reports for each row execute function public.on_content_change_refresh_stats();
create trigger property_claims_refresh_stats after insert or update or delete
  on public.property_claims for each row execute function public.on_content_change_refresh_stats();
create trigger property_ai_summaries_refresh_stats after insert or update or delete
  on public.property_ai_summaries for each row execute function public.on_content_change_refresh_stats();

-- ---------------------------------------------------------------------------
-- New user -> profile
-- ---------------------------------------------------------------------------

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_name text := nullif(trim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');
begin
  insert into public.profiles (id, display_name, role, subscription_status)
  values (new.id, left(v_name, 60), 'user', 'free')
  on conflict (id) do nothing;
  insert into public.notification_preferences (user_id) values (new.id)
  on conflict (user_id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Public views (the only anonymous read path for user-generated content)
-- ---------------------------------------------------------------------------

create view public.public_properties with (security_barrier = true) as
select
  id, slug, address_line_1, address_line_2, city, province, postal_code, country,
  building_name, property_type, year_built, units_count, latitude, longitude,
  normalized_address, normalized_city, normalized_postal_code,
  review_count, rent_report_count, avg_overall_rating, last_review_date, last_rent_report_date,
  has_manager, has_ai_summary, is_demo, created_at, updated_at
from public.properties
where status = 'active';

create view public.public_reviews with (security_barrier = true) as
select
  r.id, r.property_id,
  r.overall_rating, r.maintenance_rating, r.management_rating, r.noise_rating,
  r.cleanliness_rating, r.building_condition_rating, r.parking_rating, r.value_rating,
  r.review_title, r.review_body, r.bedrooms, r.bathrooms, r.move_in_year, r.move_out_year,
  r.renter_status,
  case when r.public_display_name then pr.display_name end as author_display_name,
  r.verified_status, r.helpful_count, r.not_helpful_count, r.is_demo,
  r.published_at, r.created_at
from public.reviews r
join public.properties p on p.id = r.property_id and p.status = 'active'
left join public.profiles pr on pr.id = r.user_id
where r.status = 'published';

create view public.public_rent_reports with (security_barrier = true) as
select
  rr.id, rr.property_id, rr.bedrooms, rr.bathrooms, rr.monthly_rent, rr.parking_cost,
  rr.storage_cost, rr.utilities_included, rr.lease_start_year, rr.lease_end_year,
  rr.renter_status, rr.verified_status, rr.is_demo, rr.published_at, rr.created_at
from public.rent_reports rr
join public.properties p on p.id = rr.property_id and p.status = 'active'
where rr.status = 'published';

create view public.public_management_responses with (security_barrier = true) as
select mr.id, mr.review_id, mr.property_id, mr.response_body, mr.published_at as created_at
from public.management_responses mr
join public.reviews r on r.id = mr.review_id and r.status = 'published'
join public.properties p on p.id = mr.property_id and p.status = 'active'
where mr.status = 'published';

create view public.public_property_topics with (security_barrier = true) as
select r.property_id, t.topic, count(distinct t.review_id)::integer as mentions
from public.review_topics t
join public.reviews r on r.id = t.review_id and r.status = 'published'
join public.properties p on p.id = r.property_id and p.status = 'active'
where t.confidence >= 0.5
group by r.property_id, t.topic;

-- ---------------------------------------------------------------------------
-- Search / retrieval functions (return only public, published data)
-- ---------------------------------------------------------------------------

-- p_query must already be normalized by lib/address (lowercase, expanded suffixes).
create or replace function public.search_properties(
  p_query text,
  p_province text default null,
  p_city text default null,
  p_property_type text default null,
  p_limit integer default 20)
returns setof public.public_properties
language sql
stable
set search_path = public, extensions
as $$
  with q as (
    select coalesce(p_query, '') as text,
           array_remove(regexp_split_to_array(coalesce(p_query, ''), '\s+'), '') as tokens
  )
  select pp.*
  from public.public_properties pp, q
  where (p_province is null or pp.province = p_province)
    and (p_city is null or pp.normalized_city = p_city)
    and (p_property_type is null or pp.property_type = p_property_type)
    and (
      q.text = ''
      or not exists (
        select 1 from unnest(q.tokens) tok
        where position(tok in (pp.normalized_address || ' ' || coalesce(lower(pp.building_name), '')
          || ' ' || coalesce(lower(pp.normalized_postal_code), '')
          || ' ' || replace(coalesce(pp.normalized_postal_code, ''), ' ', ''))) = 0
      )
      or word_similarity(q.text, pp.normalized_address) > 0.5
      or (pp.building_name is not null and word_similarity(q.text, lower(pp.building_name)) > 0.5)
    )
  order by
    greatest(similarity(q.text, pp.normalized_address),
             similarity(q.text, coalesce(lower(pp.building_name), ''))) desc,
    pp.review_count desc,
    pp.rent_report_count desc
  limit least(greatest(coalesce(p_limit, 20), 1), 50);
$$;

create or replace function public.match_review_embeddings(
  p_query_embedding vector(1536),
  p_property_id uuid default null,
  p_match_count integer default 8,
  p_min_similarity double precision default 0.2)
returns table (review_id uuid, property_id uuid, similarity double precision)
language sql
stable
security definer
set search_path = public, extensions
as $$
  select e.review_id, r.property_id, 1 - (e.embedding <=> p_query_embedding) as similarity
  from public.review_embeddings e
  join public.reviews r on r.id = e.review_id and r.status = 'published'
  join public.properties p on p.id = r.property_id and p.status = 'active'
  where (p_property_id is null or r.property_id = p_property_id)
    and 1 - (e.embedding <=> p_query_embedding) >= p_min_similarity
  order by e.embedding <=> p_query_embedding
  limit least(greatest(coalesce(p_match_count, 8), 1), 20);
$$;

create or replace function public.search_reviews_text(
  p_query text,
  p_property_id uuid default null,
  p_match_count integer default 8)
returns table (review_id uuid, property_id uuid, rank real)
language sql
stable
security definer
set search_path = public
as $$
  select r.id, r.property_id, ts_rank(r.search_vector, websearch_to_tsquery('english', p_query)) as rank
  from public.reviews r
  join public.properties p on p.id = r.property_id and p.status = 'active'
  where r.status = 'published'
    and (p_property_id is null or r.property_id = p_property_id)
    and r.search_vector @@ websearch_to_tsquery('english', p_query)
  order by rank desc, r.published_at desc
  limit least(greatest(coalesce(p_match_count, 8), 1), 20);
$$;

-- ---------------------------------------------------------------------------
-- Admin: merge duplicate properties (never deletes renter content)
-- ---------------------------------------------------------------------------

create or replace function public.merge_properties(
  p_source uuid, p_target uuid, p_actor uuid, p_reason text default null)
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

  -- Same renter reviewed both: keep the target review active, preserve the source one as hidden.
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

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table public.profiles enable row level security;
alter table public.properties enable row level security;
alter table public.property_slug_redirects enable row level security;
alter table public.reviews enable row level security;
alter table public.rent_reports enable row level security;
alter table public.review_votes enable row level security;
alter table public.review_flags enable row level security;
alter table public.review_revisions enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.audit_logs enable row level security;
alter table public.review_topics enable row level security;
alter table public.review_embeddings enable row level security;
alter table public.property_ai_summaries enable row level security;
alter table public.saved_properties enable row level security;
alter table public.notifications enable row level security;
alter table public.notification_preferences enable row level security;
alter table public.property_claims enable row level security;
alter table public.management_responses enable row level security;
alter table public.property_promotions enable row level security;
alter table public.leads enable row level security;
alter table public.property_media enable row level security;
alter table public.rate_limit_events enable row level security;

-- profiles: private to the owner (and moderators). Public names flow only through public_reviews.
create policy profiles_select_own on public.profiles for select to authenticated
  using (id = auth.uid() or public.is_moderator());
create policy profiles_update_own on public.profiles for update to authenticated
  using (id = auth.uid()) with check (id = auth.uid());

-- properties: anyone can read active ones via public_properties; creators see their own proposals.
create policy properties_select_own_or_mod on public.properties for select to authenticated
  using (created_by = auth.uid() or public.is_moderator());
create policy properties_insert_authenticated on public.properties for insert to authenticated
  with check (auth.uid() is not null);
create policy properties_update_moderator on public.properties for update to authenticated
  using (public.is_moderator()) with check (public.is_moderator());

create policy slug_redirects_public_read on public.property_slug_redirects for select to anon, authenticated
  using (true);

-- reviews
create policy reviews_select_own_or_mod on public.reviews for select to authenticated
  using (user_id = auth.uid() or public.is_moderator());
create policy reviews_insert_own on public.reviews for insert to authenticated
  with check (user_id = auth.uid());
create policy reviews_update_own on public.reviews for update to authenticated
  using (user_id = auth.uid() and status in ('pending', 'published'))
  with check (user_id = auth.uid());
create policy reviews_update_moderator on public.reviews for update to authenticated
  using (public.is_moderator()) with check (public.is_moderator());
create policy reviews_delete_own_pending on public.reviews for delete to authenticated
  using (user_id = auth.uid() and status = 'pending');

-- rent reports
create policy rent_select_own_or_mod on public.rent_reports for select to authenticated
  using (user_id = auth.uid() or public.is_moderator());
create policy rent_insert_own on public.rent_reports for insert to authenticated
  with check (user_id = auth.uid());
create policy rent_update_own on public.rent_reports for update to authenticated
  using (user_id = auth.uid() and status in ('pending', 'published'))
  with check (user_id = auth.uid());
create policy rent_update_moderator on public.rent_reports for update to authenticated
  using (public.is_moderator()) with check (public.is_moderator());
create policy rent_delete_own_pending on public.rent_reports for delete to authenticated
  using (user_id = auth.uid() and status = 'pending');

-- votes: own only, published reviews only
create policy votes_select_own on public.review_votes for select to authenticated
  using (user_id = auth.uid());
create policy votes_insert_own on public.review_votes for insert to authenticated
  with check (user_id = auth.uid() and public.is_review_published(review_id));
create policy votes_update_own on public.review_votes for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy votes_delete_own on public.review_votes for delete to authenticated
  using (user_id = auth.uid());

-- flags
create policy flags_select_own_or_mod on public.review_flags for select to authenticated
  using (reported_by = auth.uid() or public.is_moderator());
create policy flags_insert_own on public.review_flags for insert to authenticated
  with check (reported_by = auth.uid() and public.is_review_published(review_id));
create policy flags_update_moderator on public.review_flags for update to authenticated
  using (public.is_moderator()) with check (public.is_moderator());

-- moderation history / audit: read-only for staff, written by trusted server code
create policy revisions_select_mod on public.review_revisions for select to authenticated
  using (public.is_moderator());
create policy moderation_actions_select_mod on public.moderation_actions for select to authenticated
  using (public.is_moderator());
create policy audit_logs_select_admin on public.audit_logs for select to authenticated
  using (public.is_admin());

-- AI artifacts: topics readable by staff (public aggregate via view), embeddings server-only
create policy topics_select_mod on public.review_topics for select to authenticated
  using (public.is_moderator());
create policy summaries_public_read on public.property_ai_summaries for select to anon, authenticated
  using (status = 'ready' and public.is_property_public(property_id));

-- saved properties
create policy saved_all_own on public.saved_properties for all to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- notifications
create policy notifications_select_own on public.notifications for select to authenticated
  using (user_id = auth.uid());
create policy notifications_update_own on public.notifications for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy notification_prefs_select_own on public.notification_preferences for select to authenticated
  using (user_id = auth.uid());
create policy notification_prefs_update_own on public.notification_preferences for update to authenticated
  using (user_id = auth.uid()) with check (user_id = auth.uid());

-- property claims
create policy claims_select_own_or_mod on public.property_claims for select to authenticated
  using (user_id = auth.uid() or public.is_moderator());
create policy claims_insert_own on public.property_claims for insert to authenticated
  with check (user_id = auth.uid() and public.is_property_public(property_id));
create policy claims_update_moderator on public.property_claims for update to authenticated
  using (public.is_moderator()) with check (public.is_moderator());

-- management responses: approved managers write their own; they can never touch reviews
create policy responses_select_own_or_mod on public.management_responses for select to authenticated
  using (manager_user_id = auth.uid() or public.is_moderator());
create policy responses_insert_manager on public.management_responses for insert to authenticated
  with check (
    manager_user_id = auth.uid()
    and public.manages_property(property_id)
    and public.review_belongs_to_property(review_id, property_id));
create policy responses_update_own on public.management_responses for update to authenticated
  using (manager_user_id = auth.uid() and status in ('pending', 'published'))
  with check (manager_user_id = auth.uid());
create policy responses_update_moderator on public.management_responses for update to authenticated
  using (public.is_moderator()) with check (public.is_moderator());

-- future features: staff read only
create policy promotions_select_mod on public.property_promotions for select to authenticated
  using (public.is_moderator());
create policy leads_select_mod on public.leads for select to authenticated
  using (public.is_moderator());
create policy media_public_read on public.property_media for select to anon, authenticated
  using (status = 'published' and public.is_property_public(property_id));

-- rate_limit_events: no policies (service role only)

-- ---------------------------------------------------------------------------
-- Grants. Supabase grants broad defaults on new objects; tighten them here.
-- ---------------------------------------------------------------------------

revoke all on public.public_properties, public.public_reviews, public.public_rent_reports,
  public.public_management_responses, public.public_property_topics from anon, authenticated;
grant select on public.public_properties, public.public_reviews, public.public_rent_reports,
  public.public_management_responses, public.public_property_topics to anon, authenticated;

revoke all on public.review_embeddings, public.rate_limit_events from anon, authenticated;
revoke insert, update, delete on public.audit_logs, public.moderation_actions, public.review_revisions,
  public.review_topics, public.property_ai_summaries, public.notifications, public.property_promotions,
  public.leads from anon, authenticated;
revoke insert, update, delete on public.property_slug_redirects from anon, authenticated;
revoke all on public.properties, public.reviews, public.rent_reports, public.profiles,
  public.review_votes, public.review_flags, public.saved_properties, public.property_claims,
  public.management_responses, public.notification_preferences, public.property_media from anon;

revoke execute on function public.refresh_property_stats(uuid) from public, anon, authenticated;
revoke execute on function public.merge_properties(uuid, uuid, uuid, text) from public, anon, authenticated;
revoke execute on function public.check_rate_limit(text, integer, integer) from public, anon, authenticated;
revoke execute on function public.record_review_revision(uuid, text) from public, anon;
grant execute on function public.record_review_revision(uuid, text) to authenticated;
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.match_review_embeddings(vector, uuid, integer, double precision) from public, anon, authenticated;

grant execute on function public.search_properties(text, text, text, text, integer) to anon, authenticated;
grant execute on function public.search_reviews_text(text, uuid, integer) to anon, authenticated;
grant execute on function public.refresh_property_stats(uuid) to service_role;
grant execute on function public.merge_properties(uuid, uuid, uuid, text) to service_role;
grant execute on function public.check_rate_limit(text, integer, integer) to service_role;
grant execute on function public.match_review_embeddings(vector, uuid, integer, double precision) to service_role;
