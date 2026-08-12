-- USAJUSHO: multi-item packages / consolidated shipping (합송배송, 묶음배송)
--
-- Background: a single package (box) can now hold more than one order --
-- e.g. one Amazon shipping-agency order containing several products, or
-- several purchase-agency requests (Amazon, eBay, ...) an admin
-- consolidates into one physical box before it's weighed and quoted.
--
-- No change was needed to package_declarations.matched_package_id or
-- purchase_requests.linked_package_id -- neither ever had a unique
-- constraint, so several rows already could point at the same package.
-- The only thing actually missing was a place to record each item that
-- makes up a package. This table mirrors invoice_items (which already
-- solves "one package, many items" for customs declarations) but is
-- scoped to the package's own contents/display, independent of the
-- customs invoice flow.
--
-- Run this once in Supabase SQL Editor: Dashboard -> SQL Editor -> New
-- query -> paste -> Run.

create table if not exists public.package_items (
  id uuid primary key default gen_random_uuid(),
  package_id uuid not null references public.packages(id) on delete cascade,

  -- Which order this line item came from, if any. A package created
  -- directly by an admin (registerMissingPackage) has neither set.
  source_declaration_id uuid references public.package_declarations(id) on delete set null,
  source_purchase_request_id uuid references public.purchase_requests(id) on delete set null,

  product_name text not null,
  quantity integer not null default 1,
  unit_price numeric(10,2),
  note text,

  sort_order integer not null default 0,
  created_at timestamptz not null default now(),

  constraint package_items_quantity_check check (quantity > 0)
);

create index if not exists package_items_package_id_idx on public.package_items(package_id);
create index if not exists package_items_source_declaration_id_idx on public.package_items(source_declaration_id);
create index if not exists package_items_source_purchase_request_id_idx on public.package_items(source_purchase_request_id);

alter table public.package_items enable row level security;

-- Customers can see the item breakdown of their own packages (join through
-- packages, same pattern as package_photos-migration.sql).
create policy "Users can view items of their own packages"
  on public.package_items for select
  using (
    exists (
      select 1 from public.packages p
      where p.id = package_id and p.user_id = auth.uid()
    )
  );

create policy "Admins can view all package items"
  on public.package_items for select
  using (public.is_admin(auth.uid()));

-- All writes happen from admin server actions (matchAndQuoteDeclaration,
-- markPurchasedAndLinkPackage, registerMissingPackage) -- customers never
-- write this table directly.
create policy "Admins can insert package items"
  on public.package_items for insert
  with check (public.is_admin(auth.uid()));

create policy "Admins can update package items"
  on public.package_items for update
  using (public.is_admin(auth.uid()));

create policy "Admins can delete package items"
  on public.package_items for delete
  using (public.is_admin(auth.uid()));
