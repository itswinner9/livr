# Update Database to Support Category Ratings

## 🎯 What This Does

Updates your database to support **5 specific category ratings** for neighborhoods:
1. 🔒 Safety
2. 🔊 Noise Level
3. 🚌 Public Transit Access
4. 🏪 Nearby Amenities
5. 👥 Community Feel

## 📝 Step-by-Step Instructions

### Step 1: Run the SQL Script

1. Go to your Supabase Dashboard
2. Click on "SQL Editor" in the left sidebar
3. Create a new query
4. Copy and paste the entire contents of `RATING_SYSTEM_WITH_CATEGORIES.sql`
5. Click "Run" to execute the script
6. Wait for the success message: `🎉 Rating system with categories created successfully!`

**⚠️ Important:** This will **delete all existing data** and create fresh tables with the new schema.

### Step 2: Clear Your Browser Cache

1. Open your app at `http://localhost:3000`
2. Press `Cmd+Shift+R` (Mac) or `Ctrl+Shift+R` (Windows) to hard refresh
3. Or clear your browser cache completely

### Step 3: Test the New Form

1. Go to `http://localhost:3000/rate/neighborhood`
2. You should see 5 separate category rating fields:
   - Safety
   - Noise Level
   - Public Transit Access
   - Nearby Amenities
   - Community Feel
3. Fill out all 5 ratings and submit
4. The system will automatically calculate the overall rating as the average of all 5 categories

## ✅ What Changed

### Database Schema

**Neighborhoods Table:**
- Added: `safety_rating`, `noise_rating`, `transit_rating`, `amenities_rating`, `community_rating`
- Keeps: `overall_rating` (auto-calculated from categories)

**Neighborhood Reviews Table:**
- Added columns: `safety`, `noise`, `transit`, `amenities`, `community` (all INTEGER 1-5)
- Each review now stores individual category ratings

**Rating Calculation:**
- The trigger function `update_neighborhood_ratings()` now:
  - Averages the `safety` ratings → `safety_rating`
  - Averages the `noise` ratings → `noise_rating`
  - Averages the `transit` ratings → `transit_rating`
  - Averages the `amenities` ratings → `amenities_rating`
  - Averages the `community` ratings → `community_rating`
  - Averages the `overall_rating` from reviews → `overall_rating`

### Frontend Form

- Replaced single "Overall Rating" with 5 separate category ratings
- Each category has its own star rating interface
- Overall rating is auto-calculated as the average of all 5 categories
- All 5 categories are required to submit a review

## 🎨 Benefits

1. **More Detailed Feedback:** Users can now rate specific aspects of a neighborhood
2. **Better Insights:** View category breakdowns to understand neighborhood strengths and weaknesses
3. **Flexible Rating:** Users can give different scores to different aspects
4. **Auto-Calculation:** Overall rating is automatically calculated, preventing inconsistencies

## 🔧 Troubleshooting

### "Column not found" error
- The database wasn't updated properly
- Re-run the `RATING_SYSTEM_WITH_CATEGORIES.sql` script

### Old form still showing
- Hard refresh your browser (Cmd+Shift+R)
- Clear browser cache
- Check that the dev server restarted

### Can't submit review
- Make sure all 5 categories are rated (1-5 stars each)
- Check browser console for errors
- Verify you're logged in

## 📊 Example Review

```
Neighborhood: Downtown Vancouver

Category Ratings:
- Safety: 4 stars
- Noise: 3 stars
- Transit: 5 stars
- Amenities: 5 stars
- Community: 4 stars

Overall Rating: 4.2 (auto-calculated)
```

The database will store these individual ratings and calculate the aggregate neighborhood ratings automatically!

