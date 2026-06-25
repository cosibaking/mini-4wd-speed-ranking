import { request } from './http';
import type { NotificationItem, PaginationQuery, PaginationResult } from '../types';

export function getNotifications(
  query: PaginationQuery & { unreadOnly?: boolean } = {},
): Promise<PaginationResult<NotificationItem>> {
  const params: Record<string, string | number> = {};
  if (query.page) params.page = query.page;
  if (query.pageSize) params.pageSize = query.pageSize;
  if (query.unreadOnly) params.unreadOnly = '1';

  const qs = Object.keys(params).length
    ? `?${Object.entries(params)
        .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
        .join('&')}`
    : '';

  return request<PaginationResult<NotificationItem>>(`/notifications${qs}`);
}

export function getNotification(id: string): Promise<NotificationItem> {
  return request<NotificationItem>(`/notifications/${id}`);
}

export function getUnreadNotificationCount(): Promise<{ count: number }> {
  return request<{ count: number }>('/notifications/unread-count');
}

export function markNotificationRead(id: string): Promise<{ success: true }> {
  return request<{ success: true }>(`/notifications/${id}/read`, { method: 'POST' });
}

export function markAllNotificationsRead(): Promise<{ updated: number }> {
  return request<{ updated: number }>('/notifications/read-all', { method: 'POST' });
}

export const NOTIFICATION_TYPE_LABEL: Record<NotificationItem['type'], string> = {
  record_approved: '成绩',
  record_rejected: '成绩',
  record_pending_review: '审核',
  organizer_approved: '主理人',
  organizer_rejected: '主理人',
  post_liked: '点赞',
  comment_liked: '点赞',
  post_commented: '评论',
  comment_replied: '回复',
  system: '系统',
};
