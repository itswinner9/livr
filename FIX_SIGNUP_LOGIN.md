# 🔧 Fix Signup & Login Issues

## Problem
Users cannot register or login to LivRank.

## Solution Steps

### ✅ Step 1: Disable Email Confirmation (Recommended for Testing)

**Go to Supabase Dashboard:**
1. Visit: https://supabase.com/dashboard/project/eehtzdpzbjsuendgwnwy/auth/users
2. Click on **"Authentication"** in left sidebar
3. Click on **"Providers"** tab
4. Click on **"Email"** provider
5. **UNCHECK** "Confirm email"
6. Click **"Save"**

This allows users to sign up and login immediately without email verification.

---

### ✅ Step 2: Check Auth Settings

**In Supabase Dashboard → Authentication → Settings:**

1. **Site URL**: Set to `http://localhost:3002`
2. **Redirect URLs**: Add:
   - `http://localhost:3002/**`
   - `http://localhost:3002/auth/callback`
3. **Email Templates**: Use default templates (for now)

**Direct Link:**
https://supabase.com/dashboard/project/eehtzdpzbjsuendgwnwy/auth/url-configuration

---

### ✅ Step 3: Test Signup Flow

1. **Open Browser Console** (F12)
2. Go to: http://localhost:3002/signup
3. Fill in:
   - Full Name: `Test User`
   - Email: `test@example.com`
   - Password: `TestPassword123`
   - Confirm Password: `TestPassword123`
4. Click **"Sign Up"**

**Watch Console for:**
```
📝 Creating account for: test@example.com
✅ Account created! {...user data...}
Session: {...session data...}
✅ Auto-logged in! Redirecting to home...
```

**Expected Result:**
- ✅ Alert: "Account created successfully! You are now logged in."
- ✅ Redirected to homepage
- ✅ Profile icon visible in navigation
- ✅ User can access protected pages

---

### ✅ Step 4: Test Login Flow

1. Logout first (if logged in)
2. Go to: http://localhost:3002/login
3. Enter:
   - Email: `test@example.com`
   - Password: `TestPassword123`
4. Click **"Sign In"**

**Watch Console for:**
```
🔐 Starting login for: test@example.com
✅ Login successful! Redirecting...
```

**Expected Result:**
- ✅ Redirected to homepage
- ✅ Profile icon visible
- ✅ Can access `/rate/building` and `/rate/neighborhood`

---

### ✅ Step 5: Verify User in Database

**Go to Supabase Dashboard:**
https://supabase.com/dashboard/project/eehtzdpzbjsuendgwnwy/auth/users

**Check:**
1. User exists in Auth → Users tab
2. Email is shown
3. Status is **"Confirmed"** (green checkmark)

**Also check user_profiles table:**
https://supabase.com/dashboard/project/eehtzdpzbjsuendgwnwy/editor

1. Go to `user_profiles` table
2. Should see new row with:
   - `id` (matches auth user ID)
   - `email`
   - `full_name`
   - `role: 'user'`

---

## 🐛 Common Issues & Fixes

### Issue 1: "User already registered"
**Cause:** Email already exists
**Fix:** 
- Delete user from Auth → Users
- Or use a different email

### Issue 2: "Email not confirmed"
**Cause:** Email confirmation is enabled
**Fix:**
- Disable email confirmation (Step 1 above)
- OR check your email inbox for confirmation link

### Issue 3: "Invalid credentials" on login
**Cause:** Wrong password or user not confirmed
**Fix:**
- Check password is correct
- Verify user is confirmed in Supabase Auth

### Issue 4: User created but can't login
**Cause:** User profile not created
**Fix:**
- Make sure trigger is set up (run LIVRANK_COMPLETE_DB.sql)
- Check `user_profiles` table

### Issue 5: Nothing happens when clicking "Sign Up"
**Cause:** JavaScript error
**Fix:**
- Check browser console (F12)
- Look for red error messages
- Share the error with me

---

## 🔍 Debug Checklist

If signup/login still not working:

**1. Check Browser Console (F12)**
```
Look for:
✅ "📝 Creating account for: [email]"
✅ "✅ Account created!"
❌ Any red errors?
```

**2. Check Network Tab (F12 → Network)**
```
Look for:
- POST to supabase.co/auth/v1/signup
- Response status: 200 (success) or 4xx/5xx (error)
- Response body: Check for error messages
```

**3. Check Supabase Logs**
```
Go to: https://supabase.com/dashboard/project/eehtzdpzbjsuendgwnwy/logs/auth-logs
Look for recent signup/login attempts
Check for any errors
```

**4. Test with Different Email**
```
Try: yourname+test1@gmail.com
(Gmail ignores +anything, but Supabase treats it as unique)
```

---

## ✅ Success Criteria

Signup/Login is working if:
- ✅ Can create account without errors
- ✅ User appears in Supabase Auth → Users
- ✅ User profile created in `user_profiles` table
- ✅ Can login with email + password
- ✅ Profile icon appears after login
- ✅ Can access protected pages (rate building/neighborhood)

---

## 🚀 Quick Fix Script

If all else fails, here's a quick test:

**1. Delete any test users:**
- Go to Supabase Auth → Users
- Delete `test@example.com` if exists

**2. Run this in Supabase SQL Editor:**
```sql
-- Check if user_profiles table exists and has trigger
SELECT * FROM pg_trigger 
WHERE tgname = 'on_auth_user_created';

-- If no results, run LIVRANK_COMPLETE_DB.sql
```

**3. Try signup again with fresh email**

---

## 📞 Still Having Issues?

**Tell me:**
1. What error message do you see? (exact text)
2. What shows in browser console? (press F12)
3. Can you see the user in Supabase Auth → Users?
4. Is email confirmation enabled or disabled?

**I'll help you fix it!** 🎉




