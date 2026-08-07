-- USAJUSHO: bilingual admin notifications
--
-- The admin-facing "notifyAdmins()" helper (lib/notifications.ts) already
-- builds an English title/body for the outgoing email (titleEn/bodyEn), but
-- previously only ever wrote the Japanese title/body into public.notifications,
-- so the Admin Dashboard notification panel showed Japanese text regardless
-- of which locale the admin had selected. These columns let the same insert
-- carry both languages so the panel can pick the right one at render time.
--
-- Nullable: existing rows, and customer-facing notifications created via
-- notifyUser() (which has no English variant yet), simply have title_en/
-- body_en = null and fall back to the Japanese title/body, matching today's
-- behavior exactly.
alter table public.notifications add column if not exists title_en text;
alter table public.notifications add column if not exists body_en text;
