import { Router } from '../lib/http/index.js';
import { getRedis } from '../lib/redis.js';
import { success } from '../shared/response.js';
import authRoutes from './auth.routes.js';
import communityRoutes from './community.routes.js';
import geoRoutes from './geo.routes.js';
import mediaRoutes from './media.routes.js';
import recordRoutes from './record.routes.js';
import trackRoutes from './track.routes.js';
import organizerRoutes from './organizer.routes.js';
import adminRoutes from './admin.routes.js';
import * as configController from '../modules/config/config.controller.js';

const router = new Router().prefixPath('/api/v1');

router.get('/health', (ctx) => {
  ctx.body = success({
    status: 'ok',
    redis: getRedis().isAvailable(),
    timestamp: new Date().toISOString(),
  });
});

router.get('/config/client', configController.getClientConfig);

router.use(authRoutes);
router.use(geoRoutes);
router.use(trackRoutes);
router.use(recordRoutes);
router.use(communityRoutes);
router.use(mediaRoutes);
router.use(organizerRoutes);
router.use(adminRoutes);

export default router;
