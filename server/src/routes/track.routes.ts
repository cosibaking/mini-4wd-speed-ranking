import { Router } from '../lib/http/index.js';
import { authMiddleware } from '../middleware/auth.js';
import * as trackController from '../modules/track/track.controller.js';

const router = new Router();

router.get('/tracks', authMiddleware(), trackController.listTracks);
router.get('/tracks/recent', authMiddleware({ required: true }), trackController.getRecentTracks);
router.get('/tracks/mine', authMiddleware({ required: true }), trackController.listMyTracks);
router.get(
  '/tracks/:trackId/records',
  authMiddleware({ required: true }),
  trackController.listTrackRecords,
);
router.post(
  '/tracks/:trackId/visit',
  authMiddleware({ required: true }),
  trackController.touchRecentVisit,
);
router.get('/tracks/:id', authMiddleware(), trackController.getTrackById);
router.post('/tracks', authMiddleware({ required: true }), trackController.createTrack);
router.patch('/tracks/:id', authMiddleware({ required: true }), trackController.updateTrack);

export default router;
