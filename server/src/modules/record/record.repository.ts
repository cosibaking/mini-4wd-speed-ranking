import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma';
import type { SubmitRecordDto } from './dto/record.types';

export interface RecordRow {
  id: string;
  trackId: string;
  userId: string;
  lapTimeMs: number;
  lapTimeDisplay: string;
  videoUrl: string;
  configSheetType: 'text' | 'image' | null;
  configSheetText: string | null;
  configSheetUrl: string | null;
  note: string | null;
  createdAt: Date;
  carPhotos: { imageUrl: string; sortOrder: number }[];
  user?: { id: string; nickName: string; avatarUrl: string };
  track?: { id: string; name: string };
}

type RecordWithRelations = Prisma.RecordGetPayload<{
  include: {
    carPhotos: true;
    user: { select: { id: true; nickName: true; avatarUrl: true } };
    track: { select: { id: true; name: true } };
  };
}>;

function mapRecord(row: RecordWithRelations): RecordRow {
  return {
    id: row.id,
    trackId: row.trackId,
    userId: row.userId,
    lapTimeMs: row.lapTimeMs,
    lapTimeDisplay: row.lapTimeDisplay,
    videoUrl: row.videoUrl,
    configSheetType: row.configSheetType,
    configSheetText: row.configSheetText,
    configSheetUrl: row.configSheetUrl,
    note: row.note,
    createdAt: row.createdAt,
    carPhotos: row.carPhotos.map((p) => ({
      imageUrl: p.imageUrl,
      sortOrder: p.sortOrder,
    })),
    user: row.user,
    track: row.track,
  };
}

const recordInclude = {
  carPhotos: { orderBy: { sortOrder: 'asc' as const } },
  user: { select: { id: true, nickName: true, avatarUrl: true } },
  track: { select: { id: true, name: true } },
};

export class RecordRepository {
  async create(
    userId: string,
    dto: SubmitRecordDto,
    lapTimeMs: number,
    lapTimeDisplay: string,
  ): Promise<RecordRow> {
    const id = randomUUID();
    const configSheetType = dto.configSheet?.type ?? null;
    const configSheetText =
      dto.configSheet?.type === 'text' ? dto.configSheet.content : null;
    const configSheetUrl =
      dto.configSheet?.type === 'image' ? dto.configSheet.url : null;

    const row = await prisma.record.create({
      data: {
        id,
        trackId: dto.trackId,
        userId,
        lapTimeMs,
        lapTimeDisplay,
        videoUrl: dto.videoUrl,
        configSheetType,
        configSheetText,
        configSheetUrl,
        note: dto.note ?? null,
        carPhotos: dto.carPhotoUrls?.length
          ? {
              create: dto.carPhotoUrls.map((url, i) => ({
                imageUrl: url,
                sortOrder: i,
              })),
            }
          : undefined,
      },
      include: recordInclude,
    });
    return mapRecord(row);
  }

  async findById(recordId: string): Promise<RecordRow | null> {
    const row = await prisma.record.findUnique({
      where: { id: recordId },
      include: recordInclude,
    });
    return row ? mapRecord(row) : null;
  }

  async listByUser(
    userId: string,
    skip: number,
    take: number,
  ): Promise<{ rows: RecordRow[]; total: number }> {
    const [rows, total] = await Promise.all([
      prisma.record.findMany({
        where: { userId },
        include: {
          carPhotos: { orderBy: { sortOrder: 'asc' } },
          track: { select: { id: true, name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.record.count({ where: { userId } }),
    ]);
    return { rows: rows.map((row) => mapRecord(row as RecordWithRelations)), total };
  }

  async listByTrack(
    trackId: string,
    skip: number,
    take: number,
  ): Promise<{ rows: RecordRow[]; total: number }> {
    const [rows, total] = await Promise.all([
      prisma.record.findMany({
        where: { trackId },
        include: {
          carPhotos: { orderBy: { sortOrder: 'asc' } },
          user: { select: { id: true, nickName: true, avatarUrl: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.record.count({ where: { trackId } }),
    ]);
    return { rows: rows.map((row) => mapRecord(row as RecordWithRelations)), total };
  }
}

export const recordRepository = new RecordRepository();
