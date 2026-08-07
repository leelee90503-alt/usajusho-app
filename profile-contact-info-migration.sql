-- USAJUSHO: customer phone number + Japan address on profiles
--
-- Adds contact fields collected at signup (see app/[locale]/signup/page.tsx)
-- that customers can later edit from their own profile page
-- (app/[locale]/dashboard/profile) and that admins can view/edit from the
-- customer detail page (app/[locale]/admin/users/[id]).

alter table public.profiles add column if not exists phone_number text;
alter table public.profiles add column if not exists japan_postal_code text;
alter table public.profiles add column if not exists japan_prefecture text;
alter table public.profiles add column if not exists japan_city text;
alter table public.profiles add column if not exists japan_address_line1 text;
alter table public.profiles add column if not exists japan_address_line2 text;

-- handle_new_user() now also populates phone_number + the Japan address
-- fields from signup metadata (see supabase.auth.signUp's options.data in
-- signup/page.tsx). This redefines the same function most recently created
-- in shipping-settings-schema.sql, adding the new fields on top of it.
create or replace function public.handle_new_user() returns trigger language plpgsql security definer set search_path = public as $$
declare
  new_suite text;
  s public.shipping_settings%rowtype;
begin
  select * into s from public.shipping_settings where id = 1;
  if not found then
    s.base_address_line1 := '18533 S Western Ave';
    s.base_city := 'Gardena';
    s.base_state := 'CA';
    s.base_zip := '90248';
  end if;

  new_suite := 'USJ-' || lpad(nextval('public.suite_number_seq')::text, 6, '0');

  insert into public.profiles (
    id, full_name, suite_number, us_address_line1, us_address_line2, us_city, us_state, us_zip, email,
    phone_number, japan_postal_code, japan_prefecture, japan_city, japan_address_line1, japan_address_line2
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new_suite,
    s.base_address_line1,
    'Suite ' || new_suite,
    s.base_city,
    s.base_state,
    s.base_zip,
    new.email,
    nullif(new.raw_user_meta_data->>'phone_number', ''),
    nullif(new.raw_user_meta_data->>'japan_postal_code', ''),
    nullif(new.raw_user_meta_data->>'japan_prefecture', ''),
    nullif(new.raw_user_meta_data->>'japan_city', ''),
    nullif(new.raw_user_meta_data->>'japan_address_line1', ''),
    nullif(new.raw_user_meta_data->>'japan_address_line2', '')
  );
  return new;
end;
$$;
