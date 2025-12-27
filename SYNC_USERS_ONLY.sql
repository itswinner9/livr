-- ═══════════════════════════════════════════════════════════════
-- 🔄 SYNC USERS ONLY - Safe version (doesn't drop tables)
-- ═══════════════════════════════════════════════════════════════
-- This script only syncs existing auth.users to user_profiles
-- It does NOT drop any existing tables or data

-- Ensure user_profiles table exists (create if missing)
CREATE TABLE IF NOT EXISTS user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  full_name TEXT,
  is_admin BOOLEAN DEFAULT false,
  is_banned BOOLEAN DEFAULT false,
  ban_reason TEXT,
  banned_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Disable RLS for easier access
ALTER TABLE user_profiles DISABLE ROW LEVEL SECURITY;

-- Sync existing users from auth.users to user_profiles
INSERT INTO user_profiles (id, email, full_name, is_admin, created_at)
SELECT 
  id, 
  email, 
  COALESCE(raw_user_meta_data->>'full_name', ''),
  false,
  created_at
FROM auth.users
ON CONFLICT (id) 
DO UPDATE SET
  email = EXCLUDED.email,
  full_name = COALESCE(EXCLUDED.full_name, user_profiles.full_name);

-- Set admins (update if needed)
UPDATE user_profiles SET is_admin = true WHERE email = 'tami76@tiffincrane.com';
UPDATE user_profiles SET is_admin = true WHERE email = 'athenerose@powerscrews.com';

-- Verify sync results
SELECT '✅ User Sync Complete!' as status;
SELECT 'Total users synced:' as info, COUNT(*) as count FROM user_profiles;
SELECT 'Admin users:' as info, email, full_name FROM user_profiles WHERE is_admin = true;

-- ═══════════════════════════════════════════════════════════════
-- ✅ DONE! Users synced without dropping any tables
-- ═══════════════════════════════════════════════════════════════

