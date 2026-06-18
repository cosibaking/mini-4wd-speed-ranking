import { prisma } from '../../lib/prisma';

export class RecentVisitService {
  async touchRecentVisit(userId: string, trackId: string): Promise<void> {
    await prisma.recentTrackVisit.upsert({
      where: {
        userId_trackId: { userId, trackId },
      },
      create: { userId, trackId },
      update: { visitedAt: new Date() },
    });
  }

  async getRecentVisits(
    userId: string,
    limit = 3,
  ): Promise<{ trackId: string; visitedAt: Date }[]> {
    return prisma.recentTrackVisit.findMany({
      where: { userId },
      orderBy: { visitedAt: 'desc' },
      take: limit,
      select: { trackId: true, visitedAt: true },
    });
  }
}

export const recentVisitService = new RecentVisitService();
