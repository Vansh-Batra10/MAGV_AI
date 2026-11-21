-- {BRAND} schema (Postgres / Supabase). Every table: id uuid, created_at, updated_at.
create extension if not exists pgcrypto;

create or replace function set_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table users (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  phone text unique, email text, name text, role text not null default 'couple' check (role in ('couple','admin'))
);

create table weddings (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  owner_user_id uuid not null references users(id),
  bride_name text not null, bride_name_hi text, groom_name text not null, groom_name_hi text, families jsonb not null default '{}',
  ceremony_style text not null, motif text not null default 'none', default_locale text not null default 'en', default_tone text not null default 'warm',
  template_id text not null default 'sheesh-mahal', theme_pack_id text, status text not null default 'draft' check (status in ('draft','published','archived')),
  rsvp_deadline timestamptz, invite_code text not null unique, content jsonb not null default '{}', tier text not null default 'preview'
);

create table wedding_members (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  wedding_id uuid not null references weddings(id) on delete cascade, user_id uuid not null references users(id), role text not null check (role in ('owner','editor','viewer')),
  unique (wedding_id, user_id)
);

create table events (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  wedding_id uuid not null references weddings(id) on delete cascade,
  kind text not null check (kind in ('haldi','mehendi','sangeet','cocktail','wedding','reception','custom')),
  title_en text not null, title_hi text, starts_at timestamptz not null, ends_at timestamptz, tz text not null default 'Asia/Kolkata',
  venue_name text not null, venue_address text, lat double precision, lng double precision, maps_url text, dress_code jsonb not null default '[]',
  is_public boolean not null default false, sort int not null default 0
);

create table guest_groups (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  wedding_id uuid not null references weddings(id) on delete cascade, name text not null, defaults jsonb not null default '{}'
);

create table guests (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  wedding_id uuid not null references weddings(id) on delete cascade, group_id uuid references guest_groups(id) on delete set null,
  salutation text not null, short_name text, phone_e164 text, email text, locale text not null default 'en', tone text not null default 'warm',
  side text not null default 'both', household_max int not null default 2, shagun_visible boolean not null default false, note text,
  guest_code text not null unique, sent_at timestamptz, first_opened_at timestamptz, last_opened_at timestamptz, outstation boolean not null default false
);

create table invitations (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  guest_id uuid not null references guests(id) on delete cascade, event_id uuid not null references events(id) on delete cascade, unique (guest_id, event_id)
);

create table rsvps (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  guest_id uuid not null references guests(id) on delete cascade, event_id uuid not null references events(id) on delete cascade,
  status text not null check (status in ('yes','maybe','no')), adults int not null default 0, kids int not null default 0,
  food text, allergies text, message text, unique (guest_id, event_id)
);

create table rooms (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  wedding_id uuid not null references weddings(id) on delete cascade, hotel text not null, room_no text not null, capacity int not null default 2
);

create table travel (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  guest_id uuid not null unique references guests(id) on delete cascade, arrival_at text, mode text, ref_no text,
  pickup_needed boolean not null default false, stay_needed boolean not null default false, room_id uuid references rooms(id) on delete set null
);

create table assets (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  owner_scope text not null check (owner_scope in ('pack','wedding')), owner_id text not null, slot_id text not null, kind text not null,
  variants jsonb not null default '{}', bytes int not null default 0, source text not null check (source in ('ai','manual','procedural')),
  review_status text not null default 'pending' check (review_status in ('pending','approved','rejected'))
);

create table story_beats (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  wedding_id uuid not null references weddings(id) on delete cascade, sort int not null default 0, caption text not null check (char_length(caption) <= 90), photo_asset_id uuid references assets(id)
);

create table templates (
  id text primary key, created_at timestamptz not null default now(), updated_at timestamptz not null default now(), name text not null
);
create table theme_packs (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  template_id text not null references templates(id), slug text not null, tokens jsonb not null default '{}', status text not null default 'draft', unique (template_id, slug)
);

create table shagun_settings (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  wedding_id uuid not null unique references weddings(id) on delete cascade, vpa text not null, payee_name text not null,
  verified_at timestamptz, locked_until timestamptz
);
create table shagun_funds (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  wedding_id uuid not null references weddings(id) on delete cascade, title text not null, story text, visible boolean not null default true
);
create table shagun_blocks (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  fund_id uuid not null references shagun_funds(id) on delete cascade, title text not null, amount int, emoji text
);
create table shagun_pledges (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  block_id uuid not null references shagun_blocks(id) on delete cascade, guest_id uuid not null references guests(id) on delete cascade,
  amount int, pledged_at timestamptz not null default now(), confirmed_at timestamptz
);
create table gift_items (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  wedding_id uuid not null references weddings(id) on delete cascade, title text not null, url text not null, claimed_by_guest_id uuid references guests(id) on delete set null
);
create table guestbook_entries (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  guest_id uuid not null references guests(id) on delete cascade, blessing text, signature_svg text
);
create table song_requests (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  guest_id uuid not null references guests(id) on delete cascade, text text not null
);
create table team_votes (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  guest_id uuid not null unique references guests(id) on delete cascade, team text not null check (team in ('ladkewale','ladkiwale'))
);
create table updates (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  wedding_id uuid not null references weddings(id) on delete cascade, message text not null
);
create table orders (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  wedding_id uuid not null references weddings(id), tier text not null, amount_paise int not null, currency text not null default 'INR', status text not null default 'created'
);
create table payments (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  order_id uuid not null references orders(id), provider text not null, provider_ref text not null unique, status text not null, raw jsonb
);
create table entitlements (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  wedding_id uuid not null unique references weddings(id), tier text not null, source text not null
);
create table export_jobs (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  wedding_id uuid not null references weddings(id), kind text not null, params jsonb not null default '{}', status text not null default 'queued', output_asset_id uuid references assets(id)
);
create table open_events (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  guest_id uuid not null references guests(id) on delete cascade, at timestamptz not null default now(), scene text, tier text, ua_family text
);
create table consents (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  user_id uuid not null references users(id), purpose text not null, granted boolean not null, text_version text not null
);
create table abuse_reports (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  wedding_id uuid not null references weddings(id), reason text not null, status text not null default 'open'
);
create table audit_logs (
  id uuid primary key default gen_random_uuid(), created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
  actor_user_id uuid references users(id), action text not null, target text, meta jsonb
);

-- updated_at triggers
do $$ declare t text; begin
  for t in select table_name from information_schema.tables where table_schema = 'public' and table_type = 'BASE TABLE' loop
    execute format('create trigger %I_updated before update on %I for each row execute function set_updated_at()', t, t);
  end loop;
end $$;
