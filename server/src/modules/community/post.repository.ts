import { randomUUID } from 'node:crypto';
import type { ExecuteValues, RowDataPacket } from 'mysql2/promise';

import { execute, query, queryOne, withTransaction } from '../../lib/mysql.js';
import { calcHotScore } from './hotScore.util.js';

interface BoardRow extends RowDataPacket {
  id: string;
  name: string;
  description: string | null;
  sort_order: number;
  created_at: Date;
}

interface PostDbRow extends RowDataPacket {
  id: string;
  board_id: string;
  author_id: string;
  track_id: string | null;
  title: string;
  content: string;
  like_count: number;
  comment_count: number;
  hot_score: number;
  deleted: number;
  deleted_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

interface PostImageDbRow extends RowDataPacket {
  id: number;
  post_id: string;
  image_url: string;
  sort_order: number;
}

interface TrackBriefRow extends RowDataPacket {
  id: string;
  name: string;
}

export interface PostImage {
  id: number;
  postId: string;
  imageUrl: string;
  sortOrder: number;
}

export type PostWithRelations = {
  id: string;
  boardId: string;
  authorId: string;
  trackId: string | null;
  title: string;
  content: string;
  likeCount: number;
  commentCount: number;
  hotScore: number;
  deleted: boolean;
  deletedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  images: PostImage[];
  board: { id: string; name: string };
  track: Pick<TrackBriefRow, 'id' | 'name'> | null;
};

function mapBoard(row: BoardRow) {
  return {
    id: row.id,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
    createdAt: row.created_at,
  };
}

function mapPost(
  row: PostDbRow,
  images: PostImageDbRow[],
  board: BoardRow | null,
  track: TrackBriefRow | null,
): PostWithRelations {
  return {
    id: row.id,
    boardId: row.board_id,
    authorId: row.author_id,
    trackId: row.track_id,
    title: row.title,
    content: row.content,
    likeCount: row.like_count,
    commentCount: row.comment_count,
    hotScore: row.hot_score,
    deleted: Boolean(row.deleted),
    deletedAt: row.deleted_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    images: images.map((image) => ({
      id: image.id,
      postId: image.post_id,
      imageUrl: image.image_url,
      sortOrder: image.sort_order,
    })),
    board: { id: board?.id ?? row.board_id, name: board?.name ?? '' },
    track,
  };
}

async function loadPostRelations(
  postId: string,
  includeDeleted = false,
): Promise<PostWithRelations | null> {
  const deletedFilter = includeDeleted ? '' : ' AND deleted = 0';
  const post = await queryOne<PostDbRow>(
    `SELECT * FROM posts WHERE id = ?${deletedFilter} LIMIT 1`,
    [postId],
  );
  if (!post) {
    return null;
  }

  const [images, board, track] = await Promise.all([
    query<PostImageDbRow>(
      'SELECT * FROM post_images WHERE post_id = ? ORDER BY sort_order ASC',
      [postId],
    ),
    queryOne<BoardRow>('SELECT * FROM boards WHERE id = ? LIMIT 1', [post.board_id]),
    post.track_id
      ? queryOne<TrackBriefRow>('SELECT id, name FROM tracks WHERE id = ? LIMIT 1', [post.track_id])
      : Promise.resolve(null),
  ]);

  return mapPost(post, images, board, track);
}

export class PostRepository {
  async findBoardById(boardId: string) {
    const row = await queryOne<BoardRow>('SELECT * FROM boards WHERE id = ? LIMIT 1', [boardId]);
    return row ? mapBoard(row) : null;
  }

  async listBoards() {
    const rows = await query<BoardRow>('SELECT * FROM boards ORDER BY sort_order ASC');
    return rows.map(mapBoard);
  }

  async create(data: {
    boardId: string;
    authorId: string;
    title: string;
    content: string;
    trackId?: string;
    imageUrls: string[];
  }): Promise<PostWithRelations> {
    const postId = randomUUID();

    return withTransaction(async () => {
      await execute(
        `INSERT INTO posts (
          id, board_id, author_id, track_id, title, content,
          like_count, comment_count, hot_score, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, 0, 0, 0, NOW(3), NOW(3))`,
        [
          postId,
          data.boardId,
          data.authorId,
          data.trackId ?? null,
          data.title,
          data.content,
        ],
      );

      for (let i = 0; i < data.imageUrls.length; i += 1) {
        await execute(
          'INSERT INTO post_images (post_id, image_url, sort_order) VALUES (?, ?, ?)',
          [postId, data.imageUrls[i], i],
        );
      }

      const post = await loadPostRelations(postId);
      if (!post) {
        throw new Error('failed to create post');
      }
      return post;
    });
  }

