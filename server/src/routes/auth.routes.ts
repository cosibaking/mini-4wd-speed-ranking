import Router from '@koa/router';

import { authMiddleware } from '../middleware/auth.js';
import * as authController from '../modules/auth/auth.controller.js';

const router = new Router();

router.post('/auth/login', authController.login);
router.post('/auth/refresh', authMiddleware({ required: true }), authController.refresh);
router.get('/users/me', authMiddleware({ required: true }), authController.getMe);
router.patch('/users/me', authMiddleware({ required: true }), authController.patchMe);

export default router;
