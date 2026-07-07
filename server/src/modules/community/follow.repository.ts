import type { RowDataPacket } from 'mysql2/promise';

import { execute, query, queryOne } from '../../lib/mysql.js';

interface FollowRow extends RowDataPacket {
  follower_id: string;
  followee_id: string;
  created_at: Date;
}

interface UserBriefRow extends RowDataPacket {
  id: string;
  nick_name: string;
  avatar_url: string;
}

export class FollowRepository {
  async findFollow(followerId: string, followeeId: string) {
    return queryOne<FollowRow>(
      'SELECT * FROM follows WHERE follower_id = ? AND followee_id = ? LIMIT 1',
      [followerId, followeeId],
    );
  }

  async create(followerId: string, followeeId: string): Promise<void> {
    await execute(
      'INSERT INTO follows (follower_id, followee_id, created_at) VALUES (?, ?, NOW(3))',
      [followerId, followeeId],
    );
  }

  async delete(followerId: string, followeeId: string): Promise<void> {
    await execute(
      'DELETE FROM follows WHERE follower_id = ? AND followee_id = ?',
      [followerId, followeeId],
    );
  }

  async isFollowing(followerId: string, followeeId: string): Promise<boolean> {
    const row = await this.findFollow(followerId, followeeId);
    return row !== null;
  }

  async countFollowing(userId: string): Promise<number> {
    const row = await queryOne<RowDataPacket & { count: number }>(
      'SELECT COUNT(*) AS count FROM follows WHERE follower_id = ?',
      [userId],
    );
    return Number(row?.count ?? 0);
  }

  async countFollowers(userId: string): Promise<number> {
    const row = await queryOne<RowDataPacket & { count: number }>(
      'SELECT COUNT(*) AS count FROM follows WHERE followee_id = ?',
      [userId],
    );
    return Number(row?.count ?? 0);
  }

  async listFollowing(followerId: string, skip: number, take: number) {
    const [rows, countRow] = await Promise.all([
      query<FollowRow>(
        'SELECT * FROM follows WHERE follower_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [followerId, take, skip],
      ),
      queryOne<RowDataPacket & { count: number }>(
        'SELECT COUNT(*) AS count FROM follows WHERE follower_id = ?',
        [followerId],
      ),
    ]);

    const mapped = await Promise.all(
      rows.map(async (row) => {
        const followee = await queryOne<UserBriefRow>(
          'SELECT id, nick_name, avatar_url FROM users WHERE id = ? LIMIT 1',
          [row.followee_id],
        );
        return {
          followerId: row.follower_id,
          followeeId: row.followee_id,
          createdAt: row.created_at,
          followee: followee
            ? {
                id: followee.id,
                nickName: followee.nick_name,
                avatarUrl: followee.avatar_url,
              }
            : { id: row.followee_id, nickName: '', avatarUrl: '' },
        };
      }),
    );

    return { rows: mapped, total: Number(countRow?.count ?? 0) };
  }
}

export const followRepository = new FollowRepository();
