import { createServer, type IncomingMessage, type ServerResponse } from 'node:http';
import { URL } from 'node:url';

import { handleMockMedia } from '../../modules/media/mock.handler.js';
import { ensureStorageRoot } from '../../modules/media/mock.store.js';
import { corsMiddleware } from './cors.js';
import { createContext, Router, sendResponse } from './router.js';
import type { HttpHandler, HttpMiddleware } from './types.js';

export function createHttpServer(
  router: Router,
  middlewares: HttpMiddleware[] = [],
): ReturnType<typeof createServer> {
  const rootHandler = composeMiddlewares([...middlewares, corsMiddleware, router.handler()]);

  void ensureStorageRoot().catch((error) => {
    console.error('[mock-media] failed to init storage', error);
  });

  return createServer(async (req: IncomingMessage, res: ServerResponse) => {
    const url = new URL(req.url ?? '/', 'http://127.0.0.1');
    if (url.pathname.startsWith('/mock-media')) {
      await handleMockMedia(req, res, url.pathname);
      return;
    }

    const ctx = await createContext(req, res);

    try {
      await rootHandler(ctx);
    } catch (error) {
      console.error('[http] unhandled error', error);
      ctx.status = 500;
      ctx.body = { code: 50000, message: '服务器错误', data: null };
    }

    if (!res.writableEnded) {
      sendResponse(ctx);
    }
  });
}

function composeMiddlewares(middlewares: HttpMiddleware[]): HttpHandler {
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
    };

    await dispatch(0);
  };
}
