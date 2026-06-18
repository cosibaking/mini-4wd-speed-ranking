import { AppError, ErrorCode, type ErrorCodeValue } from '../../shared/errors';

function recordError(code: number, message: string, status = 400): AppError {
  return new AppError(code as ErrorCodeValue, message, status);
}

export function trackNotFoundForRecordError(): AppError {
  return recordError(40402, '赛道不存在', 404);
}

export function recordNotFoundError(): AppError {
  return recordError(40403, '成绩不存在', 404);
}

export function invalidLapTimeError(): AppError {
  return recordError(40002, '圈速格式不正确，示例：0:32.58');
}

export function maxCarPhotosError(): AppError {
  return recordError(40003, '最多上传 3 张车辆照片');
}

export function forbiddenViewRecordsError(): AppError {
  return recordError(40302, '无权查看该赛道全部成绩', 403);
}

export function validationError(message: string): AppError {
  return new AppError(ErrorCode.VALIDATION, message, 400);
}
