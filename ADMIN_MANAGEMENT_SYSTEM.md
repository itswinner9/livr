# LivRank Admin Management System

## Overview
The LivRank Admin Dashboard is a comprehensive management platform that allows administrators to oversee and control all aspects of the platform, from user management to content moderation.

## Features Implemented

### 1. **Dashboard Overview** (`/admin`)
- **Real-time Statistics**:
  - Total users registered
  - Pending reviews awaiting approval
  - Approved/rejected reviews count
  - Low ratings alert (< 2 stars)
  - Total neighborhoods, buildings, landlords, and rent companies

- **Quick Actions**:
  - Review pending submissions
  - Manage users and permissions
  - Manage landlords and companies
  - Manage locations (neighborhoods and buildings)

### 2. **Review Management** (`/admin/pending` & `/admin/reviews`)
- **Pending Reviews**: Approve or reject user-submitted reviews
  - All landlord reviews require admin approval
  - Admin can add notes explaining rejection
  - Real-time status updates
  - Filter by review type (neighborhood, building, landlord, company)

- **Review Management**: View all reviews with status
  - Approved reviews are live on the platform
  - Pending reviews await admin action
  - Rejected reviews are hidden from users

### 3. **User Management** (`/admin/users`)
- View all registered users
- Grant or revoke admin privileges
- Monitor user activity and reviews
- Manage user profiles

### 4. **Landlord Management** (`/admin/landlords`) ✨ NEW
- **Features**:
  - View all landlords in the system
  - Search by name, company, or location
  - Verify landlord profiles (checkmark badge)
  - Delete landlords (with confirmation)
  - View detailed landlord information:
    - Profile images
    - Company information
    - Contact details (email, phone, website)
    - Location
    - Overall ratings and review count
    - Verification status

- **Stats Dashboard**:
  - Total landlords
  - Verified landlords
  - Unverified landlords
  - Landlords with ratings

### 5. **Rent Company Management** (`/admin/companies`) ✨ NEW
- **Features**:
  - View all rent companies
  - Search by name or location
  - Verify company profiles
  - Delete companies (with confirmation)
  - View detailed company information:
    - Company logo/images
    - Contact information
    - Location
    - Overall ratings and review count
    - Verification status

- **Stats Dashboard**:
  - Total companies
  - Verified companies
  - Unverified companies
  - Companies with ratings

### 6. **Location Management**
- **Neighborhoods** (`/admin/neighborhoods`): Upload and manage cover images
- **Buildings** (`/admin/buildings`): Upload and manage cover images

## Admin Workflow

### Approving Landlord Reviews
1. Admin logs into `/admin`
2. Sees pending count in dashboard
3. Navigates to `/admin/pending` or `/admin/reviews`
4. Reviews each landlord review submission
5. Can approve (makes review public) or reject (hides from users)
6. If rejecting, must provide admin notes explaining why
7. Approved reviews appear immediately on landlord pages

### Managing Landlords
1. Navigate to `/admin/landlords`
2. Search for specific landlords if needed
3. View landlord details by clicking on a landlord
4. Verify landlords to show them as "Verified" with checkmark
5. Delete landlords if needed (with confirmation)

### Managing Companies
1. Navigate to `/admin/companies`
2. Search for specific companies
3. View company details by clicking on a company
4. Verify companies to show verification badge
5. Delete companies if needed (with confirmation)

## Security Features

### Admin Access Control
- Only users with `is_admin: true` in `user_profiles` table can access admin pages
- Automatic redirect to login if not authenticated
- Access denied message if user is not an admin

### Verification Badges
- Landlords and companies can be verified by admins
- Verified entities display a checkmark badge
- Builds trust in the platform

## Database Schema

### Required Tables
- `user_profiles` - User accounts with admin flags
- `landlords` - Landlord information with verification status
- `landlord_reviews` - Reviews of landlords (all require approval)
- `rent_companies` - Rent company information with verification status
- `neighborhoods` - Neighborhood data
- `buildings` - Building data
- Review tables: `neighborhood_reviews`, `building_reviews`, etc.

### Status Field
All review tables include a `status` field:
- `pending` - Awaiting admin approval
- `approved` - Live on the platform
- `rejected` - Hidden from users

## Setting Up Admins

To make a user an admin, run this SQL in Supabase:

```sql
UPDATE user_profiles 
SET is_admin = true 
WHERE email = 'user@example.com';

-- Or create admin directly:
INSERT INTO user_profiles (id, email, full_name, is_admin)
VALUES ('user-uuid', 'user@example.com', 'Admin Name', true);
```

## Usage Tips

1. **Daily Workflow**: Start with dashboard to see pending items
2. **Priority**: Low ratings (< 2 stars) need attention first
3. **Landlord Reviews**: All require approval - review carefully
4. **Verification**: Verify trusted landlords and companies to build trust
5. **Search**: Use search bars to quickly find specific entities
6. **Stats**: Monitor growth through dashboard statistics

## Future Enhancements

Potential additions to the admin system:
- Analytics and reporting dashboard
- Export data functionality
- Bulk actions (verify multiple entities at once)
- Email notifications for admins
- Activity logs
- Dispute resolution system
- Badge management
- Content moderation queue prioritization
- Automated spam detection

## Notes

- All landlord reviews automatically go to pending status
- Only approved reviews are visible to regular users
- Admin actions are logged in the database (reviewed_by, reviewed_at)
- Admin notes are saved with rejections for transparency

