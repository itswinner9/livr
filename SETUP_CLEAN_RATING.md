# ✅ CLEAN RATING SYSTEM - SETUP INSTRUCTIONS

## What This Does

This creates a **simplified, clean rating system** that:
- Uses only `overall_rating` (1-5 stars) - no complex category ratings
- Automatically calculates averages when reviews are added
- Supports 4 entity types: Neighborhoods, Buildings, Landlords, Rent Companies
- Each entity has a single `overall_rating` and `total_reviews` count

---

## Step 1: Run the SQL

### Open Supabase SQL Editor
1. Go to: https://app.supabase.com
2. Select your project
3. Click **"SQL Editor"** in the sidebar
4. Click **"New query"**

### Copy & Run
1. Open the file: `CLEAN_RATING_SYSTEM.sql`
2. Copy **ALL** the content (Cmd+A, Cmd+C)
3. Paste into Supabase SQL Editor (Cmd+V)
4. Click **"Run"** button
5. Wait 3-5 seconds
6. You should see: `🎉 Clean rating system created successfully!`

---

## Step 2: What Was Created

### Entity Tables (4)
- `neighborhoods` - places to live
- `buildings` - apartment buildings
- `landlords` - property owners
- `rent_companies` - rental agencies

Each has:
- `id`, `name`, `city`, `province`, `slug`
- `overall_rating` (0.00 to 5.00)
- `total_reviews` (count)

### Review Tables (4)
- `neighborhood_reviews`
- `building_reviews`
- `landlord_reviews`
- `rent_company_reviews`

Each has:
- `overall_rating` (1-5 stars) ⭐
- `comment` (optional text)
- `images` (array of photo URLs)
- `is_anonymous` (true/false)
- `display_name` (if not anonymous)
- `status` ('pending', 'approved', 'rejected')

### Auto-Update Triggers
- When a review is added/updated/deleted
- Automatically recalculates `overall_rating` and `total_reviews`
- Only counts reviews with `status = 'approved'`

---

## Step 3: Test It

### Create a Test Review via Supabase Dashboard

1. Go to **Table Editor** → `neighborhoods`
2. Click **"Insert row"**
3. Fill in:
   ```
   name: Test Neighborhood
   city: Toronto
   province: Ontario
   slug: test-neighborhood
   ```
4. Click **"Save"**

5. Go to **Table Editor** → `neighborhood_reviews`
6. Click **"Insert row"**
7. Fill in:
   ```
   neighborhood_id: (select the ID from step 3)
   user_id: (select your user ID from auth.users)
   overall_rating: 5
   comment: This is a great neighborhood!
   status: approved
   ```
8. Click **"Save"**

9. Go back to `neighborhoods` table
10. Find your test neighborhood
11. You should see:
    - `overall_rating`: 5.00
    - `total_reviews`: 1

**If you see this, it's working!** ✅

---

## Step 4: Update Your Code

Your rating forms need to submit only `overall_rating` (1-5), not multiple category ratings.

### Example Rating Form Submission:

```typescript
// Instead of:
{
  safety: 5,
  cleanliness: 4,
  noise: 3,
  // etc...
}

// Now use:
{
  overall_rating: 4  // Just one rating (1-5 stars)
}
```

### Update Forms:
1. `app/rate/neighborhood/page.tsx`
2. `app/rate/building/page.tsx`
3. `app/rate/landlord/page.tsx`
4. `app/rate/rent-company/page.tsx`

---

## Benefits of This System

### ✅ Simple
- One rating instead of 5-6 categories
- Easier for users to rate
- Faster for admin to review

### ✅ Consistent
- Same structure for all entity types
- Predictable behavior

### ✅ Fast
- No complex calculations
- Instant updates via triggers
- Indexed for performance

### ✅ Flexible
- Can add more fields later
- Can add admin review workflow
- Can add reporting features

---

## Troubleshooting

### "Could not find column"
- Make sure you ran the complete SQL file
- Check that all tables were created

### Ratings not updating
- Check that trigger was created: `SELECT * FROM pg_trigger WHERE tgname LIKE '%update%rating%'`
- Make sure review has `status = 'approved'`

### Duplicate entry error
- User can only review same entity once
- Use UPDATE instead of INSERT if review exists

---

## Next Steps

1. ✅ Run SQL - DONE
2. Update rating forms to use `overall_rating`
3. Test creating a review
4. Verify rating displays correctly
5. Update display pages to show new structure

---

## Questions?

See the SQL file for complete schema details.

