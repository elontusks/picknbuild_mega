-- Scraper port from athin-scraper. Adds auxiliary tables for scrape orchestration
-- (scrape_sites, scrape_runs, curated_listings, listing_refresh_runs,
-- unsupported_domains) and extends public.listings with optional columns the
-- scraper populates (auction-specific fields, mechanical specs, condition
-- details, FC-spec linkage, refresh diff).
--
-- Existing consumers see no breaking change: every new column is nullable, and
-- the source check constraint is widened (not narrowed).

-- ────────────────────────────────────────────────────────────────────────
-- 1. scrape_sites — sources config + evolving FC specification per site
-- ────────────────────────────────────────────────────────────────────────

create table public.scrape_sites (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  base_url text not null unique,
  site_type text not null default 'auction' check (
    site_type in ('auction', 'dealer', 'marketplace')
  ),
  active boolean not null default true,
  fc_specification text,
  search_url_template text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index scrape_sites_active_idx on public.scrape_sites (active) where active;

alter table public.scrape_sites enable row level security;

create policy "scrape_sites readable by authenticated"
  on public.scrape_sites for select
  to authenticated
  using (true);

-- Writes go through service role (scraper service); no insert/update policy.

create trigger on_scrape_sites_updated
  before update on public.scrape_sites
  for each row execute function public.handle_listing_updated();

-- ────────────────────────────────────────────────────────────────────────
-- 2. Extend listings with scraper-specific fields
-- ────────────────────────────────────────────────────────────────────────

-- Allow 'firecrawl' as a generic source for any site the Firecrawl adapter
-- handles (Cars.com, Bring-a-Trailer, etc.). Keep the existing canonical values.
alter table public.listings drop constraint if exists listings_source_check;
alter table public.listings add constraint listings_source_check check (
  source in ('copart', 'iaai', 'craigslist', 'dealer', 'user', 'parsed-link', 'firecrawl')
);

-- Linkage to the source registry (null for user/dealer/parsed-link rows).
alter table public.listings add column scrape_site_id uuid references public.scrape_sites (id) on delete set null;

-- Auction + condition + spec fields populated by Copart/IAAI/Firecrawl adapters.
alter table public.listings add column image_url text;
alter table public.listings add column auction_time_left text;
alter table public.listings add column auction_date timestamptz;
alter table public.listings add column auction_timezone text;
alter table public.listings add column auction_location text;
alter table public.listings add column vehicle_condition text;
alter table public.listings add column primary_damage text;
alter table public.listings add column secondary_damage text;
alter table public.listings add column loss_type text;
alter table public.listings add column engine text;
alter table public.listings add column transmission text;
alter table public.listings add column drive_type text;
alter table public.listings add column fuel_type text;
alter table public.listings add column exterior_color text;
alter table public.listings add column interior_color text;
alter table public.listings add column body_style text;
alter table public.listings add column cylinders text;
alter table public.listings add column has_keys boolean;
alter table public.listings add column odometer_brand text;
alter table public.listings add column title_state text;
alter table public.listings add column raw_title_status text;
alter table public.listings add column seller text;
alter table public.listings add column seller_type text;
alter table public.listings add column watch_count int;
alter table public.listings add column bid_count int;
alter table public.listings add column acv numeric;
alter table public.listings add column retail_value numeric;
alter table public.listings add column repair_estimate numeric;
alter table public.listings add column damage_estimate numeric;
alter table public.listings add column lot_number text;
alter table public.listings add column match_score numeric;
alter table public.listings add column raw_extracted jsonb;
alter table public.listings add column last_refresh_diff jsonb;

create index listings_scrape_site_idx on public.listings (scrape_site_id) where scrape_site_id is not null;
create index listings_match_score_idx on public.listings (match_score desc nulls last);

-- ────────────────────────────────────────────────────────────────────────
-- 3. scrape_runs — per-attempt audit log
-- ────────────────────────────────────────────────────────────────────────

create table public.scrape_runs (
  id uuid primary key default gen_random_uuid(),
  scrape_site_id uuid not null references public.scrape_sites (id) on delete cascade,
  listing_id uuid references public.listings (id) on delete set null,
  url text not null,
  status text not null default 'pending' check (
    status in ('pending', 'success', 'partial', 'failed')
  ),
  raw_extracted jsonb,
  missing_fields jsonb,
  error_message text,
  duration_ms int,
  created_at timestamptz not null default now()
);

create index scrape_runs_site_created_idx on public.scrape_runs (scrape_site_id, created_at desc);
create index scrape_runs_listing_idx on public.scrape_runs (listing_id) where listing_id is not null;

alter table public.scrape_runs enable row level security;

create policy "scrape_runs readable by authenticated"
  on public.scrape_runs for select
  to authenticated
  using (true);

-- ────────────────────────────────────────────────────────────────────────
-- 4. curated_listings — daily "hottest auctions" feed
-- ────────────────────────────────────────────────────────────────────────

create table public.curated_listings (
  id uuid primary key default gen_random_uuid(),
  scrape_site_id uuid not null references public.scrape_sites (id) on delete cascade,
  listing_id uuid not null references public.listings (id) on delete cascade,
  rank int not null,
  hotness_score numeric,
  curated_at timestamptz not null default now(),
  expires_at timestamptz,
  unique (scrape_site_id, listing_id, curated_at)
);

create index curated_site_rank_idx on public.curated_listings (scrape_site_id, rank);
create index curated_active_idx on public.curated_listings (expires_at);

alter table public.curated_listings enable row level security;

create policy "curated_listings readable by authenticated"
  on public.curated_listings for select
  to authenticated
  using (true);

-- ────────────────────────────────────────────────────────────────────────
-- 5. listing_refresh_runs — diff log for on-view re-scrapes
-- ────────────────────────────────────────────────────────────────────────

create table public.listing_refresh_runs (
  id uuid primary key default gen_random_uuid(),
  listing_id uuid not null references public.listings (id) on delete cascade,
  changed_fields jsonb,
  prev_snapshot jsonb,
  new_snapshot jsonb,
  refreshed_at timestamptz not null default now(),
  duration_ms int,
  status text check (status in ('success', 'unchanged', 'failed', 'debounced')),
  error text
);

create index refresh_listing_idx on public.listing_refresh_runs (listing_id, refreshed_at desc);

alter table public.listing_refresh_runs enable row level security;

create policy "listing_refresh_runs readable by authenticated"
  on public.listing_refresh_runs for select
  to authenticated
  using (true);

-- ────────────────────────────────────────────────────────────────────────
-- 6. unsupported_domains — failure blocklist
-- ────────────────────────────────────────────────────────────────────────

create table public.unsupported_domains (
  id uuid primary key default gen_random_uuid(),
  domain text not null unique,
  reason text,
  attempts int not null default 1,
  first_failed_at timestamptz not null default now(),
  last_failed_at timestamptz not null default now()
);

alter table public.unsupported_domains enable row level security;

create policy "unsupported_domains readable by authenticated"
  on public.unsupported_domains for select
  to authenticated
  using (true);

-- ────────────────────────────────────────────────────────────────────────
-- 7. Seed default scrape sites
-- ────────────────────────────────────────────────────────────────────────

insert into public.scrape_sites (name, base_url, site_type, search_url_template) values
  ('Copart', 'copart.com', 'auction', null),
  ('IAAI', 'iaai.com', 'auction', null),
  ('Facebook Marketplace', 'facebook.com', 'marketplace', null),
  ('Cars.com', 'cars.com', 'dealer',
   'https://www.cars.com/shopping/results/?stock_type=used&makes[]={make}&models[]={make}+{model}&list_price_max={price}&maximum_distance=100&zip=43215')
on conflict (base_url) do nothing;
