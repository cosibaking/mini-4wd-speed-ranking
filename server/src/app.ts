import type { Server } from 'node:http';

import { createHttpServer } from './lib/http/index.js';
import { errorHandler } from './middleware/errorHandler.js';
import { requestIdMiddleware } from './middleware/requestId.js';
import routes from './routes/index.js';

export function createApp(): Server {
  return createHttpServer(routes, [errorHandler(), requestIdMiddleware()]);
}
