# 🚀 How to Run SQL in Supabase

## Option 1: Run CLEAN_DATABASE_SETUP.sql (⚠️ Drops Tables)

**⚠️ WARNING:** This script will DROP and recreate the following tables:
- `building_reviews`
- `neighborhood_reviews` 
- `buildings`
- `neighborhoods`
- `user_profiles`

**All data in these tables will be lost!**

### Steps:
1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your project
3. Click **"SQL Editor"** in the left sidebar
4. Click **"New Query"**
5. Open the file `CLEAN_DATABASE_SETUP.sql` in your project
6. Copy the ENTIRE contents
7. Paste into the SQL Editor
8. Click **"RUN"** (or press `Ctrl+Enter` / `Cmd+Enter`)
9. Wait for the success message: `✅ Setup Complete!`

---

## Option 2: Sync Users Only (✅ Safe - Recommended)

If you only want to sync users WITHOUT dropping tables, use `SYNC_USERS_ONLY.sql` instead:

### Steps:
1. Go to Supabase Dashboard → SQL Editor → New Query
2. Copy the contents of `SYNC_USERS_ONLY.sql`
3. Paste and click **"RUN"**
4. This will:
   - Create `user_profiles` table if it doesn't exist
   - Sync all users from `auth.users` to `user_profiles`
   - Set admin users
   - **Keep all your existing data intact**

---

## Verify It Worked

After running either script, check:

```sql
-- See all synced users
SELECT id, email, full_name, is_admin FROM user_profiles;

-- Check admin users
SELECT email FROM user_profiles WHERE is_admin = true;

-- Count total users
SELECT COUNT(*) as total_users FROM user_profiles;
```

---

## Troubleshooting

**Error: "permission denied"**
- Make sure you're logged into Supabase with the project owner account

**Error: "relation already exists"**
- Some tables already exist. Use `CLEAN_DATABASE_SETUP.sql` to drop and recreate, or manually drop tables first

**Error: "timeout"**
- Supabase might be slow. Wait a few seconds and try again

**No error but nothing happened**
- Check the bottom of the SQL Editor for success/error messages
- Look for the verification SELECT statements at the end of the script

