import { config } from '../../config/index.js';
import { ForbiddenError, NotFoundError } from '../../shared/errors.js';
import { buildPaginationResult, getSkip } from '../../shared/pagination.js';
import type { AdminRole } from '../../shared/types.js';
import { userRepository } from '../auth/user.repository.js';
import { userService } from '../auth/user.service.js';
import { postRepository } from '../community/post.repository.js';
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

  async listPosts(
    page: number,
    pageSize: number,
    keyword?: string,
    authorId?: string,
  ) {
    const skip = (page - 1) * pageSize;
    const { rows, total } = await postRepository.listForAdmin({
      keyword: keyword?.trim() || undefined,
      authorId,
      skip,
      take: pageSize,
    });

    const authorIds = [...new Set(rows.map((post) => post.authorId))];
    const profiles = await userService.getPublicProfiles(authorIds);

    const list = rows.map((post) => {
      const author = profiles.get(post.authorId) ?? {
        id: post.authorId,
        nickName: '',
        avatarUrl: '',
      };
      return {
        id: post.id,
        title: post.title,
        boardName: post.board.name,
        author,
        likeCount: post.likeCount,
        commentCount: post.commentCount,
        deleted: post.deleted,
        deletedAt: post.deletedAt?.toISOString() ?? null,
        createdAt: post.createdAt.toISOString(),
        coverImage: post.images[0]?.imageUrl ?? null,
      };
    });

    return buildPaginationResult(list, total, { page, pageSize });
  }

  async getPostDetail(postId: string) {
    const post = await postRepository.findByIdIncludingDeleted(postId);
    if (!post) {
      throw new NotFoundError('帖子不存在');
    }

    const profiles = await userService.getPublicProfiles([post.authorId]);
    const author = profiles.get(post.authorId) ?? {
      id: post.authorId,
      nickName: '',
      avatarUrl: '',
    };

    return {
      id: post.id,
      boardId: post.boardId,
      boardName: post.board.name,
      title: post.title,
      content: post.content,
      imageUrls: post.images.map((image) => image.imageUrl),
      track: post.track ? { id: post.track.id, name: post.track.name } : undefined,
      author,
      likeCount: post.likeCount,
      commentCount: post.commentCount,
      deleted: post.deleted,
      deletedAt: post.deletedAt?.toISOString() ?? null,
      createdAt: post.createdAt.toISOString(),
    };
  }

  async deletePost(postId: string) {
    const post = await postRepository.findByIdIncludingDeleted(postId);
    if (!post) {
      throw new NotFoundError('帖子不存在');
    }
    if (post.deleted) {
      throw new ForbiddenError('帖子已删除');
    }
    await postRepository.softDelete(postId);
    return { success: true };
  }

  async restorePost(postId: string) {
    const post = await postRepository.findByIdIncludingDeleted(postId);
    if (!post) {
      throw new NotFoundError('帖子不存在');
    }
    if (!post.deleted) {
      throw new ForbiddenError('帖子未删除');
    }
    await postRepository.restore(postId);
    return { success: true };
  }

  async getUserDetail(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('用户不存在');
    }
    const isSystemAdmin = this.isConfiguredAdmin(user.openId);
    return {
      id: user.id,
      nickName: user.nickName,
      avatarUrl: user.avatarUrl,
      bio: user.bio,
      isOrganizer: user.isOrganizerCertified,
      adminRole: user.adminRole ?? (isSystemAdmin ? 'admin' : undefined),
      isSystemAdmin,
      createdAt: user.createdAt.toISOString(),
    };
  }
}

export const adminService = new AdminService();
