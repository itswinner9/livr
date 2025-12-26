-- Fix Landlords Table - Add Missing Columns

-- Add all missing columns to landlords table
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

  -- Add profile_image if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlords' AND column_name = 'profile_image'
  ) THEN
    ALTER TABLE landlords ADD COLUMN profile_image TEXT;
    RAISE NOTICE 'Added profile_image column';
  END IF;
END $$;

-- Success message
SELECT '✅ Landlords table schema updated with all required columns!' as status;

-- Fix Landlord Reviews Table - Add Missing Columns

-- Add all missing columns to landlord_reviews table
DO $$ 
BEGIN
  -- Add title column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'title'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN title TEXT;
    RAISE NOTICE 'Added title column';
  END IF;

  -- Add review column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'review'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN review TEXT;
    RAISE NOTICE 'Added review column';
  END IF;

  -- Add communication column (was causing the error)
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'communication'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN communication INTEGER;
    RAISE NOTICE 'Added communication column';
  END IF;

  -- Add responsiveness column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'responsiveness'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN responsiveness INTEGER;
    RAISE NOTICE 'Added responsiveness column';
  END IF;

  -- Add maintenance column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'maintenance'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN maintenance INTEGER;
    RAISE NOTICE 'Added maintenance column';
  END IF;

  -- Add fairness column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'fairness'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN fairness INTEGER;
    RAISE NOTICE 'Added fairness column';
  END IF;

  -- Add professionalism column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'professionalism'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN professionalism INTEGER;
    RAISE NOTICE 'Added professionalism column';
  END IF;

  -- Add comment column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'comment'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN comment TEXT;
    RAISE NOTICE 'Added comment column';
  END IF;

  -- Add images column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'images'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN images TEXT[];
    RAISE NOTICE 'Added images column';
  END IF;

  -- Add helpful_count column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'helpful_count'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN helpful_count INTEGER DEFAULT 0;
    RAISE NOTICE 'Added helpful_count column';
  END IF;

  -- Add not_helpful_count column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'not_helpful_count'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN not_helpful_count INTEGER DEFAULT 0;
    RAISE NOTICE 'Added not_helpful_count column';
  END IF;

  -- Add updated_at column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'updated_at'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();
    RAISE NOTICE 'Added updated_at column';
  END IF;
END $$;

-- Success message
SELECT '✅ Landlord reviews table schema updated with all required columns!' as status;
