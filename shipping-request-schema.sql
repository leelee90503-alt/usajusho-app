create policy "Users can request shipment on their own arrived packages"
  on public.packages for update
  using (auth.uid() = user_id and status = 'arrived')
  with check (auth.uid() = user_id and status = 'requested');
