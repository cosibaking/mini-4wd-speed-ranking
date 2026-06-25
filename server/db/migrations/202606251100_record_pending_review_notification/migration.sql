ALTER TABLE notifications
  MODIFY COLUMN type ENUM(
    'record_approved',
    'record_rejected',
    'record_pending_review',
    'organizer_approved',
    'organizer_rejected',
    'post_liked',
    'comment_liked',
    'post_commented',
    'comment_replied',
    'system'
  ) NOT NULL;
