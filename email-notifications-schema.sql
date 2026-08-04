-- USAJUSHO: email settings + profile email column for real email notifications
alter table public.profiles add column if not exists email text;

update public.profiles
set email = (select u.email from auth.users u where u.id = profiles.id)
where email is null;

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
    id, full_name, suite_number, us_address_line1, us_address_line2, email
  )
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', ''),
    new_suite,
    '1234 NE Logistics Way',
    'Suite ' || new_suite,
    new.email
  );
  return new;
end;
$$;

create policy "Admins can view all profiles"
  on public.profiles for select
  using (exists (select 1 from public.profiles p where p.id = auth.uid() and p.is_admin = true));

create table if not exists public.email_settings (
  id integer primary key default 1,
  emailjs_service_id text,
  emailjs_template_id text,
  emailjs_public_key text,
  emailjs_private_key text,
  updated_at timestamptz not null default now(),
  constraint email_settings_singleton check (id = 1)
);

alter table public.email_settings enable row level security;

create policy "Admins can view email settings"
  on public.email_settings for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins can update email settings"
  on public.email_settings for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true))
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins can insert email settings"
  on public.email_settings for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

insert into public.email_settings (id) values (1) on conflict (id) do nothing;
