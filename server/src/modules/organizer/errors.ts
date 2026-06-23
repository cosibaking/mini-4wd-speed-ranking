import { ConflictError, ForbiddenError, NotFoundError } from '../../shared/errors.js';

export function organizerNotCertifiedError() {
  return new ForbiddenError('您尚未通过主理人认证，请先提交申请并等待管理员线下核实');
}

export function pendingApplicationError() {
  return new ConflictError('您已有待审核的主理人申请');
}

export function applicationNotFoundError() {
  return new NotFoundError('申请不存在');
}

export function realNameVerifyFailedError(message = '实名信息校验未通过') {
  return new ForbiddenError(message);
}
