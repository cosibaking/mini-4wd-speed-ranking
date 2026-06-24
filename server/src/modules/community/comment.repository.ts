import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';

import { execute, query, queryOne, withTransaction } from '../../lib/mysql.js';

interface CommentRow extends RowDataPacket {
  id: string;
  post_id: string;
  parent_id: string | null;
  author_id: string;
  content: string;
  like_count: number;
  created_at: Date;
}

interface CommentImageDbRow extends RowDataPacket {
  id: number;
  comment_id: string;
  image_url: string;
  sort_order: number;
}

interface UserBriefRow extends RowDataPacket {
  id: string;
  nick_name: string;
  avatar_url: string;
}

export interface CommentRecord {
  id: string;
  postId: string;
  parentId: string | null;
  authorId: string;
  content: string;
  likeCount: number;
  createdAt: Date;
  imageUrls: string[];
  author: { id: string; nickName: string; avatarUrl: string };
}

function groupImagesByCommentId(rows: CommentImageDbRow[]): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const row of rows) {
    const list = map.get(row.comment_id) ?? [];
    list.push(row.image_url);
    map.set(row.comment_id, list);
  }
  return map;
}

async function mapComment(row: CommentRow, imageUrls: string[]): Promise<CommentRecord> {
  const author = await queryOne<UserBriefRow>(
    'SELECT id, nick_name, avatar_url FROM users WHERE id = ? LIMIT 1',
    [row.author_id],
  );

  return {
    id: row.id,
    postId: row.post_id,
    parentId: row.parent_id,
    authorId: row.author_id,
    content: row.content,
    likeCount: row.like_count,
    createdAt: row.created_at,
    imageUrls,
    author: author
      ? { id: author.id, nickName: author.nick_name, avatarUrl: author.avatar_url }
      : { id: row.author_id, nickName: '', avatarUrl: '' },
  };
}

async function loadCommentImages(commentId: string): Promise<string[]> {
  const rows = await query<CommentImageDbRow>(
    'SELECT * FROM comment_images WHERE comment_id = ? ORDER BY sort_order ASC',
    [commentId],
  );
  return rows.map((row) => row.image_url);
}

export class CommentRepository {
  async findById(commentId: string) {
    const row = await queryOne<CommentRow>(
      'SELECT * FROM comments WHERE id = ? LIMIT 1',
      [commentId],
    );
    if (!row) {
      return null;
    }
    const imageUrls = await loadCommentImages(commentId);
    return mapComment(row, imageUrls);
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

    let imagesByComment = new Map<string, string[]>();
    if (rows.length > 0) {
      const placeholders = rows.map(() => '?').join(', ');
      const imageRows = await query<CommentImageDbRow>(
        `SELECT * FROM comment_images WHERE comment_id IN (${placeholders}) ORDER BY sort_order ASC`,
        rows.map((row) => row.id),
      );
      imagesByComment = groupImagesByCommentId(imageRows);
    }

    const mapped = await Promise.all(
      rows.map((row) => mapComment(row, imagesByComment.get(row.id) ?? [])),
    );
    return { rows: mapped, total: Number(countRow?.count ?? 0) };
  }

  async create(
    postId: string,
    authorId: string,
    content: string,
    imageUrls: string[],
    parentId?: string | null,
  ) {
    const id = randomUUID();

    return withTransaction(async () => {
      await execute(
        'INSERT INTO comments (id, post_id, parent_id, author_id, content, like_count, created_at) VALUES (?, ?, ?, ?, ?, 0, NOW(3))',
        [id, postId, parentId ?? null, authorId, content],
      );

      for (let i = 0; i < imageUrls.length; i += 1) {
        await execute(
          'INSERT INTO comment_images (comment_id, image_url, sort_order) VALUES (?, ?, ?)',
          [id, imageUrls[i], i],
        );
      }

      const comment = await this.findById(id);
      if (!comment) {
        throw new Error('failed to create comment');
      }
      return comment;
    });
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
