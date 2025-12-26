-- ============================================================================
-- FIX NULL RATINGS - Calculate overall_rating for neighborhoods
-- ============================================================================

-- This script will calculate the overall_rating from reviews for any
-- neighborhoods that currently have null or 0 ratings

UPDATE neighborhoods
SET 
  overall_rating = ROUND(COALESCE((
    SELECT AVG(overall_rating)::NUMERIC(3,2)
    FROM neighborhood_reviews
    WHERE neighborhood_reviews.neighborhood_id = neighborhoods.id
      AND status = 'approved'
      AND overall_rating IS NOT NULL
  ), 0)::NUMERIC, 1),
  safety_rating = ROUND(COALESCE((
    SELECT AVG(safety)::NUMERIC
    FROM neighborhood_reviews
    WHERE neighborhood_reviews.neighborhood_id = neighborhoods.id
      AND safety IS NOT NULL
      AND status = 'approved'
  ), 0)::NUMERIC, 1),
  noise_rating = ROUND(COALESCE((
    SELECT AVG(noise)::NUMERIC
    FROM neighborhood_reviews
    WHERE neighborhood_reviews.neighborhood_id = neighborhoods.id
      AND noise IS NOT NULL
      AND status = 'approved'
  ), 0)::NUMERIC, 1),
  transit_rating = ROUND(COALESCE((
    SELECT AVG(transit)::NUMERIC
    FROM neighborhood_reviews
    WHERE neighborhood_reviews.neighborhood_id = neighborhoods.id
      AND transit IS NOT NULL
      AND status = 'approved'
  ), 0)::NUMERIC, 1),
  amenities_rating = ROUND(COALESCE((
    SELECT AVG(amenities)::NUMERIC
    FROM neighborhood_reviews
    WHERE neighborhood_reviews.neighborhood_id = neighborhoods.id
      AND amenities IS NOT NULL
      AND status = 'approved'
  ), 0)::NUMERIC, 1),
  community_rating = ROUND(COALESCE((
    SELECT AVG(community)::NUMERIC
    FROM neighborhood_reviews
    WHERE neighborhood_reviews.neighborhood_id = neighborhoods.id
      AND community IS NOT NULL
      AND status = 'approved'
  ), 0)::NUMERIC, 1),
  total_reviews = (
    SELECT COUNT(*)
    FROM neighborhood_reviews
    WHERE neighborhood_reviews.neighborhood_id = neighborhoods.id
      AND status = 'approved'
  ),
  updated_at = NOW()
WHERE id IN (
  SELECT id FROM neighborhoods WHERE overall_rating IS NULL OR overall_rating = 0
);

-- Show results
SELECT 
  name, 
  city, 
  province,
  overall_rating, 
  total_reviews,
  safety_rating,
  noise_rating,
  transit_rating,
  amenities_rating,
  community_rating
FROM neighborhoods
WHERE total_reviews > 0
ORDER BY overall_rating DESC;

-- Success message
SELECT '✅ Ratings updated successfully!' as status;
