import { randomUUID } from 'node:crypto';
import type { RowDataPacket } from 'mysql2/promise';

import { execute, query, queryOne } from '../../lib/mysql.js';
import type { OrganizerApplicationStatus } from '../../shared/types.js';

export interface OrganizerApplicationRow extends RowDataPacket {
  id: string;
  user_id: string;
  real_name: string;
  id_card_number: string;
  phone: string;
  wechat: string | null;
  status: OrganizerApplicationStatus;
  real_name_verified_at: Date | null;
  review_note: string | null;
  reviewed_by: string | null;
  reviewed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  nick_name?: string;
}

function mapRow(row: OrganizerApplicationRow) {
  return {
    id: row.id,
    userId: row.user_id,
    realName: row.real_name,
    idCardNumber: row.id_card_number,
    phone: row.phone,
    wechat: row.wechat,
    status: row.status,
    realNameVerifiedAt: row.real_name_verified_at,
    reviewNote: row.review_note,
    reviewedBy: row.reviewed_by,
    reviewedAt: row.reviewed_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    applicantNickName: row.nick_name,
  };
}

export class OrganizerRepository {
  async findLatestByUserId(userId: string) {
    const row = await queryOne<OrganizerApplicationRow>(
      `SELECT * FROM organizer_applications
       WHERE user_id = ?
       ORDER BY created_at DESC
       LIMIT 1`,
      [userId],
    );
    return row ? mapRow(row) : null;
  }

  async findById(id: string) {
    const row = await queryOne<OrganizerApplicationRow>(
      'SELECT * FROM organizer_applications WHERE id = ? LIMIT 1',
      [id],
    );
    return row ? mapRow(row) : null;
  }

  async hasPendingApplication(userId: string): Promise<boolean> {
    const row = await queryOne<RowDataPacket & { count: number }>(
      `SELECT COUNT(*) AS count FROM organizer_applications
       WHERE user_id = ? AND status = 'pending'`,
      [userId],
    );
    return Number(row?.count ?? 0) > 0;
  }

  async create(data: {
    userId: string;
    realName: string;
    idCardNumber: string;
    phone: string;
    wechat?: string;
    realNameVerifiedAt: Date;
  }) {
    const id = randomUUID();
    await execute(
      `INSERT INTO organizer_applications (
        id, user_id, real_name, id_card_number, phone, wechat,
        status, real_name_verified_at, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, NOW(3), NOW(3))`,
      [
        id,
        data.userId,
        data.realName,
        data.idCardNumber,
        data.phone,
        data.wechat ?? null,
        data.realNameVerifiedAt,
      ],
    );
    const row = await this.findById(id);
    if (!row) {
      throw new Error('failed to create organizer application');
    }
    return row;
  }

  async listByStatus(status: OrganizerApplicationStatus, skip: number, pageSize: number) {
    const rows = await query<OrganizerApplicationRow>(
      `SELECT oa.*, u.nick_name
       FROM organizer_applications oa
       JOIN users u ON u.id = oa.user_id
       WHERE oa.status = ?
       ORDER BY oa.created_at DESC
       LIMIT ? OFFSET ?`,
      [status, pageSize, skip],
    );
    const countRow = await queryOne<RowDataPacket & { count: number }>(
      'SELECT COUNT(*) AS count FROM organizer_applications WHERE status = ?',
      [status],
    );
    return {
      rows: rows.map(mapRow),
      total: Number(countRow?.count ?? 0),
    };
  }

  async updateStatus(
    id: string,
    status: OrganizerApplicationStatus,
    reviewerId: string,
    reviewNote?: string,
  ) {
    await execute(
      `UPDATE organizer_applications
       SET status = ?, review_note = ?, reviewed_by = ?, reviewed_at = NOW(3), updated_at = NOW(3)
       WHERE id = ?`,
      [status, reviewNote ?? null, reviewerId, id],
    );
    const row = await this.findById(id);
    if (!row) {
      throw new Error('application not found');
    }
    return row;
  }
}

export const organizerRepository = new OrganizerRepository();
