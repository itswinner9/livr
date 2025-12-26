-- ============================================================================
-- UPDATE TRIGGER TO CALCULATE DECIMAL RATINGS
-- ============================================================================

-- Drop and recreate the trigger function with proper decimal handling

DROP FUNCTION IF EXISTS update_neighborhood_ratings() CASCADE;

CREATE OR REPLACE FUNCTION update_neighborhood_ratings()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE neighborhoods
    SET
        overall_rating = ROUND(
            COALESCE((
                SELECT AVG(
                    (safety + noise + transit + amenities + community) / 5.0
                )
                FROM neighborhood_reviews
                WHERE neighborhood_id = COALESCE(NEW.neighborhood_id, OLD.neighborhood_id)
                    AND status = 'approved'
                    AND safety IS NOT NULL
                    AND noise IS NOT NULL
                    AND transit IS NOT NULL
                    AND amenities IS NOT NULL
                    AND community IS NOT NULL
            ), 0)::NUMERIC,
            1
        ),
        safety_rating = ROUND(
            COALESCE((
                SELECT AVG(safety::NUMERIC)
                FROM neighborhood_reviews
                WHERE neighborhood_id = COALESCE(NEW.neighborhood_id, OLD.neighborhood_id)
                    AND safety IS NOT NULL
                    AND status = 'approved'
            ), 0)::NUMERIC,
            1
        ),
        noise_rating = ROUND(
            COALESCE((
                SELECT AVG(noise::NUMERIC)
                FROM neighborhood_reviews
                WHERE neighborhood_id = COALESCE(NEW.neighborhood_id, OLD.neighborhood_id)
                    AND noise IS NOT NULL
                    AND status = 'approved'
            ), 0)::NUMERIC,
            1
        ),
        transit_rating = ROUND(
            COALESCE((
                SELECT AVG(transit::NUMERIC)
                FROM neighborhood_reviews
                WHERE neighborhood_id = COALESCE(NEW.neighborhood_id, OLD.neighborhood_id)
                    AND transit IS NOT NULL
                    AND status = 'approved'
            ), 0)::NUMERIC,
            1
        ),
        amenities_rating = ROUND(
            COALESCE((
                SELECT AVG(amenities::NUMERIC)
                FROM neighborhood_reviews
                WHERE neighborhood_id = COALESCE(NEW.neighborhood_id, OLD.neighborhood_id)
                    AND amenities IS NOT NULL
                    AND status = 'approved'
            ), 0)::NUMERIC,
            1
        ),
        community_rating = ROUND(
            COALESCE((
                SELECT AVG(community::NUMERIC)
                FROM neighborhood_reviews
                WHERE neighborhood_id = COALESCE(NEW.neighborhood_id, OLD.neighborhood_id)
                    AND community IS NOT NULL
                    AND status = 'approved'
            ), 0)::NUMERIC,
            1
        ),
        total_reviews = (
            SELECT COUNT(*)
            FROM neighborhood_reviews
            WHERE neighborhood_id = COALESCE(NEW.neighborhood_id, OLD.neighborhood_id)
                AND status = 'approved'
        ),
        updated_at = NOW()
    WHERE id = COALESCE(NEW.neighborhood_id, OLD.neighborhood_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Recreate the trigger
DROP TRIGGER IF EXISTS update_neighborhood_ratings_trigger ON neighborhood_reviews;

CREATE TRIGGER update_neighborhood_ratings_trigger
    AFTER INSERT OR UPDATE OR DELETE ON neighborhood_reviews
    FOR EACH ROW 
    EXECUTE FUNCTION update_neighborhood_ratings();

-- Now recalculate all ratings
UPDATE neighborhood_reviews 
SET updated_at = NOW() 
WHERE id IN (
    SELECT id FROM neighborhood_reviews LIMIT 1
);

-- Show results
SELECT 
  name,
  city,
  province,
  ROUND(overall_rating::NUMERIC, 1) as overall_rating,
  ROUND(safety_rating::NUMERIC, 1) as safety,
  ROUND(noise_rating::NUMERIC, 1) as noise,
  ROUND(transit_rating::NUMERIC, 1) as transit,
  ROUND(amenities_rating::NUMERIC, 1) as amenities,
  ROUND(community_rating::NUMERIC, 1) as community,
  total_reviews
FROM neighborhoods
WHERE total_reviews > 0
ORDER BY overall_rating DESC;

-- Success message
SELECT '✅ Trigger updated and ratings recalculated with decimals!' as status;
