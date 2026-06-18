import type { IncomingMessage, ServerResponse } from 'node:http';
import { URL } from 'node:url';

import type { HttpContext, HttpHandler, HttpMiddleware } from './types.js';

interface RouteRecord {
  method: string;
  pattern: string;
  handler: HttpHandler;
  middlewares: HttpMiddleware[];
}

function parseQuery(search: string): Record<string, string> {
  const query: Record<string, string> = {};
  const params = new URLSearchParams(search);
  for (const [key, value] of params.entries()) {
    query[key] = value;
  }
  return query;
}

function matchPath(pattern: string, path: string): Record<string, string> | null {
  const patternParts = pattern.split('/').filter(Boolean);
  const pathParts = path.split('/').filter(Boolean);

  if (patternParts.length !== pathParts.length) {
    return null;
  }

  const params: Record<string, string> = {};
  for (let i = 0; i < patternParts.length; i += 1) {
    const patternPart = patternParts[i];
    const pathPart = pathParts[i];

    if (patternPart.startsWith(':')) {
      params[patternPart.slice(1)] = decodeURIComponent(pathPart);
      continue;
    }

    if (patternPart !== pathPart) {
      return null;
    }
  }

  return params;
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const method = req.method?.toUpperCase() ?? 'GET';
  if (method === 'GET' || method === 'HEAD' || method === 'DELETE') {
    return undefined;
  }

  const contentType = req.headers['content-type'] ?? '';
  if (!contentType.includes('application/json')) {
    return undefined;
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }

  const raw = Buffer.concat(chunks).toString('utf8').trim();
  if (!raw) {
    return undefined;
  }

  return JSON.parse(raw) as unknown;
}

function compose(middlewares: HttpMiddleware[], handler: HttpHandler): HttpHandler {
  return async (ctx) => {
    let index = -1;

    const dispatch = async (i: number): Promise<void> => {
      if (i <= index) {
        throw new Error('next() called multiple times');
      }
      index = i;

      const middleware = middlewares[i];
      if (middleware) {
        await middleware(ctx, () => dispatch(i + 1));
        return;
      }

      await handler(ctx);
    };

    await dispatch(0);
  };
}

export class Router {
  private readonly routes: RouteRecord[] = [];
  private readonly middlewares: HttpMiddleware[] = [];
  private prefix = '';

  use(...args: [...HttpMiddleware[], Router] | HttpMiddleware[]): this {
    const last = args[args.length - 1];
    if (last instanceof Router) {
      const middlewares = args.slice(0, -1) as HttpMiddleware[];
      const child = last;
      child.prefix = `${this.prefix}${child.prefix}`;

      for (const route of child.routes) {
        this.routes.push({
          ...route,
          pattern: `${child.prefix}${route.pattern}`,
          middlewares: [...middlewares, ...route.middlewares],
        });
      }
      return this;
    }

    this.middlewares.push(...(args as HttpMiddleware[]));
    return this;
  }

  private register(
    method: string,
    pattern: string,
    ...handlers: [...HttpMiddleware[], HttpHandler]
  ): this {
    const handler = handlers[handlers.length - 1] as HttpHandler;
    const routeMiddlewares = handlers.slice(0, -1) as HttpMiddleware[];

    this.routes.push({
      method: method.toUpperCase(),
      pattern: `${this.prefix}${pattern}`,
      handler,
      middlewares: [...this.middlewares, ...routeMiddlewares],
    });
    return this;
  }

  get(pattern: string, ...handlers: [...HttpMiddleware[], HttpHandler]): this {
    return this.register('GET', pattern, ...handlers);
  }

  post(pattern: string, ...handlers: [...HttpMiddleware[], HttpHandler]): this {
    return this.register('POST', pattern, ...handlers);
  }

  patch(pattern: string, ...handlers: [...HttpMiddleware[], HttpHandler]): this {
    return this.register('PATCH', pattern, ...handlers);
  }

  delete(pattern: string, ...handlers: [...HttpMiddleware[], HttpHandler]): this {
    return this.register('DELETE', pattern, ...handlers);
  }

  prefixPath(prefix: string): this {
    this.prefix = prefix;
    return this;
  }

  handler(): HttpHandler {
    return async (ctx) => {
      for (const route of this.routes) {
        if (route.method !== ctx.method) {
          continue;
        }

        const params = matchPath(route.pattern, ctx.path);
        if (!params) {
          continue;
        }

        ctx.params = params;
        const wrapped = compose(route.middlewares, route.handler);
        await wrapped(ctx);
        return;
      }

      ctx.status = 404;
      ctx.body = { code: 40404, message: 'Not Found', data: null };
    };
  }
}

export async function createContext(
  req: IncomingMessage,
  res: ServerResponse,
): Promise<HttpContext> {
  const url = new URL(req.url ?? '/', 'http://localhost');
  const body = await readJsonBody(req);

  return {
    method: (req.method ?? 'GET').toUpperCase(),
    path: url.pathname,
    url: req.url ?? '/',
    params: {},
    query: parseQuery(url.search),
    headers: req.headers,
    request: { body },
    rawRequest: req,
    state: {},
    status: 200,
    body: null,
    res,
  };
}

export function sendResponse(ctx: HttpContext): void {
  const payload = ctx.body ?? null;
  const body = JSON.stringify(payload);
  ctx.res.statusCode = ctx.status;
  ctx.res.setHeader('Content-Type', 'application/json; charset=utf-8');
  ctx.res.setHeader('Content-Length', Buffer.byteLength(body));
  ctx.res.end(body);
}
