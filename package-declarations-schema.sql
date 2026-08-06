-- USAJUSHO: customer self-service package pre-declaration.
-- origin_tracking_number = INBOUND tracking (origin store -> our warehouse).
-- Differs from public.packages.tracking_number, the OUTBOUND tracking
-- number staff enter for warehouse -> Japan shipments.

create table if not exists public.package_declarations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  item_name text not null,
  order_amount numeric(10,2),
  origin_tracking_number text,
  note text,
  receipt_path text,
  status text not null default 'pending',
  matched_package_id uuid references public.packages(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.package_declarations enable row level security;

create policy "Users can view their own declarations"
  on public.package_declarations for select
  using (auth.uid() = user_id);

create policy "Users can insert their own declarations"
  on public.package_declarations for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own pending declarations"
  on public.package_declarations for update
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id);

create policy "Users can delete their own pending declarations"
  on public.package_declarations for delete
  using (auth.uid() = user_id and status = 'pending');

create policy "Admins can view all declarations"
  on public.package_declarations for select
  using (public.is_admin(auth.uid()));

create policy "Admins can update all declarations"
  on public.package_declarations for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Admins can delete all declarations"
  on public.package_declarations for delete
  using (public.is_admin(auth.uid()));

create index if not exists package_declarations_user_id_idx on public.package_declarations(user_id);
create index if not exists package_declarations_status_idx on public.package_declarations(status);

-- Storage bucket for customer-uploaded purchase receipts.
insert into storage.buckets (id, name, public)
values ('package-receipts', 'package-receipts', false)
on conflict (id) do nothing;

create policy "Users can upload their own receipts"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'package-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can view their own receipts"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'package-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users can delete their own receipts"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'package-receipts'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Admins can view all receipts"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'package-receipts'
    and public.is_admin(auth.uid())
  );
