-- Migration for the new package lifecycle: missing -> quoted -> paid -> shipped.
-- (arrived/requested are retired; see packages-schema.sql for the up-to-date
-- base schema this brings an already-live table in line with.)

-- A physically-registered package with no matching pre-declaration has no
-- known owner until an admin links it to a customer's suite number.
alter table public.packages alter column user_id drop not null;

-- Obsolete: let customers move their own package from 'arrived' to
-- 'requested' via the (now-removed) "request shipment" dashboard button.
-- Dead policy now that neither status exists in the app; drop it so it
-- doesn't linger as misleading, unused RLS surface.
drop policy if exists "Users can request shipment on their own arrived packages" on public.packages;
