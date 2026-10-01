-- One-level renter replies under reviews. Never affect building scores.

create table public.review_replies (
  id uuid primary key default gen_random_uuid(),
  review_id uuid not null references public.reviews (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(body) between 20 and 1000),
  status text not null default 'pending' check (status in ('pending', 'published', 'rejected', 'hidden')),
  public_display_name boolean not null default false,
  heuristic_flags jsonb,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index review_replies_review_idx on public.review_replies (review_id, created_at);
create index review_replies_status_idx on public.review_replies (status, created_at);
create index review_replies_user_idx on public.review_replies (user_id);

create trigger review_replies_updated_at before update on public.review_replies
  for each row execute function public.set_updated_at();

create or replace function public.guard_review_reply_write()
returns trigger
language plpgsql
set search_path = public, extensions
as $$
declare
  privileged boolean := public.is_privileged_context() or public.is_moderator();
begin
  if tg_op = 'INSERT' then
    if not privileged then
      new.user_id := auth.uid();
      new.status := 'pending';
      new.published_at := null;
    end if;
  elsif not privileged then
    new.user_id := old.user_id;
    new.review_id := old.review_id;
    new.status := old.status;
    new.heuristic_flags := old.heuristic_flags;
    new.published_at := old.published_at;
    new.public_display_name := old.public_display_name;
  end if;
  if new.status = 'published' and (tg_op = 'INSERT' or old.status is distinct from 'published') then
    new.published_at := coalesce(new.published_at, now());
  end if;
  return new;
end;
$$;

create trigger review_replies_guard_write before insert or update on public.review_replies
  for each row execute function public.guard_review_reply_write();

alter table public.review_replies enable row level security;

create policy review_replies_select_own_or_mod on public.review_replies for select to authenticated
  using (user_id = auth.uid() or public.is_moderator());
create policy review_replies_insert_own on public.review_replies for insert to authenticated
  with check (user_id = auth.uid() and public.is_review_published(review_id));
create policy review_replies_update_moderator on public.review_replies for update to authenticated
  using (public.is_moderator()) with check (public.is_moderator());
create policy review_replies_delete_own_pending on public.review_replies for delete to authenticated
  using (user_id = auth.uid() and status = 'pending');

create or replace view public.public_review_replies with (security_barrier = true) as
select
  rr.id,
  rr.review_id,
  rr.body,
  case when rr.public_display_name then pr.display_name end as author_display_name,
  rr.published_at,
  rr.created_at
from public.review_replies rr
join public.reviews r on r.id = rr.review_id and r.status = 'published'
join public.properties p on p.id = r.property_id and p.status = 'active' and p.is_demo = false
left join public.profiles pr on pr.id = rr.user_id
where rr.status = 'published';

revoke all on public.review_replies from anon;
grant select, insert, update, delete on public.review_replies to authenticated;
revoke all on public.public_review_replies from public, anon, authenticated;
grant select on public.public_review_replies to anon, authenticated;

alter table public.moderation_actions
  drop constraint if exists moderation_actions_target_type_check;

alter table public.moderation_actions
  add constraint moderation_actions_target_type_check
  check (target_type in (
    'review',
    'rent_report',
    'flag',
    'management_response',
    'property_claim',
    'property',
    'review_reply'
  ));
