# Admin Moderation System Guide

## Overview
A comprehensive moderation system that allows admins to issue warnings, cooling off periods, and bans to users who violate community guidelines.

## Features

### 1. Warning System
- **Purpose**: Issue warnings for minor violations
- **Tracking**: Accumulates warning count per user
- **Notification**: Automatic notification sent to user
- **Action**: Warning logged in moderation history

### 2. Cooling Off Period
- **Purpose**: Temporary restriction for repeated violations
- **Durations**: 3, 6, or 12 months
- **Restriction**: User cannot post reviews during this period
- **Notification**: User receives explanation and duration

### 3. Ban System
- **Purpose**: Temporary or permanent account suspension
- **Durations**: 3, 6, 12 months, or permanent
- **Restriction**: Complete platform access blocked
- **Notification**: User receives ban reason and appeal information

### 4. Account Restoration
- **Purpose**: Lift cooling off periods or bans
- **Process**: One-click restore button for admins
- **Notification**: User notified of restored access

### 5. User Profile Status
- **Banners**: Visual indicators on user profiles
- **Real-time**: Status checked on all rate pages
- **Automated**: Blocks access based on current status

## Database Schema

### New Columns in `user_profiles`
```sql
- warning_count: INTEGER (default 0)
- status: VARCHAR(50) (default 'active')
- banned_until: TIMESTAMP WITH TIME ZONE
- cooled_until: TIMESTAMP WITH TIME ZONE
- moderation_reason: TEXT
- moderated_by: UUID (references auth.users)
- moderated_at: TIMESTAMP WITH TIME ZONE
```

### New Table: `user_moderation_log`
Tracks all moderation actions:
- `id`: UUID (primary key)
- `user_id`: UUID (references auth.users)
- `action`: VARCHAR(50) ('warning', 'cooling_off', 'ban', 'unban')
- `duration_months`: INTEGER (null for permanent)
- `reason`: TEXT
- `moderated_by`: UUID (references auth.users)
- `created_at`: TIMESTAMP WITH TIME ZONE

## Setup Instructions

### 1. Run SQL Script
Execute `ADMIN_MODERATION_SYSTEM.sql` in your Supabase SQL editor:

```bash
# The script will:
# - Add moderation columns to user_profiles
# - Create user_moderation_log table
# - Set up RLS policies
# - Create helper functions
```

### 2. Verify Admin Users Table
Make sure your admin users page is accessible at `/admin/users`

### 3. Test Moderation Actions
1. Go to `/admin/users`
2. Select a test user
3. Try each action:
   - Issue a warning
   - Apply cooling off period
   - Ban user
   - Restore account

## User Experience

### When Warned
- Notification appears in their inbox
- Warning count shows on profile
- Yellow banner on profile page
- Can continue using platform normally

### During Cooling Off
- Blue banner on profile
- Cannot access rate pages
- Automatic redirect with explanation
- Notification with end date

### When Banned
- Red banner on profile
- Complete platform restriction
- Clear ban reason displayed
- Appeal information provided

### Profile Status Banner
- Automatic display based on status
- Color-coded (yellow/blue/red)
- Shows expiration dates
- Links to support if needed

## Admin Interface

### User Management Page
Located at `/admin/users`, features:

1. **Stats Dashboard**
   - Total users
   - Admin count
   - Active users
   - Warned users
   - Banned users

2. **Search & Filter**
   - Search by email or name
   - Real-time filtering

3. **User Actions**
   - Make/Remove Admin
   - Issue Warning
   - Apply Cooling Off
   - Ban User
   - Restore Account
   - Delete User

4. **Modals**
   - Reason required for all actions
   - Duration selection for cooling/bans
   - Confirmation before destructive actions

## Code Integration

### Rate Page Protection
All rate pages (`/rate/neighborhood`, `/rate/building`, `/rate/landlord`) now check user status on load:

```typescript
// Automatic status check
if (profile?.status === 'banned') {
  // Block access and redirect
}
if (profile?.status === 'cooled') {
  // Block access and redirect
}
```

### Profile Page Banner
Automatic status display on `/profile`:
- Checks for warnings, cooling, or bans
- Shows appropriate banner
- Displays expiration dates

### Notification System
All moderation actions trigger notifications:
- Warning notifications
- Cooling off notifications
- Ban notifications
- Restore notifications

## Security

### Row Level Security (RLS)
- Moderation logs: Admin-only access
- User profiles: Standard RLS
- Notifications: User-only access

### Admin Verification
- All actions require authenticated admin
- Logging of all moderation actions
- Audit trail for compliance

## Best Practices

### Issuing Warnings
- Start with warnings for minor violations
- Escalate to cooling off if warnings accumulate
- Provide clear, specific reasons

### Cooling Off Periods
- Use for repeated violations
- Set appropriate duration (3-12 months)
- Document reason in detail

### Bans
- Reserved for severe violations
- Always provide clear reason
- Consider temporary bans first
- Permanent bans only for extreme cases

### Communication
- Always provide specific reasons
- Be professional in language
- Include contact information for appeals

## Future Enhancements

Potential additions:
- Appeal system for banned users
- Automated escalation (3 warnings → cooling off)
- Email notifications (not just in-app)
- Moderation dashboard analytics
- Auto-lift expired bans/cooling periods
- Bulk moderation actions

## Support

For issues or questions:
1. Check admin logs in `user_moderation_log`
2. Review user notifications
3. Verify RLS policies
4. Test with a test user account

## Files Modified/Created

### New Files
- `ADMIN_MODERATION_SYSTEM.sql` - Database setup
- `lib/userModeration.ts` - Status checking utilities
- `ADMIN_MODERATION_GUIDE.md` - This guide

### Modified Files
- `app/admin/users/page.tsx` - Complete redesign with modern UI
- `app/profile/page.tsx` - Added status banner
- `app/rate/neighborhood/page.tsx` - Added status checks
- `app/rate/building/page.tsx` - Added status checks
- `app/rate/landlord/page.tsx` - Added status checks

## Summary

The moderation system provides admins with powerful tools to maintain community standards while ensuring users understand actions taken against their accounts. The system is transparent, automated, and provides clear communication channels for both admins and users.



