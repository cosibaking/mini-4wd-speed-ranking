import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';

import { execute, query, queryOne } from '../../lib/mysql.js';

interface CommentRow extends RowDataPacket {
  id: string;
  post_id: string;
  author_id: string;
  content: string;
  like_count: number;
  created_at: Date;
}

interface UserBriefRow extends RowDataPacket {
  id: string;
  nick_name: string;
  avatar_url: string;
}

export interface CommentRecord {
  id: string;
  postId: string;
  authorId: string;
  content: string;
  likeCount: number;
  createdAt: Date;
  author: { id: string; nickName: string; avatarUrl: string };
}

async function mapComment(row: CommentRow): Promise<CommentRecord> {
  const author = await queryOne<UserBriefRow>(
    'SELECT id, nick_name, avatar_url FROM users WHERE id = ? LIMIT 1',
    [row.author_id],
  );

  return {
    id: row.id,
    postId: row.post_id,
    authorId: row.author_id,
    content: row.content,
    likeCount: row.like_count,
    createdAt: row.created_at,
    author: author
      ? { id: author.id, nickName: author.nick_name, avatarUrl: author.avatar_url }
      : { id: row.author_id, nickName: '', avatarUrl: '' },
  };
}

export class CommentRepository {
  async findById(commentId: string) {
    const row = await queryOne<CommentRow>(
      'SELECT * FROM comments WHERE id = ? LIMIT 1',
      [commentId],
    );
    return row ? mapComment(row) : null;
  }

  async listByPost(postId: string, skip: number, take: number) {
    const [rows, countRow] = await Promise.all([
      query<CommentRow>(
        'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at ASC LIMIT ? OFFSET ?',
        [postId, take, skip],
      ),
      queryOne<RowDataPacket & { count: number }>(
        'SELECT COUNT(*) AS count FROM comments WHERE post_id = ?',
        [postId],
      ),
    ]);

    const mapped = await Promise.all(rows.map(mapComment));
    return { rows: mapped, total: Number(countRow?.count ?? 0) };
  }

  async create(postId: string, authorId: string, content: string) {
    const id = randomUUID();
    await execute(
      'INSERT INTO comments (id, post_id, author_id, content, like_count, created_at) VALUES (?, ?, ?, ?, 0, NOW(3))',
      [id, postId, authorId, content],
    );

    const comment = await this.findById(id);
    if (!comment) {
      throw new Error('failed to create comment');
    }
    return comment;
  }

  async updateLikeCount(commentId: string, delta: number): Promise<number> {
    const comment = await queryOne<RowDataPacket & { like_count: number }>(
      'SELECT like_count FROM comments WHERE id = ? LIMIT 1',
      [commentId],
    );

    if (!comment) {
      throw new Error('comment not found');
    }

    const likeCount = Math.max(0, comment.like_count + delta);
    await execute('UPDATE comments SET like_count = ? WHERE id = ?', [likeCount, commentId]);

    return likeCount;
  }

  async findLikedCommentIds(userId: string, commentIds: string[]): Promise<Set<string>> {
    if (commentIds.length === 0) {
      return new Set();
    }

    const placeholders = commentIds.map(() => '?').join(', ');
    const likes = await query<RowDataPacket & { target_id: string }>(
      `SELECT target_id FROM likes
       WHERE user_id = ? AND target_type = 'comment' AND target_id IN (${placeholders})`,
      [userId, ...commentIds],
    );

    return new Set(likes.map((like) => like.target_id));
  }
}

export const commentRepository = new CommentRepository();
