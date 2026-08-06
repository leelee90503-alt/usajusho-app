-- USAJUSHO: profiles table + auto US suite address assignment
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  -- first_name/last_name are collected as separate fields on the signup
  -- form (see app/[locale]/signup/page.tsx) and populated by
  -- handle_new_user() below. full_name stays around (auto-derived as
  -- "first last") since it's what most of the admin/customer UI already
  -- displays.
  first_name text,
  last_name text,
  suite_number text unique not null,
  us_address_line1 text not null,
  us_address_line2 text not null,
  us_city text not null default 'Gardena',
  us_state text not null default 'CA',
  us_zip text not null default '90248',
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

create policy "Users can view their own profile"
  on public.profiles for select
  using (auth.uid() = id);

create policy "Users can update their own profile"
  on public.profiles for update
  using (auth.uid() = id);

-- Sequence used to generate unique suite numbers, e.g. USJ-000123
create sequence if not exists public.suite_number_seq start 1001;

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
declare
  new_suite text;
  v_first_name text;
  v_last_name text;
  v_full_name text;
begin
  new_suite := 'USJ-' || lpad(nextval('public.suite_number_seq')::text, 6, '0');

  v_first_name := coalesce(new.raw_user_meta_data->>'first_name', '');
  v_last_name := coalesce(new.raw_user_meta_data->>'last_name', '');
  v_full_name := nullif(trim(both ' ' from (v_first_name || ' ' || v_last_name)), '');
  if v_full_name is null then
    -- Fall back to a legacy/direct full_name value if first/last weren't
    -- provided (e.g. any pre-existing signup path that never gets updated).
    v_full_name := nullif(new.raw_user_meta_data->>'full_name', '');
  end if;

  insert into public.profiles (
    id, full_name, first_name, last_name, suite_number, us_address_line1, us_address_line2, us_city, us_state, us_zip
  )
  values (
    new.id,
    coalesce(v_full_name, ''),
    nullif(v_first_name, ''),
    nullif(v_last_name, ''),
    new_suite,
    '18533 S Western Ave',
    'Suite ' || new_suite,
    'Gardena',
    'CA',
    '90248'
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
