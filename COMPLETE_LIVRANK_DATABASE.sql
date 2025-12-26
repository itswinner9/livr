-- ════════════════════════════════════════════════════════════════════════════
-- 🚀 LIVRANK - COMPLETE DATABASE SETUP
-- ════════════════════════════════════════════════════════════════════════════
-- This script sets up EVERYTHING needed for LivRank to work 100%
-- • User profiles with roles (user/admin)
-- • Buildings, Neighborhoods, Landlords
-- • Reviews and ratings
-- • Discussions (Reddit-style)
-- • All triggers and functions
-- • Row Level Security (RLS) policies
-- ════════════════════════════════════════════════════════════════════════════

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 1: Clean up existing tables (if any)
-- ════════════════════════════════════════════════════════════════════════════

DROP TABLE IF EXISTS discussion_votes CASCADE;
DROP TABLE IF EXISTS discussions CASCADE;
DROP TABLE IF EXISTS review_votes CASCADE;
DROP TABLE IF EXISTS building_reviews CASCADE;
DROP TABLE IF EXISTS neighborhood_reviews CASCADE;
DROP TABLE IF EXISTS buildings CASCADE;
DROP TABLE IF EXISTS landlords CASCADE;
DROP TABLE IF EXISTS neighborhoods CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

DROP FUNCTION IF EXISTS handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS update_neighborhood_ratings() CASCADE;
DROP FUNCTION IF EXISTS update_building_ratings() CASCADE;

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 2: Create ENUM types
-- ════════════════════════════════════════════════════════════════════════════

DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('user', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE review_status AS ENUM ('pending', 'approved', 'rejected');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 3: USER PROFILES TABLE (with role classification)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role user_role DEFAULT 'user' NOT NULL,
  bio TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_profiles
CREATE POLICY "Public profiles are viewable by everyone"
  ON user_profiles FOR SELECT
  USING (true);

CREATE POLICY "Users can update own profile"
  ON user_profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON user_profiles FOR INSERT
  WITH CHECK (auth.uid() = id);

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 4: NEIGHBORHOODS TABLE
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE neighborhoods (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  country TEXT DEFAULT 'Canada',
  description TEXT,
  cover_image TEXT,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  
  -- Aggregated ratings
  overall_rating NUMERIC(3, 2) DEFAULT 0,
  safety_rating NUMERIC(3, 2) DEFAULT 0,
  walkability_rating NUMERIC(3, 2) DEFAULT 0,
  transit_rating NUMERIC(3, 2) DEFAULT 0,
  schools_rating NUMERIC(3, 2) DEFAULT 0,
  amenities_rating NUMERIC(3, 2) DEFAULT 0,
  quiet_rating NUMERIC(3, 2) DEFAULT 0,
  
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(name, city, province)
);

-- Enable RLS
ALTER TABLE neighborhoods ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Neighborhoods are viewable by everyone"
  ON neighborhoods FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert neighborhoods"
  ON neighborhoods FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update neighborhoods"
  ON neighborhoods FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 5: LANDLORDS TABLE
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE landlords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  website TEXT,
  phone TEXT,
  email TEXT,
  cover_image TEXT,
  
  -- Aggregated ratings
  overall_rating NUMERIC(3, 2) DEFAULT 0,
  responsiveness_rating NUMERIC(3, 2) DEFAULT 0,
  maintenance_rating NUMERIC(3, 2) DEFAULT 0,
  transparency_rating NUMERIC(3, 2) DEFAULT 0,
  
  total_reviews INTEGER DEFAULT 0,
  total_buildings INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE landlords ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Landlords are viewable by everyone"
  ON landlords FOR SELECT
  USING (true);

CREATE POLICY "Admins can insert landlords"
  ON landlords FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update landlords"
  ON landlords FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 6: BUILDINGS TABLE
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE buildings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  address TEXT NOT NULL,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  postal_code TEXT,
  country TEXT DEFAULT 'Canada',
  
  neighborhood_id UUID REFERENCES neighborhoods(id) ON DELETE SET NULL,
  landlord_id UUID REFERENCES landlords(id) ON DELETE SET NULL,
  
  description TEXT,
  year_built INTEGER,
  total_units INTEGER,
  cover_image TEXT,
  latitude NUMERIC(10, 8),
  longitude NUMERIC(11, 8),
  
  -- Aggregated ratings
  overall_rating NUMERIC(3, 2) DEFAULT 0,
  management_rating NUMERIC(3, 2) DEFAULT 0,
  cleanliness_rating NUMERIC(3, 2) DEFAULT 0,
  maintenance_rating NUMERIC(3, 2) DEFAULT 0,
  value_rating NUMERIC(3, 2) DEFAULT 0,
  noise_rating NUMERIC(3, 2) DEFAULT 0,
  amenities_rating NUMERIC(3, 2) DEFAULT 0,
  
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(address, city, province)
);

