import type { Context } from 'koa';

import { ErrorCode } from './errors.js';

export interface ApiResponse<T = unknown> {
  code: number;
  message: string;
  data: T;
}

export function success<T>(ctx: Context, data: T, message?: string): void;
export function success<T>(data: T, message?: string): ApiResponse<T>;
export function success<T>(
  ctxOrData: Context | T,
  dataOrMessage?: T | string,
  message = 'ok',
): ApiResponse<T> | void {
  if (isContext(ctxOrData)) {
    const data = dataOrMessage as T;
    ctxOrData.body = {
      code: ErrorCode.OK,
      message,
      data,
    };
    return;
  }

  const data = ctxOrData as T;
  const msg = typeof dataOrMessage === 'string' ? dataOrMessage : message;
  return {
    code: ErrorCode.OK,
    message: msg,
    data,
  };
}

function isContext(value: unknown): value is Context {
  return (
    typeof value === 'object' &&
    value !== null &&
    'state' in value &&
    'request' in value &&
    'response' in value
  );
}

export function fail(code: number, message: string): ApiResponse<null> {
  return {
    code,
    message,
    data: null,
  };
}
