import { v4 as uuidv4 } from 'uuid';

import { prisma } from '../../lib/prisma.js';

export class CommentRepository {
  async findById(commentId: string) {
    return prisma.comment.findUnique({
      where: { id: commentId },
      include: {
        author: { select: { id: true, nickName: true, avatarUrl: true } },
      },
    });
  }

  async listByPost(postId: string, skip: number, take: number) {
    const where = { postId };

    const [rows, total] = await prisma.$transaction([
      prisma.comment.findMany({
        where,
        orderBy: { createdAt: 'asc' },
        skip,
        take,
        include: {
          author: { select: { id: true, nickName: true, avatarUrl: true } },
        },
      }),
      prisma.comment.count({ where }),
    ]);

    return { rows, total };
  }

  async create(postId: string, authorId: string, content: string) {
    return prisma.comment.create({
      data: {
        id: uuidv4(),
        postId,
        authorId,
        content,
      },
      include: {
        author: { select: { id: true, nickName: true, avatarUrl: true } },
      },
    });
  }

  async updateLikeCount(commentId: string, delta: number): Promise<number> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
      select: { likeCount: true },
    });

    if (!comment) {
      throw new Error('comment not found');
    }

    const likeCount = Math.max(0, comment.likeCount + delta);
    await prisma.comment.update({
      where: { id: commentId },
      data: { likeCount },
    });

    return likeCount;
  }

  async findLikedCommentIds(userId: string, commentIds: string[]): Promise<Set<string>> {
    if (commentIds.length === 0) {
      return new Set();
    }

    const likes = await prisma.like.findMany({
      where: {
        userId,
        targetType: 'comment',
        targetId: { in: commentIds },
      },
      select: { targetId: true },
    });

    return new Set(likes.map((like) => like.targetId));
  }
}

export const commentRepository = new CommentRepository();
