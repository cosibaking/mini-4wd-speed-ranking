import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';

import { execute, query, queryOne } from '../../lib/mysql.js';
import type {
  NotificationListQuery,
  NotificationPayload,
  NotificationType,
} from './dto/notification.types.js';

interface NotificationRow extends RowDataPacket {
  id: string;
  user_id: string;
  type: NotificationType;
  title: string;
  content: string;
  payload: string | NotificationPayload | null;
  is_read: 0 | 1;
  created_at: Date;
}

function parsePayload(raw: NotificationRow['payload']): NotificationPayload | undefined {
  if (!raw) return undefined;
  if (typeof raw === 'object') return raw;
  try {
    return JSON.parse(raw) as NotificationPayload;
  } catch {
    return undefined;
  }
}

function mapRow(row: NotificationRow) {
  return {
    id: row.id,
    userId: row.user_id,
    type: row.type,
    title: row.title,
    content: row.content,
    payload: parsePayload(row.payload),
    isRead: row.is_read === 1,
    createdAt: row.created_at,
  };
}

export class NotificationRepository {
  async create(params: {
    userId: string;
    type: NotificationType;
    title: string;
    content: string;
    payload?: NotificationPayload;
  }): Promise<string> {
    const id = randomUUID();
    await execute(
      `INSERT INTO notifications (id, user_id, type, title, content, payload, is_read, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 0, NOW(3))`,
      [
        id,
        params.userId,
        params.type,
        params.title,
        params.content,
        params.payload ? JSON.stringify(params.payload) : null,
      ],
    );
    return id;
  }

  async listByUser(userId: string, queryParams: NotificationListQuery) {
    const skip = (queryParams.page - 1) * queryParams.pageSize;
    const unreadFilter = queryParams.unreadOnly ? 'AND is_read = 0' : '';

    const rows = await query<NotificationRow>(
      `SELECT * FROM notifications
       WHERE user_id = ? ${unreadFilter}
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [userId, queryParams.pageSize, skip],
    );

    const countRow = await queryOne<RowDataPacket & { total: number }>(
      `SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? ${unreadFilter}`,
      [userId],
    );

    return {
      rows: rows.map(mapRow),
      total: Number(countRow?.total ?? 0),
    };
  }

  async countUnread(userId: string): Promise<number> {
    const row = await queryOne<RowDataPacket & { total: number }>(
      'SELECT COUNT(*) AS total FROM notifications WHERE user_id = ? AND is_read = 0',
      [userId],
    );
    return Number(row?.total ?? 0);
  }

  async findByIdForUser(id: string, userId: string) {
    const row = await queryOne<NotificationRow>(
      'SELECT * FROM notifications WHERE id = ? AND user_id = ? LIMIT 1',
      [id, userId],
    );
    return row ? mapRow(row) : null;
  }

  async markRead(id: string, userId: string): Promise<boolean> {
    const result = await execute(
      'UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ? AND is_read = 0',
      [id, userId],
    );
    return result.affectedRows > 0;
  }

  async markAllRead(userId: string): Promise<number> {
    const result = await execute(
      'UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0',
      [userId],
    );
    return result.affectedRows;
  }
}

export const notificationRepository = new NotificationRepository();
