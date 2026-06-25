import { buildPaginationResult } from '../../shared/pagination.js';
import type { PaginationResult } from '../../shared/types.js';
import type {
  NotificationItem,
  NotificationListQuery,
  NotificationPayload,
  NotificationType,
} from './dto/notification.types.js';
import { notificationNotFoundError } from './errors.js';
import { notificationRepository } from './notification.repository.js';

function toItem(row: {
  id: string;
  type: NotificationType;
  title: string;
  content: string;
  payload?: NotificationPayload;
  isRead: boolean;
  createdAt: Date;
}): NotificationItem {
  return {
    id: row.id,
    type: row.type,
    title: row.title,
    content: row.content,
    payload: row.payload,
    isRead: row.isRead,
    createdAt: row.createdAt.toISOString(),
  };
}

export class NotificationService {
  private async send(params: {
    userId: string;
    actorId?: string;
    type: NotificationType;
    title: string;
    content: string;
    payload?: NotificationPayload;
  }): Promise<void> {
    if (params.actorId && params.actorId === params.userId) {
      return;
    }
    await notificationRepository.create(params);
  }

  async notifyRecordReview(params: {
    userId: string;
    recordId: string;
    trackId: string;
    trackName: string;
    lapTimeDisplay: string;
    approved: boolean;
    reviewNote?: string | null;
  }): Promise<void> {
    const type: NotificationType = params.approved ? 'record_approved' : 'record_rejected';
    const title = params.approved ? '成绩审核通过' : '成绩审核未通过';
    const content = params.approved
      ? `你在「${params.trackName}」提交的 ${params.lapTimeDisplay} 已通过审核`
      : `你在「${params.trackName}」提交的成绩未通过审核${params.reviewNote ? `：${params.reviewNote}` : ''}`;

    await this.send({
      userId: params.userId,
      type,
      title,
      content,
      payload: {
        recordId: params.recordId,
        trackId: params.trackId,
        trackName: params.trackName,
        linkPath: `/pages/record/detail?id=${params.recordId}`,
      },
    });
  }

  async notifyRecordPendingReview(params: {
    organizerId: string;
    submitterId: string;
    submitterNickName: string;
    recordId: string;
    trackId: string;
    trackName: string;
    lapTimeDisplay: string;
  }): Promise<void> {
    // 待审核提醒始终发给主理人（含本人提交到自己赛道的情况，便于从站内信进入审核页）
    await notificationRepository.create({
      userId: params.organizerId,
      type: 'record_pending_review',
      title: '有新的成绩待审核',
      content: `${params.submitterNickName} 在「${params.trackName}」提交了 ${params.lapTimeDisplay}，请及时审核`,
      payload: {
        recordId: params.recordId,
        trackId: params.trackId,
        trackName: params.trackName,
        actorId: params.submitterId,
        actorNickName: params.submitterNickName,
        linkPath: `/pages/organizer/review?id=${params.recordId}`,
      },
    });
  }

  async notifyOrganizerReview(params: {
    userId: string;
    applicationId: string;
    approved: boolean;
    reviewNote?: string | null;
  }): Promise<void> {
    const type: NotificationType = params.approved ? 'organizer_approved' : 'organizer_rejected';
    const title = params.approved ? '主理人认证通过' : '主理人认证未通过';
    const content = params.approved
      ? '恭喜，你的赛道主理人申请已通过，现在可以创建和管理赛道了'
      : `你的主理人申请未通过${params.reviewNote ? `：${params.reviewNote}` : ''}`;

    await this.send({
      userId: params.userId,
      type,
      title,
      content,
      payload: {
        applicationId: params.applicationId,
        linkPath: '/pages/organizer/status',
      },
    });
  }

