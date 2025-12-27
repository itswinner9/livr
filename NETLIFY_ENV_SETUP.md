# 🔧 Netlify Environment Variables Setup Guide

## Required Environment Variables

You need to add these environment variables in your Netlify dashboard for the site to work properly:

### 1. **NEXT_PUBLIC_SUPABASE_URL**
```
https://eehtzdpzbjsuendgwnwy.supabase.co
```

### 2. **NEXT_PUBLIC_SUPABASE_ANON_KEY**
```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlaHR6ZHB6YmpzdWVuZGd3bnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNDQ5ODgsImV4cCI6MjA3NTgyMDk4OH0.4YjQFYHSPF2EVEqwk54ulaOkGYLvpogbSyfYKYbIOpQ
```

### 3. **NEXT_PUBLIC_SITE_URL**
```
https://livrank.ca
```

## 📝 How to Add Environment Variables in Netlify

### Step 1: Go to Netlify Dashboard
1. Go to https://app.netlify.com
2. Select your site (livrank.ca)

### Step 2: Navigate to Site Settings
1. Click on **Site settings** (gear icon) in the top navigation
2. Or go to: **Site configuration** → **Environment variables**

### Step 3: Add Each Variable
1. Click **"Add a variable"** or **"Add environment variable"**
2. For each variable:
   - **Key**: Enter the variable name (e.g., `NEXT_PUBLIC_SUPABASE_URL`)
   - **Value**: Enter the value (e.g., `https://eehtzdpzbjsuendgwnwy.supabase.co`)
   - **Scopes**: Select **"All scopes"** (or just "Production" if you want)
3. Click **"Save"**

### Step 4: Repeat for All Variables
Add all three variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_SITE_URL`

### Step 5: Redeploy
After adding the variables:
1. Go to **Deploys** tab
2. Click **"Trigger deploy"** → **"Deploy site"**
3. Or push a new commit to trigger automatic deployment

## ✅ Verification

After deployment, check:
1. Login should work
2. Data should fetch from database
3. Explore page should show results
4. No console errors about missing environment variables

## 🔒 Security Note

- `NEXT_PUBLIC_*` variables are exposed to the browser (this is normal for Supabase)
- The anon key is safe to expose (it's designed for client-side use)
- Never commit `.env.local` files to git (they're already in `.gitignore`)

## 🆘 Troubleshooting

If the site still doesn't work after adding variables:
1. **Clear Netlify build cache**: Site settings → Build & deploy → Clear cache
2. **Redeploy**: Trigger a new deployment
3. **Check build logs**: Look for any errors in the deploy logs
4. **Verify variables**: Make sure variable names match exactly (case-sensitive)

## 📋 Quick Copy-Paste Values

```
NEXT_PUBLIC_SUPABASE_URL=https://eehtzdpzbjsuendgwnwy.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVlaHR6ZHB6YmpzdWVuZGd3bnd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjAyNDQ5ODgsImV4cCI6MjA3NTgyMDk4OH0.4YjQFYHSPF2EVEqwk54ulaOkGYLvpogbSyfYKYbIOpQ
NEXT_PUBLIC_SITE_URL=https://livrank.ca
```

---

**Note**: The code has fallback values, so the site will work even without these variables, but it's best practice to set them explicitly in Netlify for production.

