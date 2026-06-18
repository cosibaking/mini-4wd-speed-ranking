import type { RowDataPacket } from 'mysql2/promise';

import { execute, queryOne } from '../../lib/mysql.js';
import type { MediaPurpose } from './dto/upload-credential.dto.js';

type MediaType = 'image' | 'video';

interface MediaObjectRow extends RowDataPacket {
  object_key: string;
  user_id: string;
  media_type: MediaType;
  purpose: string;
  public_url: string;
  file_size: number;
  status: 'pending' | 'confirmed';
  created_at: Date;
  confirmed_at: Date | null;
}

function mapMedia(row: MediaObjectRow) {
  return {
    objectKey: row.object_key,
    userId: row.user_id,
    mediaType: row.media_type,
    purpose: row.purpose,
    publicUrl: row.public_url,
    fileSize: row.file_size,
    status: row.status,
    createdAt: row.created_at,
    confirmedAt: row.confirmed_at,
  };
}

export class MediaRepository {
  async insertPending(data: {
    objectKey: string;
    userId: string;
    mediaType: MediaType;
    purpose: MediaPurpose;
    publicUrl: string;
    fileSize: number;
  }) {
    await execute(
      `INSERT INTO media_objects (
        object_key, user_id, media_type, purpose, public_url, file_size, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', NOW(3))`,
      [
        data.objectKey,
        data.userId,
        data.mediaType,
        data.purpose,
        data.publicUrl,
        data.fileSize,
      ],
    );

    const row = await this.findByObjectKeyAndUser(data.objectKey, data.userId);
    if (!row) {
      throw new Error('failed to insert media object');
    }
    return row;
  }

  async findByObjectKeyAndUser(objectKey: string, userId: string) {
    const row = await queryOne<MediaObjectRow>(
      'SELECT * FROM media_objects WHERE object_key = ? AND user_id = ? LIMIT 1',
      [objectKey, userId],
    );
    return row ? mapMedia(row) : null;
  }

  async confirm(objectKey: string) {
    await execute(
      `UPDATE media_objects SET status = 'confirmed', confirmed_at = NOW(3) WHERE object_key = ?`,
      [objectKey],
    );

    const row = await queryOne<MediaObjectRow>(
      `SELECT * FROM media_objects WHERE object_key = ? AND status = 'confirmed' LIMIT 1`,
      [objectKey],
    );
    if (!row) {
      throw new Error('failed to confirm media object');
    }
    return mapMedia(row);
  }

  async findConfirmed(objectKey: string) {
    const row = await queryOne<MediaObjectRow>(
      `SELECT * FROM media_objects WHERE object_key = ? AND status = 'confirmed' LIMIT 1`,
      [objectKey],
    );
    return row ? mapMedia(row) : null;
  }

  async deletePendingOlderThan(hours: number): Promise<number> {
    const result = await execute(
      `DELETE FROM media_objects WHERE status = 'pending' AND created_at < DATE_SUB(NOW(3), INTERVAL ? HOUR)`,
      [hours],
    );
    return result.affectedRows;
  }
}

export const mediaRepository = new MediaRepository();
