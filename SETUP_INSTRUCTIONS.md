# 🚀 Quick Setup Instructions

## Your Server is Running! ✅

**Local URL:** http://localhost:3000

---

## ⚠️ IMPORTANT: Run This SQL in Supabase First!

Before using the moderation system, you MUST run this SQL:

### Step 1: Open Supabase SQL Editor
1. Go to your Supabase project
2. Click "SQL Editor" in the left sidebar
3. Click "New Query"

### Step 2: Run the Setup Script
Copy and paste the contents of `SETUP_MODERATION_SYSTEM.sql` into the SQL editor and click "Run".

**Or run this directly:**

```sql
-- Add moderation columns
ALTER TABLE user_profiles 
ADD COLUMN IF NOT EXISTS warning_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS status VARCHAR(50) DEFAULT 'active',
ADD COLUMN IF NOT EXISTS banned_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS cooled_until TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS moderation_reason TEXT,
ADD COLUMN IF NOT EXISTS moderated_by UUID REFERENCES auth.users(id),
ADD COLUMN IF NOT EXISTS moderated_at TIMESTAMP WITH TIME ZONE;

-- Create moderation log table
CREATE TABLE IF NOT EXISTS user_moderation_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action VARCHAR(50) NOT NULL,
  duration_months INTEGER,
  reason TEXT NOT NULL,
  moderated_by UUID NOT NULL REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc', NOW())
);

ALTER TABLE user_moderation_log ENABLE ROW LEVEL SECURITY;

-- Admins can manage moderation logs
DROP POLICY IF EXISTS "Admins can view moderation logs" ON user_moderation_log;
DROP POLICY IF EXISTS "Admins can insert moderation logs" ON user_moderation_log;

CREATE POLICY "Admins can view moderation logs" ON user_moderation_log
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
  );

CREATE POLICY "Admins can insert moderation logs" ON user_moderation_log
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Admins can create notifications
DROP POLICY IF EXISTS "Admins can create notifications" ON notifications;
CREATE POLICY "Admins can create notifications" ON notifications
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM user_profiles WHERE id = auth.uid() AND is_admin = true)
  );

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_moderation_log_user_id ON user_moderation_log(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_status ON user_profiles(status);
```

### Step 3: Verify Setup
Check if the columns were added successfully:

```sql
SELECT column_name 
FROM information_schema.columns 
WHERE table_name = 'user_profiles' 
AND column_name IN ('warning_count', 'status', 'banned_until', 'cooled_until');
```

You should see all 4 columns listed.

---

## 🎯 Next Steps

1. **Login** at http://localhost:3000/login
2. **Go to Admin Panel** at http://localhost:3000/admin
3. **Open Users Page** at http://localhost:3000/admin/users
4. **Try Moderation Actions**:
   - Click "Warn" on a user
   - Click "Cool Off" (3, 6, or 12 months)
   - Click "Ban" (3, 6, 12 months, or permanent)
   - Click "Restore" to lift restrictions

---

## 🔧 Troubleshooting

### "Not authenticated" error?
- Make sure you're logged in as an admin
- Check that your user has `is_admin = true` in user_profiles

### "Policy violation" error?
- Run the SQL setup script above
- Refresh the page and try again

### Columns don't exist?
- Run the SQL setup script
- Check Supabase for any error messages
- Make sure you ran it in the correct database

---

## 📚 Full Documentation

See `ADMIN_MODERATION_GUIDE.md` for complete documentation on the moderation system.

---

**Need help?** Check the terminal for any error messages or check Supabase logs.
