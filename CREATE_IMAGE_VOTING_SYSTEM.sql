-- Image Voting System
-- This allows users to like/dislike images in reviews

-- Create image_votes table
CREATE TABLE IF NOT EXISTS image_votes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  review_id UUID NOT NULL,
  image_url TEXT NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id),
  vote_type TEXT NOT NULL CHECK (vote_type IN ('like', 'dislike')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(review_id, image_url, user_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_image_votes_review ON image_votes(review_id);
CREATE INDEX IF NOT EXISTS idx_image_votes_user ON image_votes(user_id);
CREATE INDEX IF NOT EXISTS idx_image_votes_image_url ON image_votes(image_url);

-- Add helpful_count and not_helpful_count columns to review tables if they don't exist
ALTER TABLE IF EXISTS neighborhood_reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS neighborhood_reviews ADD COLUMN IF NOT EXISTS not_helpful_count INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS building_reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS building_reviews ADD COLUMN IF NOT EXISTS not_helpful_count INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS landlord_reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS landlord_reviews ADD COLUMN IF NOT EXISTS not_helpful_count INTEGER DEFAULT 0;

ALTER TABLE IF EXISTS rent_company_reviews ADD COLUMN IF NOT EXISTS helpful_count INTEGER DEFAULT 0;
ALTER TABLE IF EXISTS rent_company_reviews ADD COLUMN IF NOT EXISTS not_helpful_count INTEGER DEFAULT 0;

-- Disable RLS for now
ALTER TABLE image_votes DISABLE ROW LEVEL SECURITY;

-- Success message
SELECT '✅ Image voting system created successfully!' as status;
