import { config } from '../../config/index.js';
import { signJwt, verifyJwt } from '../../lib/jwt.js';
import { UnauthorizedError } from '../../shared/errors.js';
import type { AuthContext, UserProfile } from '../../shared/types.js';
import { adminService } from '../admin/admin.service.js';
import { organizerService } from '../organizer/organizer.service.js';
import { userRepository } from './user.repository.js';
import { wechatClient } from './wechat.client.js';

export class AuthService {
  async loginByWechat(code: string): Promise<{ token: string; expiresIn: number; user: UserProfile }> {
    const session = await wechatClient.code2Session(code);

    let user = await userRepository.findByOpenId(session.openId);
    const bootstrapAdminRole = adminService.isConfiguredAdmin(session.openId) ? 'admin' : null;

    if (!user) {
      user = await userRepository.create({
        openId: session.openId,
        unionId: session.unionId,
        adminRole: bootstrapAdminRole,
      });
    } else {
      const updates: {
        unionId?: string | null;
        adminRole?: 'admin' | 'operator' | null;
      } = {};

      if (session.unionId && !user.unionId) {
        updates.unionId = session.unionId;
      }
      if (bootstrapAdminRole && !user.adminRole) {
        updates.adminRole = bootstrapAdminRole;
      }

      if (Object.keys(updates).length > 0) {
        user = await userRepository.update(user.id, updates);
      }
    }

    const token = this.signToken(user.id);
    const profile = await this.buildUserProfile(user);

    console.log(`[auth] login success userId=${user.id} openId=${user.openId}`);

    return {
      token,
      expiresIn: config.jwt.expiresIn,
      user: profile,
    };
  }

  async resolveToken(token: string): Promise<AuthContext> {
    let payload: { sub: string };

    try {
      payload = verifyJwt(token, config.jwt.secret);
    } catch {
      throw new UnauthorizedError();
    }

    const user = await userRepository.findById(payload.sub);

    if (!user) {
      throw new UnauthorizedError();
    }

    return {
      userId: user.id,
      openId: user.openId,
      nickName: user.nickName,
      avatarUrl: user.avatarUrl,
    };
  }

  refreshToken(userId: string): { token: string; expiresIn: number } {
    return {
      token: this.signToken(userId),
      expiresIn: config.jwt.expiresIn,
    };
  }

  signToken(userId: string): string {
    return signJwt(userId, config.jwt.secret, config.jwt.expiresIn);
  }

  async buildUserProfile(user: {
    id: string;
    openId: string;
    nickName: string;
    avatarUrl: string;
    isOrganizerCertified: boolean;
    adminRole: 'admin' | 'operator' | null;
    createdAt: Date;
  }): Promise<UserProfile> {
    const adminRole =
      (await adminService.ensureAdminRoleSynced(user.id, user.openId, user.adminRole)) ??
      adminService.resolveAdminRole(user);
    const organizerApplication = await organizerService.buildApplicationBrief(user.id);

    return {
      id: user.id,
      nickName: user.nickName,
      avatarUrl: user.avatarUrl,
      isOrganizer: user.isOrganizerCertified,
      isAdmin: !!adminRole,
      adminRole: adminRole ?? undefined,
      organizerApplication,
      createdAt: user.createdAt.toISOString(),
    };
  }
}

export const authService = new AuthService();
