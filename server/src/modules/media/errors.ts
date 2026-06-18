import { AppError, type ErrorCodeValue } from '../../shared/errors.js';

function mediaError(code: number, message: string, status = 400): AppError {
  return new AppError(code as ErrorCodeValue, message, status);
}

export function unsupportedMediaTypeError(): AppError {
  return mediaError(40006, '\u4e0d\u652f\u6301\u7684\u6587\u4ef6\u7c7b\u578b');
}

export function fileSizeExceededError(): AppError {
  return mediaError(40007, '\u6587\u4ef6\u5927\u5c0f\u8d85\u51fa\u9650\u5236');
}

export function uploadRecordNotFoundError(): AppError {
  return mediaError(40406, '\u4e0a\u4f20\u8bb0\u5f55\u4e0d\u5b58\u5728', 404);
}

export function cloudFileNotFoundError(): AppError {
  return mediaError(40407, '\u4e91\u7aef\u6587\u4ef6\u4e0d\u5b58\u5728\uff0c\u8bf7\u91cd\u65b0\u4e0a\u4f20', 404);
}

export function uploadRateLimitError(): AppError {
  return mediaError(42902, '\u4e0a\u4f20\u8fc7\u4e8e\u9891\u7e41', 429);
}
