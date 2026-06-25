import { NotFoundError } from '../../shared/errors.js';

export function notificationNotFoundError(): NotFoundError {
  return new NotFoundError('消息不存在');
}
