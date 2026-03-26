# Notification System

## PRODUCT

### Problem Statement
The current trial banner takes up valuable vertical space and pushes down the permits table, creating a poor user experience. Users need to be aware of important account notifications (trial ending, payment failures, etc.) without sacrificing screen real estate.

### Solution Overview
Replace the top banner with a notification bell icon positioned next to the user avatar. Clicking the bell opens a popover showing all active notifications, including trial status, payment issues, and other account alerts.

### User Experience Flow

**Notification Bell Button:**
- Position: Fixed top-right, left of user avatar
- Visual indicator: Badge with count of unread notifications
- Click behavior: Opens notification popover

**Notification Popover:**
- Clean list of notifications sorted by priority and timestamp
- Each notification shows:
  - Icon (based on severity/type)
  - Title
  - Description
  - Timestamp
  - Action button (e.g., "Manage Subscription", "Dismiss")
- Empty state: "No notifications"
- Mark all as read option

**Notification Types:**
1. **Trial Notifications**
   - Trial active (>1 day remaining): Info severity
   - Trial ending soon (1 day remaining): Warning severity
   - Trial expired: Critical severity

2. **Payment Notifications**
   - Payment failed (past_due status): Critical severity
   - Payment method expiring soon: Warning severity

3. **Account Notifications**
   - Setup incomplete (missing address, categories): Info severity
   - Profile update reminders: Info severity

4. **Future Considerations**
   - New permit matches in your area (real-time alerts)
   - System maintenance notifications
   - Feature announcements

### Notification Priority
- Critical (red): Payment failures, trial expired, access blocked
- Warning (orange): Trial ending soon (1 day), payment method issues
- Info (blue): Trial active, setup reminders, feature updates

### User Settings
Future enhancement: Allow users to configure notification preferences in account settings
- Enable/disable notification types
- Email vs in-app notifications
- Notification frequency

### Edge Cases
- Admin users: Don't show trial/payment notifications unless debug mode active
- Multiple notifications: Show all, sorted by priority then timestamp
- Dismissed notifications: Track dismissals, don't show again for same event
- Notification expiry: Auto-dismiss certain notifications after resolution

---

## TECH

### Database Schema

**New Table: `user_notifications`**
```sql
CREATE TABLE user_notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Notification details
  notification_type VARCHAR(50) NOT NULL, -- 'trial_active', 'trial_ending', 'trial_expired', 'payment_failed', 'setup_incomplete'
  severity VARCHAR(20) NOT NULL, -- 'info', 'warning', 'critical'
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  
  -- Notification state
  is_read BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  read_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,
  
  -- Metadata
  action_url TEXT, -- e.g., '/api/stripe/create-portal-session'
  action_label TEXT, -- e.g., 'Manage Subscription'
  metadata JSONB, -- Store additional context (e.g., days_left, trial_end_date)
  
  -- Expiry
  expires_at TIMESTAMPTZ, -- Auto-dismiss after this time
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Indexes
  CONSTRAINT unique_active_notification UNIQUE (user_id, notification_type, is_dismissed)
);

-- Indexes for performance
CREATE INDEX idx_user_notifications_user_id ON user_notifications(user_id);
CREATE INDEX idx_user_notifications_unread ON user_notifications(user_id, is_read) WHERE is_dismissed = FALSE;
CREATE INDEX idx_user_notifications_active ON user_notifications(user_id) WHERE is_dismissed = FALSE AND (expires_at IS NULL OR expires_at > NOW());
```

**Migration Considerations:**
- Add RLS policies to ensure users can only read/update their own notifications
- Automatically cleanup expired notifications with a daily cron job

### API Endpoints

**1. GET `/api/notifications`**
- Fetch active notifications for current user
- Query params: `?unread_only=true`
- Returns: Array of notifications sorted by priority and created_at
- Auth: Requires authenticated user

**2. PATCH `/api/notifications/:id/read`**
- Mark notification as read
- Auth: Requires authenticated user, must own notification

**3. PATCH `/api/notifications/:id/dismiss`**
- Dismiss (soft delete) notification
- Auth: Requires authenticated user, must own notification

**4. PATCH `/api/notifications/read-all`**
- Mark all notifications as read
- Auth: Requires authenticated user

### Notification Generation Logic

**Subscription Status Hook**
Create server-side function that generates/updates notifications based on subscription state:

