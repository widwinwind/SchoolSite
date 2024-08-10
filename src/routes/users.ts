import { Router } from 'express';
import { UserController } from '../controllers/userController';
import { isLoggedin } from '../middlewares/auth';

const router = Router();

// 불변적인 경로가 위에 있어야한다
router.post('/update-role', isLoggedin, UserController.updateRole); // 사용자 권한 변경
router.post('/logout', isLoggedin, UserController.logout); // 로그아웃
router.get('/my-posts', isLoggedin, UserController.getMyPosts); // 내가 쓴 게시글 조회
router.get('/my-comments', isLoggedin, UserController.getMyComments); // 내가 쓴 댓글 조회
router.post('/refresh', UserController.reissueAccessToken);

// 가변적인 경로는 불변적인 경로 아래에 둔다.
router.get('/:id', UserController.getUserById); // 유저 정보 조회
router.put('/:id', isLoggedin, UserController.updateUser); // 회원정보 수정
router.delete('/:id', isLoggedin, UserController.deleteUser); // 회원 탈퇴

export default router;
