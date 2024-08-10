import { Router } from 'express';
import { AuthController } from '../controllers/authController';

const router = Router();

router.post('/register', AuthController.register); // 회원가입
router.post('/verify', AuthController.verifyEmail); // 이메일 인증 및 비밀번호 설정
router.post('/login', AuthController.login); // 로그인
router.post('/find-password', AuthController.findPassword); // 비밀번호 찾기
router.post('/reset-password', AuthController.resetPassword); // 비밀번호 재설정

export default router;
