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
