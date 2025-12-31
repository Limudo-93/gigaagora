-- Fix missing unique constraints used by ON CONFLICT clauses

-- push_notification_queue: required for ON CONFLICT (user_id, event_key)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'uq_push_notification_queue_event'
  ) THEN
    ALTER TABLE push_notification_queue
      ADD CONSTRAINT uq_push_notification_queue_event UNIQUE (user_id, event_key);
  END IF;
END $$;

-- cancellation_notifications: required for ON CONFLICT in older rpc
CREATE UNIQUE INDEX IF NOT EXISTS idx_cancellation_notifications_unique
ON cancellation_notifications(contractor_id, gig_id, invite_id)
WHERE read_at IS NULL;
