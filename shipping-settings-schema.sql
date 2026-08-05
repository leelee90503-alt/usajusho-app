-- USAJUSHO: admin-configurable shipping base address + suite-number toggle
--
-- Lets admins change the shared warehouse base address (used for every
-- customer's assigned US address) from /admin/shipping, without needing a
-- code deploy. Also adds a toggle for whether Suite numbers are shown to
-- customers on their dashboard.

create table if not exists public.shipping_settings (
  id integer primary key default 1,
  base_address_line1 text not null default '18533 S Western Ave',
  base_city text not null default 'Gardena',
  base_state text not null default 'CA',
  base_zip text not null default '90248',
  suite_number_enabled boolean not null default false,
  updated_at timestamptz not null default now(),
  constraint shipping_settings_singleton check (id = 1)
);

alter table public.shipping_settings enable row level security;

-- No secrets live here, and the customer dashboard needs to read
-- suite_number_enabled to decide whether to show the Suite line.
create policy "Anyone can view shipping settings"
  on public.shipping_settings for select
  using (true);

create policy "Admins can update shipping settings"
  on public.shipping_settings for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Admins can insert shipping settings"
  on public.shipping_settings for insert
  with check (public.is_admin(auth.uid()));

insert into public.shipping_settings (id, base_address_line1, base_city, base_state, base_zip, suite_number_enabled)
values (1, '18533 S Western Ave', 'Gardena', 'CA', '90248', false)
on conflict (id) do nothing;

-- handle_new_user() now reads the base address from shipping_settings
-- instead of a hardcoded literal, so admin changes apply to future
-- signups immediately.
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
    id, full_name, suite_number, us_address_line1, us_address_line2, us_city, us_state, us_zip, email
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
    new.email
  );
  return new;
end;
$$;
