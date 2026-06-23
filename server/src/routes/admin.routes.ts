import { Router } from '../lib/http/index.js';
import { authMiddleware } from '../middleware/auth.js';
import * as adminController from '../modules/admin/admin.controller.js';

const router = new Router();

router.get('/admin/me', authMiddleware({ required: true }), adminController.getAdminMe);
router.get('/admin/dashboard', authMiddleware({ required: true }), adminController.getDashboard);
router.get(
  '/admin/organizer-applications',
  authMiddleware({ required: true }),
  adminController.listApplications,
);
router.post(
  '/admin/organizer-applications/:id/approve',
  authMiddleware({ required: true }),
  adminController.approveApplication,
);
router.post(
  '/admin/organizer-applications/:id/reject',
  authMiddleware({ required: true }),
  adminController.rejectApplication,
);
router.get('/admin/users', authMiddleware({ required: true }), adminController.listUsers);
router.get('/admin/tracks', authMiddleware({ required: true }), adminController.listTracks);
router.post(
  '/admin/users/:userId/grant-organizer',
  authMiddleware({ required: true }),
  adminController.grantOrganizer,
);
router.post(
  '/admin/users/:userId/revoke-organizer',
  authMiddleware({ required: true }),
  adminController.revokeOrganizer,
);
router.post(
  '/admin/users/:userId/grant-admin',
  authMiddleware({ required: true }),
  adminController.grantAdmin,
);
router.post(
  '/admin/users/:userId/revoke-admin',
  authMiddleware({ required: true }),
  adminController.revokeAdmin,
);

export default router;
