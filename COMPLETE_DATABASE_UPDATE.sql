-- ════════════════════════════════════════════════════════════════════════════
-- 🗄️ COMPLETE DATABASE UPDATE - All Tables with All Required Columns
-- ════════════════════════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor to ensure all tables have required columns
-- This script is safe to run multiple times - it checks for existing columns

-- ════════════════════════════════════════════════════════════════════════════
-- PART 1: LANDLORDS TABLE (Critical Fix - Country Column)
-- ════════════════════════════════════════════════════════════════════════════

-- Create landlords table if it doesn't exist
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

-- Add missing columns one by one
DO $$ 
BEGIN
  -- Add slug
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'slug') THEN
    ALTER TABLE landlords ADD COLUMN slug TEXT;
  END IF;
  
  -- Add company_name
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'company_name') THEN
    ALTER TABLE landlords ADD COLUMN company_name TEXT;
  END IF;
  
  -- Add email
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'email') THEN
    ALTER TABLE landlords ADD COLUMN email TEXT;
  END IF;
  
  -- Add phone
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'phone') THEN
    ALTER TABLE landlords ADD COLUMN phone TEXT;
  END IF;
  
  -- Add website
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'website') THEN
    ALTER TABLE landlords ADD COLUMN website TEXT;
  END IF;
  
  -- Add city
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'city') THEN
    ALTER TABLE landlords ADD COLUMN city TEXT NOT NULL DEFAULT '';
  END IF;
  
  -- Add province
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'province') THEN
    ALTER TABLE landlords ADD COLUMN province TEXT NOT NULL DEFAULT '';
  END IF;
  
  -- Add country (CRITICAL FIX - This was missing!)
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'country') THEN
    ALTER TABLE landlords ADD COLUMN country TEXT DEFAULT 'Canada';
  END IF;
  
  -- Add description
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'description') THEN
    ALTER TABLE landlords ADD COLUMN description TEXT;
  END IF;
  
  -- Add profile_image
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'profile_image') THEN
    ALTER TABLE landlords ADD COLUMN profile_image TEXT;
  END IF;
  
  -- Add rating columns
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'overall_rating') THEN
    ALTER TABLE landlords ADD COLUMN overall_rating NUMERIC(3, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'responsiveness_rating') THEN
    ALTER TABLE landlords ADD COLUMN responsiveness_rating NUMERIC(3, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'maintenance_rating') THEN
    ALTER TABLE landlords ADD COLUMN maintenance_rating NUMERIC(3, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'communication_rating') THEN
    ALTER TABLE landlords ADD COLUMN communication_rating NUMERIC(3, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'fairness_rating') THEN
    ALTER TABLE landlords ADD COLUMN fairness_rating NUMERIC(3, 2) DEFAULT 0;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'professionalism_rating') THEN
    ALTER TABLE landlords ADD COLUMN professionalism_rating NUMERIC(3, 2) DEFAULT 0;
  END IF;
  
  -- Add total_reviews
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'total_reviews') THEN
    ALTER TABLE landlords ADD COLUMN total_reviews INTEGER DEFAULT 0;
  END IF;
  
  -- Add timestamps
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'created_at') THEN
    ALTER TABLE landlords ADD COLUMN created_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlords' AND column_name = 'updated_at') THEN
    ALTER TABLE landlords ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
  END IF;
END $$;

-- Update existing rows with defaults
UPDATE landlords SET country = 'Canada' WHERE country IS NULL OR country = '';
UPDATE landlords SET overall_rating = 0 WHERE overall_rating IS NULL;
UPDATE landlords SET responsiveness_rating = 0 WHERE responsiveness_rating IS NULL;
UPDATE landlords SET maintenance_rating = 0 WHERE maintenance_rating IS NULL;
UPDATE landlords SET communication_rating = 0 WHERE communication_rating IS NULL;
UPDATE landlords SET fairness_rating = 0 WHERE fairness_rating IS NULL;
UPDATE landlords SET professionalism_rating = 0 WHERE professionalism_rating IS NULL;
UPDATE landlords SET total_reviews = 0 WHERE total_reviews IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_landlords_slug ON landlords(slug) WHERE slug IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_landlords_city_province ON landlords(city, province);
CREATE INDEX IF NOT EXISTS idx_landlords_overall_rating ON landlords(overall_rating DESC);
CREATE INDEX IF NOT EXISTS idx_landlords_total_reviews ON landlords(total_reviews DESC);
CREATE INDEX IF NOT EXISTS idx_landlords_created_at ON landlords(created_at DESC);

