-- Hilo core schema. Portable Postgres (runs on Supabase and on PGlite in MOCK mode).
create table if not exists profiles (
  id text primary key,
  name text,
  phone text,
  email text unique,
  country text,
  market text not null default 'GLOBAL',
  ui_language text not null default 'en',
  currency text not null default 'USD',
  referral_code text unique,
  wallet_balance_minor integer not null default 0,
  is_partner boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists auth_codes (
  id text primary key,
  email text not null,
  code_hash text not null,
  expires_at timestamptz not null,
  attempts integer not null default 0,
  created_at timestamptz not null default now()
);

create table if not exists gifts (
  id text primary key,
  owner_id text references profiles(id) on delete set null,
  draft_token text,
  template_slug text not null,
  mode text not null default 'individual',
  content jsonb not null default '{}'::jsonb,
  theme text,
  status text not null default 'draft', -- draft|paid|scheduled|delivered|deleted
  slug text unique,
  password_hash text,
  sender_name text,
  sender_contact jsonb,
  recipient_name text,
  recipient_contact jsonb,
  recipient_tz text,
  deliver_at_utc timestamptz,
  reveal_at_utc timestamptz,
  delivered_at timestamptz,
  paid_at timestamptz,
  market text not null default 'GLOBAL',
  gift_language text not null default 'en',
  tier text not null default 'classic',
  duration text not null default 'forever',
  expires_at_utc timestamptz,
  expiry_reminder_sent boolean not null default false,
  song_embed jsonb,
  created_via text not null default 'questions',
  experiment_bucket text,
  takedown_status text not null default 'none',
  first_opened_at timestamptz,
  utm jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists gifts_owner_idx on gifts(owner_id);
create index if not exists gifts_draft_idx on gifts(draft_token);
create index if not exists gifts_deliver_idx on gifts(status, deliver_at_utc);

create table if not exists gift_media (
  id text primary key,
  gift_id text,
  draft_token text,
  kind text not null, -- photo|voice|music|reaction
  storage_key text not null,
  mime text,
  bytes integer,
  width integer,
  height integer,
  duration_ms integer,
  created_at timestamptz not null default now()
);

create table if not exists contrib_tokens (
  id text primary key,
  gift_id text not null references gifts(id) on delete cascade,
  token text unique not null,
  deadline_utc timestamptz,
  max_contributions integer not null default 25
);

create table if not exists group_contributions (
  id text primary key,
  gift_id text not null references gifts(id) on delete cascade,
  contrib_token_id text references contrib_tokens(id) on delete set null,
  name text not null,
  message text not null default '',
  photo_url text,
  voice_url text,
  photo_media_id text,
  voice_media_id text,
  hidden boolean not null default false,
  contact jsonb,
  created_at timestamptz not null default now()
);
create index if not exists contrib_gift_idx on group_contributions(gift_id);

create table if not exists orders (
  id text primary key,
  gift_id text not null references gifts(id) on delete cascade,
  user_id text,
  purpose text not null default 'purchase', -- purchase|upgrade
  payer text not null default 'sender', -- sender|recipient
  buyer_email text,
  buyer_phone text,
  currency text not null,
  amount_minor integer not null,
  tier text not null,
  duration text not null,
  addons jsonb not null default '[]'::jsonb,
  coupon_code text,
  wallet_used_minor integer not null default 0,
  provider text not null default 'mock',
  razorpay_order_id text,
  razorpay_payment_id text,
  status text not null default 'created', -- created|paid|failed|refunded
  experiment_bucket text,
  utm jsonb,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);
create index if not exists orders_gift_idx on orders(gift_id);

create table if not exists payments_events (
  id text primary key,
  provider_event_id text unique not null,
  payload jsonb not null,
  processed_at timestamptz not null default now()
);

create table if not exists opens (
  id text primary key,
  gift_id text not null references gifts(id) on delete cascade,
  opened_at timestamptz not null default now(),
  device_kind text
);

create table if not exists replies (
  id text primary key,
  gift_id text not null references gifts(id) on delete cascade,
  kind text not null, -- heart|text|voice|answer
  text text,
  voice_url text,
  voice_media_id text,
  created_at timestamptz not null default now()
);

create table if not exists reactions (
  id text primary key,
  gift_id text not null references gifts(id) on delete cascade,
  storage_key text not null,
  duration_ms integer,
  public_use_consent boolean not null default false,
  consent_at timestamptz,
  created_at timestamptz not null default now()
);

create table if not exists reminders (
  id text primary key,
  user_id text not null references profiles(id) on delete cascade,
  person_name text not null,
  relation text,
  occasion text not null,
  month integer not null,
  day integer not null,
  year integer,
  recurring boolean not null default true,
  channel text not null default 'email',
  last_sent_for_year integer,
  last_sent_kind text,
  created_at timestamptz not null default now()
);

create table if not exists coupons (
  code text primary key,
  percent_off integer,
  amount_off_minor integer,
  currency text,
  valid_from timestamptz,
  valid_to timestamptz,
  max_uses integer,
  used_count integer not null default 0
);

create table if not exists referrals (
  id text primary key,
  referrer_id text not null,
  referee_email text,
  order_id text,
  credited boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists reviews (
  id text primary key,
  order_id text,
  name text not null,
  city text,
  rating integer not null,
  text text not null,
  approved boolean not null default false,
  created_at timestamptz not null default now()
);

create table if not exists outbox (
  id text primary key,
  channel text not null, -- whatsapp|email|sms
  "to" text not null,
  template text not null,
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'queued',
  category text not null default 'utility',
  est_cost_minor integer not null default 0,
  error text,
  created_at timestamptz not null default now()
);

create table if not exists template_flags (
  slug text primary key,
  enabled boolean not null default true,
  sort_order integer not null default 0
);

create table if not exists consents (
  id text primary key,
  subject_type text not null, -- buyer|contributor|recipient
  subject_ref text not null,
  purpose text not null,
  notice_version text not null,
  granted boolean not null,
  created_at timestamptz not null default now()
);

create table if not exists partners (
  id text primary key,
  name text not null,
  instagram text,
  phone text,
  email text,
  code text unique not null,
  commission_pct integer not null default 25,
  payout_details jsonb,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists prepaid_codes (
  code text primary key,
  partner_id text references partners(id),
  tier text not null,
  redeemed_gift_id text,
  redeemed_at timestamptz
);

create table if not exists events (
  id text primary key,
  name text not null,
  anon_id text,
  user_id text,
  gift_id text,
  props jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists events_name_idx on events(name, created_at);

create table if not exists takedowns (
  id text primary key,
  gift_id text not null,
  kind text not null, -- takedown|abuse
  reason text,
  contact text,
  status text not null default 'open',
  created_at timestamptz not null default now()
);

create table if not exists free_quota (
  id text primary key,
  key text not null,
  created_at timestamptz not null default now()
);
create index if not exists free_quota_key_idx on free_quota(key, created_at);
