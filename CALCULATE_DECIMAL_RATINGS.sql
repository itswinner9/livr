-- ============================================================================
-- CALCULATE DECIMAL RATINGS PROPERLY
-- ============================================================================

-- This will recalculate all category ratings with proper decimals

UPDATE neighborhoods
SET 
  safety_rating = ROUND(
    COALESCE((
      SELECT AVG(safety::NUMERIC)
      FROM neighborhood_reviews
      WHERE neighborhood_id = neighborhoods.id
        AND safety IS NOT NULL
        AND status = 'approved'
    ), 0)::NUMERIC,
    1
  ),
  noise_rating = ROUND(
    COALESCE((
      SELECT AVG(noise::NUMERIC)
      FROM neighborhood_reviews
      WHERE neighborhood_id = neighborhoods.id
        AND noise IS NOT NULL
        AND status = 'approved'
    ), 0)::NUMERIC,
    1
  ),
  transit_rating = ROUND(
    COALESCE((
      SELECT AVG(transit::NUMERIC)
      FROM neighborhood_reviews
      WHERE neighborhood_id = neighborhoods.id
        AND transit IS NOT NULL
        AND status = 'approved'
    ), 0)::NUMERIC,
    1
  ),
  amenities_rating = ROUND(
    COALESCE((
      SELECT AVG(amenities::NUMERIC)
      FROM neighborhood_reviews
      WHERE neighborhood_id = neighborhoods.id
        AND amenities IS NOT NULL
        AND status = 'approved'
    ), 0)::NUMERIC,
    1
  ),
  community_rating = ROUND(
    COALESCE((
      SELECT AVG(community::NUMERIC)
      FROM neighborhood_reviews
      WHERE neighborhood_id = neighborhoods.id
        AND community IS NOT NULL
        AND status = 'approved'
    ), 0)::NUMERIC,
    1
  ),
  overall_rating = ROUND(
    COALESCE((
      SELECT AVG(
        (safety + noise + transit + amenities + community) / 5.0
      )
      FROM neighborhood_reviews
      WHERE neighborhood_id = neighborhoods.id
        AND safety IS NOT NULL
        AND noise IS NOT NULL
        AND transit IS NOT NULL
        AND amenities IS NOT NULL
        AND community IS NOT NULL
        AND status = 'approved'
    ), 0)::NUMERIC,
    1
  ),
  updated_at = NOW()
WHERE id IN (
  SELECT DISTINCT neighborhood_id 
  FROM neighborhood_reviews 
  WHERE status = 'approved'
);

-- Show the results
SELECT 
  name,
  city,
  province,
  overall_rating,
  safety_rating,
  noise_rating,
  transit_rating,
  amenities_rating,
  community_rating,
  total_reviews
FROM neighborhoods
WHERE total_reviews > 0
ORDER BY overall_rating DESC;

-- Success message
SELECT '✅ All ratings recalculated with decimals!' as status;
