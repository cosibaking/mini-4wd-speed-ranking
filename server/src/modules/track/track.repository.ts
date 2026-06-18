import { randomUUID } from 'node:crypto';
import type { Prisma } from '@prisma/client';

import { prisma } from '../../lib/prisma';
import type { CreateTrackDto, UpdateTrackDto } from './dto/track.types';

export interface TrackRow {
  id: string;
  creatorId: string;
  name: string;
  lat: number;
  lng: number;
  address: string;
  organizerName: string;
  organizerContact: string | null;
  lengthMeters: number | null;
  exampleVideoUrl: string | null;
  ruleNote: string | null;
  recordCount: number;
  createdAt: Date;
  updatedAt: Date;
  floorPlans: { imageUrl: string; sortOrder: number }[];
}

type TrackWithPlans = Prisma.TrackGetPayload<{
  include: { floorPlans: true };
}>;

function toNumber(value: Prisma.Decimal | number): number {
  return typeof value === 'number' ? value : value.toNumber();
}

function mapTrack(row: TrackWithPlans): TrackRow {
  return {
    id: row.id,
    creatorId: row.creatorId,
    name: row.name,
    lat: toNumber(row.lat),
    lng: toNumber(row.lng),
    address: row.address,
    organizerName: row.organizerName,
    organizerContact: row.organizerContact,
    lengthMeters: row.lengthMeters,
    exampleVideoUrl: row.exampleVideoUrl,
    ruleNote: row.ruleNote,
    recordCount: row.recordCount,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
    floorPlans: row.floorPlans.map((fp) => ({
      imageUrl: fp.imageUrl,
      sortOrder: fp.sortOrder,
    })),
  };
}

export class TrackRepository {
  async findById(trackId: string): Promise<TrackRow | null> {
    const row = await prisma.track.findUnique({
      where: { id: trackId },
      include: {
        floorPlans: { orderBy: { sortOrder: 'asc' } },
      },
    });
    return row ? mapTrack(row) : null;
  }

  async exists(trackId: string): Promise<boolean> {
    const count = await prisma.track.count({ where: { id: trackId } });
    return count > 0;
  }

  async isNameDuplicate(
    creatorId: string,
    name: string,
    excludeId?: string,
  ): Promise<boolean> {
    const count = await prisma.track.count({
      where: {
        creatorId,
        name,
        ...(excludeId ? { id: { not: excludeId } } : {}),
      },
    });
    return count > 0;
  }

  async create(creatorId: string, dto: CreateTrackDto): Promise<TrackRow> {
    const id = randomUUID();
    const row = await prisma.track.create({
      data: {
        id,
        creatorId,
        name: dto.name,
        lat: dto.location.lat,
        lng: dto.location.lng,
        address: dto.location.address,
        organizerName: dto.organizerName,
        organizerContact: dto.organizerContact ?? null,
        lengthMeters: dto.lengthMeters ?? null,
        exampleVideoUrl: dto.exampleVideoUrl ?? null,
        ruleNote: dto.ruleNote ?? null,
        floorPlans: dto.floorPlanUrls?.length
          ? {
              create: dto.floorPlanUrls.map((url, i) => ({
                imageUrl: url,
                sortOrder: i,
              })),
            }
          : undefined,
      },
      include: {
        floorPlans: { orderBy: { sortOrder: 'asc' } },
      },
    });
    return mapTrack(row);
  }

  async update(trackId: string, dto: UpdateTrackDto): Promise<TrackRow> {
    const data: Prisma.TrackUpdateInput = {};
    if (dto.name !== undefined) data.name = dto.name;
    if (dto.location !== undefined) {
      data.lat = dto.location.lat;
      data.lng = dto.location.lng;
      data.address = dto.location.address;
    }
    if (dto.organizerName !== undefined) data.organizerName = dto.organizerName;
    if (dto.organizerContact !== undefined) {
      data.organizerContact = dto.organizerContact ?? null;
    }
    if (dto.lengthMeters !== undefined) data.lengthMeters = dto.lengthMeters;
    if (dto.exampleVideoUrl !== undefined) {
      data.exampleVideoUrl = dto.exampleVideoUrl ?? null;
    }
    if (dto.ruleNote !== undefined) data.ruleNote = dto.ruleNote ?? null;

    if (dto.floorPlanUrls !== undefined) {
      await prisma.$transaction([
        prisma.trackFloorPlan.deleteMany({ where: { trackId } }),
        ...(dto.floorPlanUrls.length
          ? [
              prisma.trackFloorPlan.createMany({
                data: dto.floorPlanUrls.map((url, i) => ({
                  trackId,
                  imageUrl: url,
                  sortOrder: i,
                })),
              }),
            ]
          : []),
      ]);
    }

    const row = await prisma.track.update({
      where: { id: trackId },
      data,
      include: {
        floorPlans: { orderBy: { sortOrder: 'asc' } },
      },
    });
    return mapTrack(row);
  }

  async listAll(keyword?: string): Promise<TrackRow[]> {
    const rows = await prisma.track.findMany({
      where: keyword ? { name: { contains: keyword } } : undefined,
      include: {
        floorPlans: { orderBy: { sortOrder: 'asc' } },
      },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map(mapTrack);
  }

  async listByCreator(
    creatorId: string,
    skip: number,
    take: number,
  ): Promise<{ rows: TrackRow[]; total: number }> {
    const [rows, total] = await Promise.all([
      prisma.track.findMany({
        where: { creatorId },
        include: { floorPlans: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.track.count({ where: { creatorId } }),
    ]);
    return { rows: rows.map(mapTrack), total };
  }

  async getRecordCount(trackId: string): Promise<number> {
    const track = await prisma.track.findUnique({
      where: { id: trackId },
      select: { recordCount: true },
    });
    return track?.recordCount ?? 0;
  }

  async incrementRecordCount(trackId: string): Promise<void> {
    await prisma.track.update({
      where: { id: trackId },
      data: { recordCount: { increment: 1 } },
    });
  }
}

export const trackRepository = new TrackRepository();