  async findById(postId: string): Promise<PostWithRelations | null> {
    return loadPostRelations(postId, false);
  }

  async findByIdIncludingDeleted(postId: string): Promise<PostWithRelations | null> {
    return loadPostRelations(postId, true);
  }

  async list(queryParams: {
    boardId: string;
    sort: 'latest' | 'hot';
    trackId?: string;
    skip: number;
    take: number;
  }): Promise<{ rows: PostWithRelations[]; total: number }> {
    const where: string[] = ['board_id = ?', 'deleted = 0'];
    const params: ExecuteValues = [queryParams.boardId];

    if (queryParams.trackId) {
      where.push('track_id = ?');
      params.push(queryParams.trackId);
    }

    const whereSql = where.join(' AND ');
    const orderSql =
      queryParams.sort === 'hot'
        ? 'ORDER BY hot_score DESC, created_at DESC'
        : 'ORDER BY created_at DESC';

    const [posts, countRow] = await Promise.all([
      query<PostDbRow>(
        `SELECT * FROM posts WHERE ${whereSql} ${orderSql} LIMIT ? OFFSET ?`,
        [...params, queryParams.take, queryParams.skip],
      ),
      queryOne<RowDataPacket & { count: number }>(
        `SELECT COUNT(*) AS count FROM posts WHERE ${whereSql}`,
        params,
      ),
    ]);

    const rows = await Promise.all(
      posts.map(async (post) => {
        const [images, board, track] = await Promise.all([
          query<PostImageDbRow>(
            'SELECT * FROM post_images WHERE post_id = ? ORDER BY sort_order ASC LIMIT 1',
            [post.id],
          ),
          queryOne<BoardRow>('SELECT * FROM boards WHERE id = ? LIMIT 1', [post.board_id]),
          post.track_id
            ? queryOne<TrackBriefRow>(
                'SELECT id, name FROM tracks WHERE id = ? LIMIT 1',
                [post.track_id],
              )
            : Promise.resolve(null),
        ]);

        return mapPost(post, images, board, track);
      }),
    );

    return { rows, total: Number(countRow?.count ?? 0) };
  }

  async countLikesByAuthor(authorId: string): Promise<number> {
    const row = await queryOne<RowDataPacket & { total: number }>(
      'SELECT COALESCE(SUM(like_count), 0) AS total FROM posts WHERE author_id = ? AND deleted = 0',
      [authorId],
    );
    return Number(row?.total ?? 0);
  }

  async listByAuthor(
    authorId: string,
    skip: number,
    take: number,
  ): Promise<{ rows: PostWithRelations[]; total: number }> {
    const [posts, countRow] = await Promise.all([
      query<PostDbRow>(
        'SELECT * FROM posts WHERE author_id = ? AND deleted = 0 ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [authorId, take, skip],
      ),
      queryOne<RowDataPacket & { count: number }>(
        'SELECT COUNT(*) AS count FROM posts WHERE author_id = ? AND deleted = 0',
        [authorId],
      ),
    ]);

    const rows = await Promise.all(
      posts.map(async (post) => {
        const [images, board, track] = await Promise.all([
          query<PostImageDbRow>(
            'SELECT * FROM post_images WHERE post_id = ? ORDER BY sort_order ASC LIMIT 1',
            [post.id],
          ),
          queryOne<BoardRow>('SELECT * FROM boards WHERE id = ? LIMIT 1', [post.board_id]),
          post.track_id
            ? queryOne<TrackBriefRow>(
                'SELECT id, name FROM tracks WHERE id = ? LIMIT 1',
                [post.track_id],
              )
            : Promise.resolve(null),
        ]);

        return mapPost(post, images, board, track);
      }),
    );

    return { rows, total: Number(countRow?.count ?? 0) };
  }

  async listFollowingFeed(queryParams: {
    followerId: string;
    skip: number;
    take: number;
  }): Promise<{ rows: PostWithRelations[]; total: number }> {
    const baseSql = `
      FROM posts p
      INNER JOIN follows f ON f.followee_id = p.author_id
      WHERE f.follower_id = ? AND p.deleted = 0
    `;

    const [posts, countRow] = await Promise.all([
      query<PostDbRow>(
        `SELECT p.* ${baseSql} ORDER BY p.created_at DESC LIMIT ? OFFSET ?`,
        [queryParams.followerId, queryParams.take, queryParams.skip],
      ),
      queryOne<RowDataPacket & { count: number }>(
        `SELECT COUNT(*) AS count ${baseSql}`,
        [queryParams.followerId],
      ),
    ]);

    const rows = await Promise.all(
      posts.map(async (post) => {
        const [images, board, track] = await Promise.all([
          query<PostImageDbRow>(
            'SELECT * FROM post_images WHERE post_id = ? ORDER BY sort_order ASC LIMIT 1',
            [post.id],
          ),
          queryOne<BoardRow>('SELECT * FROM boards WHERE id = ? LIMIT 1', [post.board_id]),
          post.track_id
            ? queryOne<TrackBriefRow>(
                'SELECT id, name FROM tracks WHERE id = ? LIMIT 1',
                [post.track_id],
              )
            : Promise.resolve(null),
        ]);

        return mapPost(post, images, board, track);
      }),
    );

    return { rows, total: Number(countRow?.count ?? 0) };
  }

