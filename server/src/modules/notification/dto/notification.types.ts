export type NotificationType =
  | 'record_approved'
  | 'record_rejected'
  | 'record_pending_review'
  | 'organizer_approved'
  | 'organizer_rejected'
  | 'post_liked'
  | 'comment_liked'
  | 'post_commented'
  | 'comment_replied'
  | 'system';

export interface NotificationPayload {
  recordId?: string;
  trackId?: string;
  trackName?: string;
  postId?: string;
  commentId?: string;
  applicationId?: string;
  actorId?: string;
  actorNickName?: string;
  linkPath?: string;
}

export interface NotificationItem {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  payload?: NotificationPayload;
  isRead: boolean;
  createdAt: string;
}

export interface NotificationListQuery {
  page: number;
  pageSize: number;
  unreadOnly?: boolean;
}
