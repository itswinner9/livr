-- ============================================
-- COMPLETE MODERATION SYSTEM SETUP
-- Run this in your Supabase SQL Editor
-- ============================================

-- Step 1: Add moderation columns to user_profiles
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'warning_count') THEN
    ALTER TABLE user_profiles ADD COLUMN warning_count INTEGER DEFAULT 0;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'status') THEN
    ALTER TABLE user_profiles ADD COLUMN status VARCHAR(50) DEFAULT 'active';
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'banned_until') THEN
    ALTER TABLE user_profiles ADD COLUMN banned_until TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'cooled_until') THEN
    ALTER TABLE user_profiles ADD COLUMN cooled_until TIMESTAMP WITH TIME ZONE;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'moderation_reason') THEN
    ALTER TABLE user_profiles ADD COLUMN moderation_reason TEXT;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'moderated_by') THEN
    ALTER TABLE user_profiles ADD COLUMN moderated_by UUID REFERENCES auth.users(id);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'user_profiles' AND column_name = 'moderated_at') THEN
    ALTER TABLE user_profiles ADD COLUMN moderated_at TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Step 2: Create user_moderation_log table
CREATE TABLE IF NOT EXISTS user_moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  duration_months INTEGER,
  reason TEXT NOT NULL,
  moderated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

-- Enable RLS on moderation log
ALTER TABLE user_moderation_log ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Admins can view moderation logs" ON user_moderation_log;
DROP POLICY IF EXISTS "Admins can insert moderation logs" ON user_moderation_log;

-- Create policies for moderation log
CREATE POLICY "Admins can view moderation logs" ON user_moderation_log
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

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

-- Step 3: Fix notifications policies
-- Drop existing policies
DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;

-- Create admin insert policy for notifications
CREATE POLICY "Admins can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_profiles 
      WHERE id = auth.uid() AND is_admin = true
    )
  );

-- Step 4: Helper functions
CREATE OR REPLACE FUNCTION calculate_moderation_end_date(duration_months INTEGER)
RETURNS TIMESTAMP WITH TIME ZONE AS $$
BEGIN
  IF duration_months IS NULL THEN
    RETURN NULL;
  ELSE
    RETURN NOW() + INTERVAL '1 month' * duration_months;
  END IF;
END;
$$ LANGUAGE plpgsql;

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
SELECT '✅ Moderation system setup complete!' AS result;



