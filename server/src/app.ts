import cors from '@koa/cors';
import Koa from 'koa';
import bodyParser from 'koa-bodyparser';

import { errorHandler } from './middleware/errorHandler.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import routes from './routes/index.js';

export function createApp(): Koa {
  const app = new Koa();

  app.use(errorHandler());
  app.use(requestIdMiddleware());
  app.use(cors());
  app.use(
    bodyParser({
      enableTypes: ['json'],
      jsonLimit: '1mb',
    }),
  );

  app.use(routes.routes());
  app.use(routes.allowedMethods());

  return app;
}
