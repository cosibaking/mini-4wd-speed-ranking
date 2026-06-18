import type { IncomingHttpHeaders, IncomingMessage, ServerResponse } from 'node:http';

import type { AuthContext } from '../../shared/types.js';

export interface HttpContextState {
  requestId?: string;
  auth?: AuthContext | null;
}

export interface HttpContext {
  method: string;
  path: string;
  url: string;
  params: Record<string, string>;
  query: Record<string, string>;
  headers: IncomingHttpHeaders;
  request: {
    body: unknown;
  };
  rawRequest: IncomingMessage;
  state: HttpContextState;
  status: number;
  body: unknown;
  readonly res: ServerResponse;
}

export type HttpHandler = (ctx: HttpContext) => Promise<void> | void;

export type HttpMiddleware = (
  ctx: HttpContext,
  next: () => Promise<void>,
) => Promise<void> | void;
