-- DEVELOPMENT SEED ONLY. Fictional Metro Vancouver properties and reports.
-- Do not treat as real renter data. Marked is_demo = true.

-- Demo users must be created via Auth (or Dashboard) first, then:
-- update public.profiles set role = 'admin' where id = '<admin-uuid>';
-- This SQL inserts properties and sample published content using placeholder
-- UUIDs that match supabase/seed/demo-ids.ts for local demo mode.

insert into public.properties (
  id, address_line_1, city, province, postal_code, country, building_name,
  property_type, year_built, units_count, latitude, longitude,
  normalized_address, normalized_city, normalized_province, normalized_postal_code,
  slug, is_demo
) values
(
  '11111111-1111-4111-8111-111111111111',
  '123 Main Street', 'Surrey', 'BC', 'V3T 1A1', 'Canada', 'Fraser View Residences',
  'apartment', 2012, 84, 49.1913, -122.8490,
  '123 main street surrey bc', 'surrey', 'bc', 'v3t1a1',
  '123-main-street-surrey-bc', true
),
(
  '22222222-2222-4222-8222-222222222222',
  '456 Kingsway', 'Vancouver', 'BC', 'V5T 3J4', 'Canada', null,
  'apartment', 1998, 42, 49.2620, -123.0980,
  '456 kingsway vancouver bc', 'vancouver', 'bc', 'v5t3j4',
  '456-kingsway-vancouver-bc', true
),
(
  '33333333-3333-4333-8333-333333333333',
  '88 University Drive', 'Burnaby', 'BC', 'V5A 1S6', 'Canada', 'Campus Court',
  'student_housing', 2016, 120, 49.2781, -122.9199,
  '88 university drive burnaby bc', 'burnaby', 'bc', 'v5a1s6',
  '88-university-drive-burnaby-bc', true
),
(
  '44444444-4444-4444-8444-444444444444',
  '2100 Nelson Street', 'Vancouver', 'BC', 'V6G 1N6', 'Canada', 'West End Walk-up',
  'apartment', 1974, 28, 49.2930, -123.1350,
  '2100 nelson street vancouver bc', 'vancouver', 'bc', 'v6g1n6',
  '2100-nelson-street-vancouver-bc', true
),
(
  '55555555-5555-4555-8555-555555555555',
  '12 Columbia Street', 'New Westminster', 'BC', 'V3L 1A7', 'Canada', null,
  'townhouse', 2008, 16, 49.2010, -122.9100,
  '12 columbia street new westminster bc', 'new westminster', 'bc', 'v3l1a7',
  '12-columbia-street-new-westminster-bc', true
);
