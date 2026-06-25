CREATE TABLE notifications (
  id          CHAR(36)     NOT NULL PRIMARY KEY,
  user_id     CHAR(36)     NOT NULL COMMENT '接收者',
  type        ENUM(
    'record_approved',
    'record_rejected',
    'organizer_approved',
    'organizer_rejected',
    'post_liked',
    'comment_liked',
    'post_commented',
    'comment_replied',
    'system'
  ) NOT NULL,
  title       VARCHAR(100) NOT NULL,
  content     VARCHAR(500) NOT NULL,
  payload     JSON         NULL COMMENT '跳转上下文',
  is_read     TINYINT(1)   NOT NULL DEFAULT 0,
  created_at  DATETIME(3)  NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  INDEX idx_notifications_user_time (user_id, created_at DESC),
  INDEX idx_notifications_user_unread (user_id, is_read, created_at DESC),
  CONSTRAINT fk_notifications_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
