-- USAJUSHO: profiles table + auto US suite address assignment
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  suite_number text unique not null,
  us_address_line1 text not null,
  us_address_line2 text not null,
  us_city text not null default 'Portland',
  us_state text not null default 'OR',
  us_zip text not null default '97220',
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
begin
  new_suite := 'USJ-' || lpad(nextval('public.suite_number_seq')::text, 6, '0');

  insert into public.profiles (
    id, full_name, suite_number, us_address_line1, us_address_line2
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new_suite,
    '1234 NE Logistics Way',
    'Suite ' || new_suite
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
