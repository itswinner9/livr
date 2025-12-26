# Google OAuth Setup Guide for LivRank

## ✅ What Was Fixed

1. **Login/Signup Pages** - Now properly handle Google OAuth redirects
2. **Callback Page** - Improved to handle both hash-based and code-based OAuth flows
3. **Session Persistence** - Better verification and storage of sessions
4. **Error Handling** - More detailed logging and user feedback

## 🔧 Required Supabase Configuration

### Step 1: Configure Google OAuth in Supabase Dashboard

1. Go to your Supabase Dashboard: https://supabase.com/dashboard
2. Select your LivRank project
3. Navigate to **Authentication** → **Providers** → **Google**
4. Enable Google provider
5. Enter your Google OAuth credentials:
   - **Client ID** (from Google Cloud Console)
   - **Client Secret** (from Google Cloud Console)

### Step 2: Configure Redirect URLs in Supabase

**CRITICAL:** Add these redirect URLs in Supabase Dashboard:

1. Go to **Authentication** → **URL Configuration**
2. Add these to **Redirect URLs**:
   ```
   https://livrank.ca/auth/callback
   https://livrank.ca/*
   http://localhost:3000/auth/callback (for local development)
   http://localhost:3000/*
   ```

### Step 3: Configure Google Cloud Console

1. Go to Google Cloud Console: https://console.cloud.google.com
2. Select your project
3. Navigate to **APIs & Services** → **Credentials**
4. Edit your OAuth 2.0 Client ID
5. Add these **Authorized redirect URIs**:
   ```
   https://eehtzdpzbjsuendgwnwy.supabase.co/auth/v1/callback
   ```
   (Replace `eehtzdpzbjsuendgwnwy` with your actual Supabase project reference ID)

### Step 4: Verify Environment Variables

Make sure these are set in Netlify:

1. Go to Netlify Dashboard → Your Site → **Site settings** → **Environment variables**
2. Verify these variables exist:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` (should be `https://livrank.ca`)

## 🔍 How It Works Now

### Login Flow:
1. User clicks "Sign In with Google"
2. Redirects to Google OAuth consent screen
3. User authorizes
4. Google redirects to `/auth/callback` with authorization code or hash
5. Callback page exchanges code/hash for session
6. Session is verified and stored
7. User is redirected to home page

### Error Handling:
- OAuth errors are caught and displayed
- Session verification happens after login
- Fallback redirects if something goes wrong
- Detailed console logging for debugging

## 🐛 Troubleshooting

### Issue: "Redirect URI mismatch"
**Solution:** Make sure the redirect URL in Supabase matches exactly what's in Google Cloud Console:
- Supabase: `https://YOUR_PROJECT.supabase.co/auth/v1/callback`
- Google Console: Same URL must be added

### Issue: "Session not persisted"
**Solution:** 
1. Clear browser cache and cookies
2. Try in incognito/private mode
3. Check browser console for errors
4. Verify Supabase environment variables are correct

### Issue: "Stuck on callback page"
**Solution:**
1. Check browser console for errors
2. Verify the callback URL is accessible
3. Check Supabase logs in dashboard
4. Try clearing localStorage: `localStorage.clear()` in browser console

### Issue: "Login works sometimes but not always"
**Possible causes:**
1. **Race conditions** - Fixed by adding proper session verification
2. **Cached redirect URLs** - Clear browser cache
3. **Supabase rate limiting** - Wait a few minutes and try again
4. **Network issues** - Check internet connection

## 📝 Testing Checklist

- [ ] Google OAuth enabled in Supabase
- [ ] Redirect URLs configured in Supabase
- [ ] Redirect URIs configured in Google Cloud Console
- [ ] Environment variables set in Netlify
- [ ] Can login with email/password
- [ ] Can login with Google (production)
- [ ] Can login with Google (local development)
- [ ] Session persists after page refresh
- [ ] Can access protected routes after login
- [ ] Logout works correctly

## 🚀 Current Status

✅ **Fixed:**
- Google OAuth redirect handling
- Session persistence verification
- Error handling and logging
- Callback page processing
- Both hash and code-based OAuth flows

✅ **Deployed:**
- Latest changes are live on https://livrank.ca

## 📞 Need Help?

If you're still experiencing issues:
1. Check browser console for detailed error messages
2. Check Supabase logs in the dashboard
3. Verify all configuration steps above
4. Try in a different browser or incognito mode


