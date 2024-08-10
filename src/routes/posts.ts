import { Router } from 'express';
import { PostController } from '../controllers/postController';
import { isLoggedin } from '../middlewares/auth';

const router = Router();
// 게시글 생성
router.post('/', isLoggedin, PostController.createPost);

// 게시글 목록 조회
router.get('/', isLoggedin, PostController.getAllPosts);

// 스포츠 게시글 목록 조회
router.get('/sports', isLoggedin, PostController.getSportsCategories);

// 게시글 상세 조회
router.get('/:id', isLoggedin, PostController.getPostById);

// 게시글 수정
router.put('/:id', isLoggedin, PostController.updatePost);

// 게시글 삭제
router.delete('/:id', isLoggedin, PostController.deletePost);

export default router;