-- ════════════════════════════════════════════════════════════════════════════
-- PART 2: BLOGS TABLE
-- ════════════════════════════════════════════════════════════════════════════

-- Create blogs table if it doesn't exist
CREATE TABLE IF NOT EXISTS blogs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  meta_title TEXT,
  meta_description TEXT,
  excerpt TEXT,
  content TEXT NOT NULL,
  cover_image TEXT,
  cover_image_alt TEXT,
  featured_image TEXT,
  author_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  views_count INTEGER DEFAULT 0
);

-- Add missing blog columns
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'blogs' AND column_name = 'cover_image') THEN
    ALTER TABLE blogs ADD COLUMN cover_image TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'blogs' AND column_name = 'cover_image_alt') THEN
    ALTER TABLE blogs ADD COLUMN cover_image_alt TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'blogs' AND column_name = 'featured_image') THEN
    ALTER TABLE blogs ADD COLUMN featured_image TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'blogs' AND column_name = 'meta_title') THEN
    ALTER TABLE blogs ADD COLUMN meta_title TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'blogs' AND column_name = 'meta_description') THEN
    ALTER TABLE blogs ADD COLUMN meta_description TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'blogs' AND column_name = 'excerpt') THEN
    ALTER TABLE blogs ADD COLUMN excerpt TEXT;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'blogs' AND column_name = 'featured') THEN
    ALTER TABLE blogs ADD COLUMN featured BOOLEAN DEFAULT false;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'blogs' AND column_name = 'published_at') THEN
    ALTER TABLE blogs ADD COLUMN published_at TIMESTAMPTZ;
  END IF;
  
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'blogs' AND column_name = 'views_count') THEN
    ALTER TABLE blogs ADD COLUMN views_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- Sync featured_image with cover_image for existing rows
UPDATE blogs 
SET featured_image = cover_image 
WHERE featured_image IS NULL AND cover_image IS NOT NULL;

-- Create blog indexes
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blogs_featured ON blogs(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_author ON blogs(author_id) WHERE author_id IS NOT NULL;

-- ════════════════════════════════════════════════════════════════════════════
-- PART 3: TRIGGERS FOR AUTO-UPDATES
-- ════════════════════════════════════════════════════════════════════════════

-- Update landlord updated_at trigger
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

-- Update blog updated_at trigger
CREATE OR REPLACE FUNCTION update_blog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_blogs_updated_at ON blogs;
CREATE TRIGGER update_blogs_updated_at
  BEFORE UPDATE ON blogs
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_updated_at();

-- Sync blog featured_image when cover_image is updated
CREATE OR REPLACE FUNCTION sync_blog_featured_image()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.cover_image IS NOT NULL AND (NEW.featured_image IS NULL OR NEW.featured_image = '') THEN
    NEW.featured_image = NEW.cover_image;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS sync_blog_featured_image_trigger ON blogs;
CREATE TRIGGER sync_blog_featured_image_trigger
  BEFORE INSERT OR UPDATE ON blogs
  FOR EACH ROW
  EXECUTE FUNCTION sync_blog_featured_image();

-- ════════════════════════════════════════════════════════════════════════════
-- PART 4: VERIFY TABLES (Optional - Run this to check structure)
-- ════════════════════════════════════════════════════════════════════════════

-- Uncomment to verify table structures:
/*
SELECT 
  'landlords' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'landlords'
ORDER BY ordinal_position;

SELECT 
  'blogs' as table_name,
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'blogs'
ORDER BY ordinal_position;
*/

-- ════════════════════════════════════════════════════════════════════════════
-- ✅ DONE! All tables updated
-- ════════════════════════════════════════════════════════════════════════════
-- 
-- LANDLORDS TABLE now includes:
-- - id, name, slug, company_name, email, phone, website
-- - city, province, country (⭐ FIXED - was missing)
-- - description, profile_image
-- - overall_rating, responsiveness_rating, maintenance_rating
-- - communication_rating, fairness_rating, professionalism_rating
-- - total_reviews, created_at, updated_at
--
-- BLOGS TABLE now includes:
-- - id, slug, title, meta_title, meta_description, excerpt, content
-- - cover_image, cover_image_alt, featured_image
-- - author_id, status, featured, published_at
-- - created_at, updated_at, views_count
--
-- All triggers and indexes are created/updated.

