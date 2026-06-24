import { UnauthorizedError, ValidationError } from '../../shared/errors.js';
import type { PublicUser, UserProfile } from '../../shared/types.js';
import { authService } from './auth.service.js';
import { userRepository } from './user.repository.js';

export class UserService {
  async getProfile(userId: string): Promise<UserProfile> {
    const user = await userRepository.findById(userId);

    if (!user) {
      throw new UnauthorizedError();
    }

    return authService.buildUserProfile(user);
  }

  async updateProfile(userId: string, dto: { nickName?: string; avatarUrl?: string; bio?: string }): Promise<UserProfile> {
    const data: { nickName?: string; avatarUrl?: string; bio?: string } = {};

    if (dto.nickName !== undefined) {
      const nickName = dto.nickName.trim();
      if (nickName.length < 1 || nickName.length > 32) {
        throw new ValidationError('昵称长度需在 1-32 字之间');
      }
      data.nickName = nickName;
    }

    if (dto.avatarUrl !== undefined) {
      const avatarUrl = dto.avatarUrl.trim();
      if (!avatarUrl.startsWith('https://')) {
        throw new ValidationError('头像地址必须是 HTTPS 链接');
      }
      data.avatarUrl = avatarUrl;
    }

    if (dto.bio !== undefined) {
      const bio = dto.bio.trim();
      if (bio.length > 200) {
        throw new ValidationError('个人简介不能超过 200 字');
      }
      data.bio = bio;
    }

    if (Object.keys(data).length === 0) {
      throw new ValidationError('请提供需要更新的字段');
    }

    const user = await userRepository.update(userId, data);

    return authService.buildUserProfile(user);
  }

  async getPublicProfiles(userIds: string[]): Promise<Map<string, PublicUser>> {
    const result = new Map<string, PublicUser>();

    if (userIds.length === 0) {
      return result;
    }

    const uniqueIds = [...new Set(userIds)];
    const users = await userRepository.findManyByIds(uniqueIds);

    for (const user of users) {
      result.set(user.id, {
        id: user.id,
        nickName: user.nickName,
        avatarUrl: user.avatarUrl,
        bio: user.bio || undefined,
      });
    }

    return result;
  }
}

export const userService = new UserService();
