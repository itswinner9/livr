-- Staff can always see total account counts, including when using the
-- service role (auth.uid() is null) or a moderator session.

create or replace function public.staff_profile_counts()
returns table(total integer, renters integer, managers integer, staff integer)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not (public.is_privileged_context() or public.is_moderator()) then
    raise exception 'Not allowed' using errcode = '42501';
  end if;
  return query
  select
    count(*)::integer as total,
    count(*) filter (where role = 'user')::integer as renters,
    count(*) filter (where role = 'manager')::integer as managers,
    count(*) filter (where role in ('admin', 'moderator'))::integer as staff
  from public.profiles;
end;
$$;

revoke all on function public.staff_profile_counts() from public, anon;
grant execute on function public.staff_profile_counts() to authenticated, service_role;
