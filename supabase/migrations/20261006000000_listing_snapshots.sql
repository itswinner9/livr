-- One listing-site snapshot per building: an outside score and an asking rent.
-- Kept apart from reviews and rent_reports so it never enters LivRank renter ratings,
-- property stats, or review structured data.

create table public.listing_snapshots (
  property_id uuid primary key references public.properties (id) on delete cascade,
  source text not null check (char_length(source) between 2 and 60),
  source_url text check (source_url is null or char_length(source_url) <= 500),
  score_10 numeric(3, 1) check (score_10 is null or score_10 between 0 and 10),
  bedrooms smallint check (bedrooms is null or bedrooms between 0 and 10),
  asking_rent integer check (asking_rent is null or (asking_rent > 0 and asking_rent < 100000)),
  captured_at timestamptz not null default now()
);

alter table public.listing_snapshots enable row level security;

create policy listing_snapshots_public_read on public.listing_snapshots
  for select to anon, authenticated
  using (true);

grant select on public.listing_snapshots to anon, authenticated;
