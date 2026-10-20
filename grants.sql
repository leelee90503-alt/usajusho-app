-- USAJUSHO: Data API grants for every table in `public`.
--
-- WHY THIS FILE EXISTS
-- From 2026-10-30 Supabase stops auto-granting Data API access to tables newly
-- created in `public` (announced 2026-10-20). Without a GRANT, supabase-js /
-- PostgREST return "permission denied". Existing tables keep their grants, so
-- nothing breaks on that date — but two things do:
--
--   1. A new table added after 2026-10-30 is unreachable until it is granted.
--      The most recent schema file (purchase-request-messages-schema.sql,
--      2026-10-18) has RLS + policies but no GRANT; run as-is after the change,
--      the customer reply feature would simply not work.
--   2. Re-creating the database from the *.sql files in this repo (new project,
--      restore, preview branch) would produce a **dead app** — every table
--      permission denied — because not one of those files grants anything.
--
-- WHY IT LOOPS INSTEAD OF LISTING TABLES
-- Per-file discipline is what failed: 23 schema files, 14 CREATE TABLE, zero
-- table grants. This file names no tables, so nothing can be forgotten.
--
-- HOW TO USE
--   Run this in the Supabase SQL Editor **after any schema change** that adds
--   or drops a table. It is idempotent — running it when everything is already
--   granted changes nothing. Run it last when rebuilding the database.
--
-- WHY anon IS GRANTED EVERYWHERE
-- This app talks to the database as `anon` / `authenticated` (the anon key plus
-- the cookie session): lib/supabase/server.ts is used by 38 files and
-- lib/supabase/client.ts by 5, while only 10 files use the service role.
-- Access is decided by RLS, not by grants — there are 71 policies and 81 uses
-- of auth.uid(). Nine of those policies are written `to public`, which applies
-- to anon as well, so narrowing anon per table cannot be decided from the
-- catalogue without re-reading every USING clause. Measured 2026-10-20: all 17
-- tables already carry anon, authenticated and service_role, RLS is on for all
-- 17 and every one of them has policies. **This file reproduces that working
-- state; it does not redesign it.**
-- The safety of granting broadly rests entirely on RLS being enabled, which is
-- why step 1 refuses to run otherwise.

-- ── 1. Precondition: every table in `public` must have RLS enabled ──────────
-- Broad grants on a table without RLS would expose it completely. Stop instead.
do $$
declare bad text;
begin
  select string_agg(c.relname, ', ' order by c.relname) into bad
  from pg_class c
  join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'p') and not c.relrowsecurity;

  if bad is not null then
    raise exception
      'RLS is disabled on: %. Enable RLS (and add policies) before granting.', bad;
  end if;
end $$;

-- ── 2. Tables ──────────────────────────────────────────────────────────────
do $$
declare t record;
begin
  for t in
    select c.relname as name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
    order by c.relname
  loop
    execute format(
        'grant select, insert, update, delete on public.%I to anon, authenticated, service_role',
        t.name);
  end loop;
end $$;

-- ── 3. Sequences ───────────────────────────────────────────────────────────
-- An insert into a table with a bigserial/identity column also needs the
-- sequence. Supabase granted these automatically too, so keep them in step.
do $$
declare s record;
begin
  for s in
    select c.relname as name
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind = 'S'
    order by c.relname
  loop
    execute format(
        'grant usage, select on sequence public.%I to anon, authenticated, service_role',
        s.name);
  end loop;
end $$;

-- ── 4. Things that are not tables ──────────────────────────────────────────
-- Views and functions are granted where they are defined, not here, so that the
-- reason for exposing them stays next to the definition. This one is repeated
-- because rebuilding the database must not depend on the order of the files.
-- (see purchase-agency-public-fee-view-migration.sql)
grant select on public.purchase_agency_public_fee_settings to anon, authenticated;

-- ── 5. Report ──────────────────────────────────────────────────────────────
-- Read this after running. Every count on the right must be 0.
select
  count(*)                                                as tables,
  count(*) filter (where not rls)                         as rls_off,
  count(*) filter (where policies = 0)                    as without_policies,
  count(*) filter (where not has_anon)                    as missing_anon,
  count(*) filter (where not has_auth)                    as missing_authenticated,
  count(*) filter (where not has_svc)                     as missing_service_role
from (
    select
      c.relrowsecurity as rls,
      (select count(*) from pg_policies p
         where p.schemaname = 'public' and p.tablename = c.relname) as policies,
      exists (select 1 from information_schema.role_table_grants g
         where g.table_schema = 'public' and g.table_name = c.relname
           and g.grantee = 'anon')          as has_anon,
      exists (select 1 from information_schema.role_table_grants g
         where g.table_schema = 'public' and g.table_name = c.relname
           and g.grantee = 'authenticated') as has_auth,
      exists (select 1 from information_schema.role_table_grants g
         where g.table_schema = 'public' and g.table_name = c.relname
           and g.grantee = 'service_role')  as has_svc
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public' and c.relkind in ('r', 'p')
  ) t;
