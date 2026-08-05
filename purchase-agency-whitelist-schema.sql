-- USAJUSHO: admin-configurable shopping-site whitelist for the purchase
-- agency ("purchase-proxy" / buy-for-me) feature.
--
-- To reduce counterfeit/fraud risk, customers may only submit a Product
-- URL whose hostname matches (or is a subdomain of) an enabled domain
-- in this table. Admins manage the list from /admin/purchase-requests
-- - no code deploy needed to add, remove, or toggle a store.
create table if not exists public.purchase_agency_whitelist_domains (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  label text not null,
  enabled boolean not null default true,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id) on delete set null
);

alter table public.purchase_agency_whitelist_domains enable row level security;

-- Everyone signed in can read the whitelist (needed to validate a
-- Product URL and to explain which stores are currently supported).
create policy "Authenticated users can view whitelist domains"
on public.purchase_agency_whitelist_domains for select
using (auth.role() = 'authenticated');

-- Only admins can manage the whitelist. Reuses public.is_admin(),
-- defined in email-notifications-schema.sql.
create policy "Admins can insert whitelist domains"
on public.purchase_agency_whitelist_domains for insert
with check (public.is_admin(auth.uid()));

create policy "Admins can update whitelist domains"
on public.purchase_agency_whitelist_domains for update
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "Admins can delete whitelist domains"
on public.purchase_agency_whitelist_domains for delete
using (public.is_admin(auth.uid()));

insert into public.purchase_agency_whitelist_domains (domain, label, enabled)
values
  ('amazon.com', 'Amazon', true),
  ('walmart.com', 'Walmart', true),
  ('target.com', 'Target', true),
  ('bestbuy.com', 'Best Buy', true)
on conflict (domain) do nothing;
