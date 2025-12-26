-- ============================================
-- ADMIN MODERATION SYSTEM
-- ============================================
-- Warning, Cooling Off, and Ban System

-- Add moderation columns to user_profiles if they don't exist
DO $$ 
BEGIN
  -- Add warning_count
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'warning_count') THEN
    ALTER TABLE user_profiles ADD COLUMN warning_count INTEGER DEFAULT 0;
  END IF;

  -- Add status
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'status') THEN
    ALTER TABLE user_profiles ADD COLUMN status VARCHAR(50) DEFAULT 'active';
  END IF;

  -- Add banned_until
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'banned_until') THEN
    ALTER TABLE user_profiles ADD COLUMN banned_until TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add cooled_until
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'cooled_until') THEN
    ALTER TABLE user_profiles ADD COLUMN cooled_until TIMESTAMP WITH TIME ZONE;
  END IF;

  -- Add moderation_reason
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'moderation_reason') THEN
    ALTER TABLE user_profiles ADD COLUMN moderation_reason TEXT;
  END IF;

  -- Add moderated_by
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'moderated_by') THEN
    ALTER TABLE user_profiles ADD COLUMN moderated_by UUID REFERENCES auth.users(id);
  END IF;

  -- Add moderated_at
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'moderated_at') THEN
    ALTER TABLE user_profiles ADD COLUMN moderated_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Create user_moderation_log table for tracking moderation actions
CREATE TABLE IF NOT EXISTS user_moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL, -- 'warning', 'cooling_off', 'ban', 'unban'
  duration_months INTEGER, -- null for permanent, number for temporary
  reason TEXT NOT NULL,
  moderated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS on moderation log
ALTER TABLE user_moderation_log ENABLE ROW LEVEL SECURITY;

-- Only admins can view moderation logs
DROP POLICY IF EXISTS "Admins can view moderation logs" ON user_moderation_log;
CREATE POLICY "Admins can view moderation logs" ON user_moderation_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Only admins can insert moderation logs
DROP POLICY IF EXISTS "Admins can insert moderation logs" ON user_moderation_log;
CREATE POLICY "Admins can insert moderation logs" ON user_moderation_log
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_moderation_log_user_id ON user_moderation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_moderation_log_created_at ON user_moderation_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);

-- Function to calculate cooling/ban end date
CREATE OR REPLACE FUNCTION calculate_moderation_end_date(duration_months INTEGER)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  IF duration_months IS NULL THEN
    RETURN NULL; -- Permanent ban
  ELSE
    RETURN NOW() + INTERVAL '1 month' * duration_months;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get user moderation status
CREATE OR REPLACE FUNCTION get_user_moderation_status(p_user_id UUID)
RETURNS TABLE (
  status VARCHAR(50),
  can_post BOOLEAN,
  can_rate BOOLEAN,
  banned_until TIMESTAMP WITH TIME ZONE,
  cooled_until TIMESTAMP WITH TIME ZONE,
  warning_count INTEGER,
  moderation_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    up.status,
    CASE 
      WHEN up.status = 'banned' THEN false
      WHEN up.status = 'cooled' AND (up.cooled_until IS NULL OR up.cooled_until > NOW()) THEN false
      ELSE true
    END as can_post,
    CASE 
      WHEN up.status = 'banned' THEN false
      WHEN up.status = 'cooled' AND (up.cooled_until IS NULL OR up.cooled_until > NOW()) THEN false
      ELSE true
    END as can_rate,
    up.banned_until,
    up.cooled_until,
    up.warning_count,
    up.moderation_reason
  FROM user_profiles up
  WHERE up.id = p_user_id;
END;
$$ LANGUAGE plpgsql;

-- Success message
SELECT '✅ Admin moderation system created successfully!' AS result;

