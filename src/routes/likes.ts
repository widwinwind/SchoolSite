import { Router } from 'express';
import LikeController from '../controllers/likeController';
import { isLoggedin } from '../middlewares/auth';

const router = Router();

// 좋아요
router.post('/', isLoggedin, LikeController.addLike);

// 좋아요 해제
router.delete('/:id', isLoggedin, LikeController.removeLike);

export default router;
