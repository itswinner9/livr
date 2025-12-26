-- Add DELETE policy for notifications
-- Users should be able to delete their own notifications

DROP POLICY IF EXISTS "Users can delete own notifications" ON notifications;

CREATE POLICY "Users can delete own notifications" ON notifications
  FOR DELETE USING (auth.uid() = user_id);

-- Success message
SELECT '✅ Notification DELETE policy added successfully!' AS result;
