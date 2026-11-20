-- Applied ONLY on Supabase (skipped on PGlite). The app server uses the service role and enforces
-- ownership in code; RLS is defence in depth for any client-side Supabase access.
alter table profiles enable row level security;
alter table gifts enable row level security;
alter table gift_media enable row level security;
alter table group_contributions enable row level security;
alter table orders enable row level security;
alter table replies enable row level security;
alter table reminders enable row level security;
alter table reactions enable row level security;
alter table outbox enable row level security;
alter table events enable row level security;

create policy "own profile" on profiles for select using (id = auth.uid()::text);
create policy "own profile update" on profiles for update using (id = auth.uid()::text);
create policy "own gifts" on gifts for select using (owner_id = auth.uid()::text);
create policy "own gifts update" on gifts for update using (owner_id = auth.uid()::text);
create policy "own orders" on orders for select using (user_id = auth.uid()::text);
create policy "own reminders" on reminders for all using (user_id = auth.uid()::text);
create policy "own replies" on replies for select using (exists (select 1 from gifts g where g.id = replies.gift_id and g.owner_id = auth.uid()::text));
create policy "own contributions" on group_contributions for select using (exists (select 1 from gifts g where g.id = group_contributions.gift_id and g.owner_id = auth.uid()::text));
-- outbox, events: no client policies → service role only.
