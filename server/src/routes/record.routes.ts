import { Router } from '../lib/http/index.js';
import { authMiddleware } from '../middleware/auth.js';
import * as recordController from '../modules/record/record.controller.js';

const router = new Router();

router.post('/records', authMiddleware({ required: true }), recordController.submitRecord);
router.get('/records/mine', authMiddleware({ required: true }), recordController.listMyRecords);
router.get('/records/:id', authMiddleware(), recordController.getRecordById);
router.post('/records/:id/approve', authMiddleware({ required: true }), recordController.approveRecord);
router.post('/records/:id/reject', authMiddleware({ required: true }), recordController.rejectRecord);
router.get('/leaderboards/:trackId', authMiddleware(), recordController.getLeaderboard);

export default router;
