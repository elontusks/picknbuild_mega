create table public.dealer_pages (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid references public.profiles (id) on delete set null unique,
  name text,
  claimed boolean not null default false,
  subscription_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.dealer_pages enable row level security;

create policy "Dealer pages viewable by owner"
  on public.dealer_pages for select
  using (auth.uid() = owner_id);