  async notifyPostLiked(params: {
    userId: string;
    actorId: string;
    actorNickName: string;
    postId: string;
    postTitle: string;
  }): Promise<void> {
    await this.send({
      userId: params.userId,
      actorId: params.actorId,
      type: 'post_liked',
      title: '帖子收到点赞',
      content: `${params.actorNickName} 赞了你的帖子「${params.postTitle}」`,
      payload: {
        postId: params.postId,
        actorId: params.actorId,
        actorNickName: params.actorNickName,
        linkPath: `/pages/community/post?id=${params.postId}`,
      },
    });
  }

  async notifyCommentLiked(params: {
    userId: string;
    actorId: string;
    actorNickName: string;
    postId: string;
    commentId: string;
    commentPreview: string;
  }): Promise<void> {
    const preview =
      params.commentPreview.length > 30
        ? `${params.commentPreview.slice(0, 30)}…`
        : params.commentPreview;

    await this.send({
      userId: params.userId,
      actorId: params.actorId,
      type: 'comment_liked',
      title: '评论收到点赞',
      content: `${params.actorNickName} 赞了你的评论「${preview}」`,
      payload: {
        postId: params.postId,
        commentId: params.commentId,
        actorId: params.actorId,
        actorNickName: params.actorNickName,
        linkPath: `/pages/community/post?id=${params.postId}`,
      },
    });
  }

  async notifyPostCommented(params: {
    userId: string;
    actorId: string;
    actorNickName: string;
    postId: string;
    postTitle: string;
    commentId: string;
    commentPreview: string;
  }): Promise<void> {
    const preview =
      params.commentPreview.length > 30
        ? `${params.commentPreview.slice(0, 30)}…`
        : params.commentPreview;

    await this.send({
      userId: params.userId,
      actorId: params.actorId,
      type: 'post_commented',
      title: '帖子收到评论',
      content: `${params.actorNickName} 评论了你的帖子「${params.postTitle}」：${preview}`,
      payload: {
        postId: params.postId,
        commentId: params.commentId,
        actorId: params.actorId,
        actorNickName: params.actorNickName,
        linkPath: `/pages/community/post?id=${params.postId}`,
      },
    });
  }

  async notifyCommentReplied(params: {
    userId: string;
    actorId: string;
    actorNickName: string;
    postId: string;
    commentId: string;
    commentPreview: string;
  }): Promise<void> {
    const preview =
      params.commentPreview.length > 30
        ? `${params.commentPreview.slice(0, 30)}…`
        : params.commentPreview;

    await this.send({
      userId: params.userId,
      actorId: params.actorId,
      type: 'comment_replied',
      title: '评论收到回复',
      content: `${params.actorNickName} 回复了你：${preview}`,
      payload: {
        postId: params.postId,
        commentId: params.commentId,
        actorId: params.actorId,
        actorNickName: params.actorNickName,
        linkPath: `/pages/community/post?id=${params.postId}`,
      },
    });
  }

  async notifySystem(params: {
    userId: string;
    title: string;
    content: string;
    linkPath?: string;
  }): Promise<void> {
    await this.send({
      userId: params.userId,
      type: 'system',
      title: params.title,
      content: params.content,
      payload: params.linkPath ? { linkPath: params.linkPath } : undefined,
    });
  }

  async list(
    userId: string,
    query: NotificationListQuery,
  ): Promise<PaginationResult<NotificationItem>> {
    const { rows, total } = await notificationRepository.listByUser(userId, query);
    const list = rows.map(toItem);
    return buildPaginationResult(list, total, query);
  }

  async getUnreadCount(userId: string): Promise<{ count: number }> {
    const count = await notificationRepository.countUnread(userId);
    return { count };
  }

  async markRead(userId: string, notificationId: string): Promise<{ success: true }> {
    const row = await notificationRepository.findByIdForUser(notificationId, userId);
    if (!row) {
      throw notificationNotFoundError();
    }
    await notificationRepository.markRead(notificationId, userId);
    return { success: true };
  }

  async markAllRead(userId: string): Promise<{ updated: number }> {
    const updated = await notificationRepository.markAllRead(userId);
    return { updated };
  }
}

export const notificationService = new NotificationService();
