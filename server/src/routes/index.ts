import Router from '@koa/router';

import { getRedis } from '../lib/redis.js';
import authRoutes from './auth.routes.js';
import communityRoutes from './community.routes.js';
import mediaRoutes from './media.routes.js';
import recordRoutes from './record.routes.js';
import trackRoutes from './track.routes.js';
import { success } from '../shared/response.js';

const router = new Router({ prefix: '/api/v1' });

router.get('/health', (ctx) => {
  ctx.body = success({
    status: 'ok',
    redis: getRedis().isAvailable(),
    timestamp: new Date().toISOString(),
  });
});

router.use(authRoutes.routes(), authRoutes.allowedMethods());
router.use(trackRoutes.routes(), trackRoutes.allowedMethods());
router.use(recordRoutes.routes(), recordRoutes.allowedMethods());
router.use(communityRoutes.routes(), communityRoutes.allowedMethods());
router.use(mediaRoutes.routes(), mediaRoutes.allowedMethods());

export default router;
