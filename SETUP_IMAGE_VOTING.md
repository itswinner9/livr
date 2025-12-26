# Setup Image Voting System

This guide will help you set up the image voting system that allows users to like/dislike reviews.

## What This Does

✅ Users can **upload images** when rating neighborhoods/buildings/landlords  
✅ Other users can **see all uploaded images** in reviews  
✅ Users can **like or dislike reviews** from other users  
✅ Most liked reviews show up **first** (sorted by helpful_count - not_helpful_count)  
✅ Users can **change their vote** (click like again to unlike, or switch from like to dislike)  
✅ **Interactive buttons** with hover effects and animations

## Step 1: Run the SQL Setup

1. Go to your Supabase Dashboard
2. Click on **SQL Editor**
3. Create a new query
4. Copy and paste the entire contents of `CREATE_IMAGE_VOTING_SYSTEM.sql`
5. Click **Run**
6. You should see: `✅ Image voting system created successfully!`

## Step 2: What Was Created

### New Table: `image_votes`
- Stores user votes (like/dislike) on reviews
- Tracks: review_id, image_url, user_id, vote_type (like/dislike)
- Prevents duplicate votes with UNIQUE constraint

### New Columns Added to Review Tables:
- `helpful_count` - Count of likes
- `not_helpful_count` - Count of dislikes

These were added to:
- `neighborhood_reviews`
- `building_reviews`
- `landlord_reviews`
- `rent_company_reviews`

### Indexes Created:
- Fast lookups by review_id
- Fast lookups by user_id
- Fast lookups by image_url

## Step 3: How It Works

### Image Upload:
1. User rates a neighborhood/building/landlord
2. User uploads images using the file picker
3. Images are uploaded to Supabase Storage
4. Image URLs are saved with the review
5. **All users can see these images** when viewing the review

### Voting System:
1. User clicks "Helpful" 👍 or "Not helpful" 👎
2. System checks if user already voted
3. If first time: Creates new vote
4. If already voted:
   - Click same button again = Remove vote
   - Click opposite button = Switch vote
5. Counts update in real-time
6. Reviews are sorted by most helpful first

### Sorting Algorithm:
```
Most Helpful Score = helpful_count - not_helpful_count
```
- Higher score = shown first
- If same score = newer reviews shown first

## Step 4: Test It

1. **Upload Images:**
   - Rate a neighborhood
   - Click "Choose images"
   - Select 1-5 images
   - Submit your review
   - Go to the neighborhood detail page
   - Your images should appear in a grid!

2. **Test Voting:**
   - View someone else's review
   - Click "Helpful (0)"
   - Should update to "Helpful (1)"
   - Click again = Remove your vote
   - Click "Not helpful" = Switch to dislike

3. **Verify Sorting:**
   - Vote on multiple reviews
   - The review with highest score (helpful - not helpful) should appear first

## Step 5: Verify in Database

Check your Supabase Dashboard:

```sql
-- See all votes
SELECT * FROM image_votes;

-- See helpful counts
SELECT id, helpful_count, not_helpful_count 
FROM neighborhood_reviews;

-- See top helpful reviews
SELECT id, helpful_count - not_helpful_count as score
FROM neighborhood_reviews
ORDER BY score DESC;
```

## Troubleshooting

### Images Not Uploading?
- Check Supabase Storage bucket exists
- Verify bucket has public read permissions
- Check file size (should be < 5MB per image)

### Votes Not Working?
- Make sure you're logged in
- Check browser console for errors
- Verify `image_votes` table was created
- Verify `helpful_count` and `not_helpful_count` columns exist

### Sorting Not Working?
- Refresh the page
- Check `helpful_count` and `not_helpful_count` are being updated
- Verify the sorting logic in the code

## Features

✨ **Already Implemented:**
- Image uploads for neighborhoods
- Image gallery display on detail pages
- Like/dislike buttons
- Vote counting and sorting
- Real-time count updates
- Hover effects and animations
- Vote switching (like to dislike)
- Vote removal (click same button again)

🎨 **Modern UX:**
- Interactive buttons with hover states
- Color-coded feedback (green for helpful, red for not helpful)
- Smooth transitions
- Real-time updates
- Clear visual feedback

## You're Done! 🎉

The image voting system is now fully set up and ready to use!

Users can now:
- Upload images with their reviews
- View all review images
- Like/dislike reviews
- See the most helpful reviews first

