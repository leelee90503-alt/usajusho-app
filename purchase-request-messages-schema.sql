-- Two-way message thread attached to a purchase request.
-- Admin -> customer messages were previously only an in-app notification +
-- email (see sendRequestMessage in app/[locale]/admin/purchase-requests/actions.ts),
-- which left the customer no way to answer inside the app. This table keeps
-- the whole conversation so the customer can reply from the request detail
-- page and the admin sees the thread on the request card.

create table if not exists public.purchase_request_messages (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.purchase_requests(id) on delete cascade,
  sender_id uuid references public.profiles(id) on delete set null,
  sender_role text not null check (sender_role in ('admin', 'customer')),
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists purchase_request_messages_request_id_idx
  on public.purchase_request_messages(request_id, created_at);

alter table public.purchase_request_messages enable row level security;

create policy "Owners can view messages on their purchase requests"
  on public.purchase_request_messages for select
  using (
    exists (
      select 1 from public.purchase_requests r
      where r.id = request_id and r.user_id = auth.uid()
    )
  );

create policy "Admins can view all purchase request messages"
  on public.purchase_request_messages for select
  using (public.is_admin(auth.uid()));

create policy "Owners can reply on their own purchase requests"
  on public.purchase_request_messages for insert
  with check (
    sender_role = 'customer'
    and sender_id = auth.uid()
    and exists (
      select 1 from public.purchase_requests r
      where r.id = request_id and r.user_id = auth.uid()
    )
  );

create policy "Admins can send messages on any purchase request"
  on public.purchase_request_messages for insert
  with check (
    sender_role = 'admin'
    and sender_id = auth.uid()
    and public.is_admin(auth.uid())
  );
