import { AppError, ErrorCode, type ErrorCodeValue } from '../../shared/errors';

function trackError(code: number, message: string, status = 400): AppError {
  return new AppError(code as ErrorCodeValue, message, status);
}

export function trackNotFoundError(): AppError {
  return trackError(40401, '赛道不存在', 404);
}

export function duplicateTrackNameError(): AppError {
  return trackError(40901, '您已创建同名赛道', 409);
}

export function forbiddenEditTrackError(): AppError {
  return trackError(40301, '无权编辑该赛道', 403);
}

export function validationError(message: string): AppError {
  return new AppError(ErrorCode.VALIDATION, message, 400);
}
