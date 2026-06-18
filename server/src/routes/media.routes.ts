import { Router } from '../lib/http/index.js';
import { authMiddleware } from '../middleware/auth.js';
import * as mediaController from '../modules/media/media.controller.js';

const router = new Router();

router.post(
  '/media/upload-credential',
  authMiddleware({ required: true }),
  mediaController.uploadCredential,
);
router.post('/media/confirm', authMiddleware({ required: true }), mediaController.confirmUpload);
router.post('/media/mock-upload', authMiddleware({ required: true }), mediaController.mockUpload);

export default router;
