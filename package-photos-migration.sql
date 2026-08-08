-- USAJUSHO: package inspection photos
--
-- When an admin resolves a "missing" package (matches it to a customer and
-- issues a shipping quote, or confirms arrival of a prepaid purchase-agency
-- package -- see resolveMissingPackage() in
-- app/[locale]/admin/packages/actions.ts), they must attach 3-5 photos
-- taken during inspection. Customers can then see exactly what arrived,
-- both while deciding whether to pay the quote and after it ships.
--
-- Modeled closely on the package-receipts storage bucket in
-- package-declarations-schema.sql, but keyed by package_id (not by the
-- uploader's uid) -- there the uploader and viewer are the same customer,
-- here the uploader (admin) and viewer (customer) are different people.

create table if not exists public.package_photos (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,
  storage_path text not null,
  created_at timestamptz not null default now()
);

alter table public.package_photos enable row level security;

create policy "Users can view photos of their own packages"
  on public.package_photos for select
  using (
    exists (
      select 1 from public.packages p
      where p.id = package_id and p.user_id = auth.uid()
    )
  );

create policy "Admins can view all package photos"
  on public.package_photos for select
  using (public.is_admin(auth.uid()));

create policy "Admins can insert package photos"
  on public.package_photos for insert
  with check (public.is_admin(auth.uid()));

create policy "Admins can delete package photos"
  on public.package_photos for delete
  using (public.is_admin(auth.uid()));

create index if not exists package_photos_package_id_idx on public.package_photos(package_id);

-- Storage bucket for the actual photo files. Private (public = false);
-- access is controlled entirely by the RLS policies below, same approach
-- as the package-receipts bucket.
insert into storage.buckets (id, name, public)
values ('package-photos', 'package-photos', false)
on conflict (id) do nothing;

create policy "Admins can upload package photos"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'package-photos'
    and public.is_admin(auth.uid())
  );

create policy "Admins can view all package photo files"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'package-photos'
    and public.is_admin(auth.uid())
  );

create policy "Admins can delete package photo files"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'package-photos'
    and public.is_admin(auth.uid())
  );

-- Storage object paths are "{package_id}/{uuid}.ext" -- foldername()[1] is
-- the package_id, so a customer can view a photo file only if they own the
-- package it belongs to.
create policy "Users can view photo files of their own packages"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'package-photos'
    and exists (
      select 1 from public.packages p
      where p.id::text = (storage.foldername(name))[1]
        and p.user_id = auth.uid()
    )
  );
