-- ════════════════════════════════════════════════════════════════════════════
-- 🏆 VERIFIED TENANT SYSTEM
-- ════════════════════════════════════════════════════════════════════════════
-- Complete verified tenant system with lease verification, badges, and photo moderation

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 1: Add verified tenant status to user_profiles
-- ════════════════════════════════════════════════════════════════════════════

-- Add is_verified_tenant column
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'user_profiles' AND column_name = 'is_verified_tenant') THEN
    ALTER TABLE user_profiles ADD COLUMN is_verified_tenant BOOLEAN DEFAULT false;
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 2: Create verification_requests table
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS verification_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  review_id UUID, -- Optional: link to specific review
  review_type TEXT CHECK (review_type IN ('landlord', 'building', 'neighborhood')), -- Type of review
  document_url TEXT NOT NULL, -- Path to lease document in storage
  document_type TEXT DEFAULT 'lease', -- lease, proof_of_residence, etc.
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'request_more_info')),
  rejection_reason TEXT, -- Reason if rejected
  admin_notes TEXT, -- Admin internal notes
  reviewed_by UUID REFERENCES auth.users(id), -- Admin who reviewed
  reviewed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_verification_requests_user_id ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_requests_status ON verification_requests(status);
CREATE INDEX IF NOT EXISTS idx_verification_requests_review_id ON verification_requests(review_id);

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 3: Add verification_request_id to review tables
-- ════════════════════════════════════════════════════════════════════════════

-- Landlord reviews
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'landlord_reviews' AND column_name = 'verification_request_id') THEN
    ALTER TABLE landlord_reviews ADD COLUMN verification_request_id UUID REFERENCES verification_requests(id);
  END IF;
END $$;

-- Building reviews
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'building_reviews' AND column_name = 'verification_request_id') THEN
    ALTER TABLE building_reviews ADD COLUMN verification_request_id UUID REFERENCES verification_requests(id);
  END IF;
END $$;

-- Neighborhood reviews
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns 
                 WHERE table_name = 'neighborhood_reviews' AND column_name = 'verification_request_id') THEN
    ALTER TABLE neighborhood_reviews ADD COLUMN verification_request_id UUID REFERENCES verification_requests(id);
  END IF;
END $$;

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 4: Create photo_reports table for photo moderation
-- ════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS photo_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  photo_url TEXT NOT NULL, -- URL of reported photo
  review_id UUID NOT NULL, -- Which review the photo belongs to
  review_type TEXT NOT NULL CHECK (review_type IN ('landlord', 'building', 'neighborhood')),
  reported_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  reason TEXT NOT NULL, -- Inappropriate, spam, fake, etc.
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'resolved', 'dismissed')),
  resolved_by UUID REFERENCES auth.users(id), -- Admin who resolved
  resolved_at TIMESTAMPTZ,
  resolution_action TEXT, -- deleted, flagged, dismissed
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_photo_reports_status ON photo_reports(status);
CREATE INDEX IF NOT EXISTS idx_photo_reports_review_id ON photo_reports(review_id);

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 5: Create function to mark user as verified when approved
-- ════════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION mark_user_verified()
RETURNS TRIGGER AS $$
BEGIN
  -- When a verification request is approved, mark user as verified
  IF NEW.status = 'approved' AND (OLD.status IS NULL OR OLD.status != 'approved') THEN
    UPDATE user_profiles
    SET is_verified_tenant = true
    WHERE id = NEW.user_id;
  END IF;
  
  -- If rejected, don't change verification status (user can reapply)
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_mark_user_verified ON verification_requests;
CREATE TRIGGER trigger_mark_user_verified
  AFTER UPDATE ON verification_requests
  FOR EACH ROW
  EXECUTE FUNCTION mark_user_verified();

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 6: Enable RLS policies
-- ════════════════════════════════════════════════════════════════════════════

-- Enable RLS
ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE photo_reports ENABLE ROW LEVEL SECURITY;

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 7: RLS Policies for verification_requests
-- ════════════════════════════════════════════════════════════════════════════

