-- USAJUSHO: add a phone number field for the Commercial Invoice's
-- Consignee / Importer block.
--
-- Previously invoices.consignee_name / consignee_address were the only
-- customer-identifying fields on a Commercial Invoice, and were populated
-- once (from public.profiles) when the invoice row was first created by
-- adminCreateOrGetInvoice() in app/[locale]/admin/invoices/actions.ts. If
-- the customer's profile was incomplete at that time (missing name/address/
-- phone), the invoice was left with blank consignee info that never
-- refreshed on its own -- admins had to notice this and type it in by hand.
--
-- This adds consignee_phone (sourced from profiles.phone_number, see
-- profile-contact-info-migration.sql) alongside the existing consignee
-- fields, and app/[locale]/admin/invoices/actions.ts now also exposes
-- adminImportConsigneeFromProfile(), letting an admin re-pull the current
-- name/address/phone from the customer's profile into an existing invoice
-- on demand via the "Import from Profile" button, rather than only at
-- invoice-creation time.

alter table public.invoices add column if not exists consignee_phone text;