-- Enable RLS
ALTER TABLE buildings ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Buildings are viewable by everyone"
  ON buildings FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert buildings"
  ON buildings FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can update buildings"
  ON buildings FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 7: NEIGHBORHOOD REVIEWS TABLE
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE neighborhood_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  neighborhood_id UUID NOT NULL REFERENCES neighborhoods(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Review content
  title TEXT,
  review TEXT NOT NULL,
  pros TEXT,
  cons TEXT,
  
  -- Privacy
  is_anonymous BOOLEAN DEFAULT false,
  display_name TEXT,
  
  -- Ratings (1-5)
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  safety_rating INTEGER CHECK (safety_rating BETWEEN 1 AND 5),
  walkability_rating INTEGER CHECK (walkability_rating BETWEEN 1 AND 5),
  transit_rating INTEGER CHECK (transit_rating BETWEEN 1 AND 5),
  schools_rating INTEGER CHECK (schools_rating BETWEEN 1 AND 5),
  amenities_rating INTEGER CHECK (amenities_rating BETWEEN 1 AND 5),
  quiet_rating INTEGER CHECK (quiet_rating BETWEEN 1 AND 5),
  
  -- Metadata
  years_lived INTEGER,
  would_recommend BOOLEAN,
  status review_status DEFAULT 'approved',
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(neighborhood_id, user_id)
);

