-- Make user nnoqrdcchtkzwvj@teihu.com an admin
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Find the user's ID from auth.users by email
-- We'll update the user_profiles table to set is_admin = true

-- First, let's check if the user exists in auth.users
SELECT id, email, created_at 
FROM auth.users 
WHERE email = 'nnoqrdcchtkzwvj@teihu.com';

-- Step 2: Update the user_profiles table to make them admin
UPDATE user_profiles 
SET is_admin = true
WHERE email = 'nnoqrdcchtkzwvj@teihu.com';

-- Verify the update
SELECT id, email, is_admin, display_name, created_at
FROM user_profiles
WHERE email = 'nnoqrdcchtkzwvj@teihu.com';

-- If the user doesn't exist in user_profiles yet, create a profile
-- This handles the case where the user signs up but hasn't been added to user_profiles yet
INSERT INTO user_profiles (id, email, display_name, is_admin, created_at)
SELECT 
  au.id,
  au.email,
  COALESCE(au.raw_user_meta_data->>'full_name', au.email),
  true,
  au.created_at
FROM auth.users au
WHERE au.email = 'nnoqrdcchtkzwvj@teihu.com'
AND NOT EXISTS (
  SELECT 1 FROM user_profiles WHERE email = 'nnoqrdcchtkzwvj@teihu.com'
)
ON CONFLICT (email) DO UPDATE
SET is_admin = true;

-- Final verification
SELECT id, email, is_admin, display_name, created_at
FROM user_profiles
WHERE email = 'nnoqrdcchtkzwvj@teihu.com';

