-- Add slugs to landlords and rent_companies tables for SEO-friendly URLs

-- ============================================
-- STEP 1: Add slug column to landlords
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlords' AND column_name = 'slug'
  ) THEN
    ALTER TABLE landlords ADD COLUMN slug TEXT;
    RAISE NOTICE 'Added slug column to landlords table';
  END IF;
END $$;

-- ============================================
-- STEP 2: Add slug column to rent_companies
-- ============================================

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rent_companies' AND column_name = 'slug'
  ) THEN
    ALTER TABLE rent_companies ADD COLUMN slug TEXT;
    RAISE NOTICE 'Added slug column to rent_companies table';
  END IF;
END $$;

-- ============================================
-- STEP 3: Generate slugs for existing landlords
-- ============================================

DO $$
DECLARE
  landlord_rec RECORD;
  base_slug TEXT;
  final_slug TEXT;
  slug_exists BOOLEAN;
  counter INTEGER;
BEGIN
  FOR landlord_rec IN SELECT id, name FROM landlords WHERE slug IS NULL LOOP
    -- Generate base slug from name
    base_slug := LOWER(REGEXP_REPLACE(landlord_rec.name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := REGEXP_REPLACE(base_slug, '^-+|-+$', '', 'g');
    
    -- Check if slug already exists and make it unique
    final_slug := base_slug;
    counter := 0;
    slug_exists := TRUE;
    
    WHILE slug_exists LOOP
      SELECT EXISTS(SELECT 1 FROM landlords WHERE slug = final_slug AND id != landlord_rec.id) INTO slug_exists;
      
      IF slug_exists THEN
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
      END IF;
    END LOOP;
    
    -- Update landlord with slug
    UPDATE landlords SET slug = final_slug WHERE id = landlord_rec.id;
    
    RAISE NOTICE 'Generated slug for landlord %: %', landlord_rec.name, final_slug;
  END LOOP;
  
  RAISE NOTICE '✅ Generated slugs for all existing landlords';
END $$;

-- ============================================
-- STEP 4: Generate slugs for existing rent companies
-- ============================================

DO $$
DECLARE
  company_rec RECORD;
  base_slug TEXT;
  final_slug TEXT;
  slug_exists BOOLEAN;
  counter INTEGER;
BEGIN
  FOR company_rec IN SELECT id, name FROM rent_companies WHERE slug IS NULL LOOP
    -- Generate base slug from name
    base_slug := LOWER(REGEXP_REPLACE(company_rec.name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := REGEXP_REPLACE(base_slug, '^-+|-+$', '', 'g');
    
    -- Check if slug already exists and make it unique
    final_slug := base_slug;
    counter := 0;
    slug_exists := TRUE;
    
    WHILE slug_exists LOOP
      SELECT EXISTS(SELECT 1 FROM rent_companies WHERE slug = final_slug AND id != company_rec.id) INTO slug_exists;
      
      IF slug_exists THEN
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
      END IF;
    END LOOP;
    
    -- Update company with slug
    UPDATE rent_companies SET slug = final_slug WHERE id = company_rec.id;
    
    RAISE NOTICE 'Generated slug for company %: %', company_rec.name, final_slug;
  END LOOP;
  
  RAISE NOTICE '✅ Generated slugs for all existing rent companies';
END $$;

-- ============================================
-- STEP 5: Create function to auto-generate slugs on insert
-- ============================================

-- Function for landlords
CREATE OR REPLACE FUNCTION generate_landlord_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  slug_exists BOOLEAN;
  counter INTEGER;
BEGIN
  -- Only generate slug if not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Generate base slug from name
    base_slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := REGEXP_REPLACE(base_slug, '^-+|-+$', '', 'g');
    
    -- Ensure slug is unique
    final_slug := base_slug;
    counter := 0;
    slug_exists := TRUE;
    
    WHILE slug_exists LOOP
      SELECT EXISTS(SELECT 1 FROM landlords WHERE slug = final_slug AND id != NEW.id) INTO slug_exists;
      
      IF slug_exists THEN
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
      END IF;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function for rent companies
CREATE OR REPLACE FUNCTION generate_rent_company_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug TEXT;
  final_slug TEXT;
  slug_exists BOOLEAN;
  counter INTEGER;
BEGIN
  -- Only generate slug if not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    -- Generate base slug from name
    base_slug := LOWER(REGEXP_REPLACE(NEW.name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := REGEXP_REPLACE(base_slug, '^-+|-+$', '', 'g');
    
    -- Ensure slug is unique
    final_slug := base_slug;
    counter := 0;
    slug_exists := TRUE;
    
    WHILE slug_exists LOOP
      SELECT EXISTS(SELECT 1 FROM rent_companies WHERE slug = final_slug AND id != NEW.id) INTO slug_exists;
      
      IF slug_exists THEN
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
      END IF;
    END LOOP;
    
    NEW.slug := final_slug;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- STEP 6: Create triggers
-- ============================================

DROP TRIGGER IF EXISTS before_insert_landlord_slug ON landlords;
CREATE TRIGGER before_insert_landlord_slug
BEFORE INSERT OR UPDATE ON landlords
FOR EACH ROW
EXECUTE FUNCTION generate_landlord_slug();

DROP TRIGGER IF EXISTS before_insert_rent_company_slug ON rent_companies;
CREATE TRIGGER before_insert_rent_company_slug
BEFORE INSERT OR UPDATE ON rent_companies
FOR EACH ROW
EXECUTE FUNCTION generate_rent_company_slug();

-- ============================================
-- STEP 7: Create indexes for better performance
-- ============================================

CREATE INDEX IF NOT EXISTS idx_landlords_slug ON landlords(slug);
CREATE INDEX IF NOT EXISTS idx_rent_companies_slug ON rent_companies(slug);

-- Success messages
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ SLUG SYSTEM SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Added slug columns to landlords and rent_companies';
  RAISE NOTICE '✅ Generated slugs for all existing records';
  RAISE NOTICE '✅ Created auto-generate triggers';
  RAISE NOTICE '✅ Added indexes for performance';
  RAISE NOTICE '';
  RAISE NOTICE '🔗 URLs will now be SEO-friendly!';
  RAISE NOTICE '📊 Example: /landlord/john-smith';
  RAISE NOTICE '';
END $$;

