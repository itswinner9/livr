-- Trigger to update landlord ratings when a review is approved
-- This ensures the rating breakdown on the landlord profile is always accurate

-- First, drop the trigger if it exists
DROP TRIGGER IF EXISTS update_landlord_ratings_trigger ON landlord_reviews;

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

-- Backfill: Update all existing landlords with current approved review averages
DO $$
DECLARE
  landlord_rec RECORD;
BEGIN
  FOR landlord_rec IN SELECT id FROM landlords LOOP
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
END $$;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Landlord ratings trigger created successfully!';
  RAISE NOTICE '📊 Landlord ratings will now update automatically when reviews are approved/rejected';
  RAISE NOTICE '🔄 All existing landlord ratings have been recalculated';
END $$;

