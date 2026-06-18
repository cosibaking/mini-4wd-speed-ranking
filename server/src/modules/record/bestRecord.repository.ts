import { prisma } from '../../lib/prisma';

export interface BestRecordRow {
  trackId: string;
  userId: string;
  recordId: string;
  lapTimeMs: number;
  firstAchievedAt: Date;
  user?: { id: string; nickName: string; avatarUrl: string };
}

export class BestRecordRepository {
  async findByTrackAndUser(
    trackId: string,
    userId: string,
  ): Promise<BestRecordRow | null> {
    const row = await prisma.trackBestRecord.findUnique({
      where: { trackId_userId: { trackId, userId } },
      include: {
        user: { select: { id: true, nickName: true, avatarUrl: true } },
      },
    });
    if (!row) return null;
    return {
      trackId: row.trackId,
      userId: row.userId,
      recordId: row.recordId,
      lapTimeMs: row.lapTimeMs,
      firstAchievedAt: row.firstAchievedAt,
      user: row.user,
    };
  }

  async upsertBest(
    trackId: string,
    userId: string,
    recordId: string,
    lapTimeMs: number,
  ): Promise<{ isNewParticipant: boolean; updated: boolean }> {
    const existing = await prisma.trackBestRecord.findUnique({
      where: { trackId_userId: { trackId, userId } },
    });

    if (!existing) {
      await prisma.trackBestRecord.create({
        data: {
          trackId,
          userId,
          recordId,
          lapTimeMs,
          firstAchievedAt: new Date(),
        },
      });
      return { isNewParticipant: true, updated: true };
    }

    if (lapTimeMs < existing.lapTimeMs) {
      await prisma.trackBestRecord.update({
        where: { trackId_userId: { trackId, userId } },
        data: {
          recordId,
          lapTimeMs,
          firstAchievedAt: new Date(),
        },
      });
      return { isNewParticipant: false, updated: true };
    }

    return { isNewParticipant: false, updated: false };
  }

  async countByTrack(trackId: string): Promise<number> {
    return prisma.trackBestRecord.count({ where: { trackId } });
  }

  async getRankingPage(
    trackId: string,
    skip: number,
    take: number,
  ): Promise<BestRecordRow[]> {
    const rows = await prisma.trackBestRecord.findMany({
      where: { trackId },
      orderBy: [{ lapTimeMs: 'asc' }, { firstAchievedAt: 'asc' }],
      skip,
      take,
      include: {
        user: { select: { id: true, nickName: true, avatarUrl: true } },
      },
    });
    return rows.map((row) => ({
      trackId: row.trackId,
      userId: row.userId,
      recordId: row.recordId,
      lapTimeMs: row.lapTimeMs,
      firstAchievedAt: row.firstAchievedAt,
      user: row.user,
    }));
  }

  async getAllByTrack(trackId: string): Promise<BestRecordRow[]> {
    const rows = await prisma.trackBestRecord.findMany({
      where: { trackId },
      orderBy: [{ lapTimeMs: 'asc' }, { firstAchievedAt: 'asc' }],
      include: {
        user: { select: { id: true, nickName: true, avatarUrl: true } },
      },
    });
    return rows.map((row) => ({
      trackId: row.trackId,
      userId: row.userId,
      recordId: row.recordId,
      lapTimeMs: row.lapTimeMs,
      firstAchievedAt: row.firstAchievedAt,
      user: row.user,
    }));
  }
}

export const bestRecordRepository = new BestRecordRepository();
