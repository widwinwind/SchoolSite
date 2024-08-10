import { Router } from 'express';
import BoardController from '../controllers/boardController';

const router = Router();

router.get('/:id', BoardController.getBoardById); // 게시판 이름 알아내기

export default router;
