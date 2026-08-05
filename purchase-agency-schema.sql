-- Purchase agency ("purchase-proxy" / buy-for-me) request lifecycle.
-- Flow: customer submits a product URL/description -> admin reviews and
-- sends a quote (item price + fee + note + expiry) -> customer pays via
-- Stripe Checkout -> admin marks purchasing -> purchased, linking the
-- request to a row in public.packages so it joins the normal warehouse
-- pipeline (inspection/photos/consolidation/shipping) once it arrives.

create table if not exists public.purchase_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles(id) on delete cascade,
  product_url text,
  product_description text not null,
  reference_image_url text,
  budget_cap_cents integer,
  status text not null default 'submitted',
  quote_item_price_cents integer,
  quote_fee_cents integer,
  quote_total_cents integer,
  quote_note text,
  quote_expires_at timestamptz,
  stripe_checkout_session_id text,
  stripe_payment_intent_id text,
  linked_package_id uuid references public.packages(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint purchase_requests_status_check check (
    status in (
      'submitted',
      'quote_sent',
      'awaiting_payment',
      'paid',
      'purchasing',
      'purchased',
      'cancelled',
      'refunded'
    )
  )
);

alter table public.purchase_requests enable row level security;

create policy "Users can view their own purchase requests"
  on public.purchase_requests for select
  using (auth.uid() = user_id);

create policy "Admins can view all purchase requests"
  on public.purchase_requests for select
  using (public.is_admin(auth.uid()));

create policy "Users can create their own purchase requests"
  on public.purchase_requests for insert
  with check (auth.uid() = user_id and status = 'submitted');

create policy "Admins can create purchase requests"
  on public.purchase_requests for insert
  with check (public.is_admin(auth.uid()));

-- Owners may only cancel their own request (before it has been purchased),
-- or move an awaiting_payment request back toward payment retry. They can
-- never set their own quote fields or approve their own quote.
create policy "Users can cancel their own pending requests"
  on public.purchase_requests for update
  using (
    auth.uid() = user_id
    and status in ('submitted', 'quote_sent', 'awaiting_payment')
  )
  with check (
    auth.uid() = user_id
    and status in ('cancelled', 'awaiting_payment')
  );

create policy "Admins can update all purchase requests"
  on public.purchase_requests for update
  using (public.is_admin(auth.uid()));

create policy "Admins can delete purchase requests"
  on public.purchase_requests for delete
  using (public.is_admin(auth.uid()));

create index if not exists purchase_requests_user_id_idx
  on public.purchase_requests(user_id);
create index if not exists purchase_requests_status_idx
  on public.purchase_requests(status);
create index if not exists purchase_requests_linked_package_id_idx
  on public.purchase_requests(linked_package_id);

-- Note: updated_at is set explicitly by each server action (matching the
-- convention used in packages-schema.sql / admin actions.ts), since this
-- project has no shared set_updated_at() trigger function yet.
