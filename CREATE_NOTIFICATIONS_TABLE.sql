-- ============================================
-- NOTIFICATION SYSTEM
-- ============================================

-- Create notifications table
CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  link VARCHAR(500),
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW()),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own notifications" ON notifications;
DROP POLICY IF EXISTS "Users can update own notifications" ON notifications;
DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;

-- Create policies
CREATE POLICY "Users can view own notifications" ON notifications
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notifications" ON notifications
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(read);
CREATE INDEX IF NOT EXISTS idx_notifications_created_at ON notifications(created_at DESC);

-- Create trigger to update updated_at
CREATE OR REPLACE FUNCTION update_notifications_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = TIMEZONE('utc', NOW());
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_notifications_updated_at ON notifications;
CREATE TRIGGER set_notifications_updated_at
  BEFORE UPDATE ON notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_notifications_updated_at();

-- Create function to auto-create notifications for review status changes
CREATE OR REPLACE FUNCTION notify_review_status_change()
RETURNS TRIGGER AS $$
BEGIN
  -- Only create notification if status changed to 'approved' or 'rejected'
  IF NEW.status != OLD.status AND NEW.status IN ('approved', 'rejected') THEN
    INSERT INTO notifications (user_id, type, title, message, link)
    VALUES (
      NEW.user_id,
      CASE 
        WHEN NEW.status = 'approved' THEN 'review_approved'
        WHEN NEW.status = 'rejected' THEN 'review_rejected'
        ELSE 'review_status'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN '✅ Review Approved!'
        WHEN NEW.status = 'rejected' THEN '❌ Review Rejected'
        ELSE 'Review Status Updated'
      END,
      CASE 
        WHEN NEW.status = 'approved' THEN 'Your review has been approved and is now live!'
        WHEN NEW.status = 'rejected' THEN 'Your review was rejected. Please review our guidelines.'
        ELSE 'The status of your review has been updated.'
      END,
      '/profile'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers to review tables (only if they don't already have them)
-- Note: These might already exist, so we drop first

-- For neighborhood_reviews
DROP TRIGGER IF EXISTS trigger_notify_neighborhood_review_status ON neighborhood_reviews;
CREATE TRIGGER trigger_notify_neighborhood_review_status
  AFTER UPDATE OF status ON neighborhood_reviews
  FOR EACH ROW
  WHEN (NEW.status != OLD.status)
  EXECUTE FUNCTION notify_review_status_change();

-- For building_reviews
DROP TRIGGER IF EXISTS trigger_notify_building_review_status ON building_reviews;
CREATE TRIGGER trigger_notify_building_review_status
  AFTER UPDATE OF status ON building_reviews
  FOR EACH ROW
  WHEN (NEW.status != OLD.status)
  EXECUTE FUNCTION notify_review_status_change();

-- For landlord_reviews
DROP TRIGGER IF EXISTS trigger_notify_landlord_review_status ON landlord_reviews;
CREATE TRIGGER trigger_notify_landlord_review_status
  AFTER UPDATE OF status ON landlord_reviews
  FOR EACH ROW
  WHEN (NEW.status != OLD.status)
  EXECUTE FUNCTION notify_review_status_change();

-- For rent_company_reviews (check if table exists first)
DO $$ 
BEGIN
  IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'rent_company_reviews') THEN
    DROP TRIGGER IF EXISTS trigger_notify_company_review_status ON rent_company_reviews;
    EXECUTE '
      CREATE TRIGGER trigger_notify_company_review_status
      AFTER UPDATE OF status ON rent_company_reviews
      FOR EACH ROW
      WHEN (NEW.status != OLD.status)
      EXECUTE FUNCTION notify_review_status_change();
    ';
  END IF;
END $$;

-- Success message
SELECT '✅ Notifications table and triggers created successfully!' AS result;

