-- =============================================================================
-- LivRank DEVELOPMENT SEED — FICTIONAL DATA ONLY. NEVER RUN AGAINST PRODUCTION.
--
-- Every property, review, and rent report below is invented for local testing and is
-- flagged with is_demo = true, which the UI renders as a visible "Demo data" badge.
-- Addresses use placeholder street names; any resemblance to real buildings is accidental.
--
-- Demo accounts (password for all: LivRankDemo!2026):
--   demo-admin@livrank.test      admin
--   demo-moderator@livrank.test  moderator
--   demo-manager@livrank.test    manager (approved claim on 123 Main Street, Surrey)
--   demo-renter-1..4@livrank.test regular renters
-- =============================================================================

set search_path = public, extensions;

-- ---------------------------------------------------------------------------
-- Demo auth users (profiles are created by the on_auth_user_created trigger)
-- ---------------------------------------------------------------------------
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, email_change, email_change_token_new, recovery_token
)
select
  '00000000-0000-0000-0000-000000000000', u.id, 'authenticated', 'authenticated', u.email,
  extensions.crypt('LivRankDemo!2026', extensions.gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}'::jsonb,
  jsonb_build_object('display_name', u.display_name), now(), now(), '', '', '', ''
from (values
  ('00000000-0000-4000-8000-000000000001'::uuid, 'demo-admin@livrank.test', 'Demo Admin'),
  ('00000000-0000-4000-8000-000000000002'::uuid, 'demo-moderator@livrank.test', 'Demo Moderator'),
  ('00000000-0000-4000-8000-000000000003'::uuid, 'demo-manager@livrank.test', 'Demo Manager'),
  ('00000000-0000-4000-8000-000000000011'::uuid, 'demo-renter-1@livrank.test', 'Demo Renter One'),
  ('00000000-0000-4000-8000-000000000012'::uuid, 'demo-renter-2@livrank.test', null),
  ('00000000-0000-4000-8000-000000000013'::uuid, 'demo-renter-3@livrank.test', 'Demo Renter Three'),
  ('00000000-0000-4000-8000-000000000014'::uuid, 'demo-renter-4@livrank.test', null)
) as u(id, email, display_name)
on conflict (id) do nothing;

