import { prisma } from '../../lib/prisma.js';

type LikeTargetType = 'post' | 'comment';

export class LikeRepository {
  async findLike(userId: string, targetType: LikeTargetType, targetId: string) {
    return prisma.like.findFirst({
      where: { userId, targetType, targetId },
    });
  }

  async create(userId: string, targetType: LikeTargetType, targetId: string): Promise<void> {
    await prisma.like.create({
      data: { userId, targetType, targetId },
    });
  }

  async delete(userId: string, targetType: LikeTargetType, targetId: string): Promise<void> {
    await prisma.like.deleteMany({
      where: { userId, targetType, targetId },
    });
  }
}

export const likeRepository = new LikeRepository();
