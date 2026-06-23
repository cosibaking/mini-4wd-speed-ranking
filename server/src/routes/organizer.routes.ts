import { Router } from '../lib/http/index.js';
import { authMiddleware } from '../middleware/auth.js';
import * as organizerController from '../modules/organizer/organizer.controller.js';

const router = new Router();

router.get(
  '/organizer/application',
  authMiddleware({ required: true }),
  organizerController.getMyApplication,
);
router.post(
  '/organizer/verify-realname',
  authMiddleware({ required: true }),
  organizerController.verifyRealName,
);
router.post(
  '/organizer/apply',
  authMiddleware({ required: true }),
  organizerController.submitApplication,
);

export default router;
