-- ════════════════════════════════════════════════════════════════════════════
-- 🔧 COMPLETE LANDLORDS TABLE FIX - Add all missing columns
-- ════════════════════════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor to ensure landlords table has all required columns

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 1: Create landlords table if it doesn't exist with all columns
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS landlords (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE,
  company_name TEXT,
  email TEXT,
  phone TEXT,
  website TEXT,
  city TEXT NOT NULL,
  province TEXT NOT NULL,
  country TEXT DEFAULT 'Canada',
  description TEXT,
  profile_image TEXT,
  
  -- Rating columns
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

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 2: Add missing columns one by one (safe - won't fail if column exists)
-- ════════════════════════════════════════════════════════════════════════════

-- Add slug if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'slug') THEN
    ALTER TABLE landlords ADD COLUMN slug TEXT;
    CREATE UNIQUE INDEX IF NOT EXISTS idx_landlords_slug ON landlords(slug) WHERE slug IS NOT NULL;
  END IF;
END $$;

-- Add company_name if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'company_name') THEN
    ALTER TABLE landlords ADD COLUMN company_name TEXT;
  END IF;
END $$;

-- Add email if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'email') THEN
    ALTER TABLE landlords ADD COLUMN email TEXT;
  END IF;
END $$;

-- Add phone if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'phone') THEN
    ALTER TABLE landlords ADD COLUMN phone TEXT;
  END IF;
END $$;

-- Add website if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'website') THEN
    ALTER TABLE landlords ADD COLUMN website TEXT;
  END IF;
END $$;

-- Add city if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'city') THEN
    ALTER TABLE landlords ADD COLUMN city TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- Add province if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'province') THEN
    ALTER TABLE landlords ADD COLUMN province TEXT NOT NULL DEFAULT '';
  END IF;
END $$;

-- Add country if missing (THIS IS THE CRITICAL FIX)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'country') THEN
    ALTER TABLE landlords ADD COLUMN country TEXT DEFAULT 'Canada';
    -- Update existing rows to have 'Canada' as default
    UPDATE landlords SET country = 'Canada' WHERE country IS NULL;
  END IF;
END $$;

-- Add description if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'description') THEN
    ALTER TABLE landlords ADD COLUMN description TEXT;
  END IF;
END $$;

-- Add profile_image if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'profile_image') THEN
    ALTER TABLE landlords ADD COLUMN profile_image TEXT;
  END IF;
END $$;

-- Add overall_rating if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'overall_rating') THEN
    ALTER TABLE landlords ADD COLUMN overall_rating NUMERIC(3, 2) DEFAULT 0;
  END IF;
END $$;

-- Add responsiveness_rating if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'responsiveness_rating') THEN
    ALTER TABLE landlords ADD COLUMN responsiveness_rating NUMERIC(3, 2) DEFAULT 0;
  END IF;
END $$;

-- Add maintenance_rating if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'maintenance_rating') THEN
    ALTER TABLE landlords ADD COLUMN maintenance_rating NUMERIC(3, 2) DEFAULT 0;
  END IF;
END $$;

-- Add communication_rating if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'communication_rating') THEN
    ALTER TABLE landlords ADD COLUMN communication_rating NUMERIC(3, 2) DEFAULT 0;
  END IF;
END $$;

-- Add fairness_rating if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'fairness_rating') THEN
    ALTER TABLE landlords ADD COLUMN fairness_rating NUMERIC(3, 2) DEFAULT 0;
  END IF;
END $$;

-- Add professionalism_rating if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'professionalism_rating') THEN
    ALTER TABLE landlords ADD COLUMN professionalism_rating NUMERIC(3, 2) DEFAULT 0;
  END IF;
END $$;

-- Add total_reviews if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'total_reviews') THEN
    ALTER TABLE landlords ADD COLUMN total_reviews INTEGER DEFAULT 0;
  END IF;
END $$;

-- Add created_at if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'created_at') THEN
    ALTER TABLE landlords ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Add updated_at if missing
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'updated_at') THEN
    ALTER TABLE landlords ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 3: Update existing rows to have default values where needed
-- ════════════════════════════════════════════════════════════════════════════

-- Set default country for existing rows
UPDATE landlords SET country = 'Canada' WHERE country IS NULL OR country = '';

-- Set default ratings for existing rows
UPDATE landlords SET overall_rating = 0 WHERE overall_rating IS NULL;
UPDATE landlords SET responsiveness_rating = 0 WHERE responsiveness_rating IS NULL;
UPDATE landlords SET maintenance_rating = 0 WHERE maintenance_rating IS NULL;
UPDATE landlords SET communication_rating = 0 WHERE communication_rating IS NULL;
UPDATE landlords SET fairness_rating = 0 WHERE fairness_rating IS NULL;
UPDATE landlords SET professionalism_rating = 0 WHERE professionalism_rating IS NULL;
UPDATE landlords SET total_reviews = 0 WHERE total_reviews IS NULL;

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 4: Create indexes for performance
-- ════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_landlords_slug ON landlords(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_landlords_city_province ON landlords(city, province);
CREATE INDEX IF NOT EXISTS idx_landlords_overall_rating ON landlords(overall_rating DESC);
CREATE INDEX IF NOT EXISTS idx_landlords_total_reviews ON landlords(total_reviews DESC);
CREATE INDEX IF NOT EXISTS idx_landlords_created_at ON landlords(created_at DESC);

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 5: Create trigger to auto-update updated_at
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_landlord_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_landlords_updated_at ON landlords;
CREATE TRIGGER update_landlords_updated_at
  BEFORE UPDATE ON landlords
  FOR EACH ROW
  EXECUTE FUNCTION update_landlord_updated_at();

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 6: Verify the table structure
-- ════════════════════════════════════════════════════════════════════════════

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'landlords'
ORDER BY ordinal_position;

-- ════════════════════════════════════════════════════════════════════════════
-- ✅ DONE! The landlords table should now have all required columns
-- ════════════════════════════════════════════════════════════════════════════
-- Expected columns:
-- - id (UUID, PRIMARY KEY)
-- - name (TEXT, NOT NULL)
-- - slug (TEXT, UNIQUE)
-- - company_name (TEXT)
-- - email (TEXT)
-- - phone (TEXT)
-- - website (TEXT)
-- - city (TEXT, NOT NULL)
-- - province (TEXT, NOT NULL)
-- - country (TEXT, DEFAULT 'Canada') ⭐ THIS WAS MISSING
-- - description (TEXT)
-- - profile_image (TEXT)
-- - overall_rating (NUMERIC(3,2), DEFAULT 0)
-- - responsiveness_rating (NUMERIC(3,2), DEFAULT 0)
-- - maintenance_rating (NUMERIC(3,2), DEFAULT 0)
-- - communication_rating (NUMERIC(3,2), DEFAULT 0)
-- - fairness_rating (NUMERIC(3,2), DEFAULT 0)
-- - professionalism_rating (NUMERIC(3,2), DEFAULT 0)
-- - total_reviews (INTEGER, DEFAULT 0)
-- - created_at (TIMESTAMPTZ, DEFAULT NOW())
-- - updated_at (TIMESTAMPTZ, DEFAULT NOW())

