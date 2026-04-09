-- ============================================================
-- SceneSkip schema — run this in the Supabase SQL editor
-- ============================================================

-- Approved timestamp data served to the extension
create table if not exists timestamps (
  id          text        primary key,
  keyword     text        not null,
  start_time  numeric     not null,
  end_time    numeric     not null,
  category    text        not null check (category in ('nudity','violence','gore','drug_use','profanity')),
  title       text        not null,
  created_at  timestamptz not null default now()
);

create index if not exists timestamps_keyword_idx on timestamps (keyword);

-- Community submissions pending moderation
create table if not exists submissions (
  id             uuid        primary key default gen_random_uuid(),
  keyword        text        not null,
  start_time     numeric     not null,
  end_time       numeric     not null,
  category       text        not null check (category in ('nudity','violence','gore','drug_use','profanity')),
  title          text        not null,
  submitter_note text,
  admin_note     text,
  status         text        not null default 'pending' check (status in ('pending','approved','rejected')),
  reviewed_at    timestamptz,
  created_at     timestamptz not null default now()
);

create index if not exists submissions_status_idx   on submissions (status);
create index if not exists submissions_keyword_idx  on submissions (keyword);
create index if not exists submissions_created_idx  on submissions (created_at);

-- ============================================================
-- Row-level security
-- All access goes through the API using the service-role key.
-- Deny direct public client access.
-- ============================================================
alter table timestamps  enable row level security;
alter table submissions enable row level security;
