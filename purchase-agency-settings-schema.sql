-- USAJUSHO: admin-configurable fee settings for the purchase agency
-- ("purchase-proxy" / buy-for-me) feature.
--
-- Singleton settings row (id = 1), mirroring the public.email_settings
-- pattern in email-notifications-schema.sql. flat_fee_cents and
-- fee_percent are the same two numbers that used to be hardcoded as
-- PURCHASE_AGENCY_FLAT_FEE_CENTS / PURCHASE_AGENCY_PERCENT_FEE in
-- lib/purchase-agency-pricing.ts; admins can now update them from
-- /admin/purchase-requests instead of editing code.
create table if not exists public.purchase_agency_settings (
  id integer primary key default 1,
  flat_fee_cents integer not null default 600,
  fee_percent numeric(6,2) not null default 7,
  -- Which Square environment (Sandbox test vs. Production live) the whole
  -- site currently processes payments under. Read by lib/square.ts via the
  -- service-role client; toggled by admins from /admin/purchase-requests
  -- so the switch takes effect immediately without a redeploy.
  square_mode text not null default 'sandbox',
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users(id) on delete set null,
  constraint purchase_agency_settings_singleton check (id = 1),
  constraint purchase_agency_settings_flat_fee_check check (flat_fee_cents >= 0),
  constraint purchase_agency_settings_percent_check check (fee_percent >= 0),
  constraint purchase_agency_settings_square_mode_check check (square_mode in ('sandbox', 'production'))
);

alter table public.purchase_agency_settings enable row level security;

-- Everyone signed in can read the current fee (needed to show pricing /
-- build a quote estimate on both the customer and admin sides).
create policy "Authenticated users can view purchase agency settings"
  on public.purchase_agency_settings for select
  using (auth.role() = 'authenticated');

-- Only admins can change the fee. Reuses public.is_admin(), defined in
-- email-notifications-schema.sql.
create policy "Admins can update purchase agency settings"
  on public.purchase_agency_settings for update
  using (public.is_admin(auth.uid()))
  with check (public.is_admin(auth.uid()));

create policy "Admins can insert purchase agency settings"
  on public.purchase_agency_settings for insert
  with check (public.is_admin(auth.uid()));

insert into public.purchase_agency_settings (id, flat_fee_cents, fee_percent)
values (1, 600, 7)
on conflict (id) do nothing;
