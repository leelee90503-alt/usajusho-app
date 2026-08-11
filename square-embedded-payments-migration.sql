-- USAJUSHO: embedded Square Web Payments SDK for shipping-fee charges
--
-- The site is switching all Square payment collection from the hosted
-- "Payment Links" checkout (which redirected customers to squareup.com /
-- square.site) to Square's Web Payments SDK, an embedded card form that
-- stays on our own domain. As part of this, the shipping-fee payment flow
-- (previously payForShipment() in app/[locale]/dashboard/actions.ts, which
-- was a stub that flipped packages.status to "paid" with no real charge)
-- now charges the customer's card for real via square.payments.create().
--
-- purchase_requests and additional_charges already have a
-- square_payment_id column (see purchase-agency-schema.sql and
-- purchase-agency-shipping-and-charges-migration.sql). packages needs the
-- same column so the shipping-fee payment can record which Square Payment
-- object paid for it (used by admin tooling / future refunds, the same
-- way square_payment_id is already used on the other two tables).

alter table public.packages add column if not exists square_payment_id text;
