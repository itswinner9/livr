-- Complete setup for landlord rating system
-- This file adds all missing columns AND creates the trigger
-- Run this once to set everything up

-- ============================================
-- STEP 1: Add missing rating columns to landlords table
-- ============================================

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

-- ============================================
-- STEP 2: Create trigger to auto-update ratings
-- ============================================

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_landlord_ratings_trigger ON landlord_reviews;

-- Drop existing function if it exists
DROP FUNCTION IF EXISTS update_landlord_ratings();

-- Create or replace the function that calculates and updates landlord ratings
CREATE OR REPLACE FUNCTION update_landlord_ratings()
RETURNS TRIGGER AS $$
DECLARE
  avg_rating DECIMAL;
  avg_responsiveness DECIMAL;
  avg_maintenance DECIMAL;
  avg_communication DECIMAL;
  avg_fairness DECIMAL;
  avg_professionalism DECIMAL;
  total_count INTEGER;
BEGIN
  -- Calculate averages from APPROVED reviews only
  SELECT 
    AVG(overall_rating)::DECIMAL,
    AVG(responsiveness)::DECIMAL,
    AVG(maintenance)::DECIMAL,
    AVG(communication)::DECIMAL,
    AVG(fairness)::DECIMAL,
    AVG(professionalism)::DECIMAL,
    COUNT(*)
  INTO 
    avg_rating, 
    avg_responsiveness, 
    avg_maintenance, 
    avg_communication, 
    avg_fairness, 
    avg_professionalism,
    total_count
  FROM landlord_reviews
  WHERE landlord_id = COALESCE(NEW.landlord_id, OLD.landlord_id)
    AND status = 'approved';

  -- Update the landlord record with the calculated averages
  UPDATE landlords
  SET 
    overall_rating = COALESCE(avg_rating, 0),
    responsiveness_rating = COALESCE(avg_responsiveness, 0),
    maintenance_rating = COALESCE(avg_maintenance, 0),
    communication_rating = COALESCE(avg_communication, 0),
    fairness_rating = COALESCE(avg_fairness, 0),
    professionalism_rating = COALESCE(avg_professionalism, 0),
    total_reviews = COALESCE(total_count, 0),
    updated_at = NOW()
  WHERE id = COALESCE(NEW.landlord_id, OLD.landlord_id);

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Create the trigger that fires on INSERT, UPDATE, or DELETE
CREATE TRIGGER update_landlord_ratings_trigger
AFTER INSERT OR UPDATE OR DELETE ON landlord_reviews
FOR EACH ROW
EXECUTE FUNCTION update_landlord_ratings();

-- ============================================
-- STEP 3: Backfill existing landlord ratings
-- ============================================

DO $$
DECLARE
  landlord_rec RECORD;
BEGIN
  FOR landlord_rec IN SELECT id FROM landlords LOOP
    -- Calculate averages for this landlord
    EXECUTE '
      UPDATE landlords SET
        overall_rating = COALESCE((
          SELECT AVG(overall_rating)::DECIMAL 
          FROM landlord_reviews 
          WHERE landlord_id = $1 AND status = ''approved''
        ), 0),
        responsiveness_rating = COALESCE((
          SELECT AVG(responsiveness)::DECIMAL 
          FROM landlord_reviews 
          WHERE landlord_id = $1 AND status = ''approved''
        ), 0),
        maintenance_rating = COALESCE((
          SELECT AVG(maintenance)::DECIMAL 
          FROM landlord_reviews 
          WHERE landlord_id = $1 AND status = ''approved''
        ), 0),
        communication_rating = COALESCE((
          SELECT AVG(communication)::DECIMAL 
          FROM landlord_reviews 
          WHERE landlord_id = $1 AND status = ''approved''
        ), 0),
        fairness_rating = COALESCE((
          SELECT AVG(fairness)::DECIMAL 
          FROM landlord_reviews 
          WHERE landlord_id = $1 AND status = ''approved''
        ), 0),
        professionalism_rating = COALESCE((
          SELECT AVG(professionalism)::DECIMAL 
          FROM landlord_reviews 
          WHERE landlord_id = $1 AND status = ''approved''
        ), 0),
        total_reviews = (
          SELECT COUNT(*)::INTEGER 
          FROM landlord_reviews 
          WHERE landlord_id = $1 AND status = ''approved''
        ),
        updated_at = NOW()
      WHERE id = $1
    ' USING landlord_rec.id;
  END LOOP;
  
  RAISE NOTICE '✅ All existing landlord ratings have been calculated';
END $$;

-- Success messages
DO $$
BEGIN
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ LANDLORD RATING SYSTEM SETUP COMPLETE!';
  RAISE NOTICE '========================================';
  RAISE NOTICE '✅ Rating columns added to landlords table';
  RAISE NOTICE '✅ Auto-update trigger created';
  RAISE NOTICE '✅ All existing ratings calculated';
  RAISE NOTICE '';
  RAISE NOTICE '📊 Landlord rating breakdowns will now display correctly!';
  RAISE NOTICE '🔄 Ratings will auto-update when reviews are approved/rejected';
  RAISE NOTICE '';
END $$;

