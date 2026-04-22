-- Team 3: listings table — the single canonical store for every ListingObject.
-- Contract: docs/requirements/ARCHITECTURE.md §3.1.
-- Readers: Teams 2, 4, 5, 6, 7, 8, 9, 11, 15, 16.

create table public.listings (
  id uuid primary key default gen_random_uuid(),
  source text not null check (
    source in ('copart', 'iaai', 'craigslist', 'dealer', 'user', 'parsed-link')
  ),
  source_url text not null,
  source_external_id text,
  vin text,
  year int not null,
  make text not null,
  model text not null,
  trim text,
  mileage int,
  title_status text not null default 'unknown' check (
    title_status in ('clean', 'rebuilt', 'unknown')
  ),
  price numeric,
  current_bid numeric,
  bin_price numeric,
  estimated_market_value numeric,
  fees numeric,
  photos text[] not null default '{}',
  location_zip text,
  source_updated_at timestamptz not null default now(),
  last_refreshed_at timestamptz not null default now(),
  status text not null default 'active' check (
    status in ('active', 'stale', 'removed')
  ),
  owner_user_id uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Idempotency: (source, source_url) is unique so re-ingesting the same scraper
-- page upserts instead of duplicating. `source_external_id` is kept for richer
-- upstream ids (auction lot numbers etc.) but isn't unique on its own.
create unique index listings_source_url_idx
  on public.listings (source, source_url);

create index listings_source_idx on public.listings (source);
create index listings_owner_idx
  on public.listings (owner_user_id)
  where owner_user_id is not null;
create index listings_make_model_year_idx
  on public.listings (make, model, year);
create index listings_vin_idx on public.listings (vin) where vin is not null;
create index listings_status_idx on public.listings (status);

alter table public.listings enable row level security;

-- Any signed-in user can read listings. No anonymous access (auth is universal).
create policy "listings readable by authenticated"
  on public.listings for select
  to authenticated
  using (true);

-- Owners can create their own dealer / user / parsed-link rows.
-- Scraper-sourced rows (copart / iaai / craigslist) must come through the
-- admin client (service role), which bypasses RLS.
create policy "listings insert by owner"
  on public.listings for insert
  to authenticated
  with check (
    owner_user_id = auth.uid()
    and source in ('dealer', 'user', 'parsed-link')
  );

create policy "listings update by owner"
  on public.listings for update
  to authenticated
  using (owner_user_id = auth.uid())
  with check (owner_user_id = auth.uid());

create policy "listings delete by owner"
  on public.listings for delete
  to authenticated
  using (owner_user_id = auth.uid());

create function public.handle_listing_updated()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_listing_updated
  before update on public.listings
  for each row execute function public.handle_listing_updated();
