-- USAJUSHO: purchase-agency shipping cost bundling + supplementary charges
--
-- Three related changes:
--
-- 1. Purchase-agency quotes (public.purchase_requests) can now include an
--    upfront US -> Japan shipping-cost estimate as a third line item
--    alongside quote_item_price_cents / quote_fee_cents, all charged
--    together in the same Square payment (quote_total_cents already sums
--    whatever fields the admin quote action writes).
--
-- 2. Once a purchase request is purchased and linked to a public.packages
--    row (see markPurchasedAndLinkPackage() in
--    app/[locale]/admin/purchase-requests/actions.ts), that shipment's
--    shipping cost was already collected in step 1 above -- so the normal
--    missing -> quoted -> paid package flow must skip charging the
--    customer a second time. shipping_prepaid + source_purchase_request_id
--    let resolveMissingPackage() (app/[locale]/admin/packages/actions.ts)
--    detect this and jump straight to "paid" instead of "quoted".
--
--    packages.quote_amount was previously a plain whole-dollar integer
--    (shipping-agency quotes have always been entered in US dollars by
--    admins, despite the customer-facing UI mislabeling them with a yen
--    symbol -- see the app-code changes in the same deploy as this
--    migration, which fix the label only, no numeric conversion). Widening
--    it to numeric(10,2) lets a prepaid package carry over the exact
--    cents-precision shipping cost from quote_shipping_cents without
--    rounding, and lets admins enter cents for new shipping-agency quotes
--    going forward. Existing whole-number values are unaffected.
--
-- 3. Supplementary ("additional") charges: a new, generic way for an admin
--    to bill a customer more later against a specific package (e.g. the
--    item weighed more than the original estimate). Modeled on the
--    existing purchase_requests Square payment-link flow (the only real,
--    non-placeholder payment integration in this codebase), since
--    packages.quote_amount payment itself is still a stand-in
--    (see payForShipment() in app/[locale]/dashboard/actions.ts).

alter table public.purchase_requests
  add column if not exists quote_shipping_cents integer;

alter table public.packages
  add column if not exists shipping_prepaid boolean not null default false;

alter table public.packages
  add column if not exists source_purchase_request_id uuid
    references public.purchase_requests(id) on delete set null;

alter table public.packages
  alter column quote_amount type numeric(10,2);

create index if not exists packages_source_purchase_request_id_idx
  on public.packages(source_purchase_request_id);

create table if not exists public.additional_charges (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  package_id uuid not null references public.packages(id) on delete cascade,
  reason text not null,
  amount_cents integer not null,
  status text not null default 'pending',
  square_order_id text,
  square_payment_id text,
  created_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint additional_charges_status_check check (
    status in ('pending', 'awaiting_payment', 'paid', 'cancelled', 'refunded')
  ),
  constraint additional_charges_amount_check check (amount_cents > 0)
);

alter table public.additional_charges enable row level security;

create policy "Users can view their own additional charges"
  on public.additional_charges for select
  using (auth.uid() = user_id);

create policy "Admins can view all additional charges"
  on public.additional_charges for select
  using (public.is_admin(auth.uid()));

create policy "Admins can create additional charges"
  on public.additional_charges for insert
  with check (public.is_admin(auth.uid()));

create policy "Admins can update all additional charges"
  on public.additional_charges for update
  using (public.is_admin(auth.uid()));

-- Owners may move their own charge from pending straight into
-- awaiting_payment (mirrors purchase_requests' createCheckoutSession
-- pattern) -- they can never set their own amount, reason, or mark
-- themselves paid; that only happens via the Square webhook using the
-- service-role client, which bypasses RLS entirely.
create policy "Users can start payment on their own pending charge"
  on public.additional_charges for update
  using (auth.uid() = user_id and status = 'pending')
  with check (auth.uid() = user_id and status = 'awaiting_payment');

create index if not exists additional_charges_user_id_idx
  on public.additional_charges(user_id);
create index if not exists additional_charges_package_id_idx
  on public.additional_charges(package_id);
create index if not exists additional_charges_status_idx
  on public.additional_charges(status);

-- Note: updated_at is set explicitly by each server action (matching the
-- convention used elsewhere in this project, e.g. purchase-agency-schema.sql),
-- since this project has no shared set_updated_at() trigger function yet.
