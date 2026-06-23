import { config } from '../../config/index.js';
import { ForbiddenError, NotFoundError } from '../../shared/errors.js';
import type { AdminRole } from '../../shared/types.js';
import { userRepository } from '../auth/user.repository.js';
import { organizerService } from '../organizer/organizer.service.js';
import { trackRepository } from '../track/track.repository.js';

export class AdminService {
  isConfiguredAdmin(openId: string): boolean {
    return config.admin.openIds.includes(openId);
  }

  resolveAdminRole(user: { openId: string; adminRole: AdminRole | null }): AdminRole | null {
    if (user.adminRole) {
      return user.adminRole;
    }
    if (this.isConfiguredAdmin(user.openId)) {
      return 'admin';
    }
    return null;
  }

  async ensureAdminRoleSynced(userId: string, openId: string, currentRole: AdminRole | null) {
    if (currentRole || !this.isConfiguredAdmin(openId)) {
      return currentRole;
    }
    const updated = await userRepository.update(userId, { adminRole: 'admin' });
    return updated.adminRole;
  }

  assertAdmin(user: { adminRole: AdminRole | null; openId: string }) {
    const role = this.resolveAdminRole(user);
    if (!role) {
      throw new ForbiddenError('无管理权限');
    }
    return role;
  }

  async getDashboardStats() {
    const pending = await organizerService.listApplications('pending', 1, 1);
    const trackCountRow = await trackRepository.countAll();
    const userCountRow = await userRepository.listForAdmin(0, 1);
    return {
      pendingApplications: pending.total,
      trackCount: trackCountRow,
      userCount: userCountRow.total,
    };
  }

  async listUsers(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const { rows, total } = await userRepository.listForAdmin(skip, pageSize);
    return {
      list: rows.map((user) => {
        const isSystemAdmin = this.isConfiguredAdmin(user.openId);
        return {
          id: user.id,
          nickName: user.nickName,
          avatarUrl: user.avatarUrl,
          isOrganizer: user.isOrganizerCertified,
          adminRole: user.adminRole ?? (isSystemAdmin ? 'admin' : undefined),
          isSystemAdmin,
          createdAt: user.createdAt.toISOString(),
        };
      }),
      total,
      page,
      pageSize,
      hasMore: skip + rows.length < total,
    };
  }

  async listTracks(page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const { rows, total } = await trackRepository.listAllForAdmin(skip, pageSize);
    return {
      list: rows.map((row) => ({
        id: row.id,
        name: row.name,
        address: row.address,
        organizerName: row.organizerName,
        creatorId: row.creatorId,
        recordCount: row.recordCount,
        createdAt: row.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      hasMore: skip + rows.length < total,
    };
  }

  async revokeOrganizer(userId: string) {
    await userRepository.update(userId, { isOrganizerCertified: false });
    return { success: true };
  }

  async grantOrganizer(userId: string) {
    await userRepository.update(userId, { isOrganizerCertified: true });
    return { success: true };
  }

  async grantAdmin(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }
    await userRepository.update(userId, { adminRole: 'admin' });
    return { success: true };
  }

  async revokeAdmin(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }
    if (this.isConfiguredAdmin(user.openId)) {
      throw new ForbiddenError('该用户为系统配置管理员，无法撤销');
    }
    await userRepository.update(userId, { adminRole: null });
    return { success: true };
  }
}

export const adminService = new AdminService();
