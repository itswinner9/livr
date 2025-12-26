-- Generate missing slugs for all entities to fix routing issues
-- Run this SQL to ensure all entities have proper slugs for SEO-friendly URLs

-- Function to create slugs (converts text to URL-friendly format)
CREATE OR REPLACE FUNCTION create_slug(input_text TEXT)
RETURNS TEXT AS $$
BEGIN
  RETURN LOWER(
    TRIM(
      REGEXP_REPLACE(
        REGEXP_REPLACE(
          REPLACE(REPLACE(REPLACE(input_text, ' ', '-'), '&', 'and'), '''', ''),
          '[^a-zA-Z0-9\-]', '', 'g'
        ),
        '-+', '-', 'g'
      ), 
      '-'
    )
  );
END;
$$ LANGUAGE plpgsql;

-- Update landlords without slugs
UPDATE landlords 
SET slug = create_slug(name) 
WHERE slug IS NULL OR slug = '';

-- Update neighborhoods without slugs  
UPDATE neighborhoods 
SET slug = create_slug(name || '-' || city || '-' || province)
WHERE slug IS NULL OR slug = '';

-- Update buildings without slugs
UPDATE buildings 
SET slug = create_slug(name || '-' || city || '-' || province)
WHERE slug IS NULL OR slug = '';

-- Update rent_companies without slugs
UPDATE rent_companies 
SET slug = create_slug(name || '-' || city || '-' || province)
WHERE slug IS NULL OR slug = '';

-- Ensure uniqueness by adding numbers to duplicates
DO $$
DECLARE
    rec RECORD;
    counter INTEGER;
    new_slug TEXT;
BEGIN
    -- Fix duplicate landlord slugs
    FOR rec IN 
        SELECT slug, ARRAY_AGG(id) as ids 
        FROM landlords 
        WHERE slug IS NOT NULL 
        GROUP BY slug 
        HAVING COUNT(*) > 1
    LOOP
        counter := 1;
        FOR i IN 2..ARRAY_LENGTH(rec.ids, 1) LOOP
            new_slug := rec.slug || '-' || counter;
            -- Ensure new slug is unique
            WHILE EXISTS (SELECT 1 FROM landlords WHERE slug = new_slug) LOOP
                counter := counter + 1;
                new_slug := rec.slug || '-' || counter;
            END LOOP;
            
            UPDATE landlords SET slug = new_slug WHERE id = rec.ids[i];
            counter := counter + 1;
        END LOOP;
    END LOOP;

    -- Fix duplicate neighborhood slugs
    FOR rec IN 
        SELECT slug, ARRAY_AGG(id) as ids 
        FROM neighborhoods 
        WHERE slug IS NOT NULL 
        GROUP BY slug 
        HAVING COUNT(*) > 1
    LOOP
        counter := 1;
        FOR i IN 2..ARRAY_LENGTH(rec.ids, 1) LOOP
            new_slug := rec.slug || '-' || counter;
            WHILE EXISTS (SELECT 1 FROM neighborhoods WHERE slug = new_slug) LOOP
                counter := counter + 1;
                new_slug := rec.slug || '-' || counter;
            END LOOP;
            
            UPDATE neighborhoods SET slug = new_slug WHERE id = rec.ids[i];
            counter := counter + 1;
        END LOOP;
    END LOOP;

    -- Fix duplicate building slugs
    FOR rec IN 
        SELECT slug, ARRAY_AGG(id) as ids 
        FROM buildings 
        WHERE slug IS NOT NULL 
        GROUP BY slug 
        HAVING COUNT(*) > 1
    LOOP
        counter := 1;
        FOR i IN 2..ARRAY_LENGTH(rec.ids, 1) LOOP
            new_slug := rec.slug || '-' || counter;
            WHILE EXISTS (SELECT 1 FROM buildings WHERE slug = new_slug) LOOP
                counter := counter + 1;
                new_slug := rec.slug || '-' || counter;
            END LOOP;
            
            UPDATE buildings SET slug = new_slug WHERE id = rec.ids[i];
            counter := counter + 1;
        END LOOP;
    END LOOP;

    -- Fix duplicate rent company slugs
    FOR rec IN 
        SELECT slug, ARRAY_AGG(id) as ids 
        FROM rent_companies 
        WHERE slug IS NOT NULL 
        GROUP BY slug 
        HAVING COUNT(*) > 1
    LOOP
        counter := 1;
        FOR i IN 2..ARRAY_LENGTH(rec.ids, 1) LOOP
            new_slug := rec.slug || '-' || counter;
            WHILE EXISTS (SELECT 1 FROM rent_companies WHERE slug = new_slug) LOOP
                counter := counter + 1;
                new_slug := rec.slug || '-' || counter;
            END LOOP;
            
            UPDATE rent_companies SET slug = new_slug WHERE id = rec.ids[i];
            counter := counter + 1;
        END LOOP;
    END LOOP;
END $$;

-- Verify results
SELECT 'landlords' as table_name, COUNT(*) as total, COUNT(slug) as with_slugs FROM landlords
UNION ALL
SELECT 'neighborhoods', COUNT(*), COUNT(slug) FROM neighborhoods  
UNION ALL
SELECT 'buildings', COUNT(*), COUNT(slug) FROM buildings
UNION ALL
SELECT 'rent_companies', COUNT(*), COUNT(slug) FROM rent_companies;

-- Show some example slugs
SELECT 'landlords' as type, name, slug FROM landlords WHERE slug IS NOT NULL LIMIT 5
UNION ALL
SELECT 'neighborhoods', name, slug FROM neighborhoods WHERE slug IS NOT NULL LIMIT 5
UNION ALL
SELECT 'buildings', name, slug FROM buildings WHERE slug IS NOT NULL LIMIT 5
UNION ALL  
SELECT 'rent_companies', name, slug FROM rent_companies WHERE slug IS NOT NULL LIMIT 5;
