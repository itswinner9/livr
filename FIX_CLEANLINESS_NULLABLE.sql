-- ════════════════════════════════════════════════════════════════════════════
-- 🔧 FIX CLEANLINESS COLUMN - Make it nullable
-- ════════════════════════════════════════════════════════════════════════════
-- The cleanliness column has a NOT NULL constraint but the code doesn't
-- provide this value. This script makes it nullable.
-- ════════════════════════════════════════════════════════════════════════════

-- Step 1: Add cleanliness column if it doesn't exist (nullable)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'neighborhood_reviews' AND column_name = 'cleanliness'
  ) THEN
    ALTER TABLE neighborhood_reviews 
    ADD COLUMN cleanliness NUMERIC(3, 2) CHECK (cleanliness BETWEEN 1 AND 5);
    RAISE NOTICE 'Added cleanliness column (nullable)';
  END IF;
END $$;

-- Step 2: Drop NOT NULL constraint if it exists
DO $$
BEGIN
  -- Check if column exists and has NOT NULL constraint
  IF EXISTS (
    SELECT 1 
    FROM information_schema.columns 
    WHERE table_name = 'neighborhood_reviews' 
      AND column_name = 'cleanliness'
      AND is_nullable = 'NO'
  ) THEN
    ALTER TABLE neighborhood_reviews 
    ALTER COLUMN cleanliness DROP NOT NULL;
    RAISE NOTICE 'Removed NOT NULL constraint from cleanliness column';
  ELSE
    RAISE NOTICE 'cleanliness column is already nullable';
  END IF;
END $$;

-- Step 3: Update any NULL values in existing rows (optional, for data consistency)
-- This is not necessary but helps with data integrity
UPDATE neighborhood_reviews 
SET cleanliness = NULL 
WHERE cleanliness IS NULL;
-- This is a no-op but ensures consistency

SELECT '✅ Cleanliness column is now nullable in neighborhood_reviews table!' as status;

