alter table public.packages add column if not exists quote_amount integer;
alter table public.packages add column if not exists quote_note text;

create policy "Users can mark their quoted packages as paid"
  on public.packages for update
  using (auth.uid() = user_id and status = 'quoted')
  with check (auth.uid() = user_id and status = 'paid');
