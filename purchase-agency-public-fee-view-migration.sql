-- USAJUSHO: expose the purchase-agency fee structure to anonymous visitors
--
-- The public /purchase-agency marketing page explains the service to
-- guests who have not signed up or logged in yet. It previously showed
-- no real fee numbers, because public.purchase_agency_settings only
-- grants SELECT to authenticated users (see
-- purchase-agency-settings-schema.sql) -- an anonymous read of that
-- table returns no row, so the app silently falls back to the
-- hardcoded defaults in lib/purchase-agency-pricing.ts
-- (getPurchaseAgencyFeeSettings() in lib/purchase-agency-settings.ts).
--
-- This adds a narrow, read-only view exposing only the two fee columns
-- guests need (flat_fee_cents, fee_percent) -- deliberately NOT
-- square_mode, which stays admin/authenticated-only via the base
-- table's existing RLS policy.
--
-- Views run with the privileges of their owner by default in Postgres
-- (unless created with security_invoker = true), and table owners
-- bypass their own table's row-level security unless FORCE ROW LEVEL
-- SECURITY is set on that table (it isn't here). So this view -- owned
-- by whichever role runs this migration, normally the same role that
-- owns purchase_agency_settings -- transparently bypasses the base
-- table's "authenticated only" SELECT policy for anyone granted SELECT
-- on the view itself, which is exactly what we want: a safe, narrow,
-- public-readable projection of an otherwise-protected table.

create or replace view public.purchase_agency_public_fee_settings as
  select flat_fee_cents, fee_percent
  from public.purchase_agency_settings
  where id = 1;

grant select on public.purchase_agency_public_fee_settings to anon, authenticated;
