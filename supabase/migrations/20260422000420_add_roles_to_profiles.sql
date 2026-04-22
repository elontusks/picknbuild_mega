alter table public.profiles
  add column roles text[] not null default array['buyer']::text[],
  add column account_status text not null default 'active'
    check (account_status in ('active', 'suspended', 'banned', 'unverified')),
  add column phone text,
  add column phone_verified_at timestamptz;

create index profiles_roles_idx on public.profiles using gin (roles);
