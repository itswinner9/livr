-- Add rating columns to landlords table for breakdown display
-- This ensures the rating breakdown on landlord profiles works correctly

DO $$ 
BEGIN
  -- Add responsiveness_rating
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlords' AND column_name = 'responsiveness_rating'
  ) THEN
    ALTER TABLE landlords ADD COLUMN responsiveness_rating DECIMAL(3,2) DEFAULT 0;
    RAISE NOTICE 'Added responsiveness_rating column';
  END IF;

  -- Add maintenance_rating
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlords' AND column_name = 'maintenance_rating'
  ) THEN
    ALTER TABLE landlords ADD COLUMN maintenance_rating DECIMAL(3,2) DEFAULT 0;
    RAISE NOTICE 'Added maintenance_rating column';
  END IF;

  -- Add communication_rating
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlords' AND column_name = 'communication_rating'
  ) THEN
    ALTER TABLE landlords ADD COLUMN communication_rating DECIMAL(3,2) DEFAULT 0;
    RAISE NOTICE 'Added communication_rating column';
  END IF;

  -- Add fairness_rating
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlords' AND column_name = 'fairness_rating'
  ) THEN
    ALTER TABLE landlords ADD COLUMN fairness_rating DECIMAL(3,2) DEFAULT 0;
    RAISE NOTICE 'Added fairness_rating column';
  END IF;

  -- Add professionalism_rating
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlords' AND column_name = 'professionalism_rating'
  ) THEN
    ALTER TABLE landlords ADD COLUMN professionalism_rating DECIMAL(3,2) DEFAULT 0;
    RAISE NOTICE 'Added professionalism_rating column';
  END IF;

  RAISE NOTICE '✅ All rating columns added successfully!';
END $$;

-- Success message
SELECT '✅ Landlord rating columns added successfully!' as status;

