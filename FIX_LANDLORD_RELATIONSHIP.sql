-- ════════════════════════════════════════════════════════════════════════════
-- 🔧 FIX LANDLORD_REVIEWS RELATIONSHIP - Run this if you get relationship errors
-- ════════════════════════════════════════════════════════════════════════════
-- This script explicitly ensures the foreign key relationship exists
-- and is recognized by Supabase's schema cache.
-- ════════════════════════════════════════════════════════════════════════════

-- Step 1: Ensure landlords table exists
CREATE TABLE IF NOT EXISTS landlords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  city TEXT,
  province TEXT,
  country TEXT DEFAULT 'Canada',
  description TEXT,
  profile_image TEXT,
  overall_rating NUMERIC(3, 2) DEFAULT 0,
  responsiveness_rating NUMERIC(3, 2) DEFAULT 0,
  maintenance_rating NUMERIC(3, 2) DEFAULT 0,
  communication_rating NUMERIC(3, 2) DEFAULT 0,
  fairness_rating NUMERIC(3, 2) DEFAULT 0,
  professionalism_rating NUMERIC(3, 2) DEFAULT 0,
  total_reviews INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Step 2: Drop existing foreign key constraint if it exists (to recreate it)
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'landlord_reviews_landlord_id_fkey'
  ) THEN
    ALTER TABLE landlord_reviews DROP CONSTRAINT landlord_reviews_landlord_id_fkey;
  END IF;
END $$;

-- Step 3: Ensure landlord_reviews table exists WITHOUT the foreign key first
CREATE TABLE IF NOT EXISTS landlord_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  landlord_id UUID NOT NULL,
  user_id UUID NOT NULL,
  review TEXT,
  comment TEXT,
  pros TEXT,
  cons TEXT,
  overall_rating NUMERIC(3, 2) CHECK (overall_rating BETWEEN 1 AND 5),
  responsiveness NUMERIC(3, 2) CHECK (responsiveness BETWEEN 1 AND 5),
  responsiveness_rating NUMERIC(3, 2) CHECK (responsiveness_rating BETWEEN 1 AND 5),
  maintenance NUMERIC(3, 2) CHECK (maintenance BETWEEN 1 AND 5),
  maintenance_rating NUMERIC(3, 2) CHECK (maintenance_rating BETWEEN 1 AND 5),
  communication NUMERIC(3, 2) CHECK (communication BETWEEN 1 AND 5),
  communication_rating NUMERIC(3, 2) CHECK (communication_rating BETWEEN 1 AND 5),
  fairness NUMERIC(3, 2) CHECK (fairness BETWEEN 1 AND 5),
  fairness_rating NUMERIC(3, 2) CHECK (fairness_rating BETWEEN 1 AND 5),
  professionalism NUMERIC(3, 2) CHECK (professionalism BETWEEN 1 AND 5),
  professionalism_rating NUMERIC(3, 2) CHECK (professionalism_rating BETWEEN 1 AND 5),
  years_rented INTEGER,
  monthly_rent NUMERIC(10, 2),
  would_recommend BOOLEAN,
  images TEXT[],
  is_anonymous BOOLEAN DEFAULT false,
  display_name TEXT,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  verification_request_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(landlord_id, user_id)
);

-- Step 4: Add foreign key constraint explicitly with a named constraint
ALTER TABLE landlord_reviews
DROP CONSTRAINT IF EXISTS landlord_reviews_landlord_id_fkey;

ALTER TABLE landlord_reviews
ADD CONSTRAINT landlord_reviews_landlord_id_fkey 
FOREIGN KEY (landlord_id) 
REFERENCES landlords(id) 
ON DELETE CASCADE;

-- Step 5: Ensure user_id foreign key exists
ALTER TABLE landlord_reviews
DROP CONSTRAINT IF EXISTS landlord_reviews_user_id_fkey;

ALTER TABLE landlord_reviews
ADD CONSTRAINT landlord_reviews_user_id_fkey 
FOREIGN KEY (user_id) 
REFERENCES user_profiles(id) 
ON DELETE CASCADE;

-- Step 6: Refresh Supabase schema cache by creating/dropping a dummy function
-- This forces Supabase to refresh its schema cache
DO $$
BEGIN
  -- This will refresh the schema cache
  PERFORM pg_notify('pgrst', 'reload schema');
EXCEPTION WHEN OTHERS THEN
  -- Ignore if notification fails
  NULL;
END $$;

-- Step 7: Verify the relationship exists
SELECT 
  conname AS constraint_name,
  conrelid::regclass AS table_name,
  confrelid::regclass AS referenced_table,
  a.attname AS column_name,
  af.attname AS referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
JOIN pg_attribute af ON af.attnum = ANY(c.confkey) AND af.attrelid = c.confrelid
WHERE conrelid = 'landlord_reviews'::regclass
  AND confrelid = 'landlords'::regclass
  AND contype = 'f';

SELECT '✅ Foreign key relationship between landlord_reviews and landlords is now properly configured!' as status;

