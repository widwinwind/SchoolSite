import { Router } from 'express';
import { PointController } from '../controllers/pointController';
import { checkRole, isLoggedin } from '../middlewares/auth';
import { RoleType } from '../entities/enums/RoleType';

const router = Router();
// 점수들 생성
router.post('/', isLoggedin, checkRole(RoleType.ADMIN, RoleType.TEACHER), PointController.addPoints);

// 점수판 조회
router.get('/', isLoggedin, PointController.getAllPoints);

// 점수들 수정
router.put('/', isLoggedin, checkRole(RoleType.ADMIN, RoleType.TEACHER), PointController.updatePoints);

// 점수들 삭제
router.delete('/', isLoggedin, checkRole(RoleType.ADMIN, RoleType.TEACHER), PointController.deletePoints);

export default router;
