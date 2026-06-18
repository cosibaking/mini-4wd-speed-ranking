import type { Post, PostImage, Prisma, Track } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

import { prisma } from '../../lib/prisma.js';
import { calcHotScore } from './hotScore.util.js';

export type PostWithRelations = Post & {
  images: PostImage[];
  board: { id: string; name: string };
  track: Pick<Track, 'id' | 'name'> | null;
};

export class PostRepository {
  async findBoardById(boardId: string) {
    return prisma.board.findUnique({ where: { id: boardId } });
  }

  async listBoards() {
    return prisma.board.findMany({ orderBy: { sortOrder: 'asc' } });
  }

  async create(data: {
    boardId: string;
    authorId: string;
    title: string;
    content: string;
    trackId?: string;
    imageUrls: string[];
  }): Promise<PostWithRelations> {
    const postId = uuidv4();

    return prisma.$transaction(async (tx) => {
      const post = await tx.post.create({
        data: {
          id: postId,
          boardId: data.boardId,
          authorId: data.authorId,
          title: data.title,
          content: data.content,
          trackId: data.trackId ?? null,
          hotScore: 0,
        },
      });

      if (data.imageUrls.length > 0) {
        await tx.postImage.createMany({
          data: data.imageUrls.map((imageUrl, index) => ({
            postId,
            imageUrl,
            sortOrder: index,
          })),
        });
      }

      return tx.post.findUniqueOrThrow({
        where: { id: postId },
        include: {
          images: { orderBy: { sortOrder: 'asc' } },
          board: true,
          track: { select: { id: true, name: true } },
        },
      });
    });
  }

  async findById(postId: string): Promise<PostWithRelations | null> {
    return prisma.post.findUnique({
      where: { id: postId },
      include: {
        images: { orderBy: { sortOrder: 'asc' } },
        board: true,
        track: { select: { id: true, name: true } },
      },
    });
  }

  async list(query: {
    boardId: string;
    sort: 'latest' | 'hot';
    trackId?: string;
    skip: number;
    take: number;
  }): Promise<{ rows: PostWithRelations[]; total: number }> {
    const where: Prisma.PostWhereInput = {
      boardId: query.boardId,
      ...(query.trackId ? { trackId: query.trackId } : {}),
    };

    const orderBy: Prisma.PostOrderByWithRelationInput[] =
      query.sort === 'hot'
        ? [{ hotScore: 'desc' }, { createdAt: 'desc' }]
        : [{ createdAt: 'desc' }];

    const [rows, total] = await prisma.$transaction([
      prisma.post.findMany({
        where,
        orderBy,
        skip: query.skip,
        take: query.take,
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          board: true,
          track: { select: { id: true, name: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return { rows, total };
  }

  async listFollowingFeed(query: {
    followerId: string;
    skip: number;
    take: number;
  }): Promise<{ rows: PostWithRelations[]; total: number }> {
    const where: Prisma.PostWhereInput = {
      author: {
        followers: {
          some: { followerId: query.followerId },
        },
      },
    };

    const [rows, total] = await prisma.$transaction([
      prisma.post.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: query.skip,
        take: query.take,
        include: {
          images: { orderBy: { sortOrder: 'asc' }, take: 1 },
          board: true,
          track: { select: { id: true, name: true } },
        },
      }),
      prisma.post.count({ where }),
    ]);

    return { rows, total };
  }

  async incrementCommentCount(postId: string): Promise<void> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { likeCount: true, commentCount: true },
    });

    if (!post) {
      return;
    }

    const commentCount = post.commentCount + 1;
    await prisma.post.update({
      where: { id: postId },
      data: {
        commentCount,
        hotScore: calcHotScore(post.likeCount, commentCount),
      },
    });
  }

  async updateLikeCount(postId: string, delta: number): Promise<number> {
    const post = await prisma.post.findUnique({
      where: { id: postId },
      select: { likeCount: true, commentCount: true },
    });

    if (!post) {
      throw new Error('post not found');
    }

    const likeCount = Math.max(0, post.likeCount + delta);
    await prisma.post.update({
      where: { id: postId },
      data: {
        likeCount,
        hotScore: calcHotScore(likeCount, post.commentCount),
      },
    });

    return likeCount;
  }

  async findLikedPostIds(userId: string, postIds: string[]): Promise<Set<string>> {
    if (postIds.length === 0) {
      return new Set();
    }

    const likes = await prisma.like.findMany({
      where: {
        userId,
        targetType: 'post',
        targetId: { in: postIds },
      },
      select: { targetId: true },
    });

    return new Set(likes.map((like) => like.targetId));
  }
}

export const postRepository = new PostRepository();