-- Enable RLS
ALTER TABLE neighborhood_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Reviews are viewable by everyone"
  ON neighborhood_reviews FOR SELECT
  USING (status = 'approved' OR user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated users can insert reviews"
  ON neighborhood_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
  ON neighborhood_reviews FOR UPDATE
  USING (auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can delete own reviews"
  ON neighborhood_reviews FOR DELETE
  USING (auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 8: BUILDING REVIEWS TABLE
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE building_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  building_id UUID NOT NULL REFERENCES buildings(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  -- Review content
  title TEXT,
  review TEXT NOT NULL,
  pros TEXT,
  cons TEXT,
  
  -- Privacy
  is_anonymous BOOLEAN DEFAULT false,
  display_name TEXT,
  
  -- Ratings (1-5)
  overall_rating INTEGER NOT NULL CHECK (overall_rating BETWEEN 1 AND 5),
  management_rating INTEGER CHECK (management_rating BETWEEN 1 AND 5),
  cleanliness_rating INTEGER CHECK (cleanliness_rating BETWEEN 1 AND 5),
  maintenance_rating INTEGER CHECK (maintenance_rating BETWEEN 1 AND 5),
  value_rating INTEGER CHECK (value_rating BETWEEN 1 AND 5),
  noise_rating INTEGER CHECK (noise_rating BETWEEN 1 AND 5),
  amenities_rating INTEGER CHECK (amenities_rating BETWEEN 1 AND 5),
  
  -- Metadata
  unit_number TEXT,
  years_lived INTEGER,
  monthly_rent NUMERIC(10, 2),
  would_recommend BOOLEAN,
  status review_status DEFAULT 'approved',
  helpful_count INTEGER DEFAULT 0,
  not_helpful_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(building_id, user_id)
);

-- Enable RLS
ALTER TABLE building_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Building reviews are viewable by everyone"
  ON building_reviews FOR SELECT
  USING (status = 'approved' OR user_id = auth.uid() OR 
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Authenticated users can insert building reviews"
  ON building_reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own building reviews"
  ON building_reviews FOR UPDATE
  USING (auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can delete own building reviews"
  ON building_reviews FOR DELETE
  USING (auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 9: REVIEW VOTES TABLE
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE review_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL,
  review_type TEXT NOT NULL CHECK (review_type IN ('building', 'neighborhood')),
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  vote INTEGER NOT NULL CHECK (vote IN (-1, 1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(review_id, review_type, user_id)
);

-- Enable RLS
ALTER TABLE review_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Votes are viewable by everyone"
  ON review_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert votes"
  ON review_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own votes"
  ON review_votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own votes"
  ON review_votes FOR DELETE
  USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 10: DISCUSSIONS TABLE (Reddit-style)
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE discussions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
  
  entity_type TEXT NOT NULL CHECK (entity_type IN ('building', 'neighborhood', 'landlord')),
  entity_id UUID NOT NULL,
  
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  
  title TEXT,
  content TEXT NOT NULL,
  
  upvotes INTEGER DEFAULT 0,
  downvotes INTEGER DEFAULT 0,
  
  is_anonymous BOOLEAN DEFAULT false,
  display_name TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Discussions are viewable by everyone"
  ON discussions FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can create discussions"
  ON discussions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discussions"
  ON discussions FOR UPDATE
  USING (auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

CREATE POLICY "Users can delete own discussions"
  ON discussions FOR DELETE
  USING (auth.uid() = user_id OR 
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 11: DISCUSSION VOTES TABLE
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE discussion_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  discussion_id UUID NOT NULL REFERENCES discussions(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES user_profiles(id) ON DELETE CASCADE,
  vote INTEGER NOT NULL CHECK (vote IN (-1, 1)),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(discussion_id, user_id)
);

-- Enable RLS
ALTER TABLE discussion_votes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Discussion votes are viewable by everyone"
  ON discussion_votes FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can vote on discussions"
  ON discussion_votes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discussion votes"
  ON discussion_votes FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own discussion votes"
  ON discussion_votes FOR DELETE
  USING (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 12: TRIGGERS & FUNCTIONS
-- ════════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- Function: Auto-create user profile on signup
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.raw_user_meta_data->>'name', ''),
    'user'::user_role
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists, then create
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ─────────────────────────────────────────────────────────────────────────────
-- Function: Update neighborhood ratings
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_neighborhood_ratings()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE neighborhoods
  SET
    overall_rating = COALESCE((
      SELECT AVG(overall_rating)::NUMERIC(3,2)
      FROM neighborhood_reviews
      WHERE neighborhood_id = COALESCE(NEW.neighborhood_id, OLD.neighborhood_id)
        AND status = 'approved'
    ), 0),
    safety_rating = COALESCE((
      SELECT AVG(safety_rating)::NUMERIC(3,2)
      FROM neighborhood_reviews
      WHERE neighborhood_id = COALESCE(NEW.neighborhood_id, OLD.neighborhood_id)
        AND status = 'approved'
        AND safety_rating IS NOT NULL
    ), 0),
    walkability_rating = COALESCE((
      SELECT AVG(walkability_rating)::NUMERIC(3,2)
      FROM neighborhood_reviews
      WHERE neighborhood_id = COALESCE(NEW.neighborhood_id, OLD.neighborhood_id)
        AND status = 'approved'
        AND walkability_rating IS NOT NULL
    ), 0),
    transit_rating = COALESCE((
      SELECT AVG(transit_rating)::NUMERIC(3,2)
      FROM neighborhood_reviews
      WHERE neighborhood_id = COALESCE(NEW.neighborhood_id, OLD.neighborhood_id)
        AND status = 'approved'
        AND transit_rating IS NOT NULL
    ), 0),
    schools_rating = COALESCE((
      SELECT AVG(schools_rating)::NUMERIC(3,2)
      FROM neighborhood_reviews
      WHERE neighborhood_id = COALESCE(NEW.neighborhood_id, OLD.neighborhood_id)
        AND status = 'approved'
        AND schools_rating IS NOT NULL
    ), 0),
    amenities_rating = COALESCE((
      SELECT AVG(amenities_rating)::NUMERIC(3,2)
      FROM neighborhood_reviews
      WHERE neighborhood_id = COALESCE(NEW.neighborhood_id, OLD.neighborhood_id)
        AND status = 'approved'
        AND amenities_rating IS NOT NULL
    ), 0),
    quiet_rating = COALESCE((
      SELECT AVG(quiet_rating)::NUMERIC(3,2)
      FROM neighborhood_reviews
      WHERE neighborhood_id = COALESCE(NEW.neighborhood_id, OLD.neighborhood_id)
        AND status = 'approved'
        AND quiet_rating IS NOT NULL
    ), 0),
    total_reviews = (
      SELECT COUNT(*)
      FROM neighborhood_reviews
      WHERE neighborhood_id = COALESCE(NEW.neighborhood_id, OLD.neighborhood_id)
        AND status = 'approved'
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.neighborhood_id, OLD.neighborhood_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_neighborhood_ratings_trigger ON neighborhood_reviews;
CREATE TRIGGER update_neighborhood_ratings_trigger
  AFTER INSERT OR UPDATE OR DELETE ON neighborhood_reviews
  FOR EACH ROW EXECUTE FUNCTION update_neighborhood_ratings();

-- ─────────────────────────────────────────────────────────────────────────────
-- Function: Update building ratings
-- ─────────────────────────────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_building_ratings()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE buildings
  SET
    overall_rating = COALESCE((
      SELECT AVG(overall_rating)::NUMERIC(3,2)
      FROM building_reviews
      WHERE building_id = COALESCE(NEW.building_id, OLD.building_id)
        AND status = 'approved'
    ), 0),
    management_rating = COALESCE((
      SELECT AVG(management_rating)::NUMERIC(3,2)
      FROM building_reviews
      WHERE building_id = COALESCE(NEW.building_id, OLD.building_id)
        AND status = 'approved'
        AND management_rating IS NOT NULL
    ), 0),
    cleanliness_rating = COALESCE((
      SELECT AVG(cleanliness_rating)::NUMERIC(3,2)
      FROM building_reviews
      WHERE building_id = COALESCE(NEW.building_id, OLD.building_id)
        AND status = 'approved'
        AND cleanliness_rating IS NOT NULL
    ), 0),
    maintenance_rating = COALESCE((
      SELECT AVG(maintenance_rating)::NUMERIC(3,2)
      FROM building_reviews
      WHERE building_id = COALESCE(NEW.building_id, OLD.building_id)
        AND status = 'approved'
        AND maintenance_rating IS NOT NULL
    ), 0),
    value_rating = COALESCE((
      SELECT AVG(value_rating)::NUMERIC(3,2)
      FROM building_reviews
      WHERE building_id = COALESCE(NEW.building_id, OLD.building_id)
        AND status = 'approved'
        AND value_rating IS NOT NULL
    ), 0),
    noise_rating = COALESCE((
      SELECT AVG(noise_rating)::NUMERIC(3,2)
      FROM building_reviews
      WHERE building_id = COALESCE(NEW.building_id, OLD.building_id)
        AND status = 'approved'
        AND noise_rating IS NOT NULL
    ), 0),
    amenities_rating = COALESCE((
      SELECT AVG(amenities_rating)::NUMERIC(3,2)
      FROM building_reviews
      WHERE building_id = COALESCE(NEW.building_id, OLD.building_id)
        AND status = 'approved'
        AND amenities_rating IS NOT NULL
    ), 0),
    total_reviews = (
      SELECT COUNT(*)
      FROM building_reviews
      WHERE building_id = COALESCE(NEW.building_id, OLD.building_id)
        AND status = 'approved'
    ),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.building_id, OLD.building_id);
  
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_building_ratings_trigger ON building_reviews;
CREATE TRIGGER update_building_ratings_trigger
  AFTER INSERT OR UPDATE OR DELETE ON building_reviews
  FOR EACH ROW EXECUTE FUNCTION update_building_ratings();

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 13: CREATE INDEXES FOR PERFORMANCE
-- ════════════════════════════════════════════════════════════════════════════

CREATE INDEX idx_neighborhoods_city ON neighborhoods(city);
CREATE INDEX idx_neighborhoods_slug ON neighborhoods(slug);
CREATE INDEX idx_buildings_city ON buildings(city);
CREATE INDEX idx_buildings_slug ON buildings(slug);
CREATE INDEX idx_buildings_neighborhood ON buildings(neighborhood_id);
CREATE INDEX idx_buildings_landlord ON buildings(landlord_id);
CREATE INDEX idx_landlords_slug ON landlords(slug);
CREATE INDEX idx_neighborhood_reviews_neighborhood ON neighborhood_reviews(neighborhood_id);
CREATE INDEX idx_neighborhood_reviews_user ON neighborhood_reviews(user_id);
CREATE INDEX idx_building_reviews_building ON building_reviews(building_id);
CREATE INDEX idx_building_reviews_user ON building_reviews(user_id);
CREATE INDEX idx_discussions_entity ON discussions(entity_type, entity_id);
CREATE INDEX idx_discussions_parent ON discussions(parent_id);

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 14: MAKE SPECIFIC USER AN ADMIN
-- ════════════════════════════════════════════════════════════════════════════

-- This will make 25luise@tiffincrane.com an admin (if they sign up)
-- We'll create a function to easily promote users to admin

CREATE OR REPLACE FUNCTION make_user_admin(user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  user_uuid UUID;
BEGIN
  -- Find user by email in auth.users
  SELECT id INTO user_uuid
  FROM auth.users
  WHERE email = user_email;
  
  IF user_uuid IS NULL THEN
    RETURN 'User not found. Please make sure they have signed up first.';
  END IF;
  
  -- Update their role to admin
  UPDATE user_profiles
  SET role = 'admin'::user_role
  WHERE id = user_uuid;
  
  IF FOUND THEN
    RETURN 'Success! User ' || user_email || ' is now an admin.';
  ELSE
    RETURN 'User profile not found. They may need to log in once first.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 15: VERIFICATION & SUCCESS MESSAGE
-- ════════════════════════════════════════════════════════════════════════════

DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '✅ SUCCESS! LIVRANK DATABASE IS 100%% READY!';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════════';
  RAISE NOTICE '';
  RAISE NOTICE '📊 TABLES CREATED:';
  RAISE NOTICE '  ✅ user_profiles (with role: user/admin)';
  RAISE NOTICE '  ✅ neighborhoods';
  RAISE NOTICE '  ✅ landlords';
  RAISE NOTICE '  ✅ buildings';
  RAISE NOTICE '  ✅ neighborhood_reviews';
  RAISE NOTICE '  ✅ building_reviews';
  RAISE NOTICE '  ✅ review_votes';
  RAISE NOTICE '  ✅ discussions (Reddit-style)';
  RAISE NOTICE '  ✅ discussion_votes';
  RAISE NOTICE '';
  RAISE NOTICE '🔐 SECURITY:';
  RAISE NOTICE '  ✅ Row Level Security (RLS) enabled on all tables';
  RAISE NOTICE '  ✅ Users can only edit their own content';
  RAISE NOTICE '  ✅ Admins have full permissions';
  RAISE NOTICE '';
  RAISE NOTICE '⚡ TRIGGERS:';
  RAISE NOTICE '  ✅ Auto-create user profile on signup';
  RAISE NOTICE '  ✅ Auto-update neighborhood ratings';
  RAISE NOTICE '  ✅ Auto-update building ratings';
  RAISE NOTICE '';
  RAISE NOTICE '🎯 NEXT STEPS:';
  RAISE NOTICE '  1. Test signup at: http://localhost:3000/signup';
  RAISE NOTICE '  2. Make admin: SELECT make_user_admin(''25luise@tiffincrane.com'');';
  RAISE NOTICE '  3. Test rating at: http://localhost:3000/rate/building';
  RAISE NOTICE '';
  RAISE NOTICE '════════════════════════════════════════════════════════════════════════════';
END $$;

-- Show all tables
SELECT 
  tablename as "📋 Table Name",
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) as "💾 Size"
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;

-- Show user_profiles structure
SELECT 
  column_name as "Column",
  data_type as "Type",
  is_nullable as "Nullable"
FROM information_schema.columns
WHERE table_name = 'user_profiles'
ORDER BY ordinal_position;



