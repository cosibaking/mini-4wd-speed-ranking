import { Router } from '../lib/http/index.js';
import { authMiddleware } from '../middleware/auth.js';
import * as boardController from '../modules/community/board.controller.js';
import * as postController from '../modules/community/post.controller.js';
import * as socialController from '../modules/community/social.controller.js';

const router = new Router();

router.get('/boards', boardController.listBoards);

router.get('/posts/following', authMiddleware({ required: true }), postController.listFollowingPosts);
router.get('/posts', authMiddleware(), postController.listPosts);
// 「接口一律 POST」：创建与列表同路径会冲突，改用带动作后缀的独立路径。
router.post('/posts/create', authMiddleware({ required: true }), postController.createPost);
router.get('/posts/:id', authMiddleware(), postController.getPost);
router.get('/posts/:id/comments', authMiddleware(), postController.listComments);
router.post('/posts/:id/comments/create', authMiddleware({ required: true }), postController.createComment);

router.post('/social/like', authMiddleware({ required: true }), socialController.toggleLike);
router.post('/social/follow', authMiddleware({ required: true }), socialController.toggleFollow);
router.get('/social/following', authMiddleware({ required: true }), socialController.listFollowing);

export default router;
