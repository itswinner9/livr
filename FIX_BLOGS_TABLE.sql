-- ════════════════════════════════════════════════════════════════════════════
-- 🔧 FIX BLOGS TABLE - Add missing columns and ensure proper structure
-- ════════════════════════════════════════════════════════════════════════════
-- Run this in Supabase SQL Editor to fix the blogs table

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 1: Ensure blogs table exists with all required columns
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
  featured_image TEXT, -- Added for compatibility
  author_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  views_count INTEGER DEFAULT 0
);

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 2: Add missing columns if they don't exist
-- ════════════════════════════════════════════════════════════════════════════

-- Add cover_image if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'blogs' AND column_name = 'cover_image') THEN
    ALTER TABLE blogs ADD COLUMN cover_image TEXT;
  END IF;
END $$;

-- Add cover_image_alt if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'blogs' AND column_name = 'cover_image_alt') THEN
    ALTER TABLE blogs ADD COLUMN cover_image_alt TEXT;
  END IF;
END $$;

-- Add featured_image if it doesn't exist (for API compatibility)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'blogs' AND column_name = 'featured_image') THEN
    ALTER TABLE blogs ADD COLUMN featured_image TEXT;
  END IF;
END $$;

-- Add meta_title if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'blogs' AND column_name = 'meta_title') THEN
    ALTER TABLE blogs ADD COLUMN meta_title TEXT;
  END IF;
END $$;

-- Add meta_description if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'blogs' AND column_name = 'meta_description') THEN
    ALTER TABLE blogs ADD COLUMN meta_description TEXT;
  END IF;
END $$;

-- Add excerpt if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'blogs' AND column_name = 'excerpt') THEN
    ALTER TABLE blogs ADD COLUMN excerpt TEXT;
  END IF;
END $$;

-- Add featured if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'blogs' AND column_name = 'featured') THEN
    ALTER TABLE blogs ADD COLUMN featured BOOLEAN DEFAULT false;
  END IF;
END $$;

-- Add published_at if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'blogs' AND column_name = 'published_at') THEN
    ALTER TABLE blogs ADD COLUMN published_at TIMESTAMPTZ;
  END IF;
END $$;

-- Add views_count if it doesn't exist
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'blogs' AND column_name = 'views_count') THEN
    ALTER TABLE blogs ADD COLUMN views_count INTEGER DEFAULT 0;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 3: Sync featured_image with cover_image for existing rows
-- ════════════════════════════════════════════════════════════════════════════
-- This ensures featured_image is populated from cover_image for existing blogs

UPDATE blogs 
SET featured_image = cover_image 
WHERE featured_image IS NULL AND cover_image IS NOT NULL;

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 4: Create indexes for performance
-- ════════════════════════════════════════════════════════════════════════════

CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(published_at DESC) WHERE published_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_blogs_featured ON blogs(featured) WHERE featured = true;
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);
CREATE INDEX IF NOT EXISTS idx_blogs_author ON blogs(author_id) WHERE author_id IS NOT NULL;

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 5: Create trigger to auto-update updated_at
-- ════════════════════════════════════════════════════════════════════════════

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

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 6: Create trigger to sync featured_image when cover_image is updated
-- ════════════════════════════════════════════════════════════════════════════
-- Optional: Keep featured_image in sync with cover_image

CREATE OR REPLACE FUNCTION sync_blog_featured_image()
RETURNS TRIGGER AS $$
BEGIN
  -- If cover_image is updated and featured_image is null or empty, sync it
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
-- STEP 7: Disable RLS or set up policies (if needed)
-- ════════════════════════════════════════════════════════════════════════════

-- Option 1: Disable RLS (for testing/simple setup)
ALTER TABLE blogs DISABLE ROW LEVEL SECURITY;

-- Option 2: Enable RLS with policies (uncomment if you want RLS)
/*
ALTER TABLE blogs ENABLE ROW LEVEL SECURITY;

-- Everyone can view published blogs
CREATE POLICY "Published blogs are viewable by everyone"
  ON blogs FOR SELECT
  USING (status = 'published');

-- Authors can view their own blogs
CREATE POLICY "Authors can view own blogs"
  ON blogs FOR SELECT
  USING (auth.uid() = author_id);

-- Admins can view all blogs
CREATE POLICY "Admins can view all blogs"
  ON blogs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only admins can insert blogs
CREATE POLICY "Admins can create blogs"
  ON blogs FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Authors and admins can update blogs
CREATE POLICY "Authors and admins can update blogs"
  ON blogs FOR UPDATE
  USING (
    auth.uid() = author_id OR
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only admins can delete blogs
CREATE POLICY "Admins can delete blogs"
  ON blogs FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );
*/

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 8: Verify the table structure
-- ════════════════════════════════════════════════════════════════════════════

SELECT 
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'blogs'
ORDER BY ordinal_position;

-- ════════════════════════════════════════════════════════════════════════════
-- ✅ DONE! The blogs table should now have all required columns
-- ════════════════════════════════════════════════════════════════════════════

