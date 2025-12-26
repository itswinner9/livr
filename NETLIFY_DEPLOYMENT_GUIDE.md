# 🚀 Netlify Deployment Guide for LivRank

This guide will help you deploy LivRank to Netlify in minutes!

## Prerequisites

- ✅ GitHub account
- ✅ Netlify account (free tier works great)
- ✅ Supabase project with all tables set up
- ✅ Your code pushed to GitHub

## Step 1: Prepare Your Repository

Make sure your code is pushed to GitHub:

```bash
# Initialize git if not already done
git init

# Add all files
git add .

# Commit
git commit -m "Ready for Netlify deployment"

# Add your GitHub repository as remote
git remote add origin https://github.com/yourusername/livrank.git

# Push to GitHub
git branch -M main
git push -u origin main
```

## Step 2: Connect to Netlify

1. **Go to [netlify.com](https://netlify.com)** and sign in (or create an account)
2. Click **"Add new site"** → **"Import an existing project"**
3. Click **"GitHub"** and authorize Netlify to access your repositories
4. Select your **LivRank repository**
5. Click **"Import"**

## Step 3: Configure Build Settings

Netlify should auto-detect Next.js, but verify these settings:

- **Build command:** `npm run build`
- **Publish directory:** `.next` (auto-detected by plugin)
- **Node version:** `18` (set in netlify.toml)

Click **"Show advanced"** and verify the build settings look correct.

## Step 4: Add Environment Variables

**CRITICAL:** Add these environment variables in Netlify:

1. Click **"Environment variables"** in the site settings
2. Add these variables:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

3. Replace with your actual Supabase values from:
   - Supabase Dashboard → Settings → API
   - Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - Copy **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

## Step 5: Deploy!

1. Click **"Deploy site"**
2. Wait for the build to complete (usually 2-5 minutes)
3. Once deployed, you'll get a URL like: `https://random-name-123456.netlify.app`

## Step 6: Update Supabase Settings

After deployment, update Supabase to allow your Netlify domain:

1. Go to **Supabase Dashboard** → **Authentication** → **URL Configuration**
2. Add your Netlify URL to:
   - **Site URL:** `https://your-site.netlify.app`
   - **Redirect URLs:** `https://your-site.netlify.app/**`

3. Save changes

## Step 7: Test Your Deployment

1. Visit your Netlify URL
2. Test these features:
   - ✅ User registration
   - ✅ User login
   - ✅ Creating reviews
   - ✅ Image uploads
   - ✅ Navigation
   - ✅ Profile page

## Step 8: Set Up Custom Domain (Optional)

1. In Netlify, go to **Site settings** → **Domain management**
2. Click **"Add custom domain"**
3. Enter your domain (e.g., `livrank.ca`)
4. Follow Netlify's DNS instructions to configure your domain
5. Wait for SSL certificate (automatic, usually takes a few minutes)

## Step 9: Update Supabase with Custom Domain

If you added a custom domain:

1. Update **Supabase** → **Authentication** → **URL Configuration**
2. Change **Site URL** to your custom domain
3. Add custom domain to **Redirect URLs**

## Continuous Deployment

✅ **Automatic deployments are enabled by default!**

- Every push to `main` branch = automatic deploy
- Every pull request = preview deploy
- No manual action needed!

## Environment Variables Reference

### Required:
```
NEXT_PUBLIC_SUPABASE_URL=    # Your Supabase project URL
NEXT_PUBLIC_SUPABASE_ANON_KEY= # Your Supabase anon key
```

### Optional (for production):
```
NEXT_PUBLIC_SITE_URL=        # Your production URL (for SEO)
```

## Troubleshooting

### Build Fails

**Error: "Module not found"**
- Make sure all dependencies are in `package.json`
- Check that `npm install` runs successfully

**Error: "Environment variable not found"**
- Verify all environment variables are set in Netlify
- Check variable names are exactly correct (case-sensitive)

**Error: "Build timeout"**
- Free tier has 15-minute timeout
- Consider upgrading or optimizing build

### Images Not Loading

1. Check `next.config.js` has correct Supabase domains
2. Verify Supabase storage buckets are public
3. Check storage policies allow public read access

### Authentication Not Working

1. Verify Supabase URL configuration includes your Netlify domain
2. Check environment variables are set correctly
3. Look at browser console for errors
4. Check Supabase logs in dashboard

### Database Connection Issues

1. Verify Supabase URL and anon key are correct
2. Check RLS policies allow necessary operations
3. Review Supabase dashboard logs for errors

## Performance Optimization

### Enable Netlify Analytics (Optional)

1. Go to **Site settings** → **Analytics**
2. Enable **Netlify Analytics**
3. View traffic, popular pages, and more

### Enable Image Optimization

Already configured! Next.js automatically optimizes images from Supabase.

### Enable Caching

Already configured via `netlify.toml` and Next.js plugin.

## Post-Deployment Checklist

- [ ] All pages load correctly
- [ ] User registration works
- [ ] User login works
- [ ] Reviews can be created
- [ ] Images upload successfully
- [ ] Search functionality works
- [ ] Mobile responsive design works
- [ ] Admin panel accessible (if admin user exists)
- [ ] Notifications system works
- [ ] All forms submit correctly
- [ ] No console errors in browser
- [ ] Custom domain configured (if applicable)
- [ ] SSL certificate active (automatic)
- [ ] Supabase URL configuration updated

## Monitoring

### Netlify Dashboard
- View build logs
- Monitor site performance
- Check error logs
- View analytics

### Supabase Dashboard
- Monitor database usage
- Check API requests
- Review authentication logs
- Monitor storage usage

## Support

If you encounter issues:

1. Check Netlify build logs
2. Check browser console for errors
3. Review Supabase logs
4. Verify all environment variables
5. Test locally first (`npm run build`)

## Next Steps

After successful deployment:

1. ✅ Share your site with users!
2. ✅ Monitor usage and performance
3. ✅ Set up email notifications (Supabase)
4. ✅ Configure backups (Supabase Pro)
5. ✅ Add monitoring/analytics
6. ✅ Optimize based on user feedback

---

**Congratulations! 🎉 Your LivRank site is now live on Netlify!**
