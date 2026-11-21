-- Row Level Security: couples see only weddings they are members of. Guest endpoints never use the anon
-- role against these tables directly: they go through server route handlers scoped by guest_code
-- (service role), which expose only that guest's data and never the couple's phone/email.
create or replace function is_member(w uuid) returns boolean language sql stable security definer as $$
  select exists (select 1 from wedding_members m where m.wedding_id = w and m.user_id = auth.uid())
      or exists (select 1 from weddings x where x.id = w and x.owner_user_id = auth.uid())
$$;
create or replace function can_edit(w uuid) returns boolean language sql stable security definer as $$
  select exists (select 1 from wedding_members m where m.wedding_id = w and m.user_id = auth.uid() and m.role in ('owner','editor'))
      or exists (select 1 from weddings x where x.id = w and x.owner_user_id = auth.uid())
$$;

alter table weddings enable row level security;
create policy weddings_read on weddings for select using (is_member(id));
create policy weddings_write on weddings for update using (can_edit(id));
create policy weddings_insert on weddings for insert with check (owner_user_id = auth.uid());

do $$ declare t text; begin
  foreach t in array array['events','guest_groups','guests','rooms','story_beats','shagun_settings','shagun_funds','gift_items','updates','orders','entitlements','export_jobs','abuse_reports','wedding_members'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I_read on %I for select using (is_member(wedding_id))', t, t);
    execute format('create policy %I_write on %I for all using (can_edit(wedding_id)) with check (can_edit(wedding_id))', t, t);
  end loop;
  foreach t in array array['invitations','rsvps','travel','shagun_pledges','guestbook_entries','song_requests','team_votes','open_events'] loop
    execute format('alter table %I enable row level security', t);
    execute format('create policy %I_read on %I for select using (is_member((select wedding_id from guests g where g.id = guest_id)))', t, t);
    execute format('create policy %I_write on %I for all using (can_edit((select wedding_id from guests g where g.id = guest_id))) with check (can_edit((select wedding_id from guests g where g.id = guest_id)))', t, t);
  end loop;
end $$;

alter table shagun_blocks enable row level security;
create policy shagun_blocks_rw on shagun_blocks for all using (can_edit((select wedding_id from shagun_funds f where f.id = fund_id)));
alter table users enable row level security;
create policy users_self on users for select using (id = auth.uid());
