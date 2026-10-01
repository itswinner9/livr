-- Allow the submitting renter (via the server action) to attach hold reasons
-- on insert. Status and publish fields stay forced to pending / unverified.

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