insert into auth.identities (id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
select gen_random_uuid(), u.id, u.id::text,
  jsonb_build_object('sub', u.id::text, 'email', u.email, 'email_verified', true),
  'email', now(), now(), now()
from auth.users u
where u.email like 'demo-%@livrank.test'
  and not exists (select 1 from auth.identities i where i.user_id = u.id and i.provider = 'email');

update public.profiles set role = 'admin' where id = '00000000-0000-4000-8000-000000000001';
update public.profiles set role = 'moderator' where id = '00000000-0000-4000-8000-000000000002';
update public.profiles set role = 'manager' where id = '00000000-0000-4000-8000-000000000003';

-- ---------------------------------------------------------------------------
-- Fictional properties
-- ---------------------------------------------------------------------------
insert into public.properties (
  id, address_line_1, city, province, postal_code, building_name, property_type,
  year_built, units_count, latitude, longitude, normalized_address, normalized_city,
  normalized_postal_code, slug, status, is_demo, created_by
) values
  ('10000000-0000-4000-8000-000000000001', '123 Main Street', 'Surrey', 'BC', 'V3T 1A1',
   'Maple Court (Demo)', 'apartment', 1998, 84, 49.1880, -122.8490,
   '123 main street surrey bc', 'surrey', 'V3T1A1', '123-main-street-surrey-bc', 'active', true, null),
  ('10000000-0000-4000-8000-000000000002', '88 Example Avenue', 'Vancouver', 'BC', 'V6B 0A1',
   'Harbourview Example Tower (Demo)', 'condo', 2012, 210, 49.2790, -123.1160,
   '88 example avenue vancouver bc', 'vancouver', 'V6B0A1', '88-example-avenue-vancouver-bc', 'active', true, null),
  ('10000000-0000-4000-8000-000000000003', '2200 Sample Road', 'Burnaby', 'BC', 'V5H 0A1',
   null, 'apartment', 1975, 40, 49.2270, -123.0000,
   '2200 sample road burnaby bc', 'burnaby', 'V5H0A1', '2200-sample-road-burnaby-bc', 'active', true, null),
  ('10000000-0000-4000-8000-000000000004', '15 Demo Crescent', 'New Westminster', 'BC', 'V3M 0A1',
   null, 'townhouse', 2005, 12, 49.2060, -122.9110,
   '15 demo crescent new westminster bc', 'new westminster', 'V3M0A1', '15-demo-crescent-new-westminster-bc', 'active', true, null),
  ('10000000-0000-4000-8000-000000000005', '700 Placeholder Street', 'Richmond', 'BC', 'V6X 0A1',
   null, 'basement', null, null, null, null,
   '700 placeholder street richmond bc', 'richmond', 'V6X0A1', '700-placeholder-street-richmond-bc', 'pending', true,
   '00000000-0000-4000-8000-000000000014')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Fictional reviews
-- ---------------------------------------------------------------------------
insert into public.reviews (
  id, property_id, user_id, overall_rating, maintenance_rating, management_rating, noise_rating,
  cleanliness_rating, building_condition_rating, parking_rating, value_rating,
  review_title, review_body, bedrooms, bathrooms, monthly_rent, move_in_year, move_out_year,
  renter_status, public_display_name, status, is_demo, published_at, created_at
) values
  ('20000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011',
   4, 3, 4, 4, 4, 4, 3, 4,
   'Quiet building, repairs can be slow',
   'I lived in a one-bedroom here for two years. The building was generally quiet at night. When my dishwasher stopped working, maintenance took about two weeks to fix it, though emergency issues were handled faster. Visitor parking is limited.',
   1, 1, 1750, 2023, 2025, 'former', true, 'published', true, now() - interval '40 days', now() - interval '45 days'),
  ('20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012',
   3, 2, 3, 3, 3, 3, 2, 3,
   'Okay location, maintenance response was a recurring issue',
   'The location is convenient for transit. During my tenancy the elevator was out of service twice for several days each time. Non-emergency maintenance requests usually took more than a week. Management was polite when I called.',
   2, 1, 2400, 2024, null, 'current', false, 'published', true, now() - interval '25 days', now() - interval '30 days'),
  ('20000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000013',
   4, 4, 4, 3, 4, 3, 3, 4,
   'Good value for the area',
   'Rent was reasonable compared with other places I viewed nearby. Street noise was noticeable on the lower floor facing the road. The heating worked well through winter and common areas were kept clean.',
   1, 1, 1850, 2022, 2024, 'former', true, 'published', true, now() - interval '10 days', now() - interval '12 days'),
  ('20000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000014',
   2, 2, 2, 3, 3, 2, null, 2,
   'Pending example: pest issue in 2025',
   'This pending review exists to demonstrate the moderation queue. I noticed a pest problem in the spring that took about a month to be fully resolved after I reported it to the office.',
   1, 1, null, 2025, null, 'current', false, 'pending', true, null, now() - interval '2 days'),
  ('20000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000011',
   5, 5, 4, 4, 5, 5, 4, 3,
   'Well maintained, pricey',
   'The building was very well maintained during my tenancy and amenities like the gym were always working. Concierge was helpful with packages. Rent was on the higher side and increased at renewal.',
   1, 1, 2650, 2021, 2023, 'former', false, 'published', true, now() - interval '90 days', now() - interval '95 days'),
  ('20000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000012',
   4, 4, 4, 3, 4, 4, 3, 3,
   'Great amenities, some construction noise',
   'Amenities were excellent and repairs were usually completed within a few days. There was ongoing construction next door for most of a year which made mornings loud. Parking was an extra monthly cost.',
   2, 2, 3400, 2022, 2024, 'former', false, 'published', true, now() - interval '60 days', now() - interval '62 days'),
  ('20000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000013',
   4, 4, 3, 4, 4, 4, null, 3,
   'Responsive maintenance, slow management replies',
   'Maintenance requests through the online portal were handled quickly. Getting answers from the management office about my lease renewal took several emails over a few weeks.',
   0, 1, 2100, 2023, null, 'current', true, 'published', true, now() - interval '5 days', now() - interval '6 days'),
  ('20000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000011',
   3, 3, 3, 2, 3, 2, 4, 4,
   'Older building, affordable',
   'An older building with thin walls; I could hear neighbours regularly. The rent was affordable and there was plenty of street parking. Hot water occasionally ran out in the mornings.',
   1, 1, 1500, 2020, 2022, 'former', false, 'published', true, now() - interval '120 days', now() - interval '125 days'),
  ('20000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000003', '00000000-0000-4000-8000-000000000012',
   1, null, null, null, null, null, null, null,
   'Rejected example',
   'This rejected review exists to demonstrate moderation history. It contained an unsupported accusation about a named individual and was not published.',
   null, null, null, null, null, 'former', false, 'rejected', true, null, now() - interval '50 days'),
  ('20000000-0000-4000-8000-000000000010', '10000000-0000-4000-8000-000000000005', '00000000-0000-4000-8000-000000000014',
   3, 3, 3, 3, 3, null, null, 3,
   'Pending example for a newly proposed property',
   'This pending review belongs to a property page proposed by a renter. The property becomes public only after moderation approves published content for it.',
   0, 1, 1400, 2025, null, 'current', false, 'pending', true, null, now() - interval '1 day')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Fictional rent reports
-- ---------------------------------------------------------------------------
insert into public.rent_reports (
  id, property_id, user_id, bedrooms, bathrooms, monthly_rent, parking_cost, utilities_included,
  lease_start_year, lease_end_year, renter_status, status, is_demo, published_at, created_at
) values
  ('30000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', 1, 1, 1750, 50, false, 2024, 2025, 'former', 'published', true, now() - interval '40 days', now() - interval '41 days'),
  ('30000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', 1, 1, 1850, null, false, 2025, null, 'current', 'published', true, now() - interval '30 days', now() - interval '31 days'),
  ('30000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000013', 1, 1, 1950, 50, false, 2026, null, 'current', 'published', true, now() - interval '9 days', now() - interval '10 days'),
  ('30000000-0000-4000-8000-000000000004', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000014', 2, 1, 2450, 75, false, 2025, null, 'current', 'published', true, now() - interval '20 days', now() - interval '21 days'),
  ('30000000-0000-4000-8000-000000000005', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000011', 2, 2, 2550, 75, true, 2026, null, 'current', 'published', true, now() - interval '3 days', now() - interval '4 days'),
  ('30000000-0000-4000-8000-000000000006', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000014', 1, 1, 2000, null, false, 2026, null, 'current', 'pending', true, null, now() - interval '1 day'),
  ('30000000-0000-4000-8000-000000000007', '10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000011', 1, 1, 2650, 150, false, 2022, 2023, 'former', 'published', true, now() - interval '90 days', now() - interval '91 days'),
  ('30000000-0000-4000-8000-000000000008', '10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000012', 3, 2, 3100, null, false, 2024, 2025, 'former', 'published', true, now() - interval '70 days', now() - interval '71 days'),
  ('30000000-0000-4000-8000-000000000009', '10000000-0000-4000-8000-000000000004', '00000000-0000-4000-8000-000000000013', 3, 2.5, 3250, null, false, 2025, null, 'current', 'published', true, now() - interval '15 days', now() - interval '16 days')
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Topics for published demo reviews (normally produced after moderation approval)
-- ---------------------------------------------------------------------------
insert into public.review_topics (review_id, topic, confidence, source) values
  ('20000000-0000-4000-8000-000000000001', 'maintenance', 0.9, 'seed'),
  ('20000000-0000-4000-8000-000000000001', 'noise', 0.7, 'seed'),
  ('20000000-0000-4000-8000-000000000001', 'parking', 0.7, 'seed'),
  ('20000000-0000-4000-8000-000000000002', 'maintenance', 0.9, 'seed'),
  ('20000000-0000-4000-8000-000000000002', 'elevator', 0.9, 'seed'),
  ('20000000-0000-4000-8000-000000000002', 'transit', 0.6, 'seed'),
  ('20000000-0000-4000-8000-000000000002', 'management', 0.6, 'seed'),
  ('20000000-0000-4000-8000-000000000003', 'noise', 0.8, 'seed'),
  ('20000000-0000-4000-8000-000000000003', 'heating', 0.7, 'seed'),
  ('20000000-0000-4000-8000-000000000003', 'cleanliness', 0.6, 'seed'),
  ('20000000-0000-4000-8000-000000000005', 'amenities', 0.8, 'seed'),
  ('20000000-0000-4000-8000-000000000005', 'rent_increases', 0.8, 'seed'),
  ('20000000-0000-4000-8000-000000000006', 'amenities', 0.8, 'seed'),
  ('20000000-0000-4000-8000-000000000006', 'noise', 0.8, 'seed'),
  ('20000000-0000-4000-8000-000000000006', 'parking', 0.6, 'seed'),
  ('20000000-0000-4000-8000-000000000007', 'maintenance', 0.8, 'seed'),
  ('20000000-0000-4000-8000-000000000007', 'management', 0.8, 'seed'),
  ('20000000-0000-4000-8000-000000000008', 'noise', 0.8, 'seed'),
  ('20000000-0000-4000-8000-000000000008', 'water', 0.7, 'seed'),
  ('20000000-0000-4000-8000-000000000008', 'building_condition', 0.6, 'seed')
on conflict (review_id, topic) do nothing;

-- ---------------------------------------------------------------------------
-- Votes, flags, manager claim + response, moderation history, notifications
-- ---------------------------------------------------------------------------
insert into public.review_votes (review_id, user_id, vote) values
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000012', 'helpful'),
  ('20000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000013', 'helpful'),
  ('20000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000011', 'helpful')
on conflict (review_id, user_id) do nothing;

insert into public.review_flags (id, review_id, reported_by, reason, details, status) values
  ('40000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002',
   '00000000-0000-4000-8000-000000000013', 'other', 'Demo flag: example of an open report for the moderation queue.', 'open')
on conflict (id) do nothing;

insert into public.property_claims (id, property_id, user_id, verification_status, verification_method, company_name, notes, reviewed_by, reviewed_at) values
  ('50000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '00000000-0000-4000-8000-000000000003',
   'approved', 'business_email', 'Demo Property Management Ltd.', 'Demo claim approved for local testing.',
   '00000000-0000-4000-8000-000000000001', now() - interval '20 days'),
  ('50000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000003',
   'pending', 'document', 'Demo Property Management Ltd.', 'Demo pending claim.', null, null)
on conflict (id) do nothing;

insert into public.management_responses (id, review_id, property_id, manager_user_id, response_body, status) values
  ('60000000-0000-4000-8000-000000000001', '20000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001',
   '00000000-0000-4000-8000-000000000003',
   'Thank you for the feedback. We replaced the elevator controller this year and now publish expected repair timelines in the lobby. (Demo response.)',
   'published')
on conflict (id) do nothing;

insert into public.moderation_actions (moderator_id, target_type, target_id, action, reason) values
  ('00000000-0000-4000-8000-000000000001', 'review', '20000000-0000-4000-8000-000000000001', 'approve', 'Demo seed'),
  ('00000000-0000-4000-8000-000000000002', 'review', '20000000-0000-4000-8000-000000000009', 'reject', 'Unsupported accusation (demo)'),
  ('00000000-0000-4000-8000-000000000001', 'property_claim', '50000000-0000-4000-8000-000000000001', 'approve', 'Demo seed');

insert into public.notifications (user_id, type, title, body, link) values
  ('00000000-0000-4000-8000-000000000011', 'review_approved', 'Your review was published',
   'Your review of 123 Main Street, Surrey is now public.', '/property/123-main-street-surrey-bc');

-- Units: two former renters (public) and one current renter (kept private) at 123 Main Street.
insert into public.property_units (id, property_id, unit_key, created_by) values
  ('70000000-0000-4000-8000-000000000001', '10000000-0000-4000-8000-000000000001', '1204', '00000000-0000-4000-8000-000000000011'),
  ('70000000-0000-4000-8000-000000000002', '10000000-0000-4000-8000-000000000001', '807', '00000000-0000-4000-8000-000000000013'),
  ('70000000-0000-4000-8000-000000000003', '10000000-0000-4000-8000-000000000001', '1502', '00000000-0000-4000-8000-000000000012')
on conflict (property_id, unit_key) do nothing;

update public.reviews r set unit_id = v.unit_id
from (values
  ('20000000-0000-4000-8000-000000000001'::uuid, '70000000-0000-4000-8000-000000000001'::uuid),
  ('20000000-0000-4000-8000-000000000003'::uuid, '70000000-0000-4000-8000-000000000002'::uuid),
  ('20000000-0000-4000-8000-000000000002'::uuid, '70000000-0000-4000-8000-000000000003'::uuid)
) as v(review_id, unit_id)
where r.id = v.review_id and r.unit_id is null;

insert into public.audit_logs (actor_user_id, action, entity_type, entity_id, metadata) values
  ('00000000-0000-4000-8000-000000000001', 'seed.loaded', 'system', null, '{"note":"Development seed data loaded"}');
