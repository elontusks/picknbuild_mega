-- Team 3: extra dev seed for central-Ohio listings so a profile in the 43xxx
-- range (e.g. the dummy admin in scripts/seed-dummy-admin.mjs at zip 43065)
-- has nearby vehicles to render against. Same shape + idempotency rule as
-- 20260422030001_seed_listings.sql.

insert into public.listings
  (source, source_url, source_external_id, vin, year, make, model, trim,
   mileage, title_status, price, current_bid, bin_price, estimated_market_value,
   fees, photos, location_zip, source_updated_at, last_refreshed_at, status)
values
  -- Powell / Dublin / New Albany — OH 43xxx clusters around 43065
  ('dealer', 'https://pickandbuild.example.com/dealer/buckeye-motors/civic-2021', 'buckeye-0001',
   '2HGFC2F59MH054321', 2021, 'Honda', 'Civic', 'Sport',
   24000, 'clean', 21800, null, null, 22600, null,
   '{}', '43065', now() - interval '3 hours', now() - interval '3 hours', 'active'),

  ('dealer', 'https://pickandbuild.example.com/dealer/scioto-auto/rav4-2020', 'scioto-0002',
   '2T3W1RFV4LC051234', 2020, 'Toyota', 'RAV4', 'XLE',
   38000, 'clean', 26500, null, null, 27800, null,
   '{}', '43017', now() - interval '4 hours', now() - interval '4 hours', 'active'),

  ('craigslist', 'https://columbus.craigslist.org/cto/d/7788001100.html', null,
   null, 2018, 'Ford', 'Escape', 'SE',
   72000, 'clean', 14500, null, null, 15800, null,
   '{}', '43054', now() - interval '14 hours', now() - interval '14 hours', 'active'),

  ('user', 'https://pickandbuild.example.com/user-post/columbus1/wrangler-2019', null,
   '1C4HJXDG6KW012987', 2019, 'Jeep', 'Wrangler', 'Sport S',
   46000, 'rebuilt', 24800, null, null, 27500, null,
   '{}', '43215', now() - interval '9 hours', now() - interval '9 hours', 'active'),

  ('copart', 'https://copart.com/lot/55667788', '55667788',
   '5XYZU3LB1FG123456', 2017, 'Hyundai', 'Santa Fe', 'Sport',
   88000, 'rebuilt', null, 6800, 9200, 10400, 825,
   '{}', '43230', now() - interval '11 hours', now() - interval '11 hours', 'active'),

  ('iaai', 'https://iaai.com/vehicle/55667799', '55667799',
   null, 2020, 'Chevrolet', 'Silverado 1500', 'LT',
   54000, 'clean', null, 19500, 31000, 33500, 1100,
   '{}', '43004', now() - interval '7 hours', now() - interval '7 hours', 'active')

on conflict (source, source_url) do nothing;
