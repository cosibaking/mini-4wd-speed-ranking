import Router from '@koa/router';

import { authMiddleware } from '../middleware/auth';
import * as recordController from '../modules/record/record.controller';

const router = new Router();

router.post('/records', authMiddleware({ required: true }), recordController.submitRecord);
router.get('/records/mine', authMiddleware({ required: true }), recordController.listMyRecords);
router.get('/records/:id', authMiddleware(), recordController.getRecordById);
router.get('/leaderboards/:trackId', authMiddleware(), recordController.getLeaderboard);

export default router;
