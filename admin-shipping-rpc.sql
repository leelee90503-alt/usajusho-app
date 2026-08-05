-- USAJUSHO: admin RPC to bulk-apply a new shipping base address to all
-- existing customer profiles. Uses SECURITY DEFINER (not a broad RLS
-- policy) so it can bypass RLS while still checking is_admin() internally,
-- keeping the update narrowly scoped to this one action.

create or replace function public.admin_apply_shipping_address_to_existing_profiles(
  p_line1 text,
  p_city text,
  p_state text,
  p_zip text
) returns integer
language plpgsql
security definer
set search_path = public
as $function$
declare
  affected integer;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'not authorized';
  end if;

  update public.profiles
  set us_address_line1 = p_line1,
      us_city = p_city,
      us_state = p_state,
      us_zip = p_zip
  where true;

  get diagnostics affected = row_count;
  return affected;
end;
$function$;

grant execute on function public.admin_apply_shipping_address_to_existing_profiles(text, text, text, text) to authenticated;
