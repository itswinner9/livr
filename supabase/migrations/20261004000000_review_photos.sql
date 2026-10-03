-- Photos attached to a renter rating. Public only after the review is published.

create table public.review_photos (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  storage_path text not null unique,
  sort_order integer not null default 0 check (sort_order between 0 and 7),
  created_at timestamptz not null default now()
);

create index review_photos_review_idx on public.review_photos (review_id, sort_order);
create index review_photos_user_idx on public.review_photos (user_id);

create or replace function public.guard_review_photo_write()
returns trigger
language plpgsql
set search_path = public
as $$
declare
  photo_count integer;
begin
  if not public.is_privileged_context() then
    new.user_id := auth.uid();
  end if;
  if new.user_id is null then
    raise exception 'Review photo owner is required';
  end if;
  if not exists (
    select 1 from public.reviews r
    where r.id = new.review_id and r.user_id = new.user_id
  ) then
    raise exception 'Photos can only be attached to your own review';
  end if;
  select count(*) into photo_count from public.review_photos where review_id = new.review_id;
  if photo_count >= 4 then
    raise exception 'A review can include at most 4 photos';
  end if;
  return new;
end;
$$;

create trigger review_photos_guard_write before insert on public.review_photos
  for each row execute function public.guard_review_photo_write();

alter table public.review_photos enable row level security;

create policy review_photos_select_own_or_mod on public.review_photos for select to authenticated
  using (user_id = auth.uid() or public.is_moderator());
create policy review_photos_insert_own on public.review_photos for insert to authenticated
  with check (
    user_id = auth.uid()
    and exists (
      select 1 from public.reviews r
      where r.id = review_id and r.user_id = auth.uid()
    )
  );
create policy review_photos_delete_own on public.review_photos for delete to authenticated
  using (user_id = auth.uid());

create or replace view public.public_review_photos with (security_barrier = true) as
select rp.id, rp.review_id, rp.storage_path, rp.sort_order, rp.created_at
from public.review_photos rp
join public.reviews r on r.id = rp.review_id and r.status = 'published'
join public.properties p on p.id = r.property_id and p.status = 'active' and p.is_demo = false;

revoke all on public.review_photos from anon;
grant select, insert, delete on public.review_photos to authenticated;
revoke all on public.public_review_photos from public, anon, authenticated;
grant select on public.public_review_photos to anon, authenticated;

do $$
begin
  if to_regclass('storage.buckets') is null then
    return;
  end if;

  insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
  values (
    'review-photos',
    'review-photos',
    true,
    4194304,
    array['image/jpeg', 'image/png', 'image/webp']
  )
  on conflict (id) do update
    set public = excluded.public,
        file_size_limit = excluded.file_size_limit,
        allowed_mime_types = excluded.allowed_mime_types;

  begin
    create policy review_photos_storage_insert_own on storage.objects
      for insert to authenticated
      with check (
        bucket_id = 'review-photos'
        and split_part(name, '/', 1) = auth.uid()::text
      );
  exception when duplicate_object then
    null;
  end;

  begin
    create policy review_photos_storage_select_public on storage.objects
      for select to anon, authenticated
      using (bucket_id = 'review-photos');
  exception when duplicate_object then
    null;
  end;

  begin
    create policy review_photos_storage_delete_own on storage.objects
      for delete to authenticated
      using (
        bucket_id = 'review-photos'
        and split_part(name, '/', 1) = auth.uid()::text
      );
  exception when duplicate_object then
    null;
  end;
end
$$;
