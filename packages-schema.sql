alter table public.profiles add column if not exists is_admin boolean not null default false;

-- user_id is nullable: a package physically registered with no matching
-- pre-declaration is created with status 'missing' and no owner yet, until
-- an admin links it to a customer's suite number (see
-- packages-missing-status-migration.sql for the migration that dropped the
-- original NOT NULL constraint on an already-live table).
create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete cascade,
  item_name text not null,
  tracking_number text,
  weight_lbs numeric(10,2),
  status text not null default 'missing',
  admin_note text,
  photo_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.packages enable row level security;

create policy "Users can view their own packages"
  on public.packages for select
  using (auth.uid() = user_id);

create policy "Admins can view all packages"
  on public.packages for select
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins can insert packages"
  on public.packages for insert
  with check (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins can update packages"
  on public.packages for update
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create policy "Admins can delete packages"
  on public.packages for delete
  using (exists (select 1 from public.profiles where id = auth.uid() and is_admin = true));

create index if not exists packages_user_id_idx on public.packages(user_id);
