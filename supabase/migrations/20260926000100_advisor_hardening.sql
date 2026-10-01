-- Hardening from Supabase database advisors.

-- Pin search_path on trigger/helper functions.
alter function public.set_updated_at() set search_path = public, extensions;
alter function public.is_privileged_context() set search_path = public, extensions;
alter function public.guard_profile_update() set search_path = public, extensions;
alter function public.sync_property_location() set search_path = public, extensions;
alter function public.guard_property_write() set search_path = public, extensions;
alter function public.guard_review_write() set search_path = public, extensions;
alter function public.guard_rent_report_write() set search_path = public, extensions;
alter function public.guard_flag_insert() set search_path = public, extensions;
alter function public.guard_claim_insert() set search_path = public, extensions;
alter function public.guard_management_response_write() set search_path = public, extensions;

-- Trigger-only security definer functions must not be callable through the API.
revoke execute on function public.on_content_change_refresh_stats() from public, anon, authenticated;
revoke execute on function public.refresh_review_vote_counts() from public, anon, authenticated;

-- Evaluate auth.uid()/auth.role() once per statement instead of once per row.
do $$
declare
  p record;
  new_qual text;
  new_check text;
  stmt text;
begin
  for p in
    select tablename, policyname, qual, with_check
    from pg_policies
    where schemaname = 'public'
      and (qual ~ 'auth\.(uid|role)\(\)' or with_check ~ 'auth\.(uid|role)\(\)')
      and coalesce(qual, '') !~* 'select auth\.'
      and coalesce(with_check, '') !~* 'select auth\.'
  loop
    new_qual := regexp_replace(p.qual, 'auth\.(uid|role)\(\)', '(select auth.\1())', 'g');
    new_check := regexp_replace(p.with_check, 'auth\.(uid|role)\(\)', '(select auth.\1())', 'g');
    stmt := format('alter policy %I on public.%I', p.policyname, p.tablename);
    if new_qual is not null then
      stmt := stmt || format(' using (%s)', new_qual);
    end if;
    if new_check is not null then
      stmt := stmt || format(' with check (%s)', new_check);
    end if;
    execute stmt;
  end loop;
end
$$;

-- Cover foreign keys used by deletes/cascades and moderator lookups.
create index if not exists audit_logs_actor_idx on public.audit_logs (actor_user_id);
create index if not exists management_responses_manager_idx on public.management_responses (manager_user_id);
create index if not exists moderation_actions_moderator_idx on public.moderation_actions (moderator_id);
create index if not exists properties_created_by_idx on public.properties (created_by);
create index if not exists properties_merged_into_idx on public.properties (merged_into_id);
create index if not exists property_claims_reviewed_by_idx on public.property_claims (reviewed_by);
create index if not exists property_media_uploaded_by_idx on public.property_media (uploaded_by);
create index if not exists property_promotions_manager_idx on public.property_promotions (manager_user_id);
create index if not exists property_slug_redirects_property_idx on public.property_slug_redirects (property_id);
create index if not exists review_flags_reported_by_idx on public.review_flags (reported_by);
create index if not exists review_flags_resolved_by_idx on public.review_flags (resolved_by);
create index if not exists review_revisions_changed_by_idx on public.review_revisions (changed_by);
