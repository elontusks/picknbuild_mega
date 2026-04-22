-- Team 15: secure storage layer + sponsor catalog.
--
-- secure_records is the generic typed-key-value surface fronted by
-- src/services/team-15-storage.ts. Every consuming team (comments, saved
-- vehicles, agreements, messages, payments, attachments, feed) writes
-- through the same (bucket, id) -> jsonb shape. The service is called
-- server-side with the admin client; RLS still applies when a row carries
-- an owner_id so direct DB access stays constrained.
--
-- sponsor_blocks is the operator-curated sponsor catalog consumed by
-- Team 5's Path-Specific Sponsor Board, keyed by path.

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create table public.secure_records (
  bucket text not null,
  id text not null,
  value jsonb not null,
  owner_id uuid references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (bucket, id)
);

create index secure_records_bucket_idx
  on public.secure_records (bucket, updated_at desc);
create index secure_records_owner_idx
  on public.secure_records (owner_id, bucket);

alter table public.secure_records enable row level security;

create policy "Secure records readable by owner"
  on public.secure_records for select
  using (owner_id is not null and auth.uid() = owner_id);

create policy "Secure records writable by owner"
  on public.secure_records for insert
  with check (owner_id is not null and auth.uid() = owner_id);

create policy "Secure records updatable by owner"
  on public.secure_records for update
  using (owner_id is not null and auth.uid() = owner_id)
  with check (owner_id is not null and auth.uid() = owner_id);

create policy "Secure records deletable by owner"
  on public.secure_records for delete
  using (owner_id is not null and auth.uid() = owner_id);

create trigger secure_records_set_updated_at
  before update on public.secure_records
  for each row execute function public.set_updated_at();

create table public.sponsor_blocks (
  id text primary key,
  path text not null check (path in ('dealer', 'auction', 'picknbuild', 'private')),
  title text not null,
  body_html text not null default '',
  cta_label text,
  cta_href text,
  active boolean not null default true,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index sponsor_blocks_path_active_idx
  on public.sponsor_blocks (path, active, sort_order);

alter table public.sponsor_blocks enable row level security;

create policy "Active sponsors are publicly readable"
  on public.sponsor_blocks for select
  using (active = true);

create trigger sponsor_blocks_set_updated_at
  before update on public.sponsor_blocks
  for each row execute function public.set_updated_at();
