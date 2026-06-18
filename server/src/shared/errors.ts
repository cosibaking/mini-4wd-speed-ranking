export const ErrorCode = {
  OK: 0,
  VALIDATION: 40001,
  UNAUTHORIZED: 40100,
  FORBIDDEN: 40300,
  NOT_FOUND: 40400,
  CONFLICT: 40900,
  RATE_LIMIT: 42900,
  INTERNAL: 50000,
} as const;

/** @deprecated 兼容其他模块引用，请优先使用 ErrorCode */
export const ErrorCodes = ErrorCode;

export type ErrorCodeValue = (typeof ErrorCode)[keyof typeof ErrorCode];

export class AppError extends Error {
  readonly code: ErrorCodeValue;
  readonly status: number;

  constructor(code: ErrorCodeValue, message: string, status = 400) {
    super(message);
    this.name = 'AppError';
    this.code = code;
    this.status = status;
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(ErrorCode.VALIDATION, message, 400);
    this.name = 'ValidationError';
  }
}

export class UnauthorizedError extends AppError {
  constructor(message = '未登录或 token 失效') {
    super(ErrorCode.UNAUTHORIZED, message, 401);
    this.name = 'UnauthorizedError';
  }
}

export class ForbiddenError extends AppError {
  constructor(message = '无权限') {
    super(ErrorCode.FORBIDDEN, message, 403);
    this.name = 'ForbiddenError';
  }
}

export class NotFoundError extends AppError {
  constructor(message = '资源不存在') {
    super(ErrorCode.NOT_FOUND, message, 404);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ErrorCode.CONFLICT, message, 409);
    this.name = 'ConflictError';
  }
}

export class InternalError extends AppError {
  constructor(message = '服务器错误') {
    super(ErrorCode.INTERNAL, message, 500);
    this.name = 'InternalError';
  }
}
