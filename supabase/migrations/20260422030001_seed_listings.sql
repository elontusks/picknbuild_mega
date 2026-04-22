-- Team 3: dev seed for listings. Idempotent via (source, source_url) unique.
-- Every row has owner_user_id NULL (scraper-sourced) or references a real dealer
-- user later posted through the dealer edit panel. Seeds here stay scraper-side
-- so tests and Team 4-8 fixtures always render without needing a dealer login.
--
-- Safe to re-run: `insert ... on conflict do nothing` keeps reseeding from
-- clobbering live edits.

insert into public.listings
  (source, source_url, source_external_id, vin, year, make, model, trim,
   mileage, title_status, price, current_bid, bin_price, estimated_market_value,
   fees, photos, location_zip, source_updated_at, last_refreshed_at, status)
values
  -- Copart auctions: current_bid + fees, no fixed price
  ('copart', 'https://copart.com/lot/12345678', '12345678',
   '1HGCV1F30LA012345', 2020, 'Honda', 'Accord', 'Sport',
   42000, 'rebuilt', null, 7800, 12500, 14200, 950,
   '{}', '43210', now() - interval '12 hours', now() - interval '12 hours', 'active'),

  ('copart', 'https://copart.com/lot/12345679', '12345679',
   '5YJSA1E26HF012346', 2017, 'Tesla', 'Model S', '75D',
   68000, 'clean', null, 18200, 28000, 31500, 1150,
   '{}', '90210', now() - interval '6 hours', now() - interval '6 hours', 'active'),

  ('iaai', 'https://iaai.com/vehicle/32109876', '32109876',
   null, 2018, 'Toyota', 'Camry', 'XLE',
   55000, 'rebuilt', null, 6500, 11000, 12800, 875,
   '{}', '60601', now() - interval '20 hours', now() - interval '20 hours', 'active'),

  ('iaai', 'https://iaai.com/vehicle/32109877', '32109877',
   '4T1B11HK9JU012347', 2021, 'Ford', 'F-150', 'Lariat',
   28000, 'clean', null, 22000, 36000, 39500, 1350,
   '{}', '75201', now() - interval '2 hours', now() - interval '2 hours', 'active'),

  -- Craigslist private seller: price only
  ('craigslist', 'https://newyork.craigslist.org/cto/d/6677001122.html', null,
   null, 2019, 'BMW', '3 Series', '330i',
   48000, 'clean', 21500, null, null, 23400, null,
   '{}', '10001', now() - interval '18 hours', now() - interval '18 hours', 'active'),

  ('craigslist', 'https://losangeles.craigslist.org/cto/d/6677001133.html', null,
   '2HGFC2F59KH012348', 2019, 'Honda', 'Civic', 'EX',
   38000, 'clean', 17800, null, null, 19200, null,
   '{}', '90001', now() - interval '40 hours', now() - interval '40 hours', 'stale'),

  ('craigslist', 'https://seattle.craigslist.org/cto/d/6677001144.html', null,
   null, 2016, 'Subaru', 'Outback', '2.5i',
   92000, 'rebuilt', 9500, null, null, 11200, null,
   '{}', '98101', now() - interval '10 hours', now() - interval '10 hours', 'active'),

  -- Dealer-posted (no owner yet; real dealers re-post through the edit panel)
  ('dealer', 'https://pickandbuild.example.com/dealer/atlas-motors/accord-2020', 'atlas-motors-0001',
   null, 2020, 'Honda', 'Accord', 'Touring',
   35000, 'clean', 24500, null, null, 25800, null,
   '{}', '43017', now() - interval '5 hours', now() - interval '5 hours', 'active'),

  ('dealer', 'https://pickandbuild.example.com/dealer/sunset-auto/f150-2022', 'sunset-auto-0002',
   null, 2022, 'Ford', 'F-150', 'XLT',
   18000, 'clean', 39500, null, null, 41200, null,
   '{}', '90210', now() - interval '1 hour', now() - interval '1 hour', 'active'),

  -- User-posted (no owner yet — filled when the individual-seller profile replay)
  ('user', 'https://pickandbuild.example.com/user-post/user1/civic-2015', null,
   null, 2015, 'Honda', 'Civic', 'LX',
   112000, 'clean', 8200, null, null, 9400, null,
   '{}', '60614', now() - interval '30 hours', now() - interval '30 hours', 'active'),

  ('user', 'https://pickandbuild.example.com/user-post/user2/wrx-2018', null,
   null, 2018, 'Subaru', 'WRX', 'Premium',
   62000, 'rebuilt', 18500, null, null, 21000, null,
   '{}', '98004', now() - interval '8 hours', now() - interval '8 hours', 'active'),

  ('user', 'https://pickandbuild.example.com/user-post/user3/tacoma-2019', null,
   null, 2019, 'Toyota', 'Tacoma', 'TRD Sport',
   58000, 'clean', 31200, null, null, 33000, null,
   '{}', '75201', now() - interval '25 hours', now() - interval '25 hours', 'active')

on conflict (source, source_url) do nothing;
