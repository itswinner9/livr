-- Add is_verified column to landlords table
ALTER TABLE landlords 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Add is_verified column to rent_companies table
ALTER TABLE rent_companies 
ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;

-- Update existing records to set is_verified to false by default
UPDATE landlords SET is_verified = false WHERE is_verified IS NULL;
UPDATE rent_companies SET is_verified = false WHERE is_verified IS NULL;

-- Add index for better query performance when filtering by verification status
CREATE INDEX IF NOT EXISTS idx_landlords_is_verified ON landlords(is_verified);
CREATE INDEX IF NOT EXISTS idx_rent_companies_is_verified ON rent_companies(is_verified);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Verification columns added successfully!';
  RAISE NOTICE '📋 All landlords and companies are now unverified by default.';
  RAISE NOTICE '🔐 Use the admin panel to verify landlords and companies.';
END $$;

