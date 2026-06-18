import { randomUUID } from 'node:crypto';
import type { ExecuteValues, RowDataPacket } from 'mysql2/promise';

import { execute, query, queryOne } from '../../lib/mysql';
import type { CreateTrackDto, UpdateTrackDto } from './dto/track.types';

interface TrackDbRow extends RowDataPacket {
  id: string;
  creator_id: string;
  name: string;
  lat: string;
  lng: string;
  address: string;
  organizer_name: string;
  organizer_contact: string | null;
  length_meters: number | null;
  example_video_url: string | null;
  rule_note: string | null;
  record_count: number;
  created_at: Date;
  updated_at: Date;
}

interface FloorPlanRow extends RowDataPacket {
  image_url: string;
  sort_order: number;
}

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

function toNumber(value: string | number): number {
  return typeof value === 'number' ? value : Number(value);
}

function mapTrack(row: TrackDbRow, floorPlans: FloorPlanRow[]): TrackRow {
  return {
    id: row.id,
    creatorId: row.creator_id,
    name: row.name,
    lat: toNumber(row.lat),
    lng: toNumber(row.lng),
    address: row.address,
    organizerName: row.organizer_name,
    organizerContact: row.organizer_contact,
    lengthMeters: row.length_meters,
    exampleVideoUrl: row.example_video_url,
    ruleNote: row.rule_note,
    recordCount: row.record_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    floorPlans: floorPlans.map((fp) => ({
      imageUrl: fp.image_url,
      sortOrder: fp.sort_order,
    })),
  };
}

async function loadFloorPlans(trackId: string): Promise<FloorPlanRow[]> {
  return query<FloorPlanRow>(
    'SELECT image_url, sort_order FROM track_floor_plans WHERE track_id = ? ORDER BY sort_order ASC',
    [trackId],
  );
}

export class TrackRepository {
  async findById(trackId: string): Promise<TrackRow | null> {
    const row = await queryOne<TrackDbRow>(
      'SELECT * FROM tracks WHERE id = ? LIMIT 1',
      [trackId],
    );
    if (!row) {
      return null;
    }
    const floorPlans = await loadFloorPlans(trackId);
    return mapTrack(row, floorPlans);
  }

  async exists(trackId: string): Promise<boolean> {
    const row = await queryOne<RowDataPacket & { count: number }>(
      'SELECT COUNT(*) AS count FROM tracks WHERE id = ?',
      [trackId],
    );
    return Number(row?.count ?? 0) > 0;
  }

  async isNameDuplicate(
    creatorId: string,
    name: string,
    excludeId?: string,
  ): Promise<boolean> {
    const sql = excludeId
      ? 'SELECT COUNT(*) AS count FROM tracks WHERE creator_id = ? AND name = ? AND id <> ?'
      : 'SELECT COUNT(*) AS count FROM tracks WHERE creator_id = ? AND name = ?';
    const params = excludeId ? [creatorId, name, excludeId] : [creatorId, name];
    const row = await queryOne<RowDataPacket & { count: number }>(sql, params);
    return Number(row?.count ?? 0) > 0;
  }

  async create(creatorId: string, dto: CreateTrackDto): Promise<TrackRow> {
    const id = randomUUID();
    await execute(
      `INSERT INTO tracks (
        id, creator_id, name, lat, lng, address, organizer_name, organizer_contact,
        length_meters, example_video_url, rule_note, record_count, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NOW(3), NOW(3))`,
      [
        id,
        creatorId,
        dto.name,
        dto.location.lat,
        dto.location.lng,
        dto.location.address,
        dto.organizerName,
        dto.organizerContact ?? null,
        dto.lengthMeters ?? null,
        dto.exampleVideoUrl ?? null,
        dto.ruleNote ?? null,
      ],
    );

    if (dto.floorPlanUrls?.length) {
      for (let i = 0; i < dto.floorPlanUrls.length; i += 1) {
        await execute(
          'INSERT INTO track_floor_plans (track_id, image_url, sort_order) VALUES (?, ?, ?)',
          [id, dto.floorPlanUrls[i], i],
        );
      }
    }

    const track = await this.findById(id);
    if (!track) {
      throw new Error('failed to create track');
    }
    return track;
  }

