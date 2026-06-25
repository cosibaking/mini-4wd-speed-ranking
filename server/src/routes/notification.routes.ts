import { Router } from '../lib/http/index.js';
import { authMiddleware } from '../middleware/auth.js';
import * as notificationController from '../modules/notification/notification.controller.js';

const router = new Router();

router.get('/notifications/unread-count', authMiddleware({ required: true }), notificationController.getUnreadCount);
router.post('/notifications/read-all', authMiddleware({ required: true }), notificationController.markAllNotificationsRead);
router.get('/notifications', authMiddleware({ required: true }), notificationController.listNotifications);
router.post('/notifications/:id/read', authMiddleware({ required: true }), notificationController.markNotificationRead);

export default router;
