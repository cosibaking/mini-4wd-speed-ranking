import type { RowDataPacket } from 'mysql2/promise';

import { execute, queryOne } from '../../lib/mysql.js';

type LikeTargetType = 'post' | 'comment';

export class LikeRepository {
  async findLike(userId: string, targetType: LikeTargetType, targetId: string) {
    return queryOne<RowDataPacket>(
      'SELECT * FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ? LIMIT 1',
      [userId, targetType, targetId],
    );
  }

  async create(userId: string, targetType: LikeTargetType, targetId: string): Promise<void> {
    await execute(
      'INSERT INTO likes (user_id, target_type, target_id, created_at) VALUES (?, ?, ?, NOW(3))',
      [userId, targetType, targetId],
    );
  }

  async delete(userId: string, targetType: LikeTargetType, targetId: string): Promise<void> {
    await execute(
      'DELETE FROM likes WHERE user_id = ? AND target_type = ? AND target_id = ?',
      [userId, targetType, targetId],
    );
  }
}

export const likeRepository = new LikeRepository();
