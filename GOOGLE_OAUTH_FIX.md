# Google OAuth Configuration Fix

## 🔴 Issues Found in Your Current Configuration

1. ❌ **JavaScript Origin**: `http://livrank.ca` should be `https://livrank.ca` (missing 's')
2. ❌ **Redirect URI**: `http://livrank.ca//auth/callback` has double slash and should use HTTPS

## ✅ Correct Configuration

### Authorized JavaScript Origins
Add these (one per line):
```
https://eehtzdpzbjsuendgwnwy.supabase.co
https://shiny-pika-a62ac8.netlify.app
https://livrank.ca
```

**Remove:** `http://livrank.ca` (the HTTP version)

### Authorized Redirect URIs
Add these (one per line):
```
https://eehtzdpzbjsuendgwnwy.supabase.co/auth/v1/callback
https://shiny-pika-a62ac8.netlify.app/auth/callback
https://livrank.ca/auth/callback
```

**Remove:** `http://livrank.ca//auth/callback` (has double slash and HTTP)

## 📝 Step-by-Step Instructions

1. **Go to Google Cloud Console**
   - Navigate to: https://console.cloud.google.com
   - Select your project
   - Go to **APIs & Services** → **Credentials**
   - Find your OAuth 2.0 client (Client ID: `937214366465-qnakfh2uuefff39lebeqo10u0h6i8bl6`)
   - Click **Edit** (pencil icon)

2. **Fix JavaScript Origins:**
   - In the "Authorized JavaScript origins" section
   - **Remove:** `http://livrank.ca`
   - **Add:** `https://livrank.ca`
   - Keep the other two origins

3. **Fix Redirect URIs:**
   - In the "Authorized redirect URIs" section
   - **Remove:** `http://livrank.ca//auth/callback` (note the double slash `//`)
   - **Add:** `https://livrank.ca/auth/callback` (single slash, HTTPS)
   - Keep the other two URIs

4. **Click "Save"** at the bottom

5. **Wait 5-10 minutes** for changes to propagate

## ⚠️ Important Notes

- **Always use HTTPS** (not HTTP) for production domains
- **No double slashes** (`//`) in URLs - use single slash (`/`)
- The **Supabase callback URL** (`https://eehtzdpzbjsuendgwnwy.supabase.co/auth/v1/callback`) is the **most important one** - this is where Google actually sends the auth code
- Your site callback (`https://livrank.ca/auth/callback`) is where users land after Supabase processes the auth

## 🔍 Final Configuration Should Look Like:

### Authorized JavaScript origins:
```
https://eehtzdpzbjsuendgwnwy.supabase.co
https://shiny-pika-a62ac8.netlify.app
https://livrank.ca
```

### Authorized redirect URIs:
```
https://eehtzdpzbjsuendgwnwy.supabase.co/auth/v1/callback
https://shiny-pika-a62ac8.netlify.app/auth/callback
https://livrank.ca/auth/callback
```

## ✅ After Making Changes

1. Wait 5-10 minutes for changes to take effect
2. Clear your browser cache
3. Try Google login again
4. Check browser console for any errors

## 🐛 If Still Not Working

1. **Verify Supabase Configuration:**
   - Go to Supabase Dashboard → Authentication → Providers → Google
   - Make sure Client ID and Client Secret are correct
   - Verify redirect URLs in Supabase match Google Console

2. **Check Browser Console:**
   - Open browser DevTools (F12)
   - Go to Console tab
   - Look for OAuth errors

3. **Test in Incognito Mode:**
   - Sometimes cached credentials cause issues
   - Try in a private/incognito window


