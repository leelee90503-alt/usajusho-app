-- Shipping rate tiers, managed from /admin/pricing.
-- Rates are priced per kg (JPY), in weight bands (min_weight_kg inclusive,
-- max_weight_kg exclusive; the last/highest tier may leave max_weight_kg null
-- to mean "and above"). The chargeable weight for a package is
-- max(actual weight_kg, volumetric weight), where volumetric weight is
-- (length_cm * width_cm * height_cm) / 5000 -- the standard air-freight
-- divisor used by DHL/FedEx/UPS.

create table if not exists public.shipping_rates (
  id uuid primary key default gen_random_uuid(),
  label text not null,
  min_weight_kg numeric(10,2) not null,
  max_weight_kg numeric(10,2),
  price_per_kg integer not null,
  min_charge integer not null default 0,
  is_active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shipping_rates_range_check check (
    max_weight_kg is null or max_weight_kg > min_weight_kg
  )
);

alter table public.shipping_rates enable row level security;

create policy "Authenticated users can view active rates"
  on public.shipping_rates for select
  using (auth.role() = 'authenticated' and is_active = true);

create policy "Admins can view all rates"
  on public.shipping_rates for select
  using (public.is_admin(auth.uid()));

create policy "Admins can insert rates"
  on public.shipping_rates for insert
  with check (public.is_admin(auth.uid()));

create policy "Admins can update rates"
  on public.shipping_rates for update
  using (public.is_admin(auth.uid()));

create policy "Admins can delete rates"
  on public.shipping_rates for delete
  using (public.is_admin(auth.uid()));

create index if not exists shipping_rates_min_weight_idx
  on public.shipping_rates(min_weight_kg);

alter table public.packages add column if not exists length_cm numeric(10,2);
alter table public.packages add column if not exists width_cm numeric(10,2);
alter table public.packages add column if not exists height_cm numeric(10,2);
alter table public.packages add column if not exists weight_kg numeric(10,2);
alter table public.packages add column if not exists volumetric_weight_kg numeric(10,2);
alter table public.packages add column if not exists chargeable_weight_kg numeric(10,2);
alter table public.packages add column if not exists rate_id uuid references public.shipping_rates(id) on delete set null;
