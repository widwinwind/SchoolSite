import { Router } from 'express';
import CategoryController from '../controllers/categoryController';

const router = Router();

router.get('/:id', CategoryController.getCategoryById); // 게시판 이름 알아내기

export default router;
