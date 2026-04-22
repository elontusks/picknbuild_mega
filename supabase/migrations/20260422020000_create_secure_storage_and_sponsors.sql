-- Team 15: secure storage layer + sponsor catalog.
--
-- secure_records is the generic typed-key-value surface fronted by
-- src/services/team-15-storage.ts. Every consuming team (comments, saved
-- vehicles, agreements, messages, payments, attachments, feed) writes
-- through the same (bucket, id) -> jsonb shape.
--
-- Access model: the service is the single entry point and always runs
-- server-side with the Supabase service-role client, which bypasses RLS.
-- Per-user authorization is enforced one layer up (src/lib/authz). RLS
-- on both tables is therefore set to `using (false)` for non-service
-- roles so any direct anon/authenticated DB access fails loudly rather
-- than silently hitting dead policies.
--
-- sponsor_blocks is the operator-curated sponsor catalog consumed by
-- Team 5's Path-Specific Sponsor Board, keyed by path. Active rows are
-- publicly readable; writes are service-role only.

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
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (bucket, id)
);

create index secure_records_bucket_idx
  on public.secure_records (bucket, updated_at desc);

alter table public.secure_records enable row level security;

-- Non-service-role access is denied outright. The service-role key used
-- by createAdminClient() bypasses RLS and is the only supported path.
create policy "Secure records: service-role only"
  on public.secure_records for all
  using (false)
  with check (false);

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

-- Writes are service-role only. Explicit `using (false)` keeps future
-- admin tooling from accidentally attempting an anon/authenticated write
-- and getting a silent empty-result back.
create policy "Sponsor blocks: service-role only writes (insert)"
  on public.sponsor_blocks for insert
  with check (false);

create policy "Sponsor blocks: service-role only writes (update)"
  on public.sponsor_blocks for update
  using (false)
  with check (false);

create policy "Sponsor blocks: service-role only writes (delete)"
  on public.sponsor_blocks for delete
  using (false);

create trigger sponsor_blocks_set_updated_at
  before update on public.sponsor_blocks
  for each row execute function public.set_updated_at();
