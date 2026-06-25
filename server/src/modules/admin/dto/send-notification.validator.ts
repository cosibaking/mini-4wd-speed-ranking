import { ValidationError } from '../../../shared/errors.js';

export interface SendAdminNotificationInput {
  title: string;
  content: string;
  userId?: string;
  userIds?: string[];
}

export function validateSendAdminNotification(body: unknown): SendAdminNotificationInput {
  if (!body || typeof body !== 'object') {
    throw new ValidationError('请求体无效');
  }

  const raw = body as Record<string, unknown>;
  const title = typeof raw.title === 'string' ? raw.title.trim() : '';
  const content = typeof raw.content === 'string' ? raw.content.trim() : '';
  const userId =
    typeof raw.userId === 'string' && raw.userId.trim() ? raw.userId.trim() : undefined;
  const userIds = Array.isArray(raw.userIds)
    ? [...new Set(raw.userIds.filter((id): id is string => typeof id === 'string' && !!id.trim()).map((id) => id.trim()))]
    : undefined;

  if (!title) {
    throw new ValidationError('标题不能为空');
  }
  if (title.length > 100) {
    throw new ValidationError('标题不能超过 100 字');
  }
  if (!content) {
    throw new ValidationError('内容不能为空');
  }
  if (content.length > 500) {
    throw new ValidationError('内容不能超过 500 字');
  }

  if (userId && userIds && userIds.length > 0) {
    throw new ValidationError('不能同时指定 userId 与 userIds');
  }

  return { title, content, userId, userIds: userIds?.length ? userIds : undefined };
}
