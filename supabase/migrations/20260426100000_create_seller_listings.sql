create table public.seller_listings (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid references public.profiles (id) on delete cascade,
  make text not null,
  model text not null,
  year text not null,
  price text not null,
  description text,
  status text not null default 'active',
  views int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.seller_listings enable row level security;

create policy "Seller listings viewable by owner"
  on public.seller_listings for select
  using (auth.uid() = seller_id);

create policy "Seller listings insertable by owner"
  on public.seller_listings for insert
  with check (auth.uid() = seller_id);

create policy "Seller listings updatable by owner"
  on public.seller_listings for update
  using (auth.uid() = seller_id)
  with check (auth.uid() = seller_id);

create policy "Seller listings deletable by owner"
  on public.seller_listings for delete
  using (auth.uid() = seller_id);

create function public.handle_seller_listing_updated()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger on_seller_listing_updated
  before update on public.seller_listings
  for each row execute function public.handle_seller_listing_updated();
