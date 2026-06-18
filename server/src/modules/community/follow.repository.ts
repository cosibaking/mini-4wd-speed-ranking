import { prisma } from '../../lib/prisma.js';

export class FollowRepository {
  async findFollow(followerId: string, followeeId: string) {
    return prisma.follow.findUnique({
      where: {
        followerId_followeeId: { followerId, followeeId },
      },
    });
  }

  async create(followerId: string, followeeId: string): Promise<void> {
    await prisma.follow.create({
      data: { followerId, followeeId },
    });
  }

  async delete(followerId: string, followeeId: string): Promise<void> {
    await prisma.follow.deleteMany({
      where: { followerId, followeeId },
    });
  }

  async isFollowing(followerId: string, followeeId: string): Promise<boolean> {
    const row = await this.findFollow(followerId, followeeId);
    return row !== null;
  }

  async listFollowing(followerId: string, skip: number, take: number) {
    const where = { followerId };

    const [rows, total] = await prisma.$transaction([
      prisma.follow.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take,
        include: {
          followee: {
            select: { id: true, nickName: true, avatarUrl: true },
          },
        },
      }),
      prisma.follow.count({ where }),
    ]);

    return { rows, total };
  }
}

export const followRepository = new FollowRepository();
