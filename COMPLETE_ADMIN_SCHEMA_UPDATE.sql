-- Complete Admin Schema Update for LivRank
-- Run this to ensure all columns needed for admin management exist

-- ============================================
-- LANDLORDS TABLE UPDATES
-- ============================================

DO $$ 
BEGIN
  -- Add company_name
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlords' AND column_name = 'company_name'
  ) THEN
    ALTER TABLE landlords ADD COLUMN company_name TEXT;
    RAISE NOTICE 'Added company_name column';
  END IF;

  -- Add email
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlords' AND column_name = 'email'
  ) THEN
    ALTER TABLE landlords ADD COLUMN email TEXT;
    RAISE NOTICE 'Added email column';
  END IF;

  -- Add phone
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlords' AND column_name = 'phone'
  ) THEN
    ALTER TABLE landlords ADD COLUMN phone TEXT;
    RAISE NOTICE 'Added phone column';
  END IF;

  -- Add website
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlords' AND column_name = 'website'
  ) THEN
    ALTER TABLE landlords ADD COLUMN website TEXT;
    RAISE NOTICE 'Added website column';
  END IF;

  -- Add description
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlords' AND column_name = 'description'
  ) THEN
    ALTER TABLE landlords ADD COLUMN description TEXT;
    RAISE NOTICE 'Added description column';
  END IF;

  -- Add profile_image
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlords' AND column_name = 'profile_image'
  ) THEN
    ALTER TABLE landlords ADD COLUMN profile_image TEXT;
    RAISE NOTICE 'Added profile_image column';
  END IF;

  -- Add is_verified column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlords' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE landlords ADD COLUMN is_verified BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added is_verified column';
  END IF;

  -- Add rating columns for breakdown display
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlords' AND column_name = 'responsiveness_rating'
  ) THEN
    ALTER TABLE landlords ADD COLUMN responsiveness_rating DECIMAL(3,2) DEFAULT 0;
    RAISE NOTICE 'Added responsiveness_rating column';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlords' AND column_name = 'maintenance_rating'
  ) THEN
    ALTER TABLE landlords ADD COLUMN maintenance_rating DECIMAL(3,2) DEFAULT 0;
    RAISE NOTICE 'Added maintenance_rating column';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlords' AND column_name = 'communication_rating'
  ) THEN
    ALTER TABLE landlords ADD COLUMN communication_rating DECIMAL(3,2) DEFAULT 0;
    RAISE NOTICE 'Added communication_rating column';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlords' AND column_name = 'fairness_rating'
  ) THEN
    ALTER TABLE landlords ADD COLUMN fairness_rating DECIMAL(3,2) DEFAULT 0;
    RAISE NOTICE 'Added fairness_rating column';
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlords' AND column_name = 'professionalism_rating'
  ) THEN
    ALTER TABLE landlords ADD COLUMN professionalism_rating DECIMAL(3,2) DEFAULT 0;
    RAISE NOTICE 'Added professionalism_rating column';
  END IF;

  -- Add index for verification status
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'landlords' AND indexname = 'idx_landlords_is_verified'
  ) THEN
    CREATE INDEX idx_landlords_is_verified ON landlords(is_verified);
    RAISE NOTICE 'Added index for is_verified';
  END IF;
END $$;

-- ============================================
-- RENT_COMPANIES TABLE UPDATES
-- ============================================

DO $$ 
BEGIN
  -- Add is_verified column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'rent_companies' AND column_name = 'is_verified'
  ) THEN
    ALTER TABLE rent_companies ADD COLUMN is_verified BOOLEAN DEFAULT false;
    RAISE NOTICE 'Added is_verified column to rent_companies';
  END IF;

  -- Add index for verification status
  IF NOT EXISTS (
    SELECT 1 FROM pg_indexes 
    WHERE tablename = 'rent_companies' AND indexname = 'idx_rent_companies_is_verified'
  ) THEN
    CREATE INDEX idx_rent_companies_is_verified ON rent_companies(is_verified);
    RAISE NOTICE 'Added index for rent_companies is_verified';
  END IF;
END $$;

-- ============================================
-- LANDLORD_REVIEWS TABLE UPDATES
-- ============================================

DO $$ 
BEGIN
  -- Add title
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'title'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN title TEXT;
    RAISE NOTICE 'Added title column';
  END IF;

  -- Add review
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'review'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN review TEXT;
    RAISE NOTICE 'Added review column';
  END IF;

  -- Add communication
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'communication'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN communication INTEGER;
    RAISE NOTICE 'Added communication column';
  END IF;

  -- Add responsiveness
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'responsiveness'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN responsiveness INTEGER;
    RAISE NOTICE 'Added responsiveness column';
  END IF;

  -- Add maintenance
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'maintenance'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN maintenance INTEGER;
    RAISE NOTICE 'Added maintenance column';
  END IF;

  -- Add fairness
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'fairness'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN fairness INTEGER;
    RAISE NOTICE 'Added fairness column';
  END IF;

  -- Add professionalism
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'professionalism'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN professionalism INTEGER;
    RAISE NOTICE 'Added professionalism column';
  END IF;

  -- Add comment
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'comment'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN comment TEXT;
    RAISE NOTICE 'Added comment column';
  END IF;

  -- Add images
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'images'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN images TEXT[];
    RAISE NOTICE 'Added images column';
  END IF;

  -- Add status column (for admin approval)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'status'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN status TEXT DEFAULT 'pending';
    RAISE NOTICE 'Added status column';
  END IF;

  -- Add helpful_count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'helpful_count'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN helpful_count INTEGER DEFAULT 0;
    RAISE NOTICE 'Added helpful_count column';
  END IF;

  -- Add not_helpful_count
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'not_helpful_count'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN not_helpful_count INTEGER DEFAULT 0;
    RAISE NOTICE 'Added not_helpful_count column';
  END IF;

  -- Add updated_at
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column';
  END IF;
END $$;

-- ============================================
-- SUCCESS MESSAGES
-- ============================================

-- Show summary and success messages
DO $$
BEGIN
  RAISE NOTICE '✅ Admin schema update completed successfully!';
  RAISE NOTICE '📋 Admin management system is now ready to use!';
  RAISE NOTICE '🔐 All landlords and companies are unverified by default.';
  RAISE NOTICE '✅ Use the admin panel to verify them.';
END $$;

-- Show summary statistics
SELECT 
  'Landlords' as table_name,
  COUNT(*) as total_records,
  SUM(CASE WHEN is_verified = true THEN 1 ELSE 0 END) as verified_count,
  SUM(CASE WHEN is_verified = false OR is_verified IS NULL THEN 1 ELSE 0 END) as unverified_count
FROM landlords
UNION ALL
SELECT 
  'Rent Companies' as table_name,
  COUNT(*) as total_records,
  SUM(CASE WHEN is_verified = true THEN 1 ELSE 0 END) as verified_count,
  SUM(CASE WHEN is_verified = false OR is_verified IS NULL THEN 1 ELSE 0 END) as unverified_count
FROM rent_companies;

