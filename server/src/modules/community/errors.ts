import { AppError, ErrorCode, type ErrorCodeValue } from '../../shared/errors.js';

function communityError(code: number, message: string, status = 400): AppError {
  return new AppError(code as ErrorCodeValue, message, status);
}

export function postNotFoundError(): AppError {
  return communityError(40404, '\u5e16\u5b50\u4e0d\u5b58\u5728', 404);
}

export function commentNotFoundError(): AppError {
  return communityError(40405, '\u8bc4\u8bba\u4e0d\u5b58\u5728', 404);
}

export function postContentLengthError(): AppError {
  return communityError(40004, '\u6807\u9898\u6216\u6b63\u6587\u957f\u5ea6\u4e0d\u7b26');
}

export function cannotFollowSelfError(): AppError {
  return communityError(40005, '\u4e0d\u80fd\u5173\u6ce8\u81ea\u5df1');
}

export function postRateLimitError(): AppError {
  return communityError(42901, '\u53d1\u5e16\u8fc7\u4e8e\u9891\u7e41', 429);
}

export function commentRateLimitError(): AppError {
  return communityError(42901, '\u8bc4\u8bba\u8fc7\u4e8e\u9891\u7e41', 429);
}

export function boardNotFoundError(): AppError {
  return new AppError(ErrorCode.NOT_FOUND, '\u677f\u5757\u4e0d\u5b58\u5728', 404);
}