  async update(trackId: string, dto: UpdateTrackDto): Promise<TrackRow> {
    const fields: string[] = [];
    const params: ExecuteValues = [];

    if (dto.name !== undefined) {
      fields.push('name = ?');
      params.push(dto.name);
    }
    if (dto.location !== undefined) {
      fields.push('lat = ?', 'lng = ?', 'address = ?');
      params.push(dto.location.lat, dto.location.lng, dto.location.address);
    }
    if (dto.organizerName !== undefined) {
      fields.push('organizer_name = ?');
      params.push(dto.organizerName);
    }
    if (dto.organizerContact !== undefined) {
      fields.push('organizer_contact = ?');
      params.push(dto.organizerContact ?? null);
    }
    if (dto.lengthMeters !== undefined) {
      fields.push('length_meters = ?');
      params.push(dto.lengthMeters);
    }
    if (dto.exampleVideoUrl !== undefined) {
      fields.push('example_video_url = ?');
      params.push(dto.exampleVideoUrl ?? null);
    }
    if (dto.ruleNote !== undefined) {
      fields.push('rule_note = ?');
      params.push(dto.ruleNote ?? null);
    }

    if (dto.floorPlanUrls !== undefined) {
      await execute('DELETE FROM track_floor_plans WHERE track_id = ?', [trackId]);
      for (let i = 0; i < dto.floorPlanUrls.length; i += 1) {
        await execute(
          'INSERT INTO track_floor_plans (track_id, image_url, sort_order) VALUES (?, ?, ?)',
          [trackId, dto.floorPlanUrls[i], i],
        );
      }
    }

    if (fields.length > 0) {
      fields.push('updated_at = NOW(3)');
      params.push(trackId);
      await execute(`UPDATE tracks SET ${fields.join(', ')} WHERE id = ?`, params);
    }

    const track = await this.findById(trackId);
    if (!track) {
      throw new Error('track not found');
    }
    return track;
  }

  async listAll(keyword?: string): Promise<TrackRow[]> {
    const rows = keyword
      ? await query<TrackDbRow>(
          'SELECT * FROM tracks WHERE name LIKE ? ORDER BY created_at DESC',
          [`%${keyword}%`],
        )
      : await query<TrackDbRow>('SELECT * FROM tracks ORDER BY created_at DESC');

    return Promise.all(
      rows.map(async (row) => mapTrack(row, await loadFloorPlans(row.id))),
    );
  }

  async listByCreator(
    creatorId: string,
    skip: number,
    take: number,
  ): Promise<{ rows: TrackRow[]; total: number }> {
    const [rows, countRow] = await Promise.all([
      query<TrackDbRow>(
        'SELECT * FROM tracks WHERE creator_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?',
        [creatorId, take, skip],
      ),
      queryOne<RowDataPacket & { count: number }>(
        'SELECT COUNT(*) AS count FROM tracks WHERE creator_id = ?',
        [creatorId],
      ),
    ]);

    const mapped = await Promise.all(
      rows.map(async (row) => mapTrack(row, await loadFloorPlans(row.id))),
    );

    return { rows: mapped, total: Number(countRow?.count ?? 0) };
  }

  async getRecordCount(trackId: string): Promise<number> {
    const row = await queryOne<RowDataPacket & { record_count: number }>(
      'SELECT record_count FROM tracks WHERE id = ? LIMIT 1',
      [trackId],
    );
    return Number(row?.record_count ?? 0);
  }

  async incrementRecordCount(trackId: string): Promise<void> {
    await execute(
      'UPDATE tracks SET record_count = record_count + 1, updated_at = NOW(3) WHERE id = ?',
      [trackId],
    );
  }
}

export const trackRepository = new TrackRepository();
