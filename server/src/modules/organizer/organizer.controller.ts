import type { HttpContext } from '../../lib/http/index.js';

import { UnauthorizedError } from '../../shared/errors.js';
import { success } from '../../shared/response.js';
import { userRepository } from '../auth/user.repository.js';
import { organizerService } from './organizer.service.js';

function getAuth(ctx: HttpContext) {
  if (!ctx.state.auth) {
    throw new UnauthorizedError();
  }
  return ctx.state.auth;
}

export async function getMyApplication(ctx: HttpContext): Promise<void> {
  const auth = getAuth(ctx);
  const application = await organizerService.getMyApplication(auth.userId);
  ctx.body = success(application);
}

export async function verifyRealName(ctx: HttpContext): Promise<void> {
  const auth = getAuth(ctx);
  const body = ctx.request.body as {
    realName?: string;
    idCardNumber?: string;
    code?: string;
  };

  const result = await organizerService.verifyRealName({
    userId: auth.userId,
    openId: auth.openId,
    realName: body?.realName ?? '',
    idCardNumber: body?.idCardNumber ?? '',
    code: body?.code ?? '',
  });

  ctx.body = success(result);
}

export async function submitApplication(ctx: HttpContext): Promise<void> {
  const auth = getAuth(ctx);
  const body = ctx.request.body as {
    realName?: string;
    idCardNumber?: string;
    phone?: string;
    wechat?: string;
    code?: string;
  };

  const application = await organizerService.submitApplication({
    userId: auth.userId,
    openId: auth.openId,
    realName: body?.realName ?? '',
    idCardNumber: body?.idCardNumber ?? '',
    phone: body?.phone ?? '',
    wechat: body?.wechat,
    code: body?.code ?? '',
  });

  ctx.body = success(application);
}
