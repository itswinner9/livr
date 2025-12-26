# 🚀 Quick Netlify Deployment (No Git Required)

## Step 1: Login to Netlify

Run this command in your terminal:

```bash
netlify login
```

This will open your browser. Login with your Netlify account (or create one for free).

## Step 2: Deploy Your Site

Once logged in, run:

```bash
netlify deploy --prod
```

When prompted:
- **"What would you like to do?"** → Select "Create & configure a new site"
- **"Team?"** → Select your team (or personal)
- **"Site name?"** → Press Enter for a random name, or type `livrank` for a custom name
- **"Build command?"** → Type: `npm run build`
- **"Directory to deploy?"** → Press Enter (defaults to current directory)

## Step 3: Add Environment Variables

After first deployment, add your Supabase credentials:

```bash
netlify env:set NEXT_PUBLIC_SUPABASE_URL "https://your-project.supabase.co"
netlify env:set NEXT_PUBLIC_SUPABASE_ANON_KEY "your-anon-key-here"
```

Replace with your actual Supabase values.

## Step 4: Redeploy with Environment Variables

```bash
netlify deploy --prod
```

## Step 5: Update Supabase Settings

1. Go to your Supabase Dashboard
2. Authentication → URL Configuration
3. Add your Netlify URL to:
   - Site URL: `https://your-site-name.netlify.app`
   - Redirect URLs: `https://your-site-name.netlify.app/**`

## Done! 🎉

Your site is now live on Netlify!

---

## Alternative: Manual Deployment via Netlify Dashboard

If you prefer using the web interface:

1. Go to [app.netlify.com](https://app.netlify.com)
2. Click "Add new site" → "Deploy manually"
3. Drag and drop your project folder (but this won't work for Next.js)

**Note:** Next.js requires the source code to build, so CLI deployment is recommended.

---

## Troubleshooting

**Build fails?**
- Make sure you're in the project directory
- Check that `npm run build` works locally first
- Verify environment variables are set correctly

**Need help?**
- Run `netlify status` to see current site info
- Run `netlify open` to open your site dashboard
- Check Netlify build logs in the dashboard

