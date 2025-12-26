-- ════════════════════════════════════════════════════════════════════════════
-- 📝 LIVRANK BLOG SYSTEM
-- ════════════════════════════════════════════════════════════════════════════
-- Complete blog system with admin management, SEO, and interlinking

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 1: Create blogs table
-- ════════════════════════════════════════════════════════════════════════════

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
  author_id UUID REFERENCES user_profiles(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
  featured BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  views_count INTEGER DEFAULT 0
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_blogs_status ON blogs(status);
CREATE INDEX IF NOT EXISTS idx_blogs_published ON blogs(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_blogs_featured ON blogs(featured);
CREATE INDEX IF NOT EXISTS idx_blogs_slug ON blogs(slug);

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 2: Create blog_categories table
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create junction table for blogs and categories
CREATE TABLE IF NOT EXISTS blog_category_relations (
  blog_id UUID REFERENCES blogs(id) ON DELETE CASCADE,
  category_id UUID REFERENCES blog_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_id, category_id)
);

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 3: Create blog_links table for interlinking
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS blog_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_id UUID REFERENCES blogs(id) ON DELETE CASCADE,
  link_type TEXT NOT NULL CHECK (link_type IN ('neighborhood', 'building', 'landlord', 'rent_company', 'blog')),
  linked_id UUID NOT NULL,
  link_text TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_blog_links_blog ON blog_links(blog_id);

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 4: Create blog_tags table
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS blog_tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT UNIQUE NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS blog_tag_relations (
  blog_id UUID REFERENCES blogs(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES blog_tags(id) ON DELETE CASCADE,
  PRIMARY KEY (blog_id, tag_id)
);

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 5: Function to generate slug
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION generate_blog_slug(title_text TEXT)
RETURNS TEXT AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  counter INTEGER := 0;
BEGIN
  -- Convert to lowercase and replace spaces/spacial chars
  base_slug := lower(trim(title_text));
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  base_slug := trim(both '-' from base_slug);
  
  -- Check if slug exists and add number if needed
  final_slug := base_slug;
  WHILE EXISTS(SELECT 1 FROM blogs WHERE slug = final_slug) LOOP
    counter := counter + 1;
    final_slug := base_slug || '-' || counter::TEXT;
  END LOOP;
  
  RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 6: Trigger to auto-update updated_at
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_blog_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_blogs_updated_at
  BEFORE UPDATE ON blogs
  FOR EACH ROW
  EXECUTE FUNCTION update_blog_updated_at();

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 7: Insert default categories
-- ════════════════════════════════════════════════════════════════════════════

INSERT INTO blog_categories (name, slug, description) VALUES
('Neighborhood Guides', 'neighborhood-guides', 'Comprehensive guides to neighborhoods across Canada'),
('Renter Tips', 'renter-tips', 'Tips and advice for renters'),
('Landlord Reviews', 'landlord-reviews', 'Insights about landlords and property management'),
('Market Trends', 'market-trends', 'Housing market analysis and trends'),
('Legal & Rights', 'legal-rights', 'Renter rights and legal information'),
('Moving Guides', 'moving-guides', 'Helpful guides for moving and relocating')
ON CONFLICT (slug) DO NOTHING;

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 8: RLS Policies for blogs
-- ════════════════════════════════════════════════════════════════════════════

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

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 9: RLS for blog_categories
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE blog_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Categories are viewable by everyone"
  ON blog_categories FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage categories"
  ON blog_categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 10: RLS for blog_category_relations
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE blog_category_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Category relations are viewable by everyone"
  ON blog_category_relations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage category relations"
  ON blog_category_relations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 11: RLS for blog_links
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE blog_links ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blog links are viewable by everyone"
  ON blog_links FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage blog links"
  ON blog_links FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 12: RLS for blog_tags
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE blog_tags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tags are viewable by everyone"
  ON blog_tags FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage tags"
  ON blog_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 13: RLS for blog_tag_relations
-- ════════════════════════════════════════════════════════════════════════════

ALTER TABLE blog_tag_relations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Tag relations are viewable by everyone"
  ON blog_tag_relations FOR SELECT
  USING (true);

CREATE POLICY "Admins can manage tag relations"
  ON blog_tag_relations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ════════════════════════════════════════════════════════════════════════════
-- ✅ BLOG SYSTEM COMPLETE!
-- ════════════════════════════════════════════════════════════════════════════
-- Tables created:
-- • blogs - Main blog posts
-- • blog_categories - Categories
-- • blog_category_relations - Many-to-many
-- • blog_links - Links to neighborhoods, buildings, etc.
-- • blog_tags - Tags
-- • blog_tag_relations - Many-to-many
-- 
-- Features:
-- • SEO meta title & description
-- • Cover images with alt text
-- • Slug generation
-- • Draft/Published/Archived status
-- • Featured posts
-- • Views count
-- • Author tracking
-- • Admin-only management
-- • Public access to published posts
-- ════════════════════════════════════════════════════════════════════════════



