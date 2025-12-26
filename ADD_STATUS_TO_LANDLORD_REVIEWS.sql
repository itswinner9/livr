-- Add status column to landlord_reviews table if it doesn't exist

DO $$ 
BEGIN
  -- Add status column if it doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'landlord_reviews' AND column_name = 'status'
  ) THEN
    ALTER TABLE landlord_reviews ADD COLUMN status TEXT DEFAULT 'pending';
    RAISE NOTICE 'Added status column to landlord_reviews';
  END IF;

  -- Update all existing reviews to have 'approved' status
  UPDATE landlord_reviews 
  SET status = 'approved' 
  WHERE status IS NULL;
  
  RAISE NOTICE 'Updated existing reviews to approved status';
END $$;

-- Success message
SELECT '✅ Status column added to landlord_reviews table!' as status;
