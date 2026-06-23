import { randomUUID } from 'node:crypto';
import type { ExecuteValues, RowDataPacket } from 'mysql2/promise';

import { execute, query, queryOne } from '../../lib/mysql.js';
import type { AdminRole } from '../../shared/types.js';

export interface UserRow extends RowDataPacket {
  id: string;
  open_id: string;
  union_id: string | null;
  nick_name: string;
  avatar_url: string;
  is_organizer_certified: number;
  admin_role: AdminRole | null;
  created_at: Date;
  updated_at: Date;
}

function mapUser(row: UserRow) {
  return {
    id: row.id,
    openId: row.open_id,
    unionId: row.union_id,
    nickName: row.nick_name,
    avatarUrl: row.avatar_url,
    isOrganizerCertified: Boolean(row.is_organizer_certified),
    adminRole: row.admin_role,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export class UserRepository {
  async findByOpenId(openId: string) {
    const row = await queryOne<UserRow>(
      'SELECT * FROM users WHERE open_id = ? LIMIT 1',
      [openId],
    );
    return row ? mapUser(row) : null;
  }

  async findById(id: string) {
    const row = await queryOne<UserRow>(
      'SELECT * FROM users WHERE id = ? LIMIT 1',
      [id],
    );
    return row ? mapUser(row) : null;
  }

  async create(data: { openId: string; unionId?: string | null; adminRole?: AdminRole | null }) {
    const id = randomUUID();
    await execute(
      `INSERT INTO users (
        id, open_id, union_id, nick_name, avatar_url,
        is_organizer_certified, admin_role, created_at, updated_at
      ) VALUES (?, ?, ?, '', '', 0, ?, NOW(3), NOW(3))`,
      [id, data.openId, data.unionId ?? null, data.adminRole ?? null],
    );
    const user = await this.findById(id);
    if (!user) {
      throw new Error('failed to create user');
    }
    return user;
  }

  async update(
    id: string,
    data: {
      unionId?: string | null;
      nickName?: string;
      avatarUrl?: string;
      adminRole?: AdminRole | null;
      isOrganizerCertified?: boolean;
    },
  ) {
    const fields: string[] = [];
    const params: ExecuteValues = [];

    if (data.unionId !== undefined) {
      fields.push('union_id = ?');
      params.push(data.unionId);
    }
    if (data.nickName !== undefined) {
      fields.push('nick_name = ?');
      params.push(data.nickName);
    }
    if (data.avatarUrl !== undefined) {
      fields.push('avatar_url = ?');
      params.push(data.avatarUrl);
    }
    if (data.adminRole !== undefined) {
      fields.push('admin_role = ?');
      params.push(data.adminRole);
    }
    if (data.isOrganizerCertified !== undefined) {
      fields.push('is_organizer_certified = ?');
      params.push(data.isOrganizerCertified ? 1 : 0);
    }

    if (fields.length === 0) {
      const user = await this.findById(id);
      if (!user) {
        throw new Error('user not found');
      }
      return user;
    }

    fields.push('updated_at = NOW(3)');
    params.push(id);

    await execute(`UPDATE users SET ${fields.join(', ')} WHERE id = ?`, params);

    const user = await this.findById(id);
    if (!user) {
      throw new Error('user not found');
    }
    return user;
  }

  async findManyByIds(ids: string[]) {
    if (ids.length === 0) {
      return [];
    }

    const placeholders = ids.map(() => '?').join(', ');
    const rows = await query<UserRow>(
      `SELECT id, nick_name, avatar_url FROM users WHERE id IN (${placeholders})`,
      ids,
    );

    return rows.map((row) => ({
      id: row.id,
      nickName: row.nick_name,
      avatarUrl: row.avatar_url,
    }));
  }

  async countTracksByCreator(creatorId: string): Promise<number> {
    const row = await queryOne<RowDataPacket & { count: number }>(
      'SELECT COUNT(*) AS count FROM tracks WHERE creator_id = ?',
      [creatorId],
    );
    return Number(row?.count ?? 0);
  }

  async listForAdmin(skip: number, pageSize: number) {
    const rows = await query<UserRow>(
      `SELECT id, open_id, nick_name, avatar_url, is_organizer_certified, admin_role, created_at
       FROM users
       ORDER BY created_at DESC
       LIMIT ? OFFSET ?`,
      [pageSize, skip],
    );
    const countRow = await queryOne<RowDataPacket & { count: number }>(
      'SELECT COUNT(*) AS count FROM users',
    );
    return {
      rows: rows.map(mapUser),
      total: Number(countRow?.count ?? 0),
    };
  }
}

export const userRepository = new UserRepository();
