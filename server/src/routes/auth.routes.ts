import { Router } from '../lib/http/index.js';
import { authMiddleware } from '../middleware/auth.js';
import * as authController from '../modules/auth/auth.controller.js';

const router = new Router();

router.post('/auth/login', authController.login);
router.post('/auth/refresh', authMiddleware({ required: true }), authController.refresh);
router.post('/auth/phone', authMiddleware({ required: true }), authController.getPhoneNumber);
router.get('/users/me', authMiddleware({ required: true }), authController.getMe);
router.get('/users/:id', authMiddleware(), authController.getUser);
// 「接口一律 POST」：与 GET /users/me 同路径会冲突，更新改用 /users/me/update。
router.post('/users/me/update', authMiddleware({ required: true }), authController.patchMe);

export default router;