  async incrementCommentCount(postId: string): Promise<void> {
    const post = await queryOne<RowDataPacket & { like_count: number; comment_count: number }>(
      'SELECT like_count, comment_count FROM posts WHERE id = ? LIMIT 1',
      [postId],
    );

    if (!post) {
      return;
    }

    const commentCount = post.comment_count + 1;
    await execute(
      'UPDATE posts SET comment_count = ?, hot_score = ?, updated_at = NOW(3) WHERE id = ?',
      [commentCount, calcHotScore(post.like_count, commentCount), postId],
    );
  }

  async updateLikeCount(postId: string, delta: number): Promise<number> {
    const post = await queryOne<RowDataPacket & { like_count: number; comment_count: number }>(
      'SELECT like_count, comment_count FROM posts WHERE id = ? LIMIT 1',
      [postId],
    );

    if (!post) {
      throw new Error('post not found');
    }

    const likeCount = Math.max(0, post.like_count + delta);
    await execute(
      'UPDATE posts SET like_count = ?, hot_score = ?, updated_at = NOW(3) WHERE id = ?',
      [likeCount, calcHotScore(likeCount, post.comment_count), postId],
    );

    return likeCount;
  }

  async findLikedPostIds(userId: string, postIds: string[]): Promise<Set<string>> {
    if (postIds.length === 0) {
      return new Set();
    }

    const placeholders = postIds.map(() => '?').join(', ');
    const likes = await query<RowDataPacket & { target_id: string }>(
      `SELECT target_id FROM likes
       WHERE user_id = ? AND target_type = 'post' AND target_id IN (${placeholders})`,
      [userId, ...postIds],
    );

    return new Set(likes.map((like) => like.target_id));
  }

  async softDelete(postId: string): Promise<boolean> {
    const result = await execute(
      'UPDATE posts SET deleted = 1, deleted_at = NOW(3), updated_at = NOW(3) WHERE id = ? AND deleted = 0',
      [postId],
    );
    return result.affectedRows > 0;
  }

  async restore(postId: string): Promise<boolean> {
    const result = await execute(
      'UPDATE posts SET deleted = 0, deleted_at = NULL, updated_at = NOW(3) WHERE id = ? AND deleted = 1',
      [postId],
    );
    return result.affectedRows > 0;
  }

  async listForAdmin(queryParams: {
    keyword?: string;
    authorId?: string;
    skip: number;
    take: number;
  }): Promise<{ rows: PostWithRelations[]; total: number }> {
    const where: string[] = [];
    const params: ExecuteValues = [];

    if (queryParams.keyword) {
      where.push('title LIKE ?');
      params.push(`%${queryParams.keyword}%`);
    }
    if (queryParams.authorId) {
      where.push('author_id = ?');
      params.push(queryParams.authorId);
    }

    const whereSql = where.length > 0 ? `WHERE ${where.join(' AND ')}` : '';

    const [posts, countRow] = await Promise.all([
      query<PostDbRow>(
        `SELECT * FROM posts ${whereSql} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
        [...params, queryParams.take, queryParams.skip],
      ),
      queryOne<RowDataPacket & { count: number }>(
        `SELECT COUNT(*) AS count FROM posts ${whereSql}`,
        params,
      ),
    ]);

    const rows = await Promise.all(
      posts.map(async (post) => {
        const [images, board, track] = await Promise.all([
          query<PostImageDbRow>(
            'SELECT * FROM post_images WHERE post_id = ? ORDER BY sort_order ASC LIMIT 1',
            [post.id],
          ),
          queryOne<BoardRow>('SELECT * FROM boards WHERE id = ? LIMIT 1', [post.board_id]),
          post.track_id
            ? queryOne<TrackBriefRow>(
                'SELECT id, name FROM tracks WHERE id = ? LIMIT 1',
                [post.track_id],
              )
            : Promise.resolve(null),
        ]);

        return mapPost(post, images, board, track);
      }),
    );

    return { rows, total: Number(countRow?.count ?? 0) };
  }
}

export const postRepository = new PostRepository();
