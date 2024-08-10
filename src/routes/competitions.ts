import { Router } from 'express';
import { CompetitionController } from '../controllers/competitionController';
import { checkRole, isLoggedin } from '../middlewares/auth';
import { RoleType } from '../entities/enums/RoleType';

const router = Router();

// 대회 정보 생성
router.post('/', isLoggedin, checkRole(RoleType.ADMIN, RoleType.TEACHER), CompetitionController.createCompetition);

// 대회 정보 목록 조회
router.get('/', isLoggedin, CompetitionController.getCompetitionsOnScoreBoard);

// 대회 종목별 상위 3개 조회
router.get('/:categoryId', isLoggedin, CompetitionController.getTopThreeCompetition);

// 대회 정보 수정
router.put('/:id', isLoggedin, checkRole(RoleType.ADMIN, RoleType.TEACHER), CompetitionController.updateCompetition);

// 대회 정보 삭제
router.delete('/:id', isLoggedin, checkRole(RoleType.ADMIN, RoleType.TEACHER), CompetitionController.deleteCompetition);

export default router;
