-- Staff-only hard delete: child tables without ON DELETE CASCADE must go first.

create or replace function public.admin_delete_property(p_property_id uuid, p_actor uuid)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_prop public.properties;
begin
  if p_actor is null then
    raise exception 'actor required';
  end if;

  select * into v_prop from public.properties where id = p_property_id for update;
  if v_prop.id is null then
    raise exception 'Property not found';
  end if;

  update public.properties
    set merged_into_id = null
    where merged_into_id = p_property_id;

  update public.reviews
    set unit_id = null
    where property_id = p_property_id;

  delete from public.reviews where property_id = p_property_id;
  delete from public.rent_reports where property_id = p_property_id;
  delete from public.management_responses where property_id = p_property_id;
  delete from public.property_claims where property_id = p_property_id;
  delete from public.property_promotions where property_id = p_property_id;
  delete from public.leads where property_id = p_property_id;
  delete from public.property_media where property_id = p_property_id;
  delete from public.property_units where property_id = p_property_id;
  delete from public.properties where id = p_property_id;

  insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata)
  values (
    p_actor,
    'admin_delete_property',
    'property',
    p_property_id::text,
    jsonb_build_object(
      'address_line_1', v_prop.address_line_1,
      'city', v_prop.city,
      'province', v_prop.province
    )
  );

  return jsonb_build_object('ok', true, 'id', p_property_id);
end;
$$;

revoke execute on function public.admin_delete_property(uuid, uuid) from public, anon, authenticated;
grant execute on function public.admin_delete_property(uuid, uuid) to service_role;
