-- Team 1: extend public.profiles to satisfy the User contract (ARCHITECTURE.md §3.7).
-- Adds the onboarding-captured fields. Existing roles[] / phone / phone_verified_at stay as-is;
-- the User contract's single `role` is derived in code from roles[].

alter table public.profiles
  add column display_name text,
  add column zip text,
  add column budget integer,
  add column credit_score integer,
  add column no_credit boolean not null default false,
  add column preferences jsonb not null default
    '{"bestFit":"lowestTotal","notifChannels":["in-app"]}'::jsonb,
  add column onboarded_at timestamptz;

-- Backfill display_name from full_name where present so existing rows have a usable label.
update public.profiles set display_name = full_name where display_name is null and full_name is not null;