```typescript
// lib/notifications.ts
async function syncSubscriptionNotifications(userId: string) {
  const user = await fetchUser(userId)
  
  // Clear old subscription-related notifications
  await dismissNotificationType(userId, ['trial_active', 'trial_ending', 'trial_expired', 'payment_failed'])
  
  // Generate new notifications based on current state
  if (user.subscription_status === 'trialing') {
    const daysLeft = getDaysLeftInTrial(user)
    
    if (daysLeft > 1) {
      await createNotification({
        userId,
        type: 'trial_active',
        severity: 'info',
        title: 'Trial Active',
        description: `${daysLeft} days remaining in your trial`,
        actionUrl: '/api/stripe/create-portal-session',
        actionLabel: 'Manage Subscription',
        metadata: { daysLeft, trialEndDate: user.trial_end }
      })
    } else if (daysLeft === 1) {
      await createNotification({
        userId,
        type: 'trial_ending',
        severity: 'warning',
        title: 'Trial Ending Soon',
        description: 'Your trial ends tomorrow. Update payment method to continue.',
        actionUrl: '/api/stripe/create-portal-session',
        actionLabel: 'Add Payment Method',
        metadata: { daysLeft: 1 }
      })
    }
  } else if (user.subscription_status === 'past_due') {
    await createNotification({
      userId,
      type: 'payment_failed',
      severity: 'critical',
      title: 'Payment Failed',
      description: 'Update your payment method to continue access',
      actionUrl: '/api/stripe/create-portal-session',
      actionLabel: 'Update Payment Method'
    })
  }
}
```

**When to Sync Notifications:**
1. On user login (check subscription status)
2. After Stripe webhook events (subscription updated, payment failed, etc.)
3. Daily cron job to update trial countdown notifications
4. On demand when fetching notifications (check if sync needed)

### Components

**1. NotificationBell Component**
```
/src/components/notifications/NotificationBell.tsx
```
- Shows bell icon with badge count
- Floating top-right, left of UserAvatar
- Uses Popover for dropdown
- Fetches notifications via React Query

**2. NotificationList Component**
```
/src/components/notifications/NotificationList.tsx
```
- Displays list of notifications inside popover
- Groups by priority
- Shows empty state
- Handles mark as read/dismiss actions

**3. NotificationItem Component**
```
/src/components/notifications/NotificationItem.tsx
```
- Individual notification card
- Icon based on severity
- Action button
- Dismiss button

### React Query Integration

**Queries:**
- `useNotifications()` - Fetch active notifications
- Refetch on window focus
- Poll every 5 minutes for updates
- Invalidate after webhook events

**Mutations:**
- `useMarkNotificationRead()` - Mark notification as read
- `useDismissNotification()` - Dismiss notification
- `useMarkAllNotificationsRead()` - Mark all as read
- Optimistic updates for better UX

### Migration from TrialBanner

**Phase 1: Add Notification System**
1. Create database table and migrations
2. Build notification API endpoints
3. Create notification components
4. Add notification bell to app layout

**Phase 2: Generate Initial Notifications**
1. Run migration script to generate notifications for existing users based on subscription_status
2. Add webhook handler to sync notifications on subscription changes

**Phase 3: Remove TrialBanner**
1. Remove TrialBanner component from app/page.tsx
2. Delete TrialBanner component file
3. Update tests

### Performance Considerations

**Database:**
- Index on user_id + is_dismissed for fast filtering
- Unique constraint prevents duplicate active notifications
- Expires_at allows automatic cleanup

**Caching:**
- React Query caches notifications client-side
- Stale-while-revalidate pattern for background updates
- Optimistic updates for mark as read/dismiss

**Webhook Processing:**
- Async notification generation (don't block webhook response)
- Queue-based processing for high volume (future enhancement)

### RLS Policies

```sql
-- Users can only read their own notifications
CREATE POLICY "Users can read own notifications" ON user_notifications
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only update their own notifications
CREATE POLICY "Users can update own notifications" ON user_notifications
  FOR UPDATE USING (auth.uid() = user_id);

-- System can insert notifications for any user (via service role)
CREATE POLICY "Service role can insert notifications" ON user_notifications
  FOR INSERT WITH CHECK (true);
```

### Testing Strategy

**Unit Tests:**
- Notification generation logic
- Priority sorting
- Expiry handling

**Integration Tests:**
- API endpoints (CRUD operations)
- Webhook → notification generation flow
- RLS policy enforcement

**E2E Tests:**
- Bell icon displays correct count
- Clicking bell shows notifications
- Marking as read updates UI
- Dismissing removes notification

---

## IMPLEMENTATION STEPS

### Step 1: Database Setup
- Create `user_notifications` table migration
- Add RLS policies
- Add indexes

### Step 2: Core API Endpoints
- `GET /api/notifications` - Fetch notifications
- `PATCH /api/notifications/:id/read` - Mark as read
- `PATCH /api/notifications/:id/dismiss` - Dismiss notification

### Step 3: Notification Generation Utility
- Create `lib/notifications.ts` with helper functions
- Implement `syncSubscriptionNotifications()`
- Test notification generation logic

### Step 4: Basic UI Components
- Create `NotificationBell` component
- Create `NotificationList` component
- Create `NotificationItem` component
- Add to app layout next to UserAvatar

### Step 5: React Query Integration
- Create custom hooks for notifications
- Implement mutations (read, dismiss)
- Add optimistic updates

### Step 6: Sync Notifications
- Add webhook handler to sync on subscription changes
- Create one-time migration script for existing users
- Add daily cron to update trial countdown notifications

### Step 7: Remove TrialBanner
- Remove TrialBanner from app layout
- Delete TrialBanner component
- Update tests

### Step 8: Polish & Testing
- Add empty states
- Add loading states
- Add error handling
- Write tests

