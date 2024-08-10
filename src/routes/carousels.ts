import { Router } from 'express';
import { CarouselController } from '../controllers/carouselController';
import { checkRole, isLoggedin } from '../middlewares/auth';
import { RoleType } from '../entities/enums/RoleType';

const router = Router();

// carousel에 표시할 featured 게시글을 가져오기
router.get('/featured', isLoggedin, checkRole(RoleType.ADMIN, RoleType.TEACHER), CarouselController.getFeaturedPosts);

// carousel에 표시할 featured 게시글 설정하기
router.post('/feature', isLoggedin, checkRole(RoleType.ADMIN, RoleType.TEACHER), CarouselController.featurePost);

// carousel에 표시할 featured 게시글 설정하기
router.post('/unfeature', isLoggedin, checkRole(RoleType.ADMIN, RoleType.TEACHER), CarouselController.unfeaturePost);

export default router;