-- Users can view their own verification requests
DROP POLICY IF EXISTS "Users can view own verification requests" ON verification_requests;
CREATE POLICY "Users can view own verification requests"
  ON verification_requests FOR SELECT
  USING (auth.uid() = user_id);

-- Users can create verification requests
DROP POLICY IF EXISTS "Users can create verification requests" ON verification_requests;
CREATE POLICY "Users can create verification requests"
  ON verification_requests FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own pending requests (to upload new document)
DROP POLICY IF EXISTS "Users can update own pending requests" ON verification_requests;
CREATE POLICY "Users can update own pending requests"
  ON verification_requests FOR UPDATE
  USING (auth.uid() = user_id AND status = 'pending')
  WITH CHECK (auth.uid() = user_id AND status = 'pending');

-- Admins can view all verification requests
DROP POLICY IF EXISTS "Admins can view all verification requests" ON verification_requests;
CREATE POLICY "Admins can view all verification requests"
  ON verification_requests FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can update all verification requests
DROP POLICY IF EXISTS "Admins can update all verification requests" ON verification_requests;
CREATE POLICY "Admins can update all verification requests"
  ON verification_requests FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 8: RLS Policies for photo_reports
-- ════════════════════════════════════════════════════════════════════════════

-- Users can create photo reports
DROP POLICY IF EXISTS "Users can report photos" ON photo_reports;
CREATE POLICY "Users can report photos"
  ON photo_reports FOR INSERT
  WITH CHECK (auth.uid() = reported_by);

-- Users can view their own reports
DROP POLICY IF EXISTS "Users can view own reports" ON photo_reports;
CREATE POLICY "Users can view own reports"
  ON photo_reports FOR SELECT
  USING (auth.uid() = reported_by);

-- Admins can view all reports
DROP POLICY IF EXISTS "Admins can view all photo reports" ON photo_reports;
CREATE POLICY "Admins can view all photo reports"
  ON photo_reports FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Admins can update all reports
DROP POLICY IF EXISTS "Admins can update all photo reports" ON photo_reports;
CREATE POLICY "Admins can update all photo reports"
  ON photo_reports FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 9: Create storage bucket for verification documents
-- ════════════════════════════════════════════════════════════════════════════

-- Note: Storage buckets must be created via Supabase Dashboard or API
-- This is a reminder comment

-- Bucket name: verification-documents
-- Settings:
--   - Private (not public - sensitive documents)
--   - File size limit: 10MB
--   - Allowed types: PDF, JPG, PNG, HEIC

-- ════════════════════════════════════════════════════════════════════════════
-- STEP 10: Create storage policies for verification documents
-- ════════════════════════════════════════════════════════════════════════════

-- Note: Storage policies are set via Supabase Dashboard
-- Policies needed:
--   1. Users can upload their own documents
--   2. Users can read their own documents
--   3. Admins can read all documents

-- Example policies (run in Supabase Dashboard SQL Editor for storage):

-- Allow users to upload their own documents
-- CREATE POLICY "Users can upload own verification documents"
-- ON storage.objects FOR INSERT
-- WITH CHECK (
--   bucket_id = 'verification-documents' AND
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- Allow users to read their own documents
-- CREATE POLICY "Users can read own verification documents"
-- ON storage.objects FOR SELECT
-- USING (
--   bucket_id = 'verification-documents' AND
--   auth.uid()::text = (storage.foldername(name))[1]
-- );

-- Allow admins to read all documents
-- CREATE POLICY "Admins can read all verification documents"
-- ON storage.objects FOR SELECT
-- USING (
--   bucket_id = 'verification-documents' AND
--   EXISTS (
--     SELECT 1 FROM user_profiles 
--     WHERE id = auth.uid() AND is_admin = true
--   )
-- );

-- ════════════════════════════════════════════════════════════════════════════
-- ✅ COMPLETE!
-- ════════════════════════════════════════════════════════════════════════════
-- Next steps:
-- 1. Run this SQL in Supabase
-- 2. Create 'verification-documents' storage bucket (private)
-- 3. Set up storage policies (see comments above)
-- 4. Update frontend components
