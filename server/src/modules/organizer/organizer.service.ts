import { ValidationError } from '../../shared/errors.js';
import type {
  OrganizerApplicationBrief,
  OrganizerApplicationStatus,
  UserProfile,
} from '../../shared/types.js';
import { wechatClient } from '../auth/wechat.client.js';
import { userRepository } from '../auth/user.repository.js';
import {
  applicationNotFoundError,
  pendingApplicationError,
  realNameVerifyFailedError,
} from './errors.js';
import { organizerRepository } from './organizer.repository.js';

const ID_CARD_PATTERN = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[\dXx]$/;
const PHONE_PATTERN = /^1\d{10}$/;

function maskIdCard(idCard: string): string {
  if (idCard.length < 8) return '****';
  return `${idCard.slice(0, 4)}**********${idCard.slice(-4)}`;
}

function toBrief(row: {
  id: string;
  status: OrganizerApplicationStatus;
  realName: string;
  phone: string;
  wechat: string | null;
  reviewNote: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
}): OrganizerApplicationBrief {
  return {
    id: row.id,
    status: row.status,
    realName: row.realName,
    phone: row.phone,
    wechat: row.wechat ?? undefined,
    reviewNote: row.reviewNote ?? undefined,
    createdAt: row.createdAt.toISOString(),
    reviewedAt: row.reviewedAt?.toISOString(),
  };
}

export class OrganizerService {
  async getMyApplication(userId: string): Promise<OrganizerApplicationBrief | null> {
    const row = await organizerRepository.findLatestByUserId(userId);
    return row ? toBrief(row) : null;
  }

  async verifyRealName(params: {
    userId: string;
    openId: string;
    realName: string;
    idCardNumber: string;
    code: string;
  }): Promise<{ verified: true }> {
    const realName = params.realName.trim();
    const idCardNumber = params.idCardNumber.trim().toUpperCase();
    const code = params.code.trim();

    if (realName.length < 2 || realName.length > 64) {
      throw new ValidationError('姓名格式不正确');
    }
    if (!ID_CARD_PATTERN.test(idCardNumber)) {
      throw new ValidationError('身份证号格式不正确');
    }
    if (!code) {
      throw new ValidationError('缺少实名校验授权码');
    }

    try {
      await wechatClient.checkRealNameInfo({
        openId: params.openId,
        realName,
        credId: idCardNumber,
        code,
      });
    } catch (err) {
      if (err instanceof ValidationError) {
        throw realNameVerifyFailedError(err.message);
      }
      throw err;
    }

    return { verified: true };
  }

  async submitApplication(params: {
    userId: string;
    openId: string;
    realName: string;
    idCardNumber: string;
    phone: string;
    wechat?: string;
    code: string;
  }) {
    const user = await userRepository.findById(params.userId);
    if (!user) {
      throw new ValidationError('用户不存在');
    }
    if (user.isOrganizerCertified) {
      throw new ValidationError('您已是认证主理人');
    }

    const pending = await organizerRepository.hasPendingApplication(params.userId);
    if (pending) {
      throw pendingApplicationError();
    }

    const realName = params.realName.trim();
    const idCardNumber = params.idCardNumber.trim().toUpperCase();
    const phone = params.phone.trim();
    const wechat = params.wechat?.trim();

    if (!PHONE_PATTERN.test(phone)) {
      throw new ValidationError('请填写有效的手机号');
    }
    if (wechat && wechat.length > 64) {
      throw new ValidationError('微信号过长');
    }

    await this.verifyRealName({
      userId: params.userId,
      openId: params.openId,
      realName,
      idCardNumber,
      code: params.code,
    });

    const row = await organizerRepository.create({
      userId: params.userId,
      realName,
      idCardNumber,
      phone,
      wechat,
      realNameVerifiedAt: new Date(),
    });

    return toBrief(row);
  }

  async listApplications(status: OrganizerApplicationStatus, page: number, pageSize: number) {
    const skip = (page - 1) * pageSize;
    const { rows, total } = await organizerRepository.listByStatus(status, skip, pageSize);
    return {
      list: rows.map((row) => ({
        id: row.id,
        userId: row.userId,
        applicantNickName: row.applicantNickName ?? '',
        realName: row.realName,
        idCardMasked: maskIdCard(row.idCardNumber),
        phone: row.phone,
        wechat: row.wechat ?? undefined,
        status: row.status,
        realNameVerifiedAt: row.realNameVerifiedAt?.toISOString(),
        reviewNote: row.reviewNote ?? undefined,
        createdAt: row.createdAt.toISOString(),
      })),
      total,
      page,
      pageSize,
      hasMore: skip + rows.length < total,
    };
  }

  async approveApplication(applicationId: string, reviewerId: string, reviewNote?: string) {
    const application = await organizerRepository.findById(applicationId);
    if (!application) {
      throw applicationNotFoundError();
    }
    if (application.status !== 'pending') {
      throw new ValidationError('该申请已处理');
    }

    await organizerRepository.updateStatus(applicationId, 'approved', reviewerId, reviewNote);
    await userRepository.update(application.userId, { isOrganizerCertified: true });

    return { success: true };
  }

  async rejectApplication(applicationId: string, reviewerId: string, reviewNote?: string) {
    const application = await organizerRepository.findById(applicationId);
    if (!application) {
      throw applicationNotFoundError();
    }
    if (application.status !== 'pending') {
      throw new ValidationError('该申请已处理');
    }

    await organizerRepository.updateStatus(applicationId, 'rejected', reviewerId, reviewNote);
    return { success: true };
  }

  async buildApplicationBrief(userId: string): Promise<OrganizerApplicationBrief | undefined> {
    const application = await this.getMyApplication(userId);
    return application ?? undefined;
  }
}

export const organizerService = new OrganizerService();

export function buildOrganizerProfileFields(user: {
  id: string;
  isOrganizerCertified: boolean;
}): Pick<UserProfile, 'isOrganizer'> {
  return {
    isOrganizer: user.isOrganizerCertified,
  };
}
