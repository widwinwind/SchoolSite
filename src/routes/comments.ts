import { Router } from 'express';
import { CommentController } from '../controllers/commentController';
import { isLoggedin } from '../middlewares/auth';

const router = Router();
// 댓글 생성
router.post('/posts/:postId/comments', isLoggedin, CommentController.createComment);

// 특정 게시글의 댓글 및 대댓글 조회
router.get('/posts/:postId/comments', isLoggedin, CommentController.getCommentsByPostId);

// 특정 게시글의 베스트 댓글 조회
router.get('/posts/:postId/comments/best-comment', isLoggedin, CommentController.getBestCommentByPostId);

// 댓글 수정
router.put('/comments/:id', isLoggedin, CommentController.updateComment);

// 댓글 삭제
router.delete('/comments/:id', isLoggedin, CommentController.deleteComment);

export default router;
